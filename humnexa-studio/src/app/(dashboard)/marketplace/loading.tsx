export default function Loading(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-brand-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-2 border-t-orange-500" />
    </div>
  );
}
