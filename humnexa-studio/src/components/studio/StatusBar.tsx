export function StatusBar(): React.ReactElement {
  return (
    <div className="flex items-center justify-between border-t border-brand-border bg-brand-or/20 px-3 py-2 text-xs text-brand-text">
      <span>⎇ main</span>
      <span>✅ No errors</span>
      <span>🔌 Supabase</span>
      <span>⚡ Groq AI</span>
      <span>📦 Vercel ready</span>
    </div>
  );
}
