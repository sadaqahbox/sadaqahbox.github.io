/**
 * PDF Generation Utilities
 * Shared functions for generating collection receipt PDFs
 * Elegant, minimal design with refined Islamic ornamentation
 */

import { jsPDF } from "jspdf";

/**
 * Preferred currency info for conversion display
 */
export interface PreferredCurrencyInfo {
  code: string;
  name: string;
  symbol?: string | null;
  usdValue?: number | null;
}

/**
 * Conversion data stored in collection metadata
 */
export interface CollectionConversionData {
  currencyId: string;
  code: string;
  name: string;
  symbol?: string | null;
  value: number;
  rate: number;
}

/**
 * Collection metadata interface
 */
export interface CollectionMetadata {
  conversions?: CollectionConversionData[];
  preferredCurrencyId?: string;
  preferredCurrencyCode?: string;
}

/**
 * Collection data interface for PDF generation
 */
export interface CollectionPDFData {
  id: string;
  totalValue: number;
  emptiedAt: string;
  totalValueExtra?: Record<string, { total: number; code: string; name: string }> | null;
  currency?: {
    code: string;
    name?: string | null;
    symbol?: string | null;
    usdValue?: number | null;
  } | null;
  currencyId: string;
  metadata?: CollectionMetadata | null;
}

/**
 * A5 page dimensions and margins
 */
const PAGE_WIDTH = 148;
const PAGE_HEIGHT = 210;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 20;
const CONTENT_END = PAGE_HEIGHT - MARGIN_BOTTOM;
const CONTENT_START = MARGIN_TOP + 42;

// Refined color palette
const COLOR_PRIMARY: [number, number, number] = [38, 84, 64]; // Deep elegant green
const COLOR_GOLD: [number, number, number] = [168, 138, 72]; // Muted gold
const COLOR_TEXT: [number, number, number] = [45, 45, 45];
const COLOR_TEXT_LIGHT: [number, number, number] = [110, 110, 110];
const COLOR_TEXT_MUTED: [number, number, number] = [150, 150, 150];
const COLOR_CREAM: [number, number, number] = [253, 252, 250];

/**
 * Format a date for display in PDF
 */
export function formatDateForPDF(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

/**
 * Format a date short for PDF
 */
export function formatDateShortForPDF(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

/**
 * Format a number for display, removing trailing zeros
 */
export function formatValueForPDF(value: number): string {
  return value.toFixed(5).replace(/\.?0+$/, "");
}

/**
 * Get currency code from collection data
 */
export function getCurrencyCode(collection: CollectionPDFData): string {
  return collection.currency?.code || collection.currencyId;
}

/**
 * Convert value between currencies using USD rates
 */
export function convertCurrency(
  value: number,
  fromUsdValue: number | null | undefined,
  toUsdValue: number | null | undefined
): number | null {
  if (!fromUsdValue || !toUsdValue || fromUsdValue === 0) return null;
  return value * (toUsdValue / fromUsdValue);
}

/**
 * Add logo image to PDF
 */
async function addLogoToPDF(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  _color: [number, number, number]
): Promise<void> {
  try {
    // Fetch the logo image and convert to base64
    const response = await fetch('/android-chrome-256x256.png');
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const height = width * 1; // Maintain aspect ratio
    doc.addImage(base64, 'PNG', x, y, width, height);
  } catch {
    // Fallback: draw simple crescent if image fails
    drawLogoFallback(doc, x, y, width, _color);
  }
}

/**
 * Fallback logo drawing
 */
function drawLogoFallback(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  color: [number, number, number]
): void {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.3);

  const cx = x + size * 0.5;
  const cy = y + size * 0.5;
  const r = size * 0.35;

  // Draw crescent moon
  for (let angle = Math.PI * 0.3; angle <= Math.PI * 1.7; angle += 0.1) {
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle) * 0.9;
    if (angle === Math.PI * 0.3) {
      doc.moveTo(px, py);
    } else {
      doc.lineTo(px, py);
    }
  }

  const innerR = r * 0.6;
  const offset = r * 0.3;
  for (let angle = Math.PI * 1.6; angle >= Math.PI * 0.4; angle -= 0.1) {
    const px = cx - offset + innerR * Math.cos(angle);
    const py = cy + innerR * Math.sin(angle) * 0.9;
    doc.lineTo(px, py);
  }
  doc.stroke();

  // Star
  const starX = cx - r * 0.1;
  const starY = cy - r * 0.3;
  doc.circle(starX, starY, size * 0.12, "F");
}

