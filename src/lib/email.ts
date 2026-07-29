import { getActiveEmailProvider } from "./email/BrevoProvider";
import type { SendEmailInput } from "./email/EmailProvider";

/**
 * Point d'entrée unique utilisé par tous les modules (register, invitations, reset-password...).
 * Ne jamais appeler BrevoProvider directement ailleurs dans le code — toujours passer par ici,
 * pour que le fournisseur reste remplaçable sans toucher aux routes (ADR-005).
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const provider = getActiveEmailProvider();
  await provider.send(input);
}
