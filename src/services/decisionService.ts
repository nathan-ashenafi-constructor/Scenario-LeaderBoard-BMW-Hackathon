import type { PipelineRequest, PipelineResponse, PipelineStage } from "@/types/pipeline";
import { generateMockResponse, INITIAL_PIPELINE_STAGES } from "@/data/mockData";

type Mode = "mock" | "live";

let currentMode: Mode = "mock";

export function setServiceMode(mode: Mode) {
  currentMode = mode;
}

export function getServiceMode(): Mode {
  return currentMode;
}

export async function runDecisionPipeline(
  request: PipelineRequest,
  onStageUpdate?: (stages: PipelineStage[]) => void
): Promise<PipelineResponse> {
  if (currentMode === "live") {
    return runLivePipeline(request, onStageUpdate);
  }
  return runMockPipeline(request, onStageUpdate);
}

async function runMockPipeline(
  request: PipelineRequest,
  onStageUpdate?: (stages: PipelineStage[]) => void
): Promise<PipelineResponse> {
  const stages = INITIAL_PIPELINE_STAGES
    .filter(s => request.options.enable_pair_simulation || s.id !== "pairing")
    .map(s => ({ ...s }));

  // Simulate progressive pipeline execution
  for (let i = 0; i < stages.length; i++) {
    stages[i].status = "running";
    onStageUpdate?.([...stages]);
    await delay(600 + Math.random() * 800);

    stages[i].status = "completed";
    stages[i].summary = `${stages[i].label} completed successfully.`;
    stages[i].duration_ms = Math.round(600 + Math.random() * 1500);
    onStageUpdate?.([...stages]);
    await delay(150);
  }

  return generateMockResponse(
    request.scenario,
    request.decision_mode,
    request.candidates,
    request.options.enable_pair_simulation
  );
}

async function runLivePipeline(
  request: PipelineRequest,
  _onStageUpdate?: (stages: PipelineStage[]) => void
): Promise<PipelineResponse> {
  // TODO: Replace with real API call to Claude backend
  // const response = await fetch('/api/decision-pipeline', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // return response.json();
  throw new Error("Live backend not connected yet. Switch to mock mode.");
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
