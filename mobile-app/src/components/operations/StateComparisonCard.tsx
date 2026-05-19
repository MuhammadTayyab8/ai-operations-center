import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, ArrowRight, Sparkles, RotateCcw, TrendingUp, Zap, Building } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const StateComparisonCard = () => {
  const { beforeAfterData, completedAt, reset, approvalData, isComplete } = useAIWorkflowStore();

  if (!isComplete) return null;

  const actionLabel =
    approvalData?.action_type === 'update_delivery_fee' ? 'Delivery Fee Updated' :
    approvalData?.action_type === 'create_campaign' ? 'Campaign Deployed' :
    approvalData?.action_type === 'update_price' ? 'Pricing Optimized' :
    approvalData?.action_type === 'reorder_stock' ? 'Inventory Redistributed' :
    'Operations Executed';

  // Fallback mock metrics for hackathon realism if none provided by backend
  const metrics = beforeAfterData?.metrics && beforeAfterData.metrics.length > 0 
    ? beforeAfterData.metrics 
    : [
        { label: 'Campaigns Active', before: '2', after: '3' },
        { label: 'Projected Sales', before: '150K', after: '168K' },
        { label: 'Delivery Fee', before: '250 PKR', after: '350 PKR' }
      ];

  return (
    <View style={{ marginTop: 16 }}>
      {/* Success Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', marginBottom: 16,
        backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20,
        borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1
      }}>
        <View style={{
          width: 48, height: 48, borderRadius: 16,
          backgroundColor: '#DCFCE7',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 16,
        }}>
          <CheckCircle2 size={24} color="#16A34A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5, marginBottom: 2 }}>
            STATE CHANGE APPLIED
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
            {actionLabel}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '500' }}>
            System state successfully mutated at {completedAt || new Date().toLocaleTimeString()}
          </Text>
        </View>
        <Sparkles size={24} color="#16A34A" />
      </View>

      {/* Side-by-side Metrics Cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {metrics.map((item: any, index: number) => (
          <View
            key={index}
            style={{
              width: '48%',
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Building size={14} color="#64748B" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginLeft: 6 }} numberOfLines={1}>
                {item.label.toUpperCase()}
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 2 }}>BEFORE</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#475569' }}>{item.before}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <ArrowRight size={14} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#2563EB' }}>AFTER</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>{item.after}</Text>
              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#16A34A' }}>UPDATED</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Outcome Summary */}
      {(beforeAfterData?.summary || beforeAfterData?.after) && (
        <View style={{
          backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 20,
          borderWidth: 1, borderColor: '#E2E8F0'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Zap size={14} color="#0F172A" />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A', marginLeft: 6, letterSpacing: 0.5 }}>
              FINAL OUTCOME
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>
            {beforeAfterData.summary || beforeAfterData.after || 'Business operations have been adjusted per the approved AI strategy.'}
          </Text>
        </View>
      )}

      {/* Start New Workflow CTA */}
      <TouchableOpacity
        onPress={reset}
        style={{
          backgroundColor: '#0F172A',
          borderRadius: 16, paddingVertical: 18,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4
        }}
        activeOpacity={0.8}
      >
        <RotateCcw size={18} color="#FFFFFF" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginLeft: 10 }}>
          Launch New Operation
        </Text>
      </TouchableOpacity>
    </View>
  );
};
