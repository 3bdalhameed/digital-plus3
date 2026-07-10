import Image from "next/image";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";
import { getPostBySlug, getPosts } from "@/lib/payload";

// Blog posts rarely change after publish — 1 hour ISR.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) return { title: "مقالة غير موجودة" };
  return {
    title: `${post.title} — مدونة ديجيتال بلس`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : undefined,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      authors: post.author ? [post.author] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  // draftMode unlocks the no-store path inside getPostBySlug so previews
  // don't hit the 60s ISR cache.
  const { isEnabled: isPreview } = draftMode();
  void isPreview;

  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) notFound();

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("ar-u-nu-latn", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="mx-auto max-w-3xl">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm text-brand-500">
        <Link href="/" className="hover:text-brand-700">الرئيسية</Link>
        <span className="mx-2 text-brand-300">›</span>
        <Link href="/blogs/news" className="hover:text-brand-700">المدونة</Link>
        <span className="mx-2 text-brand-300">›</span>
        <span className="text-brand-800 line-clamp-1 inline-block max-w-[60ch] align-bottom">{post.title}</span>
      </nav>

      <h1 className="mb-4 text-2xl font-black leading-tight text-brand-800 sm:text-3xl">
        {post.title}
      </h1>

      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
        {post.author && <span>✍ {post.author}</span>}
        {dateStr && (
          <span>
            <time dateTime={post.publishedAt ?? undefined}>{dateStr}</time>
          </span>
        )}
        {post.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t, i) => (
              <Link
                key={i}
                href={`/blogs/news?tag=${encodeURIComponent(t.tag)}`}
                className="rounded-full bg-brand-50 px-3 py-0.5 text-xs text-brand-700 hover:bg-brand-100"
              >
                #{t.tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {post.featuredImageUrl && (
        <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* HTML body imported from Shopify. The CMS field is plain HTML, so we
          inject it verbatim and rely on Tailwind's typography-friendly tags. */}
      <div
        className="prose max-w-none prose-headings:text-brand-800 prose-a:text-brand-600 prose-img:rounded-xl rtl:text-right"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
      />

      <div className="mt-12 border-t border-brand-100 pt-6 text-center">
        <Link href="/blogs/news" className="brand-btn-outline text-sm">
          ← كل المقالات
        </Link>
      </div>
    </article>
  );
}

// Pre-render the most recent posts at build time so they're instant.
// The rest are generated on-demand at first request and then cached.
export async function generateStaticParams() {
  try {
    const { docs } = await getPosts({ limit: 50, page: 1 });
    return docs.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}
