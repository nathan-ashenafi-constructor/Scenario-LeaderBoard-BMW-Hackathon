/**
 * ScenarioRank AI v3 — Self-Contained Frontend
 * 
 * This file is intentionally self-contained (no missing imports).
 * Place this at: src/Index.tsx  OR  src/pages/Index.tsx
 * 
 * Requires: server.mjs running on port 3001 for Live Mode
 */

import { useState, useRef, useCallback, useEffect } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface CandidateInput { id: string; name: string; description: string; }
interface PipelineStage { id: string; label: string; status: "pending" | "running" | "completed" | "failed"; summary?: string; duration_ms?: number; }
interface CriterionScore { score: number; confidence: number; evidence: string; reasoning: string; }
interface RiskProfile { execution_risk: number; culture_risk: number; time_risk: number; adaptability_risk: number; confidence_risk: number; opportunity_cost_risk: number; }
interface OutcomeModel { expected_execution_success: number; scenario_fit: number; adaptability_score: number; likely_outcome: string; strategic_label: string; expected_outcome_score?: number; }
interface CandidateEvaluation { candidate_id: string; candidate_name: string; rank: number; weighted_fit_score: number; risk_adjusted_score: number; expected_outcome_score: number; overall_confidence: number; strategic_labels: string[]; winner_reason?: string; trade_off_note?: string; criteria_scores: Record<string, CriterionScore>; strengths: string[]; weaknesses: string[]; risk_profile: RiskProfile; outcome_model: OutcomeModel; }
interface DecisionResult { recommended_candidate_id: string; recommended_candidate_name: string; decision_mode: string; scenario: string; final_label: string; key_reason: string; overall_confidence: number; executive_interpretation: string; }
interface TradeOffCard { title: string; description: string; type: string; severity?: string; }
interface AdaptabilityProfile { candidate_name: string; adaptability_score: number; best_scenario: string; worst_scenario: string; resilience_note: string; }
interface AgentOutput { agent_name: string; agent_role: string; inputs: string[]; outputs: string[]; summary: string; }
interface BiasReview { candidate_id: string; candidate_name: string; overall_confidence: number; bias_flags: Array<{ type: string; severity: string; description: string; }>; recommend_human_review: boolean; }
interface PairResult { pair: [string, string]; pair_score: number; explanation: string; }
interface PipelineResponse { pipeline_steps: PipelineStage[]; role_analysis: { title: string; key_requirements: string[]; complexity: string; }; scenario_analysis: { scenario: string; key_pressures: string[]; weight_rationale: string; }; candidate_evaluations: CandidateEvaluation[]; bias_confidence_reviews: BiasReview[]; decision_result: DecisionResult; pairing_result?: { best_pair: PairResult; top_pairs: PairResult[]; }; trade_offs: TradeOffCard[]; adaptability_profiles: AdaptabilityProfile[]; agent_outputs: AgentOutput[]; executive_summary: { recommendation: string; reason: string; trade_off: string; opportunity_cost: string; adaptability: string; alternative: string; }; }

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const BACKEND_URL = "http://localhost:3001";

const SCENARIOS = [
  "Post-merger integration with cultural clash risk",
  "Rapid scaling in a new geographic market",
  "Digital transformation in a legacy enterprise",
  "Crisis turnaround with limited runway",
  "Greenfield product launch in competitive market",
];

const DECISION_MODES = [
  { value: "best_fit", label: "Best Fit" },
  { value: "lowest_risk", label: "Lowest Risk" },
  { value: "best_expected_outcome", label: "Best Expected Outcome" },
];

const DEFAULT_CANDIDATES: CandidateInput[] = [
  { id: "c1", name: "Alexandra Chen", description: "15 years in enterprise SaaS, led 3 post-merger integrations at Fortune 500 companies. Known for data-driven decision making and cross-functional alignment. MBA from Wharton." },
  { id: "c2", name: "Marcus Rodriguez", description: "Operator turned strategist. Scaled two companies from seed to Series C. Deep ops background, high execution velocity. Sometimes clashes with legacy culture." },
  { id: "c3", name: "Priya Nair", description: "Chief of Staff turned GM. Exceptional at navigating ambiguity and building coalition. Lower on pure execution speed but high on stakeholder trust and long-term thinking." },
];

