import { HOME_TEMPLATES, DEFAULT_HOME_TEMPLATE_ID } from "@/features/home-page-templates/registry";
import { HomeTemplatePicker } from "@/features/home-page-templates/HomeTemplatePicker";
import { getHomeTemplateSettingsAction } from "@/features/home-page-templates/actions";

export const metadata = { title: "Website Templates" };

export default async function HomeTemplatesPage() {
  const res = await getHomeTemplateSettingsAction();
  const selectedTemplate = res.success ? res.data.selectedTemplate : DEFAULT_HOME_TEMPLATE_ID;
  const initialColors = res.success ? res.data.colors : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Website Templates</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Pick which layout the public home page renders, and optionally give each template its
          own default color — the swatch on each card. Sections are editable independently via
          &quot;Edit sections&quot;.
        </p>
      </div>
      <HomeTemplatePicker
        templates={HOME_TEMPLATES}
        initialSelected={selectedTemplate}
        initialColors={initialColors}
      />
    </div>
  );
}
