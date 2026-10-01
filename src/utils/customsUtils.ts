import { CustomsInvoice, HSCodeGroup, InvoiceItem, TotalsVerification } from "../types/customs";
import { JUMBO_MASSMART_INVOICE } from "./jumboInvoice";
import { SHOPRITE_CHECKERS_INVOICE } from "./shopriteInvoice";

export function formatCurrency(value: number, _currency = "ZAR"): string {
  const safeVal = Number(value) || 0;
  return `R ${safeVal.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function cleanHSCode(code: string | undefined): string {
  if (!code) return "999999";
  // Strip non-alphanumeric except dots
  const cleaned = code.trim().replace(/[^0-9.]/g, "");
  return cleaned || "999999";
}

export function groupItemsByHSCode(items: InvoiceItem[]): HSCodeGroup[] {
  const groupMap = new Map<string, InvoiceItem[]>();
  const descMap = new Map<string, string>();

  items.forEach((item) => {
    const key = cleanHSCode(item.hsCode);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      if (item.hsDescription) {
        descMap.set(key, item.hsDescription);
      }
    }
    groupMap.get(key)!.push(item);
  });

  const groups: HSCodeGroup[] = [];

  groupMap.forEach((groupItems, hsCode) => {
    let subtotalOuter = 0;
    let subtotalInner = 0;
    let subtotalNet = 0;
    let subtotalVat = 0;
    let subtotalGross = 0;

    const pkgCounts: Record<string, number> = {};
    const uomCounts: Record<string, number> = {};

    groupItems.forEach((it) => {
      subtotalOuter += Number(it.outerQuantity) || 0;
      subtotalInner += Number(it.innerUnits) || 0;
      subtotalNet += Number(it.netValue) || 0;
      subtotalVat += Number(it.vatAmount) || 0;
      subtotalGross += Number(it.grossValue) || 0;

      const pType = it.outerPackageType || "Cartons";
      pkgCounts[pType] = (pkgCounts[pType] || 0) + (Number(it.outerQuantity) || 0);

      const uom = it.unitOfMeasure || "PCS";
      uomCounts[uom] = (uomCounts[uom] || 0) + (Number(it.innerUnits) || 0);
    });

    // Find dominant package type and UOM
    const dominantPackageType =
      Object.entries(pkgCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Cases";
    const dominantUOM =
      Object.entries(uomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "PCS";

    // Auto-description if not provided
    const hsDescription =
      descMap.get(hsCode) ||
      getTariffDescriptionFallback(hsCode) ||
      `Commodity Heading ${hsCode}`;

    groups.push({
      hsCode,
      hsDescription,
      items: groupItems,
      subtotalOuterQty: Math.round(subtotalOuter * 100) / 100,
      subtotalInnerUnits: Math.round(subtotalInner),
      subtotalNetValue: Math.round(subtotalNet * 100) / 100,
      subtotalVatAmount: Math.round(subtotalVat * 100) / 100,
      subtotalGrossValue: Math.round(subtotalGross * 100) / 100,
      dominantPackageType,
      dominantUOM,
    });
  });

  // Sort groups alphabetically by HS Code
  return groups.sort((a, b) => a.hsCode.localeCompare(b.hsCode));
}

export function calculateConsolidatedTotals(groups: HSCodeGroup[], freight = 0, insurance = 0) {
  let totalCases = 0;
  let totalUnits = 0;
  let totalNet = 0;
  let totalVat = 0;
  let totalGross = 0;

  groups.forEach((g) => {
    totalCases += g.subtotalOuterQty;
    totalUnits += g.subtotalInnerUnits;
    totalNet += g.subtotalNetValue;
    totalVat += g.subtotalVatAmount;
    totalGross += g.subtotalGrossValue;
  });

  const sundryTotal = Math.round(((freight || 0) + (insurance || 0)) * 100) / 100;
  const lineGross = Math.round(totalGross * 100) / 100;
  const totalInvoiceValue = Math.round((lineGross + sundryTotal) * 100) / 100;

  return {
    totalCases: Math.round(totalCases * 100) / 100,
    totalUnits: Math.round(totalUnits),
    totalNet: Math.round(totalNet * 100) / 100,
    totalVat: Math.round(totalVat * 100) / 100,
    totalGross: lineGross,
    freight: Math.round((freight || 0) * 100) / 100,
    insurance: Math.round((insurance || 0) * 100) / 100,
    sundryTotal,
    totalInvoiceValue,
  };
}

export function verifyTotals(invoice: CustomsInvoice): TotalsVerification {
  const groups = groupItemsByHSCode(invoice.items);
  const freight = invoice.freightAmount || invoice.statedTotals?.freight || 0;
  const insurance = invoice.insuranceAmount || invoice.statedTotals?.insurance || 0;
  const calculated = calculateConsolidatedTotals(groups, freight, insurance);
  const stated = invoice.statedTotals;

  const discrepancies: string[] = [];

  // Check item level math
  invoice.items.forEach((item, idx) => {
    const computedNet = Math.round(item.innerUnits * item.unitPrice * 100) / 100;
    const diffNet = Math.abs(computedNet - item.netValue);
    // Allow tolerance for commercial wholesale bulk packaging decimal rounding
    if ((diffNet > 10.0 || (diffNet > 0.50 && Math.abs(diffNet / (item.netValue || 1)) > 0.02)) && item.unitPrice > 0 && item.innerUnits > 0) {
      discrepancies.push(
        `Item #${idx + 1} (${item.productDescription.slice(0, 24)}...): Unit Price x Units = R ${computedNet.toFixed(2)}, but stated line Net Value is R ${item.netValue.toFixed(2)}`
      );
    }

    const computedGross = Math.round((item.netValue + item.vatAmount) * 100) / 100;
    const diffGross = Math.abs(computedGross - item.grossValue);
    if (diffGross > 0.50 && Math.abs(diffGross / (item.grossValue || 1)) > 0.01) {
      discrepancies.push(
        `Item #${idx + 1}: Line Net (R ${item.netValue.toFixed(2)}) + VAT (R ${item.vatAmount.toFixed(2)}) = R ${computedGross.toFixed(2)}, but Gross is R ${item.grossValue.toFixed(2)}`
      );
    }
  });

  let varianceGross = 0;
  const statedTarget = stated?.totalInvoiceValue ?? stated?.grossValue;
  if (statedTarget !== undefined && statedTarget > 0) {
    varianceGross = Math.round((calculated.totalInvoiceValue - statedTarget) * 100) / 100;
    if (Math.abs(varianceGross) > 0.05) {
      discrepancies.push(
        `Header total invoice value (R ${statedTarget.toFixed(2)}) differs from calculated total [Lines R ${calculated.totalGross.toFixed(2)} + Freight R ${calculated.freight.toFixed(2)} + Insurance R ${calculated.insurance.toFixed(2)} = R ${calculated.totalInvoiceValue.toFixed(2)}] by ${varianceGross > 0 ? "+" : ""}R ${varianceGross.toFixed(2)}`
      );
    }
  }

  if (stated && stated.innerUnits !== undefined && stated.innerUnits > 0) {
    const diffUnits = Math.abs(calculated.totalUnits - stated.innerUnits);
    if (diffUnits > 1) {
      discrepancies.push(
        `Invoice header total units (${stated.innerUnits}) differs from line item sum (${calculated.totalUnits})`
      );
    }
  }

  return {
    isValid: discrepancies.length === 0,
    calculatedOuterCases: calculated.totalCases,
    calculatedInnerUnits: calculated.totalUnits,
    calculatedNetValue: calculated.totalNet,
    calculatedVatAmount: calculated.totalVat,
    calculatedGrossValue: calculated.totalGross,
    freight: calculated.freight,
    insurance: calculated.insurance,
    totalInvoiceValue: calculated.totalInvoiceValue,
    statedGrossValue: statedTarget,
    varianceGross,
    discrepancies,
  };
}

