"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClientScoped } from "@/lib/supabase/browser";
import { signOut } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface UserState {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup menu saat klik di luar.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Reaksi menyeluruh terhadap perubahan sesi.
  useEffect(() => {
    const supabase = (() => {
      try {
        return createBrowserClientScoped();
      } catch {
        // Supabase belum dikonfigurasi → tampilkan status "belum login".
        setLoading(false);
        return null;
      }
    })();
    if (!supabase) return;
    const client = supabase;

    async function load() {
      const {
        data: { user: u },
      } = await client.auth.getUser();
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await client
        .from("profiles")
        .select("username, display_name, avatar_url, role")
        .eq("id", u.id)
        .maybeSingle();
      setUser({
        id: u.id,
        username: profile?.username ?? "user",
        displayName: profile?.display_name ?? "Pengguna",
        avatarUrl: profile?.avatar_url ?? null,
        role: profile?.role ?? "user",
      });
      setLoading(false);
    }

    void load();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  // Belum login.
  if (!loading && !user) {
    return (
      <Link
        href="/login"
        className="hidden rounded-md border border-ink-600 px-4 py-1.5 text-sm font-medium text-paper-100 transition-colors hover:border-gold-400 hover:text-gold-400 sm:inline-flex"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {loading ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-800">
          <Spinner className="h-4 w-4" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Menu akun"
          className="flex items-center gap-2 rounded-full p-0.5 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <Avatar name={user?.displayName ?? ""} src={user?.avatarUrl ?? undefined} size="sm" />
        </button>
      )}

      {/* Dropdown */}
      {open && user ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-ink-700 bg-ink-900/95 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <div className="border-b border-ink-700 px-4 py-3">
            <p className="truncate text-sm font-semibold text-paper-50">{user.displayName}</p>
            <p className="truncate text-xs text-ink-400">@{user.username}</p>
          </div>

          <div className="p-1.5 text-sm">
            <MenuLink href="/account/profile" onClick={() => setOpen(false)}>
              Profil saya
            </MenuLink>
            {user.role === "admin" ? (
              <MenuLink href="/admin" onClick={() => setOpen(false)}>
                Admin panel
              </MenuLink>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                "text-red-300 hover:bg-ink-800",
              )}
            >
              {signingOut ? <Spinner className="h-4 w-4" /> : "Keluar"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-paper-200 transition-colors hover:bg-ink-800 hover:text-paper-50"
    >
      {children}
    </Link>
  );
}