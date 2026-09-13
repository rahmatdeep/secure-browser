"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import axios from "axios";
import { getGuestToken } from "@/lib/auth";

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export async function createSession(formData: FormData) {
  const url = formData.get("url") as string;
  if (!url) {
    throw new Error("URL is required");
  }

  let redirectUrl: string | null = null;

  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const guestToken = await getGuestToken();

    const response = await axios.post(
      `${API_BASE}/api/containers/create`,
      { url, guestToken },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "x-guest-token": guestToken,
        },
      }
    );

    const data = response.data;

    if (data.success) {
      revalidatePath("/");
      redirectUrl = `/session/${data.data.containerId}`;
    } else {
      throw new Error(data.error || "Failed to create session");
    }
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function getActiveSessions() {
  try {
    const guestToken = await getGuestToken();
    const response = await axios.get(`${API_BASE}/api/containers`, {
      headers: {
        "Cache-Control": "no-cache",
        "x-guest-token": guestToken,
      },
    });

    return response.data.success ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

export async function stopSession(containerId: string) {
  try {
    const guestToken = await getGuestToken();
    const response = await axios.delete(
      `${API_BASE}/api/containers/${containerId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-guest-token": guestToken,
        },
      }
    );

    if (response.data.success) {
      revalidatePath("/");
    }
    return response.data;
  } catch (error) {
    console.error("Error stopping session:", error);
    throw error;
  }
}
