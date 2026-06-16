"use client";

import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon, Video, FileText } from "lucide-react";

export default function MediaPage() {
  const assets = [
    { id: 1, name: "hero-banner.png", type: "image", size: "2.4 MB" },
    { id: 2, name: "demo-walkthrough.mp4", type: "video", size: "14.2 MB" },
    { id: 3, name: "brand-guidelines.pdf", type: "document", size: "1.1 MB" },
  ];

  const getIcon = (type: string) => {
    if (type === "video") return <Video className="h-8 w-8 text-blue-500" />;
    if (type === "document") return <FileText className="h-8 w-8 text-orange-500" />;
    return <ImageIcon className="h-8 w-8 text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle title="Media Library" description="Manage all your images, videos, and assets in one place." />
        <Button className="bg-slate-900 text-white hover:bg-slate-800">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Asset
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
          <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">Drag & Drop</p>
          <p className="text-xs text-slate-400 mt-1">or click to browse</p>
        </Card>

        {assets.map((asset) => (
          <Card key={asset.id} className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm overflow-hidden group">
            <div className="aspect-square bg-slate-100 flex items-center justify-center p-6 border-b border-slate-100">
              {getIcon(asset.type)}
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium text-slate-900 truncate" title={asset.name}>{asset.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{asset.size}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