/**
 * Draw elegant ornamental flourish divider
 */
function drawOrnamentalDivider(
  doc: jsPDF,
  y: number,
  x1: number = 25,
  x2: number = PAGE_WIDTH - 25,
  color: [number, number, number] = COLOR_GOLD
): void {
  const centerX = (x1 + x2) / 2;
  const width = x2 - x1;

  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.3);

  // Left flourish
  const leftEnd = centerX - 12;
  doc.line(x1, y, leftEnd - 5, y);

  // Small decorative curl on left
  for (let i = 0; i <= 8; i++) {
    const angle = (i / 8) * Math.PI;
    const r = 2;
    const px = leftEnd - 3 + r * Math.cos(angle + Math.PI);
    const py = y + r * Math.sin(angle) * 0.5;
    if (i === 0) {
      doc.moveTo(px, py);
    } else {
      doc.lineTo(px, py);
    }
  }
  doc.stroke();

  // Center ornament - small diamond shape
  doc.setFillColor(color[0], color[1], color[2]);
  const diamondSize = 2;
  doc.triangle(centerX, y - diamondSize, centerX - diamondSize, y, centerX + diamondSize, y, "F");
  doc.triangle(centerX, y + diamondSize, centerX - diamondSize, y, centerX + diamondSize, y, "F");

  // Small center dot
  doc.circle(centerX, y, 0.8, "F");

  // Right flourish (mirror of left)
  const rightEnd = centerX + 12;
  doc.line(rightEnd + 5, y, x2, y);

  // Small decorative curl on right
  for (let i = 0; i <= 8; i++) {
    const angle = (i / 8) * Math.PI;
    const r = 2;
    const px = rightEnd + 3 + r * Math.cos(angle);
    const py = y + r * Math.sin(angle) * 0.5;
    if (i === 0) {
      doc.moveTo(px, py);
    } else {
      doc.lineTo(px, py);
    }
  }
  doc.stroke();
}

/**
 * Draw simple elegant line with diamond center
 */
function drawElegantLine(
  doc: jsPDF,
  y: number,
  x1: number = 20,
  x2: number = PAGE_WIDTH - 20,
  color: [number, number, number] = COLOR_GOLD
): void {
  const centerX = (x1 + x2) / 2;

  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.3);

  // Lines on each side
  doc.line(x1, y, centerX - 4, y);
  doc.line(centerX + 4, y, x2, y);

  // Center diamond
  doc.setFillColor(color[0], color[1], color[2]);
  doc.triangle(centerX, y - 2, centerX - 2, y, centerX + 2, y, "F");
  doc.triangle(centerX, y + 2, centerX - 2, y, centerX + 2, y, "F");
}

/**
 * Add header to all pages
 */
async function addHeaderToAllPages(doc: jsPDF, title: string): Promise<void> {
  const pageCount = (doc as unknown as { getNumberOfPages(): number }).getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Elegant top border - thicker gold line
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(0, 0, PAGE_WIDTH, 3, "F");

    // Logo on the left side - bigger size
    await addLogoToPDF(doc, 18, 10, 24, COLOR_GOLD);

    // App name with elegant spacing (to the right of logo)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("Sadaqah Box", 46, 18);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(COLOR_TEXT_LIGHT[0], COLOR_TEXT_LIGHT[1], COLOR_TEXT_LIGHT[2]);
    doc.text("Tracking your charitable giving", 46, 24);

    // Report title below the subtitle
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(title, 46, 32);
  }
}

/**
 * Add footer to all pages
 */
