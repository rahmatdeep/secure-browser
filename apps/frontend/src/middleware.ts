import { NextResponse, type NextRequest } from "next/server";

export const GUEST_COOKIE_NAME = "sb_guest_token";

export function middleware(request: NextRequest) {
  const existingToken = request.cookies.get(GUEST_COOKIE_NAME)?.value;

  if (existingToken) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-guest-token", existingToken);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const newToken = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-guest-token", newToken);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set(GUEST_COOKIE_NAME, newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
