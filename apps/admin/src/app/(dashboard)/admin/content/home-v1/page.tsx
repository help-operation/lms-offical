import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { EskillsGreenEditor } from "@/features/home-page-templates/EskillsGreenEditor";
import { getHomeTemplateSettingsAction } from "@/features/home-page-templates/actions";
import { getHomeTemplate } from "@/features/home-page-templates/registry";
import { isHexColor } from "@/shared/utils/color";

export const metadata = { title: "Home Template — Elevate" };

export default async function HomeV1ContentPage() {
  const [res, settingsRes] = await Promise.all([
    pageSectionsAdminApi.getByPage("home-v1").catch(() => null),
    getHomeTemplateSettingsAction(),
  ]);
  const sections = res?.data ?? [];

  // Same color priority the public site uses (see apps/web/src/app/layout.tsx):
  // this template's own saved color wins; otherwise its built-in default —
  // so the preview matches what visitors actually see instead of the admin
  // dashboard's own brand color.
  const templateColor = settingsRes.success ? settingsRes.data.colors["home-v1"] : undefined;
  const previewColor =
    templateColor && isHexColor(templateColor)
      ? templateColor
      : getHomeTemplate("home-v1").accent.hex;

  return <EskillsGreenEditor initialSections={sections} previewColor={previewColor} />;
}
