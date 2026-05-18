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
  receivedAt?: string;
}

interface AIWorkflowState {
  workflowId: string | null;
  isProcessing: boolean;
  isAwaitingApproval: boolean;
  isComplete: boolean;
  currentStep: AgentStep;
  logs: LogEntry[];
  timelineSteps: TimelineStep[];
  insight: any | null;
  approvalData: any | null;
  beforeAfterData: any | null;
  completedAt: string | null;

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
  { label: 'Workflow triggered', status: 'pending' },
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
  isComplete: false,
  currentStep: 'intake',
  logs: [],
  timelineSteps: [...DEFAULT_TIMELINE],
  insight: null,
  approvalData: null,
  beforeAfterData: null,
  completedAt: null,

  triggerWorkflow: (id) =>
    set({
      workflowId: id,
      isProcessing: true,
      isAwaitingApproval: false,
      isComplete: false,
      currentStep: 'intake',
      logs: [{
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: 'Workflow triggered. Initializing AI pipeline...'
      }],
      timelineSteps: DEFAULT_TIMELINE.map((t, i) =>
        i === 0 ? { ...t, status: 'active', receivedAt: new Date().toLocaleTimeString() } : { ...t, status: 'pending' }
      ),
      insight: null,
      approvalData: null,
      beforeAfterData: null,
      completedAt: null,
    }),

  addLog: (message) =>
    set((state) => {
      const newTimeline = state.timelineSteps.map(t => ({ ...t }));
      const now = new Date().toLocaleTimeString();

      // Mark matching step as active, all previous as completed
      let foundIndex = -1;
      for (let i = 0; i < newTimeline.length; i++) {
        if (newTimeline[i].label === message) {
          foundIndex = i;
          newTimeline[i] = { ...newTimeline[i], status: 'active', receivedAt: now };
          for (let j = 0; j < i; j++) {
            newTimeline[j] = { ...newTimeline[j], status: 'completed' };
          }
          break;
        }
      }

      // Special: final completion marks everything done
      if (message === 'Workflow completed') {
        newTimeline.forEach((s, i) => {
          newTimeline[i] = { ...s, status: 'completed', receivedAt: s.receivedAt || now };
        });
      }

      return {
        logs: [...state.logs, {
          id: Date.now().toString() + Math.random(),
          timestamp: now,
          message
        }],
        timelineSteps: newTimeline,
      };
    }),

  setStep: (step) => set({ currentStep: step }),

  setInsight: (insight) => set({ insight }),

  requireApproval: (data) =>
    set({
      isAwaitingApproval: true,
      isProcessing: false,
      approvalData: data,
    }),

  approveAction: () =>
    set({
      isAwaitingApproval: false,
      isProcessing: true,
      currentStep: 'execution',
    }),

  rejectAction: () =>
    set({
      isAwaitingApproval: false,
      isProcessing: false,
      workflowId: null,
      logs: [],
      timelineSteps: [...DEFAULT_TIMELINE],
      insight: null,
      approvalData: null,
      beforeAfterData: null,
      completedAt: null,
      isComplete: false,
    }),

  finishExecution: (beforeAfter) =>
    set({
      isProcessing: false,
      isComplete: true,
      beforeAfterData: beforeAfter,
      currentStep: 'execution',
      completedAt: new Date().toLocaleTimeString(),
    }),

  reset: () =>
    set({
      workflowId: null,
      isProcessing: false,
      isAwaitingApproval: false,
      isComplete: false,
      currentStep: 'intake',
      logs: [],
      timelineSteps: [...DEFAULT_TIMELINE],
      insight: null,
      approvalData: null,
      beforeAfterData: null,
      completedAt: null,
    }),
}));