export function getTariffDescriptionFallback(hsCode: string): string {
  const prefix = hsCode.replace(/\D/g, "").slice(0, 4);
  const commonMap: Record<string, string> = {
    "2103": "Sauces and preparations therefor; mixed condiments and seasonings",
    "3306": "Preparations for oral or dental hygiene (toothpaste, dental floss)",
    "1605": "Crustaceans, molluscs and other aquatic invertebrates, prepared or preserved",
    "1902": "Pasta, cooked or prepared, including instant noodles",
    "2005": "Other vegetables prepared or preserved otherwise than by vinegar or acetic acid",
    "3208": "Paints and varnishes based on synthetic polymers or chemically modified polymers",
    "3918": "Floor coverings of plastics, whether or not self-adhesive",
    "3919": "Self-adhesive plates, sheets, film, foil, tape, strip and other flat shapes",
    "3921": "Other plates, sheets, film, foil and strip, of plastics",
    "3924": "Tableware, kitchenware, other household articles and toilet articles of plastics",
    "3926": "Other articles of plastics and articles of other materials of headings 3901 to 3914",
    "4016": "Other articles of vulcanised rubber other than hard rubber",
    "4202": "Trunks, suitcases, vanity cases, executive-cases, briefcases, cooler bags",
    "4419": "Tableware and kitchenware, of wood or bamboo",
    "4421": "Other articles of wood (Skewers, toothpicks)",
    "4820": "Registers, account books, note books, order books, receipt books, letter pads",
    "4823": "Other paper, paperboard, cellulose wadding and webs of cellulose fibres",
    "5603": "Nonwovens, whether or not impregnated, coated, covered or laminated",
    "5702": "Carpets and other textile floor coverings, woven",
    "6111": "Babies' garments and clothing accessories, knitted or crocheted",
    "6117": "Other made up clothing accessories, knitted or crocheted",
    "6304": "Other furnishing articles, excluding those of heading 9404",
    "6307": "Other made up articles, including dress patterns, cleaning cloths & swabs",
    "6402": "Other footwear with outer soles and uppers of rubber or plastics",
    "6506": "Other headgear, whether or not lined or trimmed",
    "6911": "Tableware, kitchenware, other household articles and toilet articles, of porcelain or china",
    "6912": "Ceramic tableware, kitchenware, other household articles and toilet articles",
    "7013": "Glassware of a kind used for table, kitchen, toilet, office, indoor decoration",
    "7321": "Stoves, ranges, grates, cookers, barbecues, braais of iron or steel",
    "7323": "Table, kitchen or other household articles and parts thereof, of iron or steel",
    "7418": "Table, kitchen or other household articles and parts thereof, of copper",
    "7615": "Table, kitchen or other household articles and parts thereof, of aluminium",
    "8210": "Hand-operated mechanical appliances, weighing 10 kg or less, used in preparation of food",
    "8211": "Knives with cutting blades, serrated or not, and blades therefor",
    "8212": "Razors and razor blades (including razor blade blanks in strips)",
    "8213": "Scissors, tailors' shears and similar shears, and blades therefor",
    "8214": "Other articles of cutlery; manicure or pedicure sets and instruments",
    "8301": "Padlocks and locks, clasps and frames with clasps, incorporating locks",
    "8302": "Base metal mountings, fittings and similar articles suitable for furniture, doors",
    "8414": "Air or vacuum pumps, air or other gas compressors and fans",
    "8424": "Mechanical appliances for projecting, dispersing or spraying liquids or powders",
    "8516": "Electric instantaneous or storage water heaters and immersion heaters; electric space heaters",
    "8536": "Electrical apparatus for switching or protecting electrical circuits",
    "8539": "Electric filament or discharge lamps; LED light sources",
    "8544": "Insulated wire, cable and other insulated electric conductors",
    "8708": "Parts and accessories of motor vehicles of headings 8701 to 8705",
    "8712": "Bicycles and other cycles, not motorised",
    "9401": "Seats, whether or not convertible into beds, and parts thereof",
    "9403": "Other furniture and parts thereof",
    "9503": "Tricycles, scooters, pedal cars and similar wheeled toys; dolls; puzzles",
    "9504": "Video game consoles and machines, table or parlour games",
    "9505": "Festive, carnival or other entertainment articles",
    "9506": "Articles and equipment for general physical exercise, gymnastics, athletics, other sports",
    "9603": "Brooms, brushes, hand-operated mechanical floor sweepers, mops and feather dusters",
    "9608": "Ball-point pens; felt-tipped and other porous-tipped pens and markers",
    "9609": "Pencils, crayons, pencil leads, pastels, drawing charcoals",
    "9613": "Cigarette lighters and other lighters, whether or not mechanical or electrical",
    "9617": "Vacuum flasks and other vacuum vessels, complete with cases; parts thereof",
    "9619": "Sanitary towels (pads) and tampons, napkins and napkin liners for babies",
    "1701": "Cane or beet sugar and chemically pure sucrose, in solid form",
    "1704": "Sugar confectionery (including white chocolate), not containing cocoa",
    "1806": "Chocolate and other food preparations containing cocoa",
    "1905": "Bread, pastry, cakes, biscuits and other bakers' wares",
    "2008": "Fruit, nuts and other edible parts of plants, otherwise prepared or preserved",
    "2009": "Fruit juices and vegetable juices, unfermented and not containing added spirit",
    "2102": "Yeasts; other single-cell micro-organisms, dead; prepared baking powders",
    "2106": "Food preparations not elsewhere specified or included",
    "2202": "Waters, including mineral waters and aerated waters, containing added sugar or flavoured",
    "2204": "Wine of fresh grapes, including fortified wines; grape must",
    "2206": "Other fermented beverages (for example, cider, perry, mead, saké)",
    "2208": "Undenatured ethyl alcohol of an alcoholic strength by volume of less than 80 % vol; spirits",
    "2710": "Petroleum oils and oils obtained from bituminous minerals",
    "2905": "Acyclic alcohols and their halogenated, sulphonated, nitrated or nitrosated derivatives",
    "3304": "Beauty or make-up preparations and preparations for the care of the skin",
    "3305": "Preparations for use on the hair (shampoos, conditioners)",
    "3307": "Pre-shave, shaving or after-shave preparations, personal deodorants, bath preparations",
    "3401": "Soap; organic surface-active products and preparations for use as soap",
    "3402": "Organic surface-active agents; washing preparations and cleaning preparations",
    "3506": "Prepared glues and other prepared adhesives, not elsewhere specified",
    "3606": "Ferro-cerium and other pyrophoric alloys; articles of combustible materials",
    "3809": "Finishing agents, dye carriers, fabric softeners",
    "4802": "Uncoated paper and paperboard, of a kind used for writing, printing or other graphic purposes",
    "4817": "Envelopes, letter cards, plain postcards and correspondence cards, of paper or paperboard",
    "4821": "Paper or paperboard labels of all kinds, whether or not printed",
    "4901": "Printed books, brochures, leaflets and similar printed matter",
    "4903": "Children's picture, drawing or colouring books",
  };
  return commonMap[prefix] || `Tariff Heading ${hsCode}`;
}

export const SAMPLE_INVOICES: CustomsInvoice[] = [
  JUMBO_MASSMART_INVOICE,
  SHOPRITE_CHECKERS_INVOICE,
];