const INITIAL_STAGES: PipelineStage[] = [
  { id: "role", label: "Role Analysis", status: "pending" },
  { id: "scenario", label: "Scenario Calibration", status: "pending" },
  { id: "scoring", label: "Candidate Scoring", status: "pending" },
  { id: "bias", label: "Bias & Confidence Review", status: "pending" },
  { id: "outcome", label: "Outcome Modeling", status: "pending" },
  { id: "decision", label: "Decision Engine", status: "pending" },
  { id: "pairing", label: "Pair Simulation", status: "pending" },
];

// ─── SERVICE ──────────────────────────────────────────────────────────────────

type ServiceMode = "mock" | "live";
let _mode: ServiceMode = "mock";
export const getServiceMode = () => _mode;
export const setServiceMode = (m: ServiceMode) => { _mode = m; };

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function buildMockResponse(candidates: CandidateInput[]): PipelineResponse {
  const evals: CandidateEvaluation[] = candidates.map((c, i) => ({
    candidate_id: c.id, candidate_name: c.name, rank: i + 1,
    weighted_fit_score: parseFloat((7.8 - i * 0.6).toFixed(2)),
    risk_adjusted_score: parseFloat((7.2 - i * 0.5).toFixed(2)),
    expected_outcome_score: parseFloat((7.5 - i * 0.55).toFixed(2)),
    overall_confidence: parseFloat((0.82 - i * 0.06).toFixed(2)),
    strategic_labels: i === 0 ? ["High Fit", "Proven Track Record"] : i === 1 ? ["High Velocity", "Execution Risk"] : ["Relationship Builder", "Slow Ramp"],
    winner_reason: i === 0 ? "Strongest alignment across all criteria with demonstrated track record in similar contexts." : undefined,
    trade_off_note: i === 1 ? "High upside but execution risk in legacy environments." : undefined,
    criteria_scores: {
      "Leadership": { score: 8 - i, confidence: 0.85, evidence: "Strong track record", reasoning: "Demonstrated leadership in complex environments" },
      "Domain Expertise": { score: 7.5 - i * 0.5, confidence: 0.78, evidence: "15+ years experience", reasoning: "Deep domain knowledge" },
      "Cultural Fit": { score: 7 - i * 0.8, confidence: 0.72, evidence: "Interview signals", reasoning: "Compatible with company culture" },
    },
    strengths: i === 0 ? ["Data-driven", "Cross-functional alignment", "Post-merger experience"] : i === 1 ? ["Execution velocity", "Founder mindset", "Scaling experience"] : ["Stakeholder trust", "Ambiguity navigation", "Long-term thinking"],
    weaknesses: i === 0 ? ["May over-index on process"] : i === 1 ? ["Cultural integration risk"] : ["Slower execution pace"],
    risk_profile: { execution_risk: 20 + i * 8, culture_risk: 15 + i * 10, time_risk: 18 + i * 5, adaptability_risk: 12 + i * 6, confidence_risk: 10 + i * 4, opportunity_cost_risk: 22 + i * 3 },
    outcome_model: { expected_execution_success: 82 - i * 7, scenario_fit: 85 - i * 6, adaptability_score: 78 - i * 5, likely_outcome: i === 0 ? "Successful integration with measurable KPI improvement within 18 months" : i === 1 ? "Fast results but potential cultural friction in Q2-Q3" : "Stable execution with slower ramp, strong by month 12", strategic_label: i === 0 ? "Safe Bet" : i === 1 ? "High Upside, High Risk" : "Steady Builder", expected_outcome_score: 78 - i * 6 },
  }));

  return {
    pipeline_steps: INITIAL_STAGES.map(s => ({ ...s, status: "completed", summary: `${s.label} completed.`, duration_ms: 800 + Math.random() * 1200 })),
    role_analysis: { title: "Strategic Leadership Role", key_requirements: ["Executive presence", "Change management", "Data literacy", "Stakeholder alignment"], complexity: "High" },
    scenario_analysis: { scenario: SCENARIOS[0], key_pressures: ["Speed of integration", "Cultural alignment", "Retention risk"], weight_rationale: "Post-merger scenarios heavily weight culture fit and execution track record" },
    candidate_evaluations: evals,
    bias_confidence_reviews: candidates.map((c, i) => ({ candidate_id: c.id, candidate_name: c.name, overall_confidence: 0.82 - i * 0.06, bias_flags: i === 1 ? [{ type: "Halo Effect", severity: "low", description: "Strong founder narrative may inflate scores" }] : [], recommend_human_review: i === 2 })),
    decision_result: { recommended_candidate_id: candidates[0].id, recommended_candidate_name: candidates[0].name, decision_mode: "best_fit", scenario: SCENARIOS[0], final_label: "Recommended Hire", key_reason: "Strongest alignment across all dimensions with proven post-merger track record.", overall_confidence: 0.84, executive_interpretation: `${candidates[0].name} presents the highest composite score and lowest integration risk. Given the post-merger context, their track record makes them the clear recommendation.` },
    trade_offs: [
      { title: "Execution Speed Sacrifice", description: `Choosing ${candidates[0].name} over ${candidates[1].name} trades some velocity for stability.`, type: "sacrifice", severity: "low" },
      { title: "Cultural Integration Gain", description: "Lower cultural clash risk significantly improves 12-month retention probability.", type: "gain", severity: "medium" },
      { title: "Opportunity Cost", description: `${candidates[1].name}'s upside in a clean-slate scenario is higher, but this context penalizes that risk profile.`, type: "opportunity_cost", severity: "medium" },
    ],
    adaptability_profiles: candidates.map((c, i) => ({ candidate_name: c.name, adaptability_score: 78 - i * 5, best_scenario: "Post-merger integration", worst_scenario: "Greenfield product launch", resilience_note: i === 0 ? "Highly resilient; adapts strategy to constraints" : i === 1 ? "Strong in growth; struggles in structured legacy environments" : "Consistent across scenarios but limited ceiling" })),
    agent_outputs: [
      { agent_name: "Role Agent", agent_role: "Extracts criteria and weights from role description (LLM)", inputs: ["Role title", "Role description"], outputs: ["Criteria list", "Baseline weights"], summary: "Identified 4 core criteria with leadership and domain expertise weighted highest." },
      { agent_name: "Decision Agent", agent_role: "Ranks candidates deterministically by mode", inputs: ["All evaluations", "Decision mode"], outputs: ["Ranked list", "Explanations"], summary: `${candidates[0].name} ranked #1 by weighted fit score. Ranking is deterministic; explanations are LLM-generated.` },
    ],
    executive_summary: { recommendation: `Hire ${candidates[0].name}`, reason: "Best composite score and lowest integration risk given the post-merger scenario.", trade_off: `You sacrifice some execution velocity vs ${candidates[1].name}.`, opportunity_cost: `${candidates[1].name} would outperform in a greenfield or high-growth context.`, adaptability: `${candidates[0].name} shows the highest adaptability across future scenario shifts.`, alternative: `If speed is paramount, reconsider ${candidates[1].name} with additional culture coaching.` },
  };
}

