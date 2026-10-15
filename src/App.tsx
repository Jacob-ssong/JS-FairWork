// @ts-nocheck
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  Crown, CheckCircle2, Clock, AlertTriangle, Circle, Plus, Users, Send, Trash2,
  Trophy, GraduationCap, User, CalendarDays, ShieldAlert, MessageSquare, Layers,
  ChevronLeft, ChevronRight, Sparkles, Link2, Search, X, ClipboardCheck,
  Star, Lock, EyeOff, FolderPlus, FilePlus2, ArrowLeft, ClipboardList,
  Scale, Check, Bell, BellRing, BadgeCheck,
} from "lucide-react";

/* ---------- palette ---------- */
const C = {
  ink: "#14162B", navy: "#1B2140", canvas: "#EDEFF4", surface: "#FFFFFF",
  line: "#DFE3EC", muted: "#6E7686", primary: "#2F54EB",
  green: "#159A5B", greenSoft: "#E3F6EC", amber: "#DE8500", amberSoft: "#FCF0DA",
  red: "#DC3A3A", redSoft: "#FBE5E5", gold: "#C79A2E", violet: "#7A5AF8", violetSoft: "#EFEBFE",
};
const AVATARS = ["#2F54EB", "#159A5B", "#DE8500", "#8B5CF6", "#0EA5E9", "#DB2777"];

/* ---------- design tokens: 그림자·그라데이션 ---------- */
const SH = {
  card: "0 1px 2px rgba(20,22,43,.04), 0 6px 20px rgba(20,22,43,.05)",
  pop: "0 10px 30px rgba(20,22,43,.14)",
  btn: "0 4px 12px rgba(47,84,235,.28)",
};
const GRAD = {
  primary: "linear-gradient(135deg,#4262F0 0%,#2F54EB 100%)",
  hero: "linear-gradient(135deg,#1B2250 0%,#2F54EB 140%)",
  header: "linear-gradient(135deg,#14162B 0%,#1B2250 100%)",
  canvas: "linear-gradient(180deg,#E8ECF7 0px,#F3F4F9 380px)",
};
// 전역 스타일: 포커스 링 · 호버 · 화면 전환 애니메이션 (인라인 스타일로는 표현 불가한 것들)
const GLOBAL_CSS = `
*{-webkit-tap-highlight-color:transparent}
body{margin:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
button{font-family:inherit;transition:transform .12s ease,box-shadow .18s ease,background-color .18s ease,border-color .18s ease,color .18s ease,opacity .18s ease}
button:not(:disabled):active{transform:scale(.97)}
button:disabled{cursor:not-allowed}
input,select,textarea{font-family:inherit;transition:border-color .15s ease,box-shadow .15s ease}
input:focus,select:focus,textarea:focus{border-color:#2F54EB !important;box-shadow:0 0 0 3px rgba(47,84,235,.16)}
.fw-lift{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.fw-lift:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(20,22,43,.12) !important;border-color:#C9D2F5 !important}
.fw-ghost:hover{background:#F4F6FC !important}
.fw-row:hover{background:#F6F8FF !important;border-color:#C9D2F5 !important}
.fw-tab:not(.is-active):hover{background:#F2F4FA}
.fw-fade{animation:fwFade .3s ease both}
@keyframes fwFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.fw-bar{transition:width .7s cubic-bezier(.2,.8,.2,1)}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:#D5D9E5;border-radius:99px}
@media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}
`;

/* ---------- date/time (분 단위) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const today = new Date();
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromNow = (n, hh = 23, mm = 59) => { const d = new Date(today); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hh)}:${pad(mm)}`; };
const fmt = (s) => { if (!s) return "미정"; const d = new Date(s); if (isNaN(d)) return s; return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtKor = (s) => { if (!s) return "미정"; const d = new Date(s); if (isNaN(d)) return s; return `${d.getMonth() + 1}월 ${d.getDate()}일, ${pad(d.getHours())}:${pad(d.getMinutes())}까지`; };
const inHours = (h) => { const d = new Date(Date.now() + h * 3600000); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
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

/* ---------- 정량 자동채점: 근거는 '정시 제출 여부' + 'AI 복붙 여부' 두 가지뿐 (개인별 100점제) ---------- */
// 마감이 지났거나 제출된 과업만 집계합니다(아직 진행 중인 과업은 점수에 넣지 않음).
function computeAuto(members, tasks) {
  return members.map((m) => {
    const mine = tasks.filter((t) => t.owner === m.id);
    let judged = 0, ontime = 0, late = 0, subm = 0, authSum = 0, workPts = 0, flags = 0;
    mine.forEach((t) => {
      const st = statusOf(t);
      if (st === "pending") return;
      judged++;
      if (st === "ontime") ontime++; if (st === "late") late++;
      if (["ontime", "late"].includes(st)) { subm++; authSum += authFactor(t.ai); workPts += SM[st].w * authFactor(t.ai); }
      if (isFlagged(t.ai)) flags++;
    });
    const den = judged || 1;
    const contribution = Math.round((workPts / den) * 100);
    const timeliness = Math.round(((ontime + 0.6 * late) / den) * 100);
    const quality = subm ? Math.round((authSum / subm) * 100) : 0;
    const overall = judged ? Math.round((contribution + timeliness + quality) / 3) : 0;
    return { ...m, contribution, timeliness, quality, overall, subm, assigned: judged, total: mine.length, ontime, flags };
  }).sort((a, b) => b.overall - a.overall);
}
const isRisk = (s) => s.flags > 0 || (s.assigned > 0 && s.overall < 40);
const AUTO_DIMS = [
  { k: "contribution", label: "기여도" }, { k: "timeliness", label: "정시 제출" }, { k: "quality", label: "AI 독자성" },
];
const AI_LABEL = (ai) => (ai == null ? "—" : ai < 30 ? "독자적 작성 추정" : ai <= 60 ? "일부 의심" : "AI 복붙 의심");
const PEER_DIMS = [
  { k: "contribution", label: "기여도", desc: "실제 산출물을 만들어냈는가" },
  { k: "timeliness", label: "성실성", desc: "기한·약속을 지켰는가" },
  { k: "collab", label: "협업/소통", desc: "소통하고 남을 도왔는가" },
  { k: "quality", label: "완성도", desc: "맡은 몫을 제대로 끝냈는가" },
];

/* ---------- seed ---------- */
// 학교 재학생 명부(가정) — 교수는 여기서 체크해서 과목 수강생을 등록합니다. 직접 타이핑하지 않습니다.
const SEED_STUDENTS = [
  { sid: "2026230006", name: "대희" }, { sid: "2026230012", name: "종성" },
  { sid: "2026230021", name: "유진" }, { sid: "2026230034", name: "서연" },
  { sid: "2026230047", name: "하준" }, { sid: "2026230055", name: "유나" },
  { sid: "2026230063", name: "도윤" }, { sid: "2026230078", name: "예린" },
  { sid: "2026230081", name: "준서" }, { sid: "2026230093", name: "채원" },
  { sid: "2026230104", name: "시우" }, { sid: "2026230118", name: "다인" },
];
const seedSubjects = [
  { id: "sub1", name: "마케팅관리", roster: SEED_STUDENTS.slice(0, 8) },
];
const seedAssignments = [
  { id: "a1", subjectId: "sub1", title: "마케팅 관리 과제", desc: "팀 프로젝트 주제를 정해 외부·내부 환경 분석, 제품 시연, 가격 설정까지 정리해 발표합니다.", finalDue: fromNow(5, 23, 59) },
];
const ROLE_PRESETS = ["팀장", "자료조사", "자료취합", "문서작성", "발표"];
const t0 = new Date(today); t0.setHours(9, 12, 0);
const t1 = new Date(today); t1.setHours(9, 20, 0);
// ※ 시연용 샘플 데이터입니다(마감일은 접속 시각 기준으로 자동 계산).
const seedProjects = [
  {
    id: "p1", assignmentId: "a1", teamName: "안왔조", finalDue: fromNow(5, 23, 59), assignmentTitle: "마케팅 관리 과제", ended: false, sample: true,
    members: [
      { id: "m1", name: "종성", role: "자료조사", leader: false, color: AVATARS[0] },
      { id: "m2", name: "유진", role: "문서작성", leader: false, color: AVATARS[1] },
      { id: "m3", name: "대희", role: "팀장 · 발표", leader: true, color: AVATARS[2] },
    ],
    tasks: [
      { id: "t1", title: "주제 선정 & 시장 리서치", owner: "m1", due: fromNow(-8, 18, 0), submittedAt: fromNow(-9, 21, 30), ai: 15 },
      { id: "t2", title: "경쟁사례 조사 5건", owner: "m1", due: fromNow(-3, 23, 59), submittedAt: fromNow(-4, 20, 10), ai: 42 },
      { id: "t3", title: "자료조사 (환경분석 근거)", owner: "m1", due: fromNow(5, 18, 0), submittedAt: null, ai: null },
      { id: "t4", title: "발표 슬라이드 초안", owner: "m2", due: fromNow(-6, 12, 0), submittedAt: fromNow(-6, 9, 10), ai: 28 },
      { id: "t5", title: "설문지 설계", owner: "m2", due: fromNow(-3, 12, 0), submittedAt: fromNow(-2, 1, 40), ai: 68 },
      { id: "t6", title: "슬라이드 작성 (최종)", owner: "m2", due: fromNow(3, 18, 0), submittedAt: null, ai: null },
      { id: "t7", title: "프로토타입 기획서", owner: "m3", due: fromNow(-7, 18, 0), submittedAt: fromNow(-7, 14, 0), ai: 18 },
      { id: "t8", title: "시연 시나리오 작성", owner: "m3", due: fromNow(-4, 18, 0), submittedAt: fromNow(-4, 11, 30), ai: 45 },
      { id: "t9", title: "가격 설정 근거 정리", owner: "m3", due: fromNow(-2, 12, 0), submittedAt: fromNow(-2, 15, 20), ai: 25 },
      { id: "t10", title: "발표 연습", owner: "m3", due: inHours(20), submittedAt: null, ai: null },
    ],
    chat: [
      { id: "c1", sender: "m3", text: "이번 주 안에 각자 맡은 자료 정리까지 끝내요. 마감 꼭 지켜주세요!", ts: t0.getTime() },
      { id: "c2", sender: "m1", text: "넵 경쟁사례 조사 올렸습니다", ts: t1.getTime() },
      { id: "c3", sender: "sys", text: "과업 등록: 발표 연습 · 담당 대희 · 마감 " + fmt(inHours(20)), ts: t1.getTime() + 60000 },
    ],
    peerEvals: [],
  },
];

