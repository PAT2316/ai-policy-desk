import { describe, it, expect } from "vitest";
import { validateFile } from "@/lib/storage/fileValidation";

describe("validateFile", () => {
  it("rejette un type MIME non autorisé", () => {
    expect(validateFile({ mimeType: "application/x-msdownload", fileName: "x.exe", sizeBytes: 100 }).valid).toBe(false);
  });

  it("rejette une extension ne correspondant pas au type déclaré", () => {
    expect(validateFile({ mimeType: "application/pdf", fileName: "doc.docx", sizeBytes: 100 }).valid).toBe(false);
  });

  it("rejette un fichier trop volumineux", () => {
    expect(validateFile({ mimeType: "application/pdf", fileName: "doc.pdf", sizeBytes: 30 * 1024 * 1024 }).valid).toBe(false);
  });

  it("accepte un PDF valide de taille raisonnable", () => {
    expect(validateFile({ mimeType: "application/pdf", fileName: "doc.pdf", sizeBytes: 1024 }).valid).toBe(true);
  });
});
