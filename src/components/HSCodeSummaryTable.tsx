import React from "react";
import { Edit2, Trash2, Plus, Layers, Package, Hash, Check } from "lucide-react";
import { CustomsInvoice, InvoiceItem } from "../types/customs";
import {
  calculateConsolidatedTotals,
  formatCurrency,
  groupItemsByHSCode,
} from "../utils/customsUtils";

interface Props {
  invoice: CustomsInvoice;
  onEditItem: (item: InvoiceItem) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (targetHsCode?: string) => void;
}

export const HSCodeSummaryTable: React.FC<Props> = ({
  invoice,
  onEditItem,
  onDeleteItem,
  onAddItem,
}) => {
  const freight = invoice.freightAmount || invoice.statedTotals?.freight || 0;
  const insurance = invoice.insuranceAmount || invoice.statedTotals?.insurance || 0;
  const groups = groupItemsByHSCode(invoice.items);
  const totals = calculateConsolidatedTotals(groups, freight, insurance);
  const curr = "ZAR";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Title Bar */}
      <div className="px-5 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>HS Code Customs Classification Summary</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {groups.length} Tariff Groups · {invoice.items.length} Line Items
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Harmonized System headings with case packaging, inner units, and VAT valuation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddItem()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Line Item
        </button>
      </div>

      {/* Main Table Responsive Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 w-28">HS Code</th>
              <th className="py-2.5 px-3 min-w-[220px]">Product Description / SKU</th>
              <th className="py-2.5 px-2 text-center w-12">Origin</th>
              <th className="py-2.5 px-3 text-right w-24">Outer Cases</th>
              <th className="py-2.5 px-3 text-right w-28">Inner Units</th>
              <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
              <th className="py-2.5 px-3 text-right w-28">Net Customs Val</th>
              <th className="py-2.5 px-2 text-center w-14">VAT %</th>
              <th className="py-2.5 px-3 text-right w-24">VAT Amount</th>
              <th className="py-2.5 px-3 text-right w-28">Total Inc. VAT</th>
              <th className="py-2.5 px-2 text-center w-16">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                  No line items found. Drag & drop an invoice above or click &quot;Add Line Item&quot;.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <React.Fragment key={group.hsCode}>
                  {/* HS Code Banner Header */}
                  <tr className="bg-slate-800 text-white font-medium border-t border-b border-slate-700">
                    <td colSpan={11} className="py-2 px-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded text-[11px] border border-sky-800/60">
                            HS {group.hsCode}
                          </span>
                          <span className="text-slate-200 font-semibold text-xs">
                            {group.hsDescription}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center gap-3">
                          <span>{group.items.length} item(s)</span>
                          <button
                            type="button"
                            onClick={() => onAddItem(group.hsCode)}
                            className="text-[11px] text-sky-300 hover:text-sky-200 underline font-normal cursor-pointer"
                          >
                            + Add to HS {group.hsCode}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Individual Products under this HS Code */}
                  {group.items.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-50/80 transition-colors group text-slate-800"
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-500 text-[11px]">
                        {item.hsCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 leading-snug">
                          {item.productDescription}
                        </div>
                        {item.itemNumber && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {item.itemNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {item.countryOfOrigin || "CN"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {item.outerQuantity}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {item.outerPackageType || "Ctns"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {item.innerUnits.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {item.unitOfMeasure || "PCS"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.unitPrice, curr)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                        {formatCurrency(item.netValue, curr)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600">
                        {item.vatRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(item.vatAmount, curr)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(item.grossValue, curr)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            title="Edit Item"
                            className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            title="Delete Item"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* HS Code Subtotal Row */}
                  <tr className="bg-slate-100/90 font-semibold text-slate-900 border-b-2 border-slate-300">
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                      Subtotal HS {group.hsCode}:
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900">
                      {group.subtotalOuterQty}{" "}
                      <span className="text-[10px] text-slate-500 font-normal">
                        {group.dominantPackageType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900">
                      {group.subtotalInnerUnits.toLocaleString()}{" "}
                      <span className="text-[10px] text-slate-500 font-normal">
                        {group.dominantUOM}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">-</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">
                      {formatCurrency(group.subtotalNetValue, curr)}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400">-</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(group.subtotalVatAmount, curr)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-sky-800 bg-sky-50/60">
                      {formatCurrency(group.subtotalGrossValue, curr)}
                    </td>
                    <td></td>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>

          {/* Consolidated GRAND TOTALS Row */}
          {groups.length > 0 && (
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900">
                <td colSpan={3} className="py-3 px-4 text-right tracking-wide text-xs">
                  DETAIL MERCHANDISE TOTAL:
                </td>
                <td className="py-3 px-3 text-right text-xs">
                  {totals.totalCases} <span className="text-[10px] text-slate-400 font-normal">Cases</span>
                </td>
                <td className="py-3 px-3 text-right text-xs">
                  {totals.totalUnits.toLocaleString()}{" "}
                  <span className="text-[10px] text-slate-400 font-normal">EA</span>
                </td>
                <td className="py-3 px-3 text-center text-slate-600">-</td>
                <td className="py-3 px-3 text-right font-mono text-xs text-white">
                  {formatCurrency(totals.totalNet, curr)}
                </td>
                <td className="py-3 px-2 text-center text-slate-600">-</td>
                <td className="py-3 px-3 text-right font-mono text-xs text-slate-300">
                  {formatCurrency(totals.totalVat, curr)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs font-bold text-white bg-slate-800">
                  {formatCurrency(totals.totalGross, curr)}
                </td>
                <td></td>
              </tr>

              {totals.sundryTotal > 0 && (
                <>
                  <tr className="bg-slate-800/90 text-slate-200 border-t border-slate-700 text-xs font-semibold">
                    <td colSpan={9} className="py-2.5 px-4 text-right text-slate-300">
                      SUNDRY CHARGES (FREIGHT: {formatCurrency(totals.freight, curr)} | INSURANCE: {formatCurrency(totals.insurance, curr)}):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white bg-slate-800">
                      {formatCurrency(totals.sundryTotal, curr)}
                    </td>
                    <td></td>
                  </tr>

                  <tr className="bg-slate-950 text-white font-black border-t-2 border-slate-700 text-sm">
                    <td colSpan={9} className="py-3.5 px-4 text-right tracking-wider text-emerald-400">
                      TOTAL INVOICE VALUE (ZAR):
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-base font-extrabold text-white bg-emerald-600">
                      {formatCurrency(totals.totalInvoiceValue, curr)}
                    </td>
                    <td></td>
                  </tr>
                </>
              )}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
