import { NextResponse } from "next/server";
import { createServerClientScoped } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/site-url";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"), "/");

  if (code) {
    const supabase = await createServerClientScoped();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=invalid_auth`);
}