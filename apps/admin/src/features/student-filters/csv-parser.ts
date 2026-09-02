export type CsvRecipient = {
  phone: string;
  email: string;
  name: string;
  source: "csv";
};

/**
 * Parse a CSV string into recipients.
 * Expected columns: phone, email, name (order-insensitive, header-matched).
 * Lines with no phone AND no email are skipped.
 */
export function parseCsv(text: string): { recipients: CsvRecipient[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { recipients: [], errors: ["Empty file"] };

  const errors: string[] = [];
  const recipients: CsvRecipient[] = [];

  // Parse header
  const headerLine = lines[0]!;
  const headers = splitCsvLine(headerLine).map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const phoneIdx = headers.findIndex((h) => h === "phone" || h === "mobile" || h === "phone_number" || h === "phonenumber");
  const emailIdx = headers.findIndex((h) => h === "email" || h === "emailaddress" || h === "email_address");
  const nameIdx = headers.findIndex((h) => h === "name" || h === "fullname" || h === "full_name" || h === "studentname");

  if (phoneIdx === -1 && emailIdx === -1) {
    return { recipients: [], errors: ["CSV must have at least a 'phone' or 'email' column"] };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const phone = phoneIdx >= 0 ? (cols[phoneIdx] ?? "").trim() : "";
    const email = emailIdx >= 0 ? (cols[emailIdx] ?? "").trim() : "";
    const name = nameIdx >= 0 ? (cols[nameIdx] ?? "").trim() : `Row ${i + 1}`;

    if (!phone && !email) {
      errors.push(`Row ${i + 1}: skipped (no phone or email)`);
      continue;
    }
    if (phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
      errors.push(`Row ${i + 1}: suspicious phone "${phone}"`);
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${i + 1}: suspicious email "${email}"`);
    }

    recipients.push({ phone, email, name, source: "csv" });
  }

  return { recipients, errors };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

/** Generate a sample CSV template string for download. */
export function csvTemplate(): string {
  return "phone,email,name\n+8801712345678,test@student.com,Test Student\n+8801812345679,,Another Student\n,info@example.com,Email Only Student";
}
