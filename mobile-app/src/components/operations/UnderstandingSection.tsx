import React from 'react';
import { View, Text } from 'react-native';
import { Database, Calendar, Globe, Hash, ShieldCheck, Activity } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const UnderstandingSection = () => {
  const { currentStep, insight } = useAIWorkflowStore();

  // Show if we have progressed past intake or have an insight
  if (currentStep === 'intake' && !insight) return null;

  return (
    <View className="mb-6 bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}>
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#F1F5F9' }}>
          <Database size={16} color="#475569" />
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Context Understood</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>AI ingested and normalized raw data</Text>
        </View>
      </View>

      <View className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <View className="flex-row flex-wrap mb-4" style={{ gap: 12 }}>
          <View className="w-[47%]">
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4, letterSpacing: 0.5 }}>SOURCE</Text>
            <View className="flex-row items-start">
              <View style={{ marginTop: 2 }}>
                <Database size={12} color="#0F172A" />
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 6 }}>{insight?.understanding?.source || 'Production DB'}</Text>
            </View>
          </View>
          
          <View className="w-[47%]">
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4, letterSpacing: 0.5 }}>SCOPE</Text>
            <View className="flex-row items-start">
              <View style={{ marginTop: 2 }}>
                <Globe size={12} color="#0F172A" />
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 6 }}>{insight?.understanding?.scope || 'Global'}</Text>
            </View>
          </View>

          <View className="w-[47%]">
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4, letterSpacing: 0.5 }}>TIME RANGE</Text>
            <View className="flex-row items-center">
              <Calendar size={12} color="#0F172A" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 6 }}>{insight?.understanding?.time_range || 'Last 30 Days'}</Text>
            </View>
          </View>

          <View className="w-[47%]">
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4, letterSpacing: 0.5 }}>RECORDS ANALYZED</Text>
            <View className="flex-row items-center">
              <Hash size={12} color="#0F172A" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 6 }}>{insight?.understanding?.records_analyzed || '14,592 Rows'}</Text>
            </View>
          </View>
        </View>

        <View className="pt-4" style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5 }}>SIGNALS DETECTED</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {insight?.understanding?.signals?.length > 0 ? (
              insight.understanding.signals.map((signal: string, idx: number) => (
                <View key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex-row items-center shadow-sm">
                  <Activity size={12} color="#2563EB" />
                  <Text style={{ flexShrink: 1, fontSize: 12, fontWeight: '600', color: '#334155', marginLeft: 6 }}>{signal}</Text>
                </View>
              ))
            ) : (
              <>
                <View className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex-row items-center shadow-sm">
                  <Activity size={12} color="#DC2626" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155', marginLeft: 6 }}>Margin compression</Text>
                </View>
                <View className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex-row items-center shadow-sm">
                  <Activity size={12} color="#EAB308" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155', marginLeft: 6 }}>Inventory stale</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
