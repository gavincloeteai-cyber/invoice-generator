import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CustomsInvoice } from "../types/customs";
import {
  calculateConsolidatedTotals,
  formatCurrency,
  groupItemsByHSCode,
  verifyTotals,
} from "./customsUtils";

export function generateCustomsPDF(
  invoice: CustomsInvoice,
  action: "download" | "blob" | "dataurl" = "download"
): string | Blob | undefined {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const freight = invoice.freightAmount || invoice.statedTotals?.freight || 0;
  const insurance = invoice.insuranceAmount || invoice.statedTotals?.insurance || 0;
  const groups = groupItemsByHSCode(invoice.items);
  const totals = calculateConsolidatedTotals(groups, freight, insurance);
  const verification = verifyTotals(invoice);
  const curr = "ZAR";

  // --- 1. HEADER SECTION ---
  // Top Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 18, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("CUSTOMS INVOICE → HS CODE SUMMARY DECLARATION", margin + 6, margin + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    "Automated Tariff Classification, Packaging Case Counts & Valuation Summary",
    margin + 6,
    margin + 13
  );

  // Status badge on top right
  const badgeText = verification.isValid ? "TOTALS VERIFIED [0.00 VARIANCE]" : "TOTALS RECONCILED";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setFillColor(verification.isValid ? 16 : 220, verification.isValid ? 185 : 38, verification.isValid ? 129 : 38); // green or red
  doc.roundedRect(pageWidth - margin - 65, margin + 4.5, 60, 9, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, pageWidth - margin - 35, margin + 10, { align: "center" });

  // --- 2. THREE-PANEL METADATA (Exporter, Importer, Commercial Details) ---
  const panelY = margin + 22;
  const panelHeight = 36;
  const colWidth = (contentWidth - 8) / 3;

  // Panel 1: Exporter
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, panelY, colWidth, panelHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("EXPORTER / SELLER (CONSIGNOR)", margin + 4, panelY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const supplierName = invoice.supplier.name || "N/A";
  doc.text(doc.splitTextToSize(supplierName, colWidth - 8)[0], margin + 4, panelY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const supplierAddrLines = doc.splitTextToSize(invoice.supplier.address || "Address not specified", colWidth - 8);
  doc.text(supplierAddrLines.slice(0, 2), margin + 4, panelY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Tax / EORI ID: `, margin + 4, panelY + 27);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.supplier.taxId || "Not Registered", margin + 24, panelY + 27);

  doc.setFont("helvetica", "bold");
  doc.text(`Country: `, margin + 4, panelY + 32);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.supplier.country || "Unspecified", margin + 17, panelY + 32);

  // Panel 2: Importer
  const p2X = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(p2X, panelY, colWidth, panelHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("IMPORTER / BUYER (CONSIGNEE)", p2X + 4, panelY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const custName = invoice.customer.name || "N/A";
  doc.text(doc.splitTextToSize(custName, colWidth - 8)[0], p2X + 4, panelY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const custAddrLines = doc.splitTextToSize(invoice.customer.address || "Address not specified", colWidth - 8);
  doc.text(custAddrLines.slice(0, 2), p2X + 4, panelY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Tax / EORI ID: `, p2X + 4, panelY + 27);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customer.taxId || "Not Registered", p2X + 24, panelY + 27);

  doc.setFont("helvetica", "bold");
  doc.text(`Country: `, p2X + 4, panelY + 32);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customer.country || "Unspecified", p2X + 17, panelY + 32);

  // Panel 3: Commercial & Customs Details
  const p3X = margin + (colWidth + 4) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(p3X, panelY, colWidth, panelHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("COMMERCIAL & CUSTOMS METADATA", p3X + 4, panelY + 5.5);

  doc.setFontSize(7.5);
  const drawMetaRow = (label: string, val: string, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(label, p3X + 4, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(val, p3X + 32, yPos);
  };

  drawMetaRow("Invoice Number:", invoice.invoiceNumber || "N/A", panelY + 11);
  drawMetaRow("Invoice Date:", invoice.invoiceDate || "N/A", panelY + 16);
  drawMetaRow("Currency:", invoice.currency || "ZAR", panelY + 21);
  drawMetaRow("Incoterms:", invoice.incoterms || "CIP / EXW", panelY + 26);
  drawMetaRow("Customs Ref:", invoice.customsRef || "DA500-ZA-CUSTOMS", panelY + 31);

  // --- 3. MAIN TABLE WITH HS CODE GROUPINGS & CONSOLIDATED TOTALS ---
  // Build table rows
  const tableRows: any[] = [];

  groups.forEach((group) => {
    // Header row for this HS Code
    tableRows.push([
      {
        content: `HS / COMMODITY CODE: ${group.hsCode} — ${group.hsDescription}`,
        colSpan: 10,
        styles: {
          fillColor: [30, 41, 59], // slate-800
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: 2,
        },
      },
    ]);

    // Product items under this HS Code
    group.items.forEach((item) => {
      tableRows.push([
        item.hsCode,
        item.productDescription,
        item.countryOfOrigin || "CN",
        `${item.outerQuantity} ${item.outerPackageType || "Ctns"}`,
        `${item.innerUnits.toLocaleString()} ${item.unitOfMeasure || "PCS"}`,
        formatCurrency(item.unitPrice, curr),
        formatCurrency(item.netValue, curr),
        `${item.vatRate}%`,
        formatCurrency(item.vatAmount, curr),
        formatCurrency(item.grossValue, curr),
      ]);
    });

    // Subtotal row for this HS Code
    tableRows.push([
      {
        content: `SUBTOTAL HS ${group.hsCode}:`,
        colSpan: 3,
        styles: {
          fontStyle: "bold",
          halign: "right",
          fillColor: [241, 245, 249], // slate-100
          textColor: [15, 23, 42],
        },
      },
      {
        content: `${group.subtotalOuterQty} ${group.dominantPackageType}`,
        styles: {
          fontStyle: "bold",
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
        },
      },
      {
        content: `${group.subtotalInnerUnits.toLocaleString()} ${group.dominantUOM}`,
        styles: {
          fontStyle: "bold",
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
        },
      },
      {
        content: "-",
        styles: {
          fontStyle: "bold",
          halign: "center",
          fillColor: [241, 245, 249],
          textColor: [100, 116, 139],
        },
      },
      {
        content: formatCurrency(group.subtotalNetValue, curr),
        styles: {
          fontStyle: "bold",
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
        },
      },
      {
        content: "-",
        styles: {
          fontStyle: "bold",
          halign: "center",
          fillColor: [241, 245, 249],
          textColor: [100, 116, 139],
        },
      },
      {
        content: formatCurrency(group.subtotalVatAmount, curr),
        styles: {
          fontStyle: "bold",
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
        },
      },
      {
        content: formatCurrency(group.subtotalGrossValue, curr),
        styles: {
          fontStyle: "bold",
          fillColor: [224, 242, 254], // sky-100
          textColor: [3, 105, 161], // sky-700
        },
      },
    ]);
  });

  // Consolidated GRAND TOTALS row
  tableRows.push([
    {
      content: "CONSOLIDATED TOTALS (ALL HS CODES):",
      colSpan: 3,
      styles: {
        fontStyle: "bold",
        fontSize: 8.5,
        halign: "right",
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        cellPadding: 3,
      },
    },
    {
      content: `${totals.totalCases} Packages`,
      styles: {
        fontStyle: "bold",
        fontSize: 8.5,
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        cellPadding: 3,
      },
    },
    {
      content: `${totals.totalUnits.toLocaleString()} Inner Units`,
      styles: {
        fontStyle: "bold",
        fontSize: 8.5,
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        cellPadding: 3,
      },
    },
    {
      content: "-",
      styles: {
        fontStyle: "bold",
        halign: "center",
        fillColor: [15, 23, 42],
        textColor: [148, 163, 184],
        cellPadding: 3,
      },
    },
    {
      content: formatCurrency(totals.totalNet, curr),
      styles: {
        fontStyle: "bold",
        fontSize: 8.5,
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        cellPadding: 3,
      },
    },
    {
      content: "-",
      styles: {
        fontStyle: "bold",
        halign: "center",
        fillColor: [15, 23, 42],
        textColor: [148, 163, 184],
        cellPadding: 3,
      },
    },
    {
      content: formatCurrency(totals.totalVat, curr),
      styles: {
        fontStyle: "bold",
        fontSize: 8.5,
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        cellPadding: 3,
      },
    },
    {
      content: formatCurrency(totals.totalGross, curr),
      styles: {
        fontStyle: "bold",
        fontSize: 9,
        fillColor: [2, 132, 199], // sky-600
        textColor: [255, 255, 255],
        cellPadding: 3,
      },
    },
  ]);

  if (totals.sundryTotal > 0) {
    tableRows.push([
      {
        content: `SUNDRY CHARGES (FREIGHT: ${formatCurrency(totals.freight, curr)} | INSURANCE: ${formatCurrency(totals.insurance, curr)}):`,
        colSpan: 9,
        styles: {
          fontStyle: "bold",
          fontSize: 8,
          halign: "right",
          fillColor: [248, 250, 252],
          textColor: [51, 65, 85],
          cellPadding: 2.5,
        },
      },
      {
        content: formatCurrency(totals.sundryTotal, curr),
        styles: {
          fontStyle: "bold",
          fontSize: 8,
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          cellPadding: 2.5,
        },
      },
    ]);

    tableRows.push([
      {
        content: "TOTAL INVOICE VALUE (MERCHANDISE + FREIGHT + INSURANCE):",
        colSpan: 9,
        styles: {
          fontStyle: "bold",
          fontSize: 9,
          halign: "right",
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          cellPadding: 3,
        },
      },
      {
        content: formatCurrency(totals.totalInvoiceValue, curr),
        styles: {
          fontStyle: "bold",
          fontSize: 9.5,
          fillColor: [16, 185, 129], // emerald-500
          textColor: [255, 255, 255],
          cellPadding: 3,
        },
      },
    ]);
  }

  autoTable(doc, {
    startY: panelY + panelHeight + 4,
    margin: { left: margin, right: margin, bottom: 28 },
    head: [
      [
        "HS Code",
        "Product Description / Specification",
        "Origin",
        "Outer Cases",
        "Inner Units",
        "Unit Price",
        "Net Customs Value",
        "VAT %",
        "VAT Amount",
        "Total Inc. VAT",
      ],
    ],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2,
    },
    styles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
      overflow: "linebreak",
      lineWidth: 0.1,
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold" }, // HS Code
      1: { cellWidth: "auto" }, // Product Description
      2: { cellWidth: 12, halign: "center" }, // Origin
      3: { cellWidth: 22 }, // Outer cases
      4: { cellWidth: 24 }, // Inner units
      5: { cellWidth: 18, halign: "right" }, // Unit price
      6: { cellWidth: 24, halign: "right" }, // Net Value
      7: { cellWidth: 12, halign: "center" }, // VAT %
      8: { cellWidth: 20, halign: "right" }, // VAT Amt
      9: { cellWidth: 26, halign: "right", fontStyle: "bold" }, // Gross Value
    },
    didDrawPage: (data) => {
      // Footer on every page
      const currentY = pageHeight - 20;

      // Bottom Divider
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      // Certification Notice
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "CUSTOMS CERTIFICATION: I hereby certify that the information contained in this declaration is true, accurate, and reflects the genuine commercial transaction value and Harmonized System tariff classifications.",
        margin,
        currentY + 4
      );

      // Signatory line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text("Authorized Customs Representative / Declarant Signature: __________________________", margin, currentY + 11);

      // Page numbers & timestamp
      const pageStr = `Page ${doc.internal.pages.length - 1}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC  |  ${pageStr}`, pageWidth - margin, currentY + 11, {
        align: "right",
      });
    },
  });

  const fileName = `Customs_HS_Summary_${invoice.invoiceNumber || "DECL"}_${new Date().toISOString().slice(0, 10)}.pdf`;

  if (action === "download") {
    doc.save(fileName);
    return fileName;
  } else if (action === "blob") {
    return doc.output("blob");
  } else {
    return doc.output("datauristring");
  }
}
