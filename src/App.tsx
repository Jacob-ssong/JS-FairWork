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
  Scale, Check, Bell, BellRing, BadgeCheck, Paperclip, FileText, Folder, FolderOpen, Pencil, Download,
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
const D = (m, d, hh = 0, mm = 0) => `2026-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}`; // 시연용 고정 날짜(2026년)
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

/* ---------- 시연용 AI 추정 (실제 탐지기 아님 — 시제품 시연용 규칙) ----------
   • 짧게 직접 쓴 글 → 사람이 쓴 것으로 판단(낮은 %)
   • 길게 붙여넣은 글 → AI 작성 의심(높은 %), 시연용 PESTEL 분석 문서는 99%
   실제 AI 탐지 API는 사업화 단계에서 연동합니다. */
const SAMPLE_MARKERS = ["PESTEL", "AI기본법", "RISE", "대학 AI 활용 윤리 가이드라인", "핵심 시사점"];
function mockAiScore(text) {
  const t = (text || "").replace(/\s+/g, "");
  if (!t) return 0;
  if (SAMPLE_MARKERS.filter((m) => t.includes(m.replace(/\s+/g, ""))).length >= 3) return 99;
  let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 9973;
  const n = t.length;
  if (n < 150) return 5 + (h % 15);                                 // 5~19%   : 사용하지 않았을 가능성 높음
  if (n < 300) return 32 + Math.round(((n - 150) / 150) * 34);       // 32~66%  : 일부 사용 가능성
  if (n < 600) return 75 + Math.round(((n - 300) / 300) * 20);       // 75~95%  : AI 사용 의심(길게 붙여넣은 글)
  return 96 + (h % 3);                                               // 96~98%
}
/* ---------- AI 탐지 호출 ----------
   REAL_AI_API = false : 시제품 시연용 추정만 사용 (현재)
   REAL_AI_API = true  : 서버 함수(/api/detect → Copyleaks)를 호출하고, 실패하면 시연용 추정으로 대체 (사업화 단계에서 켬) */
const REAL_AI_API = false;
const AI_SRC = { copyleaks: "Copyleaks 실제 탐지", sandbox: "Copyleaks 샌드박스(테스트값)", demo: "시연용 추정" };
const DEMO_NOTE = "시제품이라 시연용 추정값입니다. 실제 AI 탐지 API는 사업화 단계에서 연동합니다.";
async function detectAI(text) {
  const t = (text || "").trim();
  const demo = (note) => ({ ai: mockAiScore(t), source: "demo", note: note || DEMO_NOTE });
  if (!REAL_AI_API) { await new Promise((r) => setTimeout(r, 900)); return demo(); } // '검사 중' 연출
  if (t.length < 255) return demo(`글이 ${t.length}자라서 실제 탐지 최소 기준(255자)에 못 미쳐 시연용 추정으로 계산했어요.`);
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 25000);
    const r = await fetch("/api/detect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }), signal: ctl.signal });
    clearTimeout(timer);
    const j = await r.json().catch(() => ({}));
    if (r.ok && typeof j.ai === "number") return { ai: j.ai, source: j.sandbox ? "sandbox" : "copyleaks", note: j.sandbox ? "샌드박스 모드라 실제 탐지가 아닌 테스트 결과입니다." : "" };
    return demo("AI 탐지 서버에서 결과를 받지 못해 시연용 추정으로 계산했어요.");
  } catch (e) { return demo("AI 탐지 서버에 연결하지 못해 시연용 추정으로 계산했어요."); }
}
/* ---------- AI 점검 3구간 (감점이 억울하지 않도록 '확실할 때만' 크게 반영) ----------
   0~29%  : 사용하지 않았을 가능성 높음 → 감점 없음(100%)
   30~69% : 일부 사용 가능성          → 소폭 반영(85%), 교수 확인 대상은 아님
   70~100%: 사용 의심(검토·수정 안 한 정황) → 크게 반영(30%), 교수 확인 대상
   ※ 구간 경계(30·70)는 시제품 정책값입니다. 근거로 삼은 공개 자료: Turnitin(20% 미만은 신뢰도 낮음·오탐 가능성 높음),
      GPTZero(AI 판정 기준 예시 65%·80%). AI 탐지 도구 전체에 통용되는 공식 기준표는 없습니다. */
const AI_LOW = 30, AI_HIGH = 70;
const authFactor = (ai) => (ai == null ? 0 : ai < AI_LOW ? 1 : ai < AI_HIGH ? 0.85 : 0.3);
const isFlagged = (ai) => ai != null && ai >= AI_HIGH;

/* ---------- 정시 제출 점수표 (마감 후 늦은 시간에 따라) ----------
   정시 100 · 마감 1초 후~3시간 80 · 3시간 초과~24시간 60 · 24시간 초과~3일 미만 40 · 3일 이상 20 · 미제출 0
   ※ 구간·점수는 시제품 기본값이며, 실제 서비스에서는 교수가 과제별로 조정할 수 있게 합니다. */
