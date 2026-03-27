import { OperatorDetailView } from "@/components/dashboard/operator-detail-view";

type OperatorDetailPageProps = {
  params: Promise<{
    operatorId: string;
  }>;
};

export default async function OperatorDetailPage({
  params,
}: OperatorDetailPageProps) {
  const { operatorId } = await params;

  return <OperatorDetailView operatorId={operatorId} />;
}
