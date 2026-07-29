import { describe, it, expect } from "vitest";
import { isValidIncidentTransition } from "@/lib/incidentSchema";

describe("cycle de statut des incidents", () => {
  it("autorise open -> investigating", () => {
    expect(isValidIncidentTransition("open", "investigating")).toBe(true);
  });

  it("autorise open -> closed (clôture directe possible, ex. faux positif)", () => {
    expect(isValidIncidentTransition("open", "closed")).toBe(true);
  });

  it("interdit toute transition depuis closed (état terminal)", () => {
    expect(isValidIncidentTransition("closed", "open")).toBe(false);
    expect(isValidIncidentTransition("closed", "investigating")).toBe(false);
  });

  it("interdit resolved -> open (doit repasser par investigating)", () => {
    expect(isValidIncidentTransition("resolved", "open")).toBe(false);
  });
});
