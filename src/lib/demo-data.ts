/**
 * SocialFlow AI — centralized demo data.
 *
 * PHASE 1 NOTE: Every dataset below is realistic *demo* content used to make
 * the UI feel complete and commercial-ready. No live backend is required to
 * render any page. In Phase 2 these exports are the contract the Supabase
 * queries / server actions should fulfil (same shapes, same field names).
 */

/* ----------------------------------- types ---------------------------------- */

export type Platform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "x";

export type PostStatus =
  | "idea"
  | "draft"
  | "ready"
  | "scheduled"
  | "posted"
  | "failed";

export type PostType = "carousel" | "image" | "video" | "text" | "story" | "reel";

export type IdeaStatus = "idea" | "draft" | "ready" | "scheduled" | "posted";

export type Priority = "low" | "medium" | "high";

/* -------------------------------- workspace --------------------------------- */

export const currentUser = {
  name: "Alex Rivera",
  email: "alex@socialflow.ai",
  role: "Owner",
  initials: "AR",
  plan: "Pro",
};

export const workspaces = [
  { id: "ws_1", name: "Rivera Studio", plan: "Pro", initials: "RS", color: "from-brand-500 to-coral-500", active: true },
  { id: "ws_2", name: "Northbeam Agency", plan: "Agency", initials: "NB", color: "from-violet-500 to-indigo-500", active: false },
  { id: "ws_3", name: "Bloom Coffee Co.", plan: "Starter", initials: "BC", color: "from-emerald-500 to-teal-500", active: false },
];

export const platformMeta: Record<
  Platform,
  { label: string; tint: string; text: string; dot: string }
> = {
  instagram: { label: "Instagram", tint: "bg-pink-50 border-pink-200", text: "text-pink-600", dot: "bg-pink-500" },
  facebook: { label: "Facebook", tint: "bg-blue-50 border-blue-200", text: "text-blue-600", dot: "bg-blue-500" },
  linkedin: { label: "LinkedIn", tint: "bg-sky-50 border-sky-200", text: "text-sky-700", dot: "bg-sky-600" },
  youtube: { label: "YouTube", tint: "bg-red-50 border-red-200", text: "text-red-600", dot: "bg-red-500" },
  tiktok: { label: "TikTok", tint: "bg-neutral-100 border-neutral-300", text: "text-neutral-800", dot: "bg-neutral-900" },
  x: { label: "X", tint: "bg-neutral-100 border-neutral-300", text: "text-neutral-800", dot: "bg-neutral-900" },
};

export const notifications = [
  { id: 1, title: "Scheduled post published", body: "“5 AI tools every marketer needs” is live on LinkedIn.", time: "8m ago", unread: true, kind: "success" as const },
  { id: 2, title: "New comment needs a reply", body: "@maria_codes commented on your Instagram Reel.", time: "32m ago", unread: true, kind: "inbox" as const },
  { id: 3, title: "Trend spike detected", body: "“Faceless content” is up 240% in your niche.", time: "1h ago", unread: true, kind: "trend" as const },
  { id: 4, title: "AI draft ready", body: "Caption Generator finished 4 variations.", time: "3h ago", unread: false, kind: "ai" as const },
];

/* -------------------------------- dashboard --------------------------------- */

export const dashboardStats = [
  { key: "total-posts", label: "Total Posts", value: "1,284", delta: "+12.4%", positive: true, icon: "posts", hint: "vs last 30 days" },
  { key: "drafts", label: "Drafts", value: "37", delta: "+6", positive: true, icon: "draft", hint: "awaiting review" },
  { key: "scheduled", label: "Scheduled", value: "92", delta: "+18", positive: true, icon: "calendar", hint: "queued to publish" },
  { key: "ai-generated", label: "AI Generated", value: "3,540", delta: "+28.1%", positive: true, icon: "ai", hint: "this month" },
  { key: "inbox", label: "Inbox Items", value: "146", delta: "-9", positive: false, icon: "inbox", hint: "23 unread" },
  { key: "engagement", label: "Engagement Rate", value: "6.8%", delta: "+0.9%", positive: true, icon: "engagement", hint: "30-day average" },
];

export const weeklyPerformance = [
  { label: "Mon", published: 8, engagement: 4200 },
  { label: "Tue", published: 12, engagement: 6100 },
  { label: "Wed", published: 9, engagement: 5400 },
  { label: "Thu", published: 14, engagement: 8200 },
  { label: "Fri", published: 11, engagement: 7300 },
  { label: "Sat", published: 6, engagement: 3900 },
  { label: "Sun", published: 5, engagement: 3100 },
];

