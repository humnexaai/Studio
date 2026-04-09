import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MarketplaceClient from "./MarketplaceClient";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Template Marketplace",
};

export const revalidate = 3600;

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

type ExploreProject = {
  id: string;
  name: string;
  framework: string;
  createdAt: string;
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

export default async function MarketplacePage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

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

  const { data: publicProjectsRows } = await supabase
    .from("projects")
    .select("id,name,framework,created_at,is_public")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);

  const exploreProjects: ExploreProject[] = (publicProjectsRows ?? []).map((row) => {
    const typed = row as {
      id: string;
      name: string;
      framework: string;
      created_at: string;
    };
    return {
      id: typed.id,
      name: typed.name,
      framework: typed.framework,
      createdAt: typed.created_at,
    };
  });

  return (
    <MarketplaceClient
      templates={templates}
      myTemplates={myTemplates}
      exploreProjects={exploreProjects}
    />
  );
}
