/**
 * Generates a deterministic employee ID.
 *
 * Format: {companyCode}{firstName2}{lastName2}{year}{serial4}
 * Example: "OIPIMI20250001" for company "OI", "Piyush Mishra", 2025, serial 1
 */
export function generateEmployeeId(
  companyCode: string,
  firstName: string,
  lastName: string,
  year: number,
  serial: number
): string {
  // Take first 2 chars of each name, uppercase, pad with 'X' if too short
  const f = firstName.slice(0, 2).toUpperCase().padEnd(2, 'X');
  const l = lastName.slice(0, 2).toUpperCase().padEnd(2, 'X');
  const serialStr = String(serial).padStart(4, '0');

  return `${companyCode.toUpperCase()}${f}${l}${year}${serialStr}`;
}

/**
 * Derives a company code from the company name.
 * Takes the first letter of each word (up to 4), uppercased.
 * For single-word names, uses the first 2 characters so the result
 * always satisfies the Company schema minimum length.
 * Example: "Odoo Inc" → "OI", "Tech Corp Ltd" → "TCL", "Acme" → "AC"
 */
export function deriveCompanyCode(companyName: string): string {
  const words = companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'CO';
  }

  if (words.length === 1) {
    return words[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase().padEnd(2, 'X');
  }

  return words
    .map((word) => word[0].toUpperCase())
    .slice(0, 4)
    .join('')
    .slice(0, 6);
}