const H = 3600000;
const LATE_TIERS = [
  { key: "ontime", pts: 100, label: "정시 제출",           range: "마감 시각 이내" },
  { key: "l3",     pts: 80,  label: "3시간 이내 지각",      range: "마감 후 1초 ~ 3시간", max: 3 * H },
  { key: "l24",    pts: 60,  label: "24시간 이내 지각",     range: "3시간 초과 ~ 24시간", max: 24 * H },
  { key: "l72",    pts: 40,  label: "3일 미만 지각",        range: "24시간 초과 ~ 3일 미만", max: 72 * H - 1 },
  { key: "l72p",   pts: 20,  label: "3일 이상 지각",        range: "3일 이상", max: Infinity },
  { key: "missed", pts: 0,   label: "미제출",              range: "제출 없이 마감 경과" },
];
const lateMs = (t) => (t.submittedAt && t.due ? new Date(t.submittedAt).getTime() - new Date(t.due).getTime() : 0);
// 과업 하나의 '정시 제출 점수' (0~100). 아직 진행 중이면 null
function timePts(t) {
  const st = statusOf(t);
  if (st === "pending") return null;
  if (st === "missed") return 0;
  const ms = lateMs(t);
  if (ms <= 0) return 100;
  return LATE_TIERS.slice(1, 5).find((x) => ms <= x.max).pts;
}
function fmtLate(ms) {
  const m = Math.max(1, Math.round(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 0) return h ? `${d}일 ${h}시간` : `${d}일`;
  if (h > 0) return mm ? `${h}시간 ${mm}분` : `${h}시간`;
  return `${mm}분`;
}
// 제출한 과업은 '마감 시각 전까지만' 수정할 수 있습니다(마감이 지나면 잠김).
const canEditTask = (t) => !!t.submittedAt && (!t.due || Date.now() <= new Date(t.due).getTime());
const fmtSize = (n) => (n < 1024 ? `${n}B` : n < 1048576 ? `${Math.round(n / 1024)}KB` : `${(n / 1048576).toFixed(1)}MB`);

/* ---------- 정량 자동채점: 근거는 '정시 제출 여부' + 'AI 복붙 여부' 두 가지뿐 (개인별 100점제) ---------- */
// 마감이 지났거나 제출된 과업만 집계합니다(아직 진행 중인 과업은 점수에 넣지 않음).
function computeAuto(members, tasks) {
  return members.map((m) => {
    const mine = tasks.filter((t) => t.owner === m.id);
    let judged = 0, ontime = 0, late = 0, subm = 0, authSum = 0, workPts = 0, timeSum = 0, flags = 0;
    mine.forEach((t) => {
      const st = statusOf(t);
      if (st === "pending") return;
      judged++;
      const tw = timePts(t) / 100;            // 지각 단계별 정시 점수 (100/80/60/40/20/0)
      timeSum += tw;
      if (st === "ontime") ontime++; if (st === "late") late++;
      if (["ontime", "late"].includes(st)) { subm++; authSum += authFactor(t.ai); workPts += tw * authFactor(t.ai); }
      if (isFlagged(t.ai)) flags++;
    });
    const den = judged || 1;
    const contribution = Math.round((workPts / den) * 100);
    const timeliness = Math.round((timeSum / den) * 100);
    const quality = subm ? Math.round((authSum / subm) * 100) : 0;
    const overall = judged ? Math.round((contribution + timeliness + quality) / 3) : 0;
    return { ...m, contribution, timeliness, quality, overall, subm, assigned: judged, total: mine.length, ontime, flags };
  }).sort((a, b) => b.overall - a.overall);
}
const isRisk = (s) => s.flags > 0 || (s.assigned > 0 && s.overall < 40);
const AUTO_DIMS = [
  { k: "contribution", label: "기여도" }, { k: "timeliness", label: "정시 제출" }, { k: "quality", label: "AI 독자성" },
];
const AI_LABEL = (ai) => (ai == null ? "—" : ai < AI_LOW ? "사용하지 않았을 가능성 높음" : ai < AI_HIGH ? "일부 사용 가능성" : "AI 사용 의심");
const PEER_DIMS = [
  { k: "contribution", label: "기여도", desc: "실제 산출물을 만들어냈는가" },
  { k: "timeliness", label: "성실성", desc: "기한·약속을 지켰는가" },
  { k: "collab", label: "협업/소통", desc: "소통하고 남을 도왔는가" },
  { k: "quality", label: "완성도", desc: "맡은 몫을 제대로 끝냈는가" },
];

/* ---------- seed ---------- */
// 학교 재학생 명부(가정) — 교수는 여기서 체크해서 과목 수강생을 등록합니다. 직접 타이핑하지 않습니다.
// 학번 20262300nn = 이름(가나다) 순번
const SEED_STUDENTS = [
  { sid: "2026230001", name: "김종민" },
  { sid: "2026230002", name: "김종성" },
  { sid: "2026230003", name: "나다움" },
  { sid: "2026230004", name: "도광현" },
  { sid: "2026230005", name: "박인희" },
  { sid: "2026230006", name: "송대희" },
  { sid: "2026230007", name: "유다빈" },
  { sid: "2026230008", name: "윤석준" },
  { sid: "2026230009", name: "이우형" },
  { sid: "2026230010", name: "이유진" },
  { sid: "2026230011", name: "이주원" },
  { sid: "2026230012", name: "차준혁" },
];
const seedSubjects = [
  { id: "sub1", name: "마케팅관리", roster: SEED_STUDENTS.slice() },
];
const seedAssignments = [
  { id: "a1", subjectId: "sub1", title: "마케팅 기획 프로젝트", desc: "팀 프로젝트 주제를 정해 외부·내부 환경 분석, 제품 시연, 가격 설정까지 정리하고, 실제로 디지털경영학과 학생들에게 판매한다고 가정해 마케팅 전략을 수립한 뒤 발표합니다.", finalDue: D(10, 17, 23, 59) },
];
const PROF_NAME = "남가영";
const ROLE_PRESETS = ["팀장", "자료조사", "자료취합", "문서작성", "발표"];
// ※ 시연용 샘플 데이터입니다. 과업 내용은 2026-10-10 팀 회의 기록(마케팅 전략 수립 및 최종 발표자료 구성)을 바탕으로 구성했습니다.
//   · 시연 시점: 프로젝트 종료 후 동료평가만 남은 상태 (김종성·이유진 평가 완료, 송대희는 시연 중 작성)
//   · 시연 과업: 송대희 '발표 대본 정리 및 팀원 역할 배분' (10/17 12:30 마감) — 시연 중 AI 글을 붙여 제출
const seedProjects = [
  {
    id: "p1", assignmentId: "a1", teamName: "안왔조", finalDue: D(10, 17, 23, 59), assignmentTitle: "마케팅 기획 프로젝트", ended: true, sample: true,
    members: [
      { id: "m1", sid: "2026230002", name: "김종성", role: "자료조사", leader: false, color: AVATARS[0] },
      { id: "m2", sid: "2026230010", name: "이유진", role: "문서작성", leader: false, color: AVATARS[1] },
      { id: "m3", sid: "2026230006", name: "송대희", role: "팀장 · 발표", leader: true, color: AVATARS[2] },
    ],
    folders: [{ id: "f1", name: "환경 분석" }, { id: "f2", name: "STP·4P 전략" }],
    tasks: [
      { id: "t1", title: "거시환경 분석 마무리 (PESTEL 6개 영역)", owner: "m1", due: D(10, 6, 18, 0), submittedAt: D(10, 6, 14, 20), ai: 12, folderId: "f1",
        text: "지난 회의에서 정리한 6개 환경 영역(정치·경제·사회·기술·환경·법률)을 다시 검토했다. FairWork에 가장 크게 영향을 주는 요인은 학생의 낮은 지불능력, 개인정보 관련 규제, 경쟁 서비스의 쉬운 진입이다. 그래서 학생에게 비용을 받지 않는 구조와 기능 차별화가 필요하다는 결론을 냈다.", files: [] },
      { id: "t2", title: "미시환경 분석 (경쟁 서비스·이해관계자)", owner: "m1", due: D(10, 8, 18, 0), submittedAt: D(10, 8, 10, 50), ai: 22, folderId: "f1",
        text: "경쟁 서비스는 노션·구글독스 같은 일반 협업툴과 CATME·Buddycheck 같은 팀 평가 도구로 나눠 봤다. 일반 협업툴은 같이 쓰기는 편하지만 개인별 기여 기록이 남지 않고, 평가 도구는 프로젝트가 끝난 뒤에야 동료평가가 이뤄진다. 이해관계자는 학생, 교수자, 학교·학과로 정리했다.", files: [] },
      { id: "t3", title: "소비자 조사 준비 (조사 대상·설문 구성)", owner: "m1", due: D(10, 11, 18, 0), submittedAt: D(10, 11, 9, 30), ai: 18,
        text: "조사 대상은 FairWork를 실제로 쓰게 될 대학생과 교수자로 정했다. 학생은 팀 프로젝트 경험이 많은 경영·공학 계열 중심이다. 설문은 온라인으로 진행하고, 팀 프로젝트에서 겪은 불편, 무임승차 경험, 현재 평가 방식 만족도, 지불의사와 비용 부담 주체, 선호하는 서비스 형태를 묻는다. 문항을 완성한 뒤 진행하며 결과는 제품 구성과 가격 결정에 반영한다.", files: [] },
      { id: "t4", title: "시장세분화·표적시장 선정", owner: "m1", due: D(10, 13, 18, 0), submittedAt: D(10, 13, 12, 40), ai: 41, folderId: "f2",
        text: "시장은 사용자와 비용 부담 주체에 따라 학생, 교수자, 학교·학과로 나누고, 전공별 팀 프로젝트 비중도 함께 고려했다. 표적시장은 팀 프로젝트 비중이 높은 경영·공학 계열 대학생과 교수자이며, 실제 비용은 학교나 학과에서 부담하는 것으로 설정했다.", files: [] },

      { id: "t5", title: "내부환경 분석 (SWOT)", owner: "m2", due: D(10, 8, 18, 0), submittedAt: D(10, 8, 16, 40), ai: 24, folderId: "f1",
        text: "강점은 개인별 기여를 기록해 교수자가 근거로 확인할 수 있다는 점이고, 약점은 출시 전이라 인지도와 사용 사례가 없다는 점이다. 기회는 AI 사용이 일상화되며 '누가 실제로 했나'를 가리는 수요가 커진 것이고, 위협은 대학 재정 부담과 일반 협업툴의 기능 확장이다.", files: [] },
      { id: "t6", title: "제품 관리 (핵심·유형·확장 제품)", owner: "m2", due: D(10, 11, 18, 0), submittedAt: D(10, 11, 21, 40), ai: 38, folderId: "f2",
        text: "FairWork는 형태가 없는 웹·앱 기반 구독 서비스다. 핵심제품은 팀 프로젝트에서의 공정한 평가, 유형제품은 개인별 기여 기록과 마감 관리 기능, 확장제품은 LMS 연동과 교내 시범운영 지원으로 정리했다. 그중 개인별 기여를 기록하고 교수자가 확인하는 기능에 가장 중점을 두기로 했다.", files: [] },
      { id: "t7", title: "가격 관리 (가격 구조·가격 전략)", owner: "m2", due: D(10, 13, 18, 0), submittedAt: D(10, 13, 17, 30), ai: 78, folderId: "f2",
        text: "학생들의 가격 부담을 고려해 학생은 무료로 사용하고 학교·학과 단위로 구독료를 받는 가격 구조를 정했다. 처음에는 교내에서 무료 시범운영으로 사용 성과를 확보하고, 이를 바탕으로 학과·학교 단위 유료 구독으로 전환하는 전략이다. 구체적인 금액은 설문에서 지불의사와 적정 가격대를 확인한 뒤 결정한다.", files: [] },
      { id: "t8", title: "신제품 개발과 수명관리", owner: "m2", due: D(10, 14, 18, 0), submittedAt: D(10, 14, 18, 40), ai: 26, folderId: "f2",
        text: "FairWork는 아직 출시 전이라 제품수명주기상 도입기로 봤다. 도입기에는 인지도가 낮으므로 시범운영으로 실제 사용 사례를 쌓는 데 집중한다. 서비스가 자리 잡은 뒤에는 LMS 연동, 프로젝트 내 채팅과 캘린더, AI 작성 비율 확인 기능을 차례로 추가해 확장한다.", files: [] },

      { id: "t9", title: "제품 소개 및 시연 시나리오", owner: "m3", due: D(10, 9, 12, 0), submittedAt: D(10, 9, 14, 30), ai: 29,
        text: "시연은 과업 만들기, 활동 기록, 기여도 보고서의 세 단계로 구성한다. 학생이 과업을 제출하면 정시 여부와 AI 점검 결과가 기록되고, 교수자는 그 근거를 확인한다. 직접 작성한 글과 AI로 붙여넣은 글의 결과가 어떻게 다른지를 보여주는 것이 핵심이다.", files: [] },
      { id: "t10", title: "포지셔닝 정리", owner: "m3", due: D(10, 12, 12, 0), submittedAt: D(10, 13, 10, 0), ai: 83,
        text: "노션이나 구글독스 같은 일반 협업툴과 차별화하기 위해 FairWork를 팀원 개개인의 기여를 기록하고 이를 평가에 활용할 수 있는 서비스로 포지셔닝한다. 경쟁 서비스가 협업의 편의에 초점을 맞춘다면, FairWork는 공정한 평가 근거를 남기는 데 초점을 둔다.", files: [] },
      { id: "t11", title: "최종 발표자료 구성", owner: "m3", due: D(10, 14, 12, 0), submittedAt: D(10, 15, 18, 30), ai: 52,
        text: "최종 발표자료는 수업에서 진행한 순서에 맞춰 주제 선정, 거시환경 분석, 소비자 조사, 제품 관리, 시장세분화와 포지셔닝, 가격 관리, 신제품 개발과 수명관리 순으로 구성한다. 각자 맡은 부분을 작성해 발표자료를 완성한다.", files: [] },
      { id: "t12", title: "발표 대본 정리 및 팀원 역할 배분", owner: "m3", due: D(10, 17, 12, 30), submittedAt: null, ai: null },
    ],
    chat: [
      { id: "c1", sender: "m3", text: "10일 회의 내용 기준으로 각자 맡은 부분 정리해서 올려요. 마감 꼭 지켜주세요!", ts: new Date(D(10, 10, 21, 0)).getTime() },
      { id: "c2", sender: "sys", text: "과업 등록: 발표 대본 정리 및 팀원 역할 배분 · 담당 송대희 · 마감 " + fmt(D(10, 17, 12, 30)), ts: new Date(D(10, 15, 19, 0)).getTime() },
      { id: "c3", sender: "sys", text: "프로젝트가 종료되었습니다. 이제 익명 동료평가를 제출할 수 있어요.", ts: new Date(D(10, 15, 20, 0)).getTime() },
    ],
    peerEvals: [
      { from: "m2", to: "m3", scores: { contribution: 4, timeliness: 4, collab: 4, quality: 4 }, comment: "" },
      { from: "m2", to: "m1", scores: { contribution: 5, timeliness: 5, collab: 5, quality: 5 }, comment: "" },
      { from: "m1", to: "m3", scores: { contribution: 3, timeliness: 3, collab: 3, quality: 3 }, comment: "" },
      { from: "m1", to: "m2", scores: { contribution: 5, timeliness: 5, collab: 5, quality: 5 }, comment: "" },
    ],
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
  const [createFor, setCreateFor] = useState(null);
  const [studentSid, setStudentSid] = useState("2026230006"); // 시연용 로그인 학생(LMS 연동 시에는 로그인 정보로 대체)
  const meStudent = SEED_STUDENTS.find((x) => x.sid === studentSid) || SEED_STUDENTS[0];
  const changeStudent = (sid, stay) => { setStudentSid(sid); if (!stay) { setSScreen("home"); setActiveProject(null); } };
  const [activeAssignment, setActiveAssignment] = useState(null);

  const [toast, setToast] = useState(null);
  const notify = (msg) => setToast({ msg, id: Date.now() });
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); }, [toast]);

  const addSubject = (name) => { setSubjects((x) => [...x, { id: "sub" + Date.now(), name, roster: [] }]); notify(`과목 '${name}'을 등록했어요`); };
  const rmSubject = (id) => { setSubjects((x) => x.filter((s) => s.id !== id)); notify("과목을 삭제했어요"); };
  const renameSubject = (id, name) => { setSubjects((x) => x.map((s) => (s.id === id ? { ...s, name } : s))); notify("과목 이름을 바꿨어요"); };
  // 수강생 명단은 '완료'를 눌렀을 때만 반영됩니다(체크 중에는 임시 선택).
  const saveRoster = (subjectId, sids) => { setSubjects((x) => x.map((s) => (s.id === subjectId ? { ...s, roster: SEED_STUDENTS.filter((st) => sids.includes(st.sid)) } : s))); notify(`수강생 ${sids.length}명으로 저장했어요`); };
  const addAssignment = (a) => setAssignments((x) => [...x, { ...a, id: "a" + Date.now() }]);
  // 과제를 수정하면 이미 만들어진 팀 프로젝트의 과제명·최종 마감도 함께 맞춥니다.
  const updateAssignment = (id, v) => {
    setAssignments((x) => x.map((a) => (a.id === id ? { ...a, ...v } : a)));
    setProjects((x) => x.map((p) => (p.assignmentId === id ? { ...p, assignmentTitle: v.title, finalDue: v.finalDue } : p)));
  };
  const deleteAssignment = (id) => { setAssignments((x) => x.filter((a) => a.id !== id)); setProjects((x) => x.filter((p) => p.assignmentId !== id)); };
  const addProject = (p) => {
    const leader = p.members.find((m) => m.leader);
    const np = { ...p, id: "p" + Date.now(), ended: false, peerEvals: [], folders: [], chat: [{ id: "c" + Date.now(), sender: "sys", text: `팀장 ${leader?.name}님이 프로젝트를 만들고 팀원 ${p.members.length - 1}명을 추가했어요. 팀원 모두 이 프로젝트에 들어올 수 있습니다.`, ts: Date.now() }] };
    setProjects((x) => [...x, np]); return np;
  };
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
          <div className="flex items-center gap-2 flex-wrap justify-end">
          {role === "prof" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", fontSize: 12, fontWeight: 700, color: "#DCE2FF" }}><GraduationCap size={13} /> {PROF_NAME} 교수님</span>
          )}
          {role === "student" && (
            <label className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", fontSize: 12, color: "#B8BEDA" }}>
              <User size={13} /> 학생 계정
              <select value={studentSid} onChange={(e) => changeStudent(e.target.value)} className="rounded-md px-1.5 py-0.5" style={{ fontSize: 12, fontWeight: 700, background: "#fff", color: C.ink, outline: "none" }}>{SEED_STUDENTS.map((x) => <option key={x.sid} value={x.sid}>{x.name}</option>)}</select>
            </label>
          )}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" }}>
            <RoleBtn active={role === "prof"} onClick={() => setRole("prof")} icon={<GraduationCap size={15} />}>교수</RoleBtn>
            <RoleBtn active={role === "student"} onClick={() => setRole("student")} icon={<User size={15} />}>학생</RoleBtn>
          </div>
          </div>
        </div>
      </div>

      <div key={`${role}-${role === "prof" ? pScreen : sScreen}`} className="mx-auto px-5 py-6 fw-fade" style={{ maxWidth: 1080 }}>
        {role === "prof" ? (
          <ProfArea screen={pScreen} setScreen={setPScreen} subjects={subjects} addSubject={addSubject} rmSubject={rmSubject} renameSubject={renameSubject} saveRoster={saveRoster} assignments={assignments} addAssignment={addAssignment} updateAssignment={updateAssignment} deleteAssignment={deleteAssignment} projects={projects} active={activeAssignment} setActive={setActiveAssignment} notify={notify} />
        ) : (
          <StudentArea me={meStudent} switchStudent={changeStudent} createFor={createFor} setCreateFor={setCreateFor} screen={sScreen} setScreen={setSScreen} subjects={subjects} assignments={assignments} projects={projects} addProject={addProject} patchProject={patchProject} active={activeProject} setActive={setActiveProject} />
        )}
      </div>
      {toast && <div key={toast.id} className="fw-fade fixed inline-flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 60, fontSize: 14, fontWeight: 600, color: "#fff", background: "rgba(20,22,43,.94)", boxShadow: SH.pop }}><CheckCircle2 size={16} color="#8CE0B8" /> {toast.msg}</div>}
    </div>
  );
}

