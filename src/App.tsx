import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  Crown, CheckCircle2, Clock, AlertTriangle, Circle, Plus, Users, Send, Trash2,
  Trophy, GraduationCap, User, CalendarDays, ShieldAlert, MessageSquare, Layers,
  ChevronLeft, ChevronRight, Sparkles, Link2, Search, X, ClipboardCheck,
  Star, Lock, EyeOff, FolderPlus, FilePlus2, ArrowLeft, ClipboardList,
} from "lucide-react";

/* ---------- palette ---------- */
const C = {
  ink: "#14162B", navy: "#1B2140", canvas: "#EDEFF4", surface: "#FFFFFF",
  line: "#DFE3EC", muted: "#6E7686", primary: "#2F54EB",
  green: "#159A5B", greenSoft: "#E3F6EC", amber: "#DE8500", amberSoft: "#FCF0DA",
  red: "#DC3A3A", redSoft: "#FBE5E5", gold: "#C79A2E", violet: "#7A5AF8", violetSoft: "#EFEBFE",
};
const AVATARS = ["#2F54EB", "#159A5B", "#DE8500", "#8B5CF6", "#0EA5E9", "#DB2777"];

/* ---------- date/time (분 단위) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const today = new Date();
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromNow = (n, hh = 23, mm = 59) => { const d = new Date(today); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hh)}:${pad(mm)}`; };
const fmt = (s) => { if (!s) return "미정"; const d = new Date(s); if (isNaN(d)) return s; return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtKor = (s) => { if (!s) return "미정"; const d = new Date(s); if (isNaN(d)) return s; return `${d.getMonth() + 1}월 ${d.getDate()}일, ${pad(d.getHours())}:${pad(d.getMinutes())}까지`; };
const dateKey = (s) => (s ? s.slice(0, 10) : "");
const hhmm = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function statusOf(t) {
  const due = t.due ? new Date(t.due) : null;
  if (t.submittedAt) { if (!due) return "ontime"; return new Date(t.submittedAt) <= due ? "ontime" : "late"; }
  if (!due) return "pending";
  return today <= due ? "pending" : "missed";
}
const SM = {
  ontime:  { label: "정시 제출", color: C.green, soft: C.greenSoft, Icon: CheckCircle2, w: 1 },
  late:    { label: "지연 제출", color: C.amber, soft: C.amberSoft, Icon: Clock,        w: 0.6 },
  pending: { label: "진행 중",   color: C.muted, soft: "#EFF1F5",  Icon: Circle,        w: 0 },
  missed:  { label: "미제출",     color: C.red,   soft: C.redSoft,   Icon: AlertTriangle, w: 0 },
};

/* ---------- illustrative AI estimator (NOT a real detector) ---------- */
function mockAiScore(text) {
  const t = (text || "").trim();
  if (!t) return 0;
  let s = 45;
  const ai = ["따라서", "또한", "뿐만 아니라", "결론적으로", "다양한", "살펴보면", "측면에서", "제공한다", "고려하여", "중요하다"];
  const human = ["찾아보니", "내 생각", "것 같", "정리하면", "솔직히", "근데", "우리가", "내가", "봤는데", "헷갈", "ㅋ"];
  ai.forEach((m) => { if (t.includes(m)) s += 8; });
  human.forEach((m) => { if (t.includes(m)) s -= 9; });
  if (t.length > 400) s += 10; if (t.length < 120) s -= 8;
  const sents = t.split(/[.!?。\n]/).filter((x) => x.trim().length > 0);
  if (sents.length >= 3) {
    const lens = sents.map((x) => x.trim().length);
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    const varc = lens.reduce((a, b) => a + Math.abs(b - avg), 0) / lens.length;
    if (varc < 10) s += 12;
  }
  return Math.max(5, Math.min(95, Math.round(s)));
}
const authFactor = (ai) => (ai == null ? 0 : ai < 30 ? 1 : ai <= 60 ? 0.7 : 0.3);
const isFlagged = (ai) => ai != null && ai > 60;

/* ---------- 정량 자동채점 (4개 항목, 0~100) ---------- */
function computeAuto(members, tasks, chat) {
  const msg = {};
  (chat || []).forEach((c) => { if (c.sender !== "sys") msg[c.sender] = (msg[c.sender] || 0) + 1; });
  const maxMsg = Math.max(1, ...members.map((m) => msg[m.id] || 0));
  return members.map((m) => {
    const mine = tasks.filter((t) => t.owner === m.id);
    const assigned = mine.length || 1;
    let ontime = 0, late = 0, subm = 0, authSum = 0, workPts = 0, flags = 0;
    mine.forEach((t) => {
      const st = statusOf(t);
      if (st === "ontime") ontime++; if (st === "late") late++;
      if (["ontime", "late"].includes(st)) { subm++; authSum += authFactor(t.ai); workPts += SM[st].w * authFactor(t.ai); }
      if (isFlagged(t.ai)) flags++;
    });
    const contribution = Math.round((workPts / assigned) * 100);
    const timeliness = Math.round(((ontime + 0.6 * late) / assigned) * 100);
    const collab = Math.round(((msg[m.id] || 0) / maxMsg) * 100);
    const quality = subm ? Math.round((authSum / subm) * 100) : 0;
    const overall = Math.round((contribution + timeliness + collab + quality) / 4);
    return { ...m, contribution, timeliness, collab, quality, overall, subm, assigned: mine.length, ontime, flags };
  }).sort((a, b) => b.overall - a.overall);
}
const AUTO_DIMS = [
  { k: "contribution", label: "기여도" }, { k: "timeliness", label: "성실성" },
  { k: "collab", label: "협업/소통" }, { k: "quality", label: "완성도" },
];
const PEER_DIMS = [
  { k: "contribution", label: "기여도", desc: "실제 산출물을 만들어냈는가" },
  { k: "timeliness", label: "성실성", desc: "기한·약속을 지켰는가" },
  { k: "collab", label: "협업/소통", desc: "소통하고 남을 도왔는가" },
  { k: "quality", label: "완성도", desc: "맡은 몫을 제대로 끝냈는가" },
];

