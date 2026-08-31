import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

const STEPS = [
  { n: '1', title: 'Znajdź specjalistę', desc: 'Wyszukaj usługę lub przeglądaj kategorie. Setki specjalistów w Twoim mieście.' },
  { n: '2', title: 'Napisz wiadomość',   desc: 'Skontaktuj się bezpośrednio — bez pośredników, bez prowizji od rozmowy.' },
  { n: '3', title: 'Umów się',           desc: 'Ustal termin i szczegóły. Oceń usługę po realizacji.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-xl text-indigo-600 tracking-tight">Lokalni.pl</span>
          <div className="flex gap-3">
            <a href="https://apps.apple.com/app/lokalni/id6741405160"
              className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors hidden sm:block">
              iOS
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.lokalni.app"
              className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors hidden sm:block">
              Android
            </a>
            <a href="https://mylokalni.pl/app"
              className="bg-indigo-600 text-white text-sm font-bold px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors">
              Otwórz aplikację
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-white pb-16 pt-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-indigo-100">
              🇵🇱 Platforma dla lokalnych specjalistów
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-6">
              Znajdź specjalistę<br />
              <span className="text-indigo-600">w swoim mieście</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Sprzątanie, remonty, korepetycje, uroda i setki innych usług. Lokalni specjaliści, prawdziwe opinie, bezpośredni kontakt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://apps.apple.com/app/lokalni/id6741405160"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                Pobierz na iOS
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.lokalni.app"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 font-bold px-8 py-4 rounded-2xl text-base hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
                Pobierz na Android
              </a>
            </div>
          </div>
        </section>

        {/* Kategorie */}
        <section className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Kategorie usług</h2>
          <p className="text-gray-500 mb-8">Przeglądaj specjalistów według kategorii</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/${cat.id}`}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-2xl mb-2 block">{cat.emoji}</span>
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Jak to działa */}
        <section className="bg-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Jak to działa?</h2>
            <p className="text-gray-500 mb-10 text-center">3 proste kroki do znalezienia specjalisty</p>
            <div className="grid sm:grid-cols-3 gap-6">
              {STEPS.map(s => (
                <div key={s.n} className="text-center">
                  <div className="w-12 h-12 bg-indigo-600 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                    {s.n}
                  </div>
                  <h3 className="font-black text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-4 py-14">
          <div className="bg-indigo-600 rounded-3xl p-10 text-center shadow-xl shadow-indigo-200">
            <h2 className="text-3xl font-black text-white mb-3">Gotowy?</h2>
            <p className="text-indigo-200 mb-8 text-base max-w-sm mx-auto leading-relaxed">
              Dołącz do tysięcy użytkowników, którzy już znaleźli swoich specjalistów na Lokalni.pl
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://apps.apple.com/app/lokalni/id6741405160"
                className="inline-flex items-center justify-center bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors">
                App Store — iOS
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.lokalni.app"
                className="inline-flex items-center justify-center bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-400 transition-colors">
                Google Play — Android
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-black text-indigo-600">Lokalni.pl</span>
          <div className="flex gap-6">
            <a href="/regulamin" className="hover:text-gray-700 transition-colors">Regulamin</a>
            <a href="/polityka-prywatnosci" className="hover:text-gray-700 transition-colors">Polityka prywatności</a>
            <a href="/o-nas" className="hover:text-gray-700 transition-colors">O nas</a>
          </div>
          <span>© {new Date().getFullYear()} Lokalni.pl</span>
        </div>
      </footer>
    </div>
  );
}
