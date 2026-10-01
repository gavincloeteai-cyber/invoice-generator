import React, { useState } from "react";
import { X, Clock, FileText, Download, Trash2, ArrowRight, Search, CheckCircle } from "lucide-react";
import { CustomsInvoice } from "../types/customs";
import { formatCurrency, groupItemsByHSCode, calculateConsolidatedTotals } from "../utils/customsUtils";
import { generateCustomsPDF } from "../utils/pdfGenerator";

interface Props {
  isOpen: boolean;
  history: CustomsInvoice[];
  currentInvoiceId?: string;
  onClose: () => void;
  onSelectInvoice: (invoice: CustomsInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<Props> = ({
  isOpen,
  history,
  currentInvoiceId,
  onClose,
  onSelectInvoice,
  onDeleteInvoice,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filtered = history.filter((inv) => {
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(term) ||
      inv.supplier?.name?.toLowerCase().includes(term) ||
      inv.customer?.name?.toLowerCase().includes(term) ||
      inv.originalFileName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Saved Customs Invoices</h2>
                <p className="text-xs text-slate-500">
                  {history.length} invoice(s) stored locally in browser
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by invoice #, supplier, or customer..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="text-sm font-semibold text-slate-700">No saved invoices found</p>
                <p className="text-xs mt-1">Invoices you process are automatically saved here.</p>
              </div>
            ) : (
              filtered.map((inv) => {
                const groups = groupItemsByHSCode(inv.items);
                const totals = calculateConsolidatedTotals(groups);
                const isCurrent = inv.id === currentInvoiceId;

                return (
                  <div
                    key={inv.id}
                    className={`rounded-xl border p-3.5 transition-all text-xs ${
                      isCurrent
                        ? "border-sky-500 bg-sky-50/40 shadow-xs ring-1 ring-sky-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">
                            {inv.invoiceNumber || "Untitled Invoice"}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {inv.invoiceDate || "No date"} · {inv.currency} · {groups.length} HS Codes
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => generateCustomsPDF(inv, "download")}
                          title="Quick Download PDF"
                          className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id)}
                          title="Delete from History"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                      <div>
                        <div className="font-medium text-slate-800 truncate max-w-[200px]">
                          {inv.supplier.name} → {inv.customer.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {totals.totalCases} Cases · {totals.totalUnits.toLocaleString()} Units
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {formatCurrency(totals.totalGross, inv.currency)}
                        </div>
                        <div className="text-[10px] text-slate-400">Total inc. VAT</div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectInvoice(inv);
                          onClose();
                        }}
                        className="mt-3 w-full py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <span>Load into Editor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">Auto-saved to browser storage</span>
              <button
                type="button"
                onClick={onClearHistory}
                className="text-rose-600 hover:text-rose-800 font-medium transition-colors"
              >
                Clear All History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