/* ---------- seed ---------- */
const seedAssignments = [
  { id: "a1", title: "디지털비즈니스 팀프로젝트", desc: "관심 산업 1개를 골라 문제정의–시장조사–해결안–프로토타입까지. 최종 발표 12분.", finalDue: fromNow(24, 18, 0) },
];
const t0 = new Date(today); t0.setHours(9, 12, 0);
const t1 = new Date(today); t1.setHours(9, 20, 0);
const seedProjects = [
  {
    id: "p1", assignmentId: "a1", teamName: "5조 — 페어웤팀", finalDue: fromNow(24, 18, 0), assignmentTitle: "디지털비즈니스 팀프로젝트",
    members: [
      { id: "m1", name: "대희", role: "조장 · 총괄/자료조사", leader: true, color: AVATARS[0] },
      { id: "m2", name: "지선", role: "발표자료(PPT)", leader: false, color: AVATARS[1] },
      { id: "m3", name: "민준", role: "구현/코드", leader: false, color: AVATARS[2] },
      { id: "m4", name: "서연", role: "보고서 작성", leader: false, color: AVATARS[3] },
    ],
    tasks: [
      { id: "t1", title: "주제 선정 & 리서치 1차", owner: "m1", due: fromNow(-8, 18, 0), submittedAt: fromNow(-9, 21, 30), ai: 18 },
      { id: "t2", title: "경쟁사례 조사 5건", owner: "m1", due: fromNow(3, 23, 59), submittedAt: null, ai: null },
      { id: "t3", title: "발표 슬라이드 초안", owner: "m2", due: fromNow(-4, 12, 0), submittedAt: fromNow(-4, 9, 10), ai: 24 },
      { id: "t4", title: "슬라이드 디자인 완성", owner: "m2", due: fromNow(5, 18, 0), submittedAt: null, ai: null },
      { id: "t5", title: "프로토타입 코드 v1", owner: "m3", due: fromNow(-6, 22, 0), submittedAt: fromNow(-2, 2, 40), ai: 71 },
      { id: "t6", title: "기능 테스트", owner: "m3", due: fromNow(6, 18, 0), submittedAt: null, ai: null },
      { id: "t7", title: "보고서 목차/개요", owner: "m4", due: fromNow(-5, 23, 59), submittedAt: null, ai: null },
      { id: "t8", title: "보고서 본문 1장", owner: "m4", due: fromNow(2, 23, 59), submittedAt: null, ai: null },
    ],
    chat: [
      { id: "c1", sender: "m1", text: "이번 주 목표는 각자 자료 1차 정리까지예요. 마감 꼭 지켜주세요!", ts: t0.getTime() },
      { id: "c2", sender: "m2", text: "넵 PPT 초안 방금 올렸습니다", ts: t1.getTime() },
      { id: "c3", sender: "sys", text: "과업 등록: 보고서 목차/개요 · 담당 서연 · 마감 " + fmt(fromNow(-5, 23, 59)), ts: t1.getTime() + 60000 },
    ],
    peerEvals: [
      { from: "m2", to: "m1", scores: { contribution: 5, timeliness: 5, collab: 5, quality: 5 }, comment: "조장이 방향 다 잡아줌" },
      { from: "m3", to: "m1", scores: { contribution: 5, timeliness: 4, collab: 5, quality: 5 }, comment: "" },
      { from: "m4", to: "m1", scores: { contribution: 4, timeliness: 5, collab: 4, quality: 5 }, comment: "" },
      { from: "m1", to: "m2", scores: { contribution: 4, timeliness: 5, collab: 5, quality: 4 }, comment: "PPT 퀄 좋았음" },
      { from: "m3", to: "m2", scores: { contribution: 4, timeliness: 4, collab: 5, quality: 4 }, comment: "" },
      { from: "m4", to: "m2", scores: { contribution: 4, timeliness: 4, collab: 5, quality: 5 }, comment: "" },
      { from: "m1", to: "m3", scores: { contribution: 4, timeliness: 3, collab: 4, quality: 4 }, comment: "" },
      { from: "m2", to: "m3", scores: { contribution: 4, timeliness: 3, collab: 4, quality: 3 }, comment: "" },
      { from: "m4", to: "m3", scores: { contribution: 3, timeliness: 3, collab: 4, quality: 4 }, comment: "" },
      { from: "m1", to: "m4", scores: { contribution: 2, timeliness: 1, collab: 2, quality: 2 }, comment: "연락이 잘 안 됐음" },
      { from: "m2", to: "m4", scores: { contribution: 2, timeliness: 2, collab: 2, quality: 1 }, comment: "" },
      { from: "m3", to: "m4", scores: { contribution: 1, timeliness: 1, collab: 2, quality: 2 }, comment: "막판까지 미제출" },
    ],
  },
];

export default function App() {
  const [role, setRole] = useState("student");
  const [assignments, setAssignments] = useState(seedAssignments);
  const [projects, setProjects] = useState(seedProjects);
  const [sScreen, setSScreen] = useState("home");
  const [pScreen, setPScreen] = useState("home");
  const [activeProject, setActiveProject] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);

  const addAssignment = (a) => setAssignments((x) => [...x, { ...a, id: "a" + Date.now() }]);
  const addProject = (p) => { const np = { ...p, id: "p" + Date.now(), chat: [], peerEvals: [] }; setProjects((x) => [...x, np]); return np; };
  const patchProject = (id, fn) => setProjects((x) => x.map((p) => (p.id === id ? fn(p) : p)));

  return (
    <div style={{ background: C.canvas, minHeight: "100%", fontFamily: "'Pretendard',-apple-system,'Segoe UI','Malgun Gothic',sans-serif", color: C.ink }}>
      <div style={{ background: C.ink }}>
        <div className="mx-auto px-5 py-3.5 flex items-center justify-between flex-wrap gap-3" style={{ maxWidth: 1080 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: C.primary }}><ShieldAlert size={19} color="#fff" /></div>
            <div>
              <div style={{ fontWeight: 700 }}>페어웤 · FairWork</div>
              <div className="flex items-center gap-1" style={{ fontSize: 11, color: "#8CE0B8" }}><Link2 size={12} /> LMS 연동 · LTI 1.3</div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: C.navy }}>
            <RoleBtn active={role === "prof"} onClick={() => setRole("prof")} icon={<GraduationCap size={15} />}>교수</RoleBtn>
            <RoleBtn active={role === "student"} onClick={() => setRole("student")} icon={<User size={15} />}>학생</RoleBtn>
          </div>
        </div>
      </div>

      <div className="mx-auto px-5 py-5" style={{ maxWidth: 1080 }}>
        {role === "prof" ? (
          <ProfArea screen={pScreen} setScreen={setPScreen} assignments={assignments} addAssignment={addAssignment} projects={projects} active={activeAssignment} setActive={setActiveAssignment} />
        ) : (
          <StudentArea screen={sScreen} setScreen={setSScreen} assignments={assignments} projects={projects} addProject={addProject} patchProject={patchProject} active={activeProject} setActive={setActiveProject} />
        )}
      </div>
    </div>
  );
}

