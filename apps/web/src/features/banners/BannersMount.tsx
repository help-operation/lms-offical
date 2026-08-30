import { getPublicBanners } from "@/features/cms/api/banners";
import { TopStripBanner } from "./TopStripBanner";
import { PopupBanner } from "./PopupBanner";

/**
 * Server entry for public banners. Renders the first active top strip in-flow
 * (place right under the header) and the first active popup as a fixed overlay.
 */
export async function BannersMount() {
  const { popup, top_strip } = await getPublicBanners();
  const strip = top_strip[0];
  const modal = popup[0];

  if (!strip && !modal) return null;

  return (
    <>
      {strip && <TopStripBanner banner={strip} />}
      {modal && <PopupBanner banner={modal} />}
    </>
  );
}
