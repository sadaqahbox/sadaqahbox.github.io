/**
 * PDF Generation Utilities
 * Shared functions for generating collection receipt PDFs
 */

import { jsPDF } from "jspdf";

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
  } | null;
  currencyId: string;
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
 * Generate the common header section of a collection PDF
 */
function generatePDFHeader(doc: jsPDF, title: string, boxName: string): void {
  // Header - App name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SadaqahBox", 20, 20);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(title, 20, 30);

  // Box name
  doc.setFontSize(11);
  doc.text(`Box: ${boxName}`, 20, 42);
}

/**
 * Generate the common footer section of a collection PDF
 */
function generatePDFFooter(doc: jsPDF, collectionId: string): void {
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("SadaqahBox - Tracking your charitable giving", 20, 140);
  doc.text(`Collection ID: ${collectionId}`, 20, 146);
}

/**
 * Generate extra values section of a collection PDF
 */
function generateExtraValuesSection(
  doc: jsPDF,
  extraValues: Record<string, { total: number; code: string; name: string }>,
  label: string = "Additional Values:"
): void {
  if (!extraValues || Object.keys(extraValues).length === 0) return;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(label, 20, 92);

  let yPos = 100;
  Object.values(extraValues).forEach((extra) => {
    doc.text(
      `• ${formatValueForPDF(extra.total)} ${extra.code} (${extra.name})`,
      25,
      yPos
    );
    yPos += 6;
  });
}

/**
 * Generate a single collection receipt PDF
 * 
 * @param collection - Collection data
 * @param boxName - Name of the box
 * @param options.label - Optional custom label for the total value (default: "Total Sadaqah:")
 * @returns Base64 data URL of the PDF
 */
export function generateCollectionReceiptPDF(
  collection: CollectionPDFData,
  boxName: string,
  options: {
    label?: string;
    title?: string;
  } = {}
): string {
  const { label = "Total Sadaqah:", title = "Collection Details" } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  // Header
  generatePDFHeader(doc, title, boxName);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Date: ${formatDateForPDF(collection.emptiedAt)}`, 20, 50);

  // Value section
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(label, 20, 65);

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const currencyCode = getCurrencyCode(collection);
  doc.text(`${formatValueForPDF(collection.totalValue)} ${currencyCode}`, 20, 78);

  // Extra values if any
  if (collection.totalValueExtra) {
    generateExtraValuesSection(doc, collection.totalValueExtra);
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
  boxName: string = "Collection"
): string {
  return generateCollectionReceiptPDF(collection, boxName, {
    label: "Collected Amount:",
    title: "Collection Details",
  });
}

/**
 * Generate a PDF report for all collections
 * 
 * @param collections - Array of collection data
 * @param boxName - Name of the box or report title
 * @returns Base64 data URL of the PDF
 */
export function generateAllCollectionsPDF(
  collections: CollectionPDFData[],
  boxName: string = "Collection Report"
): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SadaqahBox", 20, 20);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(boxName, 20, 30);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 38);

  // Summary
  const totalCollected = collections.reduce((sum, c) => sum + c.totalValue, 0);
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(`Total Collections: ${collections.length}`, 20, 50);
  doc.text(`Total Value: ${formatValueForPDF(totalCollected)}`, 20, 58);

  // Table header
  let yPos = 70;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Date", 20, yPos);
  doc.text("Value", 70, yPos);
  doc.text("Currency", 100, yPos);

  doc.line(20, yPos + 2, 130, yPos + 2);
  yPos += 8;

  // Table rows
  doc.setFont("helvetica", "normal");
  collections.forEach((collection) => {
    if (yPos > 120) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(formatDateShortForPDF(collection.emptiedAt), 20, yPos);
    doc.text(formatValueForPDF(collection.totalValue), 70, yPos);
    doc.text(getCurrencyCode(collection), 100, yPos);

    yPos += 6;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("SadaqahBox - Tracking your charitable giving", 20, 140);

  // Return as base64 data URL
  return doc.output("dataurlstring");
}
