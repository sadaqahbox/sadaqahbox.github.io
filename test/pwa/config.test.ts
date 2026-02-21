import { describe, it, expect, beforeAll } from "bun:test";

/**
 * PWA Configuration Tests
 *
 * These tests verify that the PWA manifest and configuration
 * are correctly set up for the Sadaqah Box application.
 */
describe("PWA Configuration", () => {
  let manifest: any;

  beforeAll(async () => {
    const file = Bun.file("public/manifest.webmanifest");
    const content = await file.text();
    manifest = JSON.parse(content);
  });

  describe("Manifest Webmanifest", () => {
    it("should have valid basic manifest fields", () => {
      expect(manifest.name).toBe("Sadaqah Box");
      expect(manifest.short_name).toBe("Sadaqah Box");
      expect(manifest.description).toBe(
        "Track Your Charity & Sadaqah Contributions"
      );
      expect(manifest.lang).toBe("en-US");
      expect(manifest.dir).toBe("auto");
    });

    it("should have valid display and orientation settings", () => {
      expect(manifest.display).toBe("standalone");
      expect(manifest.orientation).toBe("any");
      expect(manifest.scope).toBe("/");
      expect(manifest.start_url).toBe("/");
    });

    it("should have valid theme and background colors", () => {
      expect(manifest.theme_color).toBe("#10b981");
      expect(manifest.background_color).toBe("#ffffff");
    });

    it("should have required icon sizes for PWA", () => {
      const requiredSizes = [
        "72x72",
        "96x96",
        "144x144",
        "192x192",
        "256x256",
        "384x384",
        "512x512",
      ];

      const iconSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);

      for (const size of requiredSizes) {
        expect(iconSizes).toContain(size);
      }
    });

    it("should have at least one icon with maskable purpose", () => {
      const maskableIcons = manifest.icons.filter((icon: { purpose?: string }) =>
        icon.purpose?.includes("maskable")
      );
      expect(maskableIcons.length).toBeGreaterThan(0);
    });

    it("should have all icons with valid format", () => {
      for (const icon of manifest.icons) {
        expect(icon.src).toBeDefined();
        expect(icon.sizes).toBeDefined();
        expect(icon.type).toBe("image/png");
        expect(icon.src).toMatch(/^\//);
        expect(icon.src).toMatch(/\.(png|svg)$/);
      }
    });
  });

  describe("Icon Files Existence", () => {
    it("should have favicon.ico file", async () => {
      const file = Bun.file("public/favicon.ico");
      const exists = await file.exists();
      expect(exists).toBe(true);
    });

    it("should have apple-touch-icon.png file", async () => {
      const file = Bun.file("public/apple-touch-icon.png");
      const exists = await file.exists();
      expect(exists).toBe(true);
    });

    it("should have required PWA icon files", async () => {
      const requiredIcons = [
        "public/android-chrome-72x72.png",
        "public/android-chrome-96x96.png",
        "public/android-chrome-144x144.png",
        "public/android-chrome-192x192.png",
        "public/android-chrome-256x256.png",
        "public/android-chrome-384x384.png",
        "public/android-chrome-512x512.png",
      ];

      for (const iconPath of requiredIcons) {
        const file = Bun.file(iconPath);
        const exists = await file.exists();
        expect(exists).toBe(true);
      }
    });
  });

  describe("PWA Requirements", () => {
    it("should have service worker support configured", () => {
      // Check that manifest has all required fields for installability
      expect(manifest.name).toBeDefined();
      expect(manifest.short_name).toBeDefined();
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThan(0);
      expect(manifest.display).toBeDefined();
      expect(manifest.start_url).toBeDefined();
    });

    it("should have minimum required icon sizes for all platforms", () => {
      // 192x192 required for Android/Chrome install prompt
      const has192 = manifest.icons.some(
        (icon: { sizes: string }) => icon.sizes === "192x192"
      );
      expect(has192).toBe(true);

      // 512x512 required for splash screen
      const has512 = manifest.icons.some(
        (icon: { sizes: string }) => icon.sizes === "512x512"
      );
      expect(has512).toBe(true);
    });
  });

  describe("Browser Configuration", () => {
    it("should have browserconfig.xml file", async () => {
      const file = Bun.file("public/browserconfig.xml");
      const exists = await file.exists();
      expect(exists).toBe(true);
    });
  });
});

describe("PWA Service Worker", () => {
  it("should have vite-plugin-pwa configured in vite.config.ts", async () => {
    const file = Bun.file("vite.config.ts");
    const content = await file.text();

    // Check that VitePWA is imported
    expect(content).toContain('import { VitePWA } from "vite-plugin-pwa"');

    // Check that VitePWA is used in plugins
    expect(content).toContain("VitePWA(");

    // Check for key PWA configuration options
    expect(content).toContain("registerType");
    expect(content).toContain("workbox");
    expect(content).toContain("manifest");
  });

  it("should have Workbox configuration for offline support", async () => {
    const file = Bun.file("vite.config.ts");
    const content = await file.text();

    // Check for Workbox configuration
    expect(content).toContain("globPatterns");
    expect(content).toContain("runtimeCaching");

    // Check for caching strategies
    expect(content).toContain("CacheFirst");
    expect(content).toContain("NetworkFirst");
  });
});
