import { describe, it, expect } from "vitest";
import {
  isMobileUserAgent,
  getChromeUserAgent,
  getViewport,
  VIEWPORT_DESKTOP,
  VIEWPORT_MOBILE,
} from "../utils";

describe("@secure-browser/shared utils", () => {
  describe("isMobileUserAgent", () => {
    it("should identify iPhone user agent as mobile", () => {
      const iPhoneUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
      expect(isMobileUserAgent(iPhoneUA)).toBe(true);
    });

    it("should identify Android user agent as mobile", () => {
      const androidUA =
        "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";
      expect(isMobileUserAgent(androidUA)).toBe(true);
    });

    it("should identify iPad user agent as mobile", () => {
      const iPadUA =
        "Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
      expect(isMobileUserAgent(iPadUA)).toBe(true);
    });

    it("should identify macOS desktop Chrome as non-mobile", () => {
      const macChromeUA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      expect(isMobileUserAgent(macChromeUA)).toBe(false);
    });

    it("should identify Windows desktop Chrome as non-mobile", () => {
      const winChromeUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      expect(isMobileUserAgent(winChromeUA)).toBe(false);
    });

    it("should identify Linux desktop Firefox as non-mobile", () => {
      const linuxFirefoxUA =
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0";
      expect(isMobileUserAgent(linuxFirefoxUA)).toBe(false);
    });

    it("should return false for empty or undefined user agent", () => {
      expect(isMobileUserAgent("")).toBe(false);
      expect(isMobileUserAgent(undefined as any)).toBe(false);
      expect(isMobileUserAgent(null as any)).toBe(false);
    });
  });

  describe("getChromeUserAgent", () => {
    it("should return mobile Chrome user agent when isMobile is true", () => {
      const ua = getChromeUserAgent(true);
      expect(ua).toContain("Mobile Safari");
      expect(ua).toContain("Android");
    });

    it("should return desktop Linux Chrome user agent when isMobile is false", () => {
      const ua = getChromeUserAgent(false);
      expect(ua).toContain("X11; Linux x86_64");
      expect(ua).not.toContain("Mobile");
    });
  });

  describe("getViewport", () => {
    it("should return mobile viewport for mobile", () => {
      expect(getViewport(true)).toEqual(VIEWPORT_MOBILE);
    });

    it("should return desktop viewport for desktop", () => {
      expect(getViewport(false)).toEqual(VIEWPORT_DESKTOP);
    });
  });
});
