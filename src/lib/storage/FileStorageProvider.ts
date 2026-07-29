export interface UploadUrlRequest {
  key: string;
  mimeType: string;
  maxSizeBytes: number;
}

export interface FileStorageProvider {
  /** URL signée permettant au client d'uploader directement vers le stockage (pas via notre serveur). */
  getSignedUploadUrl(request: UploadUrlRequest): Promise<{ uploadUrl: string; key: string }>;
  /** URL signée à durée limitée pour télécharger un fichier privé. */
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
