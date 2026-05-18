import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, ArrowRight, Sparkles, RotateCcw, Zap } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const StateComparisonCard = () => {
  const { beforeAfterData, completedAt, reset, approvalData } = useAIWorkflowStore();

  if (!beforeAfterData) return null;

  const actionLabel =
    approvalData?.action_type === 'update_delivery_fee' ? 'Delivery Fee Updated' :
    approvalData?.action_type === 'create_campaign' ? 'Campaign Created' :
    approvalData?.action_type === 'update_price' ? 'Pricing Optimized' :
    approvalData?.action_type === 'reorder_stock' ? 'Stock Reordered' :
    'Action Executed';

  return (
    <View style={{ marginTop: 16 }}>
      {/* Success Banner */}
      <View style={{
        backgroundColor: '#052e16',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#166534',
        marginBottom: 12,
      }}>
        {/* Top Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: '#166534',
            alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
          }}>
            <CheckCircle2 size={24} color="#4ADE80" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#4ADE80' }}>
              Mission Complete
            </Text>
            <Text style={{ fontSize: 12, color: '#86EFAC', marginTop: 2 }}>
              {actionLabel} · Completed at {completedAt}
            </Text>
          </View>
          <Sparkles size={20} color="#4ADE80" />
        </View>

        {/* Summary Text */}
        {(beforeAfterData.summary || beforeAfterData.after) && (
          <View style={{
            backgroundColor: '#14532d',
            borderRadius: 12, padding: 12,
            borderWidth: 1, borderColor: '#166534',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Zap size={12} color="#86EFAC" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#86EFAC', marginLeft: 6, letterSpacing: 0.5 }}>
                OUTCOME SUMMARY
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#D1FAE5', lineHeight: 20 }}>
              {beforeAfterData.summary || beforeAfterData.after || 'System has been updated successfully with optimized parameters.'}
            </Text>
          </View>
        )}
      </View>

      {/* Before/After Comparison Table — only if metrics exist */}
      {beforeAfterData.metrics && beforeAfterData.metrics.length > 0 && (
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          {/* Table Header */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <Text style={{ flex: 1.5, fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.8 }}>METRIC</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: '#64748B', textAlign: 'center', letterSpacing: 0.8 }}>BEFORE</Text>
            <View style={{ width: 24 }} />
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: '#16A34A', textAlign: 'right', letterSpacing: 0.8 }}>AFTER</Text>
          </View>

          {beforeAfterData.metrics.map((item: any, index: number) => (
            <View
              key={index}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 14, paddingHorizontal: 16,
                backgroundColor: index % 2 === 0 ? '#fff' : '#FAFAFA',
                borderBottomWidth: index < beforeAfterData.metrics.length - 1 ? 1 : 0,
                borderBottomColor: '#F1F5F9',
              }}
            >
              <Text style={{ flex: 1.5, fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{item.label}</Text>
              <Text style={{ flex: 1, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>{item.before}</Text>
              <View style={{ width: 24, alignItems: 'center' }}>
                <ArrowRight size={14} color="#CBD5E1" />
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: '#16A34A', textAlign: 'right' }}>{item.after}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Start New Workflow CTA */}
      <TouchableOpacity
        onPress={reset}
        style={{
          backgroundColor: '#0F172A',
          borderRadius: 16, paddingVertical: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#1E293B',
        }}
      >
        <RotateCcw size={16} color="#60A5FA" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginLeft: 8 }}>
          Start New Workflow
        </Text>
      </TouchableOpacity>
    </View>
  );
};
