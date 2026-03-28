import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes: only teachers and admins
    if (pathname.startsWith("/admin")) {
      if (token?.role === "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Student routes: redirect teachers to admin
    if (
      ["/dashboard", "/articles", "/vocabulary", "/speaking", "/progress"].some(
        (p) => pathname.startsWith(p)
      )
    ) {
      if (token?.role === "TEACHER" || token?.role === "ADMIN") {
        // Teachers can also view student pages but default to admin
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
  matcher: [
    "/dashboard/:path*",
    "/articles/:path*",
    "/vocabulary/:path*",
    "/speaking/:path*",
    "/progress/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/parent/:path*",
  ],
};
