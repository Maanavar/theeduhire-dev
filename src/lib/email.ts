// Email service via Resend
// All transactional emails go through here

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "EduHire <noreply@theeduhire.in>";
const BASE_URL = process.env.NEXTAUTH_URL || "https://theeduhire.in";

// ── Shared HTML helpers ──────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f0;margin:0;padding:32px 16px;color:#1a1a18}
  .card{background:#fff;border-radius:16px;padding:40px;max-width:540px;margin:0 auto;border:1px solid #e8e7e0}
  .logo{font-size:20px;font-weight:700;color:#2a7a4e;margin-bottom:32px}
  h1{font-size:22px;font-weight:700;margin:0 0 12px}
  p{font-size:15px;line-height:1.6;color:#444441;margin:0 0 16px}
  .btn{display:inline-block;padding:13px 28px;background:#2a7a4e;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0 24px}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600}
  .badge-green{background:#eaf3de;color:#27500a}
  .badge-blue{background:#e6f1fb;color:#0c447c}
  .badge-amber{background:#faeeda;color:#633806}
  .badge-red{background:#fcebeb;color:#791f1f}
  .divider{border:none;border-top:1px solid #e8e7e0;margin:24px 0}
  .footer{font-size:12px;color:#888780;text-align:center;margin-top:24px}
  .detail-row{display:flex;gap:8px;margin-bottom:8px;font-size:14px}
  .detail-label{color:#888780;min-width:100px}
  .detail-value{color:#1a1a18;font-weight:500}
</style>
</head>
<body><div class="card">
  <div class="logo">EduHire</div>
  ${content}
  <hr class="divider">
  <div class="footer">EduHire · Tamil Nadu's Teacher Job Platform<br>
  <a href="${BASE_URL}" style="color:#2a7a4e">theeduhire.in</a></div>
</div></body></html>`;
}

// ── 1. Email Verification ────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${BASE_URL}/auth/verify?token=${token}`;
  const html = emailWrapper(`
    <h1>Verify your email address</h1>
    <p>Hi ${name},</p>
    <p>Thanks for joining EduHire! Please verify your email address to activate your account.</p>
    <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    <p style="font-size:13px;color:#888780">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `);

  // For development: log the email instead of sending
  if (process.env.NODE_ENV === "development") {
    console.log("📧 DEVELOPMENT MODE - Email would be sent:");
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your EduHire account`);
    console.log(`Verify URL: ${verifyUrl}`);
    console.log(`HTML: ${html}`);
    return { success: true };
  }

  return resend.emails.send({ from: FROM, to: email, subject: "Verify your EduHire account", html });
}

// ── 2. Application Confirmation (to Teacher) ─────────────────────────────────

export async function sendApplicationConfirmation({
  teacherEmail,
  teacherName,
  jobTitle,
  schoolName,
  jobId,
}: {
  teacherEmail: string;
  teacherName: string;
  jobTitle: string;
  schoolName: string;
  jobId: string;
}) {
  const jobUrl = `${BASE_URL}/jobs/${jobId}`;
  const html = emailWrapper(`
    <h1>Application submitted!</h1>
    <p>Hi ${teacherName},</p>
    <p>Your application has been sent to <strong>${schoolName}</strong>. They'll review it and get back to you soon.</p>
    <div style="background:#f4f4f0;border-radius:10px;padding:16px;margin:16px 0">
      <div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>
      <div class="detail-row"><span class="detail-label">School</span><span class="detail-value">${schoolName}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge badge-blue">Pending Review</span></span></div>
    </div>
    <a href="${jobUrl}" class="btn">View Job Posting</a>
    <p>You can track all your applications in your <a href="${BASE_URL}/dashboard/applications" style="color:#2a7a4e">dashboard</a>.</p>
  `);

  return resend.emails.send({ from: FROM, to: teacherEmail, subject: `Application received — ${jobTitle} at ${schoolName}`, html });
}

// ── 3. Application Status Update (to Teacher) ────────────────────────────────

const STATUS_COPY: Record<string, { label: string; badge: string; message: string }> = {
  REVIEWED: {
    label: "Application Reviewed",
    badge: "badge-blue",
    message: "Your application has been reviewed by the school. They're evaluating candidates — you'll hear more soon.",
  },
  SHORTLISTED: {
    label: "You've been shortlisted!",
    badge: "badge-amber",
    message: "Great news — you've been shortlisted for this position! The school will be in touch with next steps shortly.",
  },
  HIRED: {
    label: "Congratulations — you got the job!",
    badge: "badge-green",
    message: "You've been selected for this role. The school will reach out to complete your onboarding.",
  },
  REJECTED: {
    label: "Application update",
    badge: "badge-red",
    message: "Thank you for your interest. Unfortunately, the school has decided to move forward with other candidates for this role. Don't be discouraged — keep applying!",
  },
};

export async function sendStatusUpdate({
  teacherEmail,
  teacherName,
  jobTitle,
  schoolName,
  newStatus,
  jobId,
}: {
  teacherEmail: string;
  teacherName: string;
  jobTitle: string;
  schoolName: string;
  newStatus: string;
  jobId: string;
}) {
  const copy = STATUS_COPY[newStatus];
  if (!copy) return; // Don't send email for PENDING

  const jobUrl = `${BASE_URL}/jobs/${jobId}`;
  const html = emailWrapper(`
    <h1>${copy.label}</h1>
    <p>Hi ${teacherName},</p>
    <p>${copy.message}</p>
    <div style="background:#f4f4f0;border-radius:10px;padding:16px;margin:16px 0">
      <div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>
      <div class="detail-row"><span class="detail-label">School</span><span class="detail-value">${schoolName}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge ${copy.badge}">${newStatus}</span></span></div>
    </div>
    <a href="${BASE_URL}/dashboard/applications" class="btn">View All Applications</a>
  `);

  return resend.emails.send({
    from: FROM,
    to: teacherEmail,
    subject: `${copy.label} — ${jobTitle} at ${schoolName}`,
    html,
  });
}

// ── 4. New Application Alert (to School) ─────────────────────────────────────

export async function sendNewApplicationAlert({
  schoolEmail,
  schoolName,
  teacherName,
  jobTitle,
  jobId,
}: {
  schoolEmail: string;
  schoolName: string;
  teacherName: string;
  jobTitle: string;
  jobId: string;
}) {
  const applicantsUrl = `${BASE_URL}/dashboard/my-jobs/${jobId}/applicants`;
  const html = emailWrapper(`
    <h1>New application received</h1>
    <p>Hi ${schoolName},</p>
    <p><strong>${teacherName}</strong> has applied for your <strong>${jobTitle}</strong> position.</p>
    <a href="${applicantsUrl}" class="btn">Review Application</a>
    <p style="font-size:13px;color:#888780">Manage all applicants in your school dashboard.</p>
  `);

  return resend.emails.send({
    from: FROM,
    to: schoolEmail,
    subject: `New application for ${jobTitle}`,
    html,
  });
}

// ── 5. Contact Form Notification (to Admin) ──────────────────────────────────

export async function sendContactNotification({
  senderName,
  senderEmail,
  message,
}: {
  senderName: string;
  senderEmail: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@theeduhire.in";
  const html = emailWrapper(`
    <h1>New contact form submission</h1>
    <div style="background:#f4f4f0;border-radius:10px;padding:16px;margin:16px 0">
      <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${senderName}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${senderEmail}</span></div>
    </div>
    <p style="white-space:pre-wrap;background:#f4f4f0;border-radius:10px;padding:16px;font-size:14px">${message}</p>
  `);

  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Contact form: ${senderName}`,
    html,
  });
}

// ── 6. Job Alert Digest (to Teacher) ────────────────────────────────────────

export async function sendJobAlertDigest({
  teacherEmail,
  alertName,
  jobs,
  frequency,
}: {
  teacherEmail: string;
  alertName: string;
  jobs: Array<{ id: string; title: string; subject: string; schoolName: string; city: string; salaryMin?: number; salaryMax?: number; description: string }>;
  frequency: string;
}) {
  const manageAlertsUrl = `${BASE_URL}/dashboard/alerts`;

  const jobCards = jobs
    .map(
      (job) => `
    <div style="border:1px solid #e8e7e0;border-radius:10px;padding:16px;margin-bottom:12px">
      <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:600;color:#2a7a4e">${job.title}</h3>
      <div style="font-size:14px;color:#555;margin-bottom:8px"><strong>${job.schoolName}</strong> • ${job.city}</div>
      <div style="font-size:13px;color:#888780;margin-bottom:12px">
        ${job.subject}${job.salaryMin ? ` • ₹${job.salaryMin}-${job.salaryMax || job.salaryMin}` : ""}
      </div>
      <p style="font-size:13px;color:#444441;margin:8px 0">${job.description.substring(0, 150)}...</p>
      <a href="${BASE_URL}/jobs/${job.id}" style="color:#2a7a4e;font-weight:600;text-decoration:none;font-size:13px">View Details →</a>
    </div>
  `
    )
    .join("");

  const html = emailWrapper(`
    <h1>${jobs.length} new job${jobs.length !== 1 ? "s" : ""} for you</h1>
    <p>Hi,</p>
    <p>We found <strong>${jobs.length} new job${jobs.length !== 1 ? "s" : ""}</strong> matching your alert: <strong>${alertName}</strong></p>
    <div style="margin:24px 0">${jobCards}</div>
    <p style="font-size:13px;color:#888780">
      You're receiving this email because you have a ${frequency.toLowerCase()} alert for "${alertName}".
      <a href="${manageAlertsUrl}" style="color:#2a7a4e;text-decoration:none">Manage your alerts</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: teacherEmail,
    subject: `${jobs.length} new ${alertName} job${jobs.length !== 1 ? "s" : ""} posted`,
    html,
  });
}

// ── 7. Interview Invite (to Teacher) ─────────────────────────────────────────

export async function sendInterviewInvite({
  teacherEmail,
  teacherName,
  jobTitle,
  schoolName,
  scheduledAt,
  interviewType,
  meetingLink,
  location,
  icsData,
}: {
  teacherEmail: string;
  teacherName: string;
  jobTitle: string;
  schoolName: string;
  scheduledAt: Date;
  interviewType: string;
  meetingLink?: string | null;
  location?: string | null;
  icsData?: Buffer;
}) {
  const interviewsUrl = `${BASE_URL}/dashboard/interviews`;
  const dateStr = scheduledAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const locationStr = interviewType === "VIDEO" && meetingLink ? `<a href="${meetingLink}">${meetingLink}</a>` : location || interviewType;

  const html = emailWrapper(`
    <h1>Interview invitation</h1>
    <p>Hi ${teacherName},</p>
    <p><strong>${schoolName}</strong> has scheduled an interview with you for the <strong>${jobTitle}</strong> position.</p>
    <div style="background:#f4f4f0;border-radius:10px;padding:16px;margin:16px 0">
      <div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>
      <div class="detail-row"><span class="detail-label">School</span><span class="detail-value">${schoolName}</span></div>
      <div class="detail-row"><span class="detail-label">Date & Time</span><span class="detail-value">${dateStr} IST</span></div>
      <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${interviewType}</span></div>
      <div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${locationStr}</span></div>
    </div>
    <a href="${interviewsUrl}" class="btn">View Interview Details</a>
    <p style="font-size:13px;color:#888780">A calendar invite has been attached to this email. You can add it directly to your calendar (Gmail, Outlook, Apple Calendar, etc).</p>
  `);

  const attachments: Array<{ filename: string; content: string }> = [];
  if (icsData) {
    attachments.push({
      filename: "interview.ics",
      content: icsData.toString("base64"),
    });
  }

  return resend.emails.send({
    from: FROM,
    to: teacherEmail,
    subject: `Interview invitation — ${jobTitle} at ${schoolName}`,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}

// ── 8. Interview Confirmation (to School) ────────────────────────────────────

export async function sendInterviewConfirmation({
  schoolEmail,
  schoolName,
  teacherName,
  jobTitle,
  scheduledAt,
}: {
  schoolEmail: string;
  schoolName: string;
  teacherName: string;
  jobTitle: string;
  scheduledAt: Date;
}) {
  const dateStr = scheduledAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const html = emailWrapper(`
    <h1>Interview confirmed</h1>
    <p>Hi ${schoolName},</p>
    <p><strong>${teacherName}</strong> has confirmed the interview for the <strong>${jobTitle}</strong> position.</p>
    <div style="background:#f4f4f0;border-radius:10px;padding:16px;margin:16px 0">
      <div class="detail-row"><span class="detail-label">Candidate</span><span class="detail-value">${teacherName}</span></div>
      <div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>
      <div class="detail-row"><span class="detail-label">Scheduled for</span><span class="detail-value">${dateStr} IST</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge badge-green">Confirmed</span></span></div>
    </div>
    <p style="font-size:13px;color:#888780">Make sure you're prepared for the interview at the scheduled time.</p>
  `);

  return resend.emails.send({
    from: FROM,
    to: schoolEmail,
    subject: `Interview confirmed — ${teacherName} for ${jobTitle}`,
    html,
  });
}

// ── 9. Interview Cancellation (to Both) ──────────────────────────────────────

export async function sendInterviewCancellation({
  email,
  recipientName,
  candidateName,
  jobTitle,
  schoolName,
  reason,
}: {
  email: string;
  recipientName: string;
  candidateName: string;
  jobTitle: string;
  schoolName: string;
  reason?: string;
}) {
  const html = emailWrapper(`
    <h1>Interview cancelled</h1>
    <p>Hi ${recipientName},</p>
    <p>The scheduled interview for the <strong>${jobTitle}</strong> position at <strong>${schoolName}</strong> has been cancelled.</p>
    <div style="background:#f4f4f0;border-radius:10px;padding:16px;margin:16px 0">
      <div class="detail-row"><span class="detail-label">Candidate</span><span class="detail-value">${candidateName}</span></div>
      <div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>
      <div class="detail-row"><span class="detail-label">School</span><span class="detail-value">${schoolName}</span></div>
    </div>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    <p style="font-size:13px;color:#888780">If you have any questions, please contact the school directly.</p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Interview cancelled — ${jobTitle} at ${schoolName}`,
    html,
  });
}

// ── Generic fallback ─────────────────────────────────────────────────────────

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return resend.emails.send({ from: FROM, to, subject, html });
}
