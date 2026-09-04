# Project brief — MyLokalni.pl

## Cel

Platforma łącząca klientów (mieszkańców) z lokalnymi wykonawcami usług w Polsce. Znajdź → porównaj opinie → zarezerwuj online.

## Model

C2C marketplace usług (nie towarów). Podstawowe konto: free. Premium features dla wykonawców (bookingi, statystyki, więcej ogłoszeń).

## Target users

**Klienci** (majority):
- Osoby szukające hydraulika, elektryka, korepetycji, sprzątania, fryzjera itp. w swoim mieście
- Mobile-first (iOS/Android) + web

**Wykonawcy** (specialists):
- Freelancerzy, małe firmy usługowe, indywidualne osoby
- Zarządzają ofertami, kalendarzem, chatem z klientami
- Dashboard z bookingami i statystykami

**Admin** (my):
- Moderacja treści, weryfikacja, support ticketing

## Główne funkcje

1. **Katalog usług** — kategoria (16), miasto (30+), search full-text (Meilisearch)
2. **Public profile** wykonawcy — opinie, certyfikaty, zdjęcia zrealizowanych zleceń, wideo
3. **Booking** — kalendarz dostępności, prośba o rezerwację, potwierdzenie
4. **Chat** — real-time (WebSocket) klient ↔ wykonawca, media messages, booking action buttons
5. **Reviews** — post-booking, 1-5 gwiazdek + tekst
6. **Notifications** — in-app + push (Firebase mobile) + email (Postmark)
7. **Location** — geolocation, mapa (Leaflet w mobile, Google Maps w web), radius search
8. **Auth** — email+password, Google OAuth, Facebook, magic-link email verification
9. **Payment (planowane)** — obecnie rozliczenia offline między stronami
10. **Landing pages SEO** — 924 statycznych stron (`hydraulik-warszawa`, `elektryk-krakow`, itd.)

## Kluczowe wymagania biznesowe

- **PL only** (język polski, PLN, polskie miasta z lokatywem "w Warszawie", "w Krakowie" — obowiązkowe dla SEO)
- **RODO** compliance (encryption at rest, ProfileDelete flow, data export)
- **Wiek**: 13+ (osoby 13-15 lat wymagają zgody rodzica przez email verification — `/zgoda-rodzica`)
- **Content moderation**: reports (per-service, per-review), admin dashboard queue
- **SEO** to główny channel akwizycji — dlatego migracja Vite → Next.js SSR, LocalBusiness JSON-LD, sitemapy, canonical URLs

## Konkurencja

Fixly (marketplace zleceń, inny model — klient publikuje ogłoszenie, wykonawcy odpowiadają), Oferia, iLikePL. Nasz USP: hybrid mobile+web, real-time chat, klient przegląda oferty jak katalog (nie musi tworzyć zlecenia).

## Roadmap (aktualne / kluczowe)

- ✅ Migracja Vite → Next.js SSR dla web (2026-08/09)
- ⏳ Faza 4-6 audytu (deploy hygiene, code quality, perf) — patrz `/Users/cypriantalmon/Desktop/lokalni-audit/`
- 🎯 Integracja płatności (planowana)
- 🎯 Video calls klient ↔ wykonawca (planowane)