export const platformBreakdown = [
  { label: "Instagram", value: 38, platform: "instagram" as Platform, color: "var(--chart-5)" },
  { label: "LinkedIn", value: 27, platform: "linkedin" as Platform, color: "var(--chart-3)" },
  { label: "TikTok", value: 16, platform: "tiktok" as Platform, color: "var(--chart-4)" },
  { label: "YouTube", value: 11, platform: "youtube" as Platform, color: "var(--chart-1)" },
  { label: "X", value: 8, platform: "x" as Platform, color: "var(--chart-2)" },
];

export const engagementTrend = [
  { label: "W1", value: 4.2 },
  { label: "W2", value: 4.9 },
  { label: "W3", value: 4.6 },
  { label: "W4", value: 5.5 },
  { label: "W5", value: 6.1 },
  { label: "W6", value: 5.8 },
  { label: "W7", value: 6.4 },
  { label: "W8", value: 6.8 },
];

export const contentTypePerformance = [
  { label: "Carousel", value: 8.9 },
  { label: "Reel", value: 7.6 },
  { label: "Video", value: 6.4 },
  { label: "Image", value: 4.8 },
  { label: "Text", value: 3.5 },
];

export const recentDrafts = [
  { id: "d1", title: "5 AI tools every solo marketer needs", platform: "linkedin" as Platform, type: "carousel" as PostType, updated: "2h ago", score: 92 },
  { id: "d2", title: "Behind the scenes: our content workflow", platform: "instagram" as Platform, type: "reel" as PostType, updated: "5h ago", score: 88 },
  { id: "d3", title: "Why faceless content is exploding in 2026", platform: "tiktok" as Platform, type: "video" as PostType, updated: "Yesterday", score: 84 },
  { id: "d4", title: "The 3-step hook formula that doubled our reach", platform: "x" as Platform, type: "text" as PostType, updated: "Yesterday", score: 79 },
];

export const upcomingPosts = [
  { id: "u1", title: "Weekly roundup: marketing news", platform: "linkedin" as Platform, type: "text" as PostType, when: "Today · 4:30 PM" },
  { id: "u2", title: "Product teardown carousel", platform: "instagram" as Platform, type: "carousel" as PostType, when: "Tomorrow · 9:00 AM" },
  { id: "u3", title: "Founder story — short doc", platform: "youtube" as Platform, type: "video" as PostType, when: "Thu · 11:00 AM" },
  { id: "u4", title: "Hot take: scheduling myths", platform: "x" as Platform, type: "text" as PostType, when: "Fri · 8:15 AM" },
];

export const trendingNow = [
  { id: "t1", tag: "Faceless content", growth: "+240%", platform: "tiktok" as Platform, score: 96 },
  { id: "t2", tag: "AI agents for SMBs", growth: "+128%", platform: "linkedin" as Platform, score: 91 },
  { id: "t3", tag: "POV storytelling", growth: "+74%", platform: "instagram" as Platform, score: 83 },
];

export const recentGenerations = [
  { id: "g1", tool: "Hook Generator", preview: "Stop posting daily. Here's what actually grows an account…", time: "12m ago" },
  { id: "g2", tool: "Caption Generator", preview: "We rebuilt our entire content system in a weekend. The results…", time: "48m ago" },
  { id: "g3", tool: "Carousel Outline", preview: "Slide 1 — The myth · Slide 2 — Why it's wrong · Slide 3…", time: "2h ago" },
  { id: "g4", tool: "Video Script", preview: "[HOOK] Most creators quit at 1k followers. Here's the math…", time: "4h ago" },
];

export const activityFeed = [
  { id: "a1", actor: "Alex Rivera", action: "scheduled", target: "Product teardown carousel", time: "18m ago", kind: "scheduled" as const },
  { id: "a2", actor: "Maya Chen", action: "left a comment on", target: "Q3 content plan", time: "1h ago", kind: "comment" as const, note: "Love this hook — let's push it to LinkedIn too." },
  { id: "a3", actor: "AI Assistant", action: "generated 4 captions for", target: "Winter launch", time: "2h ago", kind: "ai" as const },
  { id: "a4", actor: "Sam Patel", action: "approved", target: "Faceless content explainer", time: "5h ago", kind: "approved" as const },
  { id: "a5", actor: "Alex Rivera", action: "connected", target: "TikTok Business account", time: "Yesterday", kind: "integration" as const },
];

export const smartRecommendations = [
  { id: "r1", title: "Post 2 more Reels this week", body: "Reels are your top-performing format at 7.6% engagement — you're under your usual cadence.", impact: "High impact", icon: "trend" },
  { id: "r2", title: "Best time to post is shifting", body: "Your audience is most active at 8–10 AM on weekdays. 4 scheduled posts fall outside this window.", impact: "Medium impact", icon: "clock" },
  { id: "r3", title: "23 comments awaiting reply", body: "Replying within 1 hour lifts engagement ~20%. Clear your inbox backlog.", impact: "Quick win", icon: "inbox" },
];

