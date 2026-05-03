import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";
import { lookup } from "mime-types";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://29388a2f6ff8e30c69ceffca6ec42cab.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "4e98eb9c56d2b47af7e51d5d0ee76de1",
    secretAccessKey: "78fe988fd105ebb8c461f90b903e3d3680e76c3e96dde15dd0cf2c3a5cebd91f",
  },
});

const BUCKET = "digital-plus-media";
const FOLDER = "New folder";
const MEDIA_DIR = "C:/Users/user/Desktop/digital-plus3/apps/cms/src/media";

const files = await readdir(MEDIA_DIR);
console.log(`Uploading ${files.length} files...`);

let done = 0;
let failed = 0;

for (const filename of files) {
  try {
    const filePath = join(MEDIA_DIR, filename);
    const body = await readFile(filePath);
    const mimeType = lookup(extname(filename)) || "application/octet-stream";

    await R2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${FOLDER}/${filename}`,
      Body: body,
      ContentType: mimeType,
    }));

    done++;
    if (done % 50 === 0) console.log(`✓ ${done}/${files.length}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${filename}: ${err.message}`);
  }
}

console.log(`\nDone: ${done} uploaded, ${failed} failed`);
