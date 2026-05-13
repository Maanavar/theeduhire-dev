/* EduHire — School Admin screens */

const SchoolDashboard = () => {
  const stats = [
    ["Active jobs", "6", "+2 this week", "up"],
    ["New applications", "47", "+18 today", "up"],
    ["Shortlisted", "18", "+3 this week", "up"],
    ["Interviews scheduled", "9", "Next: Tue 4:30 PM", null],
    ["Offers sent", "4", "2 awaiting response", null],
    ["Hired this month", "3", "+1 vs last month", "up"],
  ];

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: "var(--eh-bg)" }}>
      <Sidebar role="school" active="Dashboard"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role="school"/>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <h1 className="eh-page-title">Good morning, Meera</h1>
              <p className="eh-page-subtitle">3 new applications since you last checked. Your next interview is in 2 hours.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="eh-btn eh-btn-secondary"><I.calendar size={15}/> Schedule interview</button>
              <button className="eh-btn eh-btn-primary"><I.plus size={15}/> Post a job</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
            {stats.map(([l, v, d, dir]) => (
              <div key={l} className="eh-stat">
                <div className="eh-stat-label">{l}</div>
                <div className="eh-stat-value">{v}</div>
                <div className={"eh-stat-delta " + (dir === "up" ? "eh-stat-delta-up" : "")}>
                  {dir === "up" && <I.arrowUp size={12} sw={2.5}/>}{d}
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline + upcoming */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 22 }}>
            <div className="eh-card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Application pipeline</h3>
                  <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginTop: 2 }}>Across 6 active jobs</div>
                </div>
                <button className="eh-btn eh-btn-ghost eh-btn-sm">View all <I.arrowRight size={13}/></button>
              </div>
              {/* Funnel bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["New", 47, "var(--eh-info)"],
                  ["Reviewed", 28, "#94a3b8"],
                  ["Shortlisted", 18, "var(--eh-primary-600)"],
                  ["Interview", 12, "var(--eh-warning)"],
                  ["Offer", 4, "var(--eh-success)"],
                  ["Hired this month", 3, "#15803d"],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 130, fontSize: 13, color: "var(--eh-text-2)", fontWeight: 500 }}>{label}</div>
                    <div style={{ flex: 1, height: 24, background: "var(--eh-bg-mute)", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ width: `${(val / 47) * 100}%`, height: "100%", background: color, display: "flex", alignItems: "center", paddingLeft: 10, color: "white", fontSize: 11, fontWeight: 600 }}>
                        {val}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="eh-card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Upcoming interviews</h3>
                <button className="eh-btn eh-btn-ghost eh-btn-sm">All</button>
              </div>
              {[
                { who: "Ananya Sharma", role: "Sr. Mathematics", when: "Tue · 4:30 PM", mode: "Online", panel: "Meera, Rohit" },
                { who: "Rahul Verma", role: "Physics (IB)", when: "Wed · 11:00 AM", mode: "On-campus", panel: "Anita" },
                { who: "Priya Nair", role: "English Lit.", when: "Thu · 2:00 PM", mode: "Online", panel: "Meera" },
              ].map(iv => (
                <div key={iv.who} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: "1px solid var(--eh-border)" }}>
                  <Avatar name={iv.who}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{iv.who}</div>
                    <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>{iv.role} · {iv.when}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <span className="eh-chip" style={{ fontSize: 11, padding: "2px 8px" }}>{iv.mode === "Online" ? <I.video size={11}/> : <I.mapPin size={11}/>} {iv.mode}</span>
                      <span className="eh-chip" style={{ fontSize: 11, padding: "2px 8px" }}>Panel: {iv.panel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent applications + recommended */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 16 }}>
            <div className="eh-card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent applications</h3>
                <button className="eh-btn eh-btn-ghost eh-btn-sm">Open inbox <I.arrowRight size={13}/></button>
              </div>
              {TEACHERS.slice(0, 4).map((t, i) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i ? "1px solid var(--eh-border)" : "none" }}>
                  <Avatar name={t.name}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>Applied to {JOBS[i % JOBS.length].title} · {t.years}y · {t.city}</div>
                  </div>
                  <MatchMeter value={t.match} size={32}/>
                  <StatusPill status={["New","Reviewed","Shortlisted","New"][i]}/>
                  <button className="eh-btn eh-btn-secondary eh-btn-sm">Review</button>
                </div>
              ))}
            </div>

            <div className="eh-card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recommended teachers</h3>
                <span className="eh-badge eh-badge-primary" style={{ textTransform: "none" }}>AI matched</span>
              </div>
              {TEACHERS.slice(2, 5).map((t, i) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--eh-border)" : "none" }}>
                  <Avatar name={t.name} size="sm"/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{t.subject} · {t.years}y · {t.city}</div>
                  </div>
                  <button className="eh-btn eh-btn-ghost eh-btn-sm" style={{ padding: "5px 10px" }}>Invite</button>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: 12, background: "var(--eh-primary-50)", borderRadius: 10, fontSize: 12, color: "var(--eh-primary-700)" }}>
                <I.sparkle size={13}/> 12 more teachers match your active jobs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.SchoolDashboard = SchoolDashboard;