function addFooterToAllPages(doc: jsPDF, collectionId?: string): void {
  const pageCount = (doc as unknown as { getNumberOfPages(): number }).getNumberOfPages();
  const githubUrl = "github.com/sadaqahbox";

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Elegant divider above footer
    drawElegantLine(doc, PAGE_HEIGHT - 22);

    // Bottom gold border
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(0, PAGE_HEIGHT - 3, PAGE_WIDTH, 3, "F");

    // Hadith quote
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(COLOR_TEXT_LIGHT[0], COLOR_TEXT_LIGHT[1], COLOR_TEXT_LIGHT[2]);
    const quote = '"The believer\'s shade on the Day of Resurrection will be his charity" — Tirmidhi';
    doc.text(quote, PAGE_WIDTH / 2, PAGE_HEIGHT - 15, { align: "center" });

    // Page number
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - 20, PAGE_HEIGHT - 7, { align: "right" });

    // Collection ID if provided (only on last page)
    if (collectionId) {
      doc.setFontSize(8);
      doc.text(`ID: ${collectionId.slice(-12)}`, 20, PAGE_HEIGHT - 7);
    }

    // GitHub link in gold footer area - small, centered
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(githubUrl, PAGE_WIDTH / 2, PAGE_HEIGHT - 1, { align: "center" });
  }
}

/**
 * Check if we need a new page and add one if necessary
 */
function ensureSpace(doc: jsPDF, currentY: number, requiredHeight: number): number {
  if (currentY + requiredHeight > CONTENT_END) {
    doc.addPage();
    doc.setFillColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
    return CONTENT_START;
  }
  return currentY;
}

/**
 * Generate extra values section - elegant compact layout
 */
function generateExtraValuesSection(
  doc: jsPDF,
  extraValues: Record<string, { total: number; code: string; name: string }>,
  startY: number,
  label: string = "Other Sadaqah"
): number {
  if (!extraValues || Object.keys(extraValues).length === 0) return startY;

  const items = Object.values(extraValues);
  const itemHeight = 9;
  const requiredHeight = items.length * itemHeight + 28;

  let yPos = ensureSpace(doc, startY, requiredHeight);

  if (yPos !== startY || yPos + requiredHeight > CONTENT_END) {
    return generateExtraValuesSectionMultiPage(doc, items, yPos, label);
  }

  // Section title with elegant styling and decorative underline
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(label, 20, yPos);

  // Decorative gold underline for section title
  const titleWidth = doc.getTextWidth(label);
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPos + 2, 20 + titleWidth, yPos + 2);

  yPos += 14;

  items.forEach((extra, index) => {
    const itemY = yPos + index * itemHeight;
    const textY = itemY + 2.5; // Center text vertically in row

    // Subtle alternating background for every other item
    if (index % 2 === 0) {
      doc.setFillColor(250, 248, 245);
      doc.roundedRect(18, itemY - 3.5, PAGE_WIDTH - 36, itemHeight - 1.5, 2, 2, "F");
    }

    // Left accent line (gold)
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(20, itemY - 1.5, 0.8, 5, "F");

    // Currency code - small, muted
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    doc.text(extra.code, 24, textY);

    // Value - prominent, primary color
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    const valueStr = formatValueForPDF(extra.total);
    doc.text(valueStr, 48, textY);

    // Currency name - normal weight, right side
    const valueWidth = doc.getTextWidth(valueStr);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT_LIGHT[0], COLOR_TEXT_LIGHT[1], COLOR_TEXT_LIGHT[2]);
    doc.text(extra.name, 52 + valueWidth, textY);
  });

  return yPos + items.length * itemHeight + 8;
}

/**
 * Generate extra values section across multiple pages
 */
