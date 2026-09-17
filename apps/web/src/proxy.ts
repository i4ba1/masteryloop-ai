import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPublicConfig } from "@/shared/config/public";

export async function proxy(request: NextRequest) {
  const config = getPublicConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/parent/:path*", "/admin/:path*", "/login"],
};
