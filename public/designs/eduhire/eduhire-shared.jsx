/* EduHire shared primitives + fixtures + tiny SVG icon set */

// ---------- Icons (lucide-style, 1.6 stroke) ----------
const Icon = ({ d, size = 18, fill = "none", stroke = "currentColor", sw = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);
const I = {
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
  bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  msg: (p) => <Icon {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>,
  home: (p) => <Icon {...p}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></Icon>,
  briefcase: (p) => <Icon {...p}><rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2.5 13h19"/></Icon>,
  users: (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  pipeline: (p) => <Icon {...p}><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="10" y="6" width="6" height="12" rx="1"/><rect x="17" y="9" width="4" height="6" rx="1"/></Icon>,
  calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></Icon>,
  chart: (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></Icon>,
  team: (p) => <Icon {...p}><path d="M17 11a4 4 0 1 0-4-4"/><path d="M3 21v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1"/><circle cx="10" cy="7" r="4"/></Icon>,
  settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09c0 .66.39 1.26 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.25.61.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.26.39-1.51 1z"/></Icon>,
  plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  filter: (p) => <Icon {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></Icon>,
  more: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></Icon>,
  check: (p) => <Icon {...p}><path d="m5 12 5 5L20 6"/></Icon>,
  arrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  arrowUp: (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  arrowDown: (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  bookmark: (p) => <Icon {...p}><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></Icon>,
  bookmarkF: (p) => <Icon {...p} fill="currentColor"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></Icon>,
  share: (p) => <Icon {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></Icon>,
  pin: (p) => <Icon {...p}><path d="M12 13v8"/><circle cx="12" cy="9" r="3"/><path d="M5 9a7 7 0 0 1 14 0c0 6-7 12-7 12"/></Icon>,
  star: (p) => <Icon {...p}><path d="m12 3 3 6 6.5 1-4.7 4.6 1.1 6.6L12 18l-5.9 3.2L7.2 14.6 2.5 10 9 9z"/></Icon>,
  starF: (p) => <Icon {...p} fill="currentColor"><path d="m12 3 3 6 6.5 1-4.7 4.6 1.1 6.6L12 18l-5.9 3.2L7.2 14.6 2.5 10 9 9z"/></Icon>,
  clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  chev: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  eye: (p) => <Icon {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/></Icon>,
  doc: (p) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/></Icon>,
  upload: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></Icon>,
  send: (p) => <Icon {...p}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></Icon>,
  shield: (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></Icon>,
  google: (p) => (
    <svg width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285f4" d="M22 12.2c0-.7-.07-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2 3.1v2.6h3.3c2-1.8 3.1-4.5 3.1-7.5z"/>
      <path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22z"/>
      <path fill="#fbbc04" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9z"/>
      <path fill="#ea4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3 7.5l3.4 2.6c.8-2.4 3-4.1 5.6-4.1z"/>
    </svg>
  ),
  mapPin: (p) => <Icon {...p}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  rupee: (p) => <Icon {...p}><path d="M6 4h12M6 9h12M9 4c4 0 5 5 0 5H6l8 11"/></Icon>,
  building: (p) => <Icon {...p}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M14 9h.01M9 13h.01M14 13h.01M9 17h.01M14 17h.01"/></Icon>,
  globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
  sparkle: (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></Icon>,
  paperclip: (p) => <Icon {...p}><path d="m21 12-9 9a5 5 0 0 1-7-7L13 5a3.5 3.5 0 0 1 5 5L9 19a2 2 0 0 1-3-3l8-8"/></Icon>,
  video: (p) => <Icon {...p}><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/></Icon>,
  x: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  award: (p) => <Icon {...p}><circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8"/></Icon>,
  edit: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></Icon>,
};

window.I = I;
window.Icon = Icon;

// ---------- Avatars / school logos (deterministic colors) ----------
const AVATAR_COLORS = [
  ["#4f46e5", "#312e81"],
  ["#0d9488", "#134e4a"],
  ["#b45309", "#78350f"],
  ["#be185d", "#831843"],
  ["#7c3aed", "#4c1d95"],
  ["#0369a1", "#0c4a6e"],
  ["#15803d", "#14532d"],
  ["#c2410c", "#7c2d12"],
];
const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const initials = (name) =>
  name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

const Avatar = ({ name, size = "md", className = "" }) => {
  const [a, b] = AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
  const cls = "eh-avatar " + (size === "sm" ? "eh-avatar-sm" : size === "lg" ? "eh-avatar-lg" : size === "xl" ? "eh-avatar-xl" : "") + " " + className;
  return (
    <span className={cls} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      {initials(name)}
    </span>
  );
};

const SchoolLogo = ({ name, size = 44 }) => {
  const [a, b] = AVATAR_COLORS[(hashStr(name) + 3) % AVATAR_COLORS.length];
  return (
    <span className="eh-logo-tile" style={{ background: `linear-gradient(135deg, ${a}, ${b})`, width: size, height: size, fontSize: size * 0.32, borderRadius: size * 0.27 }}>
      {initials(name)}
    </span>
  );
};

window.Avatar = Avatar;
window.SchoolLogo = SchoolLogo;

// ---------- Logo ----------
const EduLogo = ({ size = 19 }) => (
  <span className="eh-logo" style={{ fontSize: size }}>
    <span className="eh-logo-mark" style={{ width: size * 1.5, height: size * 1.5 }} />
    EduHire
  </span>
);
window.EduLogo = EduLogo;

// ---------- Match meter ----------
const MatchMeter = ({ value = 75, size = 38 }) => {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="eh-meter" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--eh-bg-mute)" strokeWidth="3.5" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--eh-primary-600)" strokeWidth="3.5" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - value/100)} strokeLinecap="round"/>
      </svg>
      <span className="eh-meter-text" style={{ fontSize: size * 0.3 }}>{value}%</span>
    </div>
  );
};
window.MatchMeter = MatchMeter;

// ---------- Fixtures ----------
const SCHOOLS = [
  { name: "Green Valley Public School", short: "Green Valley", city: "Bengaluru, KA", board: "CBSE", verified: true },
  { name: "Sunrise International Academy", short: "Sunrise International", city: "Pune, MH", board: "IB", verified: true },
  { name: "Bright Future High School", short: "Bright Future", city: "Hyderabad, TS", board: "ICSE", verified: true },
  { name: "Lotus Heritage School", short: "Lotus Heritage", city: "Chennai, TN", board: "CBSE", verified: false },
  { name: "Ashoka Global School", short: "Ashoka Global", city: "Gurugram, HR", board: "CBSE", verified: true },
];

const TEACHERS = [
  { name: "Ananya Sharma", subject: "Mathematics", years: 6, city: "Bengaluru", level: "Sr. Secondary", match: 92, qual: "M.Sc. Mathematics, B.Ed.", lang: ["English", "Hindi", "Kannada"] },
  { name: "Rahul Verma", subject: "Physics", years: 4, city: "Pune", level: "Higher Secondary", match: 87, qual: "M.Sc. Physics, B.Ed.", lang: ["English", "Hindi", "Marathi"] },
  { name: "Priya Nair", subject: "English", years: 8, city: "Chennai", level: "Middle & Sr.", match: 94, qual: "M.A. English, B.Ed., CELTA", lang: ["English", "Tamil", "Malayalam"] },
  { name: "Arjun Mehta", subject: "Chemistry", years: 5, city: "Mumbai", level: "Sr. Secondary", match: 81, qual: "M.Sc. Chemistry, B.Ed.", lang: ["English", "Hindi"] },
  { name: "Kavya Reddy", subject: "Biology", years: 3, city: "Hyderabad", level: "Secondary", match: 76, qual: "M.Sc. Biology, B.Ed.", lang: ["English", "Telugu"] },
  { name: "Vikram Iyer", subject: "Computer Science", years: 7, city: "Bengaluru", level: "Sr. Secondary", match: 89, qual: "M.Tech CS, PG Dip. Education", lang: ["English", "Tamil"] },
];

const JOBS = [
  { id: "j1", title: "Senior Mathematics Teacher", school: SCHOOLS[0], subject: "Mathematics", grade: "11–12", type: "Full-time", mode: "On-campus", salary: "₹6.5–9.5 LPA", deadline: "May 28", posted: "2 days ago", applicants: 47, shortlisted: 8 },
  { id: "j2", title: "Physics Teacher (IB Diploma)", school: SCHOOLS[1], subject: "Physics", grade: "11–12", type: "Full-time", mode: "On-campus", salary: "₹8–12 LPA", deadline: "Jun 04", posted: "5 days ago", applicants: 32, shortlisted: 5 },
  { id: "j3", title: "English Literature Teacher", school: SCHOOLS[2], subject: "English", grade: "9–10", type: "Full-time", mode: "Hybrid", salary: "₹5.5–8 LPA", deadline: "May 22", posted: "1 day ago", applicants: 64, shortlisted: 12 },
  { id: "j4", title: "Chemistry Substitute (3 mo)", school: SCHOOLS[3], subject: "Chemistry", grade: "11–12", type: "Substitute", mode: "On-campus", salary: "₹45k–60k /mo", deadline: "May 18", posted: "Today", applicants: 12, shortlisted: 2 },
  { id: "j5", title: "Computer Science — Coding Lead", school: SCHOOLS[4], subject: "Computer Science", grade: "6–10", type: "Full-time", mode: "On-campus", salary: "₹7–10 LPA", deadline: "Jun 12", posted: "3 days ago", applicants: 28, shortlisted: 4 },
];

window.SCHOOLS = SCHOOLS;
window.TEACHERS = TEACHERS;
window.JOBS = JOBS;

// ---------- Small chrome bits ----------
const Topbar = ({ role, onSwitchRole, query = "" }) => (
  <div className="eh-topbar">
    <div className="eh-search" style={{ flex: 1, maxWidth: 460 }}>
      <I.search size={15}/>
      <input placeholder={role === "school" ? "Search jobs, applicants, teachers" : "Search jobs, schools, subjects"} defaultValue={query}/>
      <kbd>⌘K</kbd>
    </div>
    <div style={{ flex: 1 }}/>
    <button className="eh-icon-btn" aria-label="Notifications">
      <I.bell size={18}/>
      <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: "var(--eh-danger)", borderRadius: "50%", border: "2px solid var(--eh-surface)" }}/>
    </button>
    <button className="eh-icon-btn" aria-label="Messages"><I.msg size={18}/></button>
    <div style={{ width: 1, height: 24, background: "var(--eh-border)" }}/>
    <button className="eh-icon-btn" onClick={onSwitchRole} title="Switch role" style={{ width: "auto", padding: "0 12px", gap: 6, fontSize: 12, fontWeight: 600 }}>
      {role === "school" ? "School Admin" : "Teacher"}
      <I.chev size={14}/>
    </button>
    <Avatar name={role === "school" ? "Meera Iyer" : "Ananya Sharma"} size="sm"/>
  </div>
);
window.Topbar = Topbar;

const NavItem = ({ icon: Ico, label, active, badge }) => (
  <a className={"eh-nav-item " + (active ? "eh-nav-item-active" : "")} href="#">
    <Ico size={17}/>
    <span style={{ flex: 1 }}>{label}</span>
    {badge != null && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--eh-text-3)" }}>{badge}</span>}
  </a>
);
window.NavItem = NavItem;

const Sidebar = ({ role, active }) => {
  const adminItems = [
    ["Dashboard", I.home],
    ["Jobs", I.briefcase],
    ["Applicants", I.users],
    ["Pipeline", I.pipeline],
    ["Interviews", I.calendar],
    ["Messages", I.msg],
    ["Analytics", I.chart],
    ["Team", I.team],
  ];
  const teacherItems = [
    ["Home", I.home],
    ["Jobs", I.briefcase],
    ["Applications", I.doc],
    ["Interviews", I.calendar],
    ["Messages", I.msg],
    ["Saved", I.bookmark],
  ];
  const items = role === "school" ? adminItems : teacherItems;
  const orgName = role === "school" ? "Green Valley School" : "Ananya Sharma";
  const orgSub = role === "school" ? "CBSE · Bengaluru" : "Mathematics · 6 yrs exp.";

  return (
    <aside className="eh-sidebar">
      <div style={{ padding: "4px 8px 14px" }}>
        <EduLogo/>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 12, background: "var(--eh-surface)", border: "1px solid var(--eh-border)", marginBottom: 8 }}>
        {role === "school"
          ? <SchoolLogo name={orgName} size={34}/>
          : <Avatar name={orgName} size="md"/>}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{orgName}</div>
          <div style={{ fontSize: 11.5, color: "var(--eh-text-3)" }}>{orgSub}</div>
        </div>
        <I.chev size={14}/>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(([label, Ico]) => <NavItem key={label} icon={Ico} label={label} active={label === active}/>)}
      </nav>

      <div className="eh-nav-section">Account</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem icon={I.settings} label="Settings"/>
        <NavItem icon={I.shield} label="Security"/>
      </nav>

      <div style={{ flex: 1 }}/>

      <div style={{ padding: 12, background: "var(--eh-primary-50)", borderRadius: 12, border: "1px solid var(--eh-primary-100)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--eh-primary-700)" }}>
          {role === "school" ? "Verify your school" : "Profile 80% complete"}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--eh-primary-700)", opacity: 0.8, marginTop: 4 }}>
          {role === "school" ? "Unlock unlimited job posts." : "Add qualifications to improve matches."}
        </div>
        <div className="eh-progress" style={{ marginTop: 10, background: "rgba(255,255,255,0.6)" }}>
          <div className="eh-progress-bar" style={{ width: role === "school" ? "60%" : "80%" }}/>
        </div>
      </div>
    </aside>
  );
};
window.Sidebar = Sidebar;

// ---------- Status pill helper ----------
const StatusPill = ({ status }) => {
  const map = {
    "New": ["info", "New"],
    "Reviewed": ["neutral", "Reviewed"],
    "Shortlisted": ["primary", "Shortlisted"],
    "Interview": ["warning", "Interview"],
    "Offer": ["success", "Offer sent"],
    "Hired": ["success", "Hired"],
    "Rejected": ["danger", "Rejected"],
    "Active": ["success", "Active"],
    "Draft": ["neutral", "Draft"],
    "Closed": ["danger", "Closed"],
    "Paused": ["warning", "Paused"],
    "Verified": ["success", "Verified"],
    "Pending": ["warning", "Pending"],
    "Applied": ["info", "Applied"],
    "Under review": ["neutral", "Under review"],
  };
  const [tone, label] = map[status] || ["neutral", status];
  return <span className={"eh-badge eh-badge-" + tone}><span className="eh-badge-dot"/>{label}</span>;
};
window.StatusPill = StatusPill;
