import { formatInr } from "@/lib/utils";

const plans = [
  { name: "Free", price: 0, credits: 100, popular: false },
  { name: "Starter", price: 199, credits: 500, popular: false },
  { name: "Pro", price: 499, credits: 2500, popular: true },
  { name: "Business", price: 999, credits: 10000, popular: false },
];

const transactions = [
  { id: "txn-1", type: "Plan upgrade", amount: 499, status: "paid" },
  { id: "txn-2", type: "Credits purchase", amount: 199, status: "paid" },
];

export default function BillingPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <p className="text-sm text-brand-sub">Current plan</p>
        <h1 className="mt-1 text-2xl font-bold">Pro — 2,500 credits</h1>
        <div className="mt-4 h-2 rounded-full bg-brand-card2">
          <div className="h-full w-1/2 rounded-full bg-brand-gradient" />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="relative rounded-2xl border border-brand-border bg-brand-card p-4"
          >
            {plan.popular ? (
              <span className="absolute right-3 top-3 rounded-full bg-brand-or/20 px-2 py-1 text-xs text-brand-or">
                Most Popular
              </span>
            ) : null}
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-1 text-2xl font-bold">{formatInr(plan.price)}</p>
            <p className="text-sm text-brand-sub">{plan.credits} credits/month</p>
            <button className="mt-4 w-full rounded-xl bg-brand-gradient px-3 py-2 text-sm font-semibold">
              Choose Plan
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-brand-border bg-brand-card">
        <header className="border-b border-brand-border px-5 py-4">
          <h2 className="text-lg font-semibold">Transactions</h2>
        </header>
        <div className="divide-y divide-brand-border">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">{txn.type}</p>
                <p className="text-xs text-brand-muted">{txn.id}</p>
              </div>
              <div className="text-right">
                <p>{formatInr(txn.amount)}</p>
                <p className="text-xs capitalize text-brand-gr">{txn.status}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
