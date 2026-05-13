"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import {
  ApiRequestError,
  getApiErrorMessage,
  getApiFieldError,
} from "@/lib/api/client";
import { certificationSchema, type CertificationInput } from "@/lib/validators/profile";
import {
  createCertification,
  updateCertification,
  type ProfileCertification,
} from "@/lib/api/profile-client";

export function CertificationModal({
  open,
  editingEntry,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingEntry?: ProfileCertification | null;
  onClose: () => void;
  onSaved: (cert: ProfileCertification) => void;
}) {
  const form = useForm<CertificationInput>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (editingEntry) {
      form.reset({
        name: editingEntry.name,
        issuedBy: editingEntry.issuedBy,
        issuedAt: new Date(editingEntry.issuedAt).toISOString().split("T")[0],
        expiresAt: editingEntry.expiresAt ? new Date(editingEntry.expiresAt).toISOString().split("T")[0] : "",
        credentialId: editingEntry.credentialId || "",
      });
    } else {
      form.reset({
        name: "",
        issuedBy: "",
        issuedAt: "",
        expiresAt: "",
        credentialId: "",
      });
    }
  }, [editingEntry, open, form]);

  const onSubmit = async (data: CertificationInput) => {
    try {
      const result = editingEntry
        ? await updateCertification(editingEntry.id, data)
        : await createCertification(data);

      onSaved(result.certification);
      toast.success(editingEntry ? "Certification updated" : "Certification added");
      onClose();
      form.reset();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(
          getApiFieldError(error, "name") ||
            getApiErrorMessage(error, "Failed to save")
        );
        return;
      }

      toast.error(getApiErrorMessage(error, "Failed to save"));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editingEntry ? "Edit Certification" : "Add Certification"} maxWidth="max-w-lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Certification name *</label>
          <input type="text" {...form.register("name")} placeholder="e.g. B.Ed, M.Ed, CTET" className="input-base" />
          {form.formState.errors.name ? <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Issued by *</label>
          <input type="text" {...form.register("issuedBy")} placeholder="e.g. University of Delhi" className="input-base" />
          {form.formState.errors.issuedBy ? <p className="mt-1 text-xs text-red-600">{form.formState.errors.issuedBy.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Issued date *</label>
            <input type="date" {...form.register("issuedAt")} className="input-base" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Expires on</label>
            <input type="date" {...form.register("expiresAt")} className="input-base" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Credential ID</label>
          <input type="text" {...form.register("credentialId")} placeholder="Optional credential ID" className="input-base" />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={form.formState.isSubmitting} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
            {form.formState.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
