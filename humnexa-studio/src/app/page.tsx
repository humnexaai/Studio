import { redirect } from "next/navigation";
import { ArrowRight, Mic, Paperclip, Sparkles } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";

const promptChips = [
  "Build me a GST billing dashboard with invoice PDF",
  "Create a Swiggy-style food delivery app",
  "Make an EdTech app with Hindi + English support",
  "Add Razorpay UPI checkout to my SaaS app",
  "Design a portfolio with blog and contact form",
  "Generate a WhatsApp-first ecommerce storefront",
];

const projectCards = [
  { title: "Bharat Billing", status: "Live", stack: "Next.js + Supabase" },
  { title: "TutorFlow", status: "Draft", stack: "React + Razorpay" },
  { title: "Naukri Pro", status: "Building", stack: "Next.js + Groq" },
];

export default function Home(): React.ReactElement {
  async function handleBuild(formData: FormData): Promise<void> {
    "use server";
    const idea = String(formData.get("idea") ?? "").trim();
    const framework = String(formData.get("framework") ?? "nextjs").trim();
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth");
    }
    const { data } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: idea ? idea.slice(0, 60) : "New Project",
        framework,
        status: "idle",
      })
      .select("id")
      .single();
    if (!data?.id) {
      redirect("/dashboard");
    }
    redirect(`/studio/${data.id}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-bg px-6 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-or blur-[140px]" />
        <div className="absolute bottom-0 right-20 h-56 w-56 rounded-full bg-brand-gr blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surf px-3 py-1 text-xs text-brand-sub">
            <Sparkles className="h-3.5 w-3.5 text-brand-or" />
            India&apos;s universal AI app builder
          </p>
          <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">
            What do you want to build today?
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-brand-sub">
            Idea → App → Launch → Earn. Build with any language, ship faster,
            and pay in INR.
          </p>
        </div>

        <section className="rounded-3xl border border-brand-border bg-brand-card p-4 shadow-2xl shadow-brand-or/10 md:p-6">
          <form action={handleBuild}>
            <textarea
              name="idea"
              rows={4}
              placeholder="Describe your app idea. Example: Build a GST-compliant invoicing app with UPI checkout and WhatsApp sharing..."
              className="w-full resize-none rounded-2xl border border-brand-border bg-brand-card2 p-4 text-sm text-brand-text outline-none ring-brand-or transition focus:ring-2"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                name="framework"
                defaultValue="nextjs"
                className="rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-sub outline-none"
              >
                <option value="nextjs">Next.js</option>
                <option value="react">React</option>
                <option value="vue">Vue</option>
              </select>
              <button
                type="button"
                className="rounded-xl border border-brand-border bg-brand-card2 p-2 text-brand-sub transition hover:text-brand-text"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-xl border border-brand-border bg-brand-card2 p-2 text-brand-sub transition hover:text-brand-text"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 font-semibold text-white transition hover:opacity-90"
              >
                Build it 🚀
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>

        <section className="flex gap-3 overflow-x-auto pb-2">
          {promptChips.map((chip) => (
            <button
              key={chip}
              className="shrink-0 rounded-full border border-brand-border bg-brand-surf px-4 py-2 text-sm text-brand-sub transition hover:border-brand-or hover:text-brand-text"
            >
              {chip}
            </button>
          ))}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent Projects</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {projectCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-brand-border bg-brand-card p-4"
              >
                <p className="text-sm text-brand-sub">{card.status}</p>
                <h3 className="mt-2 text-xl font-semibold">{card.title}</h3>
                <p className="mt-1 text-sm text-brand-muted">{card.stack}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="grid gap-3 rounded-2xl border border-brand-border bg-brand-surf p-4 text-center md:grid-cols-4 md:text-left">
          <Metric label="Developers" value="50K+" />
          <Metric label="Apps Built" value="12K+" />
          <Metric label="Starting" value="₹420/mo" />
          <Metric label="Uptime" value="99.9%" />
        </footer>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-brand-border/60 bg-brand-card/40 p-3">
      <p className="text-xs uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="font-display text-xl font-extrabold text-brand-text">{value}</p>
    </div>
  );
}
