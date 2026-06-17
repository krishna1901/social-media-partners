import {
  Sparkles,
  Type,
  Hash,
  MousePointerClick,
  GalleryHorizontalEnd,
  Clapperboard,
  Recycle,
  FileText,
} from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icon";

const map: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Type,
  Hash,
  MousePointerClick,
  GalleryHorizontalEnd,
  Clapperboard,
  Recycle,
  FileText,
};

/** Resolve an icon by string name (used by demo-data driven components). */
export function Icon({ name, className }: { name: string; className?: string }) {
  if (name === "Linkedin") return <PlatformIcon platform="linkedin" className={className} />;
  if (name === "Instagram") return <PlatformIcon platform="instagram" className={className} />;
  const C = map[name] ?? Sparkles;
  return <C className={className} />;
}
