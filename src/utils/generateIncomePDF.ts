import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { NOTO_SANS_B64 } from './notoSansB64'
import type { IncomeReportData } from '../services/analyticsService'

export interface PdfUserData {
  fullName: string
  addressStreet: string
  addressCity: string
  addressPostal: string
}

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

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
  doc.addFileToVFS('NotoSans-Regular.ttf', NOTO_SANS_B64)
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'bold')
}

export function generateIncomePDF(
  data: IncomeReportData,
  userData: PdfUserData,
  year: number,
  month: number | null,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  loadFont(doc)
  const fontName = 'NotoSans'

  doc.setFont(fontName, 'bold')
  doc.setFontSize(14)
  doc.text('EWIDENCJA PRZYCHODÓW', 105, 20, { align: 'center' })

  doc.setFont(fontName, 'normal')
  doc.setFontSize(9)
  doc.text('Działalność nierejestrowana (art. 20 ust. 1ba ustawy o PIT)', 105, 27, { align: 'center' })

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
  row('Okres:', month ? `${MONTH_NAMES[month - 1]} ${year}` : `Rok ${year}`, 61)

  doc.line(20, 65, 190, 65)

  const platformRows = data.transactions.map((tx, i) => [
    String(i + 1),
    formatDatePL(tx.date),
    tx.description,
    tx.buyerName || '—',
    `${Number(tx.amount).toFixed(2)} zł`,
  ])

  const manualRows = data.manualEntries.map((e, i) => [
    String(data.transactions.length + i + 1),
    formatDatePL(e.date),
    `${e.description}*`,
    e.buyerName || '—',
    `${Number(e.amount).toFixed(2)} zł`,
  ])

  autoTable(doc, {
    startY: 68,
    head: [['Lp.', 'Data', 'Opis', 'Nabywca', 'Kwota']],
    body: [...platformRows, ...manualRows],
    styles: { fontSize: 9, cellPadding: 3, font: fontName },
    headStyles: { fillColor: [99, 102, 241] as [number, number, number], fontStyle: 'bold', textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 80 },
      3: { cellWidth: 35 },
      4: { cellWidth: 24, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 249, 252] as [number, number, number] },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY: number = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 120) + 8

  doc.setDrawColor(200, 200, 200)
  doc.line(20, finalY, 190, finalY)

  doc.setFont(fontName, 'bold')
  doc.setFontSize(10)
  doc.text(`Suma przychodów: ${Number(data.totalAmount).toFixed(2)} zł`, 190, finalY + 8, { align: 'right' })
  doc.setFont(fontName, 'normal')
  doc.setFontSize(9)
  doc.text(`Miesięczny limit DG (75% min. wynagrodzenia): ${Number(data.monthlyLimit).toFixed(2)} zł`, 190, finalY + 14, { align: 'right' })
  const pct = data.monthlyLimit > 0 ? ((data.totalAmount / data.monthlyLimit) * 100).toFixed(1) : '0.0'
  doc.text(`Wykorzystano: ${pct}%`, 190, finalY + 20, { align: 'right' })

  if (data.manualEntries.length > 0) {
    doc.setFontSize(8)
    doc.setFont(fontName, 'normal')
    doc.text('* przychód spoza platformy MyLokalni.pl', 20, finalY + 20)
  }

  const footerY = finalY + 32
  doc.setFontSize(8)
  doc.setFont(fontName, 'normal')
  doc.setTextColor(150, 150, 150)
  const today = new Date().toLocaleDateString('pl-PL')
  doc.text(`Dokument wygenerowany przez aplikację MyLokalni.pl · ${today}`, 105, footerY, { align: 'center' })
  doc.text('Narzędzie pomocnicze — nie zastępuje profesjonalnego doradztwa podatkowego.', 105, footerY + 5, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  doc.text('Podpis: ___________', 190, footerY + 14, { align: 'right' })

  const filename = month
    ? `ewidencja-${year}-${String(month).padStart(2, '0')}.pdf`
    : `ewidencja-${year}.pdf`
  doc.save(filename)
}
