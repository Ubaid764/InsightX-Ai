import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useDataset } from "@/lib/dataset-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <SettingsPage />
      </AppShell>
    </RequireAuth>
  ),
});

function SettingsPage() {
  const { user } = useAuth();
  const { setDataset } = useDataset();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? ""));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const clearAll = async () => {
    if (!user) return;
    if (!confirm("Delete ALL your saved reports? This cannot be undone.")) return;
    const { error } = await supabase.from("reports").delete().eq("user_id", user.id);
    setDataset(null);
    if (error) toast.error(error.message);
    else toast.success("All reports deleted");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dn">Display name</Label>
            <Input
              id="dn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="bg-gradient-brand text-primary-foreground hover:opacity-90"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Theme</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the toggle in the top bar to switch between dark and light mode. Your preference is
          saved automatically.
        </p>
      </div>

      <div className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Delete all your saved reports and the current dataset from this device.
        </p>
        <Button onClick={clearAll} variant="destructive" className="mt-4">
          Clear saved data
        </Button>
      </div>
    </div>
  );
}
