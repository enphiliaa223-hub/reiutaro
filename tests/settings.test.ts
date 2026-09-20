import { describe, expect, it } from "vitest";
import { normalizeSettings } from "@/lib/settings";

describe("normalizeSettings", () => {
  it("returns defaults when settings is null", () => {
    const s = normalizeSettings(null);
    expect(s.brand).toBe("REIUTAROU");
    expect(s.opening.enabled).toBe(true);
    expect(s.opening.duration).toBe(4600);
    expect(s.maintenanceMode).toBe(false);
    expect(s.footerSocials.length).toBe(3);
  });

  it("applies overrides from rows", () => {
    const s = normalizeSettings({
      brand: "KAWAII",
      owner_name: "Rei",
      hero_kicker: "WAIFU LAB",
      hero_tagline: "Tagline",
      hero_description: "Desc",
      opening_enabled: false,
      opening_duration: 1234,
      opening_title: "KAWAII",
      opening_subtitle: "SUB",
      opening_show_skip: false,
      about_bio: "Bio",
      footer_socials: [
        { label: "GitHub", url: "https://github.com/x" },
        { label: "YouTube", url: "" },
      ],
      maintenance_mode: true,
    });
    expect(s.brand).toBe("KAWAII");
    expect(s.ownerName).toBe("Rei");
    expect(s.hero.kicker).toBe("WAIFU LAB");
    expect(s.opening.enabled).toBe(false);
    expect(s.opening.duration).toBe(1234);
    expect(s.opening.showSkip).toBe(false);
    expect(s.aboutBio).toBe("Bio");
    expect(s.footerSocials).toEqual([
      { label: "GitHub", url: "https://github.com/x" },
      { label: "YouTube", url: "" },
    ]);
    expect(s.maintenanceMode).toBe(true);
  });

  it("falls back per-field when rows are missing/empty string", () => {
    const s = normalizeSettings({
      brand: "",
      opening_duration: 0,
      footer_socials: "not-an-array",
    });
    expect(s.brand).toBe("");
    expect(s.hero.kicker).toBe("PERSONAL DIGITAL UNIVERSE");
    expect(s.opening.duration).toBe(0);
    expect(s.footerSocials).toHaveLength(3);
  });

  it("filters invalid footer_socials entries", () => {
    const s = normalizeSettings({
      footer_socials: [
        { label: "GitHub", url: "x" },
        { label: 123, url: "y" },
        { url: "missing-label" },
      ],
    });
    expect(s.footerSocials).toEqual([{ label: "GitHub", url: "x" }]);
  });
});