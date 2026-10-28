'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Trash2, LogIn, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useApp } from '../../../providers/AppProvider';
import { authService } from '../../../services/authService';
import { OPERATOR } from '../../../lib/legal/operator';

// Public page named in the Terms, the Privacy Policy and the store listings: delete the account without the app.
// Signed in → request the deletion here; the final step is the link e-mailed to the account address
// (/delete-account-confirm). Signed out → log in and come back (/auth?next=…) or write to the operator.
export default function DeleteAccountPage() {
    const { state } = useApp();
    const [step, setStep] = useState<'idle' | 'confirm' | 'sending' | 'sent'>('idle');
    const [error, setError] = useState('');
    const email = state.userProfile?.email;

    const requestDeletion = async () => {
        setStep('sending');
        setError('');
        try {
            await authService.requestAccountDeletion();
            setStep('sent');
        } catch (e) {
            setError((e as Error).message || 'Nie udało się wysłać e-maila. Spróbuj ponownie.');
            setStep('confirm');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-5 py-10 md:py-16">
            <div className="max-w-xl mx-auto">
                <Link href="/" className="inline-block text-2xl font-black text-gray-900 mb-8">
                    MyLokalni<span className="text-[#6366F1]">.</span>
                </Link>

                <div className="bg-white rounded-[2rem] p-7 md:p-10 shadow-xl border border-gray-100">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-5">
                        <Trash2 size={26} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">Usuwanie konta MyLokalni</h1>
                    <p className="text-gray-600 text-[15px] leading-relaxed mb-7">
                        Konto możesz usunąć w każdej chwili, bez podania przyczyny i bez kosztów. Dla bezpieczeństwa
                        usunięcie potwierdzasz linkiem, który wyślemy na adres e-mail konta.
                    </p>

                    {state.isLoadingApp ? (
                        <div className="flex items-center gap-3 text-gray-500 text-sm py-4">
                            <Loader2 size={18} className="animate-spin" /> Sprawdzamy, czy jesteś zalogowany…
                        </div>
                    ) : !state.isLoggedIn ? (
                        <div className="space-y-3">
                            <Link
                                href="/auth?next=/delete-account"
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <LogIn size={18} /> Zaloguj się, aby usunąć konto
                            </Link>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                W aplikacji: <strong className="text-gray-700">Profil → Ustawienia → Strefa zagrożenia → Usuń konto</strong>.
                            </p>
                        </div>
                    ) : step === 'sent' ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-3">
                            <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-900 leading-relaxed">
                                Wysłaliśmy wiadomość{email ? <> na adres <strong>{email}</strong></> : null}. Kliknij link w e-mailu,
                                aby ostatecznie usunąć konto. Jeśli wiadomości nie ma, sprawdź folder spam.
                            </p>
                        </div>
                    ) : step === 'idle' ? (
                        <div className="space-y-3">
                            {email && <p className="text-sm text-gray-500">Zalogowano jako <strong className="text-gray-700">{email}</strong></p>}
                            <button
                                type="button"
                                onClick={() => setStep('confirm')}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} /> Usuń moje konto
                            </button>
                        </div>
                    ) : (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-4">
                            <p className="text-sm text-rose-900 leading-relaxed">
                                Na pewno? Po kliknięciu w link z e-maila usuniemy profil, ogłoszenia i pozostałe dane opisane niżej.
                                Tego nie da się cofnąć.
                            </p>
                            {error && <p className="text-sm text-rose-700 font-semibold">{error}</p>}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={requestDeletion}
                                    disabled={step === 'sending'}
                                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {step === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Wyślij link
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('idle'); setError(''); }}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-9 space-y-5 text-sm text-gray-600 leading-relaxed">
                        <div>
                            <h2 className="font-bold text-gray-900 mb-1.5">Co usuwamy</h2>
                            <p>
                                Dane profilu (imię, nazwisko, zdjęcia, opis, telefon, linki, datę urodzenia, adres do ewidencji), ogłoszenia
                                z ich zdjęciami i nagraniami, aktualności, certyfikaty z plikami, wpisy ewidencji oraz powiązania z kontami
                                Google, Facebook i Apple. Adres e-mail zastępujemy technicznym identyfikatorem i kończymy wszystkie sesje logowania.
                            </p>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 mb-1.5">Co zostaje</h2>
                            <p>
                                Rezerwacje i opinie zostają w formie zanonimizowanej, a wiadomości wysłane innym osobom zostają w ich
                                rozmowach jako wiadomości „Usuniętego Użytkownika”. Dane mogą jeszcze być w zaszyfrowanych kopiach
                                zapasowych (najwyżej 4 miesiące) i w logach bezpieczeństwa (do 12 miesięcy).
                                Szczegóły: <Link href="/polityka-prywatnosci#usuniecie-konta" className="text-[#6366F1] font-semibold hover:underline">Polityka prywatności</Link>.
                            </p>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 mb-1.5">Nie możesz się zalogować?</h2>
                            <p>
                                Napisz z adresu e-mail przypisanego do konta na{' '}
                                <a href={`mailto:${OPERATOR.email}?subject=Usunięcie konta`} className="text-[#6366F1] font-semibold hover:underline">{OPERATOR.email}</a>
                                {' '}– usuniemy konto po potwierdzeniu, że należy do Ciebie.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
