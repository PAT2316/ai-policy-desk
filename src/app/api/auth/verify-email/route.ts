import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/tokens";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await consumeVerificationToken(parsed.data.token, "email_verification");

  if (!result) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: result.userId },
    data: { emailVerifiedAt: new Date() },
  });

  return NextResponse.json({ message: "Email vérifié avec succès." }, { status: 200 });
}
