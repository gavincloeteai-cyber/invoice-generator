import React from "react";
import {
  FileText,
  Download,
  Eye,
  Clock,
  Plus,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { CustomsInvoice } from "../types/customs";
import {
  calculateConsolidatedTotals,
  groupItemsByHSCode,
} from "../utils/customsUtils";
import { generateCustomsPDF } from "../utils/pdfGenerator";

interface Props {
  invoice: CustomsInvoice | null;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenPreview: () => void;
  onNewInvoice: () => void;
}

export const Navbar: React.FC<Props> = ({
  invoice,
  historyCount,
  onOpenHistory,
  onOpenPreview,
  onNewInvoice,
}) => {
  const handleDownloadPDF = () => {
    if (invoice) {
      generateCustomsPDF(invoice, "download");
    }
  };

  const handleExportExcel = () => {
    if (!invoice) return;
    const freight = invoice.freightAmount || invoice.statedTotals?.freight || 0;
    const insurance = invoice.insuranceAmount || invoice.statedTotals?.insurance || 0;
    const groups = groupItemsByHSCode(invoice.items);
    const totals = calculateConsolidatedTotals(groups, freight, insurance);

    // Prepare tabular rows
    const excelRows: any[] = [];

    // Header metadata
    excelRows.push({
      "HS Code": "INVOICE NUMBER",
      "Product Description": invoice.invoiceNumber,
      Origin: "DATE",
      "Outer Cases": invoice.invoiceDate,
      "Inner Units": "CURRENCY",
      "Unit Price": "ZAR (R)",
      "Net Value": "TERMS",
      "VAT %": invoice.incoterms,
      "VAT Amount": "SUPPLIER",
      "Total Inc VAT": invoice.supplier.name,
    });
    excelRows.push({}); // empty line

    groups.forEach((g) => {
      excelRows.push({
        "HS Code": `HS ${g.hsCode}`,
        "Product Description": g.hsDescription,
        Origin: "",
        "Outer Cases": "",
        "Inner Units": "",
        "Unit Price": "",
        "Net Value": "",
        "VAT %": "",
        "VAT Amount": "",
        "Total Inc VAT": "",
      });

      g.items.forEach((it) => {
        excelRows.push({
          "HS Code": it.hsCode,
          "Product Description": it.productDescription,
          Origin: it.countryOfOrigin,
          "Outer Cases": `${it.outerQuantity} ${it.outerPackageType}`,
          "Inner Units": `${it.innerUnits} ${it.unitOfMeasure}`,
          "Unit Price": it.unitPrice,
          "Net Value": it.netValue,
          "VAT %": `${it.vatRate}%`,
          "VAT Amount": it.vatAmount,
          "Total Inc VAT": it.grossValue,
        });
      });

      // Subtotal row
      excelRows.push({
        "HS Code": `SUBTOTAL HS ${g.hsCode}`,
        "Product Description": "",
        Origin: "",
        "Outer Cases": `${g.subtotalOuterQty} ${g.dominantPackageType}`,
        "Inner Units": `${g.subtotalInnerUnits} ${g.dominantUOM}`,
        "Unit Price": "",
        "Net Value": g.subtotalNetValue,
        "VAT %": "",
        "VAT Amount": g.subtotalVatAmount,
        "Total Inc VAT": g.subtotalGrossValue,
      });
      excelRows.push({}); // spacing
    });

    // Consolidated Merchandise Totals
    excelRows.push({
      "HS Code": "MERCHANDISE DETAIL TOTAL",
      "Product Description": "ALL HS TARIFF CODES",
      Origin: "",
      "Outer Cases": `${totals.totalCases} Cases`,
      "Inner Units": `${totals.totalUnits} Units`,
      "Unit Price": "",
      "Net Value": totals.totalNet,
      "VAT %": "",
      "VAT Amount": totals.totalVat,
      "Total Inc VAT": totals.totalGross,
    });

    if (totals.sundryTotal > 0) {
      excelRows.push({
        "HS Code": "SUNDRY CHARGES",
        "Product Description": `Freight (R ${totals.freight.toFixed(2)}) + Insurance (R ${totals.insurance.toFixed(2)})`,
        Origin: "",
        "Outer Cases": "",
        "Inner Units": "",
        "Unit Price": "",
        "Net Value": totals.sundryTotal,
        "VAT %": "0%",
        "VAT Amount": 0,
        "Total Inc VAT": totals.sundryTotal,
      });

      excelRows.push({
        "HS Code": "TOTAL INVOICE VALUE (ZAR)",
        "Product Description": "MERCHANDISE + FREIGHT + INSURANCE",
        Origin: "",
        "Outer Cases": `${totals.totalCases} Cases`,
        "Inner Units": `${totals.totalUnits} Units`,
        "Unit Price": "",
        "Net Value": totals.totalInvoiceValue,
        "VAT %": "0%",
        "VAT Amount": 0,
        "Total Inc VAT": totals.totalInvoiceValue,
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customs Summary");
    XLSX.writeFile(
      workbook,
      `Customs_HS_Summary_${invoice.invoiceNumber || "DECL"}.xlsx`
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  Customs Portal
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  HS Code Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Commercial Invoice → Automated Tariff Summary & Landscape PDF
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* New Invoice Button */}
            <button
              type="button"
              onClick={onNewInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Upload</span>
            </button>

            {/* History Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer relative"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Saved Invoices</span>
              {historyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-white">
                  {historyCount}
                </span>
              )}
            </button>

            {invoice && (
              <>
                {/* Excel Export */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  title="Export Customs Summary to Excel"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>

                {/* PDF Preview Button */}
                <button
                  type="button"
                  onClick={onOpenPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">Preview PDF</span>
                </button>

                {/* Direct Download PDF Button */}
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
