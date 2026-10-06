import { authorName, formatDatePl, postExcerpt, postTitle, type PublicPost } from '@/lib/landings';

// Server-rendered post teaser linking to /wpis/<slug> — real <a href> for crawlers.
export function StaticPostCard({ post, headingLevel = 'h3' }: { post: PublicPost; headingLevel?: 'h2' | 'h3' }) {
    const Heading = headingLevel;
    const name = authorName(post.author);
    return (
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {post.image && (
                <a href={`/wpis/${post.slug}`} className="block">
                    <img src={post.image} alt={postTitle(post.content)} loading="lazy" className="w-full aspect-video object-cover" />
                </a>
            )}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 overflow-hidden">
                        {post.author.profilowe
                            ? <img src={post.author.profilowe} alt="" className="w-full h-full object-cover" />
                            : name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <a href={`/profile/${post.author.uid}`} className="font-semibold text-sm text-gray-900 hover:text-indigo-600 truncate block">{name}</a>
                        <time dateTime={post.createdAt} className="text-xs text-gray-400">{formatDatePl(post.createdAt)}</time>
                    </div>
                </div>
                <Heading className="font-bold text-gray-900 mb-1">
                    <a href={`/wpis/${post.slug}`} className="hover:text-indigo-600">{postTitle(post.content)}</a>
                </Heading>
                <p className="text-sm text-gray-600 line-clamp-3">{postExcerpt(post.content, 220)}</p>
            </div>
        </article>
    );
}
