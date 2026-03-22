const templates = [
  "Food Delivery (Swiggy-style)",
  "E-Commerce India (Flipkart-style)",
  "EdTech Platform (Byju's-style)",
  "Job Portal India (Naukri-style)",
  "Fintech App (Paytm-style)",
  "Property Listing (MagicBricks-style)",
  "GST Billing Software",
  "Tutor Booking (Urban Company-style)",
  "News App India",
  "SaaS Dashboard India",
];

export default function MarketplacePage(): React.ReactElement {
  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Marketplace</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((name) => (
          <article
            key={name}
            className="rounded-2xl border border-brand-border bg-brand-card p-4"
          >
            <h2 className="font-semibold">{name}</h2>
            <p className="mt-2 text-sm text-brand-sub">
              India-first template with UPI-ready flows and localization support.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
