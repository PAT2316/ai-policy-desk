import { describe, it, expect } from "vitest";
import { shouldNotify, buildDeduplicationKey } from "@/lib/notificationRules";

describe("shouldNotify", () => {
  const now = new Date("2026-07-27T00:00:00Z");

  it("détecte un item en retard", () => {
    const result = shouldNotify({ id: "x", dueOrReviewDate: new Date("2026-07-01") }, now);
    expect(result).toEqual({ notify: true, reason: "overdue" });
  });

  it("détecte un item arrivant à échéance sous 30 jours", () => {
    const result = shouldNotify({ id: "x", dueOrReviewDate: new Date("2026-08-10") }, now);
    expect(result).toEqual({ notify: true, reason: "upcoming" });
  });

  it("ne notifie pas un item lointain (> 30 jours)", () => {
    const result = shouldNotify({ id: "x", dueOrReviewDate: new Date("2026-12-01") }, now);
    expect(result.notify).toBe(false);
  });
});

describe("buildDeduplicationKey", () => {
  it("produit la même clé pour le même jour", () => {
    const now = new Date("2026-07-27T08:00:00Z");
    const laterSameDay = new Date("2026-07-27T22:00:00Z");
    expect(buildDeduplicationKey("training_overdue", "item-1", now))
      .toBe(buildDeduplicationKey("training_overdue", "item-1", laterSameDay));
  });

  it("produit une clé différente pour un autre jour", () => {
    const day1 = new Date("2026-07-27T08:00:00Z");
    const day2 = new Date("2026-07-28T08:00:00Z");
    expect(buildDeduplicationKey("training_overdue", "item-1", day1))
      .not.toBe(buildDeduplicationKey("training_overdue", "item-1", day2));
  });
});