/* ------------------------------ content studio ------------------------------ */

export const studioTools = [
  { id: "hook", name: "Hook Generator", desc: "Scroll-stopping opening lines for any platform.", icon: "Sparkles", color: "from-brand-500 to-coral-500", tag: "Popular" },
  { id: "caption", name: "Caption Generator", desc: "On-brand captions tuned to tone & platform.", icon: "Type", color: "from-coral-500 to-rose-500", tag: "" },
  { id: "hashtag", name: "Hashtag Generator", desc: "Mix of reach, niche & branded hashtags.", icon: "Hash", color: "from-amber-400 to-brand-500", tag: "" },
  { id: "cta", name: "CTA Generator", desc: "Conversion-focused calls to action.", icon: "MousePointerClick", color: "from-violet-500 to-indigo-500", tag: "" },
  { id: "carousel", name: "Carousel Outline", desc: "Slide-by-slide outlines that retain swipes.", icon: "GalleryHorizontalEnd", color: "from-sky-500 to-cyan-500", tag: "" },
  { id: "video-script", name: "Video Script", desc: "Hook → body → CTA scripts for short video.", icon: "Clapperboard", color: "from-rose-500 to-coral-500", tag: "" },
  { id: "linkedin", name: "LinkedIn Post", desc: "Authority-building posts with a strong hook.", icon: "Linkedin", color: "from-sky-600 to-blue-600", tag: "" },
  { id: "instagram", name: "Instagram Caption", desc: "Punchy captions with emoji & line breaks.", icon: "Instagram", color: "from-pink-500 to-rose-500", tag: "" },
  { id: "repurpose", name: "Content Repurposer", desc: "Turn one post into a multi-platform set.", icon: "Recycle", color: "from-emerald-500 to-teal-500", tag: "New" },
  { id: "brief", name: "Content Brief", desc: "Structured briefs for writers & designers.", icon: "FileText", color: "from-neutral-600 to-neutral-800", tag: "" },
];

export const studioToneOptions = ["Professional", "Casual", "Bold", "Witty", "Inspirational", "Educational"];
export const studioContentTypes = ["Carousel", "Reel / Short", "Single image", "Long-form video", "Text post", "Story"];

export const sampleGeneratedHooks = [
  "Everyone's posting daily. Almost no one is growing. Here's the difference 👇",
  "I analyzed 500 viral posts so you don't have to. 7 patterns showed up every time.",
  "The 'post and pray' era is over. This is what actually moves the needle in 2026.",
  "Your content isn't the problem. Your first line is. Fix this in 30 seconds.",
];

/* ---------------------------------- ideas ----------------------------------- */

export const ideas: {
  id: string;
  title: string;
  category: string;
  sourceTrend?: string;
  priority: Priority;
  type: PostType;
  status: IdeaStatus;
  notes?: string;
}[] = [
  { id: "i1", title: "The hidden cost of posting daily", category: "Education", sourceTrend: "Consistency myths", priority: "high", type: "carousel", status: "idea", notes: "Lead with a contrarian stat." },
  { id: "i2", title: "Faceless content starter kit", category: "Tutorial", sourceTrend: "Faceless content", priority: "high", type: "video", status: "draft", notes: "Pair with free template." },
  { id: "i3", title: "How we use AI agents in our workflow", category: "Behind the scenes", priority: "medium", type: "reel", status: "ready" },
  { id: "i4", title: "5 hooks that doubled our reach", category: "Education", sourceTrend: "Hook formulas", priority: "high", type: "carousel", status: "scheduled" },
  { id: "i5", title: "Our 2026 content stack", category: "Tools", priority: "medium", type: "text", status: "posted" },
  { id: "i6", title: "POV: you finally batch your content", category: "Relatable", sourceTrend: "POV storytelling", priority: "low", type: "reel", status: "idea" },
  { id: "i7", title: "Client results breakdown", category: "Case study", priority: "medium", type: "carousel", status: "draft", notes: "Anonymize numbers." },
  { id: "i8", title: "Why your engagement dropped", category: "Education", priority: "high", type: "video", status: "ready" },
  { id: "i9", title: "Repurposing one idea into 10 posts", category: "Tutorial", sourceTrend: "Repurposing", priority: "medium", type: "carousel", status: "idea" },
  { id: "i10", title: "Founder Q&A — building in public", category: "Community", priority: "low", type: "text", status: "scheduled" },
];

export const ideaStatuses: { key: IdeaStatus; label: string }[] = [
  { key: "idea", label: "Idea" },
  { key: "draft", label: "Draft" },
  { key: "ready", label: "Ready" },
  { key: "scheduled", label: "Scheduled" },
  { key: "posted", label: "Posted" },
];

