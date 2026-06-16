"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wand2, Image as ImageIcon, Send, Save, Loader2, Calendar } from "lucide-react";
import { createPost } from "@/app/actions/posts";
import { generateContent } from "@/app/actions/generate";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", maxChars: 3000 },
  { id: "x", label: "X (Twitter)", maxChars: 280 },
  { id: "instagram", label: "Instagram", maxChars: 2200 },
  { id: "threads", label: "Threads", maxChars: 500 },
  { id: "tiktok", label: "TikTok", maxChars: 2200 },
];

export default function NewPostPage() {
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState("text");
  const [universalCaption, setUniversalCaption] = useState("");
  const [linkedinCaption, setLinkedinCaption] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleAiAssist = async () => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Please enter a title first to generate content.' });
      return;
    }
    
    setIsGenerating(true);
    try {
      const data = await generateContent("caption", title);
      setUniversalCaption(data.content);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to generate content.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Title is required.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("topic", topic);
    formData.append("post_type", postType);
    formData.append("universal_caption", universalCaption);
    formData.append("linkedin_caption", linkedinCaption);
    formData.append("instagram_caption", instagramCaption);
    formData.append("hashtags", hashtags);
    formData.append("cta", cta);
    formData.append("status", status);
    
    selectedPlatforms.forEach(p => formData.append("platforms", p));

    try {
      const result = await createPost(formData);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        setIsSubmitting(false);
      } else {
        setMessage({ type: 'success', text: 'Post saved successfully! Redirecting...' });
        setTimeout(() => router.push("/posts"), 1500);
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
      setIsSubmitting(false);
    }
  };

  // Find lowest max char limit among selected platforms (default 2200 if none)
  const maxChars = selectedPlatforms.length > 0 
    ? Math.min(...PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(p => p.maxChars))
    : 2200;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="Create New Post" 
          description="Draft and schedule content across your platforms." 
        />
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={isSubmitting}
            className="bg-white"
          >
            <Save className="mr-2 h-4 w-4 text-slate-500" />
            Save Draft
          </Button>
          <Button 
            onClick={(e) => handleSubmit(e, 'ready')}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
            Mark as Ready
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title <span className="text-red-500">*</span></Label>
                <Input 
                  id="title" 
                  placeholder="Internal name for this post" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Category</Label>
                  <Input 
                    id="topic" 
                    placeholder="e.g. Tips & Tricks" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postType">Format</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger id="postType">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text / Thread</SelectItem>
                      <SelectItem value="image">Single Image</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="video">Short Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Target Platforms</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <Badge 
                        key={platform.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${
                          isSelected 
                            ? "bg-slate-900 text-white hover:bg-slate-800" 
                            : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                        }`}
                        onClick={() => togglePlatform(platform.id)}
                      >
                        {platform.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Content</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAiAssist}
                  disabled={isGenerating}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  AI Assist
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="universal" className="w-full">
                <TabsList className="w-full justify-start border-b border-slate-100 rounded-none bg-transparent h-auto p-0 mb-4 space-x-6">
                  <TabsTrigger value="universal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2">
                    Universal Caption
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2">
                    LinkedIn Override
                  </TabsTrigger>
                  <TabsTrigger value="instagram" className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2">
                    Instagram Override
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="universal" className="mt-0">
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Write your caption here..." 
                      className="min-h-[250px] resize-y bg-slate-50/50"
                      value={universalCaption}
                      onChange={(e) => setUniversalCaption(e.target.value)}
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Will be used for all platforms unless overridden.</span>
                      <span className={`${universalCaption.length > maxChars ? 'text-red-500 font-semibold' : ''}`}>
                        {universalCaption.length} / {maxChars}
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="linkedin" className="mt-0">
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="LinkedIn specific formatting goes here..." 
                      className="min-h-[250px] resize-y bg-blue-50/30 border-blue-100 focus-visible:ring-blue-500"
                      value={linkedinCaption}
                      onChange={(e) => setLinkedinCaption(e.target.value)}
                    />
                    <div className="flex justify-end text-xs text-slate-500">
                      <span className={`${linkedinCaption.length > 3000 ? 'text-red-500 font-semibold' : ''}`}>
                        {linkedinCaption.length} / 3000
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="instagram" className="mt-0">
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Instagram specific formatting goes here..." 
                      className="min-h-[250px] resize-y bg-pink-50/30 border-pink-100 focus-visible:ring-pink-500"
                      value={instagramCaption}
                      onChange={(e) => setInstagramCaption(e.target.value)}
                    />
                    <div className="flex justify-end text-xs text-slate-500">
                      <span className={`${instagramCaption.length > 2200 ? 'text-red-500 font-semibold' : ''}`}>
                        {instagramCaption.length} / 2200
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Attach files to this post</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Click to upload media</p>
                <p className="text-xs text-slate-500 mt-1">or drag and drop files here</p>
                <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-semibold">Phase 2 feature</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Textarea 
                  id="hashtags" 
                  placeholder="#marketing #growth..." 
                  className="h-20 bg-slate-50/50"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta">Call to Action</Label>
                <Input 
                  id="cta" 
                  placeholder="e.g. Link in bio!" 
                  className="bg-slate-50/50"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
