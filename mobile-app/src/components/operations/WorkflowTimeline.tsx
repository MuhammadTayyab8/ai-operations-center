import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import {
  CheckCircle2, FileSearch, Target,
  BrainCircuit, Activity, Zap, Clock, AlertCircle,
  Cpu, Shield, Bell
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
  const { timelineSteps, logs, isProcessing, isAwaitingApproval, isComplete, currentStep } = useAIWorkflowStore();

  const phases = [
    { label: 'DATA INGESTION', steps: [0, 1], color: '#3B82F6' },
    { label: 'INTELLIGENCE', steps: [2, 3, 4], color: '#8B5CF6' },
    { label: 'STRATEGY', steps: [5, 6], color: '#F59E0B' },
    { label: 'EXECUTION', steps: [7, 8], color: '#10B981' },
  ];

  const getLogType = (msg: string) => {
    if (msg.toLowerCase().includes('executing') || msg.toLowerCase().includes('update') || msg.toLowerCase().includes('campaign')) return 'execution';
    if (msg.toLowerCase().includes('error')) return 'error';
    if (msg.toLowerCase().includes('waiting') || msg.toLowerCase().includes('queued')) return 'queued';
    return 'info';
  };

  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#F8FAFC'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Cpu size={16} color="#0F172A" />
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', marginLeft: 8, letterSpacing: 0.5 }}>
            OPERATIONAL TIMELINE
          </Text>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: isComplete ? '#DCFCE7' : isAwaitingApproval ? '#FEF9C3' : '#EFF6FF',
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
          borderWidth: 1, borderColor: isComplete ? '#BBF7D0' : isAwaitingApproval ? '#FEF08A' : '#BFDBFE'
        }}>
          {!isComplete && (isProcessing || isAwaitingApproval) && (
            <ActivityIndicator size="small" color={isAwaitingApproval ? '#CA8A04' : '#2563EB'} style={{ marginRight: 6 }} />
          )}
          <Text style={{
            fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
            color: isComplete ? '#166534' : isAwaitingApproval ? '#CA8A04' : '#1E3A8A',
          }}>
            {isComplete ? 'COMPLETED' : isAwaitingApproval ? 'AWAITING APPROVAL' : isProcessing ? 'LIVE' : 'IDLE'}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={{ padding: 20, backgroundColor: '#FFFFFF' }}>
        {phases.map((phase, phaseIdx) => {
          const phaseSteps = phase.steps.map(i => timelineSteps[i]).filter(Boolean);
          const phaseActive = phaseSteps.some(s => s.status === 'active');
          const phaseComplete = phaseSteps.every(s => s.status === 'completed');

          return (
            <View key={phase.label} style={{ marginBottom: phaseIdx < phases.length - 1 ? 20 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: phaseComplete ? phase.color : phaseActive ? phase.color : '#CBD5E1',
                  marginRight: 8,
                }} />
                <Text style={{
                  fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
                  color: phaseComplete ? phase.color : phaseActive ? phase.color : '#94A3B8',
                }}>
                  {phase.label}
                </Text>
                {phaseComplete && (
                  <View style={{ marginLeft: 8 }}>
                    <CheckCircle2 size={12} color={phase.color} />
                  </View>
                )}
              </View>

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
                    <View style={{ alignItems: 'center', width: 32, marginRight: 12 }}>
                      <MotiView
                        animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                        transition={{ type: 'timing', duration: 1000, loop: isActive }}
                        style={{
                          width: 32, height: 32, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isDone ? '#DCFCE7' : isActive ? '#EFF6FF' : isError ? '#FEF2F2' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: isDone ? '#86EFAC' : isActive ? '#93C5FD' : isError ? '#FECACA' : '#E2E8F0',
                        }}
                      >
                        {isActive ? (
                          <ActivityIndicator size="small" color="#2563EB" />
                        ) : isDone ? (
                          <CheckCircle2 size={16} color="#16A34A" />
                        ) : isError ? (
                          <AlertCircle size={16} color="#DC2626" />
                        ) : (
                          <StepIcon size={14} color="#94A3B8" />
                        )}
                      </MotiView>
                      {!isLast && (
                        <View style={{
                          width: 1.5, flex: 1, minHeight: 12,
                          backgroundColor: isDone ? '#86EFAC' : '#E2E8F0',
                          marginVertical: 3,
                        }} />
                      )}
                    </View>

                    <View style={{ flex: 1, paddingBottom: isLast ? 0 : 12, paddingTop: 6 }}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isActive || isDone ? '700' : '500',
                        color: isDone ? '#475569' : isActive ? '#0F172A' : '#94A3B8',
                      }}>
                        {step.label}
                      </Text>
                      {step.receivedAt && (
                        <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '600' }}>
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

      {/* Live Operational Notifications Stream */}
      {logs.length > 0 && (
        <View style={{
          margin: 16, marginTop: 0,
          backgroundColor: '#F8FAFC',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          maxHeight: 180,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Bell size={12} color="#475569" />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 1, marginLeft: 6 }}>
              SYSTEM LOGS & NOTIFICATIONS
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={true}>
            {[...logs].reverse().map((log) => {
              const type = getLogType(log.message);
              return (
                <View key={log.id} style={{ 
                  flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start',
                  backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10,
                  borderWidth: 1, borderColor: '#F1F5F9',
                  shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
                }}>
                  <View style={{
                    backgroundColor: type === 'execution' ? '#DCFCE7' : type === 'error' ? '#FEF2F2' : type === 'queued' ? '#FEF9C3' : '#F1F5F9',
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 8, marginTop: 2
                  }}>
                    <Text style={{ 
                      fontSize: 9, fontWeight: '800',
                      color: type === 'execution' ? '#16A34A' : type === 'error' ? '#DC2626' : type === 'queued' ? '#CA8A04' : '#64748B' 
                    }}>
                      {type === 'execution' ? 'EXEC' : type === 'error' ? 'FAIL' : type === 'queued' ? 'QUEUED' : 'INFO'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500', lineHeight: 16 }}>
                      {log.message}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: '600' }}>
                      {log.timestamp}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
