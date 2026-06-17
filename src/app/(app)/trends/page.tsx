import { listTrends } from "@/lib/db/trends";
import { TrendsView } from "./_view";

export default async function TrendsPage() {
  const trends = await listTrends();
  return <TrendsView trends={trends} />;
}
