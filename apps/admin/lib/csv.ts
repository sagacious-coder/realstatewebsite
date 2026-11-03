/**
 * Formula Injection Protection (RFC 4180 + Excel/Calc CSV Neutralization)
 * Prepends a single-quote (') if the value begins with =, +, -, @, tab (\t), or carriage return (\r)
 */
export function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvDocument(headers: string[], rows: unknown[][]): string {
  const sanitizedHeaders = headers.map((h) => sanitizeCsvValue(h)).join(',');
  const sanitizedRows = rows.map((row) => row.map((cell) => sanitizeCsvValue(cell)).join(','));
  return [sanitizedHeaders, ...sanitizedRows].join('\r\n');
}

