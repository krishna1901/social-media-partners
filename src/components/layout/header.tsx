"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? "");
    };
    getUser();
  }, []);

  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 shadow-sm">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <Input 
            placeholder="Search ideas, posts, or trends..." 
            className="pl-9 bg-white/50 border-slate-200/60 w-full focus-visible:ring-orange-500/20 focus-visible:border-orange-500/50 transition-all shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 relative transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-orange-500 border-2 border-white shadow-sm shadow-orange-500/50"></span>
        </Button>
        <div className="h-8 w-px bg-slate-200/60 mx-1"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-orange-600 transition-colors">{email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-slate-500 mt-1">Pro Plan</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden group-hover:border-orange-200 transition-colors">
            <User className="h-5 w-5 text-slate-500 group-hover:text-orange-500 transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
}
