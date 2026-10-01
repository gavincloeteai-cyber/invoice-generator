import React, { useState, useEffect } from "react";
import { X, Check, Search, Calculator } from "lucide-react";
import { InvoiceItem } from "../types/customs";
import { cleanHSCode, getTariffDescriptionFallback } from "../utils/customsUtils";

interface Props {
  isOpen: boolean;
  item: InvoiceItem | null;
  currency: string;
  onClose: () => void;
  onSave: (item: InvoiceItem) => void;
}

const COMMON_HS_SUGGESTIONS = [
  { code: "210390", label: "Sauces & Condiments", desc: "Sauces and preparations therefor; mixed condiments and seasonings" },
  { code: "190230", label: "Instant Noodles & Pasta", desc: "Pasta, cooked or otherwise prepared (Instant noodles)" },
  { code: "392410", label: "Plastic Tableware & Containers", desc: "Tableware and kitchenware of plastics" },
  { code: "940179", label: "Chairs & Outdoor Furniture", desc: "Other seats with metal frames" },
  { code: "220210", label: "Soft Drinks & Flavoured Waters", desc: "Waters containing added sugar or other sweetening matter" },
  { code: "220830", label: "Whiskies & Spirits", desc: "Whiskies and distilled alcoholic beverages" },
  { code: "950300", label: "Toys & Tricycles", desc: "Tricycles, scooters, pedal cars and similar wheeled toys" },
  { code: "961900", label: "Sanitary Pads & Diapers", desc: "Sanitary towels (pads) and tampons, napkins and napkin liners" },
];

