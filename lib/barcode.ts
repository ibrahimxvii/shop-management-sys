const SKU_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateSku(prefix = "PRD"): string {
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += SKU_CHARS[Math.floor(Math.random() * SKU_CHARS.length)];
  }
  return `${prefix}-${suffix}`;
}

/** Generates a valid EAN-13 barcode: 12 random digits + computed check digit. */
export function generateEan13Barcode(): string {
  let digits = "";
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return digits + ean13CheckDigit(digits);
}

function ean13CheckDigit(digits12: string): string {
  const sum = digits12
    .split("")
    .reduce((acc, digit, index) => {
      const n = Number(digit);
      return acc + (index % 2 === 0 ? n : n * 3);
    }, 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

export function isValidEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  return ean13CheckDigit(value.slice(0, 12)) === value[12];
}
