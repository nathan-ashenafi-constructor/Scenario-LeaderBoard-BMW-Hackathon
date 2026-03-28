import { useState, useRef, useCallback } from "react";
import type { CandidateInput, PipelineResponse, PipelineStage } from "@/types/pipeline";
import { DEFAULT_ROLE, SCENARIOS, SAMPLE_CANDIDATES, INITIAL_PIPELINE_STAGES } from "@/data/mockData";
import { runDecisionPipeline } from "@/services/decisionService";
import LandingSection from "@/components/LandingSection";
import EvaluationInput from "@/components/v3/EvaluationInput";
import PipelineVisualization from "@/components/v3/PipelineVisualization";
import DecisionHero from "@/components/v3/DecisionHero";
import CandidateRanking from "@/components/v3/CandidateRanking";
import CandidateDeepDive from "@/components/v3/CandidateDeepDive";
import BiasConfidenceSection from "@/components/v3/BiasConfidenceSection";
import TradeOffsSection from "@/components/v3/TradeOffsSection";
import AdaptabilitySection from "@/components/v3/AdaptabilitySection";
import PairSimulationSection from "@/components/v3/PairSimulationSection";
import AgentIntelligenceView from "@/components/v3/AgentIntelligenceView";
import ExecutiveBrief from "@/components/v3/ExecutiveBrief";

type Phase = "landing" | "evaluation" | "running" | "results";

export default function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [roleTitle, setRoleTitle] = useState(DEFAULT_ROLE.title);
  const [roleDescription, setRoleDescription] = useState(DEFAULT_ROLE.description);
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [decisionMode, setDecisionMode] = useState<string>("best_fit");
  const [candidates, setCandidates] = useState<CandidateInput[]>(() => SAMPLE_CANDIDATES.map(c => ({ ...c })));
  const [enablePairing, setEnablePairing] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [response, setResponse] = useState<PipelineResponse | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleRun = useCallback(async () => {
    setPhase("running");
    setResponse(null);

    const stages = INITIAL_PIPELINE_STAGES
      .filter(s => enablePairing || s.id !== "pairing")
      .map(s => ({ ...s }));
    setPipelineStages(stages);

    try {
      const result = await runDecisionPipeline(
        {
          role: { title: roleTitle, description: roleDescription },
          scenario,
          decision_mode: decisionMode as "best_fit" | "lowest_risk" | "best_outcome",
          candidates,
          options: { enable_pair_simulation: enablePairing },
        },
        (updatedStages) => setPipelineStages([...updatedStages])
      );
      setResponse(result);
      setPhase("results");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err) {
      console.error("Pipeline failed:", err);
      setPhase("evaluation");
    }
  }, [roleTitle, roleDescription, scenario, decisionMode, candidates, enablePairing]);

  if (phase === "landing") {
    return <LandingSection onStart={() => setPhase("evaluation")} />;
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl">
            <span className="text-gradient-primary">ScenarioRank</span>{" "}
            <span className="text-foreground">AI</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Mock Mode
            </span>
            <button
              onClick={() => { setPhase("landing"); setResponse(null); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <EvaluationInput
        roleTitle={roleTitle}
        roleDescription={roleDescription}
        scenario={scenario}
        decisionMode={decisionMode}
        candidates={candidates}
        enablePairing={enablePairing}
        isRunning={phase === "running"}
        onRoleTitleChange={setRoleTitle}
        onRoleDescriptionChange={setRoleDescription}
        onScenarioChange={setScenario}
        onDecisionModeChange={setDecisionMode}
        onCandidatesChange={setCandidates}
        onPairingChange={setEnablePairing}
        onRun={handleRun}
      />

      <PipelineVisualization
        stages={pipelineStages}
        visible={phase === "running" || phase === "results"}
      />

      {phase === "results" && response && (
        <div ref={resultsRef}>
          <DecisionHero result={response.decision_result} />
          <CandidateRanking evaluations={response.candidate_evaluations} />
          <CandidateDeepDive evaluations={response.candidate_evaluations} />
          <BiasConfidenceSection reviews={response.bias_confidence_reviews} />
          <TradeOffsSection tradeOffs={response.trade_offs} />
          <AdaptabilitySection profiles={response.adaptability_profiles} />
          <PairSimulationSection result={response.pairing_result} />
          <AgentIntelligenceView agents={response.agent_outputs} />
          <ExecutiveBrief summary={response.executive_summary} />
        </div>
      )}
    </div>
  );
}
