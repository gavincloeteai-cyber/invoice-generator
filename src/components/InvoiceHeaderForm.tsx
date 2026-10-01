import React, { useState } from "react";
import { ChevronDown, ChevronUp, Building2, UserCheck, FileText, Globe, Hash } from "lucide-react";
import { CustomsInvoice } from "../types/customs";

interface Props {
  invoice: CustomsInvoice;
  onChange: (updated: CustomsInvoice) => void;
}

const COMMON_CURRENCIES = ["GBP", "EUR", "USD", "ZAR", "CAD", "AUD", "JPY", "CNY", "CHF"];
const COMMON_INCOTERMS = ["FOB", "CIF", "EXW", "DDP", "CFR", "FCA", "CPT", "CIP", "DAP"];

export const InvoiceHeaderForm: React.FC<Props> = ({ invoice, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSupplier = (field: string, val: string) => {
    onChange({
      ...invoice,
      supplier: {
        ...invoice.supplier,
        [field]: val,
      },
    });
  };

  const updateCustomer = (field: string, val: string) => {
    onChange({
      ...invoice,
      customer: {
        ...invoice.customer,
        [field]: val,
      },
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top summary row - Always visible */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          {/* Invoice Number */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Invoice No
              </span>
              <input
                type="text"
                value={invoice.invoiceNumber || ""}
                onChange={(e) => onChange({ ...invoice, invoiceNumber: e.target.value })}
                placeholder="INV-001"
                className="font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none text-sm transition-colors py-0.5"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Invoice Date
            </span>
            <input
              type="date"
              value={invoice.invoiceDate || ""}
              onChange={(e) => onChange({ ...invoice, invoiceDate: e.target.value })}
              className="text-xs font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none transition-colors py-0.5"
            />
          </div>

          {/* Currency - Locked to South African Rand */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Currency
            </span>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-0.5 shadow-2xs">
              <span>ZAR (R)</span>
              <span className="text-[10px] text-emerald-600 font-normal">Rand</span>
            </div>
          </div>

          {/* Incoterms */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Terms of Delivery
            </span>
            <input
              type="text"
              value={invoice.incoterms || "CIP"}
              onChange={(e) => onChange({ ...invoice, incoterms: e.target.value })}
              placeholder="e.g. CIP WINDHOEK"
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Freight & Insurance Sundries */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Freight (R)
            </span>
            <input
              type="number"
              step="0.01"
              value={invoice.freightAmount ?? 42540.21}
              onChange={(e) => onChange({ ...invoice, freightAmount: parseFloat(e.target.value) || 0 })}
              className="w-24 text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Insurance (R)
            </span>
            <input
              type="number"
              step="0.01"
              value={invoice.insuranceAmount ?? 2363.65}
              onChange={(e) => onChange({ ...invoice, insuranceAmount: parseFloat(e.target.value) || 0 })}
              className="w-24 text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Parties Quick Preview */}
          <div className="hidden xl:flex items-center gap-3 border-l border-slate-200 pl-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Exporter: </span>
              <span className="font-semibold text-slate-800">{invoice.supplier.name || "N/A"}</span>
            </div>
            <span className="text-slate-300">→</span>
            <div>
              <span className="text-slate-400 font-medium">Importer: </span>
              <span className="font-semibold text-slate-800">{invoice.customer.name || "N/A"}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
        >
          {isExpanded ? "Hide Details" : "Edit Customs & Trader Details"}
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded detailed trader panel */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {/* Customs declaration reference details */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">UCR Number</label>
              <input
                type="text"
                value={invoice.ucrNumber || "6ZA00523473CINVC100113713NM"}
                onChange={(e) => onChange({ ...invoice, ucrNumber: e.target.value })}
                className="w-full font-mono text-xs rounded-lg border border-slate-300 px-2 py-1 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Consignment Number</label>
              <input
                type="text"
                value={invoice.consignmentNumber || invoice.invoiceNumber || ""}
                onChange={(e) => onChange({ ...invoice, consignmentNumber: e.target.value })}
                className="w-full font-mono text-xs rounded-lg border border-slate-300 px-2 py-1 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Transport Details</label>
              <input
                type="text"
                value={invoice.transportDetails || "3 - ROAD: N246584W"}
                onChange={(e) => onChange({ ...invoice, transportDetails: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-2 py-1 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Port of Discharge / Entry</label>
              <input
                type="text"
                value={invoice.portOfEntry || "WINDHOEK"}
                onChange={(e) => onChange({ ...invoice, portOfEntry: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-2 py-1 focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Exporter / Supplier */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Exporter / Seller (Consignor)</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Company Name</label>
              <input
                type="text"
                value={invoice.supplier.name || ""}
                onChange={(e) => updateSupplier("name", e.target.value)}
                placeholder="Apex Global Ltd"
                className="w-full text-xs font-medium rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Address</label>
              <input
                type="text"
                value={invoice.supplier.address || ""}
                onChange={(e) => updateSupplier("address", e.target.value)}
                placeholder="Industrial Zone, Building 4, Shanghai"
                className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">VAT / EORI / Tax ID</label>
                <input
                  type="text"
                  value={invoice.supplier.taxId || ""}
                  onChange={(e) => updateSupplier("taxId", e.target.value)}
                  placeholder="CN9131000077..."
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Origin Country</label>
                <input
                  type="text"
                  value={invoice.supplier.country || ""}
                  onChange={(e) => updateSupplier("country", e.target.value)}
                  placeholder="China"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Importer / Customer */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs border-b border-slate-100 pb-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Importer / Buyer (Consignee)</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Company Name</label>
              <input
                type="text"
                value={invoice.customer.name || ""}
                onChange={(e) => updateCustomer("name", e.target.value)}
                placeholder="Britannia Logistics PLC"
                className="w-full text-xs font-medium rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Address</label>
              <input
                type="text"
                value={invoice.customer.address || ""}
                onChange={(e) => updateCustomer("address", e.target.value)}
                placeholder="Unit 12 Maritime Gateway, London"
                className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">VAT / EORI ID</label>
                <input
                  type="text"
                  value={invoice.customer.taxId || ""}
                  onChange={(e) => updateCustomer("taxId", e.target.value)}
                  placeholder="GB849203911000"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Destination Country</label>
                <input
                  type="text"
                  value={invoice.customer.country || ""}
                  onChange={(e) => updateCustomer("country", e.target.value)}
                  placeholder="United Kingdom"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
