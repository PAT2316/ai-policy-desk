import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { AssignTrainingForm } from "./AssignTrainingForm";

export default async function AssignTrainingPage() {
  const ctx = await requirePermission(PERMISSIONS.TRAINING_MANAGE);

  const [courses, members] = await Promise.all([
    prisma.trainingCourse.findMany({
      where: { OR: [{ organizationId: null }, { organizationId: ctx.organizationId }] },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-6">Assigner une formation</h1>
      <AssignTrainingForm
        organizationId={ctx.organizationId}
        courses={courses}
        members={members.map((m) => ({ id: m.user.id, label: `${m.user.name} (${m.user.email})` }))}
      />
    </div>
  );
}
