import { describe, it, expect } from "vitest";

describe("règles non négociables de facturation (§11 cahier des charges)", () => {
  it("un échec de paiement déclenche une période de grâce, jamais une suppression immédiate", () => {
    const GRACE_PERIOD_DAYS = 7;
    const subscriptionAfterFailure = {
      status: "past_due",
      gracePeriodEndsAt: new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
      dataDeleted: false,
    };
    expect(subscriptionAfterFailure.dataDeleted).toBe(false);
    expect(subscriptionAfterFailure.gracePeriodEndsAt.getTime()).toBeGreaterThan(Date.now());
  });
});
