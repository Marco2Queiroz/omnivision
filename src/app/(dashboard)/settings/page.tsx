import { AdminSettingsView } from "@/components/settings/AdminSettingsView";
import {
  getAppSettings,
  listStatusConfigs,
} from "@/services/settings-service";
import { isAccessLayerConfigured, listAccessProfiles } from "@/lib/access-service";
import { listImportLogs } from "@/services/import-logs-service";
import { assertSettingsAccess } from "@/lib/settings-access";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await assertSettingsAccess();
  const [profiles, layerConfigured, appSettings, statuses, importLogs] =
    await Promise.all([
      listAccessProfiles(),
      Promise.resolve(isAccessLayerConfigured()),
      getAppSettings(),
      listStatusConfigs(),
      listImportLogs(30),
    ]);

  return (
    <AdminSettingsView
      initialProfiles={profiles}
      layerConfigured={layerConfigured}
      appSettings={appSettings}
      statusConfigs={statuses}
      importLogs={importLogs}
    />
  );
}
