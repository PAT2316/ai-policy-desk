import { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FileStorageProvider, UploadUrlRequest } from "./FileStorageProvider";

const DEFAULT_EXPIRY_SECONDS = 15 * 60; // 15 minutes (ADR-004)

export class R2StorageProvider implements FileStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME ?? "";
    this.client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT, // ex. https://<account_id>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async getSignedUploadUrl({ key, mimeType, maxSizeBytes }: UploadUrlRequest) {
    // ContentLength n'est pas imposable via presigned PUT standard ; la vérification de taille
    // définitive se fait donc aussi côté serveur après upload (webhook ou vérification à la lecture).
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: DEFAULT_EXPIRY_SECONDS });
    return { uploadUrl, key };
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = DEFAULT_EXPIRY_SECONDS): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
