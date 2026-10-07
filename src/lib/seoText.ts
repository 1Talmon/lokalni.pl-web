import { CATEGORY_SLUG, KEYWORD_DISPLAY, CITY_LOCATIVE } from './seo-data';
import { createSlug, polishPlural } from '../utils/helpers';

// Titles and meta descriptions (the snippet under the title in Google) built only from real data:
// the provider's own text plus facts from the DB (city, price, category, real reviews).

const MAX_DESC = 160;

/** Collapse whitespace and cut on a word boundary; adds "…" only when something was cut. */
export function clip(text: string, max: number): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    if (flat.length <= max) return flat;
    // Prefer ending on a full sentence when that keeps at least half of the budget
    const head = flat.slice(0, max + 1);
    const lastStop = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
    if (lastStop >= max / 2) return head.slice(0, lastStop + 1);
    return `${flat.slice(0, max + 1).replace(/\s+\S*$/, '').replace(/[\s.,;:!?–-]+$/, '')}…`;
}

const sentence = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Fill the remaining budget with the user's own text, then append the fixed facts. */
function compose(lead: string, facts: string): string {
    const budget = MAX_DESC - facts.length - 1;
    if (!lead || budget < 40) return clip(facts, MAX_DESC);
    return `${sentence(capitalize(clip(lead, budget)))} ${facts}`;
}

const reviewsLabel = (n: number) => `${n} ${polishPlural(n, 'opinia', 'opinie', 'opinii')}`;

function locative(city: string): string {
    const loc = CITY_LOCATIVE[createSlug(city)];
    return loc ? `w ${loc}` : `– ${city}`;
}

// ─── Service ────────────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** "Detailing – Gdańsk" (city skipped when the title already names it). */
export function serviceTitle(s: Raw): string {
    const title = capitalize(str(s.title));
    const city = str(s.city);
    if (!city || title.toLowerCase().includes(city.toLowerCase())) return title;
    return `${title} – ${city}`;
}

export function serviceDescription(s: Raw): string {
    const catSlug = CATEGORY_SLUG[str(s.category)];
    // "Inne" says nothing about the service — leave it out ("W Rowach · 70 zł")
    const cat = catSlug && catSlug !== 'inne' ? KEYWORD_DISPLAY[catSlug] : null;
    const city = str(s.city);
    const price = Number(s.price);
    const unit = str(s.priceUnit);
    const rating = Number(s.rating);
    const reviews = Number(s.reviewsCount);

    const where = s.isRemote ? 'zdalnie' : city ? locative(city) : '';
    const facts = [
        [cat, where].filter(Boolean).join(' '),
        price > 0 ? `${price} zł${unit ? ` ${unit}` : ''}` : '',
        reviews > 0 && rating > 0 ? `ocena ${rating.toFixed(1)} (${reviewsLabel(reviews)})` : '',
    ].filter(Boolean).join(' · ');

    return compose(str(s.description), `${facts ? `${capitalize(facts)}. ` : ''}Rezerwacja online na MyLokalni.pl.`);
}

// ─── Profile ────────────────────────────────────────────────────────────────

export function profileDescription(name: string, p: Raw, services: { title: string; city: string }[]): string {
    const rating = Number(p.avgRating);
    const reviews = Number(p.reviewsCount);
    const ratingPart = reviews > 0 && rating > 0 ? ` Ocena ${rating.toFixed(1)} (${reviewsLabel(reviews)}).` : '';

    if (services.length === 0) {
        return compose(str(p.bio), `${name} na MyLokalni.pl.${ratingPart}`);
    }
    const titles = [...new Set(services.map(s => capitalize(s.title.trim())))].slice(0, 3).join(', ');
    const cities = [...new Set(services.map(s => s.city).filter(Boolean))].slice(0, 3).join(', ');
    const offer = `${name}: ${titles}${cities ? ` (${cities})` : ''}.${ratingPart}`;
    const bio = str(p.bio);
    return bio ? compose(bio, offer) : clip(`${offer} Zobacz ${services.length === 1 ? 'ofertę' : 'oferty'} i zarezerwuj termin na MyLokalni.pl.`, MAX_DESC);
}

// ─── Post ───────────────────────────────────────────────────────────────────

export function postDescription(content: string, authorName: string): string {
    return compose(content, `Wpis: ${authorName}, MyLokalni.pl.`);
}

// ─── Home ───────────────────────────────────────────────────────────────────

export function homeDescription(categories: string[], cities: string[]): string {
    const cats = categories.filter(c => c && c !== 'Inne');
    // Only towns whose locative we know ("w Gdańsku") — never a guessed declension
    const where = cities.map(c => CITY_LOCATIVE[createSlug(c)]).filter(Boolean).slice(0, 4).join(', ');
    const lead = cats.length > 0
        ? `Lokalne usługi od młodych${where ? ` w ${where}` : ''} – ${cats.slice(0, 4).join(', ')}.`
        : 'Lokalne usługi od młodych z Twojej okolicy.';
    return clip(`${lead} Zarabiaj na tym, co umiesz, albo znajdź pomoc tuż obok – ceny, opinie i rezerwacja online.`, MAX_DESC);
}
