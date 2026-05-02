export function generateEmployeeId(
  companyName: string,
  employeeName: string,
  joinYear: number,
  serialNumber: number
): string {
  // 1. Company Initials (e.g., Odoo India -> OI)
  const companyWords = companyName.trim().split(/\s+/);
  let companyInitials = "";
  if (companyWords.length >= 2) {
    companyInitials = (companyWords[0][0] + companyWords[1][0]).toUpperCase();
  } else {
    // If single word company name, take first two letters
    companyInitials = companyName.substring(0, 2).toUpperCase();
  }

  // 2. Employee Name Logic (First 2 letters of first name, First 2 of last name)
  const nameParts = employeeName.trim().split(/\s+/);
  let nameSegment = "";
  if (nameParts.length >= 2) {
    const first = nameParts[0].substring(0, 2).toUpperCase().padEnd(2, 'X');
    const last = nameParts[nameParts.length - 1].substring(0, 2).toUpperCase().padEnd(2, 'X');
    nameSegment = first + last;
  } else {
    // Single name, use up to 4 characters, padded with X if needed
    nameSegment = nameParts[0].substring(0, 4).toUpperCase().padEnd(4, 'X');
  }

  // 3. Serial Number (padded to 4 digits)
  const serialString = serialNumber.toString().padStart(4, '0');

  // Format: [OI][JODO][2022][0001]
  return `${companyInitials}${nameSegment}${joinYear}${serialString}`;
}
