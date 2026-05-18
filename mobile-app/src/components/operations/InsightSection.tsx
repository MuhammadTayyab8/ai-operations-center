import React from 'react';
import { View, Text } from 'react-native';
import { Lightbulb, TrendingDown, AlertTriangle } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const InsightSection = () => {
  const insight = useAIWorkflowStore(state => state.insight);

  if (!insight) return null;

  return (
    <View className="mb-6 bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: '#E2E8F0' }}>
      <View className="flex-row items-center mb-4">
        <Lightbulb size={20} color="#EAB308" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginLeft: 8 }}>AI Insights</Text>
      </View>

      <Text style={{ fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 16 }}>
        {insight.summary}
      </Text>

      {insight.anomalies_detected && insight.anomalies_detected.length > 0 && (
        <View className="mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={14} color="#DC2626" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626', marginLeft: 6 }}>Detected Anomalies</Text>
          </View>
          {insight.anomalies_detected.map((anomaly: string, i: number) => (
            <Text key={i} style={{ fontSize: 13, color: '#991B1B', marginBottom: 2 }}>• {anomaly}</Text>
          ))}
        </View>
      )}

      {insight.actionable_insights && insight.actionable_insights.length > 0 && (
        <View className="bg-blue-50 p-3 rounded-xl border border-blue-100">
          <View className="flex-row items-center mb-2">
            <TrendingDown size={14} color="#2563EB" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563EB', marginLeft: 6 }}>Business Impact</Text>
          </View>
          {insight.actionable_insights.map((act: string, i: number) => (
            <Text key={i} style={{ fontSize: 13, color: '#1E3A8A', marginBottom: 2 }}>• {act}</Text>
          ))}
        </View>
      )}
    </View>
  );
};
