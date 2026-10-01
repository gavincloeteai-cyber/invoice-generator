export interface InvoiceItem {
  id: string;
  itemNumber: string;
  productDescription: string;
  hsCode: string;
  hsDescription?: string;
  countryOfOrigin: string;
  outerQuantity: number;
  outerPackageType: string;
  innerUnits: number;
  unitOfMeasure: string;
  unitPrice: number;
  netValue: number;
  vatRate: number; // e.g. 20 for 20%
  vatAmount: number;
  grossValue: number;
}

export interface HSCodeGroup {
  hsCode: string;
  hsDescription: string;
  items: InvoiceItem[];
  subtotalOuterQty: number;
  subtotalInnerUnits: number;
  subtotalNetValue: number;
  subtotalVatAmount: number;
  subtotalGrossValue: number;
  dominantPackageType: string;
  dominantUOM: string;
}

export interface TraderDetails {
  name: string;
  address: string;
  taxId: string; // VAT or EORI or Customs Reg #
  country: string;
}

export interface StatedTotals {
  outerCases?: number;
  innerUnits?: number;
  netValue?: number;
  vatAmount?: number;
  grossValue?: number;
  freight?: number;
  insurance?: number;
  sundryTotal?: number;
  totalInvoiceValue?: number;
}

export interface CustomsInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: string; // Rand (ZAR)
  incoterms: string;
  customsRef?: string;
  portOfEntry?: string;
  consignmentNumber?: string;
  buyerReference?: string;
  ucrNumber?: string;
  transportDetails?: string;
  grossWeight?: string;
  netWeight?: string;
  totalCube?: string;
  freightAmount?: number;
  insuranceAmount?: number;
  supplier: TraderDetails;
  customer: TraderDetails;
  items: InvoiceItem[];
  statedTotals?: StatedTotals;
  notes?: string;
  createdAt: string;
  originalFileName?: string;
}

export interface TotalsVerification {
  isValid: boolean;
  calculatedOuterCases: number;
  calculatedInnerUnits: number;
  calculatedNetValue: number;
  calculatedVatAmount: number;
  calculatedGrossValue: number;
  freight: number;
  insurance: number;
  totalInvoiceValue: number;
  statedGrossValue?: number;
  varianceGross: number;
  discrepancies: string[];
}