function generateExtraValuesSectionMultiPage(
  doc: jsPDF,
  items: { total: number; code: string; name: string }[],
  startY: number,
  label: string
): number {
  const itemHeight = 9;
  let yPos = startY;
  let itemIndex = 0;
  let isFirstPage = true;

  while (itemIndex < items.length) {
    const headerHeight = isFirstPage ? 20 : 5;
    const availableHeight = CONTENT_END - yPos - headerHeight - 10;
    const itemsPerPage = Math.floor(availableHeight / itemHeight);
    const itemsToRender = Math.min(itemsPerPage, items.length - itemIndex);

    if (itemsToRender <= 0) {
      doc.addPage();
      doc.setFillColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
      yPos = CONTENT_START;
      isFirstPage = false;
      continue;
    }

    if (isFirstPage) {
      // Section title with elegant styling and decorative underline
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text(label, 20, yPos);

      // Decorative gold underline for section title
      const titleWidth = doc.getTextWidth(label);
      doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      doc.setLineWidth(0.5);
      doc.line(20, yPos + 2, 20 + titleWidth, yPos + 2);

      yPos += 14;
    } else {
      yPos += 5;
    }

    for (let i = 0; i < itemsToRender; i++) {
      const currentIndex = itemIndex + i;
      const extra = items[currentIndex]!;
      const itemY = yPos + i * itemHeight;
      const textY = itemY + 2.5; // Center text vertically in row

      // Subtle alternating background for every other item
      if (currentIndex % 2 === 0) {
        doc.setFillColor(250, 248, 245);
        doc.roundedRect(18, itemY - 3.5, PAGE_WIDTH - 36, itemHeight - 1.5, 2, 2, "F");
      }

      // Left accent line (gold)
      doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      doc.rect(20, itemY - 1.5, 0.8, 5, "F");

      // Currency code - small, muted
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
      doc.text(extra.code, 24, textY);

      // Value - prominent, primary color
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      const valueStr = formatValueForPDF(extra.total);
      doc.text(valueStr, 48, textY);

      // Currency name - normal weight, right side
      const valueWidth = doc.getTextWidth(valueStr);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLOR_TEXT_LIGHT[0], COLOR_TEXT_LIGHT[1], COLOR_TEXT_LIGHT[2]);
      doc.text(extra.name, 52 + valueWidth, textY);
    }

    itemIndex += itemsToRender;
    yPos += itemsToRender * itemHeight + 8;

    if (itemIndex < items.length) {
      doc.addPage();
      doc.setFillColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
      yPos = CONTENT_START;
      isFirstPage = false;
    }
  }

  return yPos + 5;
}

/**
 * Generate a single collection receipt PDF
 */
export async function generateCollectionReceiptPDF(
  collection: CollectionPDFData,
  boxName: string,
  preferredCurrency?: PreferredCurrencyInfo | null,
  options: {
    label?: string;
    title?: string;
  } = {}
): Promise<string> {
  const { label = "Total Sadaqah", title = "Collection Report" } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  // Clean cream background
  doc.setFillColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  let yPos = CONTENT_START + 8;

  // Box info section - clean, no box
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT_LIGHT[0], COLOR_TEXT_LIGHT[1], COLOR_TEXT_LIGHT[2]);
  doc.text(`Box: ${boxName}`, 20, yPos);

  yPos += 6;
  doc.text(`Date: ${formatDateForPDF(collection.emptiedAt)}`, 20, yPos);

  yPos += 20;

  const currencyCode = getCurrencyCode(collection);

  // Value label
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(label, 20, yPos);

  yPos += 10;

  // Main value - prominent, left-aligned, no box background
  // Format: "2.56291 Gold (XAU)" with code in smaller font
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);

  const currencyName = collection.currency?.name || currencyCode;
  const valueText = `${formatValueForPDF(collection.totalValue)} ${currencyName}`;
  doc.text(valueText, 20, yPos);

  // Currency code in smaller font
  const valueTextWidth = doc.getTextWidth(valueText);
  doc.setFontSize(12);
  doc.setTextColor(COLOR_TEXT_LIGHT[0], COLOR_TEXT_LIGHT[1], COLOR_TEXT_LIGHT[2]);
  doc.text(` (${currencyCode})`, 20 + valueTextWidth, yPos);

  yPos += 16;

  // Reset text color for subsequent content
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

  // Converted value section - no boxes
  const conversions = collection.metadata?.conversions || [];
  const preferredConversion = preferredCurrency
    ? conversions.find(c => c.code === preferredCurrency.code)
    : undefined;

  const storedPreferredCode = collection.metadata?.preferredCurrencyCode;
  const storedPreferredConversion = storedPreferredCode && storedPreferredCode !== currencyCode
    ? conversions.find(c => c.code === storedPreferredCode) || preferredConversion
    : preferredConversion;

  const conversionToShow = storedPreferredConversion || preferredConversion;

  if (conversionToShow && conversionToShow.code !== currencyCode) {
    yPos = ensureSpace(doc, yPos, 30);

    // "Approximately" label
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(COLOR_TEXT_LIGHT[0], COLOR_TEXT_LIGHT[1], COLOR_TEXT_LIGHT[2]);
    doc.text(`Approximately in ${conversionToShow.name}:`, 20, yPos);

    yPos += 7;

    // Converted value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    const prefSymbol = conversionToShow.symbol || "";
    doc.text(`${prefSymbol}${formatValueForPDF(conversionToShow.value)} ${conversionToShow.code}`, 20, yPos);

    yPos += 6;

    // Exchange rate note
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    doc.text(`1 ${currencyCode} = ${formatValueForPDF(conversionToShow.rate)} ${conversionToShow.code}`, 20, yPos);

    yPos += 16;
  }

  // Extra values if any
  if (collection.totalValueExtra && Object.keys(collection.totalValueExtra).length > 0) {
    yPos = generateExtraValuesSection(doc, collection.totalValueExtra, yPos);
  }

  // Add header and footer
  await addHeaderToAllPages(doc, title);
  addFooterToAllPages(doc, collection.id);

  return doc.output("dataurlstring");
}