/* =================== PROFESSOR =================== */
const selStyle = { fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" };
const dangerBtn = { fontSize: 13, fontWeight: 700, color: "#fff", background: C.red };

// 수강생 등록: 체크는 '임시 선택'이고 [완료]를 눌러야 저장됩니다. [취소]하면 모두 버립니다.
function RosterEditor({ subject, teamSids, onSave, onCancel }) {
  const orig = subject.roster.map((r) => r.sid);
  const [draft, setDraft] = useState(orig);
  const added = draft.filter((x) => !orig.includes(x)), removed = orig.filter((x) => !draft.includes(x));
  const changed = added.length + removed.length;
  const all = draft.length === SEED_STUDENTS.length;
  const toggle = (sid) => setDraft((d) => (d.includes(sid) ? d.filter((x) => x !== sid) : [...d, sid]));
  const inTeam = removed.filter((sid) => teamSids.has(sid)).map((sid) => SEED_STUDENTS.find((x) => x.sid === sid)?.name);
  return (
    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>학교 재학생 명부에서 이 과목 수강생을 체크하세요. 체크는 임시 선택이며, <b style={{ color: C.ink }}>[완료]를 눌러야 저장</b>됩니다.</div>
      <label className="flex items-center gap-2 rounded-md px-2.5 py-2 mb-2" style={{ fontSize: 13, fontWeight: 700, background: all ? "#EEF1FE" : "#fff", border: `1px solid ${all ? C.primary : C.line}`, cursor: "pointer" }}>
        <input type="checkbox" checked={all} onChange={(e) => setDraft(e.target.checked ? SEED_STUDENTS.map((x) => x.sid) : [])} style={{ accentColor: C.primary }} />
        전체 선택 <span style={{ fontWeight: 500, color: C.muted, fontSize: 12 }}>({draft.length}/{SEED_STUDENTS.length}명)</span>
      </label>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))" }}>
        {SEED_STUDENTS.map((stu) => {
          const checked = draft.includes(stu.sid);
          return (
            <label key={stu.sid} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ fontSize: 13, background: checked ? "#EEF1FE" : "#fff", border: `1px solid ${checked ? C.primary : C.line}`, cursor: "pointer" }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(stu.sid)} style={{ accentColor: C.primary }} />
              {stu.name} <span style={{ color: C.muted, fontSize: 11 }}>{stu.sid}</span>
            </label>
          );
        })}
      </div>
      {inTeam.length > 0 && <div className="rounded-md px-3 py-2 mt-2" style={{ fontSize: 12, background: C.amberSoft, color: "#8A5300" }}>{inTeam.join(", ")} 님은 이미 팀 프로젝트에 속해 있어요. 명단에서 해제해도 기존 팀 구성은 그대로 유지됩니다.</div>}
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <PrimaryBtn onClick={() => onSave(draft)} disabled={changed === 0}><Check size={15} /> 완료</PrimaryBtn>
        <GhostBtn onClick={onCancel}>취소</GhostBtn>
        <span style={{ fontSize: 12, color: changed ? "#8A5300" : C.muted, fontWeight: changed ? 700 : 400 }}>{changed ? `저장 안 된 변경 ${changed}건 (추가 ${added.length} · 해제 ${removed.length})` : "변경 사항 없음"}</span>
      </div>
    </div>
  );
}

function SubjectRow({ s, assignmentCount, teamSids, onRename, onRemove, onSaveRoster }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false); const [name, setName] = useState(s.name);
  const [del, setDel] = useState(false);
  const saveName = () => { const n = name.trim(); if (!n) return; if (n !== s.name) onRename(s.id, n); setEditing(false); };
  return (
    <div className="rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 flex-wrap">
        <GraduationCap size={15} color={C.muted} />
        {editing ? (
          <>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditing(false); setName(s.name); } }} className="rounded-md px-2 py-1 flex-1" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", minWidth: 140 }} />
            <button onClick={saveName} disabled={!name.trim()} className="rounded-md px-2.5 py-1.5" style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: name.trim() ? C.primary : "#B7BFE0" }}>저장</button>
            <button onClick={() => { setEditing(false); setName(s.name); }} className="rounded-md px-2.5 py-1.5" style={{ fontSize: 12, fontWeight: 600, color: C.ink, background: "#fff", border: `1px solid ${C.line}` }}>취소</button>
          </>
        ) : (
          <>
            <span className="flex-1" style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
            <span style={{ fontSize: 12, color: C.muted }}>수강생 {s.roster.length}명 · 과제 {assignmentCount}개</span>
            {!open && <button onClick={() => setOpen(true)} className="rounded-md px-2 py-1.5" style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: "#EEF1FE" }}>수강생 등록</button>}
            <button onClick={() => { setEditing(true); setName(s.name); setDel(false); }} aria-label="과목 이름 바꾸기" className="rounded-md p-1.5" style={{ color: C.muted }}><Pencil size={15} /></button>
            <button onClick={() => setDel(!del)} aria-label="과목 삭제" className="rounded-md p-1.5" style={{ color: C.muted }}><Trash2 size={15} /></button>
          </>
        )}
      </div>
      {del && !editing && (
        assignmentCount > 0
          ? <div className="rounded-md px-3 py-2 mt-2 flex items-center gap-2 flex-wrap" style={{ fontSize: 12, background: C.amberSoft, color: "#8A5300" }}>이 과목에 개설된 과제가 {assignmentCount}개 있어 삭제할 수 없어요. 과제를 먼저 삭제해 주세요.<button onClick={() => setDel(false)} style={{ marginLeft: "auto", fontWeight: 700 }}>확인</button></div>
          : <div className="rounded-md px-3 py-2 mt-2 flex items-center gap-2 flex-wrap" style={{ fontSize: 12, background: C.redSoft, color: C.red }}>'{s.name}' 과목과 수강생 명단(수강생 {s.roster.length}명)을 삭제할까요?<span className="ml-auto inline-flex gap-1.5"><button onClick={() => onRemove(s.id)} className="rounded-md px-2.5 py-1" style={dangerBtn}>삭제</button><button onClick={() => setDel(false)} className="rounded-md px-2.5 py-1" style={{ fontSize: 12, fontWeight: 600, color: C.ink, background: "#fff", border: `1px solid ${C.line}` }}>취소</button></span></div>
      )}
      {open && !editing && <RosterEditor subject={s} teamSids={teamSids} onSave={(sids) => { onSaveRoster(s.id, sids); setOpen(false); }} onCancel={() => setOpen(false)} />}
    </div>
  );
}

