"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wand2, Type, ListPlus, Loader2, Copy, Check, Lightbulb, Mic, PenTool } from "lucide-react";
import { generateContent } from "@/app/actions/generate";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? "");
    };
    getUser();
  }, []);

  const tools = [
    { id: "hook", title: "Generate Hook", desc: "Craft engaging hooks for social posts & ads.", icon: Mic, color: "from-orange-400 to-orange-500", btnText: "Start Generating" },
    { id: "thread", title: "Write Thread", desc: "Structure compelling Twitter/X threads easily.", icon: PenTool, color: "from-coral-400 to-coral-500", btnText: "Draft Thread" },
    { id: "ideas", title: "Content Ideas", desc: "Brainstorm viral topics and content plans.", icon: Lightbulb, color: "from-amber-400 to-orange-500", btnText: "Get Ideas" },
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

  const recentProjects = [
    { name: "Project Nebula", progress: 85 },
    { name: "Campaign Launch", progress: 60 },
  ];

  const teamActivity = [
    { name: "Sarah J.", action: "generated 3 posts", img: "SJ" },
    { name: "Mike R.", action: "created 1 thread", img: "MR" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pt-4">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Welcome back, {email?.split('@')[0] || 'Alex'}!<br />
          Start creating.
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tools.map((tool) => (
          <Dialog key={tool.id}>
            <DialogTrigger render={
              <Card className="bg-white/90 backdrop-blur-md border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer group flex flex-col h-full" onClick={() => { setActiveTool(tool.id); setResult(""); setPrompt(""); }}>
                <CardContent className="p-8 flex-1 flex flex-col items-center text-center">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-6 shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-3">{tool.title}</h3>
                  <p className="text-slate-500 flex-1">{tool.desc}</p>
                  
                  <div className="w-full mt-8">
                    <Button variant="outline" className="w-full rounded-full border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:text-orange-500 transition-colors">
                      {tool.btnText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            } />
            <DialogContent className="sm:max-w-[600px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
              <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}>
                  <tool.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">{tool.title}</DialogTitle>
                  <DialogDescription className="text-slate-300 m-0">Enter a topic or idea below to generate content.</DialogDescription>
                </div>
              </div>
              
              <div className="p-6 space-y-6 bg-white">
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">Topic / Prompt</Label>
                  <Input 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 5 ways AI is changing marketing..."
                    className="bg-slate-50 border-slate-200 focus-visible:ring-orange-500 rounded-xl"
                  />
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !prompt}
                  className="w-full bg-gradient-to-r from-orange-400 to-coral-500 hover:from-orange-500 hover:to-coral-600 text-white rounded-xl shadow-md shadow-orange-500/20 h-12 text-md font-semibold"
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                  Generate Content
                </Button>

                {result && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 font-semibold">Result</Label>
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 rounded-lg hover:bg-orange-50 hover:text-orange-600">
                        {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4 text-slate-500" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <Textarea 
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      className="min-h-[200px] bg-slate-50 border-slate-200 focus-visible:ring-orange-500 rounded-xl resize-none"
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 pt-4">
        {/* Recent Projects */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">Recent Projects</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {recentProjects.map((project, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-800">{project.name}</span>
                  <span className="text-slate-500">Progress</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", i === 0 ? "bg-gradient-to-r from-orange-400 to-coral-500" : "bg-gradient-to-r from-amber-400 to-orange-400")} 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Activity */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">Team Activity</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {teamActivity.map((member, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shadow-sm border border-white">
                  {member.img}
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold text-slate-900">{member.name}</span>{" "}
                    <span className="text-slate-500">{member.action}</span>
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
