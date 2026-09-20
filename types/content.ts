export interface Project {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  cover?: string | null;
  tech: string[];
  githubUrl?: string | null;
  demoUrl?: string | null;
  featured: boolean;
  createdAt: string;
}

export interface ProfileSummary {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface Post {
  id: string;
  author: ProfileSummary;
  title?: string | null;
  content: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  likes: number;
  comments: number;
  createdAt: string;
}

export type ProductType = "digital" | "topup" | "merchandise" | "service" | "other";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency: string;
  cover?: string | null;
  stock: number;
  type: ProductType;
  featured: boolean;
}
