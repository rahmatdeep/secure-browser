import { cookies } from "next/headers";

export const GUEST_COOKIE_NAME = "sb_guest_token";

export async function getGuestToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  if (existing) {
    return existing;
  }

  const newToken = crypto.randomUUID();
  try {
    cookieStore.set(GUEST_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    // In Server Components where cookie mutation is restricted, return generated token
  }

  return newToken;
}