/* ---------------------------------- posts ----------------------------------- */

export const posts: {
  id: string;
  title: string;
  excerpt: string;
  platforms: Platform[];
  type: PostType;
  status: PostStatus;
  date: string;
  author: string;
  reach?: string;
  engagement?: string;
}[] = [
  { id: "p1", title: "5 AI tools every solo marketer needs", excerpt: "A no-fluff rundown of the tools we actually use every week to ship content faster.", platforms: ["linkedin", "x"], type: "carousel", status: "scheduled", date: "Jun 18, 2026", author: "Alex Rivera", reach: "—" },
  { id: "p2", title: "Behind the scenes: our content workflow", excerpt: "From idea to published in under an hour — here's the exact system.", platforms: ["instagram"], type: "reel", status: "ready", date: "Jun 19, 2026", author: "Maya Chen" },
  { id: "p3", title: "Why faceless content is exploding", excerpt: "The data behind the fastest-growing format of the year.", platforms: ["tiktok", "youtube"], type: "video", status: "draft", date: "Jun 20, 2026", author: "Alex Rivera" },
  { id: "p4", title: "The 3-step hook formula", excerpt: "Steal the framework that doubled our average reach.", platforms: ["x"], type: "text", status: "posted", date: "Jun 12, 2026", author: "Sam Patel", reach: "48.2K", engagement: "7.1%" },
  { id: "p5", title: "Winter collection launch", excerpt: "Teaser carousel for the seasonal drop.", platforms: ["instagram", "facebook"], type: "carousel", status: "scheduled", date: "Jun 22, 2026", author: "Maya Chen" },
  { id: "p6", title: "Q3 content plan walkthrough", excerpt: "How we're structuring the next quarter of content.", platforms: ["linkedin"], type: "text", status: "draft", date: "Jun 23, 2026", author: "Alex Rivera" },
  { id: "p7", title: "Creator economy myths — debunked", excerpt: "Five things people get wrong about going full-time.", platforms: ["youtube"], type: "video", status: "posted", date: "Jun 8, 2026", author: "Sam Patel", reach: "31.7K", engagement: "5.4%" },
  { id: "p8", title: "Quick tip: batching your week", excerpt: "Save 6 hours a week with this simple routine.", platforms: ["instagram"], type: "image", status: "failed", date: "Jun 10, 2026", author: "Maya Chen" },
  { id: "p9", title: "Our 2026 content stack", excerpt: "Every tool in our workflow, categorized.", platforms: ["x", "linkedin"], type: "text", status: "posted", date: "Jun 5, 2026", author: "Alex Rivera", reach: "62.9K", engagement: "8.3%" },
  { id: "p10", title: "POV: you finally batch content", excerpt: "A relatable reel for overwhelmed creators.", platforms: ["instagram", "tiktok"], type: "reel", status: "ready", date: "Jun 24, 2026", author: "Sam Patel" },
];

/* ---------------------------------- trends ---------------------------------- */

export const trendCategories = ["All niches", "Marketing", "AI & Tech", "Creator economy", "E-commerce", "SaaS", "Personal brand"];

export const trends: {
  id: string;
  tag: string;
  category: string;
  relevance: number;
  growth: string;
  momentum: "rising" | "peaking" | "steady";
  platform: Platform;
  source: string;
  note: string;
}[] = [
  { id: "tr1", tag: "Faceless content", category: "Creator economy", relevance: 96, growth: "+240%", momentum: "rising", platform: "tiktok", source: "TikTok Creative Center", note: "Low-production explainer videos with voiceover. Pairs well with carousels." },
  { id: "tr2", tag: "AI agents for SMBs", category: "AI & Tech", relevance: 91, growth: "+128%", momentum: "rising", platform: "linkedin", source: "LinkedIn News", note: "Practical, ROI-focused angle wins. Avoid hype." },
  { id: "tr3", tag: "POV storytelling", category: "Personal brand", relevance: 83, growth: "+74%", momentum: "peaking", platform: "instagram", source: "Instagram Trends", note: "Relatable, first-person reels. Strong saves." },
  { id: "tr4", tag: "Build in public", category: "SaaS", relevance: 79, growth: "+52%", momentum: "steady", platform: "x", source: "X Trending", note: "Revenue + lessons threads still convert." },
  { id: "tr5", tag: "Short doc storytelling", category: "Creator economy", relevance: 76, growth: "+61%", momentum: "rising", platform: "youtube", source: "YouTube Trends", note: "3–5 min mini-documentaries. High watch time." },
  { id: "tr6", tag: "UGC for DTC brands", category: "E-commerce", relevance: 72, growth: "+44%", momentum: "steady", platform: "instagram", source: "Meta Insights", note: "Authentic creator UGC outperforms polished ads." },
  { id: "tr7", tag: "Newsletter-to-social", category: "Marketing", relevance: 68, growth: "+38%", momentum: "rising", platform: "linkedin", source: "Trend Radar", note: "Atomize long-form into carousels." },
  { id: "tr8", tag: "Hot take threads", category: "Marketing", relevance: 64, growth: "+29%", momentum: "peaking", platform: "x", source: "X Trending", note: "Polarizing but on-brand opinions." },
];