export default function App() {
  const [role, setRole] = useState("student");
  const [subjects, setSubjects] = useState(seedSubjects);
  const [assignments, setAssignments] = useState(seedAssignments);
  const [projects, setProjects] = useState(seedProjects);
  const [sScreen, setSScreen] = useState("home");
  const [pScreen, setPScreen] = useState("home");
  const [activeProject, setActiveProject] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);

  const addSubject = (name) => setSubjects((x) => [...x, { id: "sub" + Date.now(), name, roster: [] }]);
  const rmSubject = (id) => setSubjects((x) => x.filter((s) => s.id !== id));
  const toggleSubjectRoster = (subjectId, stu) => setSubjects((x) => x.map((s) => {
    if (s.id !== subjectId) return s;
    const on = s.roster.some((r) => r.sid === stu.sid);
    return { ...s, roster: on ? s.roster.filter((r) => r.sid !== stu.sid) : [...s.roster, stu] };
  }));
  const addAssignment = (a) => setAssignments((x) => [...x, { ...a, id: "a" + Date.now() }]);
  const addProject = (p) => { const np = { ...p, id: "p" + Date.now(), chat: [], peerEvals: [] }; setProjects((x) => [...x, np]); return np; };
  const patchProject = (id, fn) => setProjects((x) => x.map((p) => (p.id === id ? fn(p) : p)));

  return (
    <div style={{ background: GRAD.canvas, minHeight: "100vh", fontFamily: "'Pretendard Variable','Pretendard',-apple-system,'Segoe UI','Malgun Gothic',sans-serif", color: C.ink }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background: GRAD.header, position: "sticky", top: 0, zIndex: 30, boxShadow: "0 2px 18px rgba(20,22,43,.22)" }}>
        <div className="mx-auto px-5 py-3 flex items-center justify-between gap-3" style={{ maxWidth: 1080 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 38, height: 38, background: "linear-gradient(135deg,#5B78FF,#2F54EB)", boxShadow: "0 4px 14px rgba(47,84,235,.5)" }}><Scale size={20} color="#fff" /></div>
            <div>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 16, letterSpacing: "-0.02em", lineHeight: 1.2 }}>페어웤 <span style={{ fontWeight: 500, opacity: 0.55, fontSize: 13 }}>FairWork</span></div>
              <div className="flex items-center gap-1" style={{ fontSize: 11, color: "#8CE0B8", marginTop: 2 }}><Link2 size={11} /> LMS 연동 · LTI 1.3</div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" }}>
            <RoleBtn active={role === "prof"} onClick={() => setRole("prof")} icon={<GraduationCap size={15} />}>교수</RoleBtn>
            <RoleBtn active={role === "student"} onClick={() => setRole("student")} icon={<User size={15} />}>학생</RoleBtn>
          </div>
        </div>
      </div>

      <div key={`${role}-${role === "prof" ? pScreen : sScreen}`} className="mx-auto px-5 py-6 fw-fade" style={{ maxWidth: 1080 }}>
        {role === "prof" ? (
          <ProfArea screen={pScreen} setScreen={setPScreen} subjects={subjects} addSubject={addSubject} rmSubject={rmSubject} toggleSubjectRoster={toggleSubjectRoster} assignments={assignments} addAssignment={addAssignment} projects={projects} active={activeAssignment} setActive={setActiveAssignment} />
        ) : (
          <StudentArea screen={sScreen} setScreen={setSScreen} subjects={subjects} assignments={assignments} projects={projects} addProject={addProject} patchProject={patchProject} active={activeProject} setActive={setActiveProject} />
        )}
      </div>
    </div>
  );
}

