import { Settings } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-primary/10 p-3">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Platform settings will live here.</p>
        </div>
      </div>
      <Card><CardHeader><CardTitle>Coming soon</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Configuration for branding, catalog visibility, and platform defaults.</CardContent></Card>
    </div>
  );
}
