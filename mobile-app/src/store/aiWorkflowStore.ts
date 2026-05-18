import { create } from 'zustand';

export type AgentStep = 'intake' | 'insight' | 'decision' | 'execution';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
}

export interface TimelineStep {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface AIWorkflowState {
  workflowId: string | null;
  isProcessing: boolean;
  isAwaitingApproval: boolean;
  currentStep: AgentStep;
  logs: LogEntry[];
  timelineSteps: TimelineStep[];
  insight: any | null; // Output from the Insight Agent
  approvalData: any | null; // Data to show in the approval modal
  beforeAfterData: any | null; // Data to show in comparison card after execution

  // Actions
  triggerWorkflow: (id: string) => void;
  addLog: (message: string) => void;
  setStep: (step: AgentStep) => void;
  setInsight: (insight: any) => void;
  requireApproval: (data: any) => void;
  approveAction: () => void;
  rejectAction: () => void;
  finishExecution: (beforeAfter: any) => void;
  reset: () => void;
}

const DEFAULT_TIMELINE: TimelineStep[] = [
  { label: 'Upload received', status: 'pending' },
  { label: 'Parsing report...', status: 'pending' },
  { label: 'Understanding business context...', status: 'pending' },
  { label: 'Detecting anomalies...', status: 'pending' },
  { label: 'Generating insights...', status: 'pending' },
  { label: 'Creating recommendations...', status: 'pending' },
  { label: 'Waiting for approval...', status: 'pending' },
  { label: 'Executing actions...', status: 'pending' },
  { label: 'Workflow completed', status: 'pending' },
];

export const useAIWorkflowStore = create<AIWorkflowState>((set) => ({
  workflowId: null,
  isProcessing: false,
  isAwaitingApproval: false,
  currentStep: 'intake',
  logs: [],
  timelineSteps: [...DEFAULT_TIMELINE],
  insight: null,
  approvalData: null,
  beforeAfterData: null,

  triggerWorkflow: (id) =>
    set({
      workflowId: id,
      isProcessing: true,
      isAwaitingApproval: false,
      currentStep: 'intake',
      logs: [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), message: 'Workflow triggered. Initializing Intake Agent...' }],
      timelineSteps: DEFAULT_TIMELINE.map((t, i) => i === 0 ? { ...t, status: 'completed' } : { ...t, status: 'pending' }),
      insight: null,
      approvalData: null,
      beforeAfterData: null,
    }),

  addLog: (message) =>
    set((state) => {
      // Find matching timeline step and mark it active, previous as completed
      const newTimeline = [...state.timelineSteps];
      let foundIndex = -1;
      
      for (let i = 0; i < newTimeline.length; i++) {
        if (newTimeline[i].label === message) {
          foundIndex = i;
          newTimeline[i].status = 'active';
          // Mark all previous as completed
          for (let j = 0; j < i; j++) {
            newTimeline[j].status = 'completed';
          }
          break;
        }
      }

      if (message === 'Workflow completed' && foundIndex !== -1) {
          newTimeline[foundIndex].status = 'completed';
      }

      return {
        logs: [...state.logs, { id: Date.now().toString() + Math.random(), timestamp: new Date().toLocaleTimeString(), message }],
        timelineSteps: newTimeline,
      };
    }),

  setStep: (step) => set({ currentStep: step }),
  
  setInsight: (insight) => set({ insight }),

  requireApproval: (data) =>
    set({
      isAwaitingApproval: true,
      approvalData: data,
    }),

  approveAction: () =>
    set({
      isAwaitingApproval: false,
      currentStep: 'execution',
    }),

  rejectAction: () =>
    set({
      isAwaitingApproval: false,
      isProcessing: false,
      workflowId: null,
      logs: [],
    }),

  finishExecution: (beforeAfter) =>
    set({
      isProcessing: false,
      beforeAfterData: beforeAfter,
      currentStep: 'execution',
    }),

  reset: () =>
    set({
      workflowId: null,
      isProcessing: false,
      isAwaitingApproval: false,
      currentStep: 'intake',
      logs: [],
      timelineSteps: [...DEFAULT_TIMELINE],
      insight: null,
      approvalData: null,
      beforeAfterData: null,
    }),
}));
