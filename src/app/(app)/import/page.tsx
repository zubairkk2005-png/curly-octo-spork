import { PageHeader } from "@/components/common/page-header";
import { ImportWizard } from "@/components/import/import-wizard";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Import your orders" description="Upload a CSV, check the preview, and we'll calculate your real profit." />
      <ImportWizard />
    </div>
  );
}
