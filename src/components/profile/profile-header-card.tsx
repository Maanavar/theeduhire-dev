"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Copy, Eye, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Panel } from "@/components/layout/page-shell";
import { getApiErrorMessage } from "@/lib/api/client";
import { uploadAvatar } from "@/lib/api/profile-client";

export function ProfileHeaderCard({
  avatarUrl,
  name,
  availabilityStatus,
  completion,
  onAvatarChange,
}: {
  avatarUrl?: string | null;
  name?: string;
  availabilityStatus: string;
  completion: number;
  onAvatarChange: (url: string) => void;
}) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const data = await uploadAvatar(file);
      onAvatarChange(data.avatarUrl);
      toast.success("Photo updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Upload failed"));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyProfileLink = () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const { protocol, host } = window.location;
    const url = `${protocol}//${host}/profile/${userId}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied");
  };

  const openPublicPreview = () => {
    const userId = session?.user?.id;
    if (!userId) return;
    window.open(`/profile/${userId}`, "_blank");
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case "ACTIVELY_LOOKING":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "OPEN_TO_OFFERS":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "IMMEDIATE_JOINER":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "PART_TIME_ONLY":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "ONLINE_ONLY":
        return "bg-violet-50 text-violet-700 border-violet-100";
      case "EXAM_SEASON":
        return "bg-orange-50 text-orange-700 border-orange-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const getAvailabilityLabel = () => {
    switch (availabilityStatus) {
      case "ACTIVELY_LOOKING":
        return "Actively looking";
      case "OPEN_TO_OFFERS":
        return "Open to offers";
      case "IMMEDIATE_JOINER":
        return "Available immediately";
      case "PART_TIME_ONLY":
        return "Part-time only";
      case "ONLINE_ONLY":
        return "Online classes only";
      case "EXAM_SEASON":
        return "Exam season / revision";
      default:
        return "Not looking";
    }
  };

  return (
    <Panel className="mb-6 p-6">
      <div className="flex items-start gap-6">
        <div className="relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
            disabled={uploadingAvatar}
          />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="group relative">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name || "Profile photo"} width={96} height={96} className="h-full w-full object-cover" />
              ) : (
                (name || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition-colors group-hover:bg-black/20">
              <Upload size={16} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            {uploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                <Loader2 size={16} className="animate-spin text-white" />
              </div>
            ) : null}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-gray-900">{name || "Teacher Profile"}</h2>
            <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", getAvailabilityColor())}>
              {getAvailabilityLabel()}
            </span>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Profile completion</span>
              <span className="text-xs font-bold text-brand-600">{completion}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={copyProfileLink} className="eh-btn eh-btn-secondary eh-btn-sm">
              <Copy size={13} /> Share profile
            </button>
            <button onClick={openPublicPreview} className="eh-btn eh-btn-secondary eh-btn-sm">
              <Eye size={13} /> Preview profile
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
