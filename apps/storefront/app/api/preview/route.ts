import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const slug = request.nextUrl.searchParams.get("slug");
  const collection = request.nextUrl.searchParams.get("collection") ?? "products";

  if (!process.env.PREVIEW_SECRET || secret !== process.env.PREVIEW_SECRET) {
    return new Response("Invalid preview token", { status: 401 });
  }

  draftMode().enable();

  if (collection === "products" && slug) {
    redirect(`/products/${slug}`);
  }
  redirect("/");
}
