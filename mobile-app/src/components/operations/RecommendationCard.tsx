import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShieldAlert, Check, X, Zap } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const RecommendationCard = () => {
  const { isAwaitingApproval, approvalData, approveAction, rejectAction } = useAIWorkflowStore();

  if (!isAwaitingApproval || !approvalData) return null;

  return (
    <View className="mb-6 bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 }}>
      <View className="flex-row items-center mb-4">
        <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#FEF2F2' }}>
          <ShieldAlert size={20} color="#DC2626" />
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Action Required</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Review AI Recommendation</Text>
        </View>
      </View>

      <View className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
        <View className="flex-row items-center mb-2">
          <Zap size={16} color="#0F172A" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginLeft: 6 }}>
            {approvalData.action_type === 'update_delivery_fee' ? 'Update Delivery Fee' :
             approvalData.action_type === 'create_campaign' ? 'Create Campaign' :
             approvalData.action_type === 'update_price' ? 'Update Pricing' :
             approvalData.action_type === 'reorder_stock' ? 'Reorder Stock' : 'Proposed Action'}
          </Text>
        </View>

        {/* Display details */}
        {Object.entries(approvalData.details || {}).map(([key, value]) => (
           <Text key={key} style={{ fontSize: 13, color: '#475569', marginBottom: 2 }}>
             <Text style={{ fontWeight: '600', color: '#334155' }}>{key}: </Text>{String(value)}
           </Text>
        ))}

        <View className="mt-3 pt-3 border-t border-slate-200">
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 }}>REASON:</Text>
          <Text style={{ fontSize: 13, color: '#0F172A', lineHeight: 18 }}>{approvalData.justification}</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity 
          onPress={rejectAction}
          className="flex-1 py-3 rounded-xl items-center justify-center flex-row bg-slate-100 border border-slate-200"
        >
          <X size={16} color="#475569" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569', marginLeft: 6 }}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={approveAction}
          className="flex-1 py-3 rounded-xl items-center justify-center flex-row bg-blue-600"
        >
          <Check size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginLeft: 6 }}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
