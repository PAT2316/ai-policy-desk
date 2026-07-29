import Stripe from "stripe";
import type { PaymentProvider, CreateSubscriptionInput } from "./PaymentProvider";

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2024-06-20" });
  }

  async createCheckoutSession({ organizationId, customerEmail, planPriceId }: CreateSubscriptionInput) {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: customerEmail,
      line_items: [{ price: planPriceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/admin/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/admin/billing?canceled=true`,
      metadata: { organizationId }, // permet de relier l'événement webhook à l'organisation
    });

    return { checkoutUrl: session.url ?? "" };
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(stripeSubscriptionId);
  }

  verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  }
}
