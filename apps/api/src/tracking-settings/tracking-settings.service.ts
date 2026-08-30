import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { trackingSettings } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';

export type TrackingSettingsDto = {
  gtmId?: string | null;
  ga4Id?: string | null;
  fbPixelId?: string | null;
  fbCapiAccessToken?: string | null;
  fbCapiTestEventCode?: string | null;
  clarityId?: string | null;
  gadsId?: string | null;
  gscVerification?: string | null;
  eventPageView?: boolean;
  eventViewItem?: boolean;
  eventViewItemList?: boolean;
  eventSelectItem?: boolean;
  eventAddToCart?: boolean;
  eventRemoveFromCart?: boolean;
  eventBeginCheckout?: boolean;
  eventPurchase?: boolean;
  eventSignUp?: boolean;
  eventLogin?: boolean;
};

@Injectable()
export class TrackingSettingsService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  /** Returns the single tracking-settings row, creating it if it doesn't exist. */
  async findOrCreate() {
    const rows = await this.db.select().from(trackingSettings).limit(1);

    if (rows.length > 0) return rows[0];

    const [created] = await this.db
      .insert(trackingSettings)
      .values({})
      .returning();

    return created;
  }

  /**
   * Public-safe projection for the unauthenticated /tracking-settings GET
   * (fetched by the web app to inject scripts). Must never include the CAPI
   * access token — that's a server secret used only for server-to-server
   * calls to Meta, not something the browser needs.
   */
  async findOrCreatePublic() {
    const {
      gtmId, ga4Id, fbPixelId, clarityId, gadsId, gscVerification,
      eventPageView, eventViewItem, eventViewItemList, eventSelectItem, eventAddToCart,
      eventRemoveFromCart, eventBeginCheckout, eventPurchase, eventSignUp, eventLogin,
    } = await this.findOrCreate();
    return {
      gtmId, ga4Id, fbPixelId, clarityId, gadsId, gscVerification,
      eventPageView, eventViewItem, eventViewItemList, eventSelectItem, eventAddToCart,
      eventRemoveFromCart, eventBeginCheckout, eventPurchase, eventSignUp, eventLogin,
    };
  }

  async update(dto: TrackingSettingsDto) {
    const current = await this.findOrCreate();

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.gtmId              !== undefined) patch.gtmId              = dto.gtmId              || null;
    if (dto.ga4Id              !== undefined) patch.ga4Id              = dto.ga4Id              || null;
    if (dto.fbPixelId          !== undefined) patch.fbPixelId          = dto.fbPixelId          || null;
    if (dto.fbCapiAccessToken  !== undefined) patch.fbCapiAccessToken  = dto.fbCapiAccessToken  || null;
    if (dto.fbCapiTestEventCode !== undefined) patch.fbCapiTestEventCode = dto.fbCapiTestEventCode || null;
    if (dto.clarityId          !== undefined) patch.clarityId          = dto.clarityId          || null;
    if (dto.gadsId             !== undefined) patch.gadsId             = dto.gadsId             || null;
    if (dto.gscVerification    !== undefined) patch.gscVerification    = dto.gscVerification    || null;
    if (dto.eventPageView       !== undefined) patch.eventPageView       = dto.eventPageView;
    if (dto.eventViewItem       !== undefined) patch.eventViewItem       = dto.eventViewItem;
    if (dto.eventViewItemList   !== undefined) patch.eventViewItemList   = dto.eventViewItemList;
    if (dto.eventSelectItem     !== undefined) patch.eventSelectItem     = dto.eventSelectItem;
    if (dto.eventAddToCart      !== undefined) patch.eventAddToCart      = dto.eventAddToCart;
    if (dto.eventRemoveFromCart !== undefined) patch.eventRemoveFromCart = dto.eventRemoveFromCart;
    if (dto.eventBeginCheckout  !== undefined) patch.eventBeginCheckout  = dto.eventBeginCheckout;
    if (dto.eventPurchase       !== undefined) patch.eventPurchase       = dto.eventPurchase;
    if (dto.eventSignUp         !== undefined) patch.eventSignUp         = dto.eventSignUp;
    if (dto.eventLogin          !== undefined) patch.eventLogin          = dto.eventLogin;

    const [updated] = await this.db
      .update(trackingSettings)
      .set(patch)
      .where(eq(trackingSettings.id, current.id))
      .returning();

    this.revalidation.revalidate([CacheTag.trackingSettings]);
    return updated;
  }
}
