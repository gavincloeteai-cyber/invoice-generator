import React from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { CustomsInvoice, TotalsVerification } from "../types/customs";
import { formatCurrency, verifyTotals } from "../utils/customsUtils";

interface Props {
  invoice: CustomsInvoice;
  onAutoReconcile?: () => void;
}

export const VerificationPanel: React.FC<Props> = ({ invoice, onAutoReconcile }) => {
  const verification: TotalsVerification = verifyTotals(invoice);
  const curr = "ZAR";

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        verification.isValid
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
          : "bg-amber-50/80 border-amber-200 text-amber-950"
      }`}
    >
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
              verification.isValid ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
            }`}
          >
            {verification.isValid ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight">
                {verification.isValid
                  ? "Automatic Totals Check: Perfectly Reconciled"
                  : "Automatic Totals Check: Discrepancy Detected"}
              </h3>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  verification.isValid
                    ? "bg-emerald-200/80 text-emerald-900 font-bold"
                    : "bg-amber-200/80 text-amber-900"
                }`}
              >
                {verification.isValid ? "0.00 Variance" : `${verification.discrepancies.length} Discrepancy`}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {verification.isValid
                ? "All line items match unit quantities, pricing, freight/insurance sundries, and stated customs total."
                : "Review the flagged differences below or click auto-reconcile to sync math."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Cases: </span>
            <span className="font-semibold text-slate-800">{verification.calculatedOuterCases}</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Units: </span>
            <span className="font-semibold text-slate-800">
              {verification.calculatedInnerUnits.toLocaleString()} EA
            </span>
          </div>
          <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Lines Total: </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(verification.calculatedGrossValue, curr)}
            </span>
          </div>

          {(verification.freight > 0 || verification.insurance > 0) && (
            <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 font-medium">Freight & Ins: </span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(verification.freight + verification.insurance, curr)}
              </span>
            </div>
          )}

          <div className="bg-sky-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-2xs">
            <span className="text-sky-100 font-normal">Total Value: </span>
            <span>{formatCurrency(verification.totalInvoiceValue, curr)}</span>
          </div>

          {!verification.isValid && onAutoReconcile && (
            <button
              onClick={onAutoReconcile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Reconcile
            </button>
          )}
        </div>
      </div>

      {!verification.isValid && verification.discrepancies.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-100/40 px-4 py-2.5 sm:px-6 text-xs text-amber-900 space-y-1">
          {verification.discrepancies.map((disc, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>{disc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
