import { listCalendarEvents } from "@/lib/db/calendar";
import { CalendarView } from "./_view";

export default async function ContentCalendarPage() {
  const events = await listCalendarEvents();
  return <CalendarView events={events} />;
}
