import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import {
  CheckCircle2, Circle, FileSearch, Target,
  BrainCircuit, Activity, Zap, Clock, AlertCircle,
  Cpu, Shield, TrendingUp, Globe
} from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

const STEP_ICONS: Record<string, any> = {
  'Workflow triggered':                FileSearch,
  'Parsing report...':                 FileSearch,
  'Understanding business context...': Target,
  'Detecting anomalies...':            Activity,
  'Generating insights...':            BrainCircuit,
  'Creating recommendations...':       Shield,
  'Waiting for approval...':           Clock,
  'Executing actions...':              Zap,
  'Workflow completed':                CheckCircle2,
};

export const WorkflowTimeline = () => {
  const { timelineSteps, logs, isProcessing, isAwaitingApproval, isComplete } = useAIWorkflowStore();

  // Phase groupings
  const phases = [
    { label: 'INTAKE', steps: [0, 1], color: '#3B82F6' },
    { label: 'ANALYSIS', steps: [2, 3, 4], color: '#8B5CF6' },
    { label: 'DECISION', steps: [5, 6], color: '#F59E0B' },
    { label: 'EXECUTION', steps: [7, 8], color: '#10B981' },
  ];

  return (
    <View style={{
      backgroundColor: '#0F172A',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#1E293B',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#1E293B',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Cpu size={16} color="#60A5FA" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginLeft: 8 }}>
            AI Pipeline
          </Text>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: isComplete ? '#052e16' : isAwaitingApproval ? '#431407' : '#1e3a8a',
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
        }}>
          {!isComplete && (isProcessing || isAwaitingApproval) && (
            <ActivityIndicator size="small" color={isAwaitingApproval ? '#F97316' : '#60A5FA'} style={{ marginRight: 6 }} />
          )}
          <Text style={{
            fontSize: 11, fontWeight: '700',
            color: isComplete ? '#4ADE80' : isAwaitingApproval ? '#FB923C' : '#93C5FD',
          }}>
            {isComplete ? '✓ COMPLETE' : isAwaitingApproval ? '⏳ AWAITING APPROVAL' : isProcessing ? '● LIVE' : 'IDLE'}
          </Text>
        </View>
      </View>

      {/* Phase + Step Timeline */}
      <View style={{ padding: 20 }}>
        {phases.map((phase, phaseIdx) => {
          const phaseSteps = phase.steps.map(i => timelineSteps[i]).filter(Boolean);
          const phaseActive = phaseSteps.some(s => s.status === 'active');
          const phaseComplete = phaseSteps.every(s => s.status === 'completed');

          return (
            <View key={phase.label} style={{ marginBottom: phaseIdx < phases.length - 1 ? 20 : 0 }}>
              {/* Phase Label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: phaseComplete ? phase.color : phaseActive ? phase.color : '#334155',
                  marginRight: 8,
                }} />
                <Text style={{
                  fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
                  color: phaseComplete ? phase.color : phaseActive ? phase.color : '#475569',
                }}>
                  {phase.label}
                </Text>
                {phaseComplete && (
                  <View style={{ marginLeft: 8 }}>
                    <CheckCircle2 size={12} color={phase.color} />
                  </View>
                )}
              </View>

              {/* Steps */}
              {phase.steps.map((stepIdx, i) => {
                const step = timelineSteps[stepIdx];
                if (!step) return null;
                const isActive = step.status === 'active';
                const isDone = step.status === 'completed';
                const isError = step.status === 'error';
                const StepIcon = STEP_ICONS[step.label] || Zap;
                const isLast = i === phase.steps.length - 1;

                return (
                  <View key={stepIdx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* Icon + vertical line */}
                    <View style={{ alignItems: 'center', width: 32, marginRight: 12 }}>
                      <MotiView
                        animate={{
                          scale: isActive ? [1, 1.15, 1] : 1,
                        }}
                        transition={{
                          type: 'timing',
                          duration: 1000,
                          loop: isActive,
                        }}
                        style={{
                          width: 32, height: 32, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isDone
                            ? '#052e16'
                            : isActive
                            ? '#1e3a8a'
                            : isError
                            ? '#450a0a'
                            : '#1E293B',
                          borderWidth: 1,
                          borderColor: isDone ? '#166534' : isActive ? '#3B82F6' : isError ? '#DC2626' : '#334155',
                        }}
                      >
                        {isActive ? (
                          <ActivityIndicator size="small" color="#60A5FA" />
                        ) : isDone ? (
                          <CheckCircle2 size={16} color="#4ADE80" />
                        ) : isError ? (
                          <AlertCircle size={16} color="#F87171" />
                        ) : (
                          <StepIcon size={14} color="#475569" />
                        )}
                      </MotiView>
                      {!isLast && (
                        <View style={{
                          width: 1, flex: 1, minHeight: 12,
                          backgroundColor: isDone ? '#166534' : '#1E293B',
                          marginVertical: 3,
                        }} />
                      )}
                    </View>

                    {/* Step content */}
                    <View style={{ flex: 1, paddingBottom: isLast ? 0 : 12, paddingTop: 6 }}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isActive || isDone ? '600' : '400',
                        color: isDone ? '#94A3B8' : isActive ? '#F1F5F9' : '#475569',
                      }}>
                        {step.label}
                      </Text>
                      {step.receivedAt && (
                        <Text style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>
                          {step.receivedAt}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Live Log Console */}
      {logs.length > 1 && (
        <View style={{
          margin: 16, marginTop: 0,
          backgroundColor: '#020817',
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: '#1E293B',
          maxHeight: 130,
        }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#334155', letterSpacing: 1, marginBottom: 8 }}>
            SYSTEM LOG
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[...logs].reverse().map((log) => (
              <View key={log.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: '#334155', marginRight: 8, fontFamily: 'monospace' }}>
                  {log.timestamp}
                </Text>
                <Text style={{ fontSize: 10, color: '#60A5FA', flex: 1, fontFamily: 'monospace' }}>
                  › {log.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
