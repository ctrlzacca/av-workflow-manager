import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const publicFiles = [
  "/manifest.json",
  "/manifest.webmanifest",
  "/sw.js",
];

if (publicFiles.includes(req.nextUrl.pathname)) {
  return NextResponse.next();
}

const isAuthPage =
  req.nextUrl.pathname.startsWith("/login") ||
  req.nextUrl.pathname.startsWith("/register") ||
  req.nextUrl.pathname.startsWith("/splash") ||
  req.nextUrl.pathname.startsWith("/reset-password");

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|manifest\\.json|manifest\\.webmanifest|sw\\.js).*)",
  ],
};