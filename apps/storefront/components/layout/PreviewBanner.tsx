import { draftMode } from "next/headers";

export function PreviewBanner() {
  const { isEnabled } = draftMode();
  if (!isEnabled) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
      <span>⚠️ أنت في وضع المعاينة — التغييرات غير منشورة</span>
      <a
        href="/api/disable-preview"
        className="rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800"
      >
        إنهاء المعاينة
      </a>
    </div>
  );
}
