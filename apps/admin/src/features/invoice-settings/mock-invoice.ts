import type { Invoice } from "@/features/invoices/api";

/** Sample data for the live design editor preview — never sent anywhere. */
export const MOCK_INVOICE: Invoice = {
  type: "regular",
  paymentId: 1,
  amount: "4500.00",
  method: "paystation",
  status: "completed",
  paystationInvoiceId: "PS-1-1730000000000",
  displayInvoiceNumber: "SKINV-2025-0001",
  paystationTrxId: "TRX123456",
  paystationMethod: "bKash",
  bkashTrxId: null,
  paidAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  orderId: 1,
  totalAmount: "5000.00",
  discountAmount: "500.00",
  finalAmount: "4500.00",
  orderStatus: "paid",
  userId: 1,
  firstName: "Rafiq",
  lastName: "Hossain",
  email: "rafiq@example.com",
  phone: "+880 1710-000000",
  items: [
    { courseId: 1, courseTitle: "Complete Web Development Bootcamp", courseSlug: "web-dev-bootcamp", price: "3500.00" },
    { courseId: 2, courseTitle: "Advanced React & Next.js", courseSlug: "advanced-react-nextjs", price: "1500.00" },
  ],
};
