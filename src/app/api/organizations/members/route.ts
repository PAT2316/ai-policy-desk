import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { createVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

const inviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
  organizationId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.MEMBER_INVITE, orgId); // lecture réservée à ceux qui peuvent gérer les membres

    const members = await prisma.membership.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: { select: { id: true, email: true, name: true, status: true } }, role: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const ctx = await requirePermission(PERMISSIONS.MEMBER_INVITE, parsed.data.organizationId);

    // Le rôle ciblé DOIT appartenir à la même organisation — jamais un roleId d'une autre organisation.
    const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
    if (!role || role.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: "invalid_role_for_organization" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email } });

    // Si l'utilisateur n'existe pas encore, on crée un compte "invited" sans mot de passe utilisable
    // (le mot de passe sera défini lors de l'acceptation de l'invitation, via le même flux que verify-email).
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: email.split("@")[0] ?? email, passwordHash: "invited", status: "active" },
      });
    }

    const existingMembership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: ctx.organizationId } },
    });
    if (existingMembership) {
      return NextResponse.json({ error: "already_member" }, { status: 409 });
    }

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: ctx.organizationId,
        roleId: role.id,
        status: "invited",
      },
    });

    const token = await createVerificationToken(user.id, "email_verification");
    await sendEmail({
      to: user.email,
      template: "organization_invitation",
      locale: user.locale,
      variables: {
        invitationUrl: `${process.env.APP_URL}/accept-invitation?token=${token}`,
        organizationId: ctx.organizationId,
      },
    });

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "create",
      resourceType: "Membership",
      resourceId: membership.id,
      newState: membership,
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
