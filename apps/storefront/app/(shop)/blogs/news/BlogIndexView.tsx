"use client";

import Link from "@/components/ui/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/payload";
import { useT } from "@/lib/i18n";

interface Props {
  posts: BlogPost[];
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalDocs: number;
  tag: string | undefined;
}

export function BlogIndexView({ posts, page, totalPages, hasNext, hasPrev, totalDocs, tag }: Props) {
  const { isEn, dir } = useT();
  const M = {
    heading:      isEn ? "Blog" : "المدونة",
    allPosts:     isEn ? "All articles and news" : "كل المقالات والأخبار",
    tagPrefix:    isEn ? "Tag: " : "مقالات الوسم: ",
    articleCount: (n: number) => isEn
      ? `${n.toLocaleString("en-US")} article${n === 1 ? "" : "s"}`
      : `${n.toLocaleString("en-US")} مقالة`,
    empty:        isEn ? "No articles yet" : "لا توجد مقالات",
    prev:         isEn ? "Previous" : "السابق",
    next:         isEn ? "Next" : "التالي",
    pageOf:       (p: number, tot: number) => isEn ? `Page ${p} of ${tot}` : `صفحة ${p} من ${tot}`,
    by:           isEn ? "By " : "بقلم ",
  };

  return (
    <div dir={dir}>
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-black text-brand-800">{M.heading}</h1>
        <p className="text-sm text-brand-500">
          {tag ? `${M.tagPrefix}${tag}` : M.allPosts}
        </p>
        {totalDocs > 0 && (
          <p className="mt-1 text-xs text-gray-400">{M.articleCount(totalDocs)}</p>
        )}
      </header>

      {posts.length === 0 ? (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📭</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">{M.empty}</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isEn={isEn} authorPrefix={M.by} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {hasPrev && (
            <Link
              href={`/blogs/news?page=${page - 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
              className="brand-btn-outline text-xs"
            >
              {M.prev}
            </Link>
          )}
          <span className="px-4 text-sm text-brand-600">{M.pageOf(page, totalPages)}</span>
          {hasNext && (
            <Link
              href={`/blogs/news?page=${page + 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
              className="brand-btn-outline text-xs"
            >
              {M.next}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isEn, authorPrefix }: { post: BlogPost; isEn: boolean; authorPrefix: string }) {
  // Locale for the date changes with the picked language so an English
  // visitor sees "July 16, 2026" instead of "١٦ يوليو ٢٠٢٦".
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(isEn ? "en-US" : "ar-u-nu-latn", {
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
          {post.author && <span>✍ {isEn ? `${authorPrefix}${post.author}` : post.author}</span>}
          {dateStr && <span>{dateStr}</span>}
        </div>
      </div>
    </Link>
  );
}
