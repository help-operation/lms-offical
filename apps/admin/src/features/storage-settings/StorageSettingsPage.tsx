"use client";

import { useState } from "react";
import { Info } from "@phosphor-icons/react";
import { StorageConfigTile } from "./StorageConfigTile";
import { StorageConfigModal } from "./StorageConfigModal";
import type { AdminStorageProviderView } from "./api";

interface Props {
  initial: AdminStorageProviderView[];
}

export function StorageSettingsPage({ initial }: Props) {
  const [providers, setProviders] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  const openProvider = providers.find((p) => p.id === openId) ?? null;

  function handleSaved(updated: AdminStorageProviderView[]) {
    setProviders(updated);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
        <Info size={16} weight="fill" className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-300" />
        <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-200">
          <strong>Keep these credentials private.</strong> They control where every image, file, and video on the platform is stored and served.
          Click a card to edit — secret fields are encrypted and never shown once saved, leaving one blank keeps its current value.
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Couldn&apos;t load storage settings</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Refresh the page, or check your connection to the server.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {providers.map((provider, idx) => (
            <StorageConfigTile
              key={provider.id}
              provider={provider}
              index={idx}
              onOpen={() => setOpenId(provider.id)}
            />
          ))}
        </div>
      )}

      {openProvider && (
        <StorageConfigModal
          provider={openProvider}
          onClose={() => setOpenId(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
