import { createHash } from "crypto";
import { authApi } from "@/features/auth/api";
import { ordersApi } from "@/features/payments/api/orders";
import { isTrackingItemEnabled } from "@/shared/utils/tracking-registry.server";

/**
 * Reads the current session via cookies() (through apiRequest) — same reason
 * this lives in its own component wrapped in <Suspense> at the call site as
 * ConsentUpdate: cookie access forces this subtree dynamic without affecting
 * the rest of the root layout's static shell.
 *
 * Pushes up to two independent, independently-toggleable blocks:
 *  - `user_context` (hashed) — off by default, never sends raw PII, only a
 *    server-computed SHA-256 email hash, role, and lifetime order stats.
 *  - `user_data` (plain, Google Enhanced Conversions shape) — off by default,
 *    sends raw email/phone/name for Google's tag to hash client-side. This is
 *    the one deliberate exception to "no raw PII in dataLayer": Google's
 *    Enhanced Conversions feature is specifically designed to receive it.
 */
export async function UserContext() {
  const [userContextOn, enhancedConversionsOn] = await Promise.all([
    isTrackingItemEnabled("user_context"),
    isTrackingItemEnabled("enhanced_conversions"),
  ]);
  if (!userContextOn && !enhancedConversionsOn) return null;

  const meRes = await authApi.me().catch(() => null);
  const user = meRes?.data ?? null;

  const pushes: Record<string, unknown> = {};

  if (userContextOn) {
    if (!user) {
      pushes.user_context = { logged_in: false };
    } else {
      const statsRes = await ordersApi.getStats().catch(() => null);
      const stats = statsRes?.data ?? { count: 0, totalValue: 0 };
      const emailHash = user.email ? createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex") : null;
      pushes.user_context = {
        logged_in: true,
        role: user.role,
        user_id_hash: createHash("sha256").update(String(user.id)).digest("hex"),
        ...(emailHash ? { email_hash: emailHash } : {}),
        order_count: stats.count,
        order_value: stats.totalValue,
      };
    }
  }

  // Only meaningful for a logged-in user — an anonymous visitor has no profile
  // to send, so this block is simply omitted rather than pushed empty.
  if (enhancedConversionsOn && user) {
    pushes.user_data = {
      ...(user.email ? { email_address: user.email } : {}),
      ...(user.phone ? { phone_number: user.phone } : {}),
      first_name: user.firstName,
      last_name: user.lastName,
      // country/city/postal_code omitted — not collected anywhere in checkout
      // today, so there's no real value to send; Enhanced Conversions supports
      // partial data, sending placeholders would be worse than omitting.
    };
  }

  if (Object.keys(pushes).length === 0) return null;

  return (
    <script
      id="user-context"
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push(${JSON.stringify(pushes)});`,
      }}
    />
  );
}
