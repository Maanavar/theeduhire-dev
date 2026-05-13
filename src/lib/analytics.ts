export type AnalyticsEventName =
  | "job_viewed"
  | "job_applied"
  | "job_saved"
  | "profile_completed"
  | "application_status_changed"
  | "auth_signup_started"
  | "auth_signup_completed"
  | "job_apply_submitted"
  | "pipeline_status_changed"
  | "interview_status_changed"
  | "message_sent"
  | "notification_mark_read"
  | "security_password_changed";

export function trackEvent(name: AnalyticsEventName, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const eventPayload = {
    event: name,
    eventName: name,
    ts: Date.now(),
    ...payload,
  };

  window.dispatchEvent(new CustomEvent("eduhire:analytics", { detail: eventPayload }));

  const w = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push(eventPayload);
  }

  const posthogClient = (window as Window & { posthog?: { capture?: (event: string, properties?: Record<string, unknown>) => void } }).posthog;
  if (posthogClient?.capture) {
    posthogClient.capture(name, payload);
  }
}
