import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Dimensions
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import EventSource from 'react-native-sse';
import {
  Globe, ShieldAlert, PackageSearch,
  TrendingUp, Sparkles, BrainCircuit,
  FileText, UploadCloud, X, ChevronRight
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { WorkflowTimeline } from '../components/operations/WorkflowTimeline';
import { RecommendationCard } from '../components/operations/RecommendationCard';
import { InsightSection } from '../components/operations/InsightSection';
import { StateComparisonCard } from '../components/operations/StateComparisonCard';
import { useAIWorkflowStore } from '../store/aiWorkflowStore';
import { workflowsApi } from '../api/endpoints';
import { BASE_URL } from '../api/client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // 2-column grid with 20px padding each side + 8px gap

const CATEGORIES = [
  { id: 'sales_risk', title: 'Sales Risk\nDetection', icon: ShieldAlert, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { id: 'inventory', title: 'Inventory\nAnalysis', icon: PackageSearch, color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A' },
  { id: 'pricing', title: 'Pricing\nOptimization', icon: TrendingUp, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { id: 'external_news', title: 'External News\nAnalysis', icon: Globe, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
];

export const OperationsCenterScreen = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [workflowStarted, setWorkflowStarted] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const {
    workflowId, isProcessing, isAwaitingApproval, isComplete,
    triggerWorkflow, addLog, setStep, requireApproval,
    approvalData, beforeAfterData, finishExecution, reset,
    approveAction, rejectAction
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
    if (esRef.current) {
      esRef.current.close();
    }
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
          try {
            const statusRes = await workflowsApi.getStatus(id);
            if (statusRes.context_data) {
              requireApproval(statusRes.context_data);
              es.close();
            }
          } catch (e) {
            console.log('Failed to fetch approval data', e);
          }
        } else if (message.includes('Workflow completed') || message.startsWith('Error:')) {
          es.close();
          if (message.includes('Workflow completed')) {
            finishExecution({
              summary: 'All recommended actions have been applied. Business data has been updated successfully.',
              metrics: [],
            });
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
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
    setWorkflowStarted(true);
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

  const handleReset = () => {
    reset();
    setWorkflowStarted(false);
    setInputText('');
    setSelectedFile(null);
    setSelectedCategory(null);
  };

  // Listen for approval data so we can update the store properly when SSE closes and wait for user click
  useEffect(() => {
    if (workflowId && !isProcessing && beforeAfterData === null && approvalData && isAwaitingApproval) {
      console.log('Approval data ready, waiting for user click.');
    }
  }, [isAwaitingApproval, approvalData, workflowId, isProcessing, beforeAfterData]);

  const handleApproveAction = async () => {
    if (!workflowId) return;
    addLog('Approval received. Executing actions...');
    setStep('execution');
    approveAction();
    try {
      await workflowsApi.approve(workflowId, true);
      startStream(workflowId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectAction = async () => {
    if (!workflowId) return;
    try {
      await workflowsApi.approve(workflowId, false);
      rejectAction();
    } catch (err) {
      console.error(err);
    }
  };

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, []);

  return (
    <ScreenWrapper noPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
      >
        {/* ─── Header ────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingTop: 4 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>AI Operations</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Autonomous Business Intelligence</Text>
          </View>
          <View style={{
            backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6,
            borderRadius: 20, flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: '#BFDBFE',
          }}>
            <BrainCircuit size={14} color="#2563EB" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', marginLeft: 5 }}>Live AI</Text>
          </View>
        </View>

        {/* ─── Category 2-Column Grid ─────────────────────────────── */}
        {!workflowStarted && (
          <>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
              Workflow Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    style={{
                      width: '48%',
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      backgroundColor: isSelected ? cat.bg : '#FFFFFF',
                      borderColor: isSelected ? cat.color : '#E2E8F0',
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: isSelected ? cat.color + '22' : '#F8FAFC',
                      alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10,
                    }}>
                      <cat.icon size={18} color={isSelected ? cat.color : '#94A3B8'} />
                    </View>
                    <Text style={{
                      fontSize: 13, fontWeight: '700',
                      color: isSelected ? cat.color : '#334155',
                      lineHeight: 18,
                    }}>
                      {cat.title}
                    </Text>
                    {isSelected && (
                      <View style={{
                        marginTop: 8, flexDirection: 'row', alignItems: 'center',
                      }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cat.color, marginRight: 4 }} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: cat.color }}>SELECTED</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── Data Intake Box ──────────────────────────────── */}
            <View style={{
              backgroundColor: '#fff', borderRadius: 20, padding: 20,
              marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 14 }}>
                Data Intake
              </Text>

              <TextInput
                multiline
                numberOfLines={4}
                value={inputText}
                onChangeText={setInputText}
                placeholder={"Paste business report, news article, or describe an operational issue...\ne.g. 'Fuel prices surged 12% in Lahore' or 'Sales dropped significantly in Karachi'"}
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14, padding: 16, paddingTop: 14,
                  fontSize: 14, color: '#0F172A',
                  textAlignVertical: 'top',
                  minHeight: 120,
                  borderWidth: 1, borderColor: '#E2E8F0',
                  marginBottom: 12,
                  lineHeight: 22,
                }}
              />

              {selectedFile ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12,
                  borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 14,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <FileText size={18} color="#2563EB" />
                    <Text style={{ fontSize: 13, color: '#1E3A8A', marginLeft: 8, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="middle">
                      {selectedFile.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedFile(null)} style={{ padding: 4 }}>
                    <X size={18} color="#60A5FA" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFile}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#F8FAFC', paddingVertical: 14, borderRadius: 14,
                    borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed',
                    marginBottom: 14,
                  }}
                  activeOpacity={0.7}
                >
                  <UploadCloud size={18} color="#94A3B8" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8', marginLeft: 8 }}>
                    Upload Data (CSV, Excel, PDF, Image)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleTrigger}
                disabled={!inputText && !selectedFile}
                style={{
                  backgroundColor: (!inputText && !selectedFile) ? '#BFDBFE' : '#2563EB',
                  borderRadius: 14, paddingVertical: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                }}
                activeOpacity={0.85}
              >
                <Sparkles size={18} color="white" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: 'white', marginLeft: 8 }}>
                  Analyze & Recommend
                </Text>
                <ChevronRight size={18} color="white" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── Inline Live Workflow Panel ──────────────────────────── */}
        {workflowStarted && (
          <View style={{ marginTop: 4 }}>
            {/* Inline input recap pill */}
            {inputText ? (
              <View style={{
                backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12,
                marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0',
                flexDirection: 'row', alignItems: 'flex-start',
              }}>
                <FileText size={14} color="#64748B" style={{ marginTop: 1 }} />
                <Text
                  style={{ fontSize: 12, color: '#475569', marginLeft: 8, flex: 1, lineHeight: 18 }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {inputText}
                </Text>
              </View>
            ) : null}

            {/* Live Timeline */}
            <WorkflowTimeline />

            {/* Insight Section */}
            <InsightSection />

            {/* Approval / Recommendation Card */}
            <RecommendationCard
              workflowId={workflowId}
              onApprove={handleApproveAction}
              onReject={handleRejectAction}
            />

            {/* Completion Card (replaces the old "Start New Workflow" button) */}
            <StateComparisonCard />

            {/* Reset Button — only if not yet complete (complete card has its own) */}
            {!isComplete && !isProcessing && !isAwaitingApproval && workflowStarted && (
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  marginTop: 16, borderRadius: 16, paddingVertical: 14,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>
                  ← Back to New Workflow
                </Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button - available while processing or awaiting approval */}
            {workflowStarted && !isComplete && (isProcessing || isAwaitingApproval) && (
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  marginTop: 16, borderRadius: 16, paddingVertical: 14,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#DC2626' }}>
                  Cancel Workflow
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};