/**
 * Generate a PDF for a single collection
 */
export async function generateSingleCollectionPDF(
  collection: CollectionPDFData,
  boxName: string = "Collection",
  preferredCurrency?: PreferredCurrencyInfo | null
): Promise<string> {
  return generateCollectionReceiptPDF(collection, boxName, preferredCurrency, {
    label: "Total Sadaqah",
    title: "Collection Report",
  });
}

/**
 * Generate a PDF report for all collections
 */
export async function generateAllCollectionsPDF(
  collections: CollectionPDFData[],
  boxName: string = "Collection Report",
  _preferredCurrency?: PreferredCurrencyInfo | null
): Promise<string> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  // Clean cream background
  doc.setFillColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  let yPos = CONTENT_START + 5;

  // Summary section - no boxes, clean layout
  const totalCollected = collections.reduce((sum, c) => sum + c.totalValue, 0);
  const baseCurrency = collections.length > 0 ? getCurrencyCode(collections[0]!) : "XAU";

  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Collections:`, 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(`${collections.length}`, 65, yPos);

  yPos += 10;
  doc.setFont("helvetica", "normal");
  doc.text(`Total Value:`, 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(`${formatValueForPDF(totalCollected)} ${baseCurrency}`, 65, yPos);

  yPos += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);

  yPos += 12;

  // Divider
  drawElegantLine(doc, yPos, 20, PAGE_WIDTH - 20, COLOR_GOLD);
  yPos += 10;

  // Table header - clean, no background
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("Date", 20, yPos);
  doc.text("Value", 70, yPos);
  doc.text("Currency", 108, yPos);

  // Line under headers
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.3);
  doc.line(20, yPos + 2, PAGE_WIDTH - 20, yPos + 2);

  yPos += 10;

  // Table rows
  doc.setFont("helvetica", "normal");

  collections.forEach((collection) => {
    if (yPos > CONTENT_END - 10) {
      doc.addPage();
      doc.setFillColor(COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2]);
      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

      yPos = CONTENT_START;

      // Table header on new page
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text("Date", 20, yPos);
      doc.text("Value", 70, yPos);
      doc.text("Currency", 108, yPos);
      doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      doc.setLineWidth(0.3);
      doc.line(20, yPos + 2, PAGE_WIDTH - 20, yPos + 2);
      yPos += 10;
    }

    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.setFontSize(9);
    doc.text(formatDateShortForPDF(collection.emptiedAt), 20, yPos);
    doc.text(formatValueForPDF(collection.totalValue), 70, yPos);
    doc.text(getCurrencyCode(collection), 108, yPos);

    yPos += 8;
  });

  // Add header and footer
  await addHeaderToAllPages(doc, boxName);
  addFooterToAllPages(doc);

  return doc.output("dataurlstring");
}