// ===================== JOBS LIST =====================
const SchoolJobs = () => (
  <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
    <Sidebar role="school" active="Jobs"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Topbar role="school"/>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <h1 className="eh-page-title">Jobs</h1>
            <p className="eh-page-subtitle">Manage all teaching positions at Green Valley Public School.</p>
          </div>
          <button className="eh-btn eh-btn-primary"><I.plus size={15}/> Post a job</button>
        </div>

        <div className="eh-tabs" style={{ marginBottom: 16 }}>
          {[["Active", 6], ["Drafts", 2], ["Closed", 14], ["Archived", 8]].map(([t, n], i) => (
            <button key={t} className={"eh-tab " + (i === 0 ? "eh-tab-active" : "")}>{t} <span style={{ marginLeft: 4, fontSize: 11, color: "var(--eh-text-4)" }}>{n}</span></button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <div className="eh-search" style={{ minWidth: 320 }}>
            <I.search size={14}/>
            <input placeholder="Search by title, subject…"/>
          </div>
          <button className="eh-btn eh-btn-secondary eh-btn-sm"><I.filter size={13}/> All subjects</button>
          <button className="eh-btn eh-btn-secondary eh-btn-sm"><I.filter size={13}/> All types</button>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 13, color: "var(--eh-text-3)" }}>Sort: <strong style={{ color: "var(--eh-text)" }}>Newest first</strong></span>
        </div>

        <div className="eh-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr", padding: "12px 20px", background: "var(--eh-bg-soft)", borderBottom: "1px solid var(--eh-border)", fontSize: 11.5, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <div>Job</div><div>Subject</div><div>Type</div><div>Posted</div><div>Applicants</div><div>Status</div><div></div>
          </div>
          {JOBS.map(j => (
            <div key={j.id} style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr", padding: "16px 20px", borderBottom: "1px solid var(--eh-border)", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{j.title}</div>
                <div style={{ fontSize: 12, color: "var(--eh-text-3)", marginTop: 3 }}>{j.grade} · {j.mode} · Closes {j.deadline}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--eh-text-2)" }}>{j.subject}</div>
              <div style={{ fontSize: 13, color: "var(--eh-text-2)" }}>{j.type}</div>
              <div style={{ fontSize: 13, color: "var(--eh-text-2)" }}>{j.posted}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--eh-font-display)" }}>{j.applicants}</span>
                <span style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{j.shortlisted} shortlisted</span>
              </div>
              <div><StatusPill status="Active"/></div>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                <button className="eh-icon-btn"><I.eye size={15}/></button>
                <button className="eh-icon-btn"><I.more size={15}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
window.SchoolJobs = SchoolJobs;

// ===================== POST JOB =====================
const PostJob = () => (
  <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
    <Sidebar role="school" active="Jobs"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Topbar role="school"/>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", background: "var(--eh-bg-soft)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginBottom: 4 }}>Jobs · New posting</div>
            <h1 className="eh-page-title">Senior Mathematics Teacher</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="eh-btn eh-btn-ghost">Save draft</button>
            <button className="eh-btn eh-btn-secondary"><I.eye size={15}/> Preview</button>
            <button className="eh-btn eh-btn-primary">Publish job</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="eh-card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Basics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "span 2" }}><label className="eh-label">Job title</label><input className="eh-input" defaultValue="Senior Mathematics Teacher"/></div>
                <div><label className="eh-label">Subject</label><select className="eh-select"><option>Mathematics</option></select></div>
                <div><label className="eh-label">Grade / class level</label><select className="eh-select"><option>Class 11–12 (Sr. Secondary)</option></select></div>
                <div><label className="eh-label">Job type</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["Full-time", "Part-time", "Substitute", "Online", "Hybrid"].map((t, i) => (
                      <span key={t} className={"eh-chip " + (i === 0 ? "eh-chip-active" : "eh-chip-outline")}>{t}</span>
                    ))}
                  </div>
                </div>
                <div><label className="eh-label">Interview mode</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="eh-chip eh-chip-active">Online</span>
                    <span className="eh-chip eh-chip-outline">In-person</span>
                  </div>
                </div>
                <div><label className="eh-label">Location</label><input className="eh-input" defaultValue="Bengaluru, Karnataka"/></div>
                <div><label className="eh-label">Salary range (optional)</label><input className="eh-input" defaultValue="₹6.5 – 9.5 LPA"/></div>
              </div>
            </div>

            <div className="eh-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Job description</h3>
                <button className="eh-btn eh-btn-secondary eh-btn-sm" style={{ background: "var(--eh-primary-50)", borderColor: "var(--eh-primary-100)", color: "var(--eh-primary-700)" }}>
                  <I.sparkle size={13}/> Improve with AI
                </button>
              </div>
              <textarea className="eh-textarea" style={{ minHeight: 140 }} defaultValue={"Green Valley Public School is hiring an experienced Mathematics teacher for Classes 11 and 12 (CBSE). The role includes preparing students for board examinations and competitive entrances, with active mentorship and curriculum design responsibilities."}/>
              <label className="eh-label" style={{ marginTop: 14 }}>Responsibilities</label>
              <textarea className="eh-textarea" defaultValue={"• Plan and deliver Math lessons aligned with CBSE syllabus\n• Mentor students for JEE/board exams\n• Collaborate with the Mathematics department"}/>
              <label className="eh-label" style={{ marginTop: 14 }}>Required qualifications & experience</label>
              <input className="eh-input" defaultValue="M.Sc. Mathematics + B.Ed. preferred · Minimum 4 years experience"/>
            </div>

            <div className="eh-card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Screening questions</h3>
              {["Have you taught CBSE Class 12 Mathematics?", "Are you available to start before July 2026?"].map((q, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--eh-border)", borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--eh-text-4)", fontWeight: 600 }}>0{i+1}</span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{q}</span>
                  <span className="eh-chip">Yes / No</span>
                  <button className="eh-icon-btn"><I.x size={14}/></button>
                </div>
              ))}
              <button className="eh-btn eh-btn-secondary eh-btn-sm"><I.plus size={13}/> Add screening question</button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="eh-card" style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>Posting checklist</h4>
              {[
                ["Title & basics", true],
                ["Description", true],
                ["Salary set", true],
                ["Screening questions", false],
                ["Required documents", false],
              ].map(([t, done]) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 13 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: done ? "0" : "1.5px solid var(--eh-border-strong)", background: done ? "var(--eh-success)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                    {done && <I.check size={11} sw={3}/>}
                  </span>
                  <span style={{ color: done ? "var(--eh-text)" : "var(--eh-text-3)", textDecoration: done ? "line-through" : "none" }}>{t}</span>
                </div>
              ))}
              <div className="eh-progress" style={{ marginTop: 12 }}><div className="eh-progress-bar" style={{ width: "60%" }}/></div>
              <div style={{ fontSize: 11.5, color: "var(--eh-text-3)", marginTop: 8 }}>3 of 5 complete</div>
            </div>
            <div className="eh-card" style={{ padding: 20, background: "var(--eh-primary-50)", borderColor: "var(--eh-primary-100)" }}>
              <I.sparkle size={16} stroke="var(--eh-primary-700)"/>
              <h4 style={{ margin: "8px 0 6px", fontSize: 13.5, color: "var(--eh-primary-900)" }}>Tip: list specific boards</h4>
              <p style={{ fontSize: 12.5, color: "var(--eh-primary-700)", lineHeight: 1.5, margin: 0 }}>
                Posts that mention CBSE/ICSE/IB get 2.4× more qualified applications.
              </p>
            </div>
            <div className="eh-card" style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>Application deadline</h4>
              <input className="eh-input" defaultValue="28 May 2026"/>
              <label className="eh-label" style={{ marginTop: 12 }}>Required documents</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="eh-chip eh-chip-active">Resume</span>
                <span className="eh-chip eh-chip-active">B.Ed. certificate</span>
                <span className="eh-chip eh-chip-outline">+ Add</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.PostJob = PostJob;

