type ActivityItem = {
  id: string;
  title: string;
  time: string;
  type: "build" | "deploy" | "billing" | "project" | "usage" | "purchase" | "refund" | "bonus";
};

export function ActivityFeed({
  items,
}: {
  items: ActivityItem[];
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
      <h3 className="text-lg font-semibold">Recent Activity</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-brand-border/60 bg-brand-card2 px-3 py-2 text-sm text-brand-sub"
          >
            <p>{item.title}</p>
            <p className="mt-1 text-xs text-brand-muted">{item.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