async function runMock(candidates: CandidateInput[], onStage: (s: PipelineStage[]) => void): Promise<PipelineResponse> {
  const stages = [...INITIAL_STAGES].map(s => ({ ...s }));
  for (let i = 0; i < stages.length; i++) {
    stages[i].status = "running"; onStage([...stages]);
    await delay(600 + Math.random() * 700);
    stages[i].status = "completed"; stages[i].summary = `${stages[i].label} completed.`; stages[i].duration_ms = Math.round(700 + Math.random() * 1200);
    onStage([...stages]);
    await delay(100);
  }
  return buildMockResponse(candidates);
}

async function runLive(
  request: { role: { title: string; description: string }; scenario: string; decision_mode: string; candidates: CandidateInput[]; options: { enable_pair_simulation: boolean }; },
  onStage: (s: PipelineStage[]) => void
): Promise<PipelineResponse> {
  return new Promise((resolve, reject) => {
    fetch(`${BACKEND_URL}/api/decision/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }).then(res => {
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result: PipelineResponse | null = null;

      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) { if (result) resolve(result); else reject(new Error("Stream ended without result")); return; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;
          for (const line of lines) {
            if (line.startsWith("event: stage_update")) continue;
            if (line.startsWith("event: complete")) continue;
            if (line.startsWith("event: error")) continue;
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (Array.isArray(data)) { onStage(data); }
                else if (data.candidate_evaluations) { result = data; }
                else if (data.message) { reject(new Error(data.message)); return; }
              } catch { /* skip malformed */ }
            }
          }
          return pump();
        });
      }
      return pump();
    }).catch(reject);
  });
}

// ─── TINY UI HELPERS ──────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false)[]) { return classes.filter(Boolean).join(" "); }

function Badge({ children, color = "default" }: { children: React.ReactNode; color?: "default" | "green" | "amber" | "red" | "blue" }) {
  const colors = { default: "bg-white/10 text-white/70", green: "bg-emerald-400/15 text-emerald-300", amber: "bg-amber-400/15 text-amber-300", red: "bg-red-400/15 text-red-300", blue: "bg-blue-400/15 text-blue-300" };
  return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", colors[color])}>{children}</span>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-white/10 bg-white/5 backdrop-blur p-5", className)}>{children}</div>;
}

function ScoreBar({ value, max = 10, color = "#f59e0b" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

// ─── PHASE COMPONENTS ─────────────────────────────────────────────────────────

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 gap-8">
      <div className="space-y-3">
        <div className="text-xs font-semibold tracking-widest text-amber-400 uppercase">Decision Intelligence Platform</div>
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-amber-400">ScenarioRank</span> <span className="text-white">AI</span>
        </h1>
        <p className="text-white/50 max-w-lg mx-auto text-base leading-relaxed">
          A multi-agent pipeline that scores candidates against real leadership scenarios — deterministic math, LLM interpretation.
        </p>
      </div>
      <button
        onClick={onStart}
        className="px-8 py-3 rounded-xl bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition-all"
      >
        Start Evaluation →
      </button>
    </div>
  );
}

function EvalForm({
  role, setRole, scenario, setScenario, decisionMode, setDecisionMode,
  candidates, setCandidates, enablePairing, setEnablePairing, onRun, isRunning,
}: {
  role: { title: string; description: string }; setRole: (r: { title: string; description: string }) => void;
  scenario: string; setScenario: (s: string) => void;
  decisionMode: string; setDecisionMode: (m: string) => void;
  candidates: CandidateInput[]; setCandidates: (c: CandidateInput[]) => void;
  enablePairing: boolean; setEnablePairing: (b: boolean) => void;
  onRun: () => void; isRunning: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h2 className="text-xl font-bold text-white">Configure Evaluation</h2>

      {/* Role */}
      <Card>
        <div className="space-y-3">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Role</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
            placeholder="Role title (e.g. VP of Product)"
            value={role.title}
            onChange={e => setRole({ ...role, title: e.target.value })}
          />
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 resize-none"
            rows={3}
            placeholder="Role description — context, responsibilities, must-haves..."
            value={role.description}
            onChange={e => setRole({ ...role, description: e.target.value })}
          />
        </div>
      </Card>

      {/* Scenario + Mode */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest block mb-2">Scenario</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
            value={scenario}
            onChange={e => setScenario(e.target.value)}
          >
            {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Card>
        <Card>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest block mb-2">Decision Mode</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
            value={decisionMode}
            onChange={e => setDecisionMode(e.target.value)}
          >
            {DECISION_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Card>
      </div>

      {/* Candidates */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Candidates ({candidates.length})</label>
          <button
            className="text-xs text-amber-400 hover:text-amber-300"
            onClick={() => setCandidates([...candidates, { id: `c${Date.now()}`, name: "", description: "" }])}
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <div key={c.id} className="space-y-1.5 border border-white/5 rounded-lg p-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none"
                  placeholder="Candidate name"
                  value={c.name}
                  onChange={e => { const updated = [...candidates]; updated[i] = { ...c, name: e.target.value }; setCandidates(updated); }}
                />
                {candidates.length > 2 && (
                  <button className="text-white/30 hover:text-red-400 text-xs" onClick={() => setCandidates(candidates.filter((_, j) => j !== i))}>✕</button>
                )}
              </div>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder-white/30 focus:outline-none resize-none"
                rows={2}
                placeholder="Background, experience, strengths, context..."
                value={c.description}
                onChange={e => { const updated = [...candidates]; updated[i] = { ...c, description: e.target.value }; setCandidates(updated); }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Options */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setEnablePairing(!enablePairing)}
          className={cn("w-9 h-5 rounded-full transition-all relative", enablePairing ? "bg-amber-400" : "bg-white/20")}
        >
          <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", enablePairing ? "left-4" : "left-0.5")} />
        </button>
        <span className="text-sm text-white/60">Enable pair simulation</span>
      </div>

      {/* Run */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className="w-full py-3 rounded-xl bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? "Running Pipeline..." : "▶ Run Decision Pipeline"}
      </button>
    </div>
  );
}

function PipelineProgress({ stages }: { stages: PipelineStage[] }) {
  if (!stages.length) return null;
  const statusIcon = (s: string) => s === "completed" ? "✓" : s === "running" ? "◌" : s === "failed" ? "✕" : "○";
  const statusColor = (s: string) => s === "completed" ? "text-emerald-400" : s === "running" ? "text-amber-400 animate-pulse" : s === "failed" ? "text-red-400" : "text-white/20";
  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <Card>
        <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-widest">Agent Pipeline</h3>
        <div className="space-y-2">
          {stages.map(s => (
            <div key={s.id} className="flex items-center gap-3">
              <span className={cn("text-sm font-mono w-4 text-center", statusColor(s.status))}>{statusIcon(s.status)}</span>
              <span className={cn("text-sm flex-1", s.status === "running" ? "text-white" : s.status === "completed" ? "text-white/60" : "text-white/25")}>{s.label}</span>
              {s.duration_ms && <span className="text-xs text-white/30">{(s.duration_ms / 1000).toFixed(1)}s</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Results({ response }: { response: PipelineResponse }) {
  const [tab, setTab] = useState<"overview" | "candidates" | "analysis" | "agents">("overview");
  const winner = response.candidate_evaluations[0];

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
      {/* Winner Hero */}
      <Card className="border-amber-400/30 bg-amber-400/5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge color="amber">Recommended</Badge>
            <Badge color="default">{response.decision_result.final_label}</Badge>
          </div>
          <h2 className="text-3xl font-bold text-white">{response.decision_result.recommended_candidate_name}</h2>
          <p className="text-white/60 text-sm leading-relaxed">{response.decision_result.key_reason}</p>
          <p className="text-white/40 text-xs leading-relaxed italic">{response.decision_result.executive_interpretation}</p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {(["overview", "candidates", "analysis", "agents"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}
          >{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <Card>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Executive Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(response.executive_summary).map(([k, v]) => (
                <div key={k} className="space-y-1">
                  <div className="text-white/40 capitalize">{k.replace("_", " ")}</div>
                  <div className="text-white/80">{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Trade-offs */}
          {response.trade_offs.length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Trade-offs</h3>
              <div className="space-y-3">
                {response.trade_offs.map((t, i) => (
                  <div key={i} className="border-l-2 border-amber-400/30 pl-3 space-y-1">
                    <div className="text-sm font-medium text-white">{t.title}</div>
                    <div className="text-xs text-white/50">{t.description}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "candidates" && (
        <div className="space-y-3">
          {response.candidate_evaluations.map((c, i) => (
            <Card key={c.candidate_id} className={i === 0 ? "border-amber-400/20" : ""}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/30 text-sm font-mono">#{c.rank}</span>
                    <span className="font-bold text-white">{c.candidate_name}</span>
                    {i === 0 && <Badge color="amber">Winner</Badge>}
                  </div>
                  <div className="flex gap-1 flex-wrap">{c.strategic_labels.map(l => <Badge key={l}>{l}</Badge>)}</div>
                </div>
                <div className="text-right text-xs text-white/40">
                  <div className="text-lg font-bold text-white">{c.weighted_fit_score.toFixed(1)}</div>
                  <div>WFS</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs text-center">
                <div><div className="text-white font-semibold">{c.risk_adjusted_score.toFixed(1)}</div><div className="text-white/40">Risk Adj.</div></div>
                <div><div className="text-white font-semibold">{c.expected_outcome_score.toFixed(1)}</div><div className="text-white/40">Outcome</div></div>
                <div><div className="text-white font-semibold">{Math.round(c.overall_confidence * 100)}%</div><div className="text-white/40">Confidence</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-white/40 mb-1">Strengths</div>
                  {c.strengths.map(s => <div key={s} className="text-emerald-300">+ {s}</div>)}
                </div>
                <div>
                  <div className="text-white/40 mb-1">Weaknesses</div>
                  {c.weaknesses.map(w => <div key={w} className="text-red-300">− {w}</div>)}
                </div>
              </div>
              {c.winner_reason && <p className="mt-3 text-xs text-amber-300 italic border-t border-white/10 pt-3">{c.winner_reason}</p>}
              {c.trade_off_note && <p className="mt-2 text-xs text-white/40 italic">{c.trade_off_note}</p>}
            </Card>
          ))}
        </div>
      )}

      {tab === "analysis" && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Scenario Analysis</h3>
            <div className="text-sm text-white/70 mb-3">{response.scenario_analysis.weight_rationale}</div>
            <div className="flex flex-wrap gap-1">{response.scenario_analysis.key_pressures.map(p => <Badge key={p} color="blue">{p}</Badge>)}</div>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Adaptability Profiles</h3>
            <div className="space-y-4">
              {response.adaptability_profiles.map(p => (
                <div key={p.candidate_name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-white">{p.candidate_name}</span>
                    <span className="text-white/40">{p.adaptability_score}/100</span>
                  </div>
                  <ScoreBar value={p.adaptability_score} max={100} color="#34d399" />
                  <div className="text-xs text-white/40 italic">{p.resilience_note}</div>
                </div>
              ))}
            </div>
          </Card>

          {response.bias_confidence_reviews.some(r => r.bias_flags.length > 0) && (
            <Card>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Bias Flags</h3>
              {response.bias_confidence_reviews.filter(r => r.bias_flags.length > 0).map(r => (
                <div key={r.candidate_id} className="mb-3">
                  <div className="text-sm font-medium text-white mb-1">{r.candidate_name}</div>
                  {r.bias_flags.map((f, i) => (
                    <div key={i} className="text-xs border-l-2 border-amber-400/40 pl-2 mb-1">
                      <span className="text-amber-300">{f.type}</span>
                      <span className="text-white/40 ml-2">{f.description}</span>
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === "agents" && (
        <div className="space-y-3">
          {response.agent_outputs.map(a => (
            <Card key={a.agent_name}>
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-sm text-white">{a.agent_name}</div>
                <Badge>{a.agent_role.includes("LLM") ? "LLM" : "Deterministic"}</Badge>
              </div>
              <p className="text-xs text-white/50 mb-3">{a.agent_role}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-white/30 mb-1">Inputs</div>{a.inputs.map(i => <div key={i} className="text-white/60">→ {i}</div>)}</div>
                <div><div className="text-white/30 mb-1">Outputs</div>{a.outputs.map(o => <div key={o} className="text-white/60">← {o}</div>)}</div>
              </div>
              <p className="text-xs text-white/40 mt-3 italic border-t border-white/10 pt-3">{a.summary}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

type Phase = "landing" | "eval" | "running" | "results";

export default function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [role, setRole] = useState({ title: "VP of People & Culture", description: "Senior leader to oversee talent strategy, DEI initiatives, and organizational health through a post-merger integration. Must balance speed with cultural sensitivity." });
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [decisionMode, setDecisionMode] = useState("best_fit");
  const [candidates, setCandidates] = useState<CandidateInput[]>(DEFAULT_CANDIDATES.map(c => ({ ...c })));
  const [enablePairing, setEnablePairing] = useState(false);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [response, setResponse] = useState<PipelineResponse | null>(null);
  const [mode, setMode] = useState<ServiceMode>("mock");
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const toggleMode = () => {
    const next: ServiceMode = mode === "mock" ? "live" : "mock";
    setServiceMode(next);
    setMode(next);
  };

  const handleRun = useCallback(async () => {
    setPhase("running");
    setResponse(null);
    setError(null);
    const initStages = INITIAL_STAGES
      .filter(s => enablePairing || s.id !== "pairing")
      .map(s => ({ ...s }));
    setStages(initStages);

    try {
      const result = mode === "live"
        ? await runLive({ role, scenario, decision_mode: decisionMode, candidates, options: { enable_pair_simulation: enablePairing } }, setStages)
        : await runMock(candidates, setStages);
      setResponse(result);
      setPhase("results");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("eval");
    }
  }, [role, scenario, decisionMode, candidates, enablePairing, mode]);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      {/* Header — always visible */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0d0f14]/80 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="font-bold text-base">
            <span className="text-amber-400">ScenarioRank</span> <span className="text-white">AI</span>
            <span className="text-white/20 text-xs ml-2">v3</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMode}
              className={cn(
                "text-[10px] px-3 py-1.5 rounded-full font-semibold border transition-all cursor-pointer",
                mode === "live"
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/20"
                  : "bg-amber-400/10 text-amber-400 border-amber-400/30 hover:bg-amber-400/20"
              )}
              title={mode === "mock" ? "Switch to Live Mode (requires node server.mjs on port 3001)" : "Switch to Mock Mode"}
            >
              {mode === "live" ? "⚡ Live Mode" : "🎭 Mock Mode"}
            </button>
            {phase !== "landing" && (
              <button onClick={() => { setPhase("landing"); setResponse(null); setError(null); }}
                className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-3xl mx-auto px-6 pt-4">
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-sm text-red-300 font-semibold">⚠️ Pipeline Error</p>
            <p className="text-xs text-white/50 mt-1">{error}</p>
            {mode === "live" && (
              <p className="text-xs text-white/30 mt-2">
                Is <code className="text-amber-400 bg-amber-400/10 px-1 rounded">node server.mjs</code> running in a separate terminal on port 3001?
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {phase === "landing" && <Landing onStart={() => setPhase("eval")} />}
      {(phase === "eval" || phase === "running") && (
        <EvalForm
          role={role} setRole={setRole}
          scenario={scenario} setScenario={setScenario}
          decisionMode={decisionMode} setDecisionMode={setDecisionMode}
          candidates={candidates} setCandidates={setCandidates}
          enablePairing={enablePairing} setEnablePairing={setEnablePairing}
          onRun={handleRun} isRunning={phase === "running"}
        />
      )}
      <PipelineProgress stages={stages} />
      {phase === "results" && response && (
        <div ref={resultsRef}>
          <Results response={response} />
        </div>
      )}
    </div>
  );
}
