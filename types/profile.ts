export type UserRole = "user" | "moderator" | "seller" | "admin";
export type UserStatus = "active" | "suspended" | "banned";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  social_links: Record<string, string> | null;
  education: unknown[] | null;
  skills: string[] | null;
  interests: string[] | null;
  created_at: string;
  updated_at: string;
}