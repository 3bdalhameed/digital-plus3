import Link from "next/link";
import Image from "next/image";
import { getPosts, type BlogPost } from "@/lib/payload";

export const revalidate = 60;

export const metadata = {
  title: "المدونة — ديجيتال بلس",
  description:
    "آخر المقالات والأخبار من ديجيتال بلس عن المنتجات الرقمية واشتراكات الألعاب والبرامج.",
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: { page?: string; tag?: string };
}) {
  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
  const tag = searchParams?.tag;

  const { docs: posts, totalPages, hasNextPage, hasPrevPage, totalDocs } = await getPosts({
    page,
    limit: 12,
    tag,
  });

  return (
    <div>
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-black text-brand-800">المدونة</h1>
        <p className="text-sm text-brand-500">
          {tag ? `مقالات الوسم: ${tag}` : "كل المقالات والأخبار"}
        </p>
        {totalDocs > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {totalDocs.toLocaleString("en-US")} مقالة
          </p>
        )}
      </header>

      {posts.length === 0 ? (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📭</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">لا توجد مقالات</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        hasNext={hasNextPage}
        hasPrev={hasPrevPage}
        tag={tag}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

function PostCard({ post }: { post: BlogPost }) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("ar-u-nu-latn", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/blogs/news/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-50">
        {post.featuredImageUrl ? (
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">📝</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="line-clamp-2 text-base font-bold leading-snug text-brand-800 group-hover:text-brand-600">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm text-gray-500">{post.excerpt}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-brand-50 pt-3 text-xs text-gray-500">
          {post.author && <span>✍ {post.author}</span>}
          {dateStr && <span>{dateStr}</span>}
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
  hasNext,
  hasPrev,
  tag,
}: {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  tag?: string;
}) {
  if (totalPages <= 1) return null;
  const linkFor = (p: number) =>
    `/blogs/news?page=${p}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`;
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {hasPrev && (
        <Link href={linkFor(page - 1)} className="brand-btn-outline text-xs">
          السابق
        </Link>
      )}
      <span className="px-4 text-sm text-brand-600">
        صفحة {page} من {totalPages}
      </span>
      {hasNext && (
        <Link href={linkFor(page + 1)} className="brand-btn-outline text-xs">
          التالي
        </Link>
      )}
    </div>
  );
}
