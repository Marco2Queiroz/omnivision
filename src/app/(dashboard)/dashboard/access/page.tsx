import { isAccessLayerConfigured, listAccessProfiles } from "@/lib/access-service";
import { getDashboardAccessState } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";
import { AccessManagementClient } from "./AccessManagementClient";

export default async function AccessManagementPage() {
  const layerConfigured = isAccessLayerConfigured();
  if (layerConfigured) {
    const access = await getDashboardAccessState();
    if (access.role !== "master") {
      redirect("/dashboard/todos");
    }
  }

  const initialProfiles = await listAccessProfiles();

  return (
    <AccessManagementClient
      initialProfiles={initialProfiles}
      layerConfigured={layerConfigured}
    />
  );
}