export const EditItemModal: React.FC<Props> = ({ isOpen, item, currency = "ZAR", onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<InvoiceItem>>({
    itemNumber: "",
    productDescription: "",
    hsCode: "392410",
    hsDescription: "Tableware and kitchenware of plastics",
    countryOfOrigin: "ZA",
    outerQuantity: 2,
    outerPackageType: "Cartons",
    innerUnits: 24,
    unitOfMeasure: "EA",
    unitPrice: 15.0,
    vatRate: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({
        id: `item-${Date.now()}`,
        itemNumber: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        productDescription: "",
        hsCode: "392410",
        hsDescription: getTariffDescriptionFallback("392410"),
        countryOfOrigin: "ZA",
        outerQuantity: 2,
        outerPackageType: "Cartons",
        innerUnits: 24,
        unitOfMeasure: "EA",
        unitPrice: 15.0,
        vatRate: 0,
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const innerUnits = Number(formData.innerUnits) || 0;
  const unitPrice = Number(formData.unitPrice) || 0;
  const netValue = Math.round(innerUnits * unitPrice * 100) / 100;
  const vatRate = Number(formData.vatRate) || 0;
  const vatAmount = Math.round(((netValue * vatRate) / 100) * 100) / 100;
  const grossValue = Math.round((netValue + vatAmount) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productDescription?.trim()) return;

    const fullItem: InvoiceItem = {
      id: formData.id || `item-${Date.now()}`,
      itemNumber: formData.itemNumber || "SKU-001",
      productDescription: formData.productDescription.trim(),
      hsCode: cleanHSCode(formData.hsCode),
      hsDescription:
        formData.hsDescription?.trim() || getTariffDescriptionFallback(formData.hsCode || "9999.99"),
      countryOfOrigin: (formData.countryOfOrigin || "CN").toUpperCase(),
      outerQuantity: Number(formData.outerQuantity) || 0,
      outerPackageType: formData.outerPackageType || "Cartons",
      innerUnits: Number(formData.innerUnits) || 0,
      unitOfMeasure: (formData.unitOfMeasure || "PCS").toUpperCase(),
      unitPrice: Number(formData.unitPrice) || 0,
      netValue,
      vatRate,
      vatAmount,
      grossValue,
    };

    onSave(fullItem);
  };

  const handleSelectHsSuggestion = (sug: typeof COMMON_HS_SUGGESTIONS[0]) => {
    setFormData((prev) => ({
      ...prev,
      hsCode: sug.code,
      hsDescription: sug.desc,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {item ? "Edit Invoice Line Item" : "Add Customs Line Item"}
            </h2>
            <p className="text-xs text-slate-500">
              Set product specifications, tariff HS classification, case packaging, and tax.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Product description & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.productDescription || ""}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                placeholder="e.g. Men's Oxford Leather Dress Shoes - Size 42-45"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Item Ref</label>
              <input
                type="text"
                value={formData.itemNumber || ""}
                onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                placeholder="SKU-FW-01"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* HS Code & Tariff Description */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>HS / Tariff Code</span>
                  <span className="text-[10px] text-sky-600 font-mono">6-10 digits</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.hsCode || ""}
                  onChange={(e) => {
                    const code = e.target.value;
                    const desc = getTariffDescriptionFallback(code);
                    setFormData({ ...formData, hsCode: code, hsDescription: desc || formData.hsDescription });
                  }}
                  placeholder="6403.99.90"
                  className="w-full font-mono font-medium text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Tariff Category Description
                </label>
                <input
                  type="text"
                  value={formData.hsDescription || ""}
                  onChange={(e) => setFormData({ ...formData, hsDescription: e.target.value })}
                  placeholder="Official customs tariff classification category"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            {/* Quick HS suggestions */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Quick HS Code Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_HS_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.code}
                    type="button"
                    onClick={() => handleSelectHsSuggestion(sug)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                      cleanHSCode(formData.hsCode) === cleanHSCode(sug.code)
                        ? "bg-sky-600 text-white border-sky-600 font-medium"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-mono text-[11px] font-bold mr-1">{sug.code}</span>
                    <span className="text-[11px]">{sug.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quantities & Packaging */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Outer Cases</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.outerQuantity ?? ""}
                onChange={(e) => setFormData({ ...formData, outerQuantity: Number(e.target.value) })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Outer Pkg Type</label>
              <select
                value={formData.outerPackageType || "Cartons"}
                onChange={(e) => setFormData({ ...formData, outerPackageType: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="Cartons">Cartons</option>
                <option value="Cases">Cases</option>
                <option value="Boxes">Boxes</option>
                <option value="Crates">Crates</option>
                <option value="Pallets">Pallets</option>
                <option value="Bales">Bales</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inner Units</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.innerUnits ?? ""}
                onChange={(e) => setFormData({ ...formData, innerUnits: Number(e.target.value) })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Measure (UOM)</label>
              <select
                value={formData.unitOfMeasure || "PCS"}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="PRS">PRS (Pairs)</option>
                <option value="UNITS">UNITS</option>
                <option value="KGS">KGS (Kilograms)</option>
                <option value="SET">SET</option>
                <option value="MTR">MTR (Metres)</option>
              </select>
            </div>
          </div>

          {/* Pricing & VAT */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Price ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice ?? ""}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">VAT Rate (%)</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.vatRate ?? ""}
                  onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Origin Country</label>
              <input
                type="text"
                maxLength={2}
                value={formData.countryOfOrigin || "CN"}
                onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value.toUpperCase() })}
                placeholder="CN, DE, US"
                className="w-full text-sm uppercase rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none text-center font-bold"
              />
            </div>
          </div>

          {/* Calculated Totals Preview Box */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-900 font-semibold">
              <Calculator className="w-4 h-4 text-sky-600" />
              <span>Calculated Line Values:</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700 font-mono">
              <div>
                <span className="text-slate-500">Net: </span>
                <span className="font-bold text-slate-900">{currency} {netValue.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500">VAT: </span>
                <span className="font-semibold text-slate-900">{currency} {vatAmount.toFixed(2)}</span>
              </div>
              <div className="bg-white px-2.5 py-1 rounded-md border border-sky-300 shadow-2xs">
                <span className="text-sky-700 font-semibold">Gross: </span>
                <span className="font-bold text-sky-900">{currency} {grossValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {item ? "Save Changes" : "Add Line Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
