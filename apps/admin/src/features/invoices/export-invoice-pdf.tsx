import { createRoot } from "react-dom/client";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";
import type { Invoice } from "@/features/invoices/api";
import { InvoiceHtmlTemplate, INVOICE_PAGE_SIZES, type InvoiceBrandSettings, type InvoicePageFormat } from "./InvoiceHtmlTemplate";

/** Waits for every <img> under `el` to finish loading (or fail) before capture. */
function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve());
            img.addEventListener("error", () => resolve());
          }),
    ),
  ).then(() => undefined);
}

/**
 * Renders the invoice HTML template off-screen, snapshots it with html2canvas,
 * and embeds the snapshot into a single-page PDF via jsPDF. Text becomes a
 * raster image inside the PDF (not selectable) — a deliberate trade-off for
 * avoiding a server-side headless-browser dependency.
 */
export async function exportInvoiceToPdf(
  invoice: Invoice,
  brand: InvoiceBrandSettings | undefined,
  overrides: StyleOverrides | undefined,
  filename: string,
  templateId?: string,
  pageFormat: InvoicePageFormat = "a4",
): Promise<void> {
  // Lazy-loaded: both libraries choke Next.js's SSR module graph if imported
  // statically (jsPDF's fflate dependency references a Worker Next can't
  // resolve server-side), even though this function only ever runs client-side.
  //
  // html2canvas-pro (not plain html2canvas) is required here: Tailwind v4's
  // default palette compiles to oklch() colors, and the original html2canvas
  // throws "Attempting to parse an unsupported color function" on any oklch
  // value — which is effectively every Tailwind color utility in the invoice
  // templates. html2canvas-pro is a maintained fork that adds oklch/lab/lch
  // support and is otherwise a drop-in replacement.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const pageSize = INVOICE_PAGE_SIZES[pageFormat];

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${pageSize.width}px`;
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(<InvoiceHtmlTemplate invoice={invoice} brand={brand} overrides={overrides} templateId={templateId} pageFormat={pageFormat} />);
      // Let React commit before we start polling for images / measuring.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const target = container.firstElementChild as HTMLElement | null;
    if (!target) return;

    await waitForImages(target);

    const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: pageSize.pdfFormat });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      pageWidth,
      Math.min(imgHeight, pageHeight),
    );
    pdf.save(filename);
  } finally {
    root.unmount();
    container.remove();
  }
}
