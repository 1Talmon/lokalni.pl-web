import { landingLinkLabel, offersLabel, type LandingGroup } from '@/lib/landings';

// Internal links to landing groups that really have offers — shown as chips in SSR shells.
export function LandingLinks({ title, groups, labelFor }: {
    title: string;
    groups: LandingGroup[];
    labelFor?: (g: LandingGroup) => string;
}) {
    if (groups.length === 0) return null;
    return (
        <section className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
            <ul className="flex flex-wrap gap-2">
                {groups.map(g => (
                    <li key={g.slug}>
                        <a href={`/${g.slug}`} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600">
                            {labelFor ? labelFor(g) : landingLinkLabel(g)}
                            <span className="text-gray-400 text-xs">{offersLabel(g.count)}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
