import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { CheckCircle2, CircleDashed, FileSearch, Target, BrainCircuit, Activity, Zap } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const WorkflowTimeline = () => {
  const timelineSteps = useAIWorkflowStore(state => state.timelineSteps);

  const getIconForStep = (label: string, status: string) => {
    if (status === 'completed') return <CheckCircle2 size={24} color="#16A34A" />;
    if (status === 'active') return <CircleDashed size={24} color="#2563EB" />;
    
    // Pending icons based on label keyword
    if (label.includes('report')) return <FileSearch size={16} color="#94A3B8" />;
    if (label.includes('business')) return <Target size={16} color="#94A3B8" />;
    if (label.includes('anomalies')) return <Activity size={16} color="#94A3B8" />;
    if (label.includes('insights')) return <BrainCircuit size={16} color="#94A3B8" />;
    return <Zap size={16} color="#94A3B8" />;
  };

  return (
    <View className="p-5 rounded-2xl bg-white" style={{ borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 20 }}>Live Workflow</Text>
      <View>
        {timelineSteps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isPending = step.status === 'pending';

          // For the timeline line height
          const showLine = index < timelineSteps.length - 1;
          const lineColor = isCompleted ? '#16A34A' : '#E2E8F0';

          return (
            <View key={index} className="flex-row items-start">
              {/* Timeline dot & line */}
              <View className="items-center mr-4" style={{ width: 24 }}>
                <MotiView
                  animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                    opacity: isPending ? 0.6 : 1,
                  }}
                  transition={{
                    type: 'timing',
                    duration: 1500,
                    loop: isActive,
                  }}
                  className="items-center justify-center bg-white"
                  style={{ width: 24, height: 24, zIndex: 10 }}
                >
                  {getIconForStep(step.label, step.status)}
                </MotiView>
                {showLine && (
                  <View style={{ width: 2, height: 28, backgroundColor: lineColor, marginVertical: 2 }} />
                )}
              </View>

              {/* Label */}
              <View className="justify-center" style={{ height: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isActive || isCompleted ? '600' : '500',
                    color: isActive ? '#2563EB' : isCompleted ? '#334155' : '#94A3B8',
                  }}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
