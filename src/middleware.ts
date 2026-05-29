import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin có quyền truy cập tất cả
    if (token?.role === "admin") {
      return NextResponse.next();
    }

    // Role Sale
    if (token?.role === "sale") {
      if (path.startsWith("/dashboard") || path.startsWith("/settings") || path.startsWith("/users")) {
        return NextResponse.redirect(new URL("/orders", req.url));
      }
    }

    // Role Kho
    if (token?.role === "kho") {
      if (!path.startsWith("/orders") && !path.startsWith("/products")) {
        return NextResponse.redirect(new URL("/orders", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)"],
};
