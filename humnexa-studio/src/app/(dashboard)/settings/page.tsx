import { HindiToggle } from "@/components/ui/HindiToggle";

export default function SettingsPage(): React.ReactElement {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="mb-2 font-medium">Appearance</h2>
          <p className="text-sm text-brand-sub">Dark is default for Studio.</p>
          <div className="mt-3 flex gap-2">
            {["Dark", "Light", "System"].map((theme) => (
              <button
                key={theme}
                className="rounded-lg border border-brand-border bg-brand-card2 px-3 py-1.5 text-sm text-brand-sub"
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="mb-2 font-medium">Language</h2>
          <HindiToggle />
        </div>
      </div>
    </section>
  );
}
