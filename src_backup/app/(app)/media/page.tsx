"use client";

import { useState, useEffect, useRef } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Video, FileText, File, Upload, Trash2, Loader2, Download, Search } from "lucide-react";
import { getMediaAssets, uploadMedia, deleteMedia } from "@/app/actions/media";
import { formatDistanceToNow } from "date-fns";

export default function MediaPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    const data = await getMediaAssets();
    setAssets(data);
    setLoading(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadMedia(formData);
      await fetchMedia();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteMedia(id);
      fetchMedia();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    if (type.startsWith('text/') || type.includes('pdf')) return <FileText className="h-8 w-8 text-emerald-500" />;
    return <File className="h-8 w-8 text-slate-500" />;
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(search.toLowerCase());
    
    let matchesType = true;
    if (typeFilter === "images") matchesType = asset.file_type.startsWith("image/");
    if (typeFilter === "videos") matchesType = asset.file_type.startsWith("video/");
    if (typeFilter === "documents") matchesType = !asset.file_type.startsWith("image/") && !asset.file_type.startsWith("video/");
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle 
          title="Media Library" 
          description="Manage images, videos, and documents for your content." 
        />
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <Button 
            onClick={handleUploadClick}
            disabled={uploading}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20 w-full sm:w-auto"
          >
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Upload File</>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <Card className="bg-white/50 border-dashed border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200">
        <CardContent className="flex flex-col items-center justify-center p-12 cursor-pointer" onClick={handleUploadClick}>
          <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            {uploading ? (
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-orange-500" />
            )}
          </div>
          <h3 className="text-lg font-medium text-slate-900">
            {uploading ? "Uploading..." : "Click or drag files here to upload"}
          </h3>
          <p className="text-sm text-slate-500 mt-1">Supports JPG, PNG, MP4, PDF up to 50MB</p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setTypeFilter}>
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="documents">Docs</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search media..." 
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-white/50 border-slate-200 border-dashed">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No media found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {search || typeFilter !== 'all' 
              ? "No files match your filters. Try adjusting them." 
              : "Your media library is empty. Upload your first file above."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="group overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="aspect-square bg-slate-100 relative flex items-center justify-center">
                {asset.file_type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={asset.file_url} 
                    alt={asset.title} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  getFileIcon(asset.file_type)
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-9 w-9 rounded-full shadow-lg"
                    onClick={(e) => { e.preventDefault(); handleDelete(asset.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm text-slate-900 truncate" title={asset.title}>
                  {asset.title}
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                  <span>{formatFileSize(asset.file_size)}</span>
                  <span>{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
