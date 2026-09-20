import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, profileSchema } from "@/lib/validations/auth";
import { safeInternalPath } from "@/lib/site-url";
import { ORDER_STATUS_META } from "@/lib/constants/orders";

describe("auth validations", () => {
  it("login: email invalid", () => {
    const r = loginSchema.safeParse({ email: "bukan-email", password: "x" });
    expect(r.success).toBe(false);
  });

  it("login: password kosong ditolak", () => {
    const r = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(r.success).toBe(false);
  });

  it("login: valid", () => {
    const r = loginSchema.safeParse({ email: "  A@B.com  ", password: "secret" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("A@B.com");
  });

  it("register: password pendek ditolak", () => {
    const r = registerSchema.safeParse({
      displayName: "Rei",
      username: "rei",
      email: "a@b.com",
      password: "1234567",
    });
    expect(r.success).toBe(false);
  });

  it("register: username uppercase di-lowercase & tidak valid karakter", () => {
    const r = registerSchema.safeParse({
      displayName: "Rei",
      username: "Rei!X",
      email: "a@b.com",
      password: "12345678",
    });
    expect(r.success).toBe(false);
    const ok = registerSchema.safeParse({
      displayName: "Rei",
      username: "REI-23",
      email: "a@b.com",
      password: "12345678",
    });
    expect(ok.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("bio > 500 ditolak", () => {
    const r = profileSchema.safeParse({
      username: "rei",
      displayName: "Rei",
      bio: "x".repeat(501),
    });
    expect(r.success).toBe(false);
  });

  it("bio kosong diperbolehkan", () => {
    const r = profileSchema.safeParse({ username: "rei", displayName: "Rei", bio: "" });
    expect(r.success).toBe(true);
  });
});

describe("safeInternalPath", () => {
  it("blocks open redirect", () => {
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("https://evil.com")).toBe("/");
    expect(safeInternalPath(null)).toBe("/");
  });

  it("allows internal paths", () => {
    expect(safeInternalPath("/account/profile")).toBe("/account/profile");
    expect(safeInternalPath("/login", "/fallback")).toBe("/login");
  });
});

describe("ORDER_STATUS_META", () => {
  it("semua status punya label + deskripsi", () => {
    expect(Object.keys(ORDER_STATUS_META).sort()).toEqual([
      "awaiting_payment",
      "cancelled",
      "completed",
      "paid",
      "pending",
      "processing",
      "refunded",
    ]);
    for (const meta of Object.values(ORDER_STATUS_META)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.text.length).toBeGreaterThan(0);
    }
  });
});