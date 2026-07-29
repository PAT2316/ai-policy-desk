import type { EmailProvider, SendEmailInput } from "./EmailProvider";

// Correspondance modèle -> templateId Brevo, distincte par langue (ADR-005 : "modèles français et anglais").
const TEMPLATE_IDS: Record<string, Record<string, number>> = {
  email_verification: { fr: 1, en: 2 },
  password_reset: { fr: 3, en: 4 },
  organization_invitation: { fr: 5, en: 6 },
  training_overdue: { fr: 7, en: 8 },
  document_expiring: { fr: 9, en: 10 },
  action_overdue: { fr: 11, en: 12 },
  incident_assigned: { fr: 13, en: 14 },
  approval_requested: { fr: 15, en: 16 },
  risk_changed: { fr: 17, en: 18 },
};

export class BrevoProvider implements EmailProvider {
  private apiKey = process.env.BREVO_API_KEY ?? "";

  async send({ to, template, locale, variables }: SendEmailInput): Promise<void> {
    const templateId = TEMPLATE_IDS[template]?.[locale] ?? TEMPLATE_IDS[template]?.fr;
    if (!templateId) throw new Error(`Aucun template Brevo pour "${template}" / "${locale}"`);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [{ email: to }],
        templateId,
        params: variables,
        // Désactive le suivi marketing pour les emails sensibles/transactionnels (ADR-005).
        headers: { "X-Mailin-Tag": "transactional" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Échec d'envoi Brevo (${response.status}): ${await response.text()}`);
    }
  }
}

/** Console provider utilisé en développement (EMAIL_PROVIDER=console), sans appel réseau réel. */
export class ConsoleEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    console.info("[EMAIL:DEV]", JSON.stringify(input, null, 2));
  }
}

export function getActiveEmailProvider(): EmailProvider {
  return (process.env.EMAIL_PROVIDER ?? "console") === "brevo" ? new BrevoProvider() : new ConsoleEmailProvider();
}
