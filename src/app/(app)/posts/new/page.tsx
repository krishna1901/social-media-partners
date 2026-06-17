"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Sparkles,
  Copy,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  X,
  Image as ImageIcon,
  GalleryHorizontalEnd,
  Video,
  Type,
  Hash,
  MousePointerClick,
  StickyNote,
  Smartphone,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { platformMeta, type Platform } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const POST_TYPES = [
  { value: "carousel", label: "Carousel", icon: GalleryHorizontalEnd },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "video", label: "Video", icon: Video },
  { value: "text", label: "Text", icon: Type },
];

const SCHEDULE_MODES = [
  { value: "now", label: "Post now" },
  { value: "queue", label: "Add to queue" },
  { value: "custom", label: "Custom" },
];

const CHANNELS: Platform[] = ["instagram", "linkedin", "x", "tiktok", "youtube", "facebook"];

const AI_ACTIONS = ["Generate hook", "Generate caption", "Generate hashtags", "Improve CTA"];

const MEDIA_THUMBS = [
  { id: "att1", gradient: "from-orange-400 to-rose-500", label: "cover.png" },
  { id: "att2", gradient: "from-violet-500 to-indigo-600", label: "reel.mp4" },
  { id: "att3", gradient: "from-sky-500 to-cyan-500", label: "carousel.zip" },
];

