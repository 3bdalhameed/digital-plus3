import { getPosts } from "@/lib/payload";
import { BlogIndexView } from "./BlogIndexView";

export const revalidate = 60;

export const metadata = {
  title: "المدونة | Blog — ديجيتال بلس",
  description:
    "آخر المقالات والأخبار من ديجيتال بلس عن المنتجات الرقمية واشتراكات الألعاب والبرامج. Latest articles and news from Digital Plus.",
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
    <BlogIndexView
      posts={posts}
      page={page}
      totalPages={totalPages}
      hasNext={hasNextPage}
      hasPrev={hasPrevPage}
      totalDocs={totalDocs}
      tag={tag}
    />
  );
}
