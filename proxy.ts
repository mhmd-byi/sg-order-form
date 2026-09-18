import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "sg_session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET environment variable");
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const loginUrl = new URL("/login", request.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/users") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/orders", request.url));
    }

    if (payload.role === "artisan") {
      if (pathname === "/orders/new") {
        return NextResponse.redirect(new URL("/orders", request.url));
      }
      // Full order-detail pages carry customer/lab/advance-payment info artisans
      // shouldn't see — send them to the docket (particulars/remarks only) instead.
      const detailMatch = pathname.match(/^\/orders\/([^/]+)$/);
      if (detailMatch) {
        return NextResponse.redirect(new URL(`${pathname}/docket`, request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
