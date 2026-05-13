import { AlertCircle, Ban, CheckCircle2, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/layout/page-shell";

type StateContainerProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  tone?: "status" | "alert";
};

function StateContainer({ title, message, icon, actions, className, tone = "status" }: StateContainerProps) {
  const accent =
    tone === "alert"
      ? "from-red-100 via-orange-50 to-amber-100"
      : "from-brand-100 via-emerald-50 to-sky-100";

  return (
    <Panel
      role={tone === "alert" ? "alert" : "status"}
      aria-live={tone === "alert" ? "assertive" : "polite"}
      className={cn("p-10 text-center", className)}
    >
      <div className="mx-auto mb-4 flex flex-col items-center gap-2">
        <div className={`h-10 w-16 rounded-full bg-gradient-to-r ${accent} opacity-75`} aria-hidden="true" />
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          {icon}
        </div>
      </div>
      <h3 className="text-base font-semibold text-eh-text">{title}</h3>
      {message ? <p className="mx-auto mt-2 max-w-md text-sm text-eh-text3">{message}</p> : null}
      {actions ? <div className="mt-5 flex items-center justify-center gap-2">{actions}</div> : null}
    </Panel>
  );
}

export function LoadingState({ title = "Loading", message = "Please wait while we load your data." }: { title?: string; message?: string }) {
  return <StateContainer title={title} message={message} icon={<Loader2 className="h-5 w-5 animate-spin" />} tone="status" />;
}

export function EmptyState({ title, message, actions }: { title: string; message?: string; actions?: ReactNode }) {
  return <StateContainer title={title} message={message} actions={actions} icon={<Inbox className="h-5 w-5" />} tone="status" />;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  actions,
}: {
  title?: string;
  message?: string;
  actions?: ReactNode;
}) {
  return (
    <StateContainer
      title={title}
      message={message}
      actions={actions}
      icon={<AlertCircle className="h-5 w-5" />}
      className="border-red-200 bg-red-50"
      tone="alert"
    />
  );
}

export function SuccessState({ title, message, actions }: { title: string; message?: string; actions?: ReactNode }) {
  return (
    <StateContainer
      title={title}
      message={message}
      actions={actions}
      icon={<CheckCircle2 className="h-5 w-5" />}
      className="border-emerald-200 bg-emerald-50"
      tone="status"
    />
  );
}

export function NoAccessState({
  title = "Access restricted",
  message = "You do not have permission to view this page.",
}: {
  title?: string;
  message?: string;
}) {
  return <StateContainer title={title} message={message} icon={<Ban className="h-5 w-5" />} className="border-amber-200 bg-amber-50" tone="alert" />;
}
