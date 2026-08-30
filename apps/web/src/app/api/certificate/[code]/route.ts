import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface CertificateData {
  id: number;
  certificateCode: string;
  issuedAt: string | null;
  studentName: string;
  courseTitle: string;
  courseSlug: string;
}

// ─── PDF Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 0,
    fontFamily: "Helvetica",
  },
  topBar: {
    height: 8,
    backgroundColor: "#7c3aed",
  },
  body: {
    padding: "40px 60px",
    flex: 1,
    alignItems: "center",
  },
  // Border decoration
  outerBorder: {
    width: "100%",
    borderWidth: 3,
    borderColor: "#7c3aed",
    borderStyle: "solid",
    padding: 24,
    alignItems: "center",
    flex: 1,
  },
  innerBorder: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#c4b5fd",
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    flex: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#7c3aed",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  certTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1e1b4b",
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: "center",
  },
  presentedText: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
    textAlign: "center",
  },
  studentName: {
    fontSize: 36,
    fontFamily: "Helvetica-BoldOblique",
    color: "#7c3aed",
    marginBottom: 10,
    textAlign: "center",
  },
  completedText: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 6,
    textAlign: "center",
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e1b4b",
    textAlign: "center",
    marginBottom: 28,
  },
  divider: {
    width: "60%",
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 32,
  },
  metaBox: {
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#f5f3ff",
    borderRadius: 8,
    minWidth: 120,
  },
  metaLabel: {
    fontSize: 8,
    color: "#7c3aed",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e1b4b",
  },
  metaValueMono: {
    fontSize: 10,
    fontFamily: "Courier-Bold",
    color: "#7c3aed",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginTop: 8,
  },
  signatureBlock: {
    alignItems: "center",
    minWidth: 120,
  },
  signatureName: {
    fontSize: 14,
    fontFamily: "Helvetica-BoldOblique",
    color: "#374151",
    marginBottom: 4,
  },
  signatureLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#9ca3af",
    marginBottom: 4,
  },
  signatureTitle: {
    fontSize: 8,
    color: "#9ca3af",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bottomBar: {
    height: 6,
    backgroundColor: "#7c3aed",
    width: "100%",
    marginTop: "auto",
  },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  qr: {
    width: 56,
    height: 56,
  },
  verifyTextBlock: {
    alignItems: "flex-start",
  },
  verifyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginBottom: 2,
  },
  verifyText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────

function CertificateDoc({
  cert,
  issuedDate,
  qrDataUrl,
  verifyHost,
}: {
  cert: CertificateData;
  issuedDate: string;
  qrDataUrl: string;
  verifyHost: string;
}) {
  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      createElement(View, { style: styles.topBar }),
      createElement(
        View,
        { style: styles.body },
        createElement(
          View,
          { style: styles.outerBorder },
          createElement(
            View,
            { style: styles.innerBorder },
            // Brand
            createElement(View, { style: styles.brandRow },
              createElement(Text, { style: styles.brandName }, "SKILLKORO"),
            ),
            createElement(Text, { style: styles.subtitle }, "Certificate of Completion"),

            // Main content
            createElement(Text, { style: styles.certTitle }, "CERTIFICATE"),
            createElement(Text, { style: styles.presentedText }, "This is to certify that"),
            createElement(Text, { style: styles.studentName }, cert.studentName),
            createElement(Text, { style: styles.completedText }, "has successfully completed the course"),
            createElement(Text, { style: styles.courseTitle }, cert.courseTitle),

            // Divider
            createElement(View, { style: styles.divider }),

            // Meta
            createElement(View, { style: styles.metaRow },
              createElement(View, { style: styles.metaBox },
                createElement(Text, { style: styles.metaLabel }, "Issued On"),
                createElement(Text, { style: styles.metaValue }, issuedDate),
              ),
              createElement(View, { style: styles.metaBox },
                createElement(Text, { style: styles.metaLabel }, "Certificate ID"),
                createElement(Text, { style: styles.metaValueMono }, cert.certificateCode),
              ),
            ),

            // Signature
            createElement(View, { style: styles.signatureRow },
              createElement(View, { style: styles.signatureBlock },
                createElement(Text, { style: styles.signatureName }, "Skillkoro"),
                createElement(View, { style: styles.signatureLine }),
                createElement(Text, { style: styles.signatureTitle }, "Authorized Signature"),
              ),
            ),
          ),
        ),
      ),
      // Verify URL + scannable QR code at bottom
      createElement(View, { style: styles.verifyRow },
        createElement(Image, { src: qrDataUrl, style: styles.qr }),
        createElement(View, { style: styles.verifyTextBlock },
          createElement(Text, { style: styles.verifyLabel }, "Scan to verify"),
          createElement(Text, { style: styles.verifyText },
            `${verifyHost}/certificate/${cert.certificateCode}`,
          ),
        ),
      ),
      createElement(View, { style: styles.bottomBar }),
    ),
  );
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  // The public site origin serving this PDF — used for the verification link/QR.
  const { origin, host } = new URL(request.url);

  // Fetch certificate data
  let cert: CertificateData;
  try {
    const res = await fetch(`${BASE_URL}/certificates/verify/${code}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return new NextResponse("Certificate not found", { status: 404 });
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      return new NextResponse("Certificate not found", { status: 404 });
    }
    cert = json.data as CertificateData;
  } catch {
    return new NextResponse("Failed to fetch certificate", { status: 500 });
  }

  const issuedDate = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Build a scannable QR pointing at this certificate's verification page.
  const verifyUrl = `${origin}/certificate/${cert.certificateCode}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 200,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });

  // Generate PDF — cast needed because renderToBuffer expects DocumentProps element
  // but our wrapper component renders a Document internally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    createElement(CertificateDoc, {
      cert,
      issuedDate,
      qrDataUrl,
      verifyHost: host,
    }) as any,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${cert.certificateCode}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
