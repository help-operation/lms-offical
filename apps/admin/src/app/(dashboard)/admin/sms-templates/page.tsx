import { getSmsTemplatesAction, getBroadcastCountsAction, getAutoSmsEnabledAction } from "@/features/sms-templates/actions";
import { SmsTemplatesClient } from "@/features/sms-templates/SmsTemplatesClient";

export const metadata = { title: "SMS Templates" };

export default async function SmsTemplatesPage() {
  const [templatesRes, countsRes, autoSmsRes] = await Promise.all([
    getSmsTemplatesAction(),
    getBroadcastCountsAction(),
    getAutoSmsEnabledAction(),
  ]);

  const initial = templatesRes.success ? templatesRes.data : [];
  const counts = countsRes.success ? countsRes.data : {};
  const autoSmsEnabled = autoSmsRes.success ? autoSmsRes.data : false;

  return <SmsTemplatesClient initial={initial} counts={counts} autoSmsEnabled={autoSmsEnabled} />;
}
