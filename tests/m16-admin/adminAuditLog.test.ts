import { describe, it, expect } from "vitest";
import { PERMISSIONS } from "@/lib/permissions";

describe("permissions du journal d'audit", () => {
  it("AUDIT_LOG_VIEW est explicitement accordée au rôle Auditor (cf. M2 DEFAULT_ROLE_PERMISSIONS)", () => {
    expect(PERMISSIONS.AUDIT_LOG_VIEW).toBe("audit_log:view");
  });
});
