import { CollectionConfig } from "payload/types";
// Custom MediaList view is intentionally NOT registered — when an editor
// clicks "اختر من القائمة" on an upload field, Payload's picker drawer
// re-renders the collection's List view inside the modal. The custom view's
// react-router hooks (useHistory/useLocation) don't work in that modal
// context and the picker renders blank, blocking media selection. Keeping
// Payload's default List preserves picker functionality.

async function uploadFileToR2(filename: string, mimeType: string) {
  const r: NodeRequire = eval("require");
  const { S3Client, PutObjectCommand } = r("@aws-sdk/client-s3");
  const { readFile } = r("fs/promises");
  const { join } = r("path");

  const filePath = join(__dirname, "..", "media", filename);
  console.log(`[R2] reading file: ${filePath}`);
  console.log(`[R2] env: bucket=${process.env.S3_BUCKET} endpoint=${process.env.S3_ENDPOINT} key=${(process.env.S3_ACCESS_KEY_ID || "").slice(0, 8)}...`);

  const body = await readFile(filePath);
  const s3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: `New folder/${filename}`,
    Body: body,
    ContentType: mimeType,
  }));
  console.log(`[R2] uploaded OK: New folder/${filename}`);
}

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "ملف وسائط", plural: "الوسائط" },
  admin: {
    group: "الإعدادات",
    listSearchableFields: ["filename", "alt"],
    hidden: ({ user }: { user: any }) =>
      !["super_admin", "admin", "catalog"].includes(user?.role),
  },
  access: {
    read: () => true,
    create: ({ req: { user } }: any) =>
      ["super_admin", "admin", "catalog"].includes(user?.role),
    update: ({ req: { user } }: any) =>
      ["super_admin", "admin", "catalog"].includes(user?.role),
    delete: ({ req: { user } }: any) =>
      ["super_admin", "admin"].includes(user?.role),
  },
  hooks: {
    /**
     * Inject SVG dimensions before Payload's dimension probe.
     *
     * Payload v2.32's `generateFileData.js:126` reads `dimensions.width`.
     * For SVG files, its internal probe (sharp / image-size) returns null
     * whenever the SVG is missing width/height attrs, has a BOM, uses an
     * unusual xmlns, or is otherwise "unfriendly" -- and Payload then
     * throws `Cannot read properties of null (reading 'width')`, which
     * bubbles up as a 400 "حدث خطأ اثناء رفع الملف" with no useful
     * message client-side.
     *
     * Workaround: parse the SVG XML ourselves and stamp width/height onto
     * `req.file` before Payload runs its probe. If everything else fails,
     * we default to a 200x200 box -- an SVG scales anyway, so exact
     * dimensions don't matter for rendering, only for the metadata row.
     */
    beforeOperation: [
      ({ operation, req }) => {
        if (operation !== "create") return;
        const file: any = (req as any).file || (req as any).files?.file;
        if (!file) return;
        const mime = (file.mimetype || "").toLowerCase();
        const name = (file.name || "").toLowerCase();
        const isSvg = mime === "image/svg+xml" || name.endsWith(".svg");
        if (!isSvg) return;
        try {
          const buf: Buffer | undefined = file.data;
          if (!buf) return;
          // Strip a BOM if the SVG starts with one -- some editors save
          // with UTF-8 BOM which Payload's probe chokes on.
          const raw = buf.toString("utf8").replace(/^﻿/, "");
          const attrOf = (re: RegExp): number | null => {
            const m = raw.match(re);
            if (!m) return null;
            const n = parseFloat(m[1]);
            return Number.isFinite(n) && n > 0 ? n : null;
          };
          let w = attrOf(/<svg[^>]*\swidth\s*=\s*["']?(\d+(?:\.\d+)?)/i);
          let h = attrOf(/<svg[^>]*\sheight\s*=\s*["']?(\d+(?:\.\d+)?)/i);
          if (!w || !h) {
            const vb = raw.match(/<svg[^>]*\sviewBox\s*=\s*["']([^"']+)["']/i);
            if (vb) {
              const parts = vb[1].trim().split(/[\s,]+/).map(parseFloat);
              if (parts.length === 4 && parts.every(Number.isFinite)) {
                w = w || parts[2];
                h = h || parts[3];
              }
            }
          }
          file.width  = Math.round(w || 200);
          file.height = Math.round(h || 200);
        } catch (e: any) {
          console.warn("[Media] SVG dimension parse failed, using defaults:", e?.message);
          file.width  = 200;
          file.height = 200;
        }
      },
    ],
    afterRead: [
      ({ doc }) => {
        if (doc?.filename && process.env.S3_PUBLIC_URL) {
          const base = process.env.S3_PUBLIC_URL;
          doc.url = `${base}/New%20folder/${doc.filename}`;
          const sizes = doc.sizes as Record<string, { filename?: string; url?: string }> | undefined;
          if (sizes) {
            for (const key of Object.keys(sizes)) {
              if (sizes[key]?.filename) {
                sizes[key] = { ...sizes[key], url: `${base}/New%20folder/${sizes[key].filename}` };
              }
            }
          }
        }
        return doc;
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (!process.env.S3_BUCKET || !doc?.filename) return doc;
        if (operation !== "create" && operation !== "update") return doc;
        try {
          await uploadFileToR2(doc.filename, doc.mimeType || "application/octet-stream");
          const sizes = doc.sizes as Record<string, any> | undefined;
          if (sizes) {
            for (const size of Object.values(sizes)) {
              if (size?.filename) {
                await uploadFileToR2(size.filename, size.mimeType || doc.mimeType || "image/jpeg");
              }
            }
          }
          console.log(`Uploaded ${doc.filename} to R2`);
        } catch (err: any) {
          console.error(`[R2] upload FAILED for ${doc.filename}:`, err.message);
          console.error(`[R2] stack:`, err.stack);
        }
        return doc;
      },
    ],
  },
  upload: {
    staticDir: "media",
    // Explicit list rather than "image/*" alone -- Payload's wildcard
    // match is inconsistent across versions and rejects some browsers'
    // legitimate uploads (Firefox sends SVGs as image/svg+xml which
    // sometimes fails the wildcard, and some file managers send with no
    // mime type at all → application/octet-stream). This covers every
    // format we actually expect: raster images, vectors, and PDFs.
    mimeTypes: [
      "image/*",
      "image/svg+xml",
      "image/webp",
      "image/avif",
      "image/heic",
      "application/pdf",
      "application/octet-stream",
    ],
    imageSizes: [
      { name: "thumbnail", width: 300, height: 300, position: "centre" },
      { name: "card", width: 600, height: 400, position: "centre" },
      { name: "hero", width: 1200, height: 600, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      label: "النص البديل",
      type: "text",
    },
  ],
};
