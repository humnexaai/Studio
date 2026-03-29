import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MarketplaceClient from "./MarketplaceClient";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Template Marketplace",
};

type TemplateSeed = {
  slug: string;
  title: string;
  category: string;
  description: string;
  price_inr: number;
  framework: string;
  is_india_specific: boolean;
  is_active: boolean;
  downloads: number;
};

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
  rating: number;
};

type MyTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  priceInr: number;
  downloads: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
};

const TEMPLATE_SEED: TemplateSeed[] = [
  {
    slug: "food-delivery",
    title: "Food Delivery",
    category: "ecommerce",
    description: "Food ordering and delivery flow with UPI-ready checkout.",
    price_inr: 0,
    framework: "nextjs",
    is_india_specific: true,
    is_active: true,
    downloads: 1200,
  },
  {
    slug: "edtech-platform",
    title: "EdTech Platform",
    category: "education",
    description: "Courses, batches, payments, and student progress dashboard.",
    price_inr: 0,
    framework: "nextjs",
    is_india_specific: true,
    is_active: true,
    downloads: 1100,
  },
  {
    slug: "gst-billing",
    title: "GST Billing",
    category: "business",
    description: "GST invoice generation, tax summaries, and export workflows.",
    price_inr: 0,
    framework: "react",
    is_india_specific: true,
    is_active: true,
    downloads: 1000,
  },
  {
    slug: "portfolio-india",
    title: "Portfolio India",
    category: "portfolio",
    description: "Developer portfolio starter with India-focused social sections.",
    price_inr: 0,
    framework: "nextjs",
    is_india_specific: true,
    is_active: true,
    downloads: 950,
  },
  {
    slug: "ecommerce-india",
    title: "E-Commerce India",
    category: "ecommerce",
    description: "Catalog, cart, COD/UPI options, and order tracking workflows.",
    price_inr: 0,
    framework: "nextjs",
    is_india_specific: true,
    is_active: true,
    downloads: 900,
  },
  {
    slug: "job-portal",
    title: "Job Portal",
    category: "business",
    description: "Employers, candidates, listings, and application tracking.",
    price_inr: 0,
    framework: "react",
    is_india_specific: true,
    is_active: true,
    downloads: 820,
  },
  {
    slug: "fintech-app",
    title: "Fintech App",
    category: "india",
    description: "Wallet, transfers, statement history, and KYC UI shell.",
    price_inr: 499,
    framework: "nextjs",
    is_india_specific: true,
    is_active: true,
    downloads: 790,
  },
  {
    slug: "property-listing",
    title: "Property Listing",
    category: "business",
    description: "Buy/rent listings, inquiries, broker workflows, and maps.",
    price_inr: 0,
    framework: "react",
    is_india_specific: true,
    is_active: true,
    downloads: 760,
  },
  {
    slug: "news-app-india",
    title: "News App India",
    category: "india",
    description: "Trending feeds, categories, bookmarks, and share actions.",
    price_inr: 0,
    framework: "nextjs",
    is_india_specific: true,
    is_active: true,
    downloads: 740,
  },
  {
    slug: "saas-dashboard",
    title: "SaaS Dashboard",
    category: "business",
    description: "Analytics, billing, team management, and role-based sections.",
    price_inr: 0,
    framework: "nextjs",
    is_india_specific: true,
    is_active: true,
    downloads: 700,
  },
];

async function seedTemplatesIfEmpty(): Promise<void> {
  const supabase = createSupabaseServer();
  const { data: existing } = await supabase.from("templates").select("id").limit(1);
  if ((existing ?? []).length > 0) return;

  const admin = createSupabaseAdmin();
  const db = admin as unknown as {
    from: (table: string) => {
      insert: (values: Array<Record<string, unknown>>) => Promise<{
        error: { message?: string } | null;
      }>;
    };
  };
  const rows = TEMPLATE_SEED.map((template) => ({
    slug: template.slug,
    title: template.title,
    category: template.category,
    description: template.description,
    price_inr: template.price_inr,
    is_active: template.is_active,
    downloads: template.downloads,
    is_india_specific: template.is_india_specific,
    framework: template.framework,
    metadata: {
      framework: template.framework,
      is_active: template.is_active,
      downloads: template.downloads,
      is_india_specific: template.is_india_specific,
    },
  }));

  const { error } = await db.from("templates").insert(rows);
  if (!error) return;

  // Fallback for schema variants where these columns are only inside metadata.
  await db.from("templates").insert(
    TEMPLATE_SEED.map((template) => ({
      slug: template.slug,
      title: template.title,
      category: template.category,
      description: template.description,
      price_inr: template.price_inr,
      metadata: {
        framework: template.framework,
        is_active: template.is_active,
        downloads: template.downloads,
        is_india_specific: template.is_india_specific,
      },
    })),
  );
}

export default async function MarketplacePage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  await seedTemplatesIfEmpty();

  const initialQuery = await supabase
    .from("templates")
    .select(
      "id,slug,title,category,description,price_inr,metadata,is_active,downloads,is_india_specific,framework",
    )
    .eq("is_active", true)
    .order("downloads", { ascending: false });

  const fallbackQuery = initialQuery.error
    ? await supabase
        .from("templates")
        .select("id,slug,title,category,description,price_inr,metadata")
        .order("created_at", { ascending: false })
    : null;

  const rows = (
    initialQuery.error ? fallbackQuery?.data ?? [] : initialQuery.data ?? []
  ) as Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    description: string;
    price_inr: number;
    framework?: string | null;
    is_active?: boolean;
    downloads?: number;
    is_india_specific?: boolean;
    metadata?: {
      framework?: string;
      is_active?: boolean;
      downloads?: number;
      is_india_specific?: boolean;
    } | null;
  }>;

  const templates: MarketplaceTemplate[] = rows
    .map((row) => ({
      id: row.id,
      name: row.title,
      slug: row.slug,
      category: row.category,
      description: row.description,
      priceInr: row.price_inr,
      framework: row.framework ?? row.metadata?.framework ?? "nextjs",
      isActive: row.is_active ?? row.metadata?.is_active ?? true,
      downloads: row.downloads ?? row.metadata?.downloads ?? 0,
      isIndiaSpecific: row.is_india_specific ?? row.metadata?.is_india_specific ?? false,
      rating: 0,
    }))
    .filter((item) => item.isActive)
    .sort((a, b) => b.downloads - a.downloads);

  const myRowsResponse = await supabase
    .from("templates")
    .select(
      "id,title,category,price_inr,is_active,downloads,rating,created_at,metadata,creator_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const myRows = (myRowsResponse.data ??
    []) as Array<{
    id: string;
    title: string;
    category: string;
    price_inr: number;
    is_active?: boolean;
    downloads?: number;
    rating?: number | null;
    created_at: string;
    creator_id?: string | null;
    metadata?: {
      creator_id?: string | null;
      rating?: number | null;
      description?: string | null;
    } | null;
  }>;

  const myTemplates: MyTemplate[] = myRows
    .filter((row) => {
      const creatorId = row.creator_id ?? row.metadata?.creator_id ?? null;
      return creatorId === user.id;
    })
    .map((row) => ({
      id: row.id,
      name: row.title,
      category: row.category,
      description: row.metadata?.description ?? "",
      priceInr: row.price_inr,
      downloads: row.downloads ?? 0,
      rating: row.rating ?? row.metadata?.rating ?? 0,
      isActive: row.is_active ?? false,
      createdAt: row.created_at,
    }));

  return <MarketplaceClient templates={templates} myTemplates={myTemplates} />;
}