/* =================== PROFESSOR =================== */
function ProfArea({ screen, setScreen, assignments, addAssignment, projects, active, setActive }) {
  if (screen === "create") return <CreateAssignment onCancel={() => setScreen("home")} onDone={(a) => { addAssignment(a); setScreen("home"); }} />;
  if (screen === "assignment" && active) {
    const a = assignments.find((x) => x.id === active);
    const teams = projects.filter((p) => p.assignmentId === active);
    return (
      <div>
        <Back onClick={() => setScreen("home")}>과제 목록</Back>
        <h2 style={h2}>{a.title}</h2>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>{a.desc}</p>
        <div className="flex gap-2 mt-3 mb-2">
          <Meta k="최종 마감" v={fmt(a.finalDue)} /><Meta k="제출 팀" v={`${teams.length}팀`} />
        </div>
        {teams.length === 0 ? <Empty title="아직 생성된 팀 프로젝트가 없습니다" sub="학생이 이 과제로 프로젝트를 만들면 팀별 기여도가 여기 표시됩니다." /> :
          teams.map((p) => <ProfTeamCard key={p.id} p={p} />)}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 style={h2}>내가 개설한 과제</h2>
        <PrimaryBtn onClick={() => setScreen("create")}><FilePlus2 size={16} /> 과제 개설</PrimaryBtn>
      </div>
      {assignments.length === 0 ? <Empty title="개설한 과제가 없습니다" sub="'과제 개설'로 첫 과제를 만들어 보세요." /> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {assignments.map((a) => {
            const n = projects.filter((p) => p.assignmentId === a.id).length;
            return (
              <button key={a.id} onClick={() => { setActive(a.id); setScreen("assignment"); }} className="text-left rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-2 mb-2"><span className="rounded-md p-1.5" style={{ background: "#EEF1FE" }}><ClipboardList size={16} color={C.primary} /></span><span style={{ fontWeight: 700 }}>{a.title}</span></div>
                <div style={{ fontSize: 13, color: C.muted, minHeight: 36 }}>{a.desc}</div>
                <div className="flex items-center justify-between mt-3" style={{ fontSize: 12, color: C.muted }}><span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {fmt(a.finalDue)}</span><span className="inline-flex items-center gap-1">{n}팀 <ChevronRight size={14} /></span></div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
function ProfTeamCard({ p }) {
  const stats = useMemo(() => computeAuto(p.members, p.tasks, p.chat), [p]);
  const done = p.tasks.filter((t) => ["ontime", "late"].includes(statusOf(t))).length;
  const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
  const risk = stats.filter((s) => s.overall < 40 || s.flags > 0);
  const data = stats.map((s) => ({ name: s.name, v: s.overall, color: s.color }));
  return (
    <Card className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Layers size={16} color={C.primary} /><span style={{ fontWeight: 700 }}>{p.teamName}</span></div>
        <div className="flex items-center gap-2">
          {risk.length > 0 && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ fontSize: 12, fontWeight: 600, color: C.red, background: C.redSoft }}><AlertTriangle size={13} /> 검토 {risk.length}</span>}
          <span style={{ fontSize: 13, color: C.muted }}>진척 <b style={{ color: C.ink }}>{pct}%</b></span>
        </div>
      </div>
      <div style={{ width: "100%", height: 150 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 6, right: 42, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={44} tick={{ fontSize: 13, fill: C.ink, fontWeight: 600 }} />
            <Bar dataKey="v" radius={[0, 6, 6, 0]} barSize={20}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}<LabelList dataKey="v" position="right" formatter={(v) => `${v}점`} style={{ fontSize: 12, fill: C.muted, fontWeight: 600 }} /></Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
function CreateAssignment({ onCancel, onDone }) {
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [finalDue, setFinalDue] = useState(fromNow(21, 18, 0));
  return (
    <div style={{ maxWidth: 620 }}>
      <Back onClick={onCancel}>과제 목록</Back>
      <h2 style={h2}>과제 개설</h2>
      <Card className="mt-3">
        <Field label="과제명"><TextInput value={title} onChange={setTitle} placeholder="예) 디지털비즈니스 팀프로젝트" /></Field>
        <Field label="설명 · 제출 요건" mt><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="무엇을, 어떤 형태로 제출해야 하는지" className="w-full rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", resize: "vertical" }} /></Field>
        <Field label="최종 마감(날짜·시간)" mt><input type="datetime-local" value={finalDue} onChange={(e) => setFinalDue(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
        <div className="flex gap-2 mt-4"><PrimaryBtn onClick={() => title.trim() && onDone({ title: title.trim(), desc: desc.trim(), finalDue })}>개설하기</PrimaryBtn><GhostBtn onClick={onCancel}>취소</GhostBtn></div>
      </Card>
    </div>
  );
}

/* =================== STUDENT =================== */
function StudentArea({ screen, setScreen, assignments, projects, addProject, patchProject, active, setActive }) {
  if (screen === "create") return <CreateProjectWizard assignments={assignments} onCancel={() => setScreen("home")} onDone={(p) => { const a = assignments.find((x) => x.id === p.assignmentId); const np = addProject({ ...p, finalDue: a?.finalDue, assignmentTitle: a?.title }); setActive(np.id); setScreen("work"); }} />;
  if (screen === "work" && active) { const p = projects.find((x) => x.id === active); return <ProjectWorkspace p={p} patch={(fn) => patchProject(p.id, fn)} onBack={() => setScreen("home")} />; }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 style={h2}>과제 & 내 프로젝트</h2>
        <PrimaryBtn onClick={() => setScreen("create")}><FolderPlus size={16} /> 프로젝트 생성</PrimaryBtn>
      </div>
      {assignments.map((a) => {
        const mine = projects.filter((p) => p.assignmentId === a.id);
        return (
          <Card key={a.id} className="mb-3">
            <div className="flex items-center gap-2"><span className="rounded-md p-1.5" style={{ background: "#EEF1FE" }}><ClipboardList size={16} color={C.primary} /></span><span style={{ fontWeight: 700 }}>{a.title}</span><span className="ml-auto inline-flex items-center gap-1" style={{ fontSize: 12, color: C.muted }}><CalendarDays size={13} /> {fmt(a.finalDue)}</span></div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{a.desc}</div>
            <div className="mt-3">
              {mine.length === 0 ? <div style={{ fontSize: 13, color: C.muted }}>이 과제로 만든 프로젝트가 없습니다. '프로젝트 생성'을 눌러 팀을 꾸려보세요.</div> :
                mine.map((p) => (
                  <button key={p.id} onClick={() => { setActive(p.id); setScreen("work"); }} className="w-full text-left flex items-center gap-2 rounded-lg px-3 py-2.5 mt-2" style={{ border: `1px solid ${C.line}` }}>
                    <Layers size={15} color={C.primary} /><span style={{ fontWeight: 600, fontSize: 14 }}>{p.teamName}</span><span style={{ fontSize: 12, color: C.muted }}>· 조원 {p.members.length} · 과업 {p.tasks.length}</span><ChevronRight size={16} color={C.muted} className="ml-auto" />
                  </button>
                ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CreateProjectWizard({ assignments, onCancel, onDone }) {
  const [step, setStep] = useState(1);
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || "");
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const addMember = (name) => setMembers((ms) => [...ms, { id: "m" + Date.now() + Math.random().toString(36).slice(2, 5), name, role: "", leader: ms.length === 0, color: AVATARS[ms.length % AVATARS.length] }]);
  const rmMember = (id) => setMembers((ms) => { const left = ms.filter((m) => m.id !== id); if (left.length && !left.some((m) => m.leader)) left[0].leader = true; return [...left]; });
  const setRole = (id, role) => setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role } : m)));
  const setLeader = (id) => setMembers((ms) => ms.map((m) => ({ ...m, leader: m.id === id })));
  const addTask = () => setTasks((ts) => [...ts, { id: "t" + Date.now() + ts.length, title: "", owner: members[0]?.id || "", due: fromNow(7, 23, 59), submittedAt: null, ai: null }]);
  const setTask = (id, k, v) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const rmTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const canNext = step === 1 ? teamName.trim() && assignmentId : step === 2 ? members.length >= 1 : true;

  return (
    <div style={{ maxWidth: 720 }}>
      <Back onClick={onCancel}>취소</Back>
      <h2 style={h2}>프로젝트 생성</h2>
      <Stepper step={step} labels={["과제 선택 · 팀 이름", "조원 추가 · 역할", "타임테이블 · 마감(분 단위)"]} />
      <Card className="mt-3">
        {step === 1 && (
          <div>
            <Field label="어떤 과제의 프로젝트인가요?"><select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className="w-full rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{assignments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></Field>
            <Field label="팀 이름" mt><TextInput value={teamName} onChange={setTeamName} placeholder="예) 5조 — 페어웤팀" /></Field>
          </div>
        )}
        {step === 2 && (
          <div>
            <AddRow placeholder="조원 이름 입력 후 추가" onAdd={addMember} btn="조원 추가" />
            {members.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>첫 번째로 추가되는 사람이 조장이 됩니다(변경 가능).</div>}
            <div className="mt-3 grid gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }}>
                  <Avatar m={m} sm /><span style={{ fontWeight: 600, width: 54 }}>{m.name}</span>
                  <input value={m.role} onChange={(e) => setRole(m.id, e.target.value)} placeholder="역할 (예: 발표자료 제작)" className="flex-1 rounded-md px-2 py-1.5" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none" }} />
                  <button onClick={() => setLeader(m.id)} className="rounded-md px-2 py-1.5 inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: m.leader ? "#fff" : C.gold, background: m.leader ? C.gold : "#FBF3DC" }}><Crown size={13} /> 조장</button>
                  <button onClick={() => rmMember(m.id)} className="rounded-md p-1.5" style={{ color: C.muted }}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between"><div style={{ fontSize: 13, color: C.muted }}>과업마다 담당과 마감(날짜·시간)을 직접 정하세요.</div><GhostBtn onClick={addTask}><Plus size={15} /> 항목 추가</GhostBtn></div>
            {tasks.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>아직 없습니다. '항목 추가'로 타임테이블을 채워보세요(비워도 나중에 추가 가능).</div>}
            <div className="mt-3 grid gap-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }}>
                  <input value={t.title} onChange={(e) => setTask(t.id, "title", e.target.value)} placeholder="항목명" className="rounded-md px-2 py-1.5" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none", flex: 1, minWidth: 150 }} />
                  <select value={t.owner} onChange={(e) => setTask(t.id, "owner", e.target.value)} className="rounded-md px-2 py-1.5" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                  <input type="datetime-local" value={t.due} onChange={(e) => setTask(t.id, "due", e.target.value)} className="rounded-md px-2 py-1.5" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none" }} />
                  <button onClick={() => rmTask(t.id)} className="rounded-md p-1.5" style={{ color: C.muted }}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-5">
          {step > 1 ? <GhostBtn onClick={() => setStep(step - 1)}><ChevronLeft size={15} /> 이전</GhostBtn> : <span />}
          {step < 3 ? <PrimaryBtn onClick={() => canNext && setStep(step + 1)} disabled={!canNext}>다음 <ChevronRight size={15} /></PrimaryBtn> :
            <PrimaryBtn onClick={() => onDone({ assignmentId, teamName: teamName.trim(), members, tasks: tasks.filter((t) => t.title.trim()) })}>프로젝트 시작하기</PrimaryBtn>}
        </div>
      </Card>
    </div>
  );
}

/* =================== WORKSPACE =================== */
function ProjectWorkspace({ p, patch, onBack }) {
  const [tab, setTab] = useState("chat");
  const [meId, setMeId] = useState(p.members[0]?.id);
  const [submitFor, setSubmitFor] = useState(null);
  const me = p.members.find((m) => m.id === meId);

  const submit = (tid, text) => { const ai = mockAiScore(text); patch((pr) => ({ ...pr, tasks: pr.tasks.map((t) => (t.id === tid ? { ...t, submittedAt: nowLocal(), ai } : t)) })); setSubmitFor(null); return ai; };
  const addTask = (title, owner, due) => patch((pr) => ({ ...pr, tasks: [...pr.tasks, { id: "t" + Date.now(), title, owner, due, submittedAt: null, ai: null }], chat: [...pr.chat, { id: "c" + Date.now(), sender: "sys", text: `과업 등록: ${title} · 담당 ${pr.members.find((m) => m.id === owner)?.name} · 마감 ${fmt(due)}`, ts: Date.now() }] }));
  const sendMsg = (text) => patch((pr) => ({ ...pr, chat: [...pr.chat, { id: "c" + Date.now(), sender: meId, text, ts: Date.now() }] }));
  const submitPeer = (from, entries) => patch((pr) => ({ ...pr, peerEvals: [...pr.peerEvals.filter((e) => e.from !== from), ...entries.map((e) => ({ from, ...e }))] }));
  const setMemberRole = (id, role) => patch((pr) => ({ ...pr, members: pr.members.map((m) => (m.id === id ? { ...m, role } : m)) }));

  const TABS = [["chat", "채팅", MessageSquare], ["calendar", "캘린더", CalendarDays], ["timeline", "타임테이블", Clock], ["score", "기여도 분석", Trophy], ["peer", "동료평가", Star], ["team", "팀 구성", Users]];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Back onClick={onBack}>내 프로젝트</Back>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 12, color: C.muted, padding: "0 6px" }}>내 계정</span>
          {p.members.map((m) => <button key={m.id} onClick={() => setMeId(m.id)} className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, color: meId === m.id ? "#fff" : C.muted, background: meId === m.id ? C.primary : "transparent" }}>{m.name}</button>)}
        </div>
      </div>
      <h2 style={{ ...h2, marginTop: 8 }}>{p.teamName}</h2>
      <div className="flex gap-1 mt-2 flex-wrap">{TABS.map(([k, label, Icon]) => <Tab key={k} active={tab === k} onClick={() => setTab(k)} icon={<Icon size={16} />}>{label}</Tab>)}</div>
      <div className="mt-4">
        {tab === "chat" && <ChatTab members={p.members} chat={p.chat} me={me} finalDue={p.finalDue} sendMsg={sendMsg} addTask={addTask} />}
        {tab === "calendar" && <CalendarTab members={p.members} tasks={p.tasks} finalDue={p.finalDue} onPick={(t) => t.owner === meId && !t.submittedAt && setSubmitFor(t)} />}
        {tab === "timeline" && <TimelineTab members={p.members} tasks={p.tasks} me={me} finalDue={p.finalDue} onSubmit={(t) => setSubmitFor(t)} addTask={addTask} />}
        {tab === "score" && <ScoreTab members={p.members} tasks={p.tasks} chat={p.chat} meId={meId} />}
        {tab === "peer" && <PeerTab members={p.members} peerEvals={p.peerEvals} tasks={p.tasks} chat={p.chat} meId={meId} onSubmit={submitPeer} />}
        {tab === "team" && <TeamTab members={p.members} tasks={p.tasks} me={me} setRole={setMemberRole} />}
      </div>
      {submitFor && <SubmitModal task={submitFor} onClose={() => setSubmitFor(null)} onSubmit={submit} />}
    </div>
  );
}

/* ---------- CHAT ---------- */
function ChatTab({ members, chat, me, finalDue, sendMsg, addTask }) {
  const [text, setText] = useState(""); const [showTask, setShowTask] = useState(false);
  const [tt, setTt] = useState(""); const [to, setTo] = useState(members[0].id); const [td, setTd] = useState(fromNow(5, 23, 59));
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [chat]);
  const nameOf = (id) => members.find((m) => m.id === id)?.name;
  const colorOf = (id) => members.find((m) => m.id === id)?.color;
  const leader = members.find((m) => m.leader);
  const teamMembers = members.filter((m) => !m.leader);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.line}` }}><MessageSquare size={16} color={C.primary} /><span style={{ fontWeight: 700 }}>팀 채팅</span><span style={{ fontSize: 12, color: C.muted }}>· 대화·과업이 기록으로 남습니다</span></div>
      {/* 공지바 */}
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}`, background: "#FCFAFF" }}>
        <span className="inline-block rounded px-1.5 py-0.5 mb-1.5" style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: C.violet }}>공지</span>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          {leader && <div><b>팀장</b> · {leader.name} <span style={{ color: C.muted }}>({leader.role || "역할 미정"})</span></div>}
          {teamMembers.map((o) => <div key={o.id}><b>팀원</b> · {o.name} <span style={{ color: C.muted }}>({o.role || "역할 미정"})</span></div>)}
          <div className="inline-flex items-center gap-1" style={{ marginTop: 5, color: C.red, fontWeight: 700 }}><CalendarDays size={14} /> 프로젝트 마감일 : {fmtKor(finalDue)}</div>
        </div>
      </div>
      <div ref={ref} className="px-4 py-4 flex flex-col gap-3" style={{ height: 340, overflowY: "auto", background: "#F7F8FB" }}>
        {chat.map((c) => {
          if (c.sender === "sys") return <div key={c.id} className="self-center rounded-full px-3 py-1.5 inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: "#EAEEFE" }}><ClipboardCheck size={13} /> {c.text}</div>;
          const mine = c.sender === me?.id;
          return (
            <div key={c.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`} style={{ maxWidth: "78%", alignSelf: mine ? "flex-end" : "flex-start" }}>
              {!mine && <div className="flex items-center justify-center rounded-full" style={{ width: 30, height: 30, background: colorOf(c.sender), color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{nameOf(c.sender)?.[0]}</div>}
              <div>{!mine && <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{nameOf(c.sender)}</div>}
                <div className="flex items-end gap-1" style={{ flexDirection: mine ? "row-reverse" : "row" }}>
                  <div className="px-3 py-2" style={{ fontSize: 14, lineHeight: 1.4, background: mine ? C.primary : "#fff", color: mine ? "#fff" : C.ink, borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", border: mine ? "none" : `1px solid ${C.line}` }}>{c.text}</div>
                  <span style={{ fontSize: 10, color: C.muted }}>{hhmm(c.ts)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showTask && (
        <div className="px-4 py-3 flex flex-wrap items-end gap-2" style={{ background: C.violetSoft, borderTop: `1px solid ${C.line}` }}>
          <Field label="과업"><input value={tt} onChange={(e) => setTt(e.target.value)} placeholder="예) 시장조사 자료 2차" className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", width: 200 }} /></Field>
          <Field label="담당"><select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <Field label="마감(날짜·시간)"><input type="datetime-local" value={td} onChange={(e) => setTd(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
          <button onClick={() => { if (tt.trim()) { addTask(tt.trim(), to, td); setTt(""); setShowTask(false); } }} className="rounded-md px-3.5 py-2" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: C.violet }}>과업 등록</button>
          <button onClick={() => setShowTask(false)} className="rounded-md px-2 py-2" style={{ color: C.muted }}><X size={16} /></button>
        </div>
      )}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${C.line}` }}>
        <button onClick={() => setShowTask((v) => !v)} className="rounded-lg p-2.5 inline-flex items-center gap-1" style={{ background: C.violetSoft, color: C.violet, fontWeight: 600, fontSize: 13 }}><Plus size={16} /> 과업</button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { sendMsg(text.trim()); setText(""); } }} placeholder={`${me.name}(으)로 메시지 보내기`} className="flex-1 rounded-lg px-3 py-2.5" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} />
        <button onClick={() => { if (text.trim()) { sendMsg(text.trim()); setText(""); } }} className="rounded-lg p-2.5" style={{ background: C.primary, color: "#fff" }}><Send size={16} /></button>
      </div>
    </div>
  );
}

/* ---------- CALENDAR ---------- */
function CalendarTab({ members, tasks, finalDue, onPick }) {
  const [y, setY] = useState(today.getFullYear()); const [m, setM] = useState(today.getMonth());
  const [sel, setSel] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
  const first = new Date(y, m, 1).getDay(); const days = new Date(y, m + 1, 0).getDate();
  const finalKey = dateKey(finalDue);
  const byDay = useMemo(() => { const map = {}; tasks.forEach((t) => { const k = dateKey(t.due); if (k) (map[k] ||= []).push(t); }); return map; }, [tasks]);
  const move = (d) => { let nm = m + d, ny = y; if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; } setM(nm); setY(ny); };
  const selTasks = tasks.filter((t) => dateKey(t.due) === sel);
  const nameOf = (id) => members.find((x) => x.id === id)?.name; const colorOf = (id) => members.find((x) => x.id === id)?.color;
  const cells = []; for (let i = 0; i < first; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d);
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return (
    <div>
      <div className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3"><div style={{ fontWeight: 800, fontSize: 17 }}>{y}년 {m + 1}월</div><div className="flex gap-1"><button onClick={() => move(-1)} className="rounded-md p-1.5" style={{ border: `1px solid ${C.line}` }}><ChevronLeft size={16} /></button><button onClick={() => move(1)} className="rounded-md p-1.5" style={{ border: `1px solid ${C.line}` }}><ChevronRight size={16} /></button></div></div>
        <div className="grid grid-cols-7 gap-1">
          {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => <div key={w} className="text-center py-1" style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? C.red : i === 6 ? C.primary : C.muted }}>{w}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const ds = `${y}-${pad(m + 1)}-${pad(d)}`; const items = byDay[ds] || []; const isToday = ds === todayKey; const isSel = ds === sel;
            return (
              <button key={i} onClick={() => setSel(ds)} className="rounded-lg p-1.5 text-left" style={{ minHeight: 62, border: `1px solid ${isSel ? C.primary : C.line}`, background: isSel ? "#F3F5FE" : "#fff" }}>
                <div className="flex items-center justify-center rounded-full" style={{ width: 20, height: 20, fontSize: 12, fontWeight: 700, color: isToday ? "#fff" : C.ink, background: isToday ? C.primary : "transparent" }}>{d}</div>
                <div className="mt-1 flex flex-col gap-0.5">{ds === finalKey && <div className="truncate" style={{ fontSize: 10, padding: "1px 4px", borderRadius: 4, color: "#fff", background: C.violet, fontWeight: 700 }}>🚩 최종 마감</div>}{items.slice(0, 2).map((t) => { const s = SM[statusOf(t)]; return <div key={t.id} className="truncate" style={{ fontSize: 10, padding: "1px 4px", borderRadius: 4, color: s.color, background: s.soft }}>{t.title}</div>; })}{items.length > 2 && <div style={{ fontSize: 10, color: C.muted }}>+{items.length - 2}</div>}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl p-4 mt-3" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{sel.slice(5).replace("-", "/")} 일정</div>
        {sel === finalKey && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2" style={{ border: `1.5px solid ${C.violet}`, background: C.violetSoft }}>
            <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: "#fff", flexShrink: 0 }}>🚩</div>
            <div className="flex-1 min-w-0"><div style={{ fontWeight: 700, fontSize: 14, color: C.violet }}>프로젝트 최종 마감</div><div style={{ fontSize: 12, color: C.muted }}>{fmtKor(finalDue)}</div></div>
          </div>
        )}
        {selTasks.length === 0 && sel !== finalKey ? <div style={{ fontSize: 13, color: C.muted }}>이 날짜에 등록된 과업이 없습니다.</div> : (
          <div className="grid gap-2">{selTasks.map((t) => { const s = SM[statusOf(t)]; return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: s.soft, flexShrink: 0 }}><s.Icon size={16} color={s.color} /></div>
              <div className="flex-1 min-w-0"><div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">{t.title}</div><div className="inline-flex items-center gap-1" style={{ fontSize: 12, color: C.muted }}><span className="rounded-full" style={{ width: 7, height: 7, background: colorOf(t.owner) }} /> {nameOf(t.owner)} · {fmt(t.due)}</div></div>
              <span className="rounded-full px-2.5 py-1" style={{ fontSize: 12, fontWeight: 600, color: s.color, background: s.soft }}>{s.label}</span>
              {onPick && ["pending", "missed"].includes(statusOf(t)) && <button onClick={() => onPick(t)} className="rounded-md px-2.5 py-1.5" style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: C.green }}>제출</button>}
            </div>
          ); })}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- TIMELINE ---------- */
