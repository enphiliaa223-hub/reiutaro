import { z } from "zod";

const usernameRegex = /^[a-z0-9_]{3,30}$/;

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(usernameRegex, "3–30 karakter: huruf kecil, angka, atau underscore"),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Minimal 8 karakter"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Minimal 8 karakter"),
});

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(usernameRegex, "3–30 karakter: huruf kecil, angka, atau underscore"),
  displayName: z.string().trim().min(2, "Minimal 2 karakter").max(50, "Maksimal 50 karakter"),
  bio: z.string().trim().max(500, "Maksimal 500 karakter").optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;