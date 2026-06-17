import { listInbox } from "@/lib/db/inbox";
import { InboxView } from "./_view";

export default async function InboxPage() {
  const threads = await listInbox();
  return <InboxView threads={threads} />;
}
