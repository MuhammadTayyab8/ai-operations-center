import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import EventSource from 'react-native-sse';
import {
  Globe, ShieldAlert, PackageSearch,
  TrendingUp, MapPin, Sparkles, BrainCircuit,
  FileText, UploadCloud, X
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { WorkflowTimeline } from '../components/operations/WorkflowTimeline';
import { RecommendationCard } from '../components/operations/RecommendationCard';
import { InsightSection } from '../components/operations/InsightSection';
import { StateComparisonCard } from '../components/operations/StateComparisonCard';
import { useAIWorkflowStore } from '../store/aiWorkflowStore';
import { workflowsApi } from '../api/endpoints';
import { BASE_URL } from '../api/client';

const CATEGORIES = [
  { id: 'sales_risk', title: 'Sales Risk Detection', icon: ShieldAlert, color: '#EF4444', bg: '#FEF2F2' },
  { id: 'inventory', title: 'Inventory Analysis', icon: PackageSearch, color: '#EAB308', bg: '#FEFCE8' },
  { id: 'pricing', title: 'Pricing Optimization', icon: TrendingUp, color: '#10B981', bg: '#ECFDF5' },
  { id: 'external_news', title: 'External News Analysis', icon: Globe, color: '#3B82F6', bg: '#EFF6FF' },
];

export const OperationsCenterScreen = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const { 
    workflowId, isProcessing, triggerWorkflow, 
    addLog, setStep, requireApproval, setInsight,
    approvalData, beforeAfterData, finishExecution, reset 
  } = useAIWorkflowStore();

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking file', err);
    }
  };

  const startStream = (id: string) => {
    const url = `${BASE_URL}/api/v1/streaming/workflows/${id}/stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('message', async (event: any) => {
      if (event.data) {
        const message = event.data;
        addLog(message);

        // Map SSE messages to Agent Steps
        if (message.includes('Parsing')) setStep('intake');
        if (message.includes('Generating insights')) setStep('insight');
        if (message.includes('Creating recommendations')) setStep('decision');
        if (message.includes('Executing')) setStep('execution');

        if (message.includes('Waiting for approval')) {
          // Fetch status to get context_data
          const statusRes = await workflowsApi.getStatus(id);
          if (statusRes.context_data) {
            requireApproval(statusRes.context_data);
            es.close();
          }
        } else if (message.includes('Workflow completed') || message.includes('Error')) {
          es.close();
          if (message.includes('Workflow completed')) {
             finishExecution({ 
                before: 'Execution Complete', 
                after: 'System Updated', 
                metrics: [] 
             });
             // Refresh data
             queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
             queryClient.invalidateQueries({ queryKey: ['products'] });
          }
        }
      }
    });

    es.addEventListener('error', (err: any) => {
      console.log('SSE Error:', err);
      es.close();
    });
  };

  const handleTrigger = async () => {
    reset();
    triggerWorkflow(selectedCategory || 'auto');
    
    try {
      const res = await workflowsApi.trigger(
        inputText, 
        selectedCategory || '', 
        selectedFile?.uri, 
        selectedFile?.name, 
        selectedFile?.mimeType
      );
      useAIWorkflowStore.setState({ workflowId: res.workflow_id });
      startStream(res.workflow_id);
    } catch (err) {
      console.error(err);
      addLog('Error: Failed to trigger workflow');
    }
  };

  // Listen for approval to restart execution stream
  useEffect(() => {
    if (workflowId && !isProcessing && beforeAfterData === null && approvalData) {
      const finalize = async () => {
        addLog('Approval received. Executing actions...');
        setStep('execution');
        try {
          await workflowsApi.approve(workflowId, true);
          // Restart stream to catch execution logs
          startStream(workflowId);
        } catch (err) {
           console.error(err);
        }
      };
      finalize();
    }
  }, [isProcessing, approvalData]);

  // Clean up
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, []);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>AI Operations Center</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Autonomous Business Intelligence</Text>
          </View>
          <View className="bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center border border-blue-100">
            <BrainCircuit size={14} color="#2563EB" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', marginLeft: 4 }}>Live AI</Text>
          </View>
        </View>

        {!workflowId && (
          <>
            {/* Category Selector */}
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>Workflow Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`mr-3 px-4 py-3 rounded-xl flex-row items-center border ${selectedCategory === cat.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                >
                  <cat.icon size={16} color={selectedCategory === cat.id ? '#2563EB' : cat.color} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: selectedCategory === cat.id ? '#2563EB' : '#334155', marginLeft: 8 }}>
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Input Area */}
            <View className="bg-white rounded-2xl p-4 mb-6 border border-slate-200 shadow-sm">
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>Data Intake</Text>
              
              <TextInput
                multiline
                numberOfLines={4}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Paste business report, news, or operational issue...&#10;e.g. 'Fuel prices increased in Pakistan' or 'Lahore sales dropped significantly'"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 16,
                  paddingTop: 16,
                  fontSize: 14,
                  color: '#0F172A',
                  textAlignVertical: 'top',
                  minHeight: 120,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 12
                }}
              />

              {selectedFile ? (
                <View className="flex-row items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
                  <View className="flex-row items-center flex-1">
                    <FileText size={20} color="#2563EB" />
                    <Text style={{ fontSize: 13, color: '#1E3A8A', marginLeft: 8, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="middle">
                      {selectedFile.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <X size={20} color="#60A5FA" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={handlePickFile}
                  className="flex-row items-center justify-center bg-slate-50 py-3 rounded-xl border border-dashed border-slate-300 mb-4"
                >
                  <UploadCloud size={18} color="#64748B" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B', marginLeft: 8 }}>Upload Data (CSV, Excel, PDF, Image)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleTrigger}
                disabled={!inputText && !selectedFile}
                className={`py-4 rounded-xl items-center shadow-sm ${(!inputText && !selectedFile) ? 'bg-blue-300' : 'bg-blue-600'}`}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Analyze & Recommend</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {workflowId && (
          <View className="mt-2">
            <WorkflowTimeline />
            <InsightSection />
            <RecommendationCard />
            <StateComparisonCard />

            {!isProcessing && beforeAfterData && (
              <TouchableOpacity 
                onPress={reset}
                className="mt-6 bg-blue-600 rounded-xl py-4 items-center shadow-sm"
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Start New Workflow</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
};
