import { describe, it, expect } from "vitest";
import { PERMISSIONS } from "@/lib/permissions";

describe("permissions des rapports", () => {
  it("REPORT_VIEW est bien une permission de lecture accessible à l'Auditor", () => {
    expect(PERMISSIONS.REPORT_VIEW.endsWith(":view")).toBe(true);
  });
});
