import Link from 'next/link';

export const AuthSidePanel = () => (
    <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white p-12 flex-col justify-between">
        <Link href="/" className="text-3xl font-black block w-fit hover:opacity-80 transition-opacity">
            MyLokalni<span className="text-black/20">.</span>
        </Link>
        <div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
                Wszystko,<br />czego potrzebujesz<br />w jednym miejscu.
            </h1>
            <p className="text-lg opacity-80">
                Dołącz do tysięcy zadowolonych użytkowników i znajdź specjalistę w swojej okolicy już dziś.
            </p>
        </div>
        <div className="flex gap-4 opacity-50 text-sm">
            <span>© 2024 MyLokalni</span>
            <Link href="/polityka-prywatnosci" className="hover:opacity-100 hover:underline transition-opacity">Prywatność</Link>
            <Link href="/regulamin" className="hover:opacity-100 hover:underline transition-opacity">Regulamin</Link>
        </div>
    </div>
);