// ===================== APPLICANTS =====================
const Applicants = () => {
  const filters = [
    ["Subject", ["Mathematics"]],
    ["Experience", ["3+ years"]],
    ["Location", ["Bengaluru"]],
    ["Match score", ["80%+"]],
  ];

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar role="school" active="Applicants"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role="school"/>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12.5, color: "var(--eh-text-3)" }}>Sr. Mathematics Teacher · 47 applicants</div>
              <h1 className="eh-page-title">Applicants</h1>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="eh-btn eh-btn-secondary"><I.send size={14}/> Message all shortlisted</button>
              <button className="eh-btn eh-btn-primary"><I.calendar size={14}/> Schedule interview</button>
            </div>
          </div>

          <div className="eh-tabs" style={{ marginBottom: 16 }}>
            {[["All", 47], ["New", 12], ["Reviewed", 28], ["Shortlisted", 8], ["Interview", 5], ["Rejected", 4]].map(([t, n], i) => (
              <button key={t} className={"eh-tab " + (i === 0 ? "eh-tab-active" : "")}>{t} <span style={{ marginLeft: 4, fontSize: 11, color: "var(--eh-text-4)" }}>{n}</span></button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginRight: 4 }}>Filters:</span>
            {filters.map(([k, v]) => (
              <span key={k} className="eh-chip eh-chip-active">{k}: {v[0]} <I.x size={11}/></span>
            ))}
            <button className="eh-btn eh-btn-ghost eh-btn-sm"><I.plus size={13}/> Add filter</button>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 12.5, color: "var(--eh-text-3)" }}>Sort: <strong style={{ color: "var(--eh-text)" }}>Best match</strong></span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {TEACHERS.map((t, i) => (
              <ApplicantCard key={t.name} t={t} status={["New", "Shortlisted", "Reviewed", "New", "Reviewed", "Shortlisted"][i]}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicantCard = ({ t, status }) => (
  <div className="eh-card" style={{ padding: 18 }}>
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <Avatar name={t.name} size="lg"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{t.name}</div>
          <StatusPill status={status}/>
        </div>
        <div style={{ fontSize: 13, color: "var(--eh-text-2)", marginTop: 3 }}>{t.subject} Teacher · {t.years} years experience</div>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--eh-text-3)", marginTop: 6 }}>
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><I.mapPin size={12}/>{t.city}</span>
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><I.doc size={12}/>Resume</span>
          <span>Applied 2d ago</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <MatchMeter value={t.match} size={44}/>
        <span style={{ fontSize: 10.5, color: "var(--eh-text-3)" }}>{Math.round(t.match * 0.09)}/9 match</span>
      </div>
    </div>

    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
      <span className="eh-chip">{t.qual.split(",")[0]}</span>
      <span className="eh-chip">{t.level}</span>
      <span className="eh-chip">{t.lang.slice(0, 2).join(" · ")}</span>
    </div>

    <div style={{ display: "flex", gap: 6, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--eh-border)" }}>
      <button className="eh-btn eh-btn-secondary eh-btn-sm" style={{ flex: 1 }}>View profile</button>
      <button className="eh-btn eh-btn-primary eh-btn-sm" style={{ flex: 1 }}><I.star size={13}/> Shortlist</button>
      <button className="eh-icon-btn"><I.msg size={15}/></button>
      <button className="eh-icon-btn"><I.calendar size={15}/></button>
      <button className="eh-icon-btn"><I.more size={15}/></button>
    </div>
  </div>
);
window.Applicants = Applicants;

// ===================== PIPELINE / KANBAN =====================
const Pipeline = () => {
  const cols = [
    ["New", 12, "var(--eh-info)", [["Kavya Reddy", "Biology"], ["Vikram Iyer", "Computer Science"]]],
    ["Reviewed", 8, "#94a3b8", [["Arjun Mehta", "Chemistry"]]],
    ["Shortlisted", 6, "var(--eh-primary-600)", [["Ananya Sharma", "Mathematics"], ["Priya Nair", "English"]]],
    ["Interview", 5, "var(--eh-warning)", [["Rahul Verma", "Physics"]]],
    ["Offer", 2, "var(--eh-success)", [["Meera Iyer", "Mathematics"]]],
    ["Hired", 3, "#15803d", []],
    ["Rejected", 4, "var(--eh-danger)", []],
  ];

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar role="school" active="Pipeline"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role="school"/>
        <div style={{ padding: "20px 32px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            <div>
              <h1 className="eh-page-title">Pipeline</h1>
              <p className="eh-page-subtitle">Drag candidates between stages. Updates the candidate's timeline automatically.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="eh-select" style={{ width: 240 }} defaultValue="All jobs">
                <option>All jobs</option>
                <option>Sr. Mathematics Teacher</option>
              </select>
              <button className="eh-btn eh-btn-secondary"><I.filter size={14}/> Filters</button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 32px 24px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: "fit-content" }}>
            {cols.map(([name, n, color, cards]) => (
              <div key={name} className="eh-kanban-col">
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }}/>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{n}</span>
                  <div style={{ flex: 1 }}/>
                  <button className="eh-icon-btn" style={{ width: 24, height: 24 }}><I.plus size={13}/></button>
                </div>
                {cards.map(([n, sub]) => {
                  const t = TEACHERS.find(x => x.name === n) || { name: n, subject: sub, years: 5, match: 80, city: "—" };
                  return (
                    <div key={n} className="eh-kanban-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={n} size="sm"/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{n}</div>
                          <div style={{ fontSize: 11, color: "var(--eh-text-3)" }}>{sub} · {t.years}y</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                        <span className="eh-chip" style={{ fontSize: 11 }}>{t.match}% match</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--eh-text-3)" }}>
                          <I.clock size={11}/> 2d
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div style={{ padding: 16, fontSize: 11.5, color: "var(--eh-text-4)", textAlign: "center", border: "1.5px dashed var(--eh-border)", borderRadius: 10 }}>
                    Drop candidates here
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
window.Pipeline = Pipeline;

// ===================== INTERVIEW SCHEDULING =====================
const InterviewScheduling = () => {
  const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17"];
  const events = {
    "Tue 13": [{ time: "10:00", who: "Ananya Sharma", role: "Math", color: "var(--eh-primary-600)", h: 60 }],
    "Wed 14": [{ time: "11:00", who: "Rahul Verma", role: "Physics", color: "var(--eh-warning)", h: 60 }, { time: "16:30", who: "Vikram Iyer", role: "CS", color: "var(--eh-primary-600)", h: 45 }],
    "Thu 15": [{ time: "14:00", who: "Priya Nair", role: "English", color: "var(--eh-success)", h: 60 }],
    "Fri 16": [{ time: "12:00", who: "Kavya Reddy", role: "Biology", color: "var(--eh-info)", h: 45 }],
  };

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar role="school" active="Interviews"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role="school"/>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
            <div>
              <h1 className="eh-page-title">Interviews</h1>
              <p className="eh-page-subtitle">Week of 12 May · Asia/Kolkata</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="eh-btn eh-btn-secondary">Today</button>
              <div style={{ display: "flex", border: "1px solid var(--eh-border-strong)", borderRadius: 10 }}>
                <button className="eh-btn eh-btn-ghost eh-btn-sm" style={{ borderRadius: "10px 0 0 10px" }}>Week</button>
                <button className="eh-btn eh-btn-ghost eh-btn-sm" style={{ background: "var(--eh-bg-mute)" }}>Day</button>
                <button className="eh-btn eh-btn-ghost eh-btn-sm" style={{ borderRadius: "0 10px 10px 0" }}>List</button>
              </div>
              <button className="eh-btn eh-btn-primary"><I.plus size={14}/> Schedule</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
            <div className="eh-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px repeat(6, 1fr)", borderBottom: "1px solid var(--eh-border)" }}>
                <div/>
                {days.map(d => (
                  <div key={d} style={{ padding: "12px 10px", fontSize: 12, fontWeight: 600, textAlign: "center", borderLeft: "1px solid var(--eh-border)" }}>
                    <div style={{ color: "var(--eh-text-3)", fontSize: 11 }}>{d.split(" ")[0]}</div>
                    <div style={{ fontSize: 16, marginTop: 2 }}>{d.split(" ")[1]}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "60px repeat(6, 1fr)", position: "relative" }}>
                <div>
                  {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(h => (
                    <div key={h} style={{ height: 60, fontSize: 11, color: "var(--eh-text-3)", paddingRight: 8, textAlign: "right", paddingTop: 4 }}>
                      {h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}
                    </div>
                  ))}
                </div>
                {days.map(d => (
                  <div key={d} style={{ borderLeft: "1px solid var(--eh-border)", position: "relative", height: 540 }}>
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ position: "absolute", top: i * 60, left: 0, right: 0, height: 1, background: "var(--eh-border)", opacity: 0.6 }}/>)}
                    {(events[d] || []).map((e, i) => {
                      const top = (parseInt(e.time.split(":")[0]) - 9) * 60 + (parseInt(e.time.split(":")[1]) || 0);
                      return (
                        <div key={i} style={{ position: "absolute", top, left: 4, right: 4, height: e.h, background: e.color, opacity: 0.94, borderRadius: 8, padding: "6px 8px", color: "white", fontSize: 11, lineHeight: 1.3 }}>
                          <div style={{ fontWeight: 600, fontSize: 11.5 }}>{e.who}</div>
                          <div style={{ opacity: 0.85 }}>{e.role} · {e.time}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule panel */}
            <div className="eh-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>New interview</div>
              <h3 style={{ margin: "4px 0 16px", fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Schedule with Ananya Sharma</h3>
              <label className="eh-label">Mode</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <span className="eh-chip eh-chip-active"><I.video size={11}/> Online</span>
                <span className="eh-chip eh-chip-outline"><I.mapPin size={11}/> In-person</span>
              </div>
              <label className="eh-label">Date</label>
              <input className="eh-input" defaultValue="Tue, 14 May 2026" style={{ marginBottom: 12 }}/>
              <label className="eh-label">Available time slots</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {["10:00", "11:00", "14:00", "16:30", "17:00", "18:00"].map((t, i) => (
                  <span key={t} className={"eh-chip " + (i === 3 ? "eh-chip-active" : "eh-chip-outline")} style={{ justifyContent: "center" }}>{t}</span>
                ))}
              </div>
              <label className="eh-label" style={{ marginTop: 12 }}>Meeting link</label>
              <input className="eh-input" defaultValue="auto-generate · Google Meet"/>
              <label className="eh-label" style={{ marginTop: 12 }}>Panel</label>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <Avatar name="Meera Iyer" size="sm"/><Avatar name="Rohit Patel" size="sm"/>
                <button className="eh-icon-btn" style={{ width: 28, height: 28 }}><I.plus size={13}/></button>
              </div>
              <button className="eh-btn eh-btn-primary" style={{ width: "100%", marginTop: 18 }}>Send invite</button>
              <button className="eh-btn eh-btn-ghost" style={{ width: "100%", marginTop: 6 }}>Save as template</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.InterviewScheduling = InterviewScheduling;