/* ---------------------------------- media ----------------------------------- */

export const mediaAssets: {
  id: string;
  name: string;
  kind: "image" | "video" | "zip" | "thumbnail" | "carousel";
  size: string;
  dimensions?: string;
  updated: string;
  linkedPost?: string;
  gradient: string;
}[] = [
  { id: "m1", name: "winter-launch-cover.png", kind: "image", size: "2.1 MB", dimensions: "1080×1350", updated: "2h ago", linkedPost: "Winter collection launch", gradient: "from-orange-400 to-rose-500" },
  { id: "m2", name: "workflow-reel.mp4", kind: "video", size: "18.4 MB", dimensions: "1080×1920", updated: "5h ago", linkedPost: "Behind the scenes", gradient: "from-violet-500 to-indigo-600" },
  { id: "m3", name: "ai-tools-carousel.zip", kind: "carousel", size: "6.8 MB", updated: "Yesterday", linkedPost: "5 AI tools", gradient: "from-sky-500 to-cyan-500" },
  { id: "m4", name: "founder-story-thumb.jpg", kind: "thumbnail", size: "640 KB", dimensions: "1280×720", updated: "Yesterday", gradient: "from-amber-400 to-orange-500" },
  { id: "m5", name: "hook-formula-1.png", kind: "image", size: "1.4 MB", dimensions: "1080×1080", updated: "2d ago", gradient: "from-emerald-500 to-teal-500" },
  { id: "m6", name: "brand-assets.zip", kind: "zip", size: "42.1 MB", updated: "3d ago", gradient: "from-neutral-500 to-neutral-700" },
  { id: "m7", name: "podcast-clip.mp4", kind: "video", size: "24.9 MB", dimensions: "1080×1080", updated: "4d ago", gradient: "from-pink-500 to-rose-500" },
  { id: "m8", name: "q3-plan-slides.zip", kind: "carousel", size: "9.2 MB", updated: "5d ago", linkedPost: "Q3 content plan", gradient: "from-blue-500 to-indigo-500" },
  { id: "m9", name: "testimonial-1.png", kind: "image", size: "980 KB", dimensions: "1080×1080", updated: "1w ago", gradient: "from-fuchsia-500 to-purple-600" },
  { id: "m10", name: "stock-office.jpg", kind: "image", size: "3.3 MB", dimensions: "1920×1280", updated: "1w ago", gradient: "from-teal-500 to-cyan-600" },
  { id: "m11", name: "intro-animation.mp4", kind: "video", size: "12.0 MB", dimensions: "1920×1080", updated: "2w ago", gradient: "from-orange-500 to-amber-500" },
  { id: "m12", name: "logo-pack.zip", kind: "zip", size: "5.6 MB", updated: "3w ago", gradient: "from-slate-500 to-slate-700" },
];

/* --------------------------------- calendar --------------------------------- */

export const calendarEvents: {
  id: string;
  title: string;
  day: number; // day of month
  time: string;
  platform: Platform;
  status: PostStatus;
  type: PostType;
}[] = [
  { id: "c1", title: "AI tools carousel", day: 18, time: "09:00", platform: "linkedin", status: "scheduled", type: "carousel" },
  { id: "c2", title: "Hot take thread", day: 18, time: "16:30", platform: "x", status: "scheduled", type: "text" },
  { id: "c3", title: "Workflow reel", day: 19, time: "11:00", platform: "instagram", status: "ready", type: "reel" },
  { id: "c4", title: "Faceless explainer", day: 20, time: "13:00", platform: "tiktok", status: "draft", type: "video" },
  { id: "c5", title: "Founder short doc", day: 20, time: "18:00", platform: "youtube", status: "scheduled", type: "video" },
  { id: "c6", title: "Winter launch teaser", day: 22, time: "09:00", platform: "instagram", status: "scheduled", type: "carousel" },
  { id: "c7", title: "Weekly roundup", day: 23, time: "08:30", platform: "linkedin", status: "draft", type: "text" },
  { id: "c8", title: "POV reel", day: 24, time: "12:00", platform: "instagram", status: "ready", type: "reel" },
  { id: "c9", title: "Scheduling myths", day: 25, time: "08:15", platform: "x", status: "scheduled", type: "text" },
  { id: "c10", title: "Client results", day: 26, time: "10:00", platform: "linkedin", status: "draft", type: "carousel" },
  { id: "c11", title: "Q&A live recap", day: 27, time: "17:00", platform: "youtube", status: "posted", type: "video" },
  { id: "c12", title: "Batching tutorial", day: 12, time: "09:00", platform: "instagram", status: "posted", type: "image" },
];

