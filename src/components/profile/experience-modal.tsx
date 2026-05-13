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
import { cn } from "@/lib/utils";
import { experienceSchema, type ExperienceInput } from "@/lib/validators/profile";
import {
  createExperience,
  updateExperience,
  type ProfileExperience,
} from "@/lib/api/profile-client";

export function ExperienceModal({
  open,
  editingEntry,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingEntry?: ProfileExperience | null;
  onClose: () => void;
  onSaved: (exp: ProfileExperience) => void;
}) {
  const form = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      isCurrent: false,
    },
  });

  useEffect(() => {
    if (editingEntry) {
      form.reset({
        schoolName: editingEntry.schoolName,
        role: editingEntry.role,
        startDate: new Date(editingEntry.startDate).toISOString().split("T")[0],
        endDate: editingEntry.endDate ? new Date(editingEntry.endDate).toISOString().split("T")[0] : "",
        isCurrent: editingEntry.isCurrent || false,
        description: editingEntry.description || "",
      });
    } else {
      form.reset({
        schoolName: "",
        role: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      });
    }
  }, [editingEntry, open, form]);

  const isCurrent = form.watch("isCurrent");

  useEffect(() => {
    if (isCurrent) {
      form.setValue("endDate", null);
    }
  }, [isCurrent, form]);

  const onSubmit = async (data: ExperienceInput) => {
    try {
      const result = editingEntry
        ? await updateExperience(editingEntry.id, data)
        : await createExperience(data);

      onSaved(result.experience);
      toast.success(editingEntry ? "Experience updated" : "Experience added");
      onClose();
      form.reset();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(
          getApiFieldError(error, "schoolName") ||
            getApiErrorMessage(error, "Failed to save")
        );
        return;
      }

      toast.error(getApiErrorMessage(error, "Failed to save"));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editingEntry ? "Edit Experience" : "Add Experience"} maxWidth="max-w-lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">School name *</label>
          <input type="text" {...form.register("schoolName")} placeholder="e.g. Delhi Public School" className="input-base" />
          {form.formState.errors.schoolName ? <p className="mt-1 text-xs text-red-600">{form.formState.errors.schoolName.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Role *</label>
          <input type="text" {...form.register("role")} placeholder="e.g. Mathematics Teacher" className="input-base" />
          {form.formState.errors.role ? <p className="mt-1 text-xs text-red-600">{form.formState.errors.role.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Start date *</label>
            <input type="date" {...form.register("startDate")} className="input-base" />
            {form.formState.errors.startDate ? <p className="mt-1 text-xs text-red-600">{form.formState.errors.startDate.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">End date</label>
            <input type="date" {...form.register("endDate")} disabled={isCurrent} className={cn("input-base", isCurrent && "cursor-not-allowed opacity-50")} />
            {form.formState.errors.endDate ? <p className="mt-1 text-xs text-red-600">{form.formState.errors.endDate.message}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...form.register("isCurrent")} id="isCurrent" className="rounded" />
          <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">
            I currently work here
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
          <textarea {...form.register("description")} placeholder="Your responsibilities and achievements..." className="input-base min-h-[100px] resize-vertical" />
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
