export interface SendEmailInput {
  to: string;
  template: string; // ex. "email_verification", "training_overdue", "document_expiring"
  locale: string;
  variables: Record<string, string>;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}