/* --------------------------------- analytics -------------------------------- */

export const analyticsMetrics = [
  { key: "reach", label: "Reach", value: "412.8K", delta: "+14.2%", positive: true },
  { key: "impressions", label: "Impressions", value: "1.2M", delta: "+9.7%", positive: true },
  { key: "engagement", label: "Engagement", value: "84.3K", delta: "+18.1%", positive: true },
  { key: "saves", label: "Saves", value: "12.4K", delta: "+22.6%", positive: true },
  { key: "shares", label: "Shares", value: "6.9K", delta: "+5.3%", positive: true },
  { key: "comments", label: "Comments", value: "9.1K", delta: "-3.2%", positive: false },
  { key: "clicks", label: "Link Clicks", value: "27.5K", delta: "+11.4%", positive: true },
  { key: "followers", label: "Net New Followers", value: "+5,284", delta: "+7.8%", positive: true },
];

export const analyticsReachSeries = [
  { label: "Wk 1", value: 78000 },
  { label: "Wk 2", value: 86000 },
  { label: "Wk 3", value: 81000 },
  { label: "Wk 4", value: 95000 },
  { label: "Wk 5", value: 102000 },
  { label: "Wk 6", value: 98000 },
  { label: "Wk 7", value: 112000 },
  { label: "Wk 8", value: 124000 },
];

export const analyticsTopPosts = [
  { id: "tp1", title: "Our 2026 content stack", platform: "x" as Platform, reach: "62.9K", engagement: "8.3%", saves: "2.1K" },
  { id: "tp2", title: "The 3-step hook formula", platform: "x" as Platform, reach: "48.2K", engagement: "7.1%", saves: "1.6K" },
  { id: "tp3", title: "Creator economy myths", platform: "youtube" as Platform, reach: "31.7K", engagement: "5.4%", saves: "980" },
  { id: "tp4", title: "Faceless content explained", platform: "tiktok" as Platform, reach: "29.4K", engagement: "6.9%", saves: "1.2K" },
  { id: "tp5", title: "Behind the scenes workflow", platform: "instagram" as Platform, reach: "24.8K", engagement: "6.2%", saves: "1.4K" },
];

export const platformComparison = [
  { platform: "instagram" as Platform, reach: 148000, engagement: 6.2, followers: "48.2K" },
  { platform: "linkedin" as Platform, reach: 96000, engagement: 7.4, followers: "21.6K" },
  { platform: "tiktok" as Platform, reach: 88000, engagement: 6.9, followers: "33.1K" },
  { platform: "youtube" as Platform, reach: 41000, engagement: 5.4, followers: "12.9K" },
  { platform: "x" as Platform, reach: 39000, engagement: 8.3, followers: "18.4K" },
];

export const bestPostingTimes = [
  { day: "Mon", hours: [8, 9, 12, 18] },
  { day: "Tue", hours: [9, 13, 17] },
  { day: "Wed", hours: [8, 11, 19] },
  { day: "Thu", hours: [9, 10, 16, 20] },
  { day: "Fri", hours: [8, 12, 15] },
  { day: "Sat", hours: [10, 14] },
  { day: "Sun", hours: [11, 19] },
];

/* ---------------------------------- inbox ----------------------------------- */

