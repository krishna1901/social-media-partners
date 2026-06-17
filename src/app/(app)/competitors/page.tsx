import { listCompetitors, listCompetitorPosts } from "@/lib/db/competitors";
import { CompetitorsView } from "./_view";

export default async function CompetitorsPage() {
  const [competitors, competitorPosts] = await Promise.all([
    listCompetitors(),
    listCompetitorPosts(),
  ]);
  return <CompetitorsView competitors={competitors} competitorPosts={competitorPosts} />;
}
