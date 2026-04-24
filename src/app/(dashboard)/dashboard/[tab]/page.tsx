import { EditableDashboardTitle } from "@/components/dashboard/EditableDashboardTitle";
import { ProjectTable } from "@/components/dashboard/ProjectTable";
import { DASHBOARD_TABS, isDashboardTabId } from "@/lib/dashboard-tabs";
import { getDashboardAccessState } from "@/lib/dashboard-access";
import { listProjects } from "@/services/project-service";
import { getAppSettingsForDashboard } from "@/services/settings-service";
import { notFound, redirect } from "next/navigation";

/** Alinhado ao `unstable_cache` em listProjects / getAppSettingsForDashboard */
export const revalidate = 30;

type Props = {
  params: { tab: string };
};

export default async function DashboardTabPage({ params }: Props) {
  const { tab } = params;
  if (!isDashboardTabId(tab)) {
    notFound();
  }

  const access = await getDashboardAccessState();
  if (!access.showFullPortfolioNav && tab !== "todos") {
    redirect("/dashboard/todos");
  }

  const label = DASHBOARD_TABS.find((t) => t.id === tab)?.label ?? tab;
  const [projects, appSettings] = await Promise.all([
    listProjects({ tab }),
    getAppSettingsForDashboard(),
  ]);
  const customUi = access.canCustomizeDashboard;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        className="sticky top-0 z-20 -mx-4 mb-0 shrink-0 border-b border-line-subtle/40 bg-background/90 px-4 pb-3 pt-0 shadow-[0_1px_0_0_rgba(145,171,255,0.05),0_12px_32px_-12px_rgba(0,0,0,0.2)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 md:-mx-8 md:px-8"
      >
        <EditableDashboardTitle
          key={tab}
          tab={tab}
          defaultLabel={label}
          readOnly={!customUi}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ProjectTable
          tab={tab}
          projects={projects}
          hourValue={appSettings.hour_value}
          allowTableCustomization={customUi}
        />
      </div>
    </div>
  );
}
