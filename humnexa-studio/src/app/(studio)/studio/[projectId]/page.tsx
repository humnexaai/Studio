import { StudioLayout } from "@/components/studio/StudioLayout";

type Props = {
  params: { projectId: string };
};

export default function StudioProjectPage({ params }: Props): React.ReactElement {
  return (
    <main className="min-h-screen bg-brand-bg px-4 py-4 md:px-6">
      <StudioLayout projectId={params.projectId} />
    </main>
  );
}
