"use client";

import { useState, useEffect } from "react";
import { Info, WarningCircle, Star } from "@phosphor-icons/react";
import { GatewayTile } from "./GatewayTile";
import { GatewayModal } from "./GatewayModal";
import type { AdminGatewayView } from "./api";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import { toast } from "@repo/ui/sonner";
import { getCheckoutPaymentImageAction, updateCheckoutPaymentImageAction } from "./checkout-image.actions";

interface Props {
  initial: AdminGatewayView[];
}

export function PaymentGatewaysPage({ initial }: Props) {
  const [gateways, setGateways] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  const openGateway = gateways.find((g) => g.id === openId) ?? null;
  const activeGateway = gateways.find((g) => g.isActive);

  function handleSaved(updated: AdminGatewayView[]) {
    setGateways(updated);
  }

  const [checkoutImage, setCheckoutImage] = useState<string>("");
  const [checkoutLoading, setCheckoutLoading] = useState(true);
  const [checkoutSaving, setCheckoutSaving] = useState(false);

  useEffect(() => {
    getCheckoutPaymentImageAction()
      .then((url) => setCheckoutImage(url))
      .catch(() => {})
      .finally(() => setCheckoutLoading(false));
  }, []);

  async function handleSaveCheckoutImage() {
    setCheckoutSaving(true);
    try {
      await updateCheckoutPaymentImageAction(checkoutImage);
      toast.success("Checkout image saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setCheckoutSaving(false);
    }
  }

  async function handleClearCheckoutImage() {
    setCheckoutImage("");
    setCheckoutSaving(true);
    try {
      await updateCheckoutPaymentImageAction("");
      toast.success("Checkout image removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setCheckoutSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Info size={16} weight="fill" className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-300" />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-200">
            <strong>Keep these credentials private.</strong> They authorize real payment processing.
            Click a card to edit — secret fields are encrypted and never shown once saved, leaving one blank keeps its current value.
          </p>
        </div>
        {activeGateway && (
          <div className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-amber-200/70 bg-white/60 px-3 py-1.5 dark:border-amber-500/20 dark:bg-slate-900/40 sm:self-auto">
            <Star size={13} weight="fill" className="text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {activeGateway.name} is charging customers
            </span>
          </div>
        )}
      </div>

      {gateways.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <WarningCircle size={22} weight="fill" className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Couldn&apos;t load payment gateways</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Refresh the page, or check your connection to the server.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gateways.map((gateway, idx) => (
            <GatewayTile
              key={gateway.id}
              gateway={gateway}
              index={idx}
              onOpen={() => setOpenId(gateway.id)}
            />
          ))}
        </div>
      )}

      {/* Checkout Payment Image — global for /checkout */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Checkout Payment Image</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Image shown in Checkout → Payment Method card (VISA / bKash grid). Upload any image, or clear to hide and leave blank.
        </p>
        {checkoutLoading ? (
          <p className="mt-3 text-xs text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="mt-3">
              <ImagePickerField value={checkoutImage} onChange={setCheckoutImage} placeholder="Select payment image or leave blank to hide" previewClassName="hidden" />
            </div>
            {checkoutImage && (
              <div className="mt-3 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1.5 dark:border-slate-600 dark:bg-slate-900">
                <img src={checkoutImage} alt="Checkout preview" className="max-h-16 w-auto rounded object-contain" />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSaveCheckoutImage}
                disabled={checkoutSaving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {checkoutSaving ? "Saving…" : "Save Image"}
              </button>
              {checkoutImage && (
                <button
                  onClick={handleClearCheckoutImage}
                  disabled={checkoutSaving}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  Remove (blank)
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {openGateway && (
        <GatewayModal
          gateway={openGateway}
          onClose={() => setOpenId(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