export const inboxThreads: {
  id: string;
  author: string;
  handle: string;
  initials: string;
  platform: Platform;
  type: "comment" | "dm" | "mention";
  preview: string;
  time: string;
  status: "new" | "replied" | "ignored";
  sentiment: "positive" | "neutral" | "negative";
  relatedPost?: string;
  suggestedReply?: string;
}[] = [
  { id: "n1", author: "Maria Lopez", handle: "@maria_codes", initials: "ML", platform: "instagram", type: "comment", preview: "This is exactly what I needed! Do you have a template for the carousel?", time: "12m ago", status: "new", sentiment: "positive", relatedPost: "5 AI tools every solo marketer needs", suggestedReply: "Thanks Maria! 🙌 Yes — grab the free template in our bio link. Let me know how it goes!" },
  { id: "n2", author: "Devon Park", handle: "@devbuilds", initials: "DP", platform: "linkedin", type: "dm", preview: "Would love to collaborate on a piece about AI workflows. Open to it?", time: "40m ago", status: "new", sentiment: "positive", suggestedReply: "Hey Devon — absolutely, I'd be up for that. Want to hop on a quick call this week?" },
  { id: "n3", author: "anon_user_22", handle: "@anon_user_22", initials: "AU", platform: "tiktok", type: "comment", preview: "This won't work for small accounts though.", time: "1h ago", status: "new", sentiment: "negative", relatedPost: "Why faceless content is exploding", suggestedReply: "Totally fair concern! It actually works even better for small accounts — here's why…" },
  { id: "n4", author: "Priya Nair", handle: "@priya.writes", initials: "PN", platform: "x", type: "mention", preview: "Bookmarking this thread, the hook formula is gold 🔥", time: "2h ago", status: "replied", sentiment: "positive", relatedPost: "The 3-step hook formula" },
  { id: "n5", author: "Coffee Bloom", handle: "@bloomcoffee", initials: "CB", platform: "instagram", type: "dm", preview: "Can you share your pricing for content packages?", time: "3h ago", status: "new", sentiment: "neutral", suggestedReply: "Hi! Thanks for reaching out — I'll DM our package overview now. 😊" },
  { id: "n6", author: "Jordan Lee", handle: "@jlee", initials: "JL", platform: "linkedin", type: "comment", preview: "Great breakdown. What tool do you use for scheduling?", time: "5h ago", status: "replied", sentiment: "positive", relatedPost: "Our 2026 content stack" },
  { id: "n7", author: "spam_bot_x", handle: "@offers_now", initials: "SB", platform: "instagram", type: "comment", preview: "Buy followers cheap!!! link in bio", time: "6h ago", status: "ignored", sentiment: "negative" },
  { id: "n8", author: "Nina Roy", handle: "@nina.designs", initials: "NR", platform: "tiktok", type: "comment", preview: "The pacing on this edit is so clean, what app?", time: "8h ago", status: "new", sentiment: "positive", relatedPost: "Behind the scenes workflow", suggestedReply: "Thank you! 🙏 Edited in CapCut with our own preset — happy to share it." },
];

/* -------------------------------- competitors ------------------------------- */

export const competitors: {
  id: string;
  name: string;
  handle: string;
  initials: string;
  platform: Platform;
  niche: string;
  url: string;
  followers: string;
  postsPerWeek: number;
  avgEngagement: string;
  topFormat: PostType;
  gradient: string;
}[] = [
  { id: "cp1", name: "Growth Lab", handle: "@growthlab", initials: "GL", platform: "linkedin", niche: "Marketing", url: "linkedin.com/company/growthlab", followers: "186K", postsPerWeek: 9, avgEngagement: "4.1%", topFormat: "carousel", gradient: "from-sky-500 to-blue-600" },
  { id: "cp2", name: "Creator Stack", handle: "@creatorstack", initials: "CS", platform: "instagram", niche: "Creator economy", url: "instagram.com/creatorstack", followers: "312K", postsPerWeek: 12, avgEngagement: "5.8%", topFormat: "reel", gradient: "from-pink-500 to-rose-500" },
  { id: "cp3", name: "AI Daily", handle: "@aidaily", initials: "AD", platform: "x", niche: "AI & Tech", url: "x.com/aidaily", followers: "248K", postsPerWeek: 21, avgEngagement: "3.4%", topFormat: "text", gradient: "from-neutral-700 to-neutral-900" },
  { id: "cp4", name: "Founder Diaries", handle: "@founderdiaries", initials: "FD", platform: "youtube", niche: "SaaS", url: "youtube.com/@founderdiaries", followers: "94K", postsPerWeek: 3, avgEngagement: "6.7%", topFormat: "video", gradient: "from-red-500 to-rose-600" },
];

export const competitorPosts = [
  { id: "cpp1", competitor: "Creator Stack", title: "I grew to 100k with 3 formats", format: "reel" as PostType, hook: "I grew to 100k with only 3 content formats…", engagement: "8.9%", note: "Strong curiosity hook + round number." },
  { id: "cpp2", competitor: "Growth Lab", title: "The B2B content matrix", format: "carousel" as PostType, hook: "Steal our B2B content matrix (10 post types)", engagement: "5.2%", note: "Save-bait carousel, framework angle." },
  { id: "cpp3", competitor: "AI Daily", title: "7 AI tools thread", format: "text" as PostType, hook: "7 AI tools that feel illegal to know:", engagement: "4.6%", note: "Listicle + 'illegal to know' pattern." },
];

/* -------------------------------- automations ------------------------------- */

