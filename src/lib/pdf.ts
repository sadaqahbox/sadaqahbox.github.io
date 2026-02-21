/**
 * PDF Generation Utilities
 * Shared functions for generating collection receipt PDFs
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
    symbol?: string | null;
    usdValue?: number | null;
  } | null;
  currencyId: string;
  metadata?: CollectionMetadata | null;
}

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
  // Convert: value * (toUsdValue / fromUsdValue)
  return value * (toUsdValue / fromUsdValue);
}

/**
 * Generate the common header section of a collection PDF
 */
function generatePDFHeader(doc: jsPDF, title: string, boxName: string): void {
  // Decorative top bar
  doc.setFillColor(45, 125, 90); // Primary green color
  doc.rect(0, 0, 148, 8, "F");

  // Header - App name with icon indicator
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 125, 90);
  doc.text("SadaqahBox", 20, 22);

  // Decorative line
  doc.setDrawColor(45, 125, 90);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 128, 25);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text(title, 20, 35);

  // Box name
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Box: ${boxName}`, 20, 42);
}

/**
 * Generate the common footer section of a collection PDF
 */
function generatePDFFooter(doc: jsPDF, collectionId: string, pageY: number = 195): void {
  // Decorative bottom bar
  doc.setFillColor(240, 240, 240);
  doc.rect(0, pageY - 12, 148, 0.5, "F");

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text("SadaqahBox - Tracking your charitable giving", 20, pageY - 5);
  
  // Collection ID in smaller, lighter text
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`ID: ${collectionId.slice(-12)}`, 20, pageY);
}

/**
 * Generate extra values section of a collection PDF
 */
function generateExtraValuesSection(
  doc: jsPDF,
  extraValues: Record<string, { total: number; code: string; name: string }>,
  startY: number,
  label: string = "Other Sadaqah:"
): number {
  if (!extraValues || Object.keys(extraValues).length === 0) return startY;

  // Section background
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(15, startY - 5, 118, Object.keys(extraValues).length * 8 + 20, 3, 3, "F");

  // Section title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 125, 90);
  doc.text(label, 20, startY + 5);

  let yPos = startY + 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  
  Object.values(extraValues).forEach((extra) => {
    doc.text(
      `• ${formatValueForPDF(extra.total)} ${extra.code} (${extra.name})`,
      25,
      yPos
    );
    yPos += 8;
  });

  return yPos + 5;
}

/**
 * Generate a single collection receipt PDF
 * 
 * @param collection - Collection data
 * @param boxName - Name of the box
 * @param preferredCurrency - User's preferred currency for conversion
 * @param options.label - Optional custom label for the total value (default: "Total Sadaqah:")
 * @returns Base64 data URL of the PDF
 */
export function generateCollectionReceiptPDF(
  collection: CollectionPDFData,
  boxName: string,
  preferredCurrency?: PreferredCurrencyInfo | null,
  options: {
    label?: string;
    title?: string;
  } = {}
): string {
  const { label = "Total Sadaqah:", title = "Collection Report" } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  // Header
  generatePDFHeader(doc, title, boxName);

  // Date with icon indicator
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${formatDateForPDF(collection.emptiedAt)}`, 20, 50);

  // Main value section with background highlight
  const currencyCode = getCurrencyCode(collection);

  // Value label
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(label, 20, 65);

  // Main value - Large and prominent
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 125, 90);
  doc.text(`${formatValueForPDF(collection.totalValue)} ${currencyCode}`, 20, 80);

  let yPos = 92;

  // Converted value section - use stored conversions from metadata
  const conversions = collection.metadata?.conversions || [];
  const preferredConversion = preferredCurrency
    ? conversions.find(c => c.code === preferredCurrency.code)
    : undefined;

  // Also check if the preferred currency was stored as the preferred one at collection time
  const storedPreferredCode = collection.metadata?.preferredCurrencyCode;
  const storedPreferredConversion = storedPreferredCode && storedPreferredCode !== currencyCode
    ? conversions.find(c => c.code === storedPreferredCode) || preferredConversion
    : preferredConversion;

  const conversionToShow = storedPreferredConversion || preferredConversion;

  if (conversionToShow && conversionToShow.code !== currencyCode) {
    // Conversion box
    doc.setFillColor(245, 250, 247);
    doc.roundedRect(15, yPos - 5, 118, 32, 4, 4, "F");
    
    // "Approximately" label
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Approximately in ${conversionToShow.name}:`, 25, yPos + 5);

    // Converted value
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    const prefSymbol = conversionToShow.symbol || "";
    doc.text(`${prefSymbol}${formatValueForPDF(conversionToShow.value)} ${conversionToShow.code}`, 25, yPos + 18);

    // Exchange rate note
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text(`1 ${currencyCode} ≈ ${formatValueForPDF(conversionToShow.rate)} ${conversionToShow.code}`, 25, yPos + 25);

    yPos += 40;
  }

  // Extra values if any
  if (collection.totalValueExtra && Object.keys(collection.totalValueExtra).length > 0) {
    yPos = generateExtraValuesSection(doc, collection.totalValueExtra, yPos);
  }

  // Footer
  generatePDFFooter(doc, collection.id);

  // Return as base64 data URL
  return doc.output("dataurlstring");
}

/**
 * Generate a PDF for a single collection (alias for generateCollectionReceiptPDF)
 * with default labels suitable for viewing
 */
export function generateSingleCollectionPDF(
  collection: CollectionPDFData,
  boxName: string = "Collection",
  preferredCurrency?: PreferredCurrencyInfo | null
): string {
  return generateCollectionReceiptPDF(collection, boxName, preferredCurrency, {
    label: "Total Sadaqah:",
    title: "Collection Report",
  });
}

/**
 * Generate a PDF report for all collections
 * 
 * @param collections - Array of collection data
 * @param boxName - Name of the box or report title
 * @param preferredCurrency - User's preferred currency for conversion
 * @returns Base64 data URL of the PDF
 */
export function generateAllCollectionsPDF(
  collections: CollectionPDFData[],
  boxName: string = "Collection Report",
  preferredCurrency?: PreferredCurrencyInfo | null
): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  // Decorative top bar
  doc.setFillColor(45, 125, 90);
  doc.rect(0, 0, 148, 8, "F");

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 125, 90);
  doc.text("SadaqahBox", 20, 20);

  doc.setDrawColor(45, 125, 90);
  doc.setLineWidth(0.5);
  doc.line(20, 23, 128, 23);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text(boxName, 20, 32);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 39);

  // Summary section with background
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(15, 44, 118, 22, 3, 3, "F");

  const totalCollected = collections.reduce((sum, c) => sum + c.totalValue, 0);
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Collections:`, 20, 52);
  doc.setFont("helvetica", "bold");
  doc.text(`${collections.length}`, 60, 52);

  doc.setFont("helvetica", "normal");
  doc.text(`Total Value:`, 20, 60);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 125, 90);
  
  // Show first collection's currency as the base currency
  const baseCurrency = collections.length > 0 ? getCurrencyCode(collections[0]!) : "XAU";
  doc.text(`${formatValueForPDF(totalCollected)} ${baseCurrency}`, 60, 60);

  // Table header
  let yPos = 75;
  doc.setFillColor(45, 125, 90);
  doc.roundedRect(15, yPos - 6, 118, 10, 2, 2, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Date", 20, yPos);
  doc.text("Value", 70, yPos);
  doc.text("Currency", 100, yPos);

  yPos += 10;

  // Table rows
  doc.setFont("helvetica", "normal");
  let isAlternate = false;
  
  collections.forEach((collection, index) => {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
      
      // Header on new page
      doc.setFillColor(45, 125, 90);
      doc.roundedRect(15, yPos - 6, 118, 10, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Date", 20, yPos);
      doc.text("Value", 70, yPos);
      doc.text("Currency", 100, yPos);
      yPos += 10;
    }

    // Alternate row background
    if (isAlternate) {
      doc.setFillColor(248, 250, 248);
      doc.rect(15, yPos - 5, 118, 8, "F");
    }
    isAlternate = !isAlternate;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.text(formatDateShortForPDF(collection.emptiedAt), 20, yPos);
    doc.text(formatValueForPDF(collection.totalValue), 70, yPos);
    doc.text(getCurrencyCode(collection), 100, yPos);

    yPos += 8;
  });

  // Footer
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 195, 148, 0.5, "F");
  
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text("SadaqahBox - Tracking your charitable giving", 20, 202);

  // Return as base64 data URL
  return doc.output("dataurlstring");
}
