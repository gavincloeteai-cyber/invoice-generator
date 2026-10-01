import React, { useEffect, useState } from "react";
import { X, Download, Printer, Eye, ExternalLink, RefreshCw } from "lucide-react";
import { CustomsInvoice } from "../types/customs";
import { generateCustomsPDF } from "../utils/pdfGenerator";

interface Props {
  isOpen: boolean;
  invoice: CustomsInvoice;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<Props> = ({ isOpen, invoice, onClose }) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && invoice) {
      try {
        const url = generateCustomsPDF(invoice, "dataurl") as string;
        setPdfDataUrl(url);
      } catch (err) {
        console.error("PDF generation failed:", err);
      }
    } else {
      setPdfDataUrl(null);
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const handleDownload = () => {
    generateCustomsPDF(invoice, "download");
  };

  const handlePrint = () => {
    if (pdfDataUrl) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfDataUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };
    }
  };

  const fileName = `Customs_HS_Summary_${invoice.invoiceNumber || "DECL"}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Landscape PDF Preview</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {fileName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                A4 Landscape declaration with consolidated HS Code tariff totals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF viewer content */}
        <div className="flex-1 bg-slate-800 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
          {pdfDataUrl ? (
            <iframe
              src={pdfDataUrl}
              title="PDF Customs Summary Preview"
              className="w-full h-full rounded-lg shadow-lg border border-slate-700 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span className="text-xs">Generating Landscape Customs PDF...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
