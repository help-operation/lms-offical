import { CreditCard } from "@phosphor-icons/react";

export interface GatewayMeta {
  icon: typeof CreditCard;
  description: string;
  color: { bg: string; text: string; darkBg: string; darkText: string };
}

export const GATEWAY_META: Record<string, GatewayMeta> = {
  paystation: {
    icon: CreditCard,
    description: "Cards, mobile banking & more via PayStation",
    color: { bg: "bg-blue-100", text: "text-blue-600", darkBg: "dark:bg-blue-500/10", darkText: "dark:text-blue-300" },
  },
  bkash: {
    icon: CreditCard,
    description: "Mobile wallet payments via bKash",
    color: { bg: "bg-pink-100", text: "text-pink-600", darkBg: "dark:bg-pink-500/10", darkText: "dark:text-pink-300" },
  },
};

export const DEFAULT_GATEWAY_META: GatewayMeta = {
  icon: CreditCard,
  description: "Payment gateway credentials",
  color: { bg: "bg-gray-100", text: "text-gray-600", darkBg: "dark:bg-slate-800", darkText: "dark:text-gray-300" },
};

export function getGatewayMeta(id: string): GatewayMeta {
  return GATEWAY_META[id] ?? DEFAULT_GATEWAY_META;
}
