export interface CreateSubscriptionInput {
  organizationId: string;
  customerEmail: string;
  planPriceId: string;
}

export interface PaymentProvider {
  createCheckoutSession(input: CreateSubscriptionInput): Promise<{ checkoutUrl: string }>;
  cancelSubscription(stripeSubscriptionId: string): Promise<void>;
}
