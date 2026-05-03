import { CollectionConfig } from "payload/types";
import { readFile } from "fs/promises";
import { join } from "path";

async function uploadFileToR2(filename: string, mimeType: string) {
  // eval('require') prevents webpack from statically analyzing this import
  const r: NodeRequire = eval("require");
  const { S3Client, PutObjectCommand } = r("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
  const body = await readFile(join(process.cwd(), "media", filename));
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: `New folder/${filename}`,
    Body: body,
    ContentType: mimeType,
  }));
}

export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Settings" },
  access: { read: () => true },
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (doc?.filename && process.env.S3_PUBLIC_URL) {
          doc.url = `${process.env.S3_PUBLIC_URL}/New folder/${doc.filename}`;
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
          console.error(`R2 upload failed for ${doc.filename}:`, err.message);
        }
        return doc;
      },
    ],
  },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*", "application/pdf"],
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
