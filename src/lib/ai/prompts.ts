import "server-only";
import type { AIGenerateInput, AIToolId } from "@/lib/ai/types";

/**
 * Prompt templates + demo fallbacks for the 10 Content Studio tools.
 *
 * Bump PROMPT_VERSION whenever a template changes so persisted generations stay
 * reproducible/auditable.
 */
export const PROMPT_VERSION = "3a.1";

interface ToolSpec {
  /** Human label (used in demo/history previews). */
  label: string;
  /** System prompt — sets the persona + global rules. */
  system: string;
  /** Tool-specific instruction appended after the shared context block. */
  instruction: string;
  /** Whether the tool returns multiple discrete variations or one document. */
  multi: boolean;
  /** Canned output used when no API key is configured (demo/preview mode). */
  demo: string[];
}

const SYSTEM_BASE =
  "You are SocialFlow AI, an expert social media copywriter and content strategist. " +
  "You write punchy, on-brand, platform-native copy that stops the scroll and drives engagement. " +
  "Never use hashtags unless explicitly asked. Avoid clichés and filler. Be specific and concrete.";

const TOOL_SPECS: Record<AIToolId, ToolSpec> = {
  hook: {
    label: "Hook Generator",
    system: SYSTEM_BASE,
    instruction:
      "Write 4 scroll-stopping opening hooks. Each hook must be one line, under 140 characters, and create curiosity or tension. " +
      "Return them as a numbered list (1-4), no preamble, no explanations.",
    multi: true,
    demo: [
      "Everyone's posting daily. Almost no one is growing. Here's the difference 👇",
      "I analyzed 500 viral posts so you don't have to. 7 patterns showed up every time.",
      "The 'post and pray' era is over. This is what actually moves the needle in 2026.",
      "Your content isn't the problem. Your first line is. Fix this in 30 seconds.",
    ],
  },
  caption: {
    label: "Caption Generator",
    system: SYSTEM_BASE,
    instruction:
      "Write 3 complete, on-brand captions. Each should open with a hook, deliver one clear idea, and end with a soft call to action. " +
      "Return them as a numbered list (1-3), separated clearly, no hashtags.",
    multi: true,
    demo: [
      "We rebuilt our entire content system in a weekend. The results surprised even us — here's the exact playbook we used.",
      "Most teams treat content like a checkbox. We treat it like a product. That one shift changed everything.",
      "You don't need to post more. You need to post sharper. Here's how we cut volume 40% and doubled reach.",
    ],
  },
  hashtag: {
    label: "Hashtag Generator",
    system: SYSTEM_BASE,
    instruction:
      "Produce a strategic hashtag set: a mix of high-reach, niche, and branded tags. " +
      "Group them under 'Reach', 'Niche', and 'Branded' headings. Aim for 12-18 tags total. Hashtags ARE the deliverable here.",
    multi: false,
    demo: [
      "Reach: #contentmarketing #socialmediatips #digitalmarketing #creatoreconomy\n" +
        "Niche: #facelesscontent #contentstrategy #shortformvideo #b2bmarketing\n" +
        "Branded: #SocialFlowAI #ContentCommandCenter #PostSharper",
    ],
  },
  cta: {
    label: "CTA Generator",
    system: SYSTEM_BASE,
    instruction:
      "Write 5 conversion-focused calls to action. Vary the intent (save, comment, share, click, follow). " +
      "Each one line. Return as a numbered list (1-5).",
    multi: true,
    demo: [
      "Save this so you actually use it next time you sit down to write.",
      "Which one are you trying first? Drop a 🔥 below.",
      "Send this to the teammate who still posts and prays.",
      "Want the full template? Comment \"PLAYBOOK\" and I'll DM it.",
      "Follow for the rest of the 2026 content system — one post at a time.",
    ],
  },
  carousel: {
    label: "Carousel Outline",
    system: SYSTEM_BASE,
    instruction:
      "Write a slide-by-slide carousel outline (6-8 slides) engineered to retain swipes. " +
      "For each slide give a label (e.g. 'Slide 1 — Hook') and one line of copy. End with a CTA slide.",
    multi: false,
    demo: [
      "Slide 1 — Hook: The myth that's quietly killing your reach\n" +
        "Slide 2 — Why it's wrong: Daily posting ≠ growth\n" +
        "Slide 3 — The data: What 500 viral posts had in common\n" +
        "Slide 4 — The shift: From volume to velocity\n" +
        "Slide 5 — The system: Plan → batch → repurpose\n" +
        "Slide 6 — Proof: 40% less output, 2x reach\n" +
        "Slide 7 — CTA: Save this and steal the framework",
    ],
  },
  "video-script": {
    label: "Video Script",
    system: SYSTEM_BASE,
    instruction:
      "Write a short-form video script (30-45s) with clearly labeled [HOOK], [BODY] (2-3 beats), and [CTA] sections. " +
      "Write spoken, natural language with on-screen text cues in (parentheses).",
    multi: false,
    demo: [
      "[HOOK] Most creators quit at 1k followers. Here's the math that keeps the rest going.\n\n" +
        "[BODY] (on-screen: 1,000 followers) A thousand people is a sold-out room. " +
        "Beat 1: You don't need more people — you need a sharper message. " +
        "Beat 2: One great post beats ten forgettable ones. " +
        "Beat 3: Consistency compounds; reach follows resonance.\n\n" +
        "[CTA] Follow for the system that turns 1k into 10k without burning out.",
    ],
  },
  linkedin: {
    label: "LinkedIn Post",
    system: SYSTEM_BASE,
    instruction:
      "Write an authority-building LinkedIn post. Strong one-line hook, generous line breaks for scannability, " +
      "a concrete story or insight, and a question to drive comments. Professional but human. No hashtags.",
    multi: false,
    demo: [
      "We cut our content output by 40%.\n\n" +
        "Reach doubled.\n\n" +
        "Here's the counterintuitive lesson: the bottleneck was never volume. It was clarity.\n\n" +
        "When every post tries to say everything, it says nothing. We started shipping one sharp idea at a time — " +
        "and the algorithm, and our audience, finally knew what we were about.\n\n" +
        "What's one thing you'd stop posting if you could?",
    ],
  },
  instagram: {
    label: "Instagram Caption",
    system: SYSTEM_BASE,
    instruction:
      "Write a punchy Instagram caption with a strong first line, tasteful emoji, and short line breaks. " +
      "End with a light CTA. Keep it native to Instagram. No hashtag block (that's a separate tool).",
    multi: false,
    demo: [
      "Post less. Grow more. 🤯\n\n" +
        "We stopped chasing the daily streak and started chasing resonance.\n\n" +
        "✅ One idea per post\n✅ Batched, not rushed\n✅ Repurposed everywhere\n\n" +
        "Save this for your next content reset 🔖",
    ],
  },
  repurpose: {
    label: "Content Repurposer",
    system: SYSTEM_BASE,
    instruction:
      "Repurpose the source idea into a multi-platform set. Provide tailored versions for: " +
      "LinkedIn (professional), Instagram (visual/emoji), X/Twitter (concise thread starter), and a YouTube Short hook. " +
      "Label each platform clearly.",
    multi: false,
    demo: [
      "LinkedIn: We cut content output 40% and doubled reach. The bottleneck was clarity, not volume. " +
        "Here's the one shift that did it →\n\n" +
        "Instagram: Post less. Grow more. 🤯 One idea per post changed everything. Save this 🔖\n\n" +
        "X/Twitter: Everyone says post daily. We posted less and grew faster. A thread on why 🧵\n\n" +
        "YouTube Short: Most creators post too much and say too little — here's the fix in 30 seconds.",
    ],
  },
  brief: {
    label: "Content Brief",
    system: SYSTEM_BASE,
    instruction:
      "Write a structured content brief for a writer/designer. Include sections: Objective, Target audience, " +
      "Key message, Format & specs, Hook options (2), Outline, CTA, and Success metric. Use clear headings.",
    multi: false,
    demo: [
      "Objective: Reframe 'post daily' advice and drive saves.\n" +
        "Target audience: Solo marketers & founders building in public.\n" +
        "Key message: Resonance beats volume — post sharper, not more.\n" +
        "Format & specs: 7-slide carousel, 1080x1350, brand orange accents.\n" +
        "Hook options: (1) 'Everyone's posting daily. Almost no one is growing.' (2) 'Post less. Grow more.'\n" +
        "Outline: Myth → why it's wrong → data → the shift → the system → proof → CTA.\n" +
        "CTA: Save + share with a teammate.\n" +
        "Success metric: Saves per impression > 2%.",
    ],
  },
  "gap-analysis": {
    label: "Content Gap Analyzer",
    system:
      "You are SocialFlow AI, a competitive content strategist. You compare a creator against tracked " +
      "competitors and surface specific, actionable content gaps — formats, angles or cadences the rivals " +
      "win with that the creator should try. Be concrete and reference the competitor or metric.",
    instruction:
      "From the competitor brief below, identify 3-5 content gaps the creator should act on. " +
      "Return a numbered list. Each item MUST be a single line in EXACTLY this format:\n" +
      "Title :: one concrete sentence of rationale that references a competitor or metric :: Impact: High|Medium|Quick win\n" +
      "No preamble, no closing remarks, no extra lines.",
    multi: true,
    demo: [
      "You're missing short documentaries :: Founder Diaries pulls 6.7% engagement on short-doc storytelling — a format you haven't published. One 3–5 min mini-doc per month could close the gap. :: Impact: High",
      "Add a weekly hot-take thread :: AI Daily posts 21x/week leaning on opinionated threads while you publish zero — a recurring Monday hot-take tests a proven, low-effort format. :: Impact: Quick win",
      "Try save-bait framework carousels :: Growth Lab's 'B2B content matrix' carousel earns 5.2% by packaging a framework as save-bait — mirror the angle with your own repeatable system. :: Impact: Medium",
    ],
  },
};

