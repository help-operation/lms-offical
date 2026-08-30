'use client';

import { usePushNotifications } from '@/shared/hooks/usePushNotifications';

export function PushInitializer({ enabled }: { enabled: boolean }) {
  usePushNotifications(enabled);
  return null;
}
