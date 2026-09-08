import { ViewportDimensions } from "./types.js";

export const VIEWPORT_DESKTOP: ViewportDimensions = {
  width: 1280,
  height: 720,
};

export const VIEWPORT_MOBILE: ViewportDimensions = {
  width: 375,
  height: 667,
};

export const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function isMobileUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  return mobileRegex.test(userAgent);
}

export function getChromeUserAgent(isMobile: boolean): string {
  if (isMobile) {
    return "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36";
  } else {
    return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36";
  }
}

export function getViewport(isMobile: boolean): ViewportDimensions {
  return isMobile ? VIEWPORT_MOBILE : VIEWPORT_DESKTOP;
}
