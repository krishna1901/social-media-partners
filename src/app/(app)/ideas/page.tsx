import { listIdeas } from "@/lib/db/ideas";
import { IdeasView } from "./_view";

export default async function IdeasPage() {
  const ideas = await listIdeas();
  return <IdeasView ideas={ideas} />;
}
