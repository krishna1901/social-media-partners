"use client";

import { useState } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wand2, Type, ListPlus, Loader2, Copy, Check } from "lucide-react";
import { generateContent } from "@/app/actions/generate";

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    { id: "hook", title: "Generate Hook", desc: "Craft engaging hooks for social posts", icon: Type, color: "from-blue-500 to-cyan-500" },
    { id: "thread", title: "Write Thread", desc: "Structure compelling X/Twitter threads", icon: ListPlus, color: "from-orange-500 to-coral-500" },
    { id: "caption", title: "Caption Writer", desc: "Write perfect Instagram captions", icon: Wand2, color: "from-pink-500 to-rose-500" },
  ];

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const data = await generateContent(activeTool || "caption", prompt);
      setResult(data.content);
      setCopied(false);
    } catch (e) {
      setResult("Error generating content. Please check API keys.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageTitle 
        title="AI Content Studio" 
        description="Your AI-powered creative assistant for drafting content." 
      />

      <div className="grid gap-4 md:grid-cols-3">
        {tools.map((tool) => (
          <Dialog key={tool.id}>
            <DialogTrigger asChild>
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer" onClick={() => { setActiveTool(tool.id); setResult(""); setPrompt(""); }}>
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-sm`}>
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-1">{tool.title}</h3>
                  <p className="text-sm text-slate-500">{tool.desc}</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                    <tool.icon className="h-4 w-4 text-white" />
                  </div>
                  {tool.title}
                </DialogTitle>
                <DialogDescription>Enter a topic or idea below to generate content.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Topic / Prompt</Label>
                  <Input 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 5 ways AI is changing marketing..."
                  />
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !prompt}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate Content
                </Button>

                {result && (
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Result</Label>
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                      </Button>
                    </div>
                    <Textarea 
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
