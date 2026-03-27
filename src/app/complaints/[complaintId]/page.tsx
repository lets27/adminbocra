import { ComplaintDetailView } from "@/components/dashboard/complaint-detail-view";

type ComplaintDetailPageProps = {
  params: Promise<{ complaintId: string }>;
};

export default async function ComplaintDetailPage({
  params,
}: ComplaintDetailPageProps) {
  const { complaintId } = await params;

  return <ComplaintDetailView complaintId={complaintId} />;
}
