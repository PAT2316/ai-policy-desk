import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { StripeProvider } from "@/lib/payment/StripeProvider";

const schema = z.object({ organizationId: z.string().min(1), planPriceId: z.string().min(1) });
const stripeProvider = new StripeProvider();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.BILLING_MANAGE, parsed.data.organizationId);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });

    const { checkoutUrl } = await stripeProvider.createCheckoutSession({
      organizationId: ctx.organizationId,
      customerEmail: user.email,
      planPriceId: parsed.data.planPriceId,
    });

    return NextResponse.json({ checkoutUrl }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
