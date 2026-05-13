/* EduHire — Teacher screens */

// ===================== TEACHER FEED / DASHBOARD =====================
const TeacherDashboard = () => (
  <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: "var(--eh-bg)" }}>
    <Sidebar role="teacher" active="Home"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Topbar role="teacher"/>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr", gap: 16 }}>

          {/* LEFT: profile completeness + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="eh-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 64, background: "linear-gradient(120deg, var(--eh-primary-600), var(--eh-primary-900))" }}/>
              <div style={{ padding: "0 20px 20px", marginTop: -32 }}>
                <Avatar name="Ananya Sharma" size="lg" className="" />
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Ananya Sharma</div>
                  <div style={{ fontSize: 12.5, color: "var(--eh-text-3)" }}>Mathematics Teacher · 6 years experience</div>
                </div>
                <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--eh-primary-50)", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--eh-primary-700)", fontWeight: 600 }}>Profile 80% complete</span>
                    <span style={{ color: "var(--eh-primary-700)" }}>4 of 5</span>
                  </div>
                  <div className="eh-progress" style={{ marginTop: 8, background: "white" }}><div className="eh-progress-bar" style={{ width: "80%" }}/></div>
                  <div style={{ fontSize: 11.5, color: "var(--eh-primary-700)", marginTop: 8, opacity: 0.8 }}>Add your qualifications to improve school matches.</div>
                </div>
                <button className="eh-btn eh-btn-secondary" style={{ width: "100%", marginTop: 14 }}>Edit profile</button>
              </div>
            </div>

            <div className="eh-card" style={{ padding: 18 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>Your activity</h4>
              {[["Applications sent", "12"], ["Interviews scheduled", "3"], ["Saved jobs", "8"], ["Profile views by schools", "47"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: l === "Applications sent" ? "none" : "1px solid var(--eh-border)" }}>
                  <span style={{ fontSize: 13, color: "var(--eh-text-2)" }}>{l}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "var(--eh-font-display)" }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="eh-card" style={{ padding: 18 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>Suggested for you</h4>
              <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", lineHeight: 1.5 }}>
                Based on your profile, you might be a good fit for jobs at <strong style={{ color: "var(--eh-text)" }}>3 schools</strong> in Bengaluru.
              </div>
            </div>
          </div>

          {/* MIDDLE: feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>Recommended for you</h2>
              <select className="eh-select" style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}>
                <option>Best match</option><option>Newest</option>
              </select>
            </div>

            {JOBS.slice(0, 3).map(j => <JobFeedCard key={j.id} j={j}/>)}

            {/* Application status update post */}
            <div className="eh-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SchoolLogo name="Bright Future High School" size={36}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Bright Future High School</div>
                  <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>Updated your application · 3 hours ago</div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: 14, background: "var(--eh-success-bg)", border: "1px solid var(--eh-success-border)", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: "var(--eh-success)", color: "white", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><I.star size={16} sw={2.2}/></div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--eh-success)" }}>You've been shortlisted!</div>
                    <div style={{ fontSize: 12, color: "var(--eh-text-2)" }}>English Literature Teacher · expect a message soon.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: interviews + applications */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="eh-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Upcoming interviews</h4>
                <a href="#" style={{ fontSize: 12, color: "var(--eh-primary-700)" }}>All</a>
              </div>
              {[
                { school: "Green Valley Public School", role: "Sr. Mathematics", when: "Tue 14 May, 4:30 PM", mode: "Online" },
                { school: "Sunrise International", role: "Mathematics IB", when: "Fri 17 May, 11:00 AM", mode: "On-campus" },
              ].map(iv => (
                <div key={iv.school} style={{ padding: "12px 0", borderTop: "1px solid var(--eh-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <SchoolLogo name={iv.school} size={32}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{iv.school}</div>
                      <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{iv.role}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11.5, color: "var(--eh-text-2)" }}>
                    <I.clock size={12}/> {iv.when}
                    <span className="eh-dot"/>
                    {iv.mode === "Online" ? <I.video size={12}/> : <I.mapPin size={12}/>} {iv.mode}
                  </div>
                  {iv.mode === "Online" && (
                    <button className="eh-btn eh-btn-secondary eh-btn-sm" style={{ marginTop: 8, width: "100%" }}><I.video size={13}/> Join meeting</button>
                  )}
                </div>
              ))}
            </div>

            <div className="eh-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Application status</h4>
                <a href="#" style={{ fontSize: 12, color: "var(--eh-primary-700)" }}>All 12</a>
              </div>
              {[
                ["Bright Future High", "English Lit.", "Shortlisted"],
                ["Sunrise International", "Mathematics IB", "Interview"],
                ["Lotus Heritage", "Sr. Math", "Under review"],
              ].map(([s, r, st], i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--eh-border)" : "none" }}>
                  <SchoolLogo name={s} size={28}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s}</div>
                    <div style={{ fontSize: 11, color: "var(--eh-text-3)" }}>{r}</div>
                  </div>
                  <StatusPill status={st}/>
                </div>
              ))}
            </div>

            <div className="eh-card" style={{ padding: 18, background: "linear-gradient(180deg, #fffbeb, var(--eh-surface))", borderColor: "var(--eh-warning-border)" }}>
              <I.sparkle size={16} stroke="var(--eh-warning)"/>
              <h4 style={{ margin: "8px 0 4px", fontSize: 13.5 }}>Tip from EduHire</h4>
              <p style={{ fontSize: 12.5, color: "var(--eh-text-2)", margin: 0, lineHeight: 1.5 }}>
                Profiles with a 80-word bio get 3× more interview invites.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.TeacherDashboard = TeacherDashboard;

