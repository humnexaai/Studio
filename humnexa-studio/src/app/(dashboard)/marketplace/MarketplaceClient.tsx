"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MarketplaceTemplate = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  priceInr: number;
  framework: string;
  isActive: boolean;
  downloads: number;
  isIndiaSpecific: boolean;
};

const categories = [
  { label: "All", value: "all" },
  { label: "E-Commerce", value: "ecommerce" },
  { label: "Education", value: "education" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Business", value: "business" },
  { label: "Mobile", value: "mobile" },
  { label: "India", value: "india" },
] as const;

export default function MarketplaceClient({
  templates,
}: {
  templates: MarketplaceTemplate[];
}): React.ReactElement {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]["value"]>("all");
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q);
      const matchesCategory =
        category === "all"
          ? true
          : category === "india"
            ? template.isIndiaSpecific || template.category.toLowerCase() === "india"
            : template.category.toLowerCase() === category;
      return matchesSearch && matchesCategory;
    });
  }, [templates, search, category]);

  const applyTemplate = async (template: MarketplaceTemplate): Promise<void> => {
    if (template.priceInr > 0) {
      router.push("/billing");
      return;
    }
    try {
      setCreatingTemplateId(template.id);
      setError(null);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          framework: template.framework,
        }),
      });
      const payload = (await response.json()) as {
        data?: { id?: string };
        error?: string;
      };
      if (!response.ok || !payload.data?.id) {
        throw new Error(payload.error ?? "Unable to create project from template");
      }
      router.push(`/studio/${payload.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to use template");
    } finally {
      setCreatingTemplateId(null);
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Marketplace</h1>
      <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-card p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or description"
          className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                category === item.value
                  ? "border-brand-or bg-brand-or/15 text-brand-text"
                  : "border-brand-border bg-brand-card2 text-brand-sub"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {error ? (
          <p className="text-sm text-brand-error">{error}</p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-center text-brand-sub">
          No templates match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((template) => (
            <article
              key={template.id}
              className="rounded-2xl border border-brand-border bg-brand-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{template.name}</h2>
                <span className="rounded-full border border-brand-border bg-brand-card2 px-2 py-0.5 text-xs text-brand-sub">
                  {template.priceInr === 0 ? "Free" : `₹${template.priceInr}`}
                </span>
              </div>
              <p className="mt-2 text-sm text-brand-sub">{template.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-brand-muted">
                <span className="rounded bg-brand-card2 px-2 py-1">
                  {template.category}
                </span>
                <span className="rounded bg-brand-card2 px-2 py-1">
                  {template.framework}
                </span>
                <span className="rounded bg-brand-card2 px-2 py-1">
                  {template.downloads.toLocaleString("en-IN")} downloads
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  void applyTemplate(template);
                }}
                disabled={creatingTemplateId === template.id}
                className="mt-4 w-full rounded-xl bg-brand-gradient px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creatingTemplateId === template.id
                  ? "Creating..."
                  : template.priceInr === 0
                    ? "Use Template"
                    : "Go to Billing"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
