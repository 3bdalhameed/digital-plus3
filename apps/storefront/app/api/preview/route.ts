import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/**
 * GET /api/preview?secret=<X>&collection=<Y>&slug=<Z>
 *
 * Called by the CMS preview-redirect endpoint when an editor clicks the
 * "Preview" button on a doc in the Payload admin. Verifies the shared
 * PREVIEW_SECRET, enables Next.js draftMode (so subsequent server
 * components can fetch draft content), and redirects to the matching
 * frontend URL.
 *
 * Supported collections:
 *   - products    → /products/<slug>
 *   - collections → /collections/<slug>   (categories + subcategories,
 *                                          since both live at the same
 *                                          unified URL now)
 *   - posts       → /blogs/news/<slug>
 *   - home-page (or anything else) → /
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const slug = request.nextUrl.searchParams.get("slug");
  const collection = request.nextUrl.searchParams.get("collection") ?? "products";

  const expectedSecret = process.env.PREVIEW_SECRET;

  /* ─── Diagnostics for the two common failure modes ──────────── */

  if (!expectedSecret) {
    return new Response(
      [
        "Preview is not configured.",
        "PREVIEW_SECRET is missing in the storefront environment.",
        "",
        "Fix: set PREVIEW_SECRET in the storefront env vars (Vercel /",
        "Coolify / wherever the storefront runs) to the SAME value used",
        "in the CMS env. Then redeploy.",
      ].join("\n"),
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  if (!secret) {
    return new Response(
      "Missing `secret` query parameter. The CMS should append it automatically.",
      { status: 400 }
    );
  }

  if (secret !== expectedSecret) {
    return new Response(
      [
        "Invalid preview token.",
        "The PREVIEW_SECRET in the storefront does NOT match the PREVIEW_SECRET",
        "in the CMS. Set both to the same value and redeploy both apps.",
      ].join("\n"),
      { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  /* ─── Enable draft mode and redirect to the right page ──────── */

  draftMode().enable();

  if (collection === "products" && slug) {
    redirect(`/products/${slug}`);
  }

  if (collection === "collections" && slug) {
    redirect(`/collections/${slug}`);
  }

  if (collection === "posts" && slug) {
    redirect(`/blogs/news/${slug}`);
  }

  // home-page global, no slug, or anything else → homepage
  redirect("/");
}