export default function NewPostPage() {
  const [selectedChannels, setSelectedChannels] = useState<Set<Platform>>(
    new Set<Platform>(["instagram", "linkedin"])
  );
  const [postType, setPostType] = useState("carousel");
  const [captionTab, setCaptionTab] = useState("universal");
  const [scheduleMode, setScheduleMode] = useState("queue");

  const [title, setTitle] = useState("");
  const [universalCaption, setUniversalCaption] = useState(
    "We rebuilt our entire content system in a weekend — here's the exact playbook we used to ship 10x faster. 🚀"
  );
  const [igCaption, setIgCaption] = useState("");
  const [liCaption, setLiCaption] = useState("");
  const [attachments, setAttachments] = useState(MEDIA_THUMBS);

  const toggleChannel = (p: Platform) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const previewPlatform: Platform =
    (Array.from(selectedChannels)[0] as Platform) ?? "instagram";
  const previewCaption =
    (previewPlatform === "instagram" && igCaption) ||
    (previewPlatform === "linkedin" && liCaption) ||
    universalCaption ||
    "Your caption preview will appear here. Start typing to see it come to life across your selected channels.";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/posts">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to posts
          </Button>
        </Link>
      </div>

      <PageHeader
        title="New Post"
        description="Compose, preview and schedule across channels."
        actions={
          <>
            <Button variant="ghost">Save draft</Button>
            <Button variant="outline">Mark ready</Button>
            <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-90">
              <CalendarDays className="h-4 w-4" /> Schedule post
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT — editor */}
        <div className="space-y-6 lg:col-span-8">
          {/* Details */}
          <ChartCard title="Details" subtitle="The essentials for this post">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  placeholder="e.g. 5 AI tools every solo marketer needs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-topic">Topic</Label>
                <Input id="post-topic" placeholder="e.g. AI workflows, content systems" />
              </div>
              <div className="space-y-1.5">
                <Label>Post type</Label>
                <Segmented options={POST_TYPES} value={postType} onValueChange={setPostType} />
              </div>
            </div>
          </ChartCard>

          {/* Channels */}
          <ChartCard
            title="Channels"
            subtitle="Pick where this post goes live"
            action={
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                {selectedChannels.size} selected
              </span>
            }
          >
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((p) => {
                const active = selectedChannels.has(p);
                const meta = platformMeta[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleChannel(p)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "border-transparent bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20"
                        : "border-border bg-card text-muted-foreground hover:border-brand-200 hover:text-foreground"
                    )}
                  >
                    <PlatformIcon platform={p} className="h-4 w-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </ChartCard>

          {/* Captions */}
          <ChartCard title="Captions" subtitle="Tailor copy per platform">
            <Tabs value={captionTab} onValueChange={(v) => setCaptionTab(v as string)}>
              <TabsList>
                <TabsTrigger value="universal">Universal</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              </TabsList>

              <TabsContent value="universal" className="mt-3">
                <Textarea
                  rows={5}
                  placeholder="A single caption used everywhere unless overridden…"
                  value={universalCaption}
                  onChange={(e) => setUniversalCaption(e.target.value)}
                />
                <p className="mt-1.5 text-right text-[11px] text-muted-foreground">
                  {universalCaption.length} characters
                </p>
              </TabsContent>

              <TabsContent value="instagram" className="mt-3">
                <Textarea
                  rows={5}
                  placeholder="Punchy caption with emoji & line breaks for Instagram…"
                  value={igCaption}
                  onChange={(e) => setIgCaption(e.target.value)}
                />
                <p className="mt-1.5 text-right text-[11px] text-muted-foreground">
                  {igCaption.length} / 2,200 characters
                </p>
              </TabsContent>

              <TabsContent value="linkedin" className="mt-3">
                <Textarea
                  rows={5}
                  placeholder="Authority-building post with a strong hook for LinkedIn…"
                  value={liCaption}
                  onChange={(e) => setLiCaption(e.target.value)}
                />
                <p className="mt-1.5 text-right text-[11px] text-muted-foreground">
                  {liCaption.length} / 3,000 characters
                </p>
              </TabsContent>
            </Tabs>
          </ChartCard>

          {/* Hashtags / CTA / Notes */}
          <ChartCard title="Optimization" subtitle="Hashtags, CTA and internal notes">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hashtags" className="gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Hashtags
                </Label>
                <Textarea
                  id="hashtags"
                  rows={2}
                  defaultValue="#contentmarketing #creators #socialmedia #aitools"
                  placeholder="#contentmarketing #creators #aitools"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cta" className="gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" /> Call to action
                </Label>
                <Input id="cta" placeholder="Follow for more content systems →" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" /> Internal notes
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Notes for your team — context, approvals, reminders…"
                />
              </div>
            </div>
          </ChartCard>

          {/* Media */}
          <ChartCard title="Media" subtitle="Attach images, video or carousels">
            <div className="space-y-4">
              <UploadDropzone hint="Drop media for this post — images, video, ZIPs up to 200MB" />
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {attachments.map((a) => (
                    <div key={a.id} className="group/thumb relative">
                      <div
                        className={cn(
                          "aspect-square w-full rounded-xl bg-gradient-to-br shadow-sm",
                          a.gradient
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        aria-label={`Remove ${a.label}`}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">{a.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        {/* RIGHT — sidebar */}
        <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          {/* Preview */}
          <ChartCard title="Preview" subtitle="How it looks once published">
            <div className="mx-auto max-w-[280px] rounded-3xl border border-border bg-card p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <PlatformBadge platform={previewPlatform} />
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-coral-500 text-xs font-semibold text-white">
                  RS
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Rivera Studio</p>
                  <p className="text-[10px] text-muted-foreground">@riverastudio · now</p>
                </div>
              </div>
              <p className="mb-3 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                {previewCaption}
              </p>
              <div className="aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-brand-500 via-coral-400 to-amber-400 shadow-sm" />
              <div className="mt-3 flex items-center gap-4 text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <Heart className="h-4 w-4" /> 1.2K
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <MessageCircle className="h-4 w-4" /> 86
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <Send className="h-4 w-4" /> 24
                </span>
                <Bookmark className="ml-auto h-4 w-4" />
              </div>
            </div>
          </ChartCard>

          {/* AI assist */}
          <ChartCard
            title="AI assist"
            subtitle="Let SocialFlow AI draft for you"
            action={<Wand2 className="h-4 w-4 text-brand-500" />}
          >
            <div className="space-y-2">
              {AI_ACTIONS.map((label) => (
                <Button key={label} variant="outline" className="w-full justify-start">
                  <Sparkles className="h-4 w-4 text-brand-500" /> {label}
                </Button>
              ))}
              <p className="pt-1 text-center text-[11px] text-muted-foreground">
                Powered by SocialFlow AI
              </p>
            </div>
          </ChartCard>

          {/* Schedule */}
          <ChartCard title="Schedule" subtitle="Choose when this goes out">
            <div className="space-y-4">
              <Segmented
                options={SCHEDULE_MODES}
                value={scheduleMode}
                onValueChange={setScheduleMode}
                className="w-full"
                size="sm"
              />

              {scheduleMode === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-date">Date</Label>
                    <Input id="sched-date" type="date" defaultValue="2026-06-18" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-time">Time</Label>
                    <Input id="sched-time" type="time" defaultValue="09:00" />
                  </div>
                </div>
              )}

              {scheduleMode === "now" && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  This post will publish immediately to {selectedChannels.size} channel
                  {selectedChannels.size === 1 ? "" : "s"}.
                </p>
              )}

              {scheduleMode === "queue" && (
                <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
                  Added to your queue — published at your next optimal time slot.
                </p>
              )}

              <Button variant="outline" className="w-full">
                <Copy className="h-4 w-4" /> Export / copy manually
              </Button>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
