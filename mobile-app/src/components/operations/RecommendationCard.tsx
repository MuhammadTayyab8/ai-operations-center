import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Target, Check, X, Zap, TrendingUp, ShieldCheck } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

interface RecommendationCardProps {
  workflowId: string | null;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ workflowId, onApprove, onReject }) => {
  const { isAwaitingApproval, approvalData } = useAIWorkflowStore();
  const [loading, setLoading] = useState(false);

  if (!isAwaitingApproval || !approvalData) return null;

  const handleApprove = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onApprove();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onReject();
    } finally {
      setLoading(false);
    }
  };

  const actionName = approvalData.action_type === 'update_delivery_fee' ? 'Update Delivery Fee' :
                     approvalData.action_type === 'create_campaign' ? 'Launch Campaign' :
                     approvalData.action_type === 'update_price' ? 'Update Pricing' :
                     approvalData.action_type === 'reorder_stock' ? 'Reorder Stock' : 'Proposed Action';

  return (
    <View className="mb-6 bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: '#2563EB', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3 }}>
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center flex-1 pr-4">
          <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#EFF6FF' }}>
            <Target size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', letterSpacing: 0.5 }}>RECOMMENDED ACTION</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>{actionName}</Text>
          </View>
        </View>
        <View className="bg-green-50 px-3 py-1.5 rounded-full flex-row items-center border border-green-200">
          <ShieldCheck size={14} color="#16A34A" />
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#166534', marginLeft: 4 }}>
            {approvalData.confidence ? `${Math.round(approvalData.confidence * 100)}% CONF` : '82% CONF'}
          </Text>
        </View>
      </View>

      <View className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6, letterSpacing: 0.5 }}>BUSINESS RATIONALE</Text>
        <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 12 }}>
          {approvalData.justification || 'Regional sales decline warrants immediate corrective action to stabilize revenue.'}
        </Text>

        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          <View className="bg-white border border-slate-200 px-3 py-2 rounded-lg flex-1 min-w-[45%]">
            <View className="flex-row items-center mb-1">
              <TrendingUp size={14} color="#16A34A" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginLeft: 4 }}>EXP. IMPACT</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#16A34A' }}>
              {approvalData.expected_impact || '+8% to +15%'}
            </Text>
          </View>

          <View className="bg-white border border-slate-200 px-3 py-2 rounded-lg flex-1 min-w-[45%]">
            <View className="flex-row items-center mb-1">
              <Zap size={14} color="#EA580C" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginLeft: 4 }}>AFFECTED</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
              {Object.keys(approvalData.details || {}).length > 0 ? `${Object.keys(approvalData.details || {}).length} Entities` : '4 Products'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity 
          onPress={handleReject}
          disabled={loading}
          className="flex-1 py-3.5 rounded-xl items-center justify-center flex-row bg-white border border-slate-300 shadow-sm"
        >
          {loading ? <ActivityIndicator size="small" color="#475569" /> : (
            <>
              <X size={16} color="#475569" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569', marginLeft: 6 }}>Decline</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleApprove}
          disabled={loading}
          className="flex-1 py-3.5 rounded-xl items-center justify-center flex-row bg-blue-600 shadow-md shadow-blue-500/30"
        >
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <>
              <Check size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginLeft: 6 }}>Execute Action</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
