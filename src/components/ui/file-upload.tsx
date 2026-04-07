"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { MAX_RESUME_SIZE, ALLOWED_RESUME_TYPES } from "@/config/constants";

interface Props {
  onUpload: (resumeId: string, fileName: string) => void;
  onClear: () => void;
  uploadedName?: string;
}

export default function FileUpload({ onUpload, onClear, uploadedName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setError("");
    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      setError("Only PDF, DOC, and DOCX files are allowed");
      return;
    }
    if (file.size > MAX_RESUME_SIZE) {
      setError("File must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        onUpload(data.data.resumeId, data.data.fileName);
      } else {
        setError(data.error || "Upload failed. Please try again.");
      }
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (uploadedName) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
        <span className="text-[13px] text-green-700 flex-1 truncate">{uploadedName}</span>
        <button onClick={onClear} className="text-green-500 hover:text-green-700 transition-colors">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-gray-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Upload size={18} className="text-gray-400" />
            </div>
            <p className="text-[13px] text-gray-600 font-medium">Drop your resume here or click to browse</p>
            <p className="text-[11.5px] text-gray-400">PDF, DOC, DOCX · Max 5MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}
    </div>
  );
}