function TimelineTab({ members, tasks, me, finalDue, onSubmit, addTask }) {
  const [title, setTitle] = useState(""); const [owner, setOwner] = useState(me?.id); const [due, setDue] = useState(fromNow(7, 23, 59));
  const merged = [...tasks]; if (finalDue) merged.push({ id: "__final", title: "프로젝트 최종 마감", due: finalDue, isFinal: true });
  const sorted = merged.sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const nameOf = (id) => members.find((m) => m.id === id)?.name; const colorOf = (id) => members.find((m) => m.id === id)?.color;
  const canAdd = me?.leader;
  return (
    <div>
      {canAdd && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="항목"><TextInput value={title} onChange={setTitle} placeholder="예) 시장조사 자료 2차" w={200} /></Field>
            <Field label="담당"><select value={owner} onChange={(e) => setOwner(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
            <Field label="마감(날짜·시간)"><input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
            <PrimaryBtn onClick={() => { if (title.trim()) { addTask(title.trim(), owner || me.id, due); setTitle(""); } }}><Plus size={16} /> 추가</PrimaryBtn>
          </div>
        </Card>
      )}
      {sorted.length === 0 ? <Empty title="타임테이블이 비어 있습니다" sub={canAdd ? "위에서 항목과 마감을 추가하세요." : "조장이 항목을 추가하면 여기에 표시됩니다."} /> : (
        <div style={{ position: "relative", paddingLeft: 26 }}>
          <div style={{ position: "absolute", left: 9, top: 6, bottom: 6, width: 2, background: C.line }} />
          {sorted.map((t) => {
            if (t.isFinal) return (
              <div key={t.id} className="relative mb-2">
                <div style={{ position: "absolute", left: -23, top: 16, width: 16, height: 16, borderRadius: 99, background: C.violet, border: "3px solid #fff", boxShadow: `0 0 0 1px ${C.violet}` }} />
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.violetSoft, border: `1.5px solid ${C.violet}` }}>
                  <span style={{ fontSize: 16 }}>🚩</span>
                  <div className="flex-1 min-w-0"><div style={{ fontWeight: 700, fontSize: 14, color: C.violet }}>{t.title}</div><div className="inline-flex items-center gap-1" style={{ fontSize: 12, color: C.muted, marginTop: 2 }}><CalendarDays size={12} /> {fmtKor(t.due)}</div></div>
                </div>
              </div>
            );
            const st = statusOf(t); const s = SM[st]; const mineToSubmit = t.owner === me?.id && ["pending", "missed"].includes(st);
            return (
              <div key={t.id} className="relative mb-2">
                <div style={{ position: "absolute", left: -22, top: 16, width: 14, height: 14, borderRadius: 99, background: s.color, border: "3px solid #fff", boxShadow: `0 0 0 1px ${s.color}` }} />
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.surface, border: `1px solid ${isFlagged(t.ai) ? C.red : C.line}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span style={{ fontWeight: 600, fontSize: 14 }} className="truncate">{t.title}</span>{isFlagged(t.ai) && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 600, color: C.red, background: C.redSoft }}><Sparkles size={11} /> AI 검토</span>}</div>
                    <div className="flex items-center gap-2" style={{ fontSize: 12, color: C.muted, marginTop: 2 }}><span className="inline-flex items-center gap-1"><span className="rounded-full" style={{ width: 8, height: 8, background: colorOf(t.owner) }} />{nameOf(t.owner)}</span><span>·</span><span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {fmt(t.due)}</span>{t.ai != null && <><span>·</span><span>AI {t.ai}%</span></>}</div>
                  </div>
                  <span className="rounded-full px-2.5 py-1 inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: s.color, background: s.soft, whiteSpace: "nowrap" }}><s.Icon size={13} /> {s.label}</span>
                  {mineToSubmit && <button onClick={() => onSubmit(t)} className="rounded-md px-2.5 py-1.5" style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: C.green }}>제출</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- SCORE (기여도 분석) ---------- */
function ScoreTab({ members, tasks, chat, meId }) {
  const stats = useMemo(() => computeAuto(members, tasks, chat), [members, tasks, chat]);
  const data = stats.map((s) => ({ name: s.name, v: s.overall, color: s.color }));
  const risk = stats.filter((s) => s.overall < 40 || s.flags > 0);
  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-center justify-between"><SectionTitle>기여도 분석</SectionTitle>{risk.length > 0 && <span className="inline-flex items-center gap-1 rounded-full px-3 py-1" style={{ fontSize: 12, fontWeight: 600, color: C.red, background: C.redSoft }}><AlertTriangle size={14} /> 검토 대상 {risk.length}명</span>}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 12 }}>프로그램이 활동 데이터로 <b>기여도·성실성·협업/소통·완성도</b>를 0~100으로 자동 산출합니다. 아래 막대는 4개 항목의 평균(종합점수).</div>
        <div style={{ width: "100%", height: 210 }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 6, right: 44, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={44} tick={{ fontSize: 13, fill: C.ink, fontWeight: 600 }} />
              <Bar dataKey="v" radius={[0, 6, 6, 0]} barSize={26}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}<LabelList dataKey="v" position="right" formatter={(v) => `${v}점`} style={{ fontSize: 12, fill: C.muted, fontWeight: 600 }} /></Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))" }}>
        {stats.map((s, i) => {
          const flagged = s.overall < 40 || s.flags > 0, mine = s.id === meId;
          return (
            <Card key={s.id} style={{ borderColor: mine ? C.primary : flagged ? C.red : C.line, borderWidth: mine || flagged ? 2 : 1 }}>
              <div className="flex items-center gap-2 mb-3"><span style={{ fontSize: 13, fontWeight: 700, color: C.muted, width: 16 }}>{i + 1}</span><Avatar m={s} sm /><span style={{ fontWeight: 700 }}>{s.name}</span>{s.leader && <Crown size={13} color={C.gold} />}<span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: flagged ? C.red : s.color }}>{s.overall}</span></div>
              <div className="grid gap-1.5">{AUTO_DIMS.map((dm) => (
                <div key={dm.k} className="flex items-center gap-2"><span style={{ fontSize: 12, color: C.muted, width: 56 }}>{dm.label}</span><div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: C.canvas }}><div style={{ width: `${s[dm.k]}%`, height: "100%", background: flagged ? C.red : s.color }} /></div><span style={{ fontSize: 12, fontWeight: 600, width: 26, textAlign: "right" }}>{s[dm.k]}</span></div>
              ))}</div>
              {s.flags > 0 && <div className="inline-flex items-center gap-1 mt-2" style={{ fontSize: 11, fontWeight: 600, color: C.red }}><Sparkles size={11} /> AI 검토 {s.flags}건</div>}
            </Card>
          );
        })}
      </div>
      <div className="rounded-xl px-4 py-3 mt-4 flex items-start gap-2" style={{ background: "#fff", border: `1px solid ${C.line}`, fontSize: 13, color: C.muted }}><AlertTriangle size={16} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }} /><span><b style={{ color: C.ink }}>AI 추정치는 자동 감점이 아니라 '검토 대상' 표시용</b>입니다. 오탐 가능성이 있어 단독 근거로 불이익을 주지 않으며, 조장·교수 확인을 거칩니다. 데모용 추정이며 실제 서비스에서는 검증된 탐지 API로 대체됩니다.</span></div>
    </div>
  );
}

/* ---------- PEER (교수 전용 결과) ---------- */
function PeerTab({ members, peerEvals, tasks, chat, meId, onSubmit }) {
  const others = members.filter((m) => m.id !== meId);
  const already = peerEvals.some((p) => p.from === meId);
  const [draft, setDraft] = useState(() => { const d = {}; others.forEach((o) => { d[o.id] = { contribution: 0, timeliness: 0, collab: 0, quality: 0, comment: "" }; }); return d; });
  const setScore = (to, k, v) => setDraft((d) => ({ ...d, [to]: { ...d[to], [k]: v } }));
  const complete = others.every((o) => PEER_DIMS.every((dm) => draft[o.id][dm.k] > 0));
  const peerAvg = useMemo(() => { const map = {}; members.forEach((m) => { const recv = peerEvals.filter((p) => p.to === m.id); const dimAvg = {}; PEER_DIMS.forEach((dm) => { const v = recv.map((r) => r.scores[dm.k]).filter((x) => x != null); dimAvg[dm.k] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; }); map[m.id] = { dimAvg, comments: recv.map((r) => r.comment).filter((c) => c && c.trim()), count: recv.length }; }); return map; }, [peerEvals, members]);
  const auto = useMemo(() => computeAuto(members, tasks, chat), [members, tasks, chat]);
  // 교수 시점 판별: '내 계정'이 팀원이 아닐 때는 없지만, 여기서는 학생만 폼/교수 결과는 아래에서 별도 처리 불가 →
  // 이 통합본에서는 학생이 제출하고, 결과는 교수 화면(ProfArea)에서 봅니다. 여기서는 학생 제출 UI만 노출.
  return (
    <div>
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2" style={{ background: C.violetSoft, fontSize: 13, color: C.ink }}><Lock size={16} color={C.violet} style={{ flexShrink: 0 }} /><span><b>익명 동료평가</b> · 프로젝트 마지막 날 제출. <b>결과는 교수만</b> 열람하며 학생 화면에는 공개되지 않습니다.</span></div>
      {already ? (
        <Card style={{ padding: 28 }}><div className="flex flex-col items-center text-center"><div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, background: C.greenSoft }}><CheckCircle2 size={26} color={C.green} /></div><div style={{ fontWeight: 700, marginTop: 10 }}>동료평가 제출 완료</div><div style={{ fontSize: 13, color: C.muted, marginTop: 4, maxWidth: 380 }}>결과는 교수만 확인합니다. 팀원 간 감정이 상하지 않도록 학생 화면에는 공개되지 않아요.</div></div></Card>
      ) : (
        <div>
          {others.map((o) => (
            <Card key={o.id} className="mb-3">
              <div className="flex items-center gap-2 mb-3"><Avatar m={o} sm /><span style={{ fontWeight: 700 }}>{o.name}</span><span style={{ fontSize: 12, color: C.muted }}>{o.role}</span></div>
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
                {PEER_DIMS.map((dm) => (
                  <div key={dm.k} className="rounded-lg px-3 py-2" style={{ background: C.canvas }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{dm.label}</div><div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{dm.desc}</div>
                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((v) => <button key={v} onClick={() => setScore(o.id, dm.k, v)} className="flex items-center justify-center rounded-md" style={{ width: 30, height: 30, background: draft[o.id][dm.k] >= v ? C.violet : "#fff", color: draft[o.id][dm.k] >= v ? "#fff" : C.muted, border: `1px solid ${C.line}` }}><Star size={14} fill={draft[o.id][dm.k] >= v ? "#fff" : "none"} /></button>)}</div>
                  </div>
                ))}
              </div>
              <input value={draft[o.id].comment} onChange={(e) => setScore(o.id, "comment", e.target.value)} placeholder="한줄 코멘트 (선택, 익명)" className="w-full rounded-md px-3 py-2 mt-2" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none" }} />
            </Card>
          ))}
          <button disabled={!complete} onClick={() => onSubmit(meId, others.map((o) => ({ to: o.id, scores: { contribution: draft[o.id].contribution, timeliness: draft[o.id].timeliness, collab: draft[o.id].collab, quality: draft[o.id].quality }, comment: draft[o.id].comment })))} className="rounded-md px-4 py-2.5" style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: complete ? C.violet : "#C3BAF3" }}>익명으로 제출하기</button>
          {!complete && <span style={{ fontSize: 12, color: C.muted, marginLeft: 10 }}>모든 팀원의 4개 항목을 별점으로 매겨주세요.</span>}
        </div>
      )}
      <div className="rounded-xl px-4 py-3 mt-4" style={{ background: "#fff", border: `1px solid ${C.line}`, fontSize: 12, color: C.muted }}>교수 화면(상단 '교수' 전환 → 과제 → 팀)에서 프로그램 정량점수와 함께 동료평가 결과를 참고용으로 확인합니다.</div>
    </div>
  );
}

/* ---------- TEAM ---------- */
function TeamTab({ members, tasks, me, setRole }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
      {members.map((m) => {
        const editable = m.id === me?.id || me?.leader;
        return (
          <Card key={m.id}>
            <div className="flex items-start gap-3"><Avatar m={m} /><div className="flex-1"><div className="flex items-center gap-1"><span style={{ fontWeight: 700 }}>{m.name}</span>{m.leader && <Crown size={14} color={C.gold} />}</div>
              {editable ? <input value={m.role} onChange={(e) => setRole(m.id, e.target.value)} placeholder="역할 입력" className="w-full rounded-md px-2 py-1 mt-1" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none" }} /> : <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{m.role || "역할 미정"}</div>}
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>배정 {tasks.filter((t) => t.owner === m.id).length}건</div>
            </div></div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- SUBMIT MODAL ---------- */
function SubmitModal({ task, onClose, onSubmit }) {
  const [text, setText] = useState(""); const [result, setResult] = useState(null); const done = result != null;
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: "rgba(20,22,43,0.5)", zIndex: 50 }} onClick={onClose}>
      <div className="rounded-2xl w-full" style={{ maxWidth: 520, background: "#fff" }} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.line}` }}><div className="flex items-center gap-2"><Search size={16} color={C.primary} /><span style={{ fontWeight: 700 }}>자료 제출 · 이해도 확인</span></div><button onClick={onClose} style={{ color: C.muted }}><X size={18} /></button></div>
        <div className="px-5 py-4">
          <div style={{ fontSize: 13, color: C.muted }}>과업</div><div style={{ fontWeight: 700, marginBottom: 4 }}>{task.title}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>마감 {fmt(task.due)}</div>
          {!done ? (
            <>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 6 }}>찾은 자료를 <b>본인 언어로 정리</b>해 붙여넣어 주세요. 그대로 복붙하면 AI 추정치가 높게 잡혀 검토 대상이 됩니다.</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="예) 찾아보니 이 시장은 ~한 구조였고, 내 생각엔 ~ 때문에 우리 제품에 이렇게 적용하면 될 것 같다..." className="w-full rounded-lg px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", resize: "vertical" }} />
              <div className="flex gap-2 mt-3"><button onClick={() => setResult(onSubmit(task.id, text))} disabled={!text.trim()} className="rounded-md px-4 py-2" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: text.trim() ? C.green : "#A9C9B6" }}>제출하고 검사</button><button onClick={onClose} className="rounded-md px-4 py-2" style={{ fontSize: 14, fontWeight: 600, background: "#fff", border: `1px solid ${C.line}` }}>취소</button></div>
            </>
          ) : (
            <div className="rounded-xl px-4 py-4 text-center" style={{ background: isFlagged(result) ? C.redSoft : C.greenSoft }}><div style={{ fontSize: 13, color: C.muted }}>AI 작성 추정치</div><div style={{ fontSize: 32, fontWeight: 800, color: isFlagged(result) ? C.red : C.green }}>{result}%</div><div style={{ fontSize: 13, color: C.ink, marginTop: 6 }}>{isFlagged(result) ? "높음 → 검토 대상으로 표시됩니다. 본인 언어로 다시 정리하면 인정도가 올라갑니다." : "양호 → 본인 정리로 인정됩니다. 제출 완료!"}</div><button onClick={onClose} className="rounded-md px-4 py-2 mt-3" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: C.primary }}>확인</button></div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- primitives ---------- */
