"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { MyPayment } from "@/features/payments/api";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 40, backgroundColor: "#ffffff", color: "#1f2937" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: "#0ea5e9" },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0ea5e9" },
  brandTagline: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  invoiceLabel: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "right" },
  invoiceNumber: { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 },
  invoiceDate: { fontSize: 9, color: "#9ca3af", textAlign: "right", marginTop: 1 },

  statusRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, fontSize: 9, fontFamily: "Helvetica-Bold" },
  badgePaid: { backgroundColor: "#dcfce7", color: "#16a34a" },
  badgePending: { backgroundColor: "#fef3c7", color: "#d97706" },
  badgeFailed: { backgroundColor: "#fee2e2", color: "#dc2626" },

  infoRow: { flexDirection: "row", gap: 16, marginBottom: 28 },
  infoBox: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  infoBoxTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0ea5e9", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  infoLine: { fontSize: 10, color: "#374151", marginBottom: 3 },
  infoLineSmall: { fontSize: 9, color: "#6b7280", marginBottom: 3 },

  table: { marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0ea5e9", borderRadius: 4, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 4 },
  tableHeaderCell: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tableRowAlt: { backgroundColor: "#f9fafb" },
  tableCell: { fontSize: 10, color: "#374151" },
  colCourse: { flex: 1 },
  colPrice: { width: 70, textAlign: "right" },

  totalsSection: { marginLeft: "auto", width: 220, marginBottom: 28 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  totalLabel: { fontSize: 10, color: "#6b7280" },
  totalValue: { fontSize: 10, color: "#374151" },
  totalFinalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "#0ea5e9", borderRadius: 4, marginTop: 4 },
  totalFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  totalFinalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  paymentBox: { backgroundColor: "#f0f9ff", borderRadius: 6, padding: 14, borderWidth: 1, borderColor: "#bae6fd", marginBottom: 28 },
  paymentTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0ea5e9", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  paymentGrid: { flexDirection: "row", gap: 20 },
  paymentItem: { flex: 1 },
  paymentKey: { fontSize: 8, color: "#9ca3af", marginBottom: 2 },
  paymentVal: { fontSize: 10, color: "#374151", fontFamily: "Helvetica-Bold" },

  footer: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 14, flexDirection: "row", justifyContent: "flex-end", alignItems: "center" },
  footerBrand: { fontSize: 8, color: "#0ea5e9", fontFamily: "Helvetica-Bold" },
});

function fmt(v: string | null | undefined) {
  if (!v) return "৳0";
  return `৳${Number(v).toLocaleString("en-BD")}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function invoiceNum(p: MyPayment) {
  return p.displayInvoiceNumber ?? p.paystationInvoiceId ?? `INV-${String(p.paymentId).padStart(6, "0")}`;
}

function methodLabel(p: MyPayment) {
  if (p.method === "bkash")      return "bKash";
  if (p.method === "paystation") return p.paystationMethod ?? "PayStation";
  if (p.method === "free")       return "Free / Coupon";
  return p.method?.toUpperCase() ?? "—";
}

function trxId(p: MyPayment) {
  return p.paystationTrxId ?? p.bkashTrxId ?? "—";
}

export type InvoiceBrand = {
  companyName: string;
  tagline: string;
};

export const DEFAULT_INVOICE_BRAND: InvoiceBrand = {
  companyName: "Skillkoro",
  tagline:     "Online Learning Platform",
};

export function PaymentPDF({ payment, brand = DEFAULT_INVOICE_BRAND }: { payment: MyPayment; brand?: InvoiceBrand }) {
  const status = payment.status;
  const badgeStyle = status === "completed" ? styles.badgePaid : status === "failed" ? styles.badgeFailed : styles.badgePending;
  const statusLabel = status === "completed" ? "PAID" : status === "failed" ? "FAILED" : "PENDING";
  const hasDiscount = parseFloat(payment.discountAmount ?? "0") > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{brand.companyName}</Text>
            <Text style={styles.brandTagline}>{brand.tagline}</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoiceNum(payment)}</Text>
            <Text style={styles.invoiceDate}>{fmtDate(payment.paidAt ?? payment.createdAt)}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <Text style={[styles.badge, badgeStyle]}>{statusLabel}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Order Details</Text>
            <Text style={styles.infoLineSmall}>Order #{payment.orderId}</Text>
            <Text style={styles.infoLineSmall}>Date: {fmtDate(payment.paidAt ?? payment.createdAt)}</Text>
            <Text style={styles.infoLineSmall}>Method: {methodLabel(payment)}</Text>
            {trxId(payment) !== "—" && (
              <Text style={styles.infoLineSmall}>Trx ID: {trxId(payment)}</Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Payment Summary</Text>
            <Text style={styles.infoLineSmall}>Subtotal: {fmt(payment.totalAmount)}</Text>
            {hasDiscount && <Text style={styles.infoLineSmall}>Discount: -{fmt(payment.discountAmount)}</Text>}
            <Text style={[styles.infoLine, { fontFamily: "Helvetica-Bold" }]}>Total Paid: {fmt(payment.finalAmount)}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colCourse]}>Course</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price</Text>
          </View>
          {payment.items.map((item, i) => (
            <View key={item.courseId} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colCourse]}>{item.courseTitle}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{fmt(item.price)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(payment.totalAmount)}</Text>
          </View>
          {hasDiscount && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: "#16a34a" }]}>-{fmt(payment.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>Total Paid</Text>
            <Text style={styles.totalFinalValue}>{fmt(payment.finalAmount)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Payment Information</Text>
          <View style={styles.paymentGrid}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentKey}>METHOD</Text>
              <Text style={styles.paymentVal}>{methodLabel(payment)}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentKey}>TRANSACTION ID</Text>
              <Text style={styles.paymentVal}>{trxId(payment)}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentKey}>STATUS</Text>
              <Text style={styles.paymentVal}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>{brand.companyName}</Text>
        </View>
      </Page>
    </Document>
  );
}
