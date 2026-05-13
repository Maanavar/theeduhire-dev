/* EduHire — Marketing homepage + Auth screens */

// ===================== MARKETING HOMEPAGE =====================
const MarketingHome = () => (
  <div style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--eh-surface)", color: "var(--eh-text)", fontFamily: "var(--eh-font-sans)" }}>
    {/* Top nav */}
    <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--eh-border)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", gap: 32 }}>
        <EduLogo/>
        <nav style={{ display: "flex", gap: 22, fontSize: 13.5, color: "var(--eh-text-2)" }}>
          {["Features", "For Schools", "For Teachers", "Pricing", "About", "Contact"].map(n => <a key={n} href="#" style={{ color: "inherit" }}>{n}</a>)}
        </nav>
        <div style={{ flex: 1 }}/>
        <a href="#" style={{ fontSize: 13.5, color: "var(--eh-text-2)" }}>Sign in</a>
        <button className="eh-btn eh-btn-secondary eh-btn-sm">Find teaching jobs</button>
        <button className="eh-btn eh-btn-primary eh-btn-sm">Post a job</button>
      </div>
    </header>

    {/* Hero */}
    <section className="eh-mesh" style={{ padding: "72px 32px 56px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 56, alignItems: "center" }}>
        <div>
          <span className="eh-badge eh-badge-primary" style={{ marginBottom: 18 }}><I.sparkle size={11}/> New · AI-assisted job posts</span>
          <h1 style={{ fontFamily: "var(--eh-font-display)", fontSize: 60, lineHeight: 1.04, letterSpacing: "-0.035em", fontWeight: 500, margin: 0 }}>
            Hire great teachers faster. <span style={{ color: "var(--eh-primary-700)" }}>Find the right school</span> with confidence.
          </h1>
          <p style={{ fontSize: 17, color: "var(--eh-text-2)", lineHeight: 1.55, marginTop: 22, maxWidth: 540 }}>
            EduHire connects schools with verified teachers — through job posts, applications, interview scheduling and a hiring workflow built specifically for education.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
            <button className="eh-btn eh-btn-primary" style={{ padding: "12px 22px", fontSize: 14.5 }}>Post a job — free <I.arrowRight size={15}/></button>
            <button className="eh-btn eh-btn-secondary" style={{ padding: "12px 22px", fontSize: 14.5 }}>Find teaching jobs</button>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 32, fontSize: 12.5, color: "var(--eh-text-3)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.shield size={13} stroke="var(--eh-success)"/> Verified schools</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.shield size={13} stroke="var(--eh-success)"/> 12,400+ teachers</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.shield size={13} stroke="var(--eh-success)"/> WCAG 2.2 AA</span>
          </div>
        </div>

        {/* Hero visual */}
        <div style={{ position: "relative" }}>
          <div className="eh-card" style={{ padding: 18, transform: "rotate(-1.2deg)", boxShadow: "var(--eh-shadow-xl)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 12, borderBottom: "1px solid var(--eh-border)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fb7185" }}/>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24" }}/>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399" }}/>
              <span style={{ fontSize: 11.5, color: "var(--eh-text-3)", marginLeft: 8 }}>School Admin Dashboard</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              {[
                ["Active jobs", "12", "var(--eh-primary-700)"],
                ["New applications", "47", "var(--eh-success)"],
                ["Shortlisted", "18", "var(--eh-info)"],
                ["Interviews this week", "6", "var(--eh-warning)"],
              ].map(([l, v, c]) => (
                <div key={l} style={{ padding: 12, background: "var(--eh-bg-soft)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--eh-text-3)" }}>{l}</div>
                  <div style={{ fontSize: 24, fontWeight: 500, fontFamily: "var(--eh-font-display)", letterSpacing: "-0.02em", color: c, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Pipeline</div>
              <div style={{ display: "flex", gap: 4, height: 24, borderRadius: 6, overflow: "hidden" }}>
                {[["#dbeafe", 30], ["#bfdbfe", 22], ["#93c5fd", 18], ["#60a5fa", 14], ["#3b82f6", 10], ["#1d4ed8", 6]].map(([c, w], i) => (
                  <div key={i} style={{ background: c, flex: w }}/>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--eh-text-3)", marginTop: 6 }}>
                <span>New 30</span><span>Reviewed 22</span><span>Shortlisted 18</span><span>Interview 14</span><span>Offer 10</span><span>Hired 6</span>
              </div>
            </div>
          </div>

          <div className="eh-card" style={{ padding: 14, position: "absolute", left: -20, bottom: -30, width: 240, transform: "rotate(2deg)", boxShadow: "var(--eh-shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name="Ananya Sharma" size="md"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>Ananya Sharma</div>
                <div style={{ fontSize: 10.5, color: "var(--eh-text-3)" }}>Math · 6 yrs</div>
              </div>
              <MatchMeter value={92} size={32}/>
            </div>
            <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--eh-success-bg)", borderRadius: 8, fontSize: 11, color: "var(--eh-success)", fontWeight: 600 }}>
              <I.check size={11} sw={2.5}/> Shortlisted
            </div>
          </div>

          <div className="eh-card" style={{ padding: 14, position: "absolute", right: -10, top: 40, width: 220, transform: "rotate(-3deg)", boxShadow: "var(--eh-shadow-lg)" }}>
            <div style={{ fontSize: 10.5, color: "var(--eh-text-3)" }}>Interview confirmed</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Tue 14 May, 4:30 PM</div>
            <div style={{ fontSize: 11, color: "var(--eh-text-3)", marginTop: 2 }}>Sr. Math · Google Meet</div>
            <button className="eh-btn eh-btn-primary eh-btn-sm" style={{ width: "100%", marginTop: 10, fontSize: 11 }}>Join meeting</button>
          </div>
        </div>
      </div>
    </section>

    {/* Logo bar */}
    <section style={{ padding: "32px 32px", borderTop: "1px solid var(--eh-border)", borderBottom: "1px solid var(--eh-border)", background: "var(--eh-bg-soft)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Trusted by 800+ schools across India</div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18, flexWrap: "wrap", gap: 24 }}>
          {SCHOOLS.slice(0, 6).map(s => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.8 }}>
              <SchoolLogo name={s.name} size={28}/>
              <span style={{ fontFamily: "var(--eh-font-display)", fontSize: 14, fontWeight: 500 }}>{s.short}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features grid */}
    <section style={{ padding: "80px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--eh-primary-700)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Platform</div>
          <h2 style={{ fontFamily: "var(--eh-font-display)", fontSize: 42, letterSpacing: "-0.025em", fontWeight: 500, margin: "8px 0 0", maxWidth: 700, marginInline: "auto" }}>
            Everything you need to hire teachers, end-to-end.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            ["Post teaching jobs", "Structured templates by subject and grade. AI-assisted descriptions.", I.briefcase],
            ["Manage applications", "Filter by subject, experience, board and match score.", I.users],
            ["Shortlist candidates", "Drag-and-drop pipeline from new to hired.", I.star],
            ["Schedule interviews", "Online or on-campus, with timezone-aware availability.", I.calendar],
            ["Verified teacher profiles", "Qualifications, experience, subjects, demo videos.", I.shield],
            ["Real-time notifications", "Never miss an application or message.", I.bell],
            ["Secure messaging", "Built-in chat with privacy guardrails.", I.msg],
            ["Analytics & reporting", "Hiring funnel, time-to-hire and source insights.", I.chart],
          ].map(([t, d, Ico], i) => (
            <div key={t} className="eh-card" style={{ padding: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--eh-primary-50)", color: "var(--eh-primary-700)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico size={18}/>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 14 }}>{t}</div>
              <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginTop: 6, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* For schools / for teachers split */}
    <section style={{ padding: "0 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="eh-card" style={{ padding: 36, background: "linear-gradient(160deg, var(--eh-primary-700), var(--eh-primary-900))", color: "white", borderColor: "transparent" }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>For schools</div>
          <h3 style={{ fontFamily: "var(--eh-font-display)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.025em", margin: "10px 0 12px" }}>Your next great teacher is one shortlist away.</h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9, margin: 0 }}>Post jobs, review applicants by match score, run interviews and send offers — all without juggling spreadsheets and emails.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            {["Post unlimited jobs across all subjects", "Filter by board, grade and experience", "Drag-and-drop pipeline & team collaboration", "Built-in interview scheduling and messaging"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}><I.check size={14} sw={2.5}/> {t}</div>
            ))}
          </div>
          <button className="eh-btn" style={{ marginTop: 24, background: "white", color: "var(--eh-primary-700)", padding: "10px 18px" }}>Start hiring <I.arrowRight size={14}/></button>
        </div>

        <div className="eh-card" style={{ padding: 36, background: "var(--eh-bg-soft)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--eh-primary-700)" }}>For teachers</div>
          <h3 style={{ fontFamily: "var(--eh-font-display)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.025em", margin: "10px 0 12px" }}>Build your teaching profile once. Apply faster everywhere.</h3>
          <p style={{ fontSize: 14, color: "var(--eh-text-2)", lineHeight: 1.6, margin: 0 }}>Discover full-time, part-time, substitute, online and hybrid roles at verified schools. One profile. One-click applications.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            {["Always free for teachers", "Smart match score on every job", "Track every application from applied to hired", "Direct messaging with school recruiters"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--eh-text-2)" }}><I.check size={14} sw={2.5} stroke="var(--eh-primary-700)"/> {t}</div>
            ))}
          </div>
          <button className="eh-btn eh-btn-primary" style={{ marginTop: 24, padding: "10px 18px" }}>Create your profile <I.arrowRight size={14}/></button>
        </div>
      </div>
    </section>

    {/* How it works */}
    <section style={{ padding: "0 32px 96px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--eh-primary-700)", textTransform: "uppercase", letterSpacing: "0.1em" }}>How it works</div>
          <h2 style={{ fontFamily: "var(--eh-font-display)", fontSize: 42, letterSpacing: "-0.025em", fontWeight: 500, margin: "8px 0 0" }}>From posting to hire, in five clear steps.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {[
            ["Create account", "School or teacher — get verified."],
            ["Post job or build profile", "Structured templates make this quick."],
            ["Apply or review", "Match scores cut through the noise."],
            ["Schedule interviews", "Online or on-campus, in any timezone."],
            ["Hire or accept offer", "Done. Add the next role."],
          ].map(([t, d], i) => (
            <div key={t} style={{ position: "relative" }}>
              <div style={{ fontFamily: "var(--eh-font-display)", fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: "var(--eh-primary-700)", lineHeight: 1 }}>0{i + 1}</div>
              <div style={{ height: 1, background: "var(--eh-border)", margin: "14px 0" }}/>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginTop: 6, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section style={{ padding: "80px 32px", background: "var(--eh-bg-soft)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontFamily: "var(--eh-font-display)", fontSize: 36, letterSpacing: "-0.025em", fontWeight: 500, margin: 0 }}>What schools and teachers are saying</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            ["“We filled four open math roles in 11 days. Match scores actually held up in interviews.”", "Meera Iyer", "Principal · Green Valley Public School"],
            ["“I built my profile once and applied to 14 jobs in a weekend. Got two interviews on Monday.”", "Ananya Sharma", "Mathematics Teacher"],
            ["“The pipeline view replaced our hiring spreadsheet entirely. Onboarding new HR took 20 minutes.”", "Vikram Rao", "HR Lead · Sunrise International Academy"],
          ].map(([q, name, org]) => (
            <div key={name} className="eh-card" style={{ padding: 28 }}>
              <div style={{ display: "flex", gap: 2, color: "var(--eh-warning)" }}>
                {[1,2,3,4,5].map(i => <I.star key={i} size={14} sw={0} fill="var(--eh-warning)"/>)}
              </div>
              <div style={{ fontFamily: "var(--eh-font-display)", fontSize: 19, lineHeight: 1.45, letterSpacing: "-0.01em", marginTop: 14, color: "var(--eh-text)" }}>{q}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
                <Avatar name={name} size="md"/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{org}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing preview */}
    <section style={{ padding: "80px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "var(--eh-font-display)", fontSize: 42, letterSpacing: "-0.025em", fontWeight: 500, margin: 0 }}>Simple pricing for every school</h2>
          <p style={{ fontSize: 14, color: "var(--eh-text-2)", marginTop: 10 }}>Teachers always free. Schools pay only when they're growing.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            ["Teacher", "Free", "forever", ["Unlimited applications", "Match scores", "Interview scheduling", "Direct messaging"], false],
            ["School Starter", "₹2,499", "/month", ["Up to 5 active jobs", "100 candidates / month", "Shared pipeline", "Email support"], false],
            ["School Pro", "₹6,999", "/month", ["Unlimited active jobs", "Unlimited candidates", "Team roles & audit log", "Priority support"], true],
            ["Enterprise", "Custom", "billed annually", ["Multi-campus admin", "SSO / SCIM", "Dedicated CSM", "Custom contracts"], false],
          ].map(([name, price, suffix, feats, highlight]) => (
            <div key={name} className="eh-card" style={{ padding: 24, position: "relative", borderColor: highlight ? "var(--eh-primary-600)" : "var(--eh-border)", boxShadow: highlight ? "0 0 0 3px var(--eh-primary-50)" : "var(--eh-shadow-xs)" }}>
              {highlight && <div style={{ position: "absolute", top: -10, left: 24, padding: "3px 10px", background: "var(--eh-primary-600)", color: "white", fontSize: 11, fontWeight: 600, borderRadius: 999 }}>Most popular</div>}
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--eh-primary-700)" }}>{name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                <span style={{ fontFamily: "var(--eh-font-display)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.025em" }}>{price}</span>
                <span style={{ fontSize: 12, color: "var(--eh-text-3)" }}>{suffix}</span>
              </div>
              <div className="eh-divider"/>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {feats.map(f => <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--eh-text-2)" }}><I.check size={13} sw={2.5} stroke="var(--eh-success)"/> {f}</div>)}
              </div>
              <button className={"eh-btn " + (highlight ? "eh-btn-primary" : "eh-btn-secondary")} style={{ width: "100%", marginTop: 22 }}>{name === "Teacher" ? "Sign up free" : name === "Enterprise" ? "Talk to us" : "Start free trial"}</button>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section style={{ padding: "0 32px 96px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--eh-font-display)", fontSize: 36, letterSpacing: "-0.025em", fontWeight: 500, margin: "0 0 24px", textAlign: "center" }}>Common questions</h2>
        {[
          ["Is EduHire really free for teachers?", "Yes — always. You can build a profile, apply to unlimited jobs, schedule interviews and message schools without ever paying a rupee."],
          ["How are schools verified?", "We confirm registration, board affiliation and a working contact at the school. Verified schools display a checkmark and can post unlimited jobs."],
          ["Can I import candidates from another ATS?", "Yes. School Pro and Enterprise plans include CSV import and a public API."],
          ["Do you support multi-campus school chains?", "Yes — Enterprise plans include multi-campus admin, SSO and a dedicated success manager."],
        ].map(([q, a], i) => (
          <details key={q} className="eh-card" style={{ padding: "18px 22px", marginBottom: 8 }} open={i === 0}>
            <summary style={{ fontSize: 15, fontWeight: 600, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
              {q}<span style={{ color: "var(--eh-text-3)", fontWeight: 400 }}>+</span>
            </summary>
            <p style={{ fontSize: 13.5, color: "var(--eh-text-2)", lineHeight: 1.6, margin: "10px 0 0" }}>{a}</p>
          </details>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section style={{ padding: "0 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="eh-card" style={{ padding: 56, textAlign: "center", background: "linear-gradient(140deg, var(--eh-primary-700) 0%, var(--eh-primary-900) 100%)", color: "white", borderColor: "transparent" }}>
          <h2 style={{ fontFamily: "var(--eh-font-display)", fontSize: 44, letterSpacing: "-0.03em", fontWeight: 500, margin: 0 }}>Ready to find your next great teacher?</h2>
          <p style={{ fontSize: 15, opacity: 0.85, marginTop: 12 }}>Join 800+ schools and 12,400+ teachers already on EduHire.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28 }}>
            <button className="eh-btn" style={{ background: "white", color: "var(--eh-primary-700)", padding: "12px 22px" }}>Post a job — free</button>
            <button className="eh-btn" style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "12px 22px", border: "1px solid rgba(255,255,255,0.3)" }}>Find teaching jobs</button>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer style={{ borderTop: "1px solid var(--eh-border)", padding: "40px 32px 24px", background: "var(--eh-bg-soft)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 32 }}>
        <div>
          <EduLogo/>
          <p style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginTop: 14, lineHeight: 1.6, maxWidth: 280 }}>The hiring platform built for schools and teachers. Made with care in Bengaluru.</p>
        </div>
        {[
          ["Product", ["Features", "Pricing", "For schools", "For teachers"]],
          ["Company", ["About", "Careers", "Press", "Contact"]],
          ["Resources", ["Blog", "Help center", "Guides", "API"]],
          ["Legal", ["Privacy", "Terms", "Security", "Cookies"]],
        ].map(([h, items]) => (
          <div key={h}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{h}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(i => <a key={i} href="#" style={{ fontSize: 12.5, color: "var(--eh-text-3)" }}>{i}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 18, borderTop: "1px solid var(--eh-border)", display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--eh-text-3)" }}>
        <span>© 2026 EduHire Technologies Pvt Ltd. All rights reserved.</span>
        <span>Bengaluru · Mumbai · Delhi</span>
      </div>
    </footer>
  </div>
);
window.MarketingHome = MarketingHome;

// ===================== AUTH: LOGIN =====================
const Login = () => (
  <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1.1fr", overflow: "hidden", background: "var(--eh-surface)" }}>
    <div style={{ padding: "60px 80px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 560 }}>
      <EduLogo/>
      <h1 style={{ fontFamily: "var(--eh-font-display)", fontSize: 36, letterSpacing: "-0.025em", fontWeight: 500, margin: "32px 0 8px" }}>Welcome back</h1>
      <p style={{ fontSize: 14, color: "var(--eh-text-3)", margin: 0 }}>Sign in to continue to EduHire.</p>

      <button className="eh-btn eh-btn-secondary" style={{ width: "100%", marginTop: 26, padding: "11px 14px", fontSize: 14, justifyContent: "center" }}>
        <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.5 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.3 5.3C41.9 35.5 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: "var(--eh-border)" }}/>
        <span style={{ fontSize: 11, color: "var(--eh-text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--eh-border)" }}/>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="eh-label">Email</label>
          <input type="email" className="eh-input" defaultValue="meera.iyer@greenvalley.edu.in"/>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="eh-label" style={{ marginBottom: 0 }}>Password</label>
            <a href="#" style={{ fontSize: 12, color: "var(--eh-primary-700)" }}>Forgot password?</a>
          </div>
          <input type="password" className="eh-input" defaultValue="••••••••••" style={{ marginTop: 6 }}/>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--eh-text-2)" }}>
          <input type="checkbox" defaultChecked/> Keep me signed in for 30 days
        </label>
      </div>

      <button className="eh-btn eh-btn-primary" style={{ width: "100%", marginTop: 18, padding: "11px 14px", fontSize: 14, justifyContent: "center" }}>Sign in <I.arrowRight size={14}/></button>

      <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--eh-bg-soft)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <I.shield size={14} stroke="var(--eh-success)"/>
        <div style={{ fontSize: 12, color: "var(--eh-text-3)", lineHeight: 1.5 }}>Your account is protected with secure authentication. We never reveal whether an email exists in our system.</div>
      </div>

      <p style={{ fontSize: 13.5, color: "var(--eh-text-3)", marginTop: 28, textAlign: "center" }}>
        New to EduHire? <a href="#" style={{ color: "var(--eh-primary-700)", fontWeight: 600 }}>Create an account</a>
      </p>
    </div>

    {/* Right side visual */}
    <div className="eh-mesh" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, position: "relative", overflow: "hidden", borderLeft: "1px solid var(--eh-border)" }}>
      <div style={{ maxWidth: 460 }}>
        <div className="eh-card" style={{ padding: 18, boxShadow: "var(--eh-shadow-xl)", transform: "rotate(-1deg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name="Ananya Sharma"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Ananya Sharma</div>
              <div style={{ fontSize: 11, color: "var(--eh-text-3)" }}>Math Teacher · 6 yrs · Bengaluru</div>
            </div>
            <MatchMeter value={92} size={36}/>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: "var(--eh-success-bg)", borderRadius: 10, fontSize: 12.5, color: "var(--eh-success)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <I.star size={13}/> Shortlisted for Sr. Math · Green Valley
          </div>
        </div>
        <div className="eh-card" style={{ padding: 18, marginTop: 18, marginLeft: 60, boxShadow: "var(--eh-shadow-xl)", transform: "rotate(1.5deg)" }}>
          <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>Interview confirmed</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Tue 14 May, 4:30 PM IST</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}><span className="eh-chip">Google Meet</span><span className="eh-chip">Sr. Math</span></div>
        </div>
        <div style={{ marginTop: 32, fontFamily: "var(--eh-font-display)", fontSize: 22, letterSpacing: "-0.015em", fontWeight: 500, lineHeight: 1.3, color: "var(--eh-text)", maxWidth: 380 }}>
          “Track every application from applied to hired — without juggling spreadsheets.”
        </div>
      </div>
    </div>
  </div>
);
window.Login = Login;

// ===================== AUTH: ROLE SELECT =====================
const SignupRoleSelect = () => (
  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--eh-bg-soft)" }}>
    <div style={{ height: 64, padding: "0 32px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--eh-border)", background: "var(--eh-surface)" }}>
      <EduLogo/>
      <div style={{ flex: 1 }}/>
      <span style={{ fontSize: 13, color: "var(--eh-text-3)" }}>Already have an account? <a href="#" style={{ color: "var(--eh-primary-700)", fontWeight: 600 }}>Sign in</a></span>
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <span className="eh-badge eh-badge-primary">Step 1 of 3 · Choose your role</span>
        <h1 style={{ fontFamily: "var(--eh-font-display)", fontSize: 38, letterSpacing: "-0.025em", fontWeight: 500, margin: "16px 0 10px" }}>Welcome to EduHire</h1>
        <p style={{ fontSize: 14.5, color: "var(--eh-text-3)", margin: 0 }}>Tell us who you are. You'll get a tailored experience from here.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 880, width: "100%" }}>
        {[
          { title: "I'm a School Admin", desc: "Post jobs, manage applications, schedule interviews and hire teachers.", Ico: I.briefcase, points: ["Post unlimited jobs", "Pipeline & interview tools", "Team roles & permissions"] },
          { title: "I'm a Teacher", desc: "Build a profile, discover schools, apply faster and track every application.", Ico: I.users, points: ["Free forever", "Match scores on every job", "One profile, many applications"] },
        ].map((c, i) => (
          <div key={c.title} className="eh-card" style={{ padding: 32, position: "relative", borderColor: i === 0 ? "var(--eh-primary-600)" : "var(--eh-border)", boxShadow: i === 0 ? "0 0 0 4px var(--eh-primary-50)" : "var(--eh-shadow-xs)", cursor: "pointer" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: i === 0 ? "var(--eh-primary-50)" : "var(--eh-bg-mute)", color: i === 0 ? "var(--eh-primary-700)" : "var(--eh-text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <c.Ico size={24}/>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: "18px 0 8px" }}>{c.title}</h2>
            <p style={{ fontSize: 13.5, color: "var(--eh-text-3)", margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
              {c.points.map(p => <div key={p} style={{ fontSize: 12.5, color: "var(--eh-text-2)", display: "flex", alignItems: "center", gap: 8 }}><I.check size={12} sw={2.5} stroke="var(--eh-success)"/> {p}</div>)}
            </div>
            <button className={"eh-btn " + (i === 0 ? "eh-btn-primary" : "eh-btn-secondary")} style={{ width: "100%", marginTop: 22 }}>Continue as {i === 0 ? "School Admin" : "Teacher"} <I.arrowRight size={14}/></button>
            {i === 0 && <span className="eh-badge eh-badge-primary" style={{ position: "absolute", top: 16, right: 16 }}>Selected</span>}
          </div>
        ))}
      </div>
    </div>
  </div>
);
window.SignupRoleSelect = SignupRoleSelect;

// ===================== AUTH: TEACHER SIGNUP =====================
const TeacherSignup = () => (
  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--eh-bg-soft)" }}>
    <div style={{ height: 64, padding: "0 32px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--eh-border)", background: "var(--eh-surface)" }}>
      <EduLogo/>
      <div style={{ flex: 1 }}/>
      <span style={{ fontSize: 13, color: "var(--eh-text-3)" }}>Step 2 of 3</span>
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 0" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="#" style={{ fontSize: 12.5, color: "var(--eh-text-3)" }}>← Choose a different role</a>
        <h1 style={{ fontFamily: "var(--eh-font-display)", fontSize: 30, letterSpacing: "-0.025em", fontWeight: 500, margin: "10px 0 6px" }}>Create your teacher account</h1>
        <p style={{ fontSize: 14, color: "var(--eh-text-3)", margin: 0 }}>Free, forever. Build your profile in under 5 minutes.</p>

        <div className="eh-card" style={{ padding: 28, marginTop: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label className="eh-label">Full name</label>
              <input className="eh-input" defaultValue="Ananya Sharma"/>
            </div>
            <div>
              <label className="eh-label">Email</label>
              <input className="eh-input" type="email" defaultValue="ananya.s@gmail.com"/>
            </div>
            <div>
              <label className="eh-label">Phone (optional)</label>
              <input className="eh-input" defaultValue="+91 98765 43210"/>
            </div>
            <div>
              <label className="eh-label">Years of experience</label>
              <select className="eh-select"><option>6 years</option></select>
            </div>
            <div>
              <label className="eh-label">Preferred job type</label>
              <select className="eh-select"><option>Full-time</option><option>Part-time</option><option>Substitute</option></select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="eh-label">Subjects you teach</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px", border: "1px solid var(--eh-border-strong)", borderRadius: 10, background: "var(--eh-surface)" }}>
                {["Mathematics", "Physics"].map(s => <span key={s} className="eh-chip eh-chip-active" style={{ padding: "4px 10px" }}>{s} <I.x size={11}/></span>)}
                <input style={{ border: 0, outline: 0, fontSize: 13, flex: 1, minWidth: 120 }} placeholder="Add more subjects…"/>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--eh-text-3)", marginTop: 6 }}>Try: Chemistry, Biology, English, Computer Science, Hindi, Sanskrit</div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="eh-label">Location preference</label>
              <input className="eh-input" defaultValue="Bengaluru, Karnataka"/>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="eh-label">Create a password</label>
              <input className="eh-input" type="password" defaultValue="••••••••••••"/>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 3 ? "var(--eh-success)" : "var(--eh-bg-mute)" }}/>)}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--eh-success)", marginTop: 6 }}><I.check size={11} sw={2.5}/> Strong password — well done.</div>
            </div>
          </div>
          <label style={{ display: "flex", gap: 10, marginTop: 18, fontSize: 12.5, color: "var(--eh-text-2)" }}>
            <input type="checkbox" defaultChecked style={{ marginTop: 3 }}/>
            <span>I agree to the <a href="#" style={{ color: "var(--eh-primary-700)" }}>Terms of Service</a> and <a href="#" style={{ color: "var(--eh-primary-700)" }}>Privacy Policy</a>. EduHire will email me about my applications and matching jobs.</span>
          </label>
          <button className="eh-btn eh-btn-primary" style={{ width: "100%", marginTop: 18, padding: "12px 16px" }}>Create account & verify email <I.arrowRight size={15}/></button>
        </div>

        <div style={{ marginTop: 16, padding: 14, background: "var(--eh-info-bg)", border: "1px solid var(--eh-info-border)", borderRadius: 10, display: "flex", gap: 10 }}>
          <I.shield size={14} stroke="var(--eh-info)"/>
          <div style={{ fontSize: 12, color: "var(--eh-text-2)", lineHeight: 1.5 }}>We'll send a 6-digit verification code to your email. Your contact details are never shown to schools without your consent.</div>
        </div>
      </div>
    </div>
  </div>
);
window.TeacherSignup = TeacherSignup;
