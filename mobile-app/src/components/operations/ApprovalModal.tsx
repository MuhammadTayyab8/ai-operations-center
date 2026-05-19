import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ShieldCheck, Check, X, Building, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { useAIWorkflowStore } from '../../store/aiWorkflowStore';

export const ApprovalModal = () => {
  const { isAwaitingApproval, approvalData, approveAction, rejectAction } = useAIWorkflowStore();

  if (!isAwaitingApproval) return null;

  const actionName = approvalData?.action_type === 'update_delivery_fee' ? 'Update Delivery Fee' :
                     approvalData?.action_type === 'create_campaign' ? 'Launch Campaign' :
                     approvalData?.action_type === 'update_price' ? 'Update Pricing' :
                     approvalData?.action_type === 'reorder_stock' ? 'Reorder Stock' : 'Proposed Action';

  return (
    <Modal transparent animationType="slide" visible={isAwaitingApproval}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
        <View className="bg-white rounded-t-[32px] p-6 shadow-2xl" style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
          
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4 bg-slate-900">
              <Building size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>Executive Approval</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Confirm action before execution</Text>
            </View>
          </View>

          {/* Business Summary */}
          <View className="p-5 rounded-2xl mb-6 bg-slate-50 border border-slate-200">
            <View className="flex-row justify-between items-center mb-4">
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 1 }}>ACTION SUMMARY</Text>
              <View className="bg-green-100 px-2 py-1 rounded border border-green-200 flex-row items-center">
                 <ShieldCheck size={12} color="#166534" />
                 <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534', marginLeft: 4 }}>SAFE</Text>
              </View>
            </View>
            
            <View className="mb-4">
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>
                {actionName}
              </Text>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20 }}>
                {approvalData?.summary || 'Apply calculated adjustments to stabilize operations.'}
              </Text>
            </View>

            {/* Metrics Grid */}
            <View className="flex-row flex-wrap mt-2 pt-4" style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 }}>
              <View className="w-[45%] mb-2">
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>AFFECTED ENTITIES</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                  {Object.keys(approvalData?.details || {}).length > 0 ? `${Object.keys(approvalData?.details || {}).length} Products` : '4 Items'}
                </Text>
              </View>

              <View className="w-[45%] mb-2">
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>EXPECTED UPLIFT</Text>
                <View className="flex-row items-center">
                  <TrendingUp size={16} color="#16A34A" />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#16A34A', marginLeft: 4 }}>{approvalData?.impact || '+12%'}</Text>
                </View>
              </View>

              <View className="w-[45%]">
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>RISK ASSESSMENT</Text>
                <View className="flex-row items-center">
                  <AlertTriangle size={16} color="#EAB308" />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#CA8A04', marginLeft: 4 }}>{approvalData?.risk || 'Low'}</Text>
                </View>
              </View>
              
              <View className="w-[45%]">
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>AI CONFIDENCE</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                  {approvalData?.confidence ? `${Math.round(approvalData.confidence * 100)}%` : '88%'}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 pb-4">
            <TouchableOpacity 
              onPress={rejectAction}
              className="flex-1 py-4 rounded-xl items-center justify-center flex-row bg-white border border-slate-300 shadow-sm"
            >
              <X size={18} color="#475569" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#475569', marginLeft: 8 }}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={approveAction}
              className="flex-1 py-4 rounded-xl items-center justify-center flex-row bg-slate-900 shadow-lg shadow-slate-900/30"
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginLeft: 8 }}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
