"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Save, Loader2, Check } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingTab, setSavingTab] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // First get workspace
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1)
        .single();
        
      if (workspace) {
        const { data } = await supabase
          .from("settings")
          .select("*")
          .eq("workspace_id", workspace.id)
          .single();
          
        if (data) {
          setSettings(data);
        }
      }
    }
    setLoading(false);
  };

  const handleSave = async (tab: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingTab(tab);
    setSuccessMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const updates: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      updates[key] = value;
    });

    const supabase = createClient();
    await supabase
      .from("settings")
      .update(updates)
      .eq("id", settings.id);
      
    await fetchSettings();
    setSavingTab(null);
    setSuccessMessage(`Settings saved successfully.`);
    
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="Settings" 
          description="Manage your workspace preferences and integrations." 
        />
        
        {successMessage && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/50 border border-slate-200">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="defaults">Content Defaults</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <form onSubmit={(e) => handleSave("general", e)}>
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
                <CardDescription>
                  Configure your primary brand information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand / Workspace Name</Label>
                  <Input 
                    id="brand_name" 
                    name="brand_name" 
                    defaultValue={settings?.brand_name || ""} 
                    className="max-w-md bg-white" 
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" disabled={savingTab === "general"} className="bg-slate-900 text-white hover:bg-slate-800">
                  {savingTab === "general" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        
        <TabsContent value="defaults" className="mt-6">
          <form onSubmit={(e) => handleSave("defaults", e)}>
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle>Content Defaults</CardTitle>
                <CardDescription>
                  These values will be used to pre-fill new content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default_tone">Default Voice & Tone</Label>
                  <Input 
                    id="default_tone" 
                    name="default_tone" 
                    defaultValue={settings?.default_tone || ""} 
                    placeholder="e.g. Professional but conversational, slightly witty"
                    className="bg-white" 
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default_cta">Default Call to Action</Label>
                    <Input 
                      id="default_cta" 
                      name="default_cta" 
                      defaultValue={settings?.default_cta || ""} 
                      placeholder="e.g. Link in bio!"
                      className="bg-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_hashtags">Default Hashtags</Label>
                    <Input 
                      id="default_hashtags" 
                      name="default_hashtags" 
                      defaultValue={settings?.default_hashtags || ""} 
                      placeholder="#marketing #growth"
                      className="bg-white" 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" disabled={savingTab === "defaults"} className="bg-slate-900 text-white hover:bg-slate-800">
                  {savingTab === "defaults" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Defaults
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        
        <TabsContent value="integrations" className="mt-6">
          <form onSubmit={(e) => handleSave("integrations", e)}>
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle>API Integrations</CardTitle>
                <CardDescription>
                  Connect third-party services to power up your workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div> AI Generation
                  </h4>
                  <div className="space-y-2 pl-4 border-l border-slate-100">
                    <Label htmlFor="ai_api_key">OpenAI / Anthropic API Key</Label>
                    <Input 
                      id="ai_api_key" 
                      name="ai_api_key" 
                      type="password"
                      defaultValue={settings?.ai_api_key || ""} 
                      placeholder="sk-..."
                      className="max-w-md bg-white font-mono" 
                    />
                    <p className="text-xs text-slate-500">Required for the Content Studio generator.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div> Publishing & Automations
                  </h4>
                  <div className="space-y-4 pl-4 border-l border-slate-100">
                    <div className="space-y-2">
                      <Label htmlFor="buffer_api_key">Buffer Access Token</Label>
                      <Input 
                        id="buffer_api_key" 
                        name="buffer_api_key" 
                        type="password"
                        defaultValue={settings?.buffer_api_key || ""} 
                        placeholder="1/..."
                        className="max-w-md bg-white font-mono" 
                      />
                      <p className="text-xs text-slate-500">Required to auto-publish scheduled posts.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="n8n_webhook_url">n8n Webhook URL</Label>
                      <Input 
                        id="n8n_webhook_url" 
                        name="n8n_webhook_url" 
                        type="url"
                        defaultValue={settings?.n8n_webhook_url || ""} 
                        placeholder="https://..."
                        className="max-w-md bg-white" 
                      />
                      <p className="text-xs text-slate-500">Required for advanced DM automations.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4">
                <Button type="submit" disabled={savingTab === "integrations"} className="bg-slate-900 text-white hover:bg-slate-800">
                  {savingTab === "integrations" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save API Keys
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
