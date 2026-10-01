import { Mail, type LucideIcon } from 'lucide-react';
import { BackButton } from './BackButton';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { OPERATOR } from '@/lib/legal/operator';
import type { LegalDocumentData } from '@/lib/legal/types';

export function LegalPageShell({ icon: Icon, heading, doc, jsonLd }: {
    icon: LucideIcon;
    heading: string;
    doc: LegalDocumentData;
    jsonLd: Record<string, unknown>;
}) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <div className="min-h-screen bg-gray-50 pb-20">
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <BackButton />
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Icon size={20} className="text-[#6366F1]" />
                            {heading}
                        </h1>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-12">
                        <LegalDocument doc={doc} />

                        <div className="border-t border-gray-100 pt-8 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-6 rounded-2xl">
                            <div className="text-center sm:text-left">
                                <p className="font-bold text-gray-900">Masz pytania?</p>
                                <p className="text-xs text-gray-500">{OPERATOR.fullName} · {OPERATOR.serviceName}</p>
                            </div>
                            <a
                                href={`mailto:${OPERATOR.email}`}
                                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors active:scale-95"
                            >
                                <Mail size={16} /> {OPERATOR.email}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
