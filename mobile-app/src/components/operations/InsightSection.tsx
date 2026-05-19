import React from 'react';
import { View, Text } from 'react-native';
import { Lightbulb, TrendingDown, AlertTriangle, BarChart3, PackageX, Zap } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const InsightSection = () => {
  const insight = useAIWorkflowStore(state => state.insight);

  if (!insight) return null;

  return (
    <View className="mb-6 bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#FEF9C3' }}>
            <Lightbulb size={16} color="#CA8A04" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Key Insight</Text>
        </View>
        <View className={`px-2 py-1 rounded border ${insight.risk_level === 'High' ? 'bg-red-50 border-red-200' : insight.risk_level === 'Medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: insight.risk_level === 'High' ? '#DC2626' : insight.risk_level === 'Medium' ? '#CA8A04' : '#166534' }}>
            {insight.risk_level ? `${insight.risk_level.toUpperCase()} RISK` : 'HIGH RISK'}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 22, marginBottom: 16 }}>
        {insight.key_insight || insight.summary || 'Significant revenue decline detected in key regions.'}
      </Text>

      {/* Evidence Section */}
      <View className="mb-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
        <View className="flex-row items-center mb-3">
          <BarChart3 size={14} color="#64748B" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginLeft: 6, letterSpacing: 0.5 }}>EVIDENCE</Text>
        </View>
        
        {insight.evidence && insight.evidence.length > 0 ? (
          insight.evidence.map((metric: any, idx: number) => {
            // Very simple mock bar logic for visualization based on trend
            const beforeWidth = metric.trend === 'down' ? '100%' : '75%';
            const afterWidth = metric.trend === 'down' ? '75%' : '100%';
            const afterColor = metric.trend === 'down' ? 'bg-red-500' : metric.trend === 'up' ? 'bg-green-500' : 'bg-blue-500';
            
            return (
              <View key={idx} className="mb-4">
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 }} numberOfLines={2}>{metric.label}</Text>
                <View className="mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text style={{ flex: 1, fontSize: 12, color: '#475569', fontWeight: '500', marginRight: 8 }}>Previous</Text>
                    <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '700' }}>{metric.before}</Text>
                  </View>
                  <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <View className={`h-full bg-slate-400`} style={{ width: beforeWidth }} />
                  </View>
                </View>

                <View>
                  <View className="flex-row justify-between mb-1">
                    <Text style={{ flex: 1, fontSize: 12, color: '#475569', fontWeight: '500', marginRight: 8 }}>Current</Text>
                    <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '700' }}>{metric.after}</Text>
                  </View>
                  <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <View className={`h-full ${afterColor}`} style={{ width: afterWidth }} />
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className="mb-2">
            <View className="flex-row justify-between mb-1">
              <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>Previous Period</Text>
              <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '700' }}>$200K</Text>
            </View>
            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <View className="h-full bg-slate-400" style={{ width: '100%' }} />
            </View>
          </View>
        )}
      </View>

      {/* Affected Entities */}
      {(insight.affected_entities && insight.affected_entities.length > 0) ? (
        <View className="mb-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
           <View className="flex-row items-center mb-2">
             <PackageX size={14} color="#64748B" />
             <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginLeft: 6, letterSpacing: 0.5 }}>AFFECTED ENTITIES</Text>
           </View>
           {insight.affected_entities.map((entity: any, i: number) => (
             <View key={i} className="flex-row justify-between items-start mb-1">
               <Text style={{ flex: 1, fontSize: 13, color: '#334155', marginRight: 8 }}>• {entity.name}</Text>
               <Text style={{ flexShrink: 0, fontSize: 12, fontWeight: '600', color: '#DC2626', marginTop: 1 }}>{entity.impact}</Text>
             </View>
           ))}
        </View>
      ) : (insight.anomalies_detected && insight.anomalies_detected.length > 0) ? (
        <View className="mb-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
           <View className="flex-row items-center mb-2">
             <PackageX size={14} color="#64748B" />
             <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginLeft: 6, letterSpacing: 0.5 }}>AFFECTED PRODUCTS</Text>
           </View>
           {insight.anomalies_detected.map((anomaly: string, i: number) => (
             <View key={i} className="flex-row justify-between items-start mb-1">
               <Text style={{ flex: 1, fontSize: 13, color: '#334155', marginRight: 8 }}>• {anomaly.replace(/critical|high|medium|low/i, '').trim()}</Text>
               <Text style={{ flexShrink: 0, fontSize: 12, fontWeight: '600', color: '#DC2626', marginTop: 1 }}>↓ Impacted</Text>
             </View>
           ))}
        </View>
      ) : null}

      {/* Business Impact */}
      <View className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
        <View className="flex-row items-center mb-2">
          <Zap size={14} color="#0F172A" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', marginLeft: 6 }}>Business Impact</Text>
        </View>
        <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18 }}>
          {insight.business_impact || (insight.actionable_insights && insight.actionable_insights[0]) || 'Revenue decline expected if no corrective action is taken.'}
        </Text>
      </View>
    </View>
  );
};
