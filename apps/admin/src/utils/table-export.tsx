"use client";

import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

// ─── Generic export field ─────────────────────────────────────────────────────

export interface ExportField<T = unknown> {
  header: string;
  getValue: (item: T) => string;
  /** Relative flex weight for PDF column width */
  flex?: number;
}

// ─── Company info ─────────────────────────────────────────────────────────────

export interface CompanyInfo {
  siteName:     string;
  tagline:      string;
  logoUrl:      string;
  email:        string;
  phone:        string;
  phone2:       string;
  whatsapp:     string;
  address:      string;
  tradeLicense: string;
  copyright:    string;
}

export function settingsToCompanyInfo(s: Record<string, string>): CompanyInfo {
  return {
    siteName:     s["general_site_name"]       ?? "",
    tagline:      s["general_tagline"]          ?? "",
    logoUrl:      s["general_logo_url"]         ?? "",
    email:        s["general_contact_email"]    ?? "",
    phone:        s["general_contact_phone"]    ?? "",
    phone2:       s["general_contact_phone2"]   ?? "",
    whatsapp:     s["general_support_whatsapp"] ?? "",
    address:      s["general_address"]          ?? "",
    tradeLicense: s["general_trade_license"]    ?? "",
    copyright:    s["general_copyright"]        ?? "",
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function exportTableAsCsv<T>(
  data: T[],
  fields: ExportField<T>[],
  filename = "export",
): void {
  const headers = fields.map((f) => f.header);
  const rows    = data.map((item) => fields.map((f) => f.getValue(item)));

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

export async function exportTableAsXlsx<T>(
  data: T[],
  fields: ExportField<T>[],
  filename = "export",
): Promise<void> {
  const { utils, writeFile } = await import("xlsx");

  const rows = data.map((item) => {
    const row: Record<string, string | number> = {};
    fields.forEach((f) => { row[f.header] = f.getValue(item); });
    return row;
  });

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Data");
  writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

const pdfStyles = {
  page:         { padding: 30, fontSize: 9, fontFamily: "Helvetica" } as const,
  companyRow:   { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-start" as const, marginBottom: 12 },
  companyLeft:  { flexDirection: "column" as const, maxWidth: "55%" as const },
  logo:         { width: 90, height: 36, objectFit: "contain" as const, marginBottom: 4 },
  siteName:     { fontSize: 16, fontWeight: "bold", color: "#111827" } as const,
  tagline:      { fontSize: 8, color: "#6b7280", marginTop: 2 } as const,
  companyRight: { flexDirection: "column" as const, alignItems: "flex-end" as const, gap: 2 },
  contactLine:  { fontSize: 7.5, color: "#4b5563" } as const,
  divider:      { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginBottom: 12 } as const,
  exportTitle:  { fontSize: 13, fontWeight: "bold", color: "#111827", marginBottom: 3 } as const,
  exportMeta:   { fontSize: 7.5, color: "#6b7280", marginBottom: 12 } as const,
  headerRow: {
    flexDirection: "row" as const,
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  row: {
    flexDirection: "row" as const,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  rowAlt: {
    flexDirection: "row" as const,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
    backgroundColor: "#fafafa",
  },
};

function TablePdfDocument<T>({
  data,
  fields,
  company,
  logoDataUrl,
  exportTitle = "Export",
}: {
  data: T[];
  fields: ExportField<T>[];
  company: CompanyInfo;
  logoDataUrl: string | null;
  exportTitle?: string;
}) {
  const contactLines = [
    company.email        && `Email: ${company.email}`,
    company.phone        && `Phone: ${company.phone}`,
    company.phone2       && `Phone: ${company.phone2}`,
    company.whatsapp     && `WhatsApp: ${company.whatsapp}`,
    company.address      && company.address,
    company.tradeLicense && `Trade License: ${company.tradeLicense}`,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>

        {/* Company header */}
        <View style={pdfStyles.companyRow}>
          <View style={pdfStyles.companyLeft}>
            {logoDataUrl
              ? <Image src={logoDataUrl} style={pdfStyles.logo} />
              : <Text style={pdfStyles.siteName}>{company.siteName || "Company"}</Text>
            }
            {company.tagline ? <Text style={pdfStyles.tagline}>{company.tagline}</Text> : null}
          </View>
          {contactLines.length > 0 && (
            <View style={pdfStyles.companyRight}>
              {contactLines.map((line, i) => (
                <Text key={i} style={pdfStyles.contactLine}>{line}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={pdfStyles.divider} />

        <Text style={pdfStyles.exportTitle}>{exportTitle}</Text>
        <Text style={pdfStyles.exportMeta}>
          {data.length} record{data.length !== 1 ? "s" : ""} · Generated {new Date().toLocaleString()}
        </Text>

        {/* Header row */}
        <View style={pdfStyles.headerRow}>
          {fields.map((f) => (
            <Text key={f.header} style={{ flex: f.flex ?? 1, fontSize: 7.5, fontWeight: "bold", color: "#111827" }}>
              {f.header}
            </Text>
          ))}
        </View>

        {/* Data rows */}
        {data.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? pdfStyles.row : pdfStyles.rowAlt}>
            {fields.map((f) => (
              <Text key={f.header} style={{ flex: f.flex ?? 1, fontSize: 7.5, color: "#374151" }}>
                {f.getValue(item)}
              </Text>
            ))}
          </View>
        ))}

      </Page>
    </Document>
  );
}

export async function exportTableAsPdf<T>(
  data: T[],
  fields: ExportField<T>[],
  company: CompanyInfo,
  logoDataUrl: string | null,
  filename = "export",
  exportTitle = "Export",
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(
    <TablePdfDocument
      data={data}
      fields={fields}
      company={company}
      logoDataUrl={logoDataUrl}
      exportTitle={exportTitle}
    />
  ).toBlob();
  downloadBlob(blob, `${filename}.pdf`);
}