// Reusable feed-style job card
const JobFeedCard = ({ j }) => (
  <div className="eh-card" style={{ padding: 0, overflow: "hidden" }}>
    <div style={{ padding: "16px 18px 12px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <SchoolLogo name={j.school.name} size={44}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{j.school.name}</span>
            {j.school.verified && (
              <span style={{ width: 14, height: 14, background: "var(--eh-info)", color: "white", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <I.check size={9} sw={3}/>
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>{j.school.board} · {j.school.city} · Posted {j.posted}</div>
        </div>
        <button className="eh-icon-btn" aria-label="Save"><I.bookmark size={16}/></button>
        <button className="eh-icon-btn"><I.more size={15}/></button>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em", fontFamily: "var(--eh-font-display)" }}>{j.title}</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <span className="eh-chip">{j.subject}</span>
            <span className="eh-chip">Class {j.grade}</span>
            <span className="eh-chip">{j.type}</span>
            <span className="eh-chip">{j.mode}</span>
            <span className="eh-chip" style={{ color: "var(--eh-success)", background: "var(--eh-success-bg)" }}>{j.salary}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <MatchMeter value={Math.min(96, 70 + (j.applicants % 22))} size={42}/>
          <span style={{ fontSize: 10.5, color: "var(--eh-text-3)" }}>match</span>
        </div>
      </div>
    </div>
    <div style={{ padding: "10px 18px", borderTop: "1px solid var(--eh-border)", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>
        <I.clock size={11}/> Apply by {j.deadline}
      </span>
      <span className="eh-dot"/>
      <span style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{j.applicants} applicants · {j.shortlisted} shortlisted</span>
      <div style={{ flex: 1 }}/>
      <button className="eh-btn eh-btn-ghost eh-btn-sm"><I.share size={13}/></button>
      <button className="eh-btn eh-btn-secondary eh-btn-sm">View details</button>
      <button className="eh-btn eh-btn-primary eh-btn-sm">Apply now</button>
    </div>
  </div>
);
window.JobFeedCard = JobFeedCard;

// ===================== JOB DISCOVERY / SEARCH =====================
const JobDiscovery = () => (
  <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
    <Sidebar role="teacher" active="Jobs"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Topbar role="teacher"/>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero search */}
        <div className="eh-mesh" style={{ padding: "32px 32px 24px" }}>
          <div style={{ maxWidth: 980 }}>
            <h1 style={{ fontFamily: "var(--eh-font-display)", fontSize: 30, letterSpacing: "-0.025em", fontWeight: 500, margin: 0 }}>Find your next teaching role</h1>
            <p style={{ fontSize: 14, color: "var(--eh-text-2)", marginTop: 6 }}>2,847 active jobs · 312 added this week</p>
            <div className="eh-card" style={{ marginTop: 18, padding: 6, display: "flex", gap: 6, alignItems: "center", boxShadow: "var(--eh-shadow-md)" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
                <I.search size={16}/>
                <input style={{ border: 0, outline: 0, flex: 1, fontSize: 14, background: "transparent" }} placeholder="Subject, school or keyword" defaultValue="Mathematics"/>
              </div>
              <div style={{ width: 1, height: 20, background: "var(--eh-border)" }}/>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", minWidth: 200 }}>
                <I.mapPin size={15}/>
                <input style={{ border: 0, outline: 0, flex: 1, fontSize: 14, background: "transparent" }} placeholder="Location" defaultValue="Bengaluru, KA"/>
              </div>
              <button className="eh-btn eh-btn-primary">Search</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              {["Full-time", "Class 11–12", "₹6 LPA+", "Hybrid", "CBSE", "Posted this week"].map((c, i) => (
                <span key={c} className={"eh-chip " + (i < 2 ? "eh-chip-active" : "eh-chip-outline")}>{c}{i < 2 && <I.x size={11}/>}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 32px", display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
          {/* Filters */}
          <div className="eh-card" style={{ padding: 18, height: "fit-content", position: "sticky", top: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Filters</h4>
              <a href="#" style={{ fontSize: 11.5, color: "var(--eh-primary-700)" }}>Clear</a>
            </div>
            {[
              ["Subject", ["Mathematics", "Physics", "Chemistry", "English", "Biology", "Computer Science"], 0],
              ["Grade level", ["Primary", "Middle (6–8)", "Secondary (9–10)", "Sr. Sec. (11–12)"], 3],
              ["Job type", ["Full-time", "Part-time", "Substitute", "Online", "Hybrid"], 0],
              ["Board", ["CBSE", "ICSE", "IB", "State Board", "IGCSE"], 0],
            ].map(([title, opts, picked]) => (
              <div key={title} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--eh-text-2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {opts.map((o, i) => (
                    <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--eh-text-2)" }}>
                      <input type="checkbox" defaultChecked={i === picked}/> {o}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--eh-text-2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Salary</div>
              <input type="range" defaultValue="60" style={{ width: "100%" }}/>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--eh-text-3)" }}>
                <span>₹3 LPA</span><span>₹15+ LPA</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--eh-text-3)" }}>Showing <strong style={{ color: "var(--eh-text)" }}>1–14</strong> of <strong style={{ color: "var(--eh-text)" }}>184</strong> jobs</span>
              <select className="eh-select" style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}>
                <option>Best match</option><option>Newest</option><option>Salary high to low</option><option>Deadline soonest</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {JOBS.map(j => <JobFeedCard key={j.id} j={j}/>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.JobDiscovery = JobDiscovery;

// ===================== JOB DETAIL =====================
const JobDetail = () => {
  const j = JOBS[0];
  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar role="teacher" active="Jobs"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role="teacher"/>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginBottom: 12 }}>
            <a href="#" style={{ color: "inherit" }}>Jobs</a> › <a href="#" style={{ color: "inherit" }}>Mathematics</a> › <span style={{ color: "var(--eh-text)" }}>Senior Mathematics Teacher</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
            <div>
              <div className="eh-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <SchoolLogo name={j.school.name} size={64}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, color: "var(--eh-text-2)", fontWeight: 600 }}>{j.school.name}</span>
                      <span className="eh-badge eh-badge-info"><I.shield size={10}/> Verified school</span>
                    </div>
                    <h1 style={{ fontFamily: "var(--eh-font-display)", fontSize: 30, letterSpacing: "-0.025em", fontWeight: 500, margin: "6px 0 12px" }}>{j.title}</h1>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--eh-text-2)", flexWrap: "wrap" }}>
                      <span><I.mapPin size={13}/> {j.school.city}</span>
                      <span><I.briefcase size={13}/> {j.type}</span>
                      <span><I.clock size={13}/> Apply by {j.deadline}</span>
                      <span style={{ color: "var(--eh-success)", fontWeight: 600 }}>{j.salary}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 18, flexWrap: "wrap" }}>
                  {[j.subject, `Class ${j.grade}`, j.mode, j.school.board, "Boards prep"].map(c => (
                    <span key={c} className="eh-chip">{c}</span>
                  ))}
                </div>
              </div>

              <div className="eh-card" style={{ padding: 28, marginTop: 12 }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>About this role</h2>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--eh-text-2)", margin: 0 }}>
                  Green Valley is hiring a Senior Mathematics Teacher for Classes 11–12 (CBSE). You'll lead board exam preparation, mentor students for engineering entrances, and contribute to curriculum design. We are a 1,400-student CBSE school with a strong STEM focus.
                </p>

                <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>Responsibilities</h3>
                <ul style={{ fontSize: 14, color: "var(--eh-text-2)", margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, lineHeight: 1.5 }}>
                  <li>Plan and deliver Mathematics lessons aligned with CBSE syllabus</li>
                  <li>Mentor students for board examinations and JEE</li>
                  <li>Collaborate with the Mathematics department on curriculum review</li>
                  <li>Conduct parent-teacher meetings and progress reviews</li>
                </ul>

                <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>Requirements</h3>
                <ul style={{ fontSize: 14, color: "var(--eh-text-2)", margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, lineHeight: 1.5 }}>
                  <li>M.Sc. Mathematics with B.Ed. preferred</li>
                  <li>Minimum 4 years of teaching experience at Sr. Secondary level</li>
                  <li>Excellent communication in English; Hindi/Kannada a plus</li>
                  <li>Familiarity with CBSE board exam patterns</li>
                </ul>

                <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>Benefits</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {["Health insurance", "Paid summer break", "Annual training stipend", "On-campus accommodation"].map(b => (
                    <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--eh-text-2)" }}>
                      <span style={{ width: 18, height: 18, borderRadius: 6, background: "var(--eh-success-bg)", color: "var(--eh-success)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I.check size={11} sw={2.5}/></span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              <div className="eh-card" style={{ padding: 28, marginTop: 12 }}>
                <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 600 }}>About Green Valley Public School</h2>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <SchoolLogo name={j.school.name} size={56}/>
                  <p style={{ fontSize: 14, color: "var(--eh-text-2)", lineHeight: 1.6, margin: 0 }}>
                    Founded in 1998, Green Valley Public School is a CBSE-affiliated co-educational institution serving 1,400 students across Bengaluru. We focus on STEM, ethics-led education and a low student-to-teacher ratio of 18:1.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 18 }}>
                  {[["1998", "Founded"], ["1,400", "Students"], ["96", "Teachers"], ["CBSE", "Board"]].map(([v, l]) => (
                    <div key={l} style={{ padding: "12px 14px", background: "var(--eh-bg-soft)", borderRadius: 10 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--eh-font-display)" }}>{v}</div>
                      <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky apply panel */}
            <div style={{ position: "sticky", top: 20, alignSelf: "flex-start" }}>
              <div className="eh-card" style={{ padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MatchMeter value={92} size={48}/>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>92% match</div>
                    <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>Matches 7 of 9 requirements</div>
                  </div>
                </div>
                <button className="eh-btn eh-btn-primary" style={{ width: "100%", marginTop: 16, padding: "12px 16px" }}>Apply now <I.arrowRight size={15}/></button>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button className="eh-btn eh-btn-secondary" style={{ flex: 1 }}><I.bookmark size={14}/> Save</button>
                  <button className="eh-btn eh-btn-secondary" style={{ flex: 1 }}><I.share size={14}/> Share</button>
                </div>
                <div className="eh-divider"/>
                <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>Posted {j.posted} · 47 applicants · 8 shortlisted</div>
              </div>

              <div className="eh-card" style={{ padding: 22, marginTop: 12 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>Similar jobs</h4>
                {JOBS.slice(1, 4).map(s => (
                  <div key={s.id} style={{ padding: "10px 0", borderTop: "1px solid var(--eh-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <SchoolLogo name={s.school.name} size={28}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: "var(--eh-text-3)" }}>{s.school.short} · {s.salary}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.JobDetail = JobDetail;

// ===================== APPLY FLOW =====================
const ApplyFlow = () => (
  <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: "var(--eh-bg-soft)" }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Mini topbar */}
      <div style={{ height: 60, padding: "0 32px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--eh-border)", background: "var(--eh-surface)" }}>
        <EduLogo/>
        <div style={{ flex: 1 }}/>
        <button className="eh-btn eh-btn-ghost"><I.x size={15}/> Save & exit</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Job mini banner */}
          <div className="eh-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <SchoolLogo name="Green Valley Public School"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>Applying to</div>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>Senior Mathematics Teacher · Green Valley Public School</div>
            </div>
            <span className="eh-badge eh-badge-primary">92% match</span>
          </div>

          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, padding: "0 6px" }}>
            {["Profile", "Resume", "Questions", "Cover note", "Confirm"].map((s, i) => {
              const done = i < 2, active = i === 2;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: i === 4 ? 0 : 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: done ? "var(--eh-primary-600)" : active ? "var(--eh-surface)" : "var(--eh-bg-mute)", color: done ? "white" : active ? "var(--eh-primary-700)" : "var(--eh-text-3)", border: active ? "1.5px solid var(--eh-primary-600)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                    {done ? <I.check size={13} sw={2.5}/> : i + 1}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? "var(--eh-text)" : "var(--eh-text-3)" }}>{s}</span>
                  {i < 4 && <div style={{ flex: 1, height: 1, background: i < 2 ? "var(--eh-primary-600)" : "var(--eh-border)", marginLeft: 8 }}/>}
                </div>
              );
            })}
          </div>

          <div className="eh-card" style={{ padding: 28, marginTop: 24, boxShadow: "var(--eh-shadow-sm)" }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, fontFamily: "var(--eh-font-display)", letterSpacing: "-0.02em" }}>Screening questions</h2>
            <p style={{ fontSize: 13.5, color: "var(--eh-text-3)", margin: "6px 0 22px" }}>The school will review these along with your resume.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <label className="eh-label">Have you taught CBSE Class 12 Mathematics? *</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="eh-chip eh-chip-active" style={{ padding: "8px 16px" }}><I.check size={12} sw={2.5}/> Yes, 4 years</span>
                  <span className="eh-chip eh-chip-outline" style={{ padding: "8px 16px" }}>No</span>
                </div>
              </div>

              <div>
                <label className="eh-label">Are you available to start before July 2026? *</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="eh-chip eh-chip-active" style={{ padding: "8px 16px" }}><I.check size={12} sw={2.5}/> Yes</span>
                  <span className="eh-chip eh-chip-outline" style={{ padding: "8px 16px" }}>No</span>
                </div>
              </div>

              <div>
                <label className="eh-label">Briefly describe your approach to JEE preparation. *</label>
                <textarea className="eh-textarea" defaultValue="I structure JEE prep around concept clarity first, then rigorous past-paper drills. For Mathematics, I emphasize visualization in calculus and coordinate geometry, and pair students for peer-explanation sessions weekly." style={{ minHeight: 110 }}/>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--eh-text-3)", marginTop: 4 }}>
                  <span>Looks great. Add any specific student outcomes if you can.</span>
                  <span>247 / 500</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
            <button className="eh-btn eh-btn-secondary">Back</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="eh-btn eh-btn-ghost">Save & continue later</button>
              <button className="eh-btn eh-btn-primary">Continue <I.arrowRight size={15}/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.ApplyFlow = ApplyFlow;

// ===================== MY APPLICATIONS =====================
const MyApplications = () => {
  const apps = [
    { school: SCHOOLS[0], role: "Sr. Mathematics Teacher", status: "Interview", date: "May 8", next: "Interview Tue 14 May, 4:30 PM" },
    { school: SCHOOLS[1], role: "Mathematics IB", status: "Shortlisted", date: "May 6", next: "Awaiting interview slot" },
    { school: SCHOOLS[2], role: "Mathematics (Sr. Sec.)", status: "Under review", date: "May 4", next: "Application sent" },
    { school: SCHOOLS[3], role: "Sr. Math + Stats", status: "Applied", date: "May 2", next: "Application sent" },
    { school: SCHOOLS[4], role: "Coding & Math Lead", status: "Rejected", date: "Apr 28", next: "School reviewed and declined" },
  ];

  return (
    <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      <Sidebar role="teacher" active="Applications"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar role="teacher"/>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div style={{ marginBottom: 18 }}>
            <h1 className="eh-page-title">My applications</h1>
            <p className="eh-page-subtitle">Track every application from applied to hired.</p>
          </div>

          <div className="eh-tabs" style={{ marginBottom: 16 }}>
            {[["All", 12], ["Applied", 4], ["Under review", 3], ["Shortlisted", 2], ["Interview", 2], ["Offer", 0], ["Rejected", 1]].map(([t, n], i) => (
              <button key={t} className={"eh-tab " + (i === 0 ? "eh-tab-active" : "")}>{t} <span style={{ marginLeft: 4, fontSize: 11, color: "var(--eh-text-4)" }}>{n}</span></button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {apps.map((a, i) => (
              <div key={i} className="eh-card" style={{ padding: 18, display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 16, alignItems: "center" }}>
                <SchoolLogo name={a.school.name} size={48}/>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600 }}>{a.role}</span>
                    <StatusPill status={a.status}/>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--eh-text-3)", marginTop: 3 }}>{a.school.name} · {a.school.city} · Applied {a.date}</div>
                  <div style={{ fontSize: 12, color: "var(--eh-text-2)", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <I.arrowRight size={12}/> Next: <strong>{a.next}</strong>
                  </div>
                </div>
                <button className="eh-icon-btn"><I.msg size={16}/></button>
                <button className="eh-btn eh-btn-secondary eh-btn-sm">View details</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
window.MyApplications = MyApplications;

// ===================== TEACHER PROFILE BUILDER =====================
const TeacherProfile = () => (
  <div className="eh-app" style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
    <Sidebar role="teacher" active="Profile"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Topbar role="teacher"/>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Banner */}
        <div style={{ height: 140, background: "linear-gradient(120deg, var(--eh-primary-700), var(--eh-primary-900))", position: "relative" }}>
          <button className="eh-btn eh-btn-secondary eh-btn-sm" style={{ position: "absolute", top: 16, right: 32 }}><I.eye size={13}/> View as school</button>
        </div>
        <div style={{ padding: "0 32px 32px", marginTop: -56, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "flex-start" }}>
          <div>
            <div className="eh-card" style={{ padding: "0 24px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -36 }}>
                <Avatar name="Ananya Sharma" size="xl" className="" />
                <div style={{ flex: 1, paddingBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h1 style={{ margin: 0, fontFamily: "var(--eh-font-display)", fontSize: 26, letterSpacing: "-0.02em", fontWeight: 500 }}>Ananya Sharma</h1>
                    <span className="eh-badge eh-badge-info"><I.shield size={10}/> Verified</span>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--eh-text-2)", marginTop: 2 }}>Mathematics Teacher · CBSE & State Boards</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--eh-text-3)", marginTop: 6 }}>
                    <span><I.mapPin size={12}/> Bengaluru, KA</span>
                    <span><I.briefcase size={12}/> 6 years experience</span>
                    <span><I.award size={12}/> M.Sc. Mathematics, B.Ed.</span>
                  </div>
                </div>
                <button className="eh-btn eh-btn-secondary"><I.edit size={13}/> Edit</button>
              </div>

              <div style={{ marginTop: 18 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--eh-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>About</h3>
                <p style={{ fontSize: 14, color: "var(--eh-text-2)", lineHeight: 1.6, margin: 0 }}>
                  Senior Math educator focused on Class 11–12 boards and JEE preparation. Spent the last six years building visualization-led lesson plans for calculus, coordinate geometry and statistics. Mentored 38 students into engineering colleges.
                </p>
              </div>
            </div>

            <div className="eh-card" style={{ padding: 24, marginTop: 12 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Subjects & expertise</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Mathematics (Class 11–12)", "Calculus", "Coordinate Geometry", "JEE Preparation", "Statistics", "Vedic Math"].map(s => <span key={s} className="eh-chip eh-chip-active">{s}</span>)}
              </div>
            </div>

            <div className="eh-card" style={{ padding: 24, marginTop: 12 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Experience</h3>
              {[
                ["Senior Math Teacher", "Delhi Public School Bengaluru", "2022 — Present", "Class 11–12 CBSE · JEE coaching · Department lead for Math curriculum revamp."],
                ["Math Teacher", "Vidya Niketan School", "2020 — 2022", "Class 9–10 ICSE · Set up the school's Math Olympiad club."],
                ["TGT Mathematics", "St. John's High School", "2018 — 2020", "Class 6–8 CBSE · Joined as a TGT after completing B.Ed."],
              ].map(([role, org, when, desc], i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderTop: i ? "1px solid var(--eh-border)" : "none" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--eh-bg-mute)", color: "var(--eh-text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <I.briefcase size={17}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{role}</div>
                    <div style={{ fontSize: 13, color: "var(--eh-text-2)" }}>{org} · {when}</div>
                    <div style={{ fontSize: 13, color: "var(--eh-text-3)", marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="eh-card" style={{ padding: 24, marginTop: 12 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Education & certifications</h3>
              {[
                ["M.Sc. Mathematics", "Bangalore University · 2018"],
                ["B.Ed.", "Christ University · 2017"],
                ["NPTEL · Linear Algebra", "IIT Madras · 2021"],
              ].map(([t, w], i) => (
                <div key={t} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--eh-border)" : "none", alignItems: "center" }}>
                  <I.award size={18} stroke="var(--eh-primary-700)"/>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--eh-text-3)" }}>{w}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            <div className="eh-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Profile completeness</div>
              <div className="eh-progress" style={{ marginTop: 10 }}><div className="eh-progress-bar" style={{ width: "80%" }}/></div>
              <div style={{ fontSize: 12, color: "var(--eh-text-3)", marginTop: 8 }}>4 of 5 sections — add a portfolio or demo video to reach 100%.</div>
            </div>
            <div className="eh-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Resume / CV</div>
              <div style={{ padding: 12, border: "1px dashed var(--eh-border-strong)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 44, background: "var(--eh-danger-bg)", color: "var(--eh-danger)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>PDF</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>Ananya_Sharma_Resume.pdf</div>
                  <div style={{ fontSize: 11, color: "var(--eh-text-3)" }}>Updated 2 weeks ago · 412 KB</div>
                </div>
                <button className="eh-icon-btn"><I.upload size={14}/></button>
              </div>
            </div>
            <div className="eh-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Languages</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["English", "Hindi", "Kannada"].map(l => <span key={l} className="eh-chip">{l}</span>)}
              </div>
            </div>
            <div className="eh-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Privacy</div>
              {[["Show contact details to schools after shortlist", true], ["Make profile discoverable", true], ["Allow direct invitations", false]].map(([t, on]) => (
                <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: t.includes("contact") ? "none" : "1px solid var(--eh-border)" }}>
                  <span style={{ fontSize: 12.5, color: "var(--eh-text-2)", flex: 1, paddingRight: 10 }}>{t}</span>
                  <span style={{ width: 32, height: 18, borderRadius: 999, background: on ? "var(--eh-primary-600)" : "var(--eh-border-strong)", position: "relative", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, background: "white", borderRadius: "50%" }}/>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.TeacherProfile = TeacherProfile;