export const automations: {
  id: string;
  name: string;
  type: "dm-keyword" | "comment-reply" | "lead-capture";
  description: string;
  trigger: string;
  active: boolean;
  requiresApproval: boolean;
  runs: number;
  lastRun: string;
}[] = [
  { id: "au1", name: "Lead magnet DM", type: "dm-keyword", description: "Send the free template when someone comments “TEMPLATE”.", trigger: "Keyword: TEMPLATE", active: true, requiresApproval: true, runs: 248, lastRun: "26m ago" },
  { id: "au2", name: "Welcome auto-reply", type: "comment-reply", description: "Reply to first-time commenters with a friendly thank-you.", trigger: "New commenter", active: true, requiresApproval: false, runs: 1024, lastRun: "4m ago" },
  { id: "au3", name: "Pricing request capture", type: "lead-capture", description: "Capture DMs mentioning “pricing” into a leads list.", trigger: "Keyword: pricing", active: false, requiresApproval: true, runs: 63, lastRun: "2d ago" },
  { id: "au4", name: "Collab request router", type: "dm-keyword", description: "Tag and route collaboration DMs to the team inbox.", trigger: "Keyword: collab", active: true, requiresApproval: true, runs: 41, lastRun: "Yesterday" },
];

export const automationLogs = [
  { id: "l1", automation: "Lead magnet DM", event: "Sent template to @maria_codes", status: "success" as const, time: "26m ago" },
  { id: "l2", automation: "Welcome auto-reply", event: "Replied to @newcreator", status: "success" as const, time: "4m ago" },
  { id: "l3", automation: "Lead magnet DM", event: "Awaiting approval for @devbuilds", status: "pending" as const, time: "1h ago" },
  { id: "l4", automation: "Pricing request capture", event: "Skipped (automation inactive)", status: "skipped" as const, time: "2d ago" },
];

/* ------------------------------- integrations ------------------------------- */

export const integrations: {
  id: string;
  name: string;
  category: "Social" | "AI" | "Automation";
  status: "connected" | "available" | "error";
  description: string;
  lastSync?: string;
  accent: string;
}[] = [
  { id: "instagram", name: "Instagram", category: "Social", status: "connected", description: "Publish posts, reels & stories and sync comments.", lastSync: "8m ago", accent: "from-pink-500 to-rose-500" },
  { id: "facebook", name: "Facebook", category: "Social", status: "connected", description: "Publish to Pages and manage comments.", lastSync: "8m ago", accent: "from-blue-500 to-blue-600" },
  { id: "linkedin", name: "LinkedIn", category: "Social", status: "connected", description: "Publish posts & carousels to profiles and pages.", lastSync: "22m ago", accent: "from-sky-600 to-blue-600" },
  { id: "youtube", name: "YouTube", category: "Social", status: "available", description: "Upload videos and schedule premieres.", accent: "from-red-500 to-rose-600" },
  { id: "tiktok", name: "TikTok", category: "Social", status: "available", description: "Publish videos and pull performance data.", accent: "from-neutral-700 to-neutral-900" },
  { id: "x", name: "X (Twitter)", category: "Social", status: "error", description: "Publish posts & threads. Reconnect required.", lastSync: "Failed 1d ago", accent: "from-neutral-700 to-neutral-900" },
  { id: "openai", name: "OpenAI", category: "AI", status: "connected", description: "Power AI generation with GPT models.", lastSync: "Live", accent: "from-emerald-500 to-teal-500" },
  { id: "claude", name: "Claude", category: "AI", status: "available", description: "Use Anthropic Claude for content generation.", accent: "from-amber-500 to-orange-500" },
  { id: "n8n", name: "n8n", category: "Automation", status: "available", description: "Build custom automation workflows.", accent: "from-rose-500 to-pink-600" },
  { id: "webhooks", name: "Webhooks", category: "Automation", status: "connected", description: "Send events to any external endpoint.", lastSync: "Live", accent: "from-violet-500 to-indigo-600" },
];

/* --------------------------------- settings --------------------------------- */

export const settingsDefaults = {
  brandName: "Rivera Studio",
  tagline: "Content systems for ambitious creators",
  defaultTone: "Bold",
  defaultCTA: "Follow for more content systems →",
  defaultHashtags: "#contentmarketing #creators #socialmedia #aitools",
  aiProvider: "OpenAI (GPT)",
  webhookUrl: "https://hooks.socialflow.ai/ws_1/events",
  timezone: "America/New_York",
};

export const connectedChannels = [
  { platform: "instagram" as Platform, handle: "@riverastudio", status: "connected" },
  { platform: "linkedin" as Platform, handle: "Rivera Studio", status: "connected" },
  { platform: "tiktok" as Platform, handle: "@riverastudio", status: "connected" },
  { platform: "x" as Platform, handle: "@riverastudio", status: "error" },
];

/* --------------------------------- helpers ---------------------------------- */

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}
