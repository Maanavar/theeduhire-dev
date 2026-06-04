import { supabaseAdmin } from "@/lib/supabase";
import {
  AVATAR_BUCKET,
  PRIVATE_ASSET_URL_TTL_SECONDS,
  RESUME_BUCKET,
  SCHOOL_LOGO_BUCKET,
  TEACHER_DEMO_VIDEO_BUCKET,
  TEACHER_LESSON_PLAN_BUCKET,
} from "@/config/constants";

type BucketVisibility = "public" | "private";

const KNOWN_BUCKETS = [
  RESUME_BUCKET,
  AVATAR_BUCKET,
  SCHOOL_LOGO_BUCKET,
  TEACHER_DEMO_VIDEO_BUCKET,
  TEACHER_LESSON_PLAN_BUCKET,
] as const;

export function getFileExtension(fileName: string) {
  const segments = fileName.split(".");
  if (segments.length < 2) return "";
  return segments.pop()?.toLowerCase() ?? "";
}

export function fileMatchesAllowedTypes(file: File, allowedTypes: readonly string[], allowedExtensions: readonly string[]) {
  if (allowedTypes.includes(file.type)) return true;
  const extension = getFileExtension(file.name);
  return extension ? allowedExtensions.includes(extension) : false;
}

type UploadContentKind = "document" | "image" | "demo-video";

function hasMagic(buffer: Buffer, magic: number[], offset = 0) {
  if (buffer.length < offset + magic.length) return false;
  return magic.every((byte, index) => buffer[offset + index] === byte);
}

function hasAscii(buffer: Buffer, value: string, offset: number) {
  if (buffer.length < offset + value.length) return false;
  return buffer.toString("ascii", offset, offset + value.length) === value;
}

function isZip(buffer: Buffer) {
  return (
    hasMagic(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    hasMagic(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    hasMagic(buffer, [0x50, 0x4b, 0x07, 0x08])
  );
}

export function fileBufferMatchesAllowedContent(
  buffer: Buffer,
  fileName: string,
  kind: UploadContentKind,
  contentType = ""
) {
  const extension =
    getFileExtension(fileName) ||
    ({
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
    }[contentType] ?? "");

  if (kind === "document") {
    if (extension === "pdf") return hasMagic(buffer, [0x25, 0x50, 0x44, 0x46]);
    if (extension === "doc") return hasMagic(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    if (extension === "docx") return isZip(buffer);
    return false;
  }

  if (kind === "image") {
    if (extension === "jpg" || extension === "jpeg") return hasMagic(buffer, [0xff, 0xd8, 0xff]);
    if (extension === "png") return hasMagic(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (extension === "webp") return hasAscii(buffer, "RIFF", 0) && hasAscii(buffer, "WEBP", 8);
    return false;
  }

  if (extension === "webm") return hasMagic(buffer, [0x1a, 0x45, 0xdf, 0xa3]);
  if (extension === "mp4" || extension === "mov") return hasAscii(buffer, "ftyp", 4);
  return false;
}

export async function ensureBucket(bucket: string, visibility: BucketVisibility, fileSizeLimit = "100MB") {
  const { data: existing, error: lookupError } = await supabaseAdmin.storage.getBucket(bucket);
  const isPublic = visibility === "public";

  if (!lookupError && existing) {
    const existingFileSizeLimit = (existing as { file_size_limit?: string | null }).file_size_limit;
    if (existing.public !== isPublic || existingFileSizeLimit !== fileSizeLimit) {
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucket, {
        public: isPublic,
        fileSizeLimit,
      });

      if (updateError) {
        throw updateError;
      }
    }
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
    public: isPublic,
    fileSizeLimit,
  });

  if (createError && createError.message !== "The resource already exists") {
    throw createError;
  }
}

export function createStorageObjectRef(bucket: string, path: string) {
  return `storage://${bucket}/${path}`;
}

export function parseStorageObjectRef(value: string) {
  if (!value) return null;

  if (value.startsWith("storage://")) {
    const withoutProtocol = value.slice("storage://".length);
    const firstSlash = withoutProtocol.indexOf("/");
    if (firstSlash === -1) return null;

    return {
      bucket: withoutProtocol.slice(0, firstSlash),
      path: withoutProtocol.slice(firstSlash + 1),
    };
  }

  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname);
    const objectMatch = pathname.match(/\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (objectMatch) {
      return {
        bucket: objectMatch[1],
        path: objectMatch[2],
      };
    }

    for (const bucket of KNOWN_BUCKETS) {
      const bucketIndex = pathname.indexOf(`/${bucket}/`);
      if (bucketIndex !== -1) {
        return {
          bucket,
          path: pathname.slice(bucketIndex + bucket.length + 2),
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function createSignedObjectUrl(value: string, expiresIn = PRIVATE_ASSET_URL_TTL_SECONDS) {
  const parsed = parseStorageObjectRef(value);
  if (!parsed) {
    return value;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function removeStoredObject(value: string | null | undefined) {
  if (!value) return;

  const parsed = parseStorageObjectRef(value);
  if (!parsed) return;

  await supabaseAdmin.storage.from(parsed.bucket).remove([parsed.path]);
}

export function getResumeAccessPath(resumeId: string) {
  return `/api/resumes/${resumeId}`;
}

export function getTeacherDocumentAccessPath(kind: "demo-video" | "lesson-plan", userId: string) {
  return `/api/teacher-documents/${kind}/${userId}`;
}
