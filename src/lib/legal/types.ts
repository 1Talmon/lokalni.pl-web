/** Inline text: plain string; `**bold**` fragments are rendered in bold. */
export type LegalBlock =
    | { type: 'p'; text: string }
    | { type: 'list'; items: string[]; ordered?: boolean }
    | { type: 'defs'; items: [term: string, definition: string][] }
    | { type: 'table'; head: string[]; rows: string[][] }
    | { type: 'note'; text: string };

export interface LegalSection {
    id: string;
    title: string;
    blocks: LegalBlock[];
}

export interface LegalDocumentData {
    title: string;
    /** e.g. "Obowiązuje od 16 października 2026 r." */
    dateLine: string;
    intro?: string;
    sections: LegalSection[];
}