function AssignmentDetail({ a, teams, subjectName, onBack, onEdit, onDelete }) {
  const [del, setDel] = useState(false);
  return (
    <div>
      <Back onClick={onBack}>과제 목록</Back>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 mb-1" style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: "#EEF1FE" }}><GraduationCap size={12} /> {subjectName(a.subjectId)}</div>
          <h2 style={h2}>{a.title}</h2>
        </div>
        <div className="flex gap-2"><GhostBtn onClick={onEdit}><Pencil size={14} /> 과제 수정</GhostBtn><GhostBtn onClick={() => setDel(!del)}><Trash2 size={14} /> 삭제</GhostBtn></div>
      </div>
      {del && (
        <div className="rounded-xl px-4 py-3 mt-3 flex items-center gap-3 flex-wrap" style={{ background: C.redSoft, border: `1px solid ${C.red}` }}>
          <div style={{ fontSize: 13, color: C.red, flex: 1, minWidth: 220 }}><b>'{a.title}' 과제를 삭제할까요?</b>{teams.length > 0 ? ` 이 과제로 만들어진 팀 프로젝트 ${teams.length}팀과 제출 기록도 함께 삭제되며, 되돌릴 수 없어요.` : " 되돌릴 수 없어요."}</div>
          <button onClick={onDelete} className="rounded-md px-3 py-2" style={dangerBtn}>삭제하기</button>
          <button onClick={() => setDel(false)} className="rounded-md px-3 py-2" style={{ fontSize: 13, fontWeight: 600, color: C.ink, background: "#fff", border: `1px solid ${C.line}` }}>취소</button>
        </div>
      )}
      <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>{a.desc || "설명이 없습니다."}</p>
      <div className="flex gap-2 mt-3 mb-2">
        <Meta k="최종 마감" v={fmt(a.finalDue)} /><Meta k="제출 팀" v={`${teams.length}팀`} />
      </div>
      {teams.length === 0 ? <Empty title="아직 생성된 팀 프로젝트가 없습니다" sub="학생이 이 과제로 프로젝트를 만들면 팀별 기여도가 여기 표시됩니다." /> :
        teams.map((p) => <ProfTeamCard key={p.id} p={p} />)}
    </div>
  );
}

