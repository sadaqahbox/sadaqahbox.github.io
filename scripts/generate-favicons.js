#!/usr/bin/env node

/**
 * Favicon Generation Script
 * 
 * This script uses the `favicons` package to generate all necessary favicon
 * files from the logo.svg source. It creates icons for various platforms
 * including web browsers, iOS, Android, and Windows.
 */

import favicons from 'favicons';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_FILE = path.join(ROOT_DIR, 'public', 'logo.svg');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public');

/**
 * Configuration for favicon generation
 * @see https://www.npmjs.com/package/favicons#configuration
 */
const configuration = {
  path: "/",
  appName: "Sadaqah Box",
  appShortName: "Sadaqah Box",
  appDescription: "Track Your Charity & Sadaqah Contributions",
  developerName: "Sadaqah Box",
  developerURL: "https://sadaqahbox.com",
  dir: "auto",
  lang: "en-US",
  background: "#ffffff",
  theme_color: "#10b981",
  appleStatusBarStyle: "black-translucent",
  display: "standalone",
  orientation: "any",
  scope: "/",
  start_url: "/",
  version: "1.0",
  logging: false,
  pixel_art: false,
  loadManifestWithCredentials: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: false,
    favicons: true,
    windows: true,
    yandex: true,
  },
};

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function writeFile(filePath, content) {
  await fs.writeFile(filePath, content);
  console.log(`✓ Generated: ${path.relative(ROOT_DIR, filePath)}`);
}

async function generateFavicons() {
  console.log('🎨 Generating favicons from logo.svg...\n');

  try {
    // Check if source file exists
    try {
      await fs.access(SOURCE_FILE);
    } catch {
      console.error(`❌ Source file not found: ${SOURCE_FILE}`);
      process.exit(1);
    }

    // Generate favicons
    const response = await favicons(SOURCE_FILE, configuration);

    // Ensure output directory exists
    await ensureDirectoryExists(OUTPUT_DIR);

    // Write image files
    for (const image of response.images) {
      const filePath = path.join(OUTPUT_DIR, image.name);
      await writeFile(filePath, image.contents);
    }

    // Write files (manifests, browserconfig, etc.)
    for (const file of response.files) {
      const filePath = path.join(OUTPUT_DIR, file.name);
      await writeFile(filePath, file.contents);
    }

    // Print HTML for index.html
    console.log('\n📋 Add the following to your <head> in index.html:');
    console.log('---');
    response.html.forEach(line => console.log(line));
    console.log('---\n');

    console.log('✅ Favicon generation complete!');

  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons();