const h2 = { fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" };
function RoleBtn({ active, onClick, icon, children }) { return <button onClick={onClick} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5" style={{ fontSize: 13, fontWeight: 600, color: active ? C.ink : "#AEB4CC", background: active ? "#fff" : "transparent" }}>{icon}{children}</button>; }
function Tab({ active, onClick, icon, children }) { return <button onClick={onClick} className="inline-flex items-center gap-2 px-4 py-2.5" style={{ fontSize: 14, fontWeight: 600, color: active ? C.primary : C.muted, borderBottom: `2px solid ${active ? C.primary : "transparent"}` }}>{icon}{children}</button>; }
function Card({ children, className = "", style = {} }) { return <div className={`rounded-xl p-4 ${className}`} style={{ background: C.surface, border: `1px solid ${C.line}`, ...style }}>{children}</div>; }
function SectionTitle({ children }) { return <div style={{ fontWeight: 700, fontSize: 16 }}>{children}</div>; }
function PrimaryBtn({ children, onClick, disabled }) { return <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1 rounded-md px-3.5 py-2" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: disabled ? "#A9B2D8" : C.primary, cursor: disabled ? "default" : "pointer" }}>{children}</button>; }
function GhostBtn({ children, onClick }) { return <button onClick={onClick} className="inline-flex items-center gap-1 rounded-md px-3 py-2" style={{ fontSize: 14, fontWeight: 600, color: C.ink, background: "#fff", border: `1px solid ${C.line}` }}>{children}</button>; }
function Field({ label, children, mt }) { return <div style={{ marginTop: mt ? 14 : 0 }}><div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{label}</div>{children}</div>; }
function TextInput({ value, onChange, placeholder, w }) { return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", width: w || "100%" }} />; }
function AddRow({ placeholder, onAdd, btn }) { const [v, setV] = useState(""); return <div className="flex gap-2"><input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", width: 240 }} /><PrimaryBtn onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}><Plus size={16} /> {btn}</PrimaryBtn></div>; }
function Back({ children, onClick }) { return <button onClick={onClick} className="inline-flex items-center gap-1 mb-2" style={{ fontSize: 13, fontWeight: 600, color: C.muted }}><ArrowLeft size={15} /> {children}</button>; }
function Meta({ k, v }) { return <div className="rounded-lg px-3 py-2" style={{ background: "#fff", border: `1px solid ${C.line}` }}><div style={{ fontSize: 11, color: C.muted }}>{k}</div><div style={{ fontWeight: 700 }}>{v}</div></div>; }
function Empty({ title, sub }) { return <div className="rounded-xl flex flex-col items-center justify-center text-center px-6 py-12" style={{ background: "#fff", border: `1px dashed ${C.line}` }}><div style={{ fontWeight: 700 }}>{title}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{sub}</div></div>; }
function Avatar({ m, sm }) { const d = sm ? 28 : 40; return <div className="flex items-center justify-center rounded-full" style={{ width: d, height: d, background: m.color, color: "#fff", fontWeight: 700, fontSize: sm ? 12 : 15, flexShrink: 0 }}>{m.name[0]}</div>; }
function Stepper({ step, labels }) { return <div className="flex items-center gap-2 mt-3">{labels.map((l, i) => { const n = i + 1, active = n === step, done = n < step; return <React.Fragment key={i}><div className="flex items-center gap-2"><div className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, fontSize: 12, fontWeight: 700, color: active || done ? "#fff" : C.muted, background: active ? C.primary : done ? C.green : "#E4E7EF" }}>{n}</div><span style={{ fontSize: 13, fontWeight: 600, color: active ? C.ink : C.muted }}>{l}</span></div>{i < labels.length - 1 && <div style={{ flex: 1, height: 2, background: C.line, minWidth: 12 }} />}</React.Fragment>; })}</div>; }
