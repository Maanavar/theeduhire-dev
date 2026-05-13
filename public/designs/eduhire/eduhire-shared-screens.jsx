/* EduHire — Shared screens: Messages, Notifications, Settings, Errors */

// ===================== MESSAGES =====================
const Messages = ({ role = "school" }) => {
  const conv = role === "school" ? [
    { name: "Ananya Sharma", role: "Math Teacher", last: "Yes, Tuesday 4:30 works perfectly. Thank you!", time: "11:24", unread: false, active: true },
    { name: "Rahul Verma", role: "Physics Teacher", last: "Could we move to Wednesday afternoon?", time: "10:08", unread: 2 },
    { name: "Priya Nair", role: "English Teacher", last: "Sharing my demo lesson video — link inside.", time: "Yesterday" },
    { name: "Arjun Mehta", role: "Chemistry Teacher", last: "Thanks for considering my application.", time: "Mon" },
    { name: "Kavya Reddy", role: "Biology Teacher", last: "Looking forward to the interview.", time: "May 4" },
  ] : [
    { name: "Green Valley Public School", role: "Sr. Math posting", last: "Hi Ananya — would Tuesday 4:30 work for an interview?", time: "11:18", unread: 1, active: true },
    { name: "Sunrise International", role: "Mathematics IB", last: "We've shortlisted you. Sharing the next steps soon.", time: "10:42" },
    { name: "Bright Future High", role: "English (Sr. Sec.)", last: "Thank you for your application.", time: "Yesterday" },
    { name: "Lotus Heritage School", role: "Math Substitute", last: "We'll review and get back within 3 days.", time: "May 5" },
  ];
  const me = role === "school" ? "Meera" : "Ananya";
  const them = conv[0].name;

  const messages = role === "school" ? [
    { from: "them", text: "Hi Meera — just wanted to confirm: is the interview going to be on Google Meet?", t: "11:08" },
    { from: "me", text: "Yes! It'll be on Meet. I'll send the link a day before. Are you available Tuesday at 4:30 PM IST?", t: "11:18" },
    { from: "them", text: "Yes, Tuesday 4:30 works perfectly. Thank you!", t: "11:24" },
    { from: "system", text: "Interview invite sent · Tue 14 May, 4:30 PM · Google Meet" },
  ] : [
    { from: "them", text: "Hi Ananya — we'd love to invite you for an interview for the Sr. Math role. Would Tuesday 4:30 PM work?", t: "11:18" },
  ];

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar role={role} active="Messages"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role={role}/>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr 280px", overflow: "hidden" }}>
          {/* Inbox list */}
          <div style={{ borderRight: "1px solid var(--eh-border)", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: "16px 16px 12px" }}>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Messages</div>
              <div className="eh-search" style={{ marginTop: 10, minWidth: 0 }}>
                <I.search size={14}/>
                <input placeholder="Search conversations"/>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <span className="eh-chip eh-chip-active" style={{ fontSize: 11 }}>All</span>
                <span className="eh-chip" style={{ fontSize: 11 }}>Unread</span>
                <span className="eh-chip" style={{ fontSize: 11 }}>Interviews</span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {conv.map(c => (
                <div key={c.name} style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--eh-border)", background: c.active ? "var(--eh-primary-50)" : "transparent", borderLeft: c.active ? "3px solid var(--eh-primary-600)" : "3px solid transparent", cursor: "pointer" }}>
                  {role === "school" ? <Avatar name={c.name}/> : <SchoolLogo name={c.name} size={36}/>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: "var(--eh-text-3)" }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--eh-text-3)" }}>{c.role}</div>
                    <div style={{ fontSize: 12.5, color: c.unread ? "var(--eh-text)" : "var(--eh-text-3)", fontWeight: c.unread ? 500 : 400, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last}</div>
                  </div>
                  {c.unread > 0 && <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--eh-primary-600)", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.unread}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--eh-border)", display: "flex", alignItems: "center", gap: 12 }}>
              {role === "school" ? <Avatar name={them}/> : <SchoolLogo name={them} size={36}/>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{them}</div>
                <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{conv[0].role} · Active 5m ago</div>
              </div>
              <button className="eh-icon-btn"><I.video size={16}/></button>
              <button className="eh-icon-btn"><I.calendar size={16}/></button>
              <button className="eh-icon-btn"><I.more size={16}/></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", background: "var(--eh-bg-soft)" }}>
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--eh-text-3)", margin: "8px 0 16px" }}>Today</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((m, i) => {
                  if (m.from === "system") return (
                    <div key={i} style={{ alignSelf: "center", padding: "8px 14px", background: "var(--eh-success-bg)", color: "var(--eh-success)", border: "1px solid var(--eh-success-border)", borderRadius: 999, fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <I.calendar size={12}/> {m.text}
                    </div>
                  );
                  const mine = m.from === "me";
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: 460, padding: "10px 14px", background: mine ? "var(--eh-primary-600)" : "var(--eh-surface)", color: mine ? "white" : "var(--eh-text)", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", border: mine ? "none" : "1px solid var(--eh-border)", fontSize: 13.5, lineHeight: 1.5, boxShadow: "var(--eh-shadow-xs)" }}>
                        {m.text}
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: "right" }}>{m.t}{mine && " · seen"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--eh-border)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span className="eh-chip" style={{ cursor: "pointer" }}><I.calendar size={11}/> Send interview slot</span>
                <span className="eh-chip" style={{ cursor: "pointer" }}><I.doc size={11}/> Use template</span>
                <span className="eh-chip" style={{ cursor: "pointer" }}><I.sparkle size={11}/> Polish with AI</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "8px 8px 8px 14px", border: "1px solid var(--eh-border-strong)", borderRadius: 14, background: "var(--eh-surface)" }}>
                <textarea placeholder="Write a message…" rows={2} style={{ flex: 1, border: 0, outline: 0, fontSize: 13.5, resize: "none", background: "transparent", lineHeight: 1.5, fontFamily: "inherit" }} defaultValue=""/>
                <button className="eh-icon-btn"><I.paperclip size={16}/></button>
                <button className="eh-btn eh-btn-primary eh-btn-sm"><I.send size={13}/></button>
              </div>
              <div style={{ fontSize: 11, color: "var(--eh-text-3)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <I.shield size={11}/> Don't share private contact details until the candidate is shortlisted.
              </div>
            </div>
          </div>

          {/* Right rail: candidate context */}
          <div style={{ borderLeft: "1px solid var(--eh-border)", padding: 20, overflowY: "auto" }}>
            {role === "school" ? (
              <>
                <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "1px solid var(--eh-border)" }}>
                  <Avatar name={them} size="xl" className=""/>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>{them}</div>
                  <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>Mathematics · 6 yrs · Bengaluru</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
                    <button className="eh-btn eh-btn-secondary eh-btn-sm">Profile</button>
                    <button className="eh-btn eh-btn-primary eh-btn-sm">Shortlist</button>
                  </div>
                </div>
                <div style={{ paddingTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Application</div>
                  <div style={{ fontSize: 12.5, color: "var(--eh-text-2)" }}>Sr. Mathematics Teacher · Applied May 8</div>
                  <StatusPill status="Interview"/>
                </div>
                <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid var(--eh-border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Internal notes</div>
                  <textarea className="eh-textarea" defaultValue="Strong CBSE Sr.Sec. background. Demo lesson on calculus was excellent." style={{ fontSize: 13, minHeight: 80 }}/>
                  <div style={{ fontSize: 10.5, color: "var(--eh-text-3)", marginTop: 6 }}>Visible only to your team.</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "1px solid var(--eh-border)" }}>
                  <SchoolLogo name={them} size={64}/>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>{them}</div>
                  <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>CBSE · Bengaluru, KA</div>
                  <button className="eh-btn eh-btn-secondary eh-btn-sm" style={{ marginTop: 12 }}>Open job posting</button>
                </div>
                <div style={{ paddingTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Your application</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Sr. Mathematics Teacher</div>
                  <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>Applied May 8 · Interview pending</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
window.Messages = Messages;

// ===================== NOTIFICATIONS =====================
const Notifications = ({ role = "teacher" }) => {
  const items = role === "teacher" ? [
    { kind: "shortlist", title: "You've been shortlisted", who: "Bright Future High School", desc: "for English Literature Teacher · expect a message soon.", t: "3h", unread: true },
    { kind: "interview", title: "Interview invite", who: "Green Valley Public School", desc: "Tue 14 May, 4:30 PM · Google Meet · Sr. Math role.", t: "5h", unread: true },
    { kind: "msg", title: "New message", who: "Sunrise International", desc: "We're sharing the next steps for the IB Math posting.", t: "Today", unread: false },
    { kind: "view", title: "Profile viewed", who: "Lotus Heritage School", desc: "looked at your profile after your application.", t: "Yesterday" },
    { kind: "deadline", title: "Application deadline", who: "Ashoka Global", desc: "Coding & Math Lead closes in 2 days.", t: "Mon" },
    { kind: "tip", title: "Profile tip", who: "EduHire", desc: "Add your portfolio to reach 100% completion.", t: "Sun" },
  ] : [
    { kind: "apply", title: "12 new applications", who: "Sr. Mathematics Teacher", desc: "since you last reviewed this posting.", t: "1h", unread: true },
    { kind: "msg", title: "Ananya Sharma replied", who: "Sr. Math · Interview", desc: "“Yes, Tuesday 4:30 works perfectly. Thank you!”", t: "11:24", unread: true },
    { kind: "interview", title: "Interview tomorrow", who: "Rahul Verma", desc: "Physics IB · Wed 11:00 AM · On-campus.", t: "Today" },
    { kind: "team", title: "Rohit joined your team", who: "Recruiter role", desc: "added by Meera Iyer.", t: "Yesterday" },
  ];
  const ICONS = {
    shortlist: { Ico: I.star, bg: "var(--eh-primary-50)", fg: "var(--eh-primary-700)" },
    interview: { Ico: I.calendar, bg: "var(--eh-warning-bg)", fg: "var(--eh-warning)" },
    msg: { Ico: I.msg, bg: "var(--eh-info-bg)", fg: "var(--eh-info)" },
    view: { Ico: I.eye, bg: "var(--eh-bg-mute)", fg: "var(--eh-text-2)" },
    deadline: { Ico: I.clock, bg: "var(--eh-danger-bg)", fg: "var(--eh-danger)" },
    tip: { Ico: I.sparkle, bg: "var(--eh-success-bg)", fg: "var(--eh-success)" },
    apply: { Ico: I.users, bg: "var(--eh-primary-50)", fg: "var(--eh-primary-700)" },
    team: { Ico: I.team, bg: "var(--eh-info-bg)", fg: "var(--eh-info)" },
  };

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar role={role} active="Home"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role={role}/>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
              <div>
                <h1 className="eh-page-title">Notifications</h1>
                <p className="eh-page-subtitle">{items.filter(i => i.unread).length} unread · we'll keep this clean.</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="eh-btn eh-btn-secondary eh-btn-sm">Mark all as read</button>
                <button className="eh-btn eh-btn-ghost eh-btn-sm">Notification settings</button>
              </div>
            </div>

            <div className="eh-tabs" style={{ marginBottom: 14 }}>
              {["All", "Applications", "Interviews", "Messages", "System"].map((t, i) => (
                <button key={t} className={"eh-tab " + (i === 0 ? "eh-tab-active" : "")}>{t}</button>
              ))}
            </div>

            <div className="eh-card" style={{ padding: 0, overflow: "hidden" }}>
              {items.map((n, i) => {
                const cfg = ICONS[n.kind];
                return (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "16px 18px", borderTop: i ? "1px solid var(--eh-border)" : "none", background: n.unread ? "var(--eh-primary-50)" : "transparent" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, color: cfg.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <cfg.Ico size={17}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</span>
                        {n.unread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--eh-primary-600)" }}/>}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--eh-text-2)", marginTop: 3 }}>
                        <strong style={{ color: "var(--eh-text)" }}>{n.who}</strong> {n.desc}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--eh-text-3)", marginTop: 6 }}>{n.t}</div>
                    </div>
                    <button className="eh-btn eh-btn-ghost eh-btn-sm">View</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Notifications = Notifications;

// ===================== SETTINGS / SECURITY =====================
const Settings = ({ role = "teacher" }) => (
  <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
    <Sidebar role={role} active="Settings"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Topbar role={role}/>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 28, maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <h1 className="eh-page-title" style={{ fontSize: 22 }}>Settings</h1>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 18 }}>
              {[
                ["Account", "Profile, email, phone"],
                ["Security", "Password, 2FA, sessions"],
                ["Notifications", "Email, push, weekly digest"],
                ["Privacy", "Profile visibility & contact"],
                ["Billing", "Plans, invoices"],
                ["Danger zone", "Deactivate, delete account"],
              ].map(([t, sub], i) => (
                <a key={t} href="#" style={{ display: "block", padding: "10px 12px", borderRadius: 10, background: i === 1 ? "var(--eh-primary-50)" : "transparent", color: i === 1 ? "var(--eh-primary-700)" : "var(--eh-text-2)" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.8 }}>{sub}</div>
                </a>
              ))}
            </nav>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Security status banner */}
            <div className="eh-card" style={{ padding: 22, display: "flex", gap: 16, alignItems: "center", background: "linear-gradient(120deg, #ecfdf5, var(--eh-surface) 60%)", borderColor: "var(--eh-success-border)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--eh-success)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><I.shield size={22}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Account security: Strong</div>
                <div style={{ fontSize: 13, color: "var(--eh-text-2)", marginTop: 2 }}>Email verified · Strong password · 2FA pending. Enable 2FA for the strongest security.</div>
              </div>
              <button className="eh-btn eh-btn-primary eh-btn-sm">Enable 2FA</button>
            </div>

            <div className="eh-card" style={{ padding: 24 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>Password</h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--eh-text-3)" }}>Last changed 28 days ago.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
                <div style={{ gridColumn: "span 2" }}><label className="eh-label">Current password</label><input type="password" className="eh-input" defaultValue="••••••••••"/></div>
                <div><label className="eh-label">New password</label><input type="password" className="eh-input"/></div>
                <div><label className="eh-label">Confirm new password</label><input type="password" className="eh-input"/></div>
              </div>
              <button className="eh-btn eh-btn-primary" style={{ marginTop: 16 }}>Update password</button>
            </div>

            <div className="eh-card" style={{ padding: 24 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600 }}>Two-factor authentication</h2>
              {[
                ["Authenticator app", "Use Google Authenticator, 1Password, Authy.", false, "Set up"],
                ["SMS to +91 98765 43210", "Backup method only — not recommended as primary.", false, "Add"],
                ["Recovery codes", "Save these securely. Used if you lose your device.", true, "Regenerate"],
              ].map(([t, d, on, cta]) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: t.startsWith("Authenticator") ? "none" : "1px solid var(--eh-border)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      {t} {on && <span className="eh-badge eh-badge-success">Enabled</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginTop: 2 }}>{d}</div>
                  </div>
                  <button className={"eh-btn " + (on ? "eh-btn-secondary eh-btn-sm" : "eh-btn-primary eh-btn-sm")}>{cta}</button>
                </div>
              ))}
            </div>

            <div className="eh-card" style={{ padding: 24 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>Active sessions</h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--eh-text-3)" }}>Devices currently signed into your account.</p>
              <div style={{ marginTop: 14 }}>
                {[
                  ["MacBook Air · Chrome · Bengaluru, IN", "This device · Active now", true],
                  ["iPhone 15 · iOS app · Bengaluru, IN", "Last active 2h ago", false],
                  ["Windows · Edge · Mumbai, IN", "Last active 3 days ago", false],
                ].map(([d, w, current], i) => (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--eh-border)" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--eh-bg-mute)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--eh-text-3)" }}>
                      <I.shield size={16}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{d}</div>
                      <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{w}</div>
                    </div>
                    {current
                      ? <span className="eh-badge eh-badge-success">Current</span>
                      : <button className="eh-btn eh-btn-secondary eh-btn-sm">Sign out</button>}
                  </div>
                ))}
              </div>
              <button className="eh-btn eh-btn-danger" style={{ marginTop: 12 }}>Sign out of all other devices</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.Settings = Settings;

// ===================== ERROR / EMPTY STATES =====================
const ErrorStates = () => {
  const Card = ({ children, title }) => (
    <div className="eh-card" style={{ padding: 0, overflow: "hidden", height: 380, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 16px", background: "var(--eh-bg-soft)", borderBottom: "1px solid var(--eh-border)", fontSize: 11.5, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 14 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", overflow: "auto", padding: 24, background: "var(--eh-bg-soft)" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 className="eh-page-title">System & empty states</h1>
        <p className="eh-page-subtitle">Friendly fallbacks across the product. Microcopy is human, never blame-y.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Card title="404 — Page not found">
          <div style={{ fontFamily: "var(--eh-font-display)", fontSize: 64, fontWeight: 500, letterSpacing: "-0.04em", color: "var(--eh-primary-700)" }}>404</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>This page took an early summer break</div>
          <div style={{ fontSize: 13, color: "var(--eh-text-3)", maxWidth: 280 }}>The link you followed isn't here. Let's get you back on track.</div>
          <div style={{ display: "flex", gap: 8 }}><button className="eh-btn eh-btn-secondary eh-btn-sm">Go back</button><button className="eh-btn eh-btn-primary eh-btn-sm">Home</button></div>
        </Card>

        <Card title="500 — Something broke">
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--eh-danger-bg)", color: "var(--eh-danger)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x size={28} sw={2.5}/></div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>That's on us, not you</div>
          <div style={{ fontSize: 13, color: "var(--eh-text-3)", maxWidth: 280 }}>Our team's been notified. Try again in a moment.</div>
          <button className="eh-btn eh-btn-primary eh-btn-sm">Reload</button>
          <div style={{ fontSize: 11, color: "var(--eh-text-4)", fontFamily: "var(--eh-font-mono)" }}>Reference: ERR_8F2A19</div>
        </Card>

        <Card title="Offline">
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--eh-bg-mute)", color: "var(--eh-text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.globe size={28}/></div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>You're offline</div>
          <div style={{ fontSize: 13, color: "var(--eh-text-3)", maxWidth: 280 }}>We'll re-sync your saved drafts as soon as you're back online.</div>
        </Card>

        <Card title="Empty: No applications yet">
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--eh-primary-50)", color: "var(--eh-primary-700)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.doc size={26}/></div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No applications yet</div>
          <div style={{ fontSize: 13, color: "var(--eh-text-3)", maxWidth: 280 }}>Once teachers apply to your jobs, they'll show up here. Need more visibility?</div>
          <button className="eh-btn eh-btn-primary eh-btn-sm">Boost this job</button>
        </Card>

        <Card title="Empty search">
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--eh-bg-mute)", color: "var(--eh-text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.search size={26}/></div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No matches in your area</div>
          <div style={{ fontSize: 13, color: "var(--eh-text-3)", maxWidth: 280 }}>Try removing filters or expanding the location radius.</div>
          <button className="eh-btn eh-btn-secondary eh-btn-sm">Clear filters</button>
        </Card>

        <Card title="Loading skeleton">
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ display: "flex", gap: 10, padding: 12, border: "1px solid var(--eh-border)", borderRadius: 12 }}>
                <div className="eh-skel" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--eh-bg-mute)" }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ width: "60%", height: 11, background: "var(--eh-bg-mute)", borderRadius: 4 }}/>
                  <div style={{ width: "40%", height: 9, background: "var(--eh-bg-mute)", borderRadius: 4, marginTop: 6 }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Permission denied">
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--eh-warning-bg)", color: "var(--eh-warning)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.shield size={26}/></div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>You don't have access</div>
          <div style={{ fontSize: 13, color: "var(--eh-text-3)", maxWidth: 280 }}>Ask your school owner to grant you Recruiter or Admin role.</div>
          <button className="eh-btn eh-btn-secondary eh-btn-sm">Request access</button>
        </Card>

        <Card title="Form validation">
          <div style={{ width: "100%", maxWidth: 280, textAlign: "left" }}>
            <label className="eh-label">Work email</label>
            <input className="eh-input" defaultValue="meera@gmail" style={{ borderColor: "var(--eh-danger)", boxShadow: "0 0 0 4px var(--eh-danger-bg)" }}/>
            <div style={{ fontSize: 12, color: "var(--eh-danger)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}><I.x size={11} sw={3}/> Use a valid email format like name@school.edu</div>
          </div>
        </Card>

        <Card title="Success confirmation">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--eh-success)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><I.check size={28} sw={2.5}/></div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Application submitted</div>
          <div style={{ fontSize: 13, color: "var(--eh-text-3)", maxWidth: 280 }}>Green Valley will review and reach out within 5 days. We'll notify you here.</div>
          <button className="eh-btn eh-btn-primary eh-btn-sm">Track application</button>
        </Card>
      </div>
    </div>
  );
};
window.ErrorStates = ErrorStates;