/** Public label lookup for a tool (used by history previews). */
export function toolLabel(tool: AIToolId): string {
  return TOOL_SPECS[tool]?.label ?? tool;
}

/** Whether a tool returns multiple discrete variations. */
export function toolIsMulti(tool: AIToolId): boolean {
  return TOOL_SPECS[tool]?.multi ?? false;
}

/** Build the {system, user} message pair for a generation request. */
export function buildPrompt(input: AIGenerateInput): {
  system: string;
  user: string;
} {
  const spec = TOOL_SPECS[input.tool] ?? TOOL_SPECS.hook;

  const contextLines = [
    `Topic: ${input.topic}`,
    input.audience ? `Audience: ${input.audience}` : null,
    input.platform ? `Platform: ${input.platform}` : null,
    input.tone ? `Tone: ${input.tone}` : null,
    input.contentType ? `Content format: ${input.contentType}` : null,
    input.context ? `Extra context: ${input.context}` : null,
  ].filter(Boolean);

  const user = `${spec.instruction}\n\n--- Brief ---\n${contextLines.join("\n")}`;
  return { system: spec.system, user };
}

/** Canned per-tool output for demo/preview mode (no API key). */
export function demoOutputFor(input: AIGenerateInput): string[] {
  const spec = TOOL_SPECS[input.tool] ?? TOOL_SPECS.hook;
  return spec.demo;
}
