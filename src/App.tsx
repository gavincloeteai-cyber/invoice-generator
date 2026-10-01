import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  Package,
  Boxes,
  Coins,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { CustomsInvoice, InvoiceItem } from "./types/customs";
import {
  calculateConsolidatedTotals,
  formatCurrency,
  groupItemsByHSCode,
  SAMPLE_INVOICES,
  verifyTotals,
} from "./utils/customsUtils";
import { generateCustomsPDF } from "./utils/pdfGenerator";
import { Navbar } from "./components/Navbar";
import { DropZone } from "./components/DropZone";
import { VerificationPanel } from "./components/VerificationPanel";
import { InvoiceHeaderForm } from "./components/InvoiceHeaderForm";
import { HSCodeSummaryTable } from "./components/HSCodeSummaryTable";
import { EditItemModal } from "./components/EditItemModal";
import { PdfPreviewModal } from "./components/PdfPreviewModal";
import { HistoryDrawer } from "./components/HistoryDrawer";

const STORAGE_KEY = "customs_portal_invoices_zar_v5_jumbo75486";

export default function App() {
  const [currentInvoice, setCurrentInvoice] = useState<CustomsInvoice | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].currency === "ZAR") {
          return parsed[0];
        }
      }
    } catch (e) {
      console.error("Storage load error:", e);
    }
    return SAMPLE_INVOICES[0];
  });

  const [savedInvoices, setSavedInvoices] = useState<CustomsInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].currency === "ZAR") {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Storage load error:", e);
    }
    return SAMPLE_INVOICES;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);

  // Sync saved invoices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedInvoices));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  }, [savedInvoices]);

  // Save or update invoice in history
  const saveToHistory = (inv: CustomsInvoice) => {
    setSavedInvoices((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === inv.id || i.invoiceNumber === inv.invoiceNumber);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = inv;
        return updated;
      } else {
        return [inv, ...prev];
      }
    });
  };

  const handleInvoiceParsed = (newInvoice: CustomsInvoice) => {
    setCurrentInvoice(newInvoice);
    saveToHistory(newInvoice);
  };

  const handleUpdateInvoice = (updated: CustomsInvoice) => {
    setCurrentInvoice(updated);
    saveToHistory(updated);
  };

  const handleEditItem = (item: InvoiceItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleAddItem = (targetHsCode?: string) => {
    const defaultItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      itemNumber: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      productDescription: "",
      hsCode: targetHsCode || "6403.99.90",
      countryOfOrigin: currentInvoice?.supplier.country?.slice(0, 2).toUpperCase() || "CN",
      outerQuantity: 10,
      outerPackageType: "Cartons",
      innerUnits: 100,
      unitOfMeasure: "PCS",
      unitPrice: 20.0,
      netValue: 2000.0,
      vatRate: 20,
      vatAmount: 400.0,
      grossValue: 2400.0,
    };
    setEditingItem(defaultItem);
    setIsEditModalOpen(true);
  };

  const handleSaveItem = (savedItem: InvoiceItem) => {
    if (!currentInvoice) return;

    const existingIndex = currentInvoice.items.findIndex((it) => it.id === savedItem.id);
    let updatedItems: InvoiceItem[];

    if (existingIndex >= 0) {
      updatedItems = [...currentInvoice.items];
      updatedItems[existingIndex] = savedItem;
    } else {
      updatedItems = [...currentInvoice.items, savedItem];
    }

    const updatedInvoice = {
      ...currentInvoice,
      items: updatedItems,
    };

    handleUpdateInvoice(updatedInvoice);
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentInvoice) return;
    const updatedItems = currentInvoice.items.filter((it) => it.id !== itemId);
    const updatedInvoice = {
      ...currentInvoice,
      items: updatedItems,
    };
    handleUpdateInvoice(updatedInvoice);
  };

  const handleAutoReconcile = () => {
    if (!currentInvoice) return;
    const groups = groupItemsByHSCode(currentInvoice.items);
    const calculated = calculateConsolidatedTotals(groups);

    // Reconcile item net values: net = round(innerUnits * unitPrice)
    const reconciledItems = currentInvoice.items.map((item) => {
      const net = Math.round(item.innerUnits * item.unitPrice * 100) / 100;
      const vat = Math.round(((net * item.vatRate) / 100) * 100) / 100;
      const gross = Math.round((net + vat) * 100) / 100;
      return {
        ...item,
        netValue: net,
        vatAmount: vat,
        grossValue: gross,
      };
    });

    const updatedInvoice: CustomsInvoice = {
      ...currentInvoice,
      items: reconciledItems,
      statedTotals: {
        outerCases: calculated.totalCases,
        innerUnits: calculated.totalUnits,
        netValue: calculated.totalNet,
        vatAmount: calculated.totalVat,
        grossValue: calculated.totalGross,
      },
    };

    handleUpdateInvoice(updatedInvoice);
  };

  const handleNewInvoice = () => {
    const emptyInvoice: CustomsInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-ZA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: new Date().toISOString().slice(0, 10),
      currency: "ZAR",
      incoterms: "CIP",
      customsRef: `DA500-ZA-${Math.floor(100000 + Math.random() * 900000)}`,
      portOfEntry: "NOORDOEWER BORDER POST / CAPE TOWN",
      supplier: {
        name: "",
        address: "",
        taxId: "",
        country: "South Africa",
      },
      customer: {
        name: "",
        address: "",
        taxId: "",
        country: "South Africa / Namibia Border",
      },
      items: [],
      createdAt: new Date().toISOString(),
    };
    setCurrentInvoice(emptyInvoice);
  };

  const handleDeleteFromHistory = (id: string) => {
    setSavedInvoices((prev) => prev.filter((i) => i.id !== id));
    if (currentInvoice?.id === id) {
      const remaining = savedInvoices.filter((i) => i.id !== id);
      if (remaining.length > 0) {
        setCurrentInvoice(remaining[0]);
      } else {
        handleNewInvoice();
      }
    }
  };

  const handleClearHistory = () => {
    setSavedInvoices([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Grouping calculations for the dashboard overview cards
  const groups = currentInvoice ? groupItemsByHSCode(currentInvoice.items) : [];
  const freight = currentInvoice?.freightAmount || currentInvoice?.statedTotals?.freight || 0;
  const insurance = currentInvoice?.insuranceAmount || currentInvoice?.statedTotals?.insurance || 0;
  const totals = calculateConsolidatedTotals(groups, freight, insurance);
  const curr = "ZAR";

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Top Navbar */}
      <Navbar
        invoice={currentInvoice}
        historyCount={savedInvoices.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPreview={() => setIsPdfPreviewOpen(true)}
        onNewInvoice={handleNewInvoice}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Workflow Steps Indicator Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Drop Commercial Tax Invoice
                </h4>
                <p className="text-xs text-slate-500">
                  PDF, Excel, CSV, or Image. Extracts product lines, unit prices, and packaging.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:border-l md:border-slate-200 md:pl-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Harmonized HS Tariff Summary
                </h4>
                <p className="text-xs text-slate-500">
                  Groups products by 6-digit HS Code, calculates cases, inner units & Rand valuations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:border-l md:border-slate-200 md:pl-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Reconciled Landscape PDF
                </h4>
                <p className="text-xs text-slate-500">
                  Landscape customs declaration with freight, insurance, and verified Rand totals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Invoices Quick Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900">Preset Sample Invoices:</span>
            <span className="text-xs text-slate-500 hidden sm:inline">Test multi-page customs grouping & valuation in Rand:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_INVOICES.map((sample, idx) => {
              const isSelected = currentInvoice?.invoiceNumber === sample.invoiceNumber;
              const is11Page = sample.invoiceNumber === "04V61VU926";
              return (
                <button
                  key={sample.id || idx}
                  type="button"
                  onClick={() => {
                    setCurrentInvoice(sample);
                    saveToHistory(sample);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {is11Page
                      ? "11-Page Jumbo Wholesale (Customs Value: R 75,486.76)"
                      : "Shoprite Export Invoice (R 472,673.41)"}
                  </span>
                  {isSelected && <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1: Drop Invoice Area */}
        <DropZone
          onInvoiceParsed={handleInvoiceParsed}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          currentInvoice={currentInvoice}
        />

        {currentInvoice && (
          <>
            {/* Quick Metrics Bar in South African Rand (ZAR) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tariff Headings</span>
                  <Layers className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {groups.length} <span className="text-xs font-normal text-slate-500">HS Groups</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Across {currentInvoice.items.length} line items
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Quantity</span>
                  <Package className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {totals.totalUnits.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-500">EA Units</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Packaging: ~{totals.totalCases} cases/cartons
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Customs Net Value</span>
                  <Coins className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {formatCurrency(totals.totalNet, curr)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>{totals.totalVat > 0 ? `VAT (15%): ${formatCurrency(totals.totalVat, curr)}` : "VAT: 0% / Zero-rated"}</span>
                  <span className="font-semibold text-emerald-600">Excl. VAT</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Invoice Value (ZAR)</span>
                  <Coins className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
                  {formatCurrency(totals.totalInvoiceValue, curr)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {freight > 0 || insurance > 0
                    ? `Lines + Freight (R ${freight.toFixed(2)}) + Ins (R ${insurance.toFixed(2)})`
                    : `Gross Value (Incl. VAT)`}
                </div>
              </div>
            </div>

            {/* Verification / Totals Check Banner */}
            <VerificationPanel
              invoice={currentInvoice}
              onAutoReconcile={handleAutoReconcile}
            />

            {/* Step 2: Invoice Metadata & Parties */}
            <InvoiceHeaderForm
              invoice={currentInvoice}
              onChange={handleUpdateInvoice}
            />

            {/* Step 3: Interactive HS Code Summary Table with Subtotals & Consolidated Totals */}
            <HSCodeSummaryTable
              invoice={currentInvoice}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
            />

            {/* Action Bar at bottom */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Customs Declaration Ready
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Invoice {currentInvoice.invoiceNumber} grouped into {groups.length} HS Codes with {totals.totalCases} packaging cases.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPdfPreviewOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  Landscape PDF Preview
                </button>

                <button
                  type="button"
                  onClick={() => generateCustomsPDF(currentInvoice, "download")}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-md transition-all hover:shadow-sky-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Landscape PDF
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Line Item Edit Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        item={editingItem}
        currency={curr}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* PDF Landscape Preview Modal */}
      {currentInvoice && (
        <PdfPreviewModal
          isOpen={isPdfPreviewOpen}
          invoice={currentInvoice}
          onClose={() => setIsPdfPreviewOpen(false)}
        />
      )}

      {/* Saved Invoices History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        history={savedInvoices}
        currentInvoiceId={currentInvoice?.id}
        onClose={() => setIsHistoryOpen(false)}
        onSelectInvoice={(inv) => setCurrentInvoice(inv)}
        onDeleteInvoice={handleDeleteFromHistory}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Customs Invoice → HS Code Summary Portal · Automated Commercial Invoicing & Tariff Classification Engine
      </footer>
    </div>
  );
}
