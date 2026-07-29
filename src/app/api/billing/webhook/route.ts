import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StripeProvider } from "@/lib/payment/StripeProvider";

const stripeProvider = new StripeProvider();
const GRACE_PERIOD_DAYS = 7; // "Ne pas bloquer brutalement les données d'un client" — cahier des charges §11

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripeProvider.verifyWebhookSignature(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Idempotence : chaque event.id Stripe n'est traité qu'une seule fois, même en cas de rejeu.
  const alreadyProcessed = await prisma.apiUsage.findFirst({
    where: { endpoint: "stripe_webhook", method: event.id },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, deduplicated: true }, { status: 200 });
  }
  await prisma.apiUsage.create({
    data: { endpoint: "stripe_webhook", method: event.id, statusCode: 200, latencyMs: 0 },
  });

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as { id: string; customer: string; status: string; metadata?: { organizationId?: string }; current_period_end: number };
      const organizationId = subscription.metadata?.organizationId;
      if (organizationId) {
        await prisma.subscription.updateMany({
          where: { organizationId },
          data: {
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            gracePeriodEndsAt: null,
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as { subscription?: string };
      if (invoice.subscription) {
        // Échec de paiement : période de grâce accordée, AUCUNE suppression ni blocage immédiat des données.
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription },
          data: {
            status: "past_due",
            gracePeriodEndsAt: new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as { id: string };
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: "canceled" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
