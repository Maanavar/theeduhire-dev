"use client";

import Modal from "@/components/ui/modal";
import JobDetailPanel from "./job-detail-panel";

interface Props {
  open: boolean;
  jobId: string | null;
  onClose: () => void;
  jobTitle?: string;
}

export default function JobDetailModal({ open, jobId, onClose, jobTitle }: Props) {
  return (
    <Modal
      open={open && !!jobId}
      onClose={onClose}
      title={jobTitle || "Job Details"}
      maxWidth="max-w-2xl"
    >
      <JobDetailPanel jobId={jobId} />
    </Modal>
  );
}
