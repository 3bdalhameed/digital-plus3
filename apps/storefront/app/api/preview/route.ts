import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const slug = request.nextUrl.searchParams.get("slug");
  const collection = request.nextUrl.searchParams.get("collection") ?? "products";

  const expectedSecret = process.env.PREVIEW_SECRET;

  // Require a secret — reject if missing or wrong
  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(
      `Invalid preview token. Make sure PREVIEW_SECRET is set in both CMS and storefront env vars.`,
      { status: 401 }
    );
  }

  draftMode().enable();

  if (collection === "products" && slug) {
    redirect(`/products/${slug}`);
  }

  // home-page global or any other collection → go to homepage
  redirect("/");
}
