import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { POPPINS_REGULAR_B64, POPPINS_BOLD_B64 } from './pdfFonts'
import type { IncomeReportData } from '../services/analyticsService'

export interface PdfUserData {
  fullName: string
  addressStreet: string
  addressCity: string
  addressPostal: string
}

/** Zakres ewidencji wybrany w PdfDownloadSheet */
export interface PdfRange {
  startDate: string
  endDate: string
  /** np. „III kwartał 2026”, „Wrzesień 2026”, „Rok 2026” */
  label: string
  /** fragment nazwy pliku, np. „2026-Q3” */
  fileSuffix: string
}

const zl = (n: number) => `${Number(n).toFixed(2).replace('.', ',')} zł`

function formatDatePL(dateStr: string): string {
  if (!dateStr) return '—'
  // API zwraca już sformatowane daty DD.MM.YYYY
  if (dateStr.includes('.')) return dateStr
  // Fallback dla YYYY-MM-DD lub ISO timestamp
  const datePart = dateStr.split('T')[0]
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return dateStr
  return `${d}.${m}.${y}`
}

function loadFont(doc: jsPDF): void {
  doc.addFileToVFS('Poppins-Regular.ttf', POPPINS_REGULAR_B64)
  doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal')
  doc.addFileToVFS('Poppins-Bold.ttf', POPPINS_BOLD_B64)
  doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold')
}

export function generateIncomePDF(
  data: IncomeReportData,
  userData: PdfUserData,
  range: PdfRange,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  loadFont(doc)
  const fontName = 'Poppins'

  doc.setFont(fontName, 'bold')
  doc.setFontSize(14)
  doc.text('EWIDENCJA SPRZEDAŻY', 105, 20, { align: 'center' })

  doc.setFont(fontName, 'normal')
  doc.setFontSize(9)
  doc.text('Działalność nierejestrowana — art. 5 ustawy Prawo przedsiębiorców', 105, 27, { align: 'center' })

  doc.setDrawColor(200, 200, 200)
  doc.line(20, 31, 190, 31)

  const row = (label: string, value: string, y: number) => {
    doc.setFontSize(10)
    doc.setFont(fontName, 'bold')
    doc.text(label, 20, y)
    doc.setFont(fontName, 'normal')
    doc.text(value, 65, y)
  }

  const fullName = userData.fullName?.trim() || '—'
  const addressParts = [userData.addressStreet, userData.addressPostal, userData.addressCity].filter(Boolean)
  const address = addressParts.length > 0 ? addressParts.join(', ') : '—'

  row('Imię i Nazwisko:', fullName, 40)
  row('Adres:', address, 47)
  row('PESEL:', '_______________  (uzupełnić ręcznie po wydruku)', 54)
  row('Okres:', range.label, 61)

  doc.line(20, 65, 190, 65)

  // Nowe API: jedna lista po dacie z wartością narastająco. Starsze API: sklej listy lokalnie.
  const rows = data.rows ?? [...data.transactions, ...data.manualEntries]
  const body = rows.map((r, i) => [
    String(r.lp ?? i + 1),
    formatDatePL(r.date),
    r.source === 'manual' ? `${r.description}*` : r.description,
    r.buyerName || '—',
    zl(r.amount),
    r.cumulative !== undefined ? zl(r.cumulative) : '—',
  ])

  autoTable(doc, {
    startY: 68,
    head: [['Lp.', 'Data sprzedaży', 'Opis', 'Nabywca', 'Wartość', 'Narastająco']],
    body,
    styles: { fontSize: 8.5, cellPadding: 2.6, font: fontName },
    headStyles: { fillColor: [99, 102, 241] as [number, number, number], fontStyle: 'bold', textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 62 },
      3: { cellWidth: 30 },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 249, 252] as [number, number, number] },
  })

  const finalY: number = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 120) + 8

  doc.setDrawColor(200, 200, 200)
  doc.line(20, finalY, 190, finalY)

  doc.setFont(fontName, 'bold')
  doc.setFontSize(10)
  doc.text(`Suma sprzedaży w okresie: ${zl(data.totalAmount)}`, 190, finalY + 8, { align: 'right' })

  // Wykorzystanie limitu w każdym okresie rozliczenia (od 2026: kwartał, 225% min. wynagrodzenia)
  doc.setFont(fontName, 'normal')
  doc.setFontSize(8.5)
  let y = finalY + 14
  for (const p of data.periods ?? []) {
    const rule = p.period === 'quarter' ? '225% min. wynagrodzenia / kwartał' : '75% min. wynagrodzenia / miesiąc'
    doc.text(`${p.label}: ${zl(p.income)} z ${zl(p.limit)} limitu (${rule}) — ${p.percent.toFixed(1).replace('.', ',')}%`, 190, y, { align: 'right' })
    y += 5
  }
  doc.text('Przychód wykazuje się w rocznym zeznaniu PIT-36 (skala podatkowa).', 190, y, { align: 'right' })

  if (rows.some(r => r.source === 'manual')) {
    doc.text('* sprzedaż spoza platformy MyLokalni.pl', 20, finalY + 8)
  }

  const footerY = y + 12
  doc.setFontSize(8)
  doc.setFont(fontName, 'normal')
  doc.setTextColor(150, 150, 150)
  const today = new Date().toLocaleDateString('pl-PL')
  doc.text(`Dokument wygenerowany przez aplikację MyLokalni.pl · ${today}`, 105, footerY, { align: 'center' })
  doc.text('Narzędzie pomocnicze — nie zastępuje profesjonalnego doradztwa podatkowego.', 105, footerY + 5, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  doc.text('Podpis: ___________', 190, footerY + 14, { align: 'right' })

  const filename = `ewidencja-sprzedazy-${range.fileSuffix}.pdf`

  doc.save(filename)
}
