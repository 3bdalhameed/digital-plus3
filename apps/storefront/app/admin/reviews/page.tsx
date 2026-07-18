"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/components/ui/link";
import { Star, Check, X, RefreshCw, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Admin review-moderation queue. Not part of the CMS admin panel --
 * lives on the storefront domain because Payload's Drizzle adapter
 * chokes on the reviews table shape and we can't safely register a
 * Reviews collection there. Access is gated server-side by the
 * ADMIN_EMAILS env var; this page redirects non-admins to /login.
 */
type Review = {
  id: number;
  productId: number;
  orderId: number;
  rating: number;
  comment: string | null;
  source: "customer" | "auto" | string;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: string;
  productName: string | null;
  productSlug: string | null;
  customerEmail: string | null;
  customerName: string | null;
};

const TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = typeof TABS[number];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews?status=${tab}`, { cache: "no-store" });
      if (res.status === 403) { setError("You don't have access to this page."); setReviews([]); return; }
      if (res.status === 401) { router.replace("/login"); return; }
      if (!res.ok) { setError("Failed to load reviews."); setReviews([]); return; }
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch {
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [tab, router]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function setStatus(id: number, newStatus: "approved" | "rejected" | "pending") {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        // Optimistic drop from the current tab; refetch to be safe.
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading" || (status === "authenticated" && loading && reviews.length === 0)) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6" dir="ltr">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-800">Review moderation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Signed in as {session?.user?.email}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-brand-50 p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold capitalize transition-all ${
              tab === t
                ? "bg-white text-brand-700 shadow-sm"
                : "text-brand-500 hover:text-brand-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {reviews.length === 0 && !loading && !error && (
        <div className="brand-card py-16 text-center text-gray-500">
          No {tab === "all" ? "" : tab} reviews.
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="brand-card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.status === "approved" ? "bg-green-100 text-green-700"
                      : r.status === "rejected" ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>{r.status}</span>
                  {r.source === "auto" && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                      auto (7-day sweep)
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-bold text-brand-800">
                  {r.productName ?? `Product #${r.productId}`}
                </p>
                {r.productSlug && (
                  <Link
                    href={`/products/${r.productSlug}`}
                    target="_blank"
                    className="text-xs text-brand-500 hover:underline"
                  >
                    /products/{r.productSlug}
                  </Link>
                )}
              </div>
              <div className="text-end text-xs text-gray-500">
                <p>{new Date(r.createdAt).toLocaleDateString()}</p>
                <p className="mt-0.5">Order #{r.orderId}</p>
              </div>
            </div>

            {r.comment && (
              <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                &ldquo;{r.comment}&rdquo;
              </p>
            )}

            <div className="flex items-center justify-between border-t border-brand-50 pt-3 text-xs">
              <p className="text-gray-500">
                {r.customerName ?? "Anonymous"} · {r.customerEmail ?? ""}
              </p>
              <div className="flex items-center gap-2">
                {r.status !== "approved" && (
                  <button
                    onClick={() => setStatus(r.id, "approved")}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => setStatus(r.id, "rejected")}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
