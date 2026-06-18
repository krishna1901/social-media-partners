"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  PenSquare,
  Sparkle,
  Megaphone,
  Wand,
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
import { createPost, setPostChannels, schedulePostAction } from "@/app/actions/posts";
import { createMediaAsset as createMediaAssetAction } from "@/app/actions/media";
import { uploadMedia, type MediaKind } from "@/lib/storage";
import type { ScheduleMode } from "@/lib/publishing/scheduler";
import type { PostType } from "@/lib/db/types";

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

const AI_ACTIONS = [
  { label: "Generate hook", hint: "Scroll-stopping opener", icon: Sparkle },
  { label: "Generate caption", hint: "On-brand long copy", icon: Wand },
  { label: "Generate hashtags", hint: "Reach-optimized tags", icon: Hash },
  { label: "Improve CTA", hint: "Drive the next action", icon: Megaphone },
];

type Attachment = { id: string; url: string; name: string; kind: MediaKind };

function kindForFile(file: File): MediaKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/zip" || file.type === "application/x-zip-compressed") return "zip";
  return "image";
}

async function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch {
    return null;
  }
}

export default function NewPostPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedChannels, setSelectedChannels] = useState<Set<Platform>>(
    new Set<Platform>(["instagram", "linkedin"])
  );
  const [postType, setPostType] = useState("carousel");
  const [captionTab, setCaptionTab] = useState("universal");
  const [scheduleMode, setScheduleMode] = useState("queue");

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [universalCaption, setUniversalCaption] = useState(
    "We rebuilt our entire content system in a weekend — here's the exact playbook we used to ship 10x faster. 🚀"
  );
  const [igCaption, setIgCaption] = useState("");
  const [liCaption, setLiCaption] = useState("");
  const [hashtags, setHashtags] = useState(
    "#contentmarketing #creators #socialmedia #aitools"
  );
  const [cta, setCta] = useState("");
  const [notes, setNotes] = useState("");
  const [schedDate, setSchedDate] = useState("2026-06-18");
  const [schedTime, setSchedTime] = useState("09:00");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // The composer's current fields, mapped to the data layer's PostInput shape.
  const composerInput = () => ({
    title,
    topic: topic.trim() || null,
    post_type: postType as PostType,
    universal_caption: universalCaption.trim() || null,
    instagram_caption: igCaption.trim() || null,
    linkedin_caption: liCaption.trim() || null,
    hashtags: hashtags.trim() || null,
    cta: cta.trim() || null,
    notes: notes.trim() || null,
  });

  // Persist the post + its selected channels; returns the new id, or null on error.
  const persistPost = async (
    status: "draft" | "scheduled"
  ): Promise<string | null> => {
    const created = await createPost(
      { ...composerInput(), status },
      attachments.map((a) => a.id)
    );
    if (!created.ok) {
      setSaveError(created.error);
      return null;
    }
    const channels = await setPostChannels(created.id, Array.from(selectedChannels));
    if (!channels.ok) {
      setSaveError(channels.error);
      return null;
    }
    return created.id;
  };

  const handleSaveDraft = () => {
    setSaveError(null);
    startTransition(async () => {
      const id = await persistPost("draft");
      if (id) router.push("/posts");
    });
  };

  const handleSchedule = () => {
    setSaveError(null);
    startTransition(async () => {
      const id = await persistPost("scheduled");
      if (!id) return;
      const mode: ScheduleMode = scheduleMode === "queue" ? "next_queue" : (scheduleMode as ScheduleMode);
      const scheduledAt =
        scheduleMode === "custom"
          ? new Date(`${schedDate}T${schedTime}`).toISOString()
          : null;
      const scheduled = await schedulePostAction(id, mode, scheduledAt);
      if (!scheduled.ok) {
        setSaveError(scheduled.error);
        return;
      }
      router.push("/posts");
    });
  };

  const toggleChannel = (p: Platform) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const handleUpload = (files: FileList) => {
    setUploadError(null);
    const list = Array.from(files);
    startTransition(async () => {
      for (const file of list) {
        try {
          const kind = kindForFile(file);
          const result = await uploadMedia(file, { kind });
          const dims = await imageSize(file);
          const res = await createMediaAssetAction({
            name: file.name,
            kind,
            bucket: result.bucket,
            path: result.path,
            url: result.url,
            size_bytes: result.size,
            mime_type: result.mimeType,
            width: dims?.width ?? null,
            height: dims?.height ?? null,
            dimensions: dims ? `${dims.width}×${dims.height}` : null,
          });
          if (!res.ok) {
            setUploadError(res.error);
            continue;
          }
          setAttachments((prev) => [...prev, { id: res.id, url: result.url, name: file.name, kind }]);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Upload failed.");
        }
      }
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
  const firstImage = attachments.find((a) => a.kind === "image")?.url;

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
        eyebrow="Compose"
        title="New Post"
        description="Compose, preview and schedule across every connected channel."
        icon={<PenSquare className="h-5 w-5" />}
        actions={
          <>
            <Button variant="ghost" onClick={handleSaveDraft} disabled={pending}>
              Save draft
            </Button>
            <Button variant="outline">Mark ready</Button>
            <Button
              onClick={handleSchedule}
              disabled={pending}
              className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-90"
            >
              <CalendarDays className="h-4 w-4" /> Schedule post
            </Button>
          </>
        }
      />

      {saveError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {saveError}
        </p>
      )}

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
                <Input
                  id="post-topic"
                  placeholder="e.g. AI workflows, content systems"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Post type</Label>
                <Segmented options={POST_TYPES} value={postType} onValueChange={setPostType} className="w-full" />
              </div>
            </div>
          </ChartCard>

          {/* Channels */}
          <ChartCard
            title="Channels"
            subtitle="Pick where this post goes live"
            action={
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-brand-600">
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
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "border-transparent bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20"
                        : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-brand-200 hover:text-foreground"
                    )}
                  >
                    <PlatformIcon platform={p} className="h-4 w-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {selectedChannels.size === 0 && (
              <p className="mt-3 text-xs font-medium text-amber-600">
                Select at least one channel to publish this post.
              </p>
            )}
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
                <p className="mt-1.5 text-right text-[11px] tabular-nums text-muted-foreground">
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
                <p className="mt-1.5 text-right text-[11px] tabular-nums text-muted-foreground">
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
                <p className="mt-1.5 text-right text-[11px] tabular-nums text-muted-foreground">
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
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#contentmarketing #creators #aitools"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cta" className="gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" /> Call to action
                </Label>
                <Input
                  id="cta"
                  placeholder="Follow for more content systems →"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" /> Internal notes
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for your team — context, approvals, reminders…"
                />
              </div>
            </div>
          </ChartCard>

          {/* Media */}
          <ChartCard
            title="Media"
            subtitle="Attach images, video or carousels"
            action={
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                {attachments.length} attached
              </span>
            }
          >
            <div className="space-y-4">
              <UploadDropzone onFiles={handleUpload} hint="Drop media for this post — images, video, ZIPs up to 200MB" />
              {uploadError && <p className="text-xs font-medium text-destructive">{uploadError}</p>}
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {attachments.map((a) => (
                    <div key={a.id} className="group/thumb relative">
                      {a.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.url}
                          alt={a.name}
                          className="aspect-square w-full rounded-xl object-cover shadow-sm ring-1 ring-border/50 transition-transform duration-200 group-hover/thumb:-translate-y-0.5"
                        />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-muted text-muted-foreground shadow-sm ring-1 ring-border/50">
                          {a.kind === "video" ? <Video className="h-5 w-5" /> : <GalleryHorizontalEnd className="h-5 w-5" />}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        aria-label={`Remove ${a.name}`}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">{a.name}</p>
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
              {firstImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firstImage} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-brand-500 via-coral-400 to-amber-400 shadow-sm" />
              )}
              <div className="mt-3 flex items-center gap-4 text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums">
                  <Heart className="h-4 w-4" /> 1.2K
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums">
                  <MessageCircle className="h-4 w-4" /> 86
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums">
                  <Send className="h-4 w-4" /> 24
                </span>
                <Bookmark className="ml-auto h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Previewing{" "}
              <span className="font-medium text-foreground">{platformMeta[previewPlatform].label}</span>
              {selectedChannels.size > 1 && ` · +${selectedChannels.size - 1} more`}
            </p>
          </ChartCard>

          {/* AI assist */}
          <ChartCard
            title="AI assist"
            subtitle="Let SocialFlow AI draft for you"
            action={
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
                <Wand2 className="h-4 w-4" />
              </span>
            }
          >
            <div className="space-y-2">
              {AI_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="group/ai flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-coral-50 text-brand-500 ring-1 ring-brand-100">
                    <action.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground group-hover/ai:text-brand-600">
                      {action.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{action.hint}</span>
                  </span>
                  <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover/ai:text-brand-500" />
                </button>
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
                    <Input
                      id="sched-date"
                      type="date"
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-time">Time</Label>
                    <Input
                      id="sched-time"
                      type="time"
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                    />
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