function ProfArea({ screen, setScreen, subjects, addSubject, rmSubject, renameSubject, saveRoster, assignments, addAssignment, updateAssignment, deleteAssignment, projects, active, setActive, notify }) {
  const subjectName = (id) => { const n = subjects.find((s) => s.id === id)?.name; return n ? `${n} · ${PROF_NAME} 교수님` : "과목 미지정"; };
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
                const asg = assignments.filter((a) => a.subjectId === s.id);
                const teamSids = new Set(projects.filter((p) => asg.some((a) => a.id === p.assignmentId)).flatMap((p) => p.members.map((m) => m.sid)));
                return <SubjectRow key={s.id} s={s} assignmentCount={asg.length} teamSids={teamSids} onRename={renameSubject} onRemove={rmSubject} onSaveRoster={saveRoster} />;
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }
  if (screen === "create") return <AssignmentForm mode="create" subjects={subjects} onManageSubjects={() => setScreen("subjects")} onCancel={() => setScreen("home")} onDone={(v) => { addAssignment(v); notify("과제를 개설했어요"); setScreen("home"); }} />;
  const a = active ? assignments.find((x) => x.id === active) : null;
  const teams = a ? projects.filter((p) => p.assignmentId === a.id) : [];
  if (screen === "edit" && a) return <AssignmentForm mode="edit" initial={a} teamCount={teams.length} subjects={subjects} onManageSubjects={() => setScreen("subjects")} onCancel={() => setScreen("assignment")} onDone={(v) => { updateAssignment(a.id, v); notify("과제를 수정했어요"); setScreen("assignment"); }} />;
  if (screen === "assignment" && a) return <AssignmentDetail a={a} teams={teams} subjectName={subjectName} onBack={() => setScreen("home")} onEdit={() => setScreen("edit")} onDelete={() => { deleteAssignment(a.id); setActive(null); notify("과제를 삭제했어요"); setScreen("home"); }} />;
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
          {assignments.map((x) => {
            const n = projects.filter((p) => p.assignmentId === x.id).length;
            return (
              <button key={x.id} onClick={() => { setActive(x.id); setScreen("assignment"); }} className="fw-lift text-left rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
                <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mb-2" style={{ fontSize: 11, fontWeight: 600, color: C.primary, background: "#EEF1FE" }}><GraduationCap size={11} /> {subjectName(x.subjectId)}</div>
                <div className="flex items-center gap-2 mb-2"><span className="rounded-md p-1.5" style={{ background: "#EEF1FE" }}><ClipboardList size={16} color={C.primary} /></span><span style={{ fontWeight: 700 }}>{x.title}</span></div>
                <div style={{ fontSize: 13, color: C.muted, minHeight: 36 }}>{x.desc}</div>
                <div className="flex items-center justify-between mt-3" style={{ fontSize: 12, color: C.muted }}><span className="inline-flex items-center gap-2"><CalendarDays size={13} /> {fmt(x.finalDue)} <DDayChip due={x.finalDue} /></span><span className="inline-flex items-center gap-1">{n}팀 <ChevronRight size={14} /></span></div>
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
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={56} tick={{ fontSize: 13, fill: C.ink, fontWeight: 600 }} />
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
// 과제 개설/수정 공용 폼: [개설하기/저장]을 눌러야 반영되고, 취소·뒤로가기는 입력을 버립니다.
function AssignmentForm({ mode, initial, teamCount = 0, subjects, onManageSubjects, onCancel, onDone }) {
  const edit = mode === "edit";
  const [subjectId, setSubjectId] = useState(initial?.subjectId || subjects[0]?.id || "");
  const [title, setTitle] = useState(initial?.title || ""); const [desc, setDesc] = useState(initial?.desc || ""); const [finalDue, setFinalDue] = useState(initial?.finalDue || fromNow(21, 18, 0));
  const selected = subjects.find((s) => s.id === subjectId);
  const lockSubject = edit && teamCount > 0;
  const dirty = edit ? (subjectId !== initial.subjectId || title.trim() !== initial.title || desc.trim() !== (initial.desc || "") || finalDue !== initial.finalDue) : !!(title.trim() || desc.trim());
  const valid = !!(title.trim() && subjectId && finalDue);
  const submit = () => { if (valid) onDone({ subjectId, title: title.trim(), desc: desc.trim(), finalDue }); };
  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Back onClick={onCancel}>{edit ? "과제로 돌아가기" : "과제 목록"}</Back>
      <h2 style={h2}>{edit ? "과제 수정" : "과제 개설"}</h2>
      <Card className="mt-3">
        {subjects.length === 0 ? (
          <div className="rounded-xl px-4 py-4 flex items-center justify-between flex-wrap gap-2" style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}>
            <div style={{ fontSize: 13, color: C.ink }}>등록된 과목이 없습니다. 과제를 어느 과목에 개설할지 먼저 정해주세요.</div>
            <GhostBtn onClick={onManageSubjects}><GraduationCap size={15} /> 과목 등록하러 가기</GhostBtn>
          </div>
        ) : (
          <>
            <Field label="과목"><select value={subjectId} disabled={lockSubject} onChange={(e) => setSubjectId(e.target.value)} className="w-full rounded-md px-3 py-2" style={{ ...selStyle, background: lockSubject ? "#F2F4FA" : "#fff" }}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            {lockSubject
              ? <div className="rounded-lg px-3 py-2 mt-1.5 inline-flex items-center gap-1.5" style={{ fontSize: 12, color: "#8A5300", background: C.amberSoft }}><Lock size={13} /> 이미 팀 {teamCount}개가 만들어져 있어 과목은 바꿀 수 없어요.</div>
              : <div className="rounded-lg px-3 py-2 mt-1.5 inline-flex items-center gap-1.5" style={{ fontSize: 12, color: C.muted, background: C.canvas }}><Users size={13} /> 이 과목 수강생 {selected?.roster.length || 0}명이 자동으로 이 과제의 참여 명단이 됩니다. (변경은 '과목 관리'에서)</div>}
            <Field label="과제명" mt><TextInput value={title} onChange={setTitle} placeholder="예) 디지털비즈니스 팀프로젝트" /></Field>
            <Field label="설명 · 제출 요건" mt><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="무엇을, 어떤 형태로 제출해야 하는지" className="w-full rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", resize: "vertical" }} /></Field>
            <Field label="최종 마감(날짜·시간)" mt><input type="datetime-local" value={finalDue} onChange={(e) => setFinalDue(e.target.value)} className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} /></Field>
            {edit && teamCount > 0 && <div className="rounded-lg px-3 py-2 mt-3" style={{ fontSize: 12, color: C.muted, background: C.canvas }}>저장하면 이미 만들어진 팀 {teamCount}개의 <b style={{ color: C.ink }}>과제명과 최종 마감</b>도 함께 바뀌어 학생 화면에 반영됩니다.</div>}
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <PrimaryBtn onClick={submit} disabled={!valid || (edit && !dirty)}><Check size={15} /> {edit ? "저장" : "개설하기"}</PrimaryBtn>
              <GhostBtn onClick={onCancel}>취소</GhostBtn>
              <span style={{ fontSize: 12, color: !title.trim() ? C.muted : dirty ? "#8A5300" : C.muted, fontWeight: dirty && title.trim() ? 700 : 400 }}>{!title.trim() ? "과제명을 입력해야 저장할 수 있어요" : edit ? (dirty ? "저장 안 된 변경이 있어요. [저장]을 눌러야 반영됩니다" : "변경 사항 없음") : "[개설하기]를 눌러야 과제가 만들어집니다"}</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* =================== STUDENT =================== */
function StudentArea({ me, switchStudent, createFor, setCreateFor, screen, setScreen, subjects, assignments, projects, addProject, patchProject, active, setActive }) {
  const mySubjectIds = subjects.filter((sb) => sb.roster.some((r) => r.sid === me.sid)).map((sb) => sb.id);
  const myAssignments = assignments.filter((a) => mySubjectIds.includes(a.subjectId));
  const isMine = (p) => p.members.some((m) => m.sid === me.sid);
  const subjectName = (id) => { const n = subjects.find((x) => x.id === id)?.name; return n ? `${n} · ${PROF_NAME} 교수님` : ""; };
  if (screen === "create" && createFor) return <CreateProjectWizard me={me} assignments={myAssignments.filter((a) => !projects.some((p) => p.assignmentId === a.id && isMine(p)))} initialAssignmentId={createFor} subjects={subjects} projects={projects} onCancel={() => setScreen("home")} onDone={(p) => { const a = assignments.find((x) => x.id === p.assignmentId); const np = addProject({ ...p, finalDue: a?.finalDue, assignmentTitle: a?.title }); setActive(np.id); setScreen("work"); }} />;
  if (screen === "work" && active) { const p = projects.find((x) => x.id === active); if (p && isMine(p)) return <ProjectWorkspace p={p} meSid={me.sid} onSwitch={(sid) => switchStudent(sid, true)} patch={(fn) => patchProject(p.id, fn)} onBack={() => setScreen("home")} />; }
  return (
    <div>
      <div className="mb-3">
        <h2 style={h2}>{me.name}님의 과제</h2>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>학번 {me.sid} · 수강 중인 과목의 과제만 보입니다. 팀장이 프로젝트를 만들어 나를 추가하면 여기에 팀이 나타나요.</div>
      </div>
      {myAssignments.length === 0 && <Empty title="아직 받은 과제가 없습니다" sub="교수님이 이 과목의 수강생으로 등록하면 과제가 여기에 표시됩니다." />}
      {myAssignments.map((a) => {
        const mine = projects.filter((p) => p.assignmentId === a.id && isMine(p));
        return (
          <Card key={a.id} className="mb-3">
            <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mb-2" style={{ fontSize: 11, fontWeight: 600, color: C.primary, background: "#EEF1FE" }}><GraduationCap size={11} /> {subjectName(a.subjectId)}</div>
            <div className="flex items-center gap-2"><span className="rounded-md p-1.5" style={{ background: "#EEF1FE" }}><ClipboardList size={16} color={C.primary} /></span><span style={{ fontWeight: 800, fontSize: 16 }}>{a.title}</span><span className="ml-auto inline-flex items-center gap-2" style={{ fontSize: 12, color: C.muted }}><CalendarDays size={13} /> {fmt(a.finalDue)} <DDayChip due={a.finalDue} /></span></div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{a.desc}</div>
            <div className="mt-3">
              {mine.length === 0 ? (
                <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#F7F8FC", border: `1px dashed ${C.line}` }}>
                  <div style={{ fontSize: 13, color: C.muted }}>아직 소속된 팀이 없습니다. 팀장이 나를 추가했다면 곧 여기에 나타나고, 팀이 없다면 <b style={{ color: C.ink }}>내가 팀장이 되어</b> 프로젝트를 만들 수 있어요.</div>
                  <PrimaryBtn onClick={() => { setCreateFor(a.id); setScreen("create"); }}><FolderPlus size={16} /> 프로젝트 생성 (팀장)</PrimaryBtn>
                </div>
              ) : mine.map((p) => {
                const leader = p.members.find((m) => m.leader);
                const iAmLeader = leader?.sid === me.sid;
                return (
                  <button key={p.id} onClick={() => { setActive(p.id); setScreen("work"); }} className="fw-row w-full text-left flex items-center gap-3 rounded-xl px-3.5 py-3 mt-2 flex-wrap" style={{ border: `1px solid ${C.line}`, background: "#FAFBFE" }}>
                    <Layers size={16} color={C.primary} /><span style={{ fontWeight: 700, fontSize: 14 }}>{p.teamName}</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, color: iAmLeader ? "#8A6A12" : C.violet, background: iAmLeader ? "#FBF3DC" : C.violetSoft }}>{iAmLeader ? <><Crown size={11} /> 내가 팀장</> : `팀원 · 팀장 ${leader?.name}`}</span>
                    <AvatarStack members={p.members} /><span className="ml-auto flex items-center gap-2" style={{ minWidth: 110 }}><span style={{ flex: 1 }}><ProgressBar pct={projPct(p)} /></span><b style={{ fontSize: 12, color: C.muted }}>{projPct(p)}%</b></span><ChevronRight size={16} color={C.muted} />
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CreateProjectWizard({ me, assignments, initialAssignmentId, subjects, projects, onCancel, onDone }) {
  const [step, setStep] = useState(1);
  const [assignmentId, setAssignmentId] = useState(initialAssignmentId || assignments[0]?.id || "");
  const [teamName, setTeamName] = useState("");
  // 프로젝트를 만든 사람(나)이 자동으로 팀장이 됩니다.
  const [members, setMembers] = useState([{ id: "m" + me.sid, sid: me.sid, name: me.name, role: "", leader: true, color: AVATARS[0] }]);
  const [tasks, setTasks] = useState([]);
  const assignment = assignments.find((a) => a.id === assignmentId);
  const roster = subjects.find((s) => s.id === assignment?.subjectId)?.roster || [];
  // 이미 같은 과제의 다른 팀에 속한 학생(이름 기준) → 선택 불가
  const taken = new Set((projects || []).filter((p) => p.assignmentId === assignmentId).flatMap((p) => p.members.map((m) => m.sid)));
  const toggleMember = (stu) => setMembers((ms) => {
    if (stu.sid === me.sid) return ms; // 팀장(나)은 빼지 못합니다
    if (ms.some((m) => m.sid === stu.sid)) return ms.filter((m) => m.sid !== stu.sid);
    return [...ms, { id: "m" + stu.sid, sid: stu.sid, name: stu.name, role: "", leader: false, color: AVATARS[ms.length % AVATARS.length] }];
  });
  const setRole = (id, role) => setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role } : m)));
  const addTask = () => setTasks((ts) => [...ts, { id: "t" + Date.now() + ts.length, title: "", owner: members[0]?.id || "", due: fromNow(7, 23, 59), submittedAt: null, ai: null }]);
  const setTask = (id, k, v) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const rmTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const canNext = step === 1 ? teamName.trim() && assignmentId : step === 2 ? members.length >= 2 : true;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Back onClick={onCancel}>취소</Back>
      <h2 style={h2}>프로젝트 생성</h2>
      <Stepper step={step} labels={["과제 선택 · 팀 이름", "팀원 선택 · 역할", "타임테이블 · 마감(분 단위)"]} />
      <Card className="mt-3">
        {step === 1 && (
          <div>
            <div className="rounded-lg px-3 py-2 mb-3 inline-flex items-center gap-1.5" style={{ fontSize: 12, color: "#8A6A12", background: "#FBF3DC" }}><Crown size={13} /> 프로젝트를 만드는 {me.name}님이 팀장이 됩니다.</div>
            <Field label="어떤 과제의 프로젝트인가요?"><select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className="w-full rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", background: "#fff" }}>{assignments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></Field>
            <Field label="팀 이름" mt><TextInput value={teamName} onChange={setTeamName} placeholder="예) 5조 — 페어웤팀" /></Field>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>교수님이 등록한 출석부에서 팀원을 클릭해 추가하세요. 추가된 팀원의 화면에도 이 프로젝트가 똑같이 나타나고, 모두 들어올 수 있습니다.</div>
            {roster.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted }}>이 과제에 등록된 수강생 명단이 없습니다. 교수님께 명단 등록을 요청해주세요.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roster.map((stu) => {
                  const picked = members.some((m) => m.sid === stu.sid);
                  const isMe = stu.sid === me.sid;
                  const busy = taken.has(stu.sid) && !picked;
                  return (
                    <button key={stu.sid} disabled={busy || isMe} onClick={() => toggleMember(stu)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5"
                      style={{ fontSize: 13, fontWeight: 600, border: `1px solid ${picked ? C.primary : C.line}`, background: picked ? C.primary : busy ? "#F2F3F6" : "#fff", color: picked ? "#fff" : busy ? "#B7BCC9" : C.ink, cursor: busy || isMe ? "not-allowed" : "pointer" }}>
                      {picked && <CheckCircle2 size={13} />}{stu.name}{isMe && " · 나(팀장)"}{busy && " · 참여중"}
                    </button>
                  );
                })}
              </div>
            )}
            {members.length < 2 && <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>팀원을 1명 이상 추가해 주세요. (팀장인 나는 자동으로 포함돼요)</div>}
            <div className="mt-4 grid gap-2">
              {members.map((m) => (
                <div key={m.id} className="rounded-lg px-3 py-2.5" style={{ border: `1px solid ${C.line}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar m={m} sm /><span className="truncate" style={{ fontWeight: 600, maxWidth: 70, flexShrink: 0 }}>{m.name}</span>
                    {m.leader && <span className="rounded-md px-2 py-1 inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: C.gold }}><Crown size={12} /> 팀장</span>}
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
function ProjectWorkspace({ p, meSid, onSwitch, patch, onBack }) {
  const [tab, setTab] = useState("chat");
  const [submitFor, setSubmitFor] = useState(null);
  const me = p.members.find((m) => m.sid === meSid) || p.members.find((m) => m.leader) || p.members[0];
  const meId = me?.id;

  const submit = async (tid, text, files) => {
    const cur = p.tasks.find((x) => x.id === tid); const isEdit = !!cur?.submittedAt;
    if (isEdit && !canEditTask(cur)) return { locked: true };           // 마감이 지난 제출물은 수정 불가
    const at = nowLocal(); const r = await detectAI(text);
    if (isEdit && !canEditTask(cur)) return { locked: true };           // AI 점검 중 마감이 지났어도 수정 불가
    patch((pr) => ({ ...pr, tasks: pr.tasks.map((t) => (t.id === tid ? { ...t, submittedAt: at, firstSubmittedAt: t.firstSubmittedAt || (isEdit ? t.submittedAt : at), edits: (t.edits || 0) + (isEdit ? 1 : 0), ai: r.ai, aiSrc: r.source, text: text.trim(), files: files || [] } : t)) }));
    return { ...r, submittedAt: at, edited: isEdit };
  };
  const addFolder = (name) => patch((pr) => ({ ...pr, folders: [...(pr.folders || []), { id: "f" + Date.now(), name }] }));
  const renameFolder = (id, name) => patch((pr) => ({ ...pr, folders: (pr.folders || []).map((f) => (f.id === id ? { ...f, name } : f)) }));
  const removeFolder = (id) => patch((pr) => ({ ...pr, folders: (pr.folders || []).filter((f) => f.id !== id), tasks: pr.tasks.map((t) => (t.folderId === id ? { ...t, folderId: null } : t)) }));
  const moveTask = (tid, folderId) => patch((pr) => ({ ...pr, tasks: pr.tasks.map((t) => (t.id === tid ? { ...t, folderId: folderId || null } : t)) }));
  const addTask = (title, owner, due) => patch((pr) => ({ ...pr, tasks: [...pr.tasks, { id: "t" + Date.now(), title, owner, due, submittedAt: null, ai: null }], chat: [...pr.chat, { id: "c" + Date.now(), sender: "sys", text: `과업 등록: ${title} · 담당 ${pr.members.find((m) => m.id === owner)?.name} · 마감 ${fmt(due)}`, ts: Date.now() }] }));
  const sendMsg = (text) => patch((pr) => ({ ...pr, chat: [...pr.chat, { id: "c" + Date.now(), sender: meId, text, ts: Date.now() }] }));
  const submitPeer = (from, entries) => patch((pr) => ({ ...pr, peerEvals: [...pr.peerEvals.filter((e) => e.from !== from), ...entries.map((e) => ({ from, ...e }))] }));
  const endProject = () => patch((pr) => ({ ...pr, ended: true, chat: [...pr.chat, { id: "c" + Date.now(), sender: "sys", text: "프로젝트가 종료되었습니다. 이제 익명 동료평가를 제출할 수 있어요.", ts: Date.now() }] }));
  const setMemberRole = (id, role) => patch((pr) => ({ ...pr, members: pr.members.map((m) => (m.id === id ? { ...m, role } : m)) }));

  const TABS = [["chat", "채팅", MessageSquare], ["calendar", "캘린더", CalendarDays], ["timeline", "타임테이블", Clock], ["board", "자료실", FolderOpen], ["score", "기여도 분석", Trophy], ["peer", "동료평가", Star], ["team", "팀 구성", Users]];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Back onClick={onBack}>내 프로젝트</Back>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 12, color: C.muted, padding: "0 6px" }}>팀원 계정 전환(시연)</span>
          {p.members.map((m) => <button key={m.id} onClick={() => onSwitch(m.sid)} className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, color: meId === m.id ? "#fff" : C.muted, background: meId === m.id ? C.primary : "transparent" }}>{m.name}</button>)}
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
      <ReminderBar tasks={p.tasks} me={me} onSubmit={(t) => setSubmitFor(t)} />
      <div className="flex gap-1 mt-3 overflow-x-auto rounded-2xl p-1.5" style={{ scrollbarWidth: "none", background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.card }}>{TABS.map(([k, label, Icon]) => <div key={k} className="flex-shrink-0"><Tab active={tab === k} onClick={() => setTab(k)} icon={<Icon size={16} />}>{label}</Tab></div>)}</div>
      <div className="mt-4">
        {tab === "chat" && <ChatTab members={p.members} chat={p.chat} me={me} finalDue={p.finalDue} sendMsg={sendMsg} addTask={addTask} />}
        {tab === "calendar" && <CalendarTab members={p.members} tasks={p.tasks} finalDue={p.finalDue} addTask={addTask} onPick={(t) => t.owner === meId && (!t.submittedAt || canEditTask(t)) && setSubmitFor(t)} meId={meId} />}
        {tab === "timeline" && <TimelineTab members={p.members} tasks={p.tasks} me={me} finalDue={p.finalDue} onSubmit={(t) => setSubmitFor(t)} addTask={addTask} />}
        {tab === "board" && <BoardTab members={p.members} tasks={p.tasks} folders={p.folders || []} isLeader={!!me?.leader} meId={meId} onEdit={(t) => setSubmitFor(t)} addFolder={addFolder} renameFolder={renameFolder} removeFolder={removeFolder} moveTask={moveTask} />}
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
function CalendarTab({ members, tasks, finalDue, addTask, onPick, meId }) {
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
              {onPick && t.owner === meId && ["pending", "missed"].includes(statusOf(t)) && <button onClick={() => onPick(t)} className="rounded-md px-2.5 py-1.5" style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: C.green }}>제출</button>}
              {onPick && t.owner === meId && canEditTask(t) && <button onClick={() => onPick(t)} className="rounded-md px-2.5 py-1.5" style={{ fontSize: 12, fontWeight: 700, color: C.primary, background: "#EEF2FF", border: "1px solid #D9E1FB" }}>수정</button>}
            </div>
          ); })}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- TIMELINE ---------- */
function TimelineTab({ members, tasks, me, finalDue, onSubmit, addTask }) {
  const [, tick] = useState(0); useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(id); }, []);
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
                  {t.owner === me?.id && canEditTask(t) && <button onClick={() => onSubmit(t)} title="마감 시각 전까지 내용을 수정할 수 있어요" className="rounded-md px-2.5 py-1.5" style={{ fontSize: 12, fontWeight: 700, color: C.primary, background: "#EEF2FE", border: "1px solid #D9E1FB" }}>수정</button>}
                  {t.owner === me?.id && t.submittedAt && !canEditTask(t) && <span className="inline-flex items-center gap-1" title="마감이 지나 수정할 수 없어요" style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}><Lock size={11} /> 수정 마감</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- 팀 자료실: 팀원이 제출한 글·파일을 한 화면에 모으고, 팀장이 폴더로 정리 ---------- */
function BoardTab({ members, tasks, folders, isLeader, meId, onEdit, addFolder, renameFolder, removeFolder, moveTask }) {
  const [, tick] = useState(0); useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(id); }, []);
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false); const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null); const [editName, setEditName] = useState("");
  const [delId, setDelId] = useState(null);
  const [openIds, setOpenIds] = useState({}); const [allOpen, setAllOpen] = useState(false);
  const subs = tasks.filter((t) => t.submittedAt).slice().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const inFolder = (t, fid) => (fid === "none" ? !t.folderId || !folders.some((f) => f.id === t.folderId) : t.folderId === fid);
  const sections = [...folders.map((f) => ({ id: f.id, name: f.name, folder: true })), { id: "none", name: "미분류", folder: false }];
  const cur = filter === "all" || filter === "none" || folders.some((f) => f.id === filter) ? filter : "all";
  const fileCount = subs.reduce((n, t) => n + (t.files ? t.files.length : 0), 0);
  const isOpen = (t) => allOpen || !!openIds[t.id];
  const mk = () => { const n = newName.trim(); if (!n) return; addFolder(n); setNewName(""); setAdding(false); };
  const chip = (id, label, n) => <button key={id} onClick={() => setFilter(id)} className="rounded-full px-3 py-1.5" style={{ fontSize: 13, fontWeight: 700, color: cur === id ? "#fff" : C.muted, background: cur === id ? C.primary : "#fff", border: `1px solid ${cur === id ? C.primary : C.line}` }}>{label} <span style={{ opacity: 0.8, fontWeight: 600 }}>{n}</span></button>;

  const Item = ({ t }) => {
    const m = members.find((x) => x.id === t.owner); const st = statusOf(t), M = SM[st];
    const long = (t.text || "").length > 90; const open = isOpen(t);
    return (
      <div className="rounded-xl px-3.5 py-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          {m && <Avatar m={m} sm />}<span style={{ fontWeight: 700, fontSize: 14 }}>{m?.name}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>· {t.title}</span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, color: M.color, background: M.soft }}><M.Icon size={11} /> {M.label}{st === "late" ? ` · ${fmtLate(lateMs(t))} 지각` : ""}</span>
          <span style={{ fontSize: 12, color: C.muted }}>제출 {fmt(t.submittedAt)}{t.edits ? ` · 수정 ${t.edits}회` : ""}</span>
          {t.owner === meId && canEditTask(t) && <button onClick={() => onEdit(t)} className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 700, color: C.primary, background: "#EEF2FE", border: "1px solid #D9E1FB" }}>수정</button>}
          {isLeader && folders.length > 0 && (
            <label className="ml-auto inline-flex items-center gap-1" style={{ fontSize: 12, color: C.muted }}><Folder size={12} />
              <select value={t.folderId && folders.some((f) => f.id === t.folderId) ? t.folderId : ""} onChange={(e) => moveTask(t.id, e.target.value)} className="rounded-md px-1.5 py-1" style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, outline: "none" }}>
                <option value="">미분류</option>{folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
          )}
        </div>
        {t.text ? (
          <div className="mt-2" style={{ fontSize: 13, color: C.ink, lineHeight: 1.65, whiteSpace: "pre-wrap", ...(open ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }) }}>{t.text}</div>
        ) : <div className="mt-2" style={{ fontSize: 12, color: C.muted }}>작성한 글 없이 파일만 제출했어요.</div>}
        {long && !allOpen && <button onClick={() => setOpenIds({ ...openIds, [t.id]: !openIds[t.id] })} style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginTop: 4 }}>{open ? "접기" : "더보기"}</button>}
        <FileChips files={t.files} />
      </div>
    );
  };

  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2"><FolderOpen size={18} color={C.primary} /><SectionTitle>팀 자료실</SectionTitle></div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setAllOpen(!allOpen)} className="fw-ghost rounded-xl px-3 py-1.5" style={{ fontSize: 13, fontWeight: 600, background: "#fff", border: `1px solid ${C.line}`, color: C.ink }}>{allOpen ? "내용 접기" : "내용 모두 펼치기"}</button>
            {isLeader && !adding && <PrimaryBtn onClick={() => setAdding(true)}><FolderPlus size={15} /> 폴더 만들기</PrimaryBtn>}
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>팀원이 제출한 글과 파일이 한곳에 모입니다. 파일을 하나하나 열어보지 않아도 모두의 결과물을 이 화면에서 바로 확인하세요. {isLeader ? "팀장은 폴더를 만들고 제출물을 정리할 수 있어요." : "폴더 정리는 팀장이 합니다."}</div>
        <div className="flex gap-2 flex-wrap mt-2" style={{ fontSize: 12, color: C.muted }}><span>제출 <b style={{ color: C.ink }}>{subs.length}건</b></span><span>첨부 파일 <b style={{ color: C.ink }}>{fileCount}개</b></span><span>폴더 <b style={{ color: C.ink }}>{folders.length}개</b></span></div>
        {adding && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") mk(); }} placeholder="폴더 이름 (예: 시장조사, 발표자료)" className="rounded-md px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", flex: 1, minWidth: 180 }} />
            <PrimaryBtn onClick={mk} disabled={!newName.trim()}>만들기</PrimaryBtn><GhostBtn onClick={() => { setAdding(false); setNewName(""); }}>취소</GhostBtn>
          </div>
        )}
      </Card>

      <div className="flex gap-2 flex-wrap mb-3">
        {chip("all", "전체", subs.length)}
        {folders.map((f) => chip(f.id, f.name, subs.filter((t) => inFolder(t, f.id)).length))}
        {chip("none", "미분류", subs.filter((t) => inFolder(t, "none")).length)}
      </div>

      {subs.length === 0 ? <Empty title="아직 제출된 자료가 없어요" sub="팀원이 과업을 제출하면 이곳에 자동으로 모여요." /> : (
        <div className="grid gap-4">
          {sections.map((sec) => {
            if (!(cur === "all" || cur === sec.id)) return null;
            const items = subs.filter((t) => inFolder(t, sec.id));
            if (sec.id === "none" && items.length === 0 && cur === "all") return null;
            return (
              <div key={sec.id}>
                <div className="flex items-center gap-2 mb-2">
                  {sec.folder ? <Folder size={16} color={C.primary} /> : <FolderOpen size={16} color={C.muted} />}
                  {editId === sec.id ? (
                    <><input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && editName.trim()) { renameFolder(sec.id, editName.trim()); setEditId(null); } }} className="rounded-md px-2 py-1" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none" }} />
                      <button onClick={() => { if (editName.trim()) { renameFolder(sec.id, editName.trim()); setEditId(null); } }} style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>저장</button><button onClick={() => setEditId(null)} style={{ fontSize: 12, color: C.muted }}>취소</button></>
                  ) : <span style={{ fontWeight: 800, fontSize: 15 }}>{sec.name}</span>}
                  <span style={{ fontSize: 12, color: C.muted }}>{items.length}건</span>
                  {isLeader && sec.folder && editId !== sec.id && (
                    <span className="ml-auto inline-flex items-center gap-2">
                      {delId === sec.id ? (
                        <><span style={{ fontSize: 12, color: C.red }}>폴더를 삭제할까요? 안의 자료는 미분류로 이동해요.</span><button onClick={() => { removeFolder(sec.id); setDelId(null); setFilter("all"); }} style={{ fontSize: 12, fontWeight: 700, color: C.red }}>삭제</button><button onClick={() => setDelId(null)} style={{ fontSize: 12, color: C.muted }}>취소</button></>
                      ) : (
                        <><button onClick={() => { setEditId(sec.id); setEditName(sec.name); }} aria-label="폴더 이름 바꾸기" style={{ color: C.muted }}><Pencil size={14} /></button><button onClick={() => setDelId(sec.id)} aria-label="폴더 삭제" style={{ color: C.muted }}><Trash2 size={14} /></button></>
                      )}
                    </span>
                  )}
                </div>
                {items.length === 0 ? <div className="rounded-xl px-4 py-3" style={{ fontSize: 12, color: C.muted, background: "#fff", border: `1px dashed ${C.line}` }}>{sec.folder ? (isLeader ? "비어 있어요. 아래 제출물의 '폴더 이동'에서 이 폴더를 고르면 여기에 담겨요." : "비어 있는 폴더예요.") : "정리할 자료가 없어요."}</div>
                  : <div className="grid gap-2">{items.map((t) => <Item key={t.id} t={t} />)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- 점수 산정 기준 안내 ---------- */
function ScoreRules() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1" style={{ fontSize: 13, fontWeight: 700, color: C.primary }}><ClipboardCheck size={14} /> 점수 산정 기준 {open ? "접기" : "보기"} <ChevronRight size={12} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .18s" }} /></button>
      {open && (
        <div className="rounded-xl px-4 py-3 mt-2 grid gap-4" style={{ background: "#F7F8FC", border: `1px solid ${C.line}` }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>① 정시 제출 점수 (과업별 · 마감 후 늦은 시간 기준)</div>
            {LATE_TIERS.map((x) => (
              <div key={x.key} className="flex items-center gap-2 py-1" style={{ fontSize: 13, borderBottom: `1px dashed ${C.line}` }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{x.label}</span><span style={{ flex: 1.4, color: C.muted }}>{x.range}</span>
                <span style={{ fontWeight: 800, width: 48, textAlign: "right", color: x.pts >= 80 ? C.green : x.pts >= 40 ? C.amber : C.red }}>{x.pts}점</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>② AI 인정 계수 (AI 점검 % 기준, 3구간)</div>
            {[["0 ~ 29%", "사용하지 않았을 가능성 높음", "100%", C.green], ["30 ~ 69%", "일부 사용 가능성 · 참고 표시만", "85%", C.amber], ["70 ~ 100%", "사용 의심 · 교수님 확인 대상", "30%", C.red]].map(([a, b, c, col]) => (
              <div key={a} className="flex items-center gap-2 py-1" style={{ fontSize: 13, borderBottom: `1px dashed ${C.line}` }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{a}</span><span style={{ flex: 1.4, color: C.muted }}>{b}</span><span style={{ fontWeight: 800, width: 48, textAlign: "right", color: col }}>{c}</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>억울한 감점을 막기 위해 <b style={{ color: C.ink }}>확실한 구간(70% 이상)에서만 크게</b> 반영하고, 애매한 구간은 소폭 반영합니다. AI 탐지 도구 전체에 통용되는 공식 기준표는 없고, 도구마다 % 의미도 다릅니다(Turnitin·Copyleaks는 AI로 보이는 글의 비율, GPTZero·Originality.ai는 AI일 확신도). 그래서 참고한 공개 자료의 숫자로 구간을 잡았습니다: Turnitin은 20% 미만 결과를 신뢰도가 낮고 오탐 가능성이 높다고 안내하고, GPTZero는 AI 판정 기준 예시로 65%·80%를 듭니다. 30·70 경계는 이를 바탕으로 한 시제품 정책값입니다.</div>
          </div>
          <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 800, marginBottom: 2 }}>③ 계산 방법</div>
            • <b>정시 제출</b> = 과업별 정시 제출 점수의 평균<br />
            • <b>AI 독자성</b> = 제출한 과업의 AI 인정 계수 평균<br />
            • <b>기여도</b> = 과업별 (정시 제출 점수 × AI 인정 계수)의 평균<br />
            • <b>종합점수</b> = 위 세 항목의 평균 (마감 전·진행 중인 과업은 계산에서 제외)
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>구간과 점수는 시제품 기본값이며, 정식 서비스에서는 교수님이 과제별로 조정할 수 있게 할 예정입니다. AI 점검은 참고 근거이고 최종 판단은 교수님이 합니다.</div>
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
        <ScoreRules />
        <div style={{ width: "100%", height: 210 }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 6, right: 44, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={56} tick={{ fontSize: 13, fill: C.ink, fontWeight: 600 }} />
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
      <div className="rounded-xl px-4 py-3 mt-4 flex items-start gap-2" style={{ background: "#fff", border: `1px solid ${C.line}`, fontSize: 13, color: C.muted }}><AlertTriangle size={16} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }} /><span><b style={{ color: C.ink }}>AI 복붙 점검은 점수 근거 중 하나이지만 확정 판정이 아닙니다.</b> 오탐 가능성이 있어 교수님이 근거를 직접 확인하도록 표시만 하며, 최종 평가는 교수님이 합니다. 시제품에서는 시연용 추정을 사용하며, 실제 AI 탐지 API는 사업화 단계에서 연동합니다. 점검 출처는 과업별 근거표에 표시됩니다.</span></div>
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
  const tokens = (value || "").split(",").map((x) => x.trim()).filter(Boolean);
  const presetSel = tokens.filter((t) => ROLE_PRESETS.includes(t));
  // 입력 중인 글자는 따로 보관합니다(띄어쓰기가 사라지지 않도록, 저장할 때만 공백을 정리)
  const [etcText, setEtcText] = useState(tokens.find((t) => !ROLE_PRESETS.includes(t)) || "");
  const [showEtc, setShowEtc] = useState(!!etcText);
  const emit = (presets, text) => { const clean = text.replace(/,/g, " ").replace(/\s+/g, " ").trim(); onChange([...presets, ...(clean ? [clean] : [])].join(", ")); };
  const togglePreset = (p) => { const next = presetSel.includes(p) ? presetSel.filter((x) => x !== p) : [...presetSel, p]; emit(next, etcText); };
  const etcOn = showEtc || etcText.trim() !== "";
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {ROLE_PRESETS.map((p) => {
          const on = presetSel.includes(p);
          return <button key={p} onClick={() => togglePreset(p)} className="rounded-full px-2.5 py-1" style={{ fontSize: 12, fontWeight: 600, border: `1px solid ${on ? C.primary : C.line}`, background: on ? C.primary : "#fff", color: on ? "#fff" : C.ink }}>{p}</button>;
        })}
        <button onClick={() => setShowEtc((v) => !v)} className="rounded-full px-2.5 py-1" style={{ fontSize: 12, fontWeight: 600, border: `1px solid ${etcOn ? C.violet : C.line}`, background: etcOn ? C.violet : "#fff", color: etcOn ? "#fff" : C.ink }}>기타</button>
      </div>
      {etcOn && <input value={etcText} onChange={(e) => { setEtcText(e.target.value); emit(presetSel, e.target.value); }} placeholder="기타 역할 직접 입력 (띄어쓰기 가능)" className="rounded-md px-2 py-1.5 mt-2 w-full" style={{ fontSize: 13, border: `1px solid ${C.line}`, outline: "none" }} />}
    </div>
  );
}

/* ---------- SUBMIT MODAL ---------- */
function SubmitModal({ task, onClose, onSubmit }) {
  const editing = !!task.submittedAt;                               // 이미 제출한 과업을 마감 전에 수정하는 경우
  const [text, setText] = useState(task.text || ""); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState(task.files || []); const [fileErr, setFileErr] = useState(""); const [lockMsg, setLockMsg] = useState("");
  const doneWord = editing ? "수정 완료!" : "제출 완료!";
  const done = result != null; const len = text.trim().length;
  const MAX_FILES = 5, MAX_MB = 10;
  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []); e.target.value = ""; if (!picked.length) return;
    let err = ""; const next = files.slice();
    picked.forEach((f) => {
      if (next.length >= MAX_FILES) { err = `파일은 최대 ${MAX_FILES}개까지 첨부할 수 있어요.`; return; }
      if (f.size > MAX_MB * 1048576) { err = `${f.name}: ${MAX_MB}MB를 넘어서 첨부할 수 없어요.`; return; }
      next.push({ id: "f" + Date.now() + next.length, name: f.name, size: f.size, url: URL.createObjectURL(f) });
    });
    setFiles(next); setFileErr(err);
  };
  const nowDue = task.due ? Date.now() - new Date(task.due).getTime() : 0;
  const nowLate = nowDue > 0;
  const nowTier = nowLate ? LATE_TIERS.slice(1, 5).find((x) => nowDue <= x.max) : null;
  const go = async () => { if (!text.trim() || busy) return; setBusy(true); const r = await onSubmit(task.id, text, files); if (r.locked) { setLockMsg("마감 시각이 지나 수정할 수 없어요. 제출한 내용은 그대로 유지됩니다."); setBusy(false); return; } const lm = task.due ? new Date(r.submittedAt).getTime() - new Date(task.due).getTime() : 0; setResult({ ...r, late: lm > 0 ? lm : 0, tier: lm > 0 ? LATE_TIERS.slice(1, 5).find((x) => lm <= x.max) : null }); setBusy(false); };
  const flagged = done && isFlagged(result.ai);
  const mid = done && !flagged && result.ai >= AI_LOW;
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: "rgba(20,22,43,0.5)", backdropFilter: "blur(3px)", zIndex: 50 }} onClick={onClose}>
      <div className="fw-fade rounded-2xl w-full" style={{ maxWidth: 520, background: "#fff", boxShadow: SH.pop }} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.line}` }}><div className="flex items-center gap-2"><Search size={16} color={C.primary} /><span style={{ fontWeight: 700 }}>{editing ? "제출 내용 수정 · AI 복붙 점검" : "자료 제출 · AI 복붙 점검"}</span></div><button onClick={onClose} style={{ color: C.muted }}><X size={18} /></button></div>
        <div className="px-5 py-4">
          <div style={{ fontSize: 13, color: C.muted }}>과업</div><div style={{ fontWeight: 700, marginBottom: 4 }}>{task.title}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>마감 {fmt(task.due)}</div>
          {!done && editing && <div className="rounded-lg px-3 py-2 mb-3" style={{ fontSize: 12, background: "#EEF2FF", color: C.primary }}><b>마감 시각({fmt(task.due)})까지만 수정할 수 있어요.</b> 마감이 지나면 수정할 수 없고, 수정하면 AI 점검을 다시 합니다.</div>}
          {!done && !editing && nowLate && <div className="rounded-lg px-3 py-2 mb-3" style={{ fontSize: 12, background: C.amberSoft, color: "#8A5300" }}><b>마감이 {fmtLate(nowDue)} 지났어요.</b> 지금 제출하면 지연 제출로 기록되고, 정시 제출 점수는 <b>{nowTier.pts}점</b>({nowTier.label})이 반영돼요.</div>}
          {!done ? (
            <>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 6 }}>찾은 자료를 <b>본인 언어로 정리</b>해 붙여넣어 주세요. 제출하면 AI 탐지로 복붙 여부를 점검하고, 점검 결과는 기여도 근거로 기록됩니다.</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="예) 찾아보니 이 시장은 ~한 구조였고, 내 생각엔 ~ 때문에 우리 제품에 이렇게 적용하면 될 것 같다..." className="w-full rounded-lg px-3 py-2" style={{ fontSize: 14, border: `1px solid ${C.line}`, outline: "none", resize: "vertical" }} />
              <div className="flex items-center justify-between mt-1" style={{ fontSize: 12, color: C.muted }}><span>{len}자</span></div>
              <div className="mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 cursor-pointer" style={{ fontSize: 13, fontWeight: 600, color: C.primary, background: "#EEF2FF", border: "1px solid #D9E1FB" }}><Paperclip size={14} /> 참고 파일 첨부 (선택)<input type="file" multiple onChange={pickFiles} style={{ display: "none" }} /></label>
                  <span style={{ fontSize: 11, color: C.muted }}>최대 {MAX_FILES}개 · 파일당 {MAX_MB}MB · 한글/워드/PPT/PDF/이미지 등</span>
                </div>
                {files.length > 0 && <div className="flex gap-1.5 flex-wrap mt-2">{files.map((f) => <span key={f.id} className="inline-flex items-center gap-1 rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, background: "#F4F6FC", border: `1px solid ${C.line}` }}><Paperclip size={11} /> <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span> <span style={{ color: C.muted, fontWeight: 400 }}>{fmtSize(f.size)}</span><button onClick={() => setFiles(files.filter((x) => x.id !== f.id))} aria-label="첨부 삭제" style={{ color: C.muted }}><X size={12} /></button></span>)}</div>}
                {fileErr && <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>{fileErr}</div>}
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>첨부 파일은 참고 자료로만 저장되고, AI 점검은 위에 작성한 글에만 적용됩니다. 제출한 글과 파일은 팀 자료실에 모입니다.</div>
              </div>
              {lockMsg && <div className="rounded-lg px-3 py-2 mt-3" style={{ fontSize: 12, background: C.redSoft, color: C.red, fontWeight: 600 }}>{lockMsg}</div>}
              <div className="flex gap-2 mt-3">{!lockMsg && <button onClick={go} disabled={!text.trim() || busy} className="rounded-md px-4 py-2" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: text.trim() && !busy ? C.green : "#A9C9B6" }}>{busy ? "AI 탐지 중..." : editing ? "수정 저장하고 다시 검사" : "제출하고 검사"}</button>}<button onClick={onClose} className="rounded-md px-4 py-2" style={{ fontSize: 14, fontWeight: 600, background: "#fff", border: `1px solid ${C.line}` }}>취소</button></div>
            </>
          ) : (
            <div className="rounded-xl px-4 py-4 text-center" style={{ background: flagged ? C.redSoft : mid ? C.amberSoft : C.greenSoft }}>
              <div style={{ fontSize: 13, color: C.muted }}>AI 작성 추정치</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: flagged ? C.red : mid ? C.amber : C.green }}>{result.ai}%</div>
              <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 mt-1" style={{ fontSize: 11, fontWeight: 700, background: "#fff", color: result.source === "copyleaks" ? C.primary : C.muted }}>{AI_SRC[result.source]}</div>
              {result.note && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{result.note}</div>}
              <div style={{ fontSize: 12, color: C.ink, marginTop: 6 }}>{editing && <b>수정 저장 · </b>}{result.late > 0 ? <>지연 제출 · <b>{fmtLate(result.late)}</b> 지각 → 정시 점수 <b>{result.tier.pts}점</b></> : <>정시 제출 → 정시 점수 <b>100점</b></>}{files.length > 0 && <> · 참고 파일 {files.length}개 첨부</>}</div>
              <div style={{ fontSize: 13, color: C.ink, marginTop: 6 }}>{flagged ? "사용 의심(70% 이상) → 점수에 크게 반영되고 교수님 확인 대상으로 표시됩니다. 본인 언어로 다시 정리하면 인정도가 올라갑니다." : mid ? "일부 사용 가능성(30~69%) → 점수에 소폭만 반영되며 교수님 확인 대상은 아닙니다. " + doneWord : "사용하지 않았을 가능성 높음(30% 미만) → 감점 없이 본인 정리로 인정됩니다. " + doneWord}</div>
              <button onClick={onClose} className="rounded-md px-4 py-2 mt-3" style={{ fontSize: 14, fontWeight: 600, color: "#fff", background: C.primary }}>확인</button>
            </div>
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
  return <div className="grid gap-1.5">{mine.map((t) => <EvidenceRow key={t.id} t={t} />)}</div>;
}
function EvidenceRow({ t }) {
  const [open, setOpen] = useState(false);
  const st = statusOf(t), M = SM[st];
  const tp = timePts(t);
  const pts = tp == null ? null : Math.round((tp / 100) * authFactor(t.ai) * 100);
  const ms = lateMs(t);
  const lateTxt = st === "late" ? `${fmtLate(ms)} 지각` : null;
  const hasContent = !!(t.text || (t.files && t.files.length));
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: "#F7F8FC", border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontWeight: 700, fontSize: 13 }}>{t.title}</span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, color: M.color, background: M.soft }}><M.Icon size={11} /> {M.label}{lateTxt ? ` · ${lateTxt}` : ""}</span>
        <span className="ml-auto" style={{ fontSize: 12, fontWeight: 800, color: pts == null ? C.muted : pts >= 80 ? C.green : pts >= 50 ? C.amber : C.red }}>{pts == null ? "집계 전" : `${pts}점 반영`}</span>
      </div>
      <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-1" style={{ fontSize: 12, color: C.muted }}>
        <span>마감 {fmt(t.due)}</span>
        <span>제출 {t.submittedAt ? fmt(t.submittedAt) : "—"}</span>
        <span style={{ color: isFlagged(t.ai) ? C.red : C.muted, fontWeight: isFlagged(t.ai) ? 700 : 400 }}>AI 점검 {t.ai == null ? "—" : `${t.ai}% · ${AI_LABEL(t.ai)}`}{t.ai != null && <span style={{ fontWeight: 400, color: C.muted }}> ({AI_SRC[t.aiSrc] || "샘플 데이터"})</span>}</span>
      </div>
      {tp != null && (
        <div className="mt-1" style={{ fontSize: 12, color: C.muted }}>
          정시 점수 <b style={{ color: C.ink }}>{tp}점</b>{st === "late" ? ` (${LATE_TIERS.find((x) => x.pts === tp && x.key !== "missed")?.label})` : st === "missed" ? " (미제출)" : ""}
          {st !== "missed" && <> × AI 인정 <b style={{ color: C.ink }}>{Math.round(authFactor(t.ai) * 100)}%</b> = <b style={{ color: C.ink }}>{pts}점</b></>}
        </div>
      )}
      {hasContent && (
        <div className="mt-1.5">
          <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 700, color: C.primary }}><FileText size={12} /> {open ? "제출 내용 닫기" : "제출 내용 보기"}{t.files && t.files.length > 0 ? ` · 첨부 ${t.files.length}개` : ""}</button>
          {open && (
            <div className="rounded-md px-3 py-2 mt-1.5" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              {t.text && <div style={{ fontSize: 13, color: C.ink, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{t.text}</div>}
              <FileChips files={t.files} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function FileChips({ files }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {files.map((f) => {
        const body = <><Paperclip size={12} /> <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span> <span style={{ color: C.muted, fontWeight: 400 }}>{fmtSize(f.size)}</span>{f.url && <Download size={12} />}</>;
        const st = { fontSize: 12, fontWeight: 600, color: C.ink, background: "#EEF2FF", border: `1px solid #D9E1FB` };
        return f.url
          ? <a key={f.id} href={f.url} download={f.name} className="inline-flex items-center gap-1 rounded-md px-2 py-1" style={st}>{body}</a>
          : <span key={f.id} className="inline-flex items-center gap-1 rounded-md px-2 py-1" style={st} title="샘플 데이터라 실제 파일은 없습니다">{body}</span>;
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
