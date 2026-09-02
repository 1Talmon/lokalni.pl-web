'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ArrowLeft, Home } from 'lucide-react';

const ParentalConsentVerifyView = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get('status');
    const isSuccess = status === 'sukces';

    return (
        <div
            className="min-h-[100dvh] bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center px-6"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <span className="font-extrabold text-xl tracking-tight">
                        <span className="text-[#6366F1]">MyLokalni</span>
                        <span className="text-gray-900">.pl</span>
                    </span>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#6366F1] to-[#818CF8]" />

                    <div className="p-8 flex flex-col items-center text-center gap-5">
                        {isSuccess ? (
                            <>
                                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                    <CheckCircle size={44} className="text-emerald-500" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Zgoda potwierdzona!</h1>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Dziękujemy za wyrażenie zgody. Konto Twojego dziecka jest teraz aktywne — może się zalogować i korzystać z MyLokalni.pl.
                                    </p>
                                </div>
                                <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left">
                                    <p className="text-xs font-semibold text-emerald-700 mb-1">Co dalej?</p>
                                    <ul className="text-xs text-emerald-700 space-y-1 leading-relaxed">
                                        <li>✓ Twoje dziecko może teraz się zalogować</li>
                                        <li>✓ W każdej chwili możesz wycofać zgodę przez email na kontakt@lokalni.pl</li>
                                        <li>✓ Możesz przeglądać Politykę Prywatności na naszej stronie</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => router.push('/auth')}
                                    className="w-full bg-[#6366F1] text-white py-4 rounded-xl font-bold text-base hover:bg-[#4F46E5] shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Przejdź do logowania
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center">
                                    <XCircle size={44} className="text-red-400" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Link wygasł</h1>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Ten link jest nieprawidłowy lub wygasł (linki są ważne 72 godziny). Poproś dziecko, aby zalogowało się i wysłało nową prośbę o zgodę.
                                    </p>
                                </div>
                                <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left">
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Jeśli potrzebujesz pomocy, napisz do nas na <strong>kontakt@lokalni.pl</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full bg-[#6366F1] text-white py-4 rounded-xl font-bold text-base hover:bg-[#4F46E5] shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Home size={18} />
                                    Strona główna
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
                    © MyLokalni.pl — Platforma usług lokalnych w Polsce
                </p>
            </div>
        </div>
    );
};

export default ParentalConsentVerifyView;
