// filepath: /src/utils/keySanitizer.ts

export const dateFields = [
  "B/L Date",
  "INV & PKL Date",
  "CO Date",
  "Rcv Date",
  "ETA/ETD",
  "Received Date",
  "LOAD ON",
  "IM8 DATE",
  "TP DATE",
  "IM7 DATE",
  "SR DATE",
  "CV DATE",
  "IM4 DATE",
  "EX3 DATE",
];

export const dropdownFields: Record<string, string[]> = {
  "Imp/Exp": ["IMPORT", "EXPORT"],
  "Ship'm Mode": ["SEA", "AIR", "LAND"],
  "Vssl/Truck": ["VSSL", "TRUCK"],
};


export const PAGE_SIZE = 20;

export const sanitizeKey = (key: string) =>
  key
    .replace(/[.~*/[\] ]/g, "_")
    .replace("B/L", "B_L")
    .replace("CBM/CIF", "CBM_CIF")
    .replace("ETA/ETD", "ETA_ETD")
    .replace("INV & PKL Date", "INV_PKL_Date")
    .replace("Imp/Exp", "Imp_Exp")
    .replace("Vssl/Truck", "Vssl_Truck");

export const unsanitizeKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace("B L No", "B/L No")
    .replace("B L Date", "B/L Date")
    .replace("CBM CIF", "CBM/CIF")
    .replace("ETA ETD", "ETA/ETD")
    .replace("INV PKL Date", "INV & PKL Date")
    .replace("Imp Exp", "Imp/Exp")
    .replace("Vssl Truck", "Vssl/Truck");

export const columns = [
  "Job",
  "B/L No",
  "B/L Date",
  "Imp/Exp",
  "Ship'm Mode",
  "Importer",
  "Client Name",
  "Inv",
  "PKL",
  "INV & PKL Date",
  "CO Date",
  "Rcv Date",
  "Shipping Line",
  "MBL #",
  "Vssl/Truck",
  "ETA/ETD",
  "LOAD ON",
  "POL",
  "Transit Port",
  "SCAN STATION",
  "Final Destination",
  "Commodity",
  "NW",
  "GW",
  "CBM/CIF",
  "FOB",
  "Container No",
  "Quantity",
  "20'",
  "40'",
  "CONT SIZE",
  "Shipper Name",
  "Received Date",
  "SR NAME",
  "TP",
  "TP DATE",
  "IM8",
  "IM8 DATE",
  "GATE IN DP/BW/SEZ",
  "IM7",
  "IM7 DATE",
  "SR",
  "SR DATE",
  "CV",
  "CV DATE",
  "CO",
  "CO DATE",
  "IM4",
  "IM4 DATE",
  "EX3",
  "EX3 DATE",
  "GATE OUT DP/BW/SEZ",
  "INV",
];
    