/* =================== PROFESSOR =================== */
function ProfArea({ screen, setScreen, subjects, addSubject, rmSubject, toggleSubjectRoster, assignments, addAssignment, projects, active, setActive }) {
  const [rosterOpenFor, setRosterOpenFor] = useState(null);
  const subjectName = (id) => subjects.find((s) => s.id === id)?.name || "과목 미지정";
  if (screen === "subjects") {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Back onClick={() => setScreen("home")}>과제 목록</Back>
        <h2 style={h2}>과목 관리</h2>
        <Card className="mt-3">
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>과제 개설 시 선택할 과목을 먼저 등록해두세요.</div>
          <AddRow placeholder="과목명 입력 (예) 디지털경영학과 캡스톤디자인" onAdd={addSubject} btn="과목 등록" />
          {subjects.length === 0 ? <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>등록된 과목이 없습니다.</div> : (
            <div className="mt-3 grid gap-2">
              {subjects.map((s) => {
                const openRoster = rosterOpenFor === s.id;
                return (
                  <div key={s.id} className="rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }}>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={15} color={C.muted} />
                      <span className="flex-1" style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>수강생 {s.roster.length}명</span>
                      <button onClick={() => setRosterOpenFor(openRoster ? null : s.id)} className="rounded-md px-2 py-1.5" style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: "#EEF1FE" }}>{openRoster ? "닫기" : "수강생 등록"}</button>
                      <button onClick={() => rmSubject(s.id)} className="rounded-md p-1.5" style={{ color: C.muted }}><Trash2 size={15} /></button>
                    </div>
                    {openRoster && (
                      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>학교 재학생 명부에서 이 과목 수강생을 체크하세요(직접 입력 없이 클릭으로 등록·해제).</div>
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))" }}>
                          {SEED_STUDENTS.map((stu) => {
                            const checked = s.roster.some((r) => r.sid === stu.sid);
                            return (
                              <label key={stu.sid} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ fontSize: 13, background: checked ? "#EEF1FE" : "#fff", border: `1px solid ${checked ? C.primary : C.line}`, cursor: "pointer" }}>
                                <input type="checkbox" checked={checked} onChange={() => toggleSubjectRoster(s.id, stu)} style={{ accentColor: C.primary }} />
                                {stu.name} <span style={{ color: C.muted, fontSize: 11 }}>{stu.sid}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }
  if (screen === "create") return <CreateAssignment subjects={subjects} onManageSubjects={() => setScreen("subjects")} onCancel={() => setScreen("home")} onDone={(a) => { addAssignment(a); setScreen("home"); }} />;
  if (screen === "assignment" && active) {
    const a = assignments.find((x) => x.id === active);
    const teams = projects.filter((p) => p.assignmentId === active);
    return (
      <div>
        <Back onClick={() => setScreen("home")}>과제 목록</Back>
        <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 mb-1" style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: "#EEF1FE" }}><GraduationCap size={12} /> {subjectName(a.subjectId)}</div>
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
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
        <StatTile icon={<ClipboardList />} label="개설한 과제" value={assignments.length} />
        <StatTile icon={<Users />} label="참여 팀" value={projects.length} tone="green" />
        <StatTile icon={<AlertTriangle />} label="확인이 필요한 팀원" value={projects.reduce((n, p) => n + computeAuto(p.members, p.tasks).filter((s) => isRisk(s)).length, 0)} tone="red" />
      </div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 style={h2}>내가 개설한 과제</h2>
        <div className="flex gap-2">
          <GhostBtn onClick={() => setScreen("subjects")}><GraduationCap size={15} /> 과목 관리</GhostBtn>
          <PrimaryBtn onClick={() => setScreen("create")}><FilePlus2 size={16} /> 과제 개설</PrimaryBtn>
        </div>
      </div>
      {assignments.length === 0 ? <Empty title="개설한 과제가 없습니다" sub="'과제 개설'로 첫 과제를 만들어 보세요." /> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {assignments.map((a) => {
            const n = projects.filter((p) => p.assignmentId === a.id).length;
            return (
              <button key={a.id} onClick={() => { setActive(a.id); setScreen("assignment"); }} className="fw-lift text-left rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
                <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mb-2" style={{ fontSize: 11, fontWeight: 600, color: C.primary, background: "#EEF1FE" }}><GraduationCap size={11} /> {subjectName(a.subjectId)}</div>
                <div className="flex items-center gap-2 mb-2"><span className="rounded-md p-1.5" style={{ background: "#EEF1FE" }}><ClipboardList size={16} color={C.primary} /></span><span style={{ fontWeight: 700 }}>{a.title}</span></div>
                <div style={{ fontSize: 13, color: C.muted, minHeight: 36 }}>{a.desc}</div>
                <div className="flex items-center justify-between mt-3" style={{ fontSize: 12, color: C.muted }}><span className="inline-flex items-center gap-2"><CalendarDays size={13} /> {fmt(a.finalDue)} <DDayChip due={a.finalDue} /></span><span className="inline-flex items-center gap-1">{n}팀 <ChevronRight size={14} /></span></div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
/* ---------- 교수 전용: 정량 근거 + 동료평가(정성) 교차 확인 (팀원끼리는 열람 불가) ---------- */
function PeerCrossCheck({ p, stats }) {
  const [openId, setOpenId] = useState(null);
  const evals = p.peerEvals || [];
  const submitters = new Set(evals.map((e) => e.from)).size;
  const peerOf = (id) => {
    const recv = evals.filter((e) => e.to === id);
    if (!recv.length) return null;
    const vals = recv.flatMap((r) => PEER_DIMS.map((dm) => r.scores[dm.k]).filter((x) => x != null));
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { avg: Math.round(avg * 10) / 10, score: Math.round(avg * 20), n: recv.length, comments: recv.map((r) => r.comment).filter((c) => c && c.trim()), dims: PEER_DIMS.map((dm) => ({ label: dm.label, v: Math.round((recv.reduce((a, r) => a + (r.scores[dm.k] || 0), 0) / recv.length) * 10) / 10 })) };
  };
  return (
    <div className="rounded-xl p-3 mt-3" style={{ background: "#F7F8FC", border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-1.5 flex-wrap mb-1" style={{ fontSize: 13, fontWeight: 800 }}><Lock size={14} color={C.violet} /> 교수 전용 근거 자료
        <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, color: p.ended ? C.green : C.muted, background: p.ended ? C.greenSoft : "#E8EBF4" }}>{p.ended ? `프로젝트 종료 · 동료평가 ${submitters}/${p.members.length}명 제출` : "프로젝트 진행 중"}</span>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>정량 점수(정시 제출·AI 복붙 점검)와 종료 후 익명 동료평가(정성)를 나란히 봅니다. 동료평가는 팀원끼리 볼 수 없습니다.</div>
      {!p.ended && evals.length === 0 && <div className="rounded-lg px-3 py-2" style={{ fontSize: 12, color: C.muted, background: "#fff", border: `1px dashed ${C.line}` }}>조장이 프로젝트를 종료하면 팀원이 동료평가를 제출하고, 그 결과가 여기에 표시됩니다.</div>}
      {(p.ended || evals.length > 0) && stats.map((s) => {
        const pe = peerOf(s.id), open = openId === s.id;
        const gap = pe && s.assigned > 0 && Math.abs(s.overall - pe.score) >= 25;
        return (
          <div key={s.id} className="rounded-lg mb-1.5" style={{ background: "#fff", border: `1px solid ${gap ? C.amber : C.line}` }}>
            <button onClick={() => setOpenId(open ? null : s.id)} className="w-full flex items-center gap-2 flex-wrap px-3 py-2 text-left">
              <Avatar m={s} sm /><span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: C.muted }}>정량 <b style={{ color: C.ink }}>{s.assigned ? s.overall : "-"}점</b></span>
              <span style={{ fontSize: 12, color: C.muted }}>동료평가 <b style={{ color: C.ink }}>{pe ? `${pe.avg}/5 (${pe.score}점 환산)` : "미제출"}</b></span>
              {gap && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, color: "#9A5D00", background: C.amberSoft }}><AlertTriangle size={11} /> 정량·정성 차이 큼 — 확인 권장</span>}
              <span className="ml-auto inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{open ? "닫기" : "근거 보기"} <ChevronRight size={12} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .18s" }} /></span>
            </button>
            {open && (
              <div className="px-3 pb-3 pt-1" style={{ borderTop: `1px solid ${C.line}` }}>
                <div className="mt-2 mb-1.5" style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>① 정량 근거 (정시 제출 · AI 복붙)</div>
                <EvidenceList member={s} tasks={p.tasks} />
                <div className="mt-3 mb-1.5" style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>② 동료평가 (익명)</div>
                {pe ? (
                  <div>
                    <div className="flex gap-1.5 flex-wrap">{pe.dims.map((d) => <span key={d.label} className="rounded-md px-2 py-1" style={{ fontSize: 12, background: C.violetSoft, color: C.violet, fontWeight: 600 }}>{d.label} {d.v}</span>)}</div>
                    {pe.comments.length > 0 && <div className="mt-2 grid gap-1">{pe.comments.map((c, i) => <div key={i} style={{ fontSize: 12, color: C.ink }}>• “{c}”</div>)}</div>}
                  </div>
                ) : <div style={{ fontSize: 12, color: C.muted }}>아직 제출된 동료평가가 없습니다.</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function ProfTeamCard({ p }) {
  const stats = useMemo(() => computeAuto(p.members, p.tasks), [p]);
  const done = p.tasks.filter((t) => ["ontime", "late"].includes(statusOf(t))).length;
  const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
  const risk = stats.filter((s) => isRisk(s));
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
      <div className="mb-3"><ProgressBar pct={pct} /></div>
      <div style={{ width: "100%", height: 150 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 6, right: 42, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={44} tick={{ fontSize: 13, fill: C.ink, fontWeight: 600 }} />
            <Bar dataKey="v" radius={[0, 6, 6, 0]} barSize={20}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}<LabelList dataKey="v" position="right" formatter={(v) => `${v}점`} style={{ fontSize: 12, fill: C.muted, fontWeight: 600 }} /></Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <PeerCrossCheck p={p} stats={stats} />
      {risk.length > 0 && (
        <div className="rounded-xl p-3 mt-3" style={{ background: C.redSoft, border: "1px solid #F3C6C6" }}>
          <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: 13, fontWeight: 800, color: C.red }}><AlertTriangle size={14} /> 교수님 확인이 필요한 팀원</div>
          {risk.map((s) => (
            <div key={s.id} className="flex items-center gap-2 py-1" style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>{s.name}</span>
              <span style={{ color: C.muted }}>{s.flags > 0 ? `AI 복붙 의심 제출 ${s.flags}건` : ""}{s.flags > 0 && s.assigned > 0 && s.overall < 40 ? " · " : ""}{s.assigned > 0 && s.overall < 40 ? `정량 ${s.overall}점(정시 제출 저조)` : ""}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>페어웤은 점수를 매기지 않고 판단 근거만 제공합니다. 평가는 교수님이 직접 하세요.</div>
        </div>
      )}
    </Card>
  );
}
function CreateAssignment({ subjects, onManageSubjects, onCancel, onDone }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [finalDue, setFinalDue] = useState(fromNow(21, 18, 0));
  const selected = subjects.find((s) => s.id === subjectId);
  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Back onClick={onCancel}>과제 목록</Back>
      <h2 style={h2}>과제 개설</h2>
      <Card className="mt-3">
        {subjects.length === 0 ? (
          <div className="rounded-xl px-4 py-4 flex items-center justify-between flex-wrap gap-2" style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}>
            <div style={{ fontSize: 13, color: C.ink }}>등록된 과목이 없습니다. 과제를 어느 과목에 개설할지 먼저 정해주세요.</div>
            <GhostBtn onClick={onManageSubjects}><GraduationCap size={15} /> 과목 등록하러 가기</GhostBtn>
          </div>
        ) : (
          <>
            <Field label="과목"><select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <div className="rounded-lg px-3 py-2 mt-1.5 inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.muted, background: C.canvas }}><Users size={13} /> 이 과목 수강생 {selected?.roster.length || 0}명이 자동으로 이 과제의 참여 명단이 됩니다. (변경은 '과목 관리'에서)</div>
            <Field label="과제명" mt><TextInput value={title} onChange={setTitle} placeholder="예) 디지털비즈니스 팀프로젝트" /></Field>
            <Field label="설명 · 제출 요건" mt><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="무엇을, 어떤 형태로 제출해야 하는지" className="w-full rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", resize: "vertical" }} /></Field>
            <Field label="최종 마감(날짜·시간)" mt><input type="datetime-local" value={finalDue} onChange={(e) => setFinalDue(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
            <div className="flex gap-2 mt-4"><PrimaryBtn onClick={() => title.trim() && subjectId && onDone({ subjectId, title: title.trim(), desc: desc.trim(), finalDue })}>개설하기</PrimaryBtn><GhostBtn onClick={onCancel}>취소</GhostBtn></div>
          </>
        )}
      </Card>
    </div>
  );
}

/* =================== STUDENT =================== */
function StudentArea({ screen, setScreen, subjects, assignments, projects, addProject, patchProject, active, setActive }) {
  if (screen === "create") return <CreateProjectWizard assignments={assignments} subjects={subjects} projects={projects} onCancel={() => setScreen("home")} onDone={(p) => { const a = assignments.find((x) => x.id === p.assignmentId); const np = addProject({ ...p, finalDue: a?.finalDue, assignmentTitle: a?.title }); setActive(np.id); setScreen("work"); }} />;
  if (screen === "work" && active) { const p = projects.find((x) => x.id === active); return <ProjectWorkspace p={p} patch={(fn) => patchProject(p.id, fn)} onBack={() => setScreen("home")} />; }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><h2 style={h2}>과제 & 내 프로젝트</h2><div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>팀 프로젝트의 진행 상황과 내 기여가 한눈에 기록됩니다.</div></div>
        <PrimaryBtn onClick={() => setScreen("create")}><FolderPlus size={16} /> 프로젝트 생성</PrimaryBtn>
      </div>
      {assignments.map((a) => {
        const mine = projects.filter((p) => p.assignmentId === a.id);
        return (
          <Card key={a.id} className="mb-3">
            <div className="flex items-center gap-2"><span className="rounded-md p-1.5" style={{ background: "#EEF1FE" }}><ClipboardList size={16} color={C.primary} /></span><span style={{ fontWeight: 800, fontSize: 16 }}>{a.title}</span><span className="ml-auto inline-flex items-center gap-2" style={{ fontSize: 12, color: C.muted }}><CalendarDays size={13} /> {fmt(a.finalDue)} <DDayChip due={a.finalDue} /></span></div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{a.desc}</div>
            <div className="mt-3">
              {mine.length === 0 ? <div style={{ fontSize: 13, color: C.muted }}>이 과제로 만든 프로젝트가 없습니다. '프로젝트 생성'을 눌러 팀을 꾸려보세요.</div> :
                mine.map((p) => (
                  <button key={p.id} onClick={() => { setActive(p.id); setScreen("work"); }} className="fw-row w-full text-left flex items-center gap-3 rounded-xl px-3.5 py-3 mt-2" style={{ border: `1px solid ${C.line}`, background: "#FAFBFE" }}>
                    <Layers size={16} color={C.primary} /><span style={{ fontWeight: 700, fontSize: 14 }}>{p.teamName}</span><AvatarStack members={p.members} /><span className="ml-auto flex items-center gap-2" style={{ minWidth: 110 }}><span style={{ flex: 1 }}><ProgressBar pct={projPct(p)} /></span><b style={{ fontSize: 12, color: C.muted }}>{projPct(p)}%</b></span><ChevronRight size={16} color={C.muted} />
                  </button>
                ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CreateProjectWizard({ assignments, subjects, projects, onCancel, onDone }) {
  const [step, setStep] = useState(1);
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || "");
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const assignment = assignments.find((a) => a.id === assignmentId);
  const roster = subjects.find((s) => s.id === assignment?.subjectId)?.roster || [];
  // 이미 같은 과제의 다른 팀에 속한 학생(이름 기준) → 선택 불가
  const taken = new Set((projects || []).filter((p) => p.assignmentId === assignmentId).flatMap((p) => p.members.map((m) => m.name)));
  const toggleMember = (stu) => setMembers((ms) => {
    const exists = ms.find((m) => m.name === stu.name);
    if (exists) { const left = ms.filter((m) => m.name !== stu.name); if (left.length && !left.some((m) => m.leader)) left[0].leader = true; return [...left]; }
    return [...ms, { id: "m" + stu.sid, name: stu.name, role: "", leader: ms.length === 0, color: AVATARS[ms.length % AVATARS.length] }];
  });
  const setRole = (id, role) => setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role } : m)));
  const setLeader = (id) => setMembers((ms) => ms.map((m) => ({ ...m, leader: m.id === id })));
  const addTask = () => setTasks((ts) => [...ts, { id: "t" + Date.now() + ts.length, title: "", owner: members[0]?.id || "", due: fromNow(7, 23, 59), submittedAt: null, ai: null }]);
  const setTask = (id, k, v) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const rmTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const canNext = step === 1 ? teamName.trim() && assignmentId : step === 2 ? members.length >= 1 : true;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Back onClick={onCancel}>취소</Back>
      <h2 style={h2}>프로젝트 생성</h2>
      <Stepper step={step} labels={["과제 선택 · 팀 이름", "팀원 선택 · 역할", "타임테이블 · 마감(분 단위)"]} />
      <Card className="mt-3">
        {step === 1 && (
          <div>
            <Field label="어떤 과제의 프로젝트인가요?"><select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className="w-full rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{assignments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></Field>
            <Field label="팀 이름" mt><TextInput value={teamName} onChange={setTeamName} placeholder="예) 5조 — 페어웤팀" /></Field>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>교수님이 등록한 수강생 명단에서 팀원을 클릭해 선택하세요.</div>
            {roster.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted }}>이 과제에 등록된 수강생 명단이 없습니다. 교수님께 명단 등록을 요청해주세요.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roster.map((stu) => {
                  const picked = members.some((m) => m.name === stu.name);
                  const busy = taken.has(stu.name) && !picked;
                  return (
                    <button key={stu.sid} disabled={busy} onClick={() => toggleMember(stu)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5"
                      style={{ fontSize: 13, fontWeight: 600, border: `1px solid ${picked ? C.primary : C.line}`, background: picked ? C.primary : busy ? "#F2F3F6" : "#fff", color: picked ? "#fff" : busy ? "#B7BCC9" : C.ink, cursor: busy ? "not-allowed" : "pointer" }}>
                      {picked && <CheckCircle2 size={13} />}{stu.name}{busy && " · 참여중"}
                    </button>
                  );
                })}
              </div>
            )}
            {members.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>먼저 선택한 사람이 조장이 됩니다(변경 가능).</div>}
            <div className="mt-4 grid gap-2">
              {members.map((m) => (
                <div key={m.id} className="rounded-lg px-3 py-2.5" style={{ border: `1px solid ${C.line}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar m={m} sm /><span className="truncate" style={{ fontWeight: 600, maxWidth: 70, flexShrink: 0 }}>{m.name}</span>
                    <button onClick={() => setLeader(m.id)} className="rounded-md px-2 py-1 inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: m.leader ? "#fff" : C.gold, background: m.leader ? C.gold : "#FBF3DC" }}><Crown size={12} /> 조장</button>
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>역할(복수 선택 가능)</span>
                  </div>
                  <RolePicker value={m.role} onChange={(v) => setRole(m.id, v)} />
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
  const [meId, setMeId] = useState((p.members.find((m) => m.leader) || p.members[0])?.id);
  const [submitFor, setSubmitFor] = useState(null);
  const me = p.members.find((m) => m.id === meId);

  const submit = (tid, text) => { const ai = mockAiScore(text); patch((pr) => ({ ...pr, tasks: pr.tasks.map((t) => (t.id === tid ? { ...t, submittedAt: nowLocal(), ai } : t)) })); setSubmitFor(null); return ai; };
  const addTask = (title, owner, due) => patch((pr) => ({ ...pr, tasks: [...pr.tasks, { id: "t" + Date.now(), title, owner, due, submittedAt: null, ai: null }], chat: [...pr.chat, { id: "c" + Date.now(), sender: "sys", text: `과업 등록: ${title} · 담당 ${pr.members.find((m) => m.id === owner)?.name} · 마감 ${fmt(due)}`, ts: Date.now() }] }));
  const sendMsg = (text) => patch((pr) => ({ ...pr, chat: [...pr.chat, { id: "c" + Date.now(), sender: meId, text, ts: Date.now() }] }));
  const submitPeer = (from, entries) => patch((pr) => ({ ...pr, peerEvals: [...pr.peerEvals.filter((e) => e.from !== from), ...entries.map((e) => ({ from, ...e }))] }));
  const endProject = () => patch((pr) => ({ ...pr, ended: true, chat: [...pr.chat, { id: "c" + Date.now(), sender: "sys", text: "프로젝트가 종료되었습니다. 이제 익명 동료평가를 제출할 수 있어요.", ts: Date.now() }] }));
  const setMemberRole = (id, role) => patch((pr) => ({ ...pr, members: pr.members.map((m) => (m.id === id ? { ...m, role } : m)) }));

  const TABS = [["chat", "채팅", MessageSquare], ["calendar", "캘린더", CalendarDays], ["timeline", "타임테이블", Clock], ["score", "기여도 분석", Trophy], ["peer", "동료평가", Star], ["team", "팀 구성", Users]];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Back onClick={onBack}>내 프로젝트</Back>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 12, color: C.muted, padding: "0 6px" }}>시연 계정</span>
          {p.members.map((m) => <button key={m.id} onClick={() => setMeId(m.id)} className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, color: meId === m.id ? "#fff" : C.muted, background: meId === m.id ? C.primary : "transparent" }}>{m.name}</button>)}
        </div>
      </div>
      <div className="rounded-2xl p-5 mt-2" style={{ background: GRAD.hero, color: "#fff", boxShadow: SH.pop }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>{p.assignmentTitle || "팀 프로젝트"}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>{p.teamName}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">{p.ended && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 800, background: "rgba(140,224,184,.25)", color: "#8CE0B8" }}><BadgeCheck size={12} /> 프로젝트 종료 · 동료평가 진행</span>}<span style={{ fontSize: 12, opacity: 0.75 }}>최종 마감 {fmt(p.finalDue)}</span><DDayChip due={p.finalDue} dark /></div>
        </div>
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="flex justify-between mb-1.5" style={{ fontSize: 12, opacity: 0.85 }}><span>팀 진척도</span><b>{projPct(p)}%</b></div>
            <ProgressBar pct={projPct(p)} dark />
          </div>
          <div className="flex items-center gap-2"><div className="flex items-center">{p.members.slice(0, 5).map((m, i) => <div key={m.id} className="flex items-center justify-center rounded-full" style={{ width: 30, height: 30, marginLeft: i ? -8 : 0, background: m.color, color: "#fff", fontWeight: 700, fontSize: 12, border: "2px solid #2A3A9A" }}>{m.name[0]}</div>)}</div><span style={{ fontSize: 12, opacity: 0.75 }}>{p.members.length}명</span></div>
        </div>
      </div>
      {!p.ended && <ReminderBar tasks={p.tasks} me={me} onSubmit={(t) => setSubmitFor(t)} />}
      <div className="flex gap-1 mt-3 overflow-x-auto rounded-2xl p-1.5" style={{ scrollbarWidth: "none", background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.card }}>{TABS.map(([k, label, Icon]) => <div key={k} className="flex-shrink-0"><Tab active={tab === k} onClick={() => setTab(k)} icon={<Icon size={16} />}>{label}</Tab></div>)}</div>
      <div className="mt-4">
        {tab === "chat" && <ChatTab members={p.members} chat={p.chat} me={me} finalDue={p.finalDue} sendMsg={sendMsg} addTask={addTask} />}
        {tab === "calendar" && <CalendarTab members={p.members} tasks={p.tasks} finalDue={p.finalDue} addTask={addTask} onPick={(t) => t.owner === meId && !t.submittedAt && setSubmitFor(t)} />}
        {tab === "timeline" && <TimelineTab members={p.members} tasks={p.tasks} me={me} finalDue={p.finalDue} onSubmit={(t) => setSubmitFor(t)} addTask={addTask} />}
        {tab === "score" && <ScoreTab members={p.members} tasks={p.tasks} meId={meId} />}
        {tab === "peer" && <PeerTab key={meId} members={p.members} peerEvals={p.peerEvals} meId={meId} ended={!!p.ended} isLeader={!!me?.leader} onEnd={endProject} onSubmit={submitPeer} />}
        {tab === "team" && <TeamTab members={p.members} tasks={p.tasks} me={me} setRole={setMemberRole} />}
      </div>
      {submitFor && <SubmitModal task={submitFor} onClose={() => setSubmitFor(null)} onSubmit={submit} />}
    </div>
  );
}

/* ---------- CHAT ---------- */
const QUICK_DUES = [
  { label: "오늘", days: 0 },
  { label: "내일", days: 1 },
  { label: "3일 후", days: 3 },
  { label: "1주 후", days: 7 },
];

function ChatTab({ members, chat, me, finalDue, sendMsg, addTask }) {
  const [text, setText] = useState(""); const [showTask, setShowTask] = useState(false);
  const [tt, setTt] = useState(""); const [to, setTo] = useState(members[0].id); const [td, setTd] = useState(fromNow(5, 23, 59));
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [chat]);
  const nameOf = (id) => members.find((m) => m.id === id)?.name;
  const colorOf = (id) => members.find((m) => m.id === id)?.color;
  const leader = members.find((m) => m.leader);
  const teamMembers = members.filter((m) => !m.leader);
  const exceedsFinal = finalDue && td && new Date(td) > new Date(finalDue);
  const openTaskFrom = (msgText, senderId) => { setTt(msgText.slice(0, 60)); if (senderId) setTo(senderId); setShowTask(true); };
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
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
      <div ref={ref} className="px-4 py-4 flex flex-col gap-3" style={{ height: "clamp(260px, 48vh, 380px)", overflowY: "auto", background: "#F7F8FB" }}>
        {chat.map((c) => {
          if (c.sender === "sys") return <div key={c.id} className="self-center rounded-full px-3 py-1.5 inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: "#EAEEFE" }}><ClipboardCheck size={13} /> {c.text}</div>;
          const mine = c.sender === me?.id;
          return (
            <div key={c.id} className={`flex gap-2 group ${mine ? "flex-row-reverse" : ""}`} style={{ maxWidth: "78%", alignSelf: mine ? "flex-end" : "flex-start" }}>
              {!mine && <div className="flex items-center justify-center rounded-full" style={{ width: 30, height: 30, background: colorOf(c.sender), color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{nameOf(c.sender)?.[0]}</div>}
              <div>{!mine && <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{nameOf(c.sender)}</div>}
                <div className="flex items-end gap-1" style={{ flexDirection: mine ? "row-reverse" : "row" }}>
                  <div className="px-3 py-2" style={{ fontSize: 14, lineHeight: 1.4, background: mine ? C.primary : "#fff", color: mine ? "#fff" : C.ink, borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", border: mine ? "none" : `1px solid ${C.line}` }}>{c.text}</div>
                  <button onClick={() => openTaskFrom(c.text, c.sender)} title="이 메시지를 과업으로 전환" className="rounded-md p-1 opacity-0 group-hover:opacity-100" style={{ color: C.violet, background: C.violetSoft, transition: "opacity .15s" }}><ClipboardList size={13} /></button>
                  <span style={{ fontSize: 10, color: C.muted }}>{hhmm(c.ts)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showTask && (
        <div className="px-4 py-3 flex flex-wrap items-end gap-2" style={{ background: C.violetSoft, borderTop: `1px solid ${C.line}` }}>
          <Field label="과업"><input value={tt} onChange={(e) => setTt(e.target.value)} placeholder="예) 시장조사 자료 2차" className="rounded-md px-3 py-2 w-full sm:w-[200px]" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
          <Field label="담당"><select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <Field label="마감(날짜·시간)">
            <div className="flex flex-col gap-1.5">
              <input type="datetime-local" value={td} onChange={(e) => setTd(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${exceedsFinal ? C.red : C.line}`, outline: "none" }} />
              <div className="flex gap-1">
                {QUICK_DUES.map((q) => (
                  <button key={q.label} onClick={() => setTd(fromNow(q.days, 23, 59))} className="rounded px-2 py-1" style={{ fontSize: 11, fontWeight: 600, color: C.violet, background: "#fff", border: `1px solid ${C.line}` }}>{q.label}</button>
                ))}
              </div>
            </div>
          </Field>
          <button onClick={() => { if (tt.trim()) { addTask(tt.trim(), to, td); setTt(""); setShowTask(false); } }} className="rounded-md px-3.5 py-2" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: C.violet }}>과업 등록</button>
          <button onClick={() => setShowTask(false)} className="rounded-md px-2 py-2" style={{ color: C.muted }}><X size={16} /></button>
          {exceedsFinal && <div className="w-full inline-flex items-center gap-1" style={{ fontSize: 12, color: C.red, fontWeight: 600 }}><AlertTriangle size={13} /> 프로젝트 최종마감({fmtKor(finalDue)})을 넘는 일정입니다</div>}
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
function CalendarTab({ members, tasks, finalDue, addTask, onPick }) {
  const [y, setY] = useState(today.getFullYear()); const [m, setM] = useState(today.getMonth());
  const [sel, setSel] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
  const [showAdd, setShowAdd] = useState(false);
  const [nt, setNt] = useState(""); const [no, setNo] = useState(members[0]?.id); const [ntime, setNtime] = useState("23:59");
  const first = new Date(y, m, 1).getDay(); const days = new Date(y, m + 1, 0).getDate();
  const finalKey = dateKey(finalDue);
  const byDay = useMemo(() => { const map = {}; tasks.forEach((t) => { const k = dateKey(t.due); if (k) (map[k] ||= []).push(t); }); return map; }, [tasks]);
  const move = (d) => { let nm = m + d, ny = y; if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; } setM(nm); setY(ny); };
  const goToday = () => { setY(today.getFullYear()); setM(today.getMonth()); setSel(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`); };
  const selTasks = tasks.filter((t) => dateKey(t.due) === sel).sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const nameOf = (id) => members.find((x) => x.id === id)?.name; const colorOf = (id) => members.find((x) => x.id === id)?.color;
  const cells = []; for (let i = 0; i < first; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d);
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const upcoming = tasks
    .filter((t) => ["pending", "missed"].includes(statusOf(t)))
    .sort((a, b) => (a.due || "").localeCompare(b.due || ""))
    .slice(0, 4);
  return (
    <div>
      <div className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{ fontWeight: 800, fontSize: 17 }}>{y}년 {m + 1}월</div>
            <button onClick={goToday} className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, color: C.primary, border: `1px solid ${C.line}` }}>오늘</button>
          </div>
          <div className="flex gap-1"><button onClick={() => move(-1)} className="rounded-md p-1.5" style={{ border: `1px solid ${C.line}` }}><ChevronLeft size={16} /></button><button onClick={() => move(1)} className="rounded-md p-1.5" style={{ border: `1px solid ${C.line}` }}><ChevronRight size={16} /></button></div>
        </div>
        <div className="flex flex-wrap gap-3 mb-2">
          {Object.values(SM).map((s) => (
            <div key={s.label} className="inline-flex items-center gap-1" style={{ fontSize: 11, color: C.muted }}><span className="rounded-full" style={{ width: 8, height: 8, background: s.color }} /> {s.label}</div>
          ))}
        </div>
        {upcoming.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {upcoming.map((t) => {
              const s = SM[statusOf(t)];
              return (
                <button key={t.id} onClick={() => setSel(dateKey(t.due))} className="rounded-lg px-2.5 py-1.5 flex-shrink-0 text-left" style={{ border: `1px solid ${s.color}`, background: s.soft, minWidth: 128 }}>
                  <div className="flex items-center gap-1"><span className="rounded-full" style={{ width: 6, height: 6, background: colorOf(t.owner), flexShrink: 0 }} /><span className="truncate" style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{t.title}</span></div>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{nameOf(t.owner)} · {fmt(t.due)}</div>
                </button>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-7 gap-1">
          {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => <div key={w} className="text-center py-1" style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? C.red : i === 6 ? C.primary : C.muted }}>{w}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const ds = `${y}-${pad(m + 1)}-${pad(d)}`; const items = byDay[ds] || []; const isToday = ds === todayKey; const isSel = ds === sel;
            const hasMissed = items.some((t) => statusOf(t) === "missed");
            return (
              <button key={i} onClick={() => setSel(ds)} className="rounded-lg p-1.5 text-left" style={{ minHeight: 62, border: `1px solid ${isSel ? C.primary : hasMissed ? C.red : C.line}`, background: isSel ? "#F3F5FE" : "#fff" }}>
                <div className="flex items-center justify-center rounded-full" style={{ width: 20, height: 20, fontSize: 12, fontWeight: 700, color: isToday ? "#fff" : C.ink, background: isToday ? C.primary : "transparent" }}>{d}</div>
                <div className="mt-1 flex flex-col gap-0.5">{ds === finalKey && <div className="truncate" style={{ fontSize: 10, padding: "1px 4px", borderRadius: 4, color: "#fff", background: C.violet, fontWeight: 700 }}>🚩 최종 마감</div>}{items.slice(0, 2).map((t) => { const s = SM[statusOf(t)]; return <div key={t.id} className="truncate inline-flex items-center gap-1" style={{ fontSize: 10, padding: "1px 4px", borderRadius: 4, color: s.color, background: s.soft }}><span className="rounded-full" style={{ width: 5, height: 5, background: colorOf(t.owner), flexShrink: 0 }} />{t.title}</div>; })}{items.length > 2 && <div style={{ fontSize: 10, color: C.muted }}>+{items.length - 2}</div>}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl p-4 mt-3" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
        <div className="flex items-center justify-between mb-2">
          <div style={{ fontWeight: 700 }}>{sel.slice(5).replace("-", "/")} 일정</div>
          {addTask && <button onClick={() => setShowAdd((v) => !v)} className="rounded-md px-2.5 py-1.5 inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: C.violet, background: C.violetSoft }}><Plus size={14} /> 과업</button>}
        </div>
        {showAdd && (
          <div className="flex flex-wrap items-end gap-2 rounded-xl p-2.5 mb-2" style={{ background: C.violetSoft, border: `1px solid ${C.line}` }}>
            <Field label="과업"><input value={nt} onChange={(e) => setNt(e.target.value)} placeholder="예) 발표자료 초안" className="rounded-md px-3 py-2 w-full sm:w-[180px]" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
            <Field label="담당"><select value={no} onChange={(e) => setNo(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{members.map((mm) => <option key={mm.id} value={mm.id}>{mm.name}</option>)}</select></Field>
            <Field label="시간"><input type="time" value={ntime} onChange={(e) => setNtime(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
            <button onClick={() => { if (nt.trim()) { addTask(nt.trim(), no, `${sel}T${ntime}`); setNt(""); setShowAdd(false); } }} className="rounded-md px-3.5 py-2" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: C.violet }}>등록</button>
          </div>
        )}
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
function ScoreTab({ members, tasks, meId }) {
  const [openId, setOpenId] = useState(null);
  const stats = useMemo(() => computeAuto(members, tasks), [members, tasks]);
  const data = stats.map((s) => ({ name: s.name, v: s.overall, color: s.color }));
  const risk = stats.filter((s) => isRisk(s));
  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-center justify-between"><SectionTitle>기여도 분석</SectionTitle>{risk.length > 0 && <span className="inline-flex items-center gap-1 rounded-full px-3 py-1" style={{ fontSize: 12, fontWeight: 600, color: C.red, background: C.redSoft }}><AlertTriangle size={14} /> 검토 대상 {risk.length}명</span>}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 12 }}>점수 근거는 딱 두 가지입니다. <b>① 정시 제출 여부</b> <b>② AI 복붙 여부</b>. 이를 바탕으로 개인별 <b>기여도·정시 제출·AI 독자성</b>을 0~100으로 자동 산출하고, 막대는 3개 항목의 평균(종합점수)입니다. 카드를 누르면 <b>근거</b>를 볼 수 있어요. 협업·소통은 종료 후 동료평가(정성)에서 다룹니다.</div>
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
          const flagged = isRisk(s), mine = s.id === meId;
          return (
            <Card key={s.id} className="fw-lift" style={{ borderColor: mine ? C.primary : flagged ? C.red : C.line, borderWidth: mine || flagged ? 2 : 1, cursor: "pointer", gridColumn: openId === s.id ? "1 / -1" : undefined }} onClick={() => setOpenId(openId === s.id ? null : s.id)}>
              <div className="flex items-center gap-2 mb-3"><span style={{ fontSize: 13, fontWeight: 700, color: C.muted, width: 16 }}>{i + 1}</span><Avatar m={s} sm /><span style={{ fontWeight: 700 }}>{s.name}</span>{mine && <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: C.primary }}>나</span>}{s.leader && <Crown size={13} color={C.gold} />}<span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: flagged ? C.red : s.color }}>{s.overall}</span></div>
              <div className="grid gap-1.5">{AUTO_DIMS.map((dm) => (
                <div key={dm.k} className="flex items-center gap-2"><span style={{ fontSize: 12, color: C.muted, width: 56 }}>{dm.label}</span><div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: C.canvas }}><div style={{ width: `${s[dm.k]}%`, height: "100%", background: flagged ? C.red : s.color }} /></div><span style={{ fontSize: 12, fontWeight: 600, width: 26, textAlign: "right" }}>{s[dm.k]}</span></div>
              ))}</div>
              <div className="flex items-center gap-2 mt-2" style={{ fontSize: 11 }}>
                {s.flags > 0 && <span className="inline-flex items-center gap-1" style={{ fontWeight: 600, color: C.red }}><Sparkles size={11} /> AI 검토 {s.flags}건</span>}
                <span className="ml-auto inline-flex items-center gap-1" style={{ fontWeight: 700, color: C.primary }}>{openId === s.id ? "근거 닫기" : "근거 보기"} <ChevronRight size={12} style={{ transform: openId === s.id ? "rotate(90deg)" : "none", transition: "transform .18s" }} /></span>
              </div>
              {openId === s.id && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}`, cursor: "default" }} onClick={(e) => e.stopPropagation()}>
                  <div className="mb-2" style={{ fontSize: 12, color: C.muted }}>{s.name}님은 판정된 과업 {s.assigned}건 중 <b style={{ color: C.ink }}>{s.ontime}건을 정시 제출</b>했고 AI 복붙 의심은 <b style={{ color: s.flags ? C.red : C.ink }}>{s.flags}건</b>입니다. 이 두 가지가 위 점수의 근거예요.</div>
                  <EvidenceList member={s} tasks={tasks} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <div className="rounded-xl px-4 py-3 mt-4 flex items-start gap-2" style={{ background: "#fff", border: `1px solid ${C.line}`, fontSize: 13, color: C.muted }}><AlertTriangle size={16} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }} /><span><b style={{ color: C.ink }}>AI 복붙 점검은 점수 근거 중 하나이지만 확정 판정이 아닙니다.</b> 오탐 가능성이 있어 교수님이 근거를 직접 확인하도록 표시만 하며, 최종 평가는 교수님이 합니다. 데모용 추정이며 실제 서비스에서는 검증된 탐지 API로 대체됩니다.</span></div>
    </div>
  );
}

/* ---------- PEER (교수 전용 결과) ---------- */
function PeerTab({ members, peerEvals, meId, ended, isLeader, onEnd, onSubmit }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const others = members.filter((m) => m.id !== meId);
  const already = peerEvals.some((p) => p.from === meId);
  const [draft, setDraft] = useState(() => { const d = {}; others.forEach((o) => { d[o.id] = { contribution: 0, timeliness: 0, collab: 0, quality: 0, comment: "" }; }); return d; });
  const setScore = (to, k, v) => setDraft((d) => ({ ...d, [to]: { ...d[to], [k]: v } }));
  const complete = others.every((o) => PEER_DIMS.every((dm) => draft[o.id][dm.k] > 0));
  const peerAvg = useMemo(() => { const map = {}; members.forEach((m) => { const recv = peerEvals.filter((p) => p.to === m.id); const dimAvg = {}; PEER_DIMS.forEach((dm) => { const v = recv.map((r) => r.scores[dm.k]).filter((x) => x != null); dimAvg[dm.k] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; }); map[m.id] = { dimAvg, comments: recv.map((r) => r.comment).filter((c) => c && c.trim()), count: recv.length }; }); return map; }, [peerEvals, members]);
  // 교수 시점 판별: '내 계정'이 팀원이 아닐 때는 없지만, 여기서는 학생만 폼/교수 결과는 아래에서 별도 처리 불가 →
  // 이 통합본에서는 학생이 제출하고, 결과는 교수 화면(ProfArea)에서 봅니다. 여기서는 학생 제출 UI만 노출.
  return (
    <div>
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2" style={{ background: C.violetSoft, fontSize: 13, color: C.ink }}><Lock size={16} color={C.violet} style={{ flexShrink: 0 }} /><span><b>익명 동료평가</b> · 프로젝트 종료 후 제출. <b>결과는 교수만</b> 열람하며 학생 화면에는 공개되지 않습니다.</span></div>
      {!ended ? (
        <Card style={{ padding: 28 }}><div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center rounded-full" style={{ width: 52, height: 52, background: C.violetSoft }}><Lock size={24} color={C.violet} /></div>
          <div style={{ fontWeight: 800, marginTop: 10, fontSize: 16 }}>동료평가는 프로젝트 종료 후 열립니다</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6, maxWidth: 420 }}>과제 기간에는 정시 제출·AI 복붙 점검으로 정량 점수가 쌓이고, 종료 후 동료평가(정성)로 협업·소통을 평가합니다. 동료평가 결과는 팀원끼리 볼 수 없고 교수님만 근거 자료로 열람합니다.</div>
          {isLeader ? (confirmEnd ? (
            <div className="flex items-center gap-2 mt-4"><span style={{ fontSize: 13, fontWeight: 600 }}>정말 종료할까요?</span><PrimaryBtn onClick={onEnd}>종료하고 동료평가 시작</PrimaryBtn><GhostBtn onClick={() => setConfirmEnd(false)}>취소</GhostBtn></div>
          ) : <div className="mt-4"><PrimaryBtn onClick={() => setConfirmEnd(true)}><BadgeCheck size={16} /> 프로젝트 종료</PrimaryBtn></div>) : <div style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>조장이 '프로젝트 종료'를 누르면 시작됩니다.</div>}
        </div></Card>
      ) : already ? (
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
      <div className="rounded-xl px-4 py-3 mt-4" style={{ background: "#fff", border: `1px solid ${C.line}`, fontSize: 12, color: C.muted }}>교수 화면(상단 '교수' 전환 → 과제 → 팀)에서 정량 점수 근거와 함께 동료평가 결과를 참고 자료로 확인합니다.</div>
    </div>
  );
}

/* ---------- TEAM ---------- */
function TeamTab({ members, tasks, me, setRole }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
      {members.map((m) => {
        const editable = m.id === me?.id || me?.leader;
        return (
          <Card key={m.id}>
            <div className="flex items-start gap-3"><Avatar m={m} /><div className="flex-1 min-w-0"><div className="flex items-center gap-1"><span style={{ fontWeight: 700 }}>{m.name}</span>{m.leader && <Crown size={14} color={C.gold} />}</div>
              {editable ? <div className="mt-2"><RolePicker value={m.role} onChange={(v) => setRole(m.id, v)} /></div> : <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{m.role || "역할 미정"}</div>}
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>배정 {tasks.filter((t) => t.owner === m.id).length}건</div>
            </div></div>
          </Card>
        );
      })}
    </div>
  );
}
/* ---------- 역할 프리셋 클릭 선택 ---------- */
function RolePicker({ value, onChange }) {
  const tokens = (value || "").split(",").map((s) => s.trim()).filter(Boolean);
  const presetSel = tokens.filter((t) => ROLE_PRESETS.includes(t));
  const etc = tokens.find((t) => !ROLE_PRESETS.includes(t)) || "";
  const [showEtc, setShowEtc] = useState(!!etc);
  const rebuild = (presets, etcText) => onChange([...presets, ...(etcText.trim() ? [etcText.trim()] : [])].join(", "));
  const togglePreset = (p) => { const next = presetSel.includes(p) ? presetSel.filter((x) => x !== p) : [...presetSel, p]; rebuild(next, etc); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {ROLE_PRESETS.map((p) => {
          const on = presetSel.includes(p);
          return <button key={p} onClick={() => togglePreset(p)} className="rounded-full px-2.5 py-1" style={{ fontSize: 12, fontWeight: 600, border: `1px solid ${on ? C.primary : C.line}`, background: on ? C.primary : "#fff", color: on ? "#fff" : C.ink }}>{p}</button>;
        })}
        <button onClick={() => setShowEtc((v) => !v)} className="rounded-full px-2.5 py-1" style={{ fontSize: 12, fontWeight: 600, border: `1px solid ${showEtc || etc ? C.violet : C.line}`, background: showEtc || etc ? C.violet : "#fff", color: showEtc || etc ? "#fff" : C.ink }}>기타</button>
      </div>
      {(showEtc || etc) && <input value={etc} onChange={(e) => rebuild(presetSel, e.target.value)} placeholder="기타 역할 직접 입력" className="rounded-md px-2 py-1.5 mt-2 w-full" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none" }} />}
    </div>
  );
}

/* ---------- SUBMIT MODAL ---------- */
function SubmitModal({ task, onClose, onSubmit }) {
  const [text, setText] = useState(""); const [result, setResult] = useState(null); const done = result != null;
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: "rgba(20,22,43,0.5)", backdropFilter: "blur(3px)", zIndex: 50 }} onClick={onClose}>
      <div className="fw-fade rounded-2xl w-full" style={{ maxWidth: 520, background: "#fff", boxShadow: SH.pop }} onClick={(e) => e.stopPropagation()}>
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
/* ---------- 점수 근거표: 과업별로 '정시 제출'과 'AI 복붙 여부'가 점수에 어떻게 반영됐는지 ---------- */
function EvidenceList({ member, tasks }) {
  const mine = tasks.filter((t) => t.owner === member.id).slice().sort((a, b) => new Date(a.due) - new Date(b.due));
  if (mine.length === 0) return <div style={{ fontSize: 12, color: C.muted }}>배정된 과업이 없습니다.</div>;
  return (
    <div className="grid gap-1.5">
      {mine.map((t) => {
        const st = statusOf(t), M = SM[st];
        const pts = st === "pending" ? null : st === "missed" ? 0 : Math.round(M.w * authFactor(t.ai) * 100);
        return (
          <div key={t.id} className="rounded-lg px-3 py-2" style={{ background: "#F7F8FC", border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontWeight: 700, fontSize: 13 }}>{t.title}</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, color: M.color, background: M.soft }}><M.Icon size={11} /> {M.label}</span>
              <span className="ml-auto" style={{ fontSize: 12, fontWeight: 800, color: pts == null ? C.muted : pts >= 80 ? C.green : pts >= 50 ? C.amber : C.red }}>{pts == null ? "집계 전" : `${pts}점 반영`}</span>
            </div>
            <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-1" style={{ fontSize: 12, color: C.muted }}>
              <span>마감 {fmt(t.due)}</span>
              <span>제출 {t.submittedAt ? fmt(t.submittedAt) : "—"}</span>
              <span style={{ color: isFlagged(t.ai) ? C.red : C.muted, fontWeight: isFlagged(t.ai) ? 700 : 400 }}>AI 점검 {t.ai == null ? "—" : `${t.ai}% · ${AI_LABEL(t.ai)}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 마감 알림: 마감 1일 전(기본) 또는 내가 정한 시점부터 '제출까지 남은 시간'을 알려줍니다 ---------- */
const LEAD_OPTS = [[72, "3일 전부터"], [48, "2일 전부터"], [24, "1일 전부터 (기본)"], [12, "12시간 전부터"], [6, "6시간 전부터"], [3, "3시간 전부터"]];
const remainText = (ms) => {
  if (ms <= 0) return "마감 지남";
  const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
  return d > 0 ? `${d}일 ${h}시간 남음` : h > 0 ? `${h}시간 ${mi}분 남음` : `${mi}분 남음`;
};
function ReminderBar({ tasks, me, onSubmit }) {
  const [lead, setLead] = useState(24);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
  const mine = tasks.filter((t) => t.owner === me?.id && !t.submittedAt && t.due).map((t) => ({ t, ms: new Date(t.due).getTime() - now })).sort((a, b) => a.ms - b.ms);
  const alerts = mine.filter((x) => x.ms <= lead * 3600000);
  const next = mine.find((x) => x.ms > 0);
  const picker = (
    <label className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.muted }}>
      <BellRing size={13} /> 알림 시점
      <select value={lead} onChange={(e) => setLead(Number(e.target.value))} className="rounded-md px-2 py-1" style={{ fontSize: 12, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, outline: "none" }}>{LEAD_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  );
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl px-4 py-3 mt-3 flex items-center gap-2 flex-wrap" style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.card }}>
        <Bell size={16} color={C.muted} />
        <span style={{ fontSize: 13, color: C.muted, flex: 1 }}>{next ? <>다음 제출 마감 <b style={{ color: C.ink }}>{next.t.title}</b> · {remainText(next.ms)}</> : "내가 제출할 과업이 모두 정리됐어요."}</span>
        {picker}
      </div>
    );
  }
  const urgent = alerts.some((x) => x.ms <= 6 * 3600000);
  return (
    <div className="rounded-2xl px-4 py-3 mt-3" style={{ background: urgent ? C.redSoft : C.amberSoft, border: `1px solid ${urgent ? "#F3C6C6" : "#F1D9A8"}` }}>
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <BellRing size={17} color={urgent ? C.red : C.amber} />
        <span style={{ fontWeight: 800, fontSize: 14, color: urgent ? C.red : "#9A5D00" }}>제출 마감이 다가오고 있어요</span>
        <span className="ml-auto">{picker}</span>
      </div>
      {alerts.map(({ t, ms }) => (
        <div key={t.id} className="flex items-center gap-2 flex-wrap py-1" style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 700 }}>{t.title}</span>
          <span style={{ fontWeight: 800, color: ms <= 0 ? C.red : urgent ? C.red : "#9A5D00" }}>제출까지 {ms <= 0 ? "마감 지남" : remainText(ms)}</span>
          <span style={{ color: C.muted, fontSize: 12 }}>마감 {fmt(t.due)}</span>
          <button onClick={() => onSubmit(t)} className="ml-auto rounded-lg px-3 py-1" style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: GRAD.primary }}>지금 제출하기</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- 데모용 공통 요소 ---------- */
const dday = (due) => { const d = new Date(due); if (isNaN(d)) return null; const a = new Date(today); a.setHours(0, 0, 0, 0); const b = new Date(d); b.setHours(0, 0, 0, 0); return Math.round((b.getTime() - a.getTime()) / 86400000); };
function DDayChip({ due, dark }) {
  const n = dday(due); if (n === null) return null;
  const label = n === 0 ? "D-DAY" : n > 0 ? `D-${n}` : `D+${-n}`;
  const urgent = n <= 3;
  const bg = dark ? "rgba(255,255,255,.16)" : urgent ? C.redSoft : "#EEF1FE";
  const fg = dark ? "#fff" : urgent ? C.red : C.primary;
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 800, color: fg, background: bg, letterSpacing: "0.02em" }}>{label}</span>;
}
function ProgressBar({ pct, dark }) {
  return <div style={{ height: 8, borderRadius: 99, background: dark ? "rgba(255,255,255,.2)" : "#E8EBF4", overflow: "hidden" }}><div className="fw-bar" style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: dark ? "linear-gradient(90deg,#8CE0B8,#5BD39A)" : "linear-gradient(90deg,#4262F0,#2F54EB)" }} /></div>;
}
function AvatarStack({ members, max = 4 }) {
  const shown = members.slice(0, max), rest = members.length - shown.length;
  return <div className="flex items-center">{shown.map((m, i) => <div key={m.id} className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, marginLeft: i ? -8 : 0, background: m.color, color: "#fff", fontWeight: 700, fontSize: 12, border: "2px solid #fff" }}>{m.name[0]}</div>)}{rest > 0 && <div className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, marginLeft: -8, background: "#E4E7EF", color: C.muted, fontWeight: 700, fontSize: 11, border: "2px solid #fff" }}>+{rest}</div>}</div>;
}
const projPct = (p) => { const done = p.tasks.filter((t) => ["ontime", "late"].includes(statusOf(t))).length; return p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0; };
function StatTile({ icon, label, value, tone }) {
  const tones = { blue: ["#EEF1FE", C.primary], red: [C.redSoft, C.red], green: [C.greenSoft, C.green] };
  const [bg, fg] = tones[tone || "blue"];
  return <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.card }}><div className="flex items-center justify-center rounded-xl" style={{ width: 42, height: 42, background: bg }}>{React.cloneElement(icon, { size: 20, color: fg })}</div><div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{value}</div></div></div>;
}

const h2 = { fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" };
function RoleBtn({ active, onClick, icon, children }) { return <button onClick={onClick} className="inline-flex items-center gap-1 rounded-lg px-3.5 py-1.5" style={{ fontSize: 13, fontWeight: 700, color: active ? C.ink : "#B8BEDA", background: active ? "#fff" : "transparent", boxShadow: active ? "0 2px 8px rgba(0,0,0,.2)" : "none", transition: "all .18s" }}>{icon}{children}</button>; }
function Tab({ active, onClick, icon, children }) { return <button onClick={onClick} className={`fw-tab inline-flex items-center gap-1.5 px-3.5 py-2 whitespace-nowrap rounded-xl ${active ? "is-active" : ""}`} style={{ fontSize: 14, fontWeight: 700, color: active ? "#fff" : C.muted, background: active ? GRAD.primary : "transparent", boxShadow: active ? SH.btn : "none", transition: "all .18s" }}>{icon}{children}</button>; }
function Card({ children, className = "", style = {}, onClick }) { return <div onClick={onClick} className={`rounded-2xl p-4 ${className}`} style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card, ...style }}>{children}</div>; }
function SectionTitle({ children }) { return <div style={{ fontWeight: 700, fontSize: 16 }}>{children}</div>; }
function PrimaryBtn({ children, onClick, disabled }) { return <button onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2.5" style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: disabled ? "#B7BFE0" : GRAD.primary, boxShadow: disabled ? "none" : SH.btn, cursor: disabled ? "default" : "pointer" }}>{children}</button>; }
function GhostBtn({ children, onClick }) { return <button onClick={onClick} className="fw-ghost inline-flex items-center justify-center gap-1 rounded-xl px-3.5 py-2.5" style={{ fontSize: 14, fontWeight: 600, color: C.ink, background: "#fff", border: `1px solid ${C.line}` }}>{children}</button>; }
function Field({ label, children, mt }) { return <div style={{ marginTop: mt ? 14 : 0 }}><div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{label}</div>{children}</div>; }
function TextInput({ value, onChange, placeholder, w }) { return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", width: w || "100%" }} />; }
function AddRow({ placeholder, onAdd, btn }) { const [v, setV] = useState(""); return <div className="flex flex-wrap gap-2"><input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} className="rounded-md px-3 py-2 flex-1 min-w-[140px]" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /><PrimaryBtn onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}><Plus size={16} /> {btn}</PrimaryBtn></div>; }
function Back({ children, onClick }) { return <button onClick={onClick} className="inline-flex items-center gap-1 mb-2" style={{ fontSize: 13, fontWeight: 600, color: C.muted }}><ArrowLeft size={15} /> {children}</button>; }
function Meta({ k, v }) { return <div className="rounded-lg px-3 py-2" style={{ background: "#fff", border: `1px solid ${C.line}` }}><div style={{ fontSize: 11, color: C.muted }}>{k}</div><div style={{ fontWeight: 700 }}>{v}</div></div>; }
function Empty({ title, sub }) { return <div className="rounded-2xl flex flex-col items-center justify-center text-center px-6 py-12" style={{ background: "#fff", border: `1px dashed ${C.line}` }}><div className="flex items-center justify-center rounded-full mb-3" style={{ width: 48, height: 48, background: "#EEF2FF" }}><ClipboardList size={22} color={C.primary} /></div><div style={{ fontWeight: 700 }}>{title}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{sub}</div></div>; }
function Avatar({ m, sm }) { const d = sm ? 28 : 40; return <div className="flex items-center justify-center rounded-full" style={{ width: d, height: d, background: m.color, color: "#fff", fontWeight: 700, fontSize: sm ? 12 : 15, flexShrink: 0 }}>{m.name[0]}</div>; }
function Stepper({ step, labels }) { return <div className="flex items-center gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>{labels.map((l, i) => { const n = i + 1, active = n === step, done = n < step; return <React.Fragment key={i}><div className="flex items-center gap-2 flex-shrink-0"><div className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, fontSize: 12, fontWeight: 700, color: active || done ? "#fff" : C.muted, background: active ? GRAD.primary : done ? C.green : "#E4E7EF", boxShadow: active ? SH.btn : "none" }}>{done ? <Check size={14} /> : n}</div><span className="whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: active ? C.ink : C.muted }}>{l}</span></div>{i < labels.length - 1 && <div style={{ width: 24, height: 2, background: C.line, flexShrink: 0 }} />}</React.Fragment>; })}</div>; }
