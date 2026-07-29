const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "image/png",
  "image/jpeg",
]);

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo

export interface FileValidationInput {
  mimeType: string;
  fileName: string;
  sizeBytes: number;
}

export function validateFile(input: FileValidationInput): { valid: boolean; reason?: string } {
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    return { valid: false, reason: `Type de fichier non autorisé: ${input.mimeType}` };
  }

  const extension = input.fileName.split(".").pop()?.toLowerCase();
  const EXPECTED_EXTENSIONS: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
  };
  if (!extension || !EXPECTED_EXTENSIONS[input.mimeType]?.includes(extension)) {
    return { valid: false, reason: "L'extension du fichier ne correspond pas à son type déclaré." };
  }

  if (input.sizeBytes > MAX_SIZE_BYTES) {
    return { valid: false, reason: `Fichier trop volumineux (max ${MAX_SIZE_BYTES / 1024 / 1024} Mo).` };
  }

  return { valid: true };
}
