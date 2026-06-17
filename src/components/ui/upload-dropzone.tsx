"use client";

import { useRef, useState } from "react";
import { UploadCloud, ImageIcon, Video, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFiles?: (files: FileList) => void;
  hint?: string;
  className?: string;
}

export function UploadDropzone({ onFiles, hint, className }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles?.(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-brand-400 bg-brand-50/50" : "border-border bg-muted/20 hover:border-brand-200",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm">
        <UploadCloud className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Drag &amp; drop files here</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint ?? "Images, videos, ZIPs and carousel PNGs up to 200MB"}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        Browse files
      </Button>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Images</span>
        <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video</span>
        <span className="inline-flex items-center gap-1"><FileArchive className="h-3.5 w-3.5" /> ZIP</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles?.(e.target.files);
        }}
      />
    </div>
  );
}
