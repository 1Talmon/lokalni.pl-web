import { Fragment, type ReactNode } from 'react';
import type { LegalBlock, LegalDocumentData } from '../../lib/legal/types';

/** `**bold**` → <strong>. Everything else is rendered as plain text (no HTML injection). */
const inline = (text: string): ReactNode =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
            : <Fragment key={i}>{part}</Fragment>
    );

const Block = ({ block }: { block: LegalBlock }) => {
    switch (block.type) {
        case 'p':
            return <p>{inline(block.text)}</p>;
        case 'note':
            return <p className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-900">{inline(block.text)}</p>;
        case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
                <List className={`${block.ordered ? 'list-decimal' : 'list-disc'} pl-6 space-y-1.5`}>
                    {block.items.map((item, i) => <li key={i}>{inline(item)}</li>)}
                </List>
            );
        }
        case 'defs':
            return (
                <dl className="space-y-2">
                    {block.items.map(([term, def]) => (
                        <div key={term}>
                            <dt className="inline font-semibold text-gray-900">{term}</dt>
                            <dd className="inline"> – {inline(def)}</dd>
                        </div>
                    ))}
                </dl>
            );
        case 'table':
            return (
                <div className="space-y-3">
                    {block.rows.map((row, r) => (
                        <div key={r} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm">
                            <p className="font-bold text-gray-900 mb-2">{inline(row[0])}</p>
                            <dl className="space-y-1">
                                {row.slice(1).map((cell, c) => (
                                    <div key={c}>
                                        <dt className="inline text-xs font-bold uppercase tracking-wider text-gray-400">{block.head[c + 1]}: </dt>
                                        <dd className="inline text-gray-700">{inline(cell)}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </div>
            );
    }
};

/** Shared renderer for the Terms and Privacy Policy — web (server component) and mobile. */
export const LegalDocument = ({ doc }: { doc: LegalDocumentData }) => (
    <div>
        <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 tracking-tight">{doc.title}</h2>
            <p className="text-gray-500 text-sm">{doc.dateLine}</p>
            {doc.intro && <p className="text-gray-600 text-sm mt-4 max-w-xl mx-auto">{doc.intro}</p>}
        </div>

        <nav aria-label="Spis treści" className="mb-10 bg-gray-50 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Spis treści</p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {doc.sections.map((s, i) => (
                    <li key={s.id}>
                        <a href={`#${s.id}`} className="text-gray-600 hover:text-[#6366F1] transition-colors">
                            §{i + 1} {s.title}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>

        <div className="space-y-10 text-gray-700 leading-relaxed">
            {doc.sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <span className="bg-indigo-50 text-[#6366F1] min-w-8 h-8 px-2 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">§{i + 1}</span>
                        {s.title}
                    </h3>
                    <div className="space-y-3">
                        {s.blocks.map((b, j) => <Block key={j} block={b} />)}
                    </div>
                </section>
            ))}
        </div>
    </div>
);
