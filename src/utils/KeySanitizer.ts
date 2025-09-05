// filepath: /src/utils/keySanitizer.ts
export const unsanitizeKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace("BL No", "B/L No")
    .replace("B L Date", "B/L Date")
    .replace("CBM CIF", "CBM/CIF")
    .replace("ETA ETD", "ETA/ETD")
    .replace("INV PKL Date", "INV & PKL Date")
    .replace("Imp Exp", "Imp/Exp")
    .replace("Vssl Truck", "Vssl/Truck")
    .replace("clientName", "Client Name")
    .replace("blNo", "B/L No");