/**
 * CSV Parser v2 — column mapping, multiple phone split, duplicate detection, validation.
 *
 * Supports flexible column names:
 *   name/student_name/full_name/studentname
 *   phone/mobile/phone_number/phonenumber/contact_number
 *   email/email_address/emailaddress
 *
 * Multiple phone numbers in one cell (comma/semicolon separated) are split into
 * separate recipient rows. Duplicates are detected and flagged.
 */

export type CsvRecipient = {
  id: string;
  phone: string;
  email: string;
  name: string;
  source: "csv";
  isDuplicate: boolean;
  duplicateOf?: number; // index of first occurrence
};

export type CsvParseResult = {
  recipients: CsvRecipient[];
  totalRows: number;
  validRecipients: number;
  duplicateCount: number;
  invalidCount: number;
  warnings: string[];
  duplicateDetails: { phone: string; count: number; rows: number[] }[];
};

const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalize column name for matching. */
function normalizeCol(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_\-]+/g, "");
}

/** Map a normalized header to our canonical field. */
function mapHeader(norm: string): "name" | "phone" | "email" | null {
  if (["name", "fullname", "full_name", "studentname", "student_name", "firstname", "first_name"].includes(norm)) return "name";
  if (["phone", "mobile", "phonenumber", "phone_number", "contactnumber", "contact_number", "cell", "cellphone"].includes(norm)) return "phone";
  if (["email", "emailaddress", "email_address", "mail"].includes(norm)) return "email";
  return null;
}

/** Split a cell that may contain multiple phone numbers. */
function splitPhones(cell: string): string[] {
  return cell
    .split(/[,;|]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Validate a single phone number. */
function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(phone);
}

/** Validate a single email. */
function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

/** CSV line splitter that respects quoted fields. */
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
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { result.push(current); current = ""; }
      else current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse a CSV string into validated, deduplicated recipients.
 */
export function parseCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) {
    return { recipients: [], totalRows: 0, validRecipients: 0, duplicateCount: 0, invalidCount: 0, warnings: ["Empty file"], duplicateDetails: [] };
  }

  const warnings: string[] = [];
  const recipients: CsvRecipient[] = [];
  const phoneCounts = new Map<string, { count: number; rows: number[] }>();

  // Parse header
  const headers = splitCsvLine(lines[0]!).map((h) => mapHeader(normalizeCol(h)));
  const nameIdx = headers.findIndex((h) => h === "name");
  const phoneIdx = headers.findIndex((h) => h === "phone");
  const emailIdx = headers.findIndex((h) => h === "email");

  if (phoneIdx === -1 && emailIdx === -1) {
    return { recipients: [], totalRows: 0, validRecipients: 0, duplicateCount: 0, invalidCount: 0, warnings: ["CSV must have at least a 'phone' or 'email' column"], duplicateDetails: [] };
  }

  let idCounter = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const rawName = nameIdx >= 0 ? (cols[nameIdx] ?? "").trim() : "";
    const rawPhone = phoneIdx >= 0 ? (cols[phoneIdx] ?? "").trim() : "";
    const rawEmail = emailIdx >= 0 ? (cols[emailIdx] ?? "").trim() : "";

    const name = rawName || `Row ${i + 1}`;

    // Split multiple phones
    const phones = rawPhone ? splitPhones(rawPhone) : [];
    const emails = rawEmail ? [rawEmail.trim()] : [];

    // If no phone and no email, skip
    if (phones.length === 0 && emails.length === 0) {
      warnings.push(`Row ${i + 1}: skipped (no phone or email)`);
      continue;
    }

    // Create recipient for each phone
    for (const phone of phones) {
      if (!isValidPhone(phone)) {
        warnings.push(`Row ${i + 1}: invalid phone "${phone}"`);
      }

      const dup = phoneCounts.get(phone);
      const isDup = !!dup && dup.count > 0;
      const dupIdx = isDup ? dup!.rows[0]! : undefined;

      if (dup) {
        dup.count++;
        dup.rows.push(i);
      } else {
        phoneCounts.set(phone, { count: 1, rows: [i] });
      }

      recipients.push({
        id: `csv-${++idCounter}`,
        phone,
        email: emails[0] ?? "",
        name,
        source: "csv",
        isDuplicate: isDup,
        duplicateOf: dupIdx,
      });
    }

    // If no phone but has email
    if (phones.length === 0 && emails.length > 0) {
      for (const email of emails) {
        if (!isValidEmail(email)) {
          warnings.push(`Row ${i + 1}: invalid email "${email}"`);
        }
        recipients.push({
          id: `csv-${++idCounter}`,
          phone: "",
          email,
          name,
          source: "csv",
          isDuplicate: false,
        });
      }
    }
  }

  // Build duplicate details
  const duplicateDetails: { phone: string; count: number; rows: number[] }[] = [];
  for (const [phone, info] of phoneCounts) {
    if (info.count > 1) {
      duplicateDetails.push({ phone, count: info.count, rows: info.rows });
    }
  }

  const totalRows = lines.length - 1;
  const validRecipients = recipients.filter((r) => r.phone ? isValidPhone(r.phone) : isValidEmail(r.email)).length;
  const duplicateCount = duplicateDetails.reduce((sum, d) => sum + d.count - 1, 0);
  const invalidCount = recipients.length - validRecipients - duplicateCount;

  return {
    recipients,
    totalRows,
    validRecipients,
    duplicateCount,
    invalidCount: Math.max(0, invalidCount),
    warnings,
    duplicateDetails,
  };
}

/** Generate a sample CSV template string for download. */
export function csvTemplate(): string {
  return [
    "name,phone,email",
    "Rahim Uddin,01712345678,rahim@email.com",
    "Karim Ahmed,01812345678,01912345678,karim@email.com",
    "Fatima Begum,,fatima@email.com",
    "Test User,01612345678,",
  ].join("\n");
}

/** Phone number normalization for dedup comparison. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()+\s]/g, "").replace(/^880/, "0").replace(/^00880/, "0");
}
