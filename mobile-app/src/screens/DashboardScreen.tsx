import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import {
  TrendingUp, Megaphone, AlertTriangle, BrainCircuit,
  ChevronRight, CheckCircle2, Clock, Zap, Package,
  ArrowUpRight, ArrowDownRight, Flame, BarChart3,
  ChevronDown,
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { dashboardApi, workflowsApi } from '../api/endpoints';
import { LineChart, BarChart } from 'react-native-gifted-charts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Metrics { total_revenue: number; orders_today: number; active_campaigns: number; low_stock_alerts: number; }
interface MonthlySalesPoint { month: string; revenue: number; orders: number; }
interface LowStockItem { product_id: number; product_name: string; sku: string; city: string; quantity: number; threshold: number; }
interface HighDemandItem { product_id: number; product_name: string; sku: string; category: string; total_sold: number; total_revenue: number; }

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skel = ({ w = 'w-full', h = 'h-4', r = 'rounded-lg' }: { w?: string; h?: string; r?: string }) => (
  <View className={`${w} ${h} ${r} bg-slate-200`} />
);

const MetricsSkeleton = () => (
  <View className="flex-row justify-between flex-wrap px-5 gap-3 mb-6">
    {[1, 2, 3, 4].map(i => (
      <View key={i} className="rounded-2xl p-4" style={{ width: '46%', backgroundColor: '#F1F5F9', height: 100 }}>
        <Skel w="w-8" h="h-8" r="rounded-full" />
        <View className="mt-3"><Skel w="w-16" h="h-3" /></View>
        <View className="mt-2"><Skel w="w-24" h="h-5" /></View>
      </View>
    ))}
  </View>
);

// ─── KPI Card (2-column grid) ──────────────────────────────────────────────

const KPI_COLORS = {
  revenue: { bg: '#EFF6FF', accent: '#2563EB', icon: '#1D4ED8' },
  orders: { bg: '#F0FDF4', accent: '#16A34A', icon: '#15803D' },
  campaigns: { bg: '#FDF4FF', accent: '#9333EA', icon: '#7E22CE' },
  alerts: { bg: '#FFF7ED', accent: '#EA580C', icon: '#C2410C' },
};

interface KpiProps { label: string; value: string; isUp?: boolean; change?: string; colorKey: keyof typeof KPI_COLORS; icon: React.ReactNode; }
const KpiCard = ({ label, value, isUp = true, change, colorKey, icon }: KpiProps) => {
  const c = KPI_COLORS[colorKey];
  return (
    <View className="rounded-2xl p-4 flex-1" style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: `${c.accent}20` }}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="p-2 rounded-xl" style={{ backgroundColor: `${c.accent}18` }}>{icon}</View>
        {change && (
          <View className="flex-row items-center px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isUp ? '#DCFCE7' : '#FEE2E2' }}>
            {isUp ? <ArrowUpRight size={10} color="#16A34A" /> : <ArrowDownRight size={10} color="#DC2626" />}
            <Text style={{ fontSize: 10, color: isUp ? '#16A34A' : '#DC2626', fontWeight: '700', marginLeft: 1 }}>{change}</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: `${c.accent}99`, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>{value}</Text>
    </View>
  );
};

// ─── Monthly Sales Section ─────────────────────────────────────────────────

const YEARS = [2026, 2025, 2024];

const MonthlySalesSection = () => {
  const [year, setYear] = useState(2026);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedBar, setSelectedBar] = useState<{ month: string; revenue: number } | null>(null);

  const { data, isLoading, refetch } = useQuery<{ data: MonthlySalesPoint[] }>({
    queryKey: ['monthly-sales', year],
    queryFn: () => dashboardApi.getMonthlySales(year),
    refetchInterval: 10000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const chartData = (data?.data || []).map(d => ({
    value: d.revenue / 1000,  // show in thousands
    label: d.month,
    frontColor: selectedBar?.month === d.month ? '#1D4ED8' : '#2563EB',
    topLabelComponent: () => null,
    onPress: () => setSelectedBar({ month: d.month, revenue: d.revenue }),
  }));

  const hasData = chartData.some(d => d.value > 0);

  return (
    <View className="mx-5 mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Monthly Sales</Text>
          <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Revenue in PKR thousands</Text>
        </View>
        {/* Year Dropdown */}
        <TouchableOpacity
          onPress={() => setShowYearPicker(!showYearPicker)}
          className="flex-row items-center px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginRight: 4 }}>{year}</Text>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Inline picker */}
      {showYearPicker && (
        <View className="absolute right-0 top-10 z-10 rounded-xl overflow-hidden" style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', elevation: 8, shadowOpacity: 0.1, shadowRadius: 8 }}>
          {YEARS.map(y => (
            <TouchableOpacity key={y} onPress={() => { setYear(y); setShowYearPicker(false); setSelectedBar(null); }}
              className="px-5 py-3" style={{ backgroundColor: y === year ? '#EFF6FF' : '#FFF' }}>
              <Text style={{ color: y === year ? '#2563EB' : '#0F172A', fontWeight: y === year ? '700' : '400' }}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Dynamic Selected Bar Tooltip */}
      {selectedBar && (
        <View style={{
          backgroundColor: '#1E293B',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#334155'
        }}>
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>{selectedBar.month} Sales Performance</Text>
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>₨ {selectedBar.revenue.toLocaleString()}</Text>
        </View>
      )}

      <View className="rounded-2xl p-4" style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' }}>
        {isLoading ? (
          <View className="items-center py-8"><ActivityIndicator color="#2563EB" /></View>
        ) : !hasData ? (
          <NoDataView message="No sales data for this year" />
        ) : (
          <BarChart
            data={chartData}
            barWidth={18}
            spacing={8}
            roundedTop
            hideRules
            xAxisLabelTextStyle={{ fontSize: 9, color: '#94A3B8' }}
            yAxisTextStyle={{ fontSize: 9, color: '#94A3B8' }}
            noOfSections={4}
            barBorderRadius={4}
            frontColor="#2563EB"
            height={180}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#E2E8F0"
          />
        )}
      </View>
    </View>
  );
};

// ─── No Data View ─────────────────────────────────────────────────────────────

const NoDataView = ({ message }: { message: string }) => (
  <View className="items-center py-10">
    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      <Package size={28} color="#CBD5E1" />
    </View>
    <Text style={{ fontSize: 14, fontWeight: '600', color: '#94A3B8' }}>No Data Found</Text>
    <Text style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4, textAlign: 'center' }}>{message}</Text>
  </View>
);

// ─── Low Stock Section ────────────────────────────────────────────────────────

const LowStockSection = () => {
  const { data, isLoading, refetch } = useQuery<{ items: LowStockItem[] }>({
    queryKey: ['low-stock'],
    queryFn: dashboardApi.getLowStock,
    refetchInterval: 3000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const items = data?.items || [];

  return (
    <View className="mx-5 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Low Stock Alerts</Text>
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>{items.length} items</Text>
      </View>
      <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}>
        {isLoading ? (
          <View className="p-8 items-center"><ActivityIndicator color="#2563EB" /></View>
        ) : items.length === 0 ? (
          <NoDataView message="All stock levels are healthy" />
        ) : (
          <View>
            {/* Table Header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Product</Text>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>City</Text>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Stock</Text>
            </View>
            {/* Table Rows */}
            {items.map((item, idx) => (
              <View key={`${item.product_id}-${item.city}`}
                style={{
                  flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16,
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  borderBottomWidth: idx < items.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9',
                  alignItems: 'center'
                }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{item.sku}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#475569', textAlign: 'center' }}>{item.city}</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>{item.quantity}</Text>
                  <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>min: {item.threshold}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── High Demand Section ──────────────────────────────────────────────────────

const HighDemandSection = () => {
  const { data, isLoading, refetch } = useQuery<{ items: HighDemandItem[] }>({
    queryKey: ['high-demand'],
    queryFn: dashboardApi.getHighDemand,
    refetchInterval: 5000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const items = data?.items || [];

  return (
    <View className="mx-5 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>High Demand Products</Text>
        <View className="flex-row items-center">
          <Flame size={13} color="#2563EB" />
          <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '600', marginLeft: 3 }}>Top {items.length}</Text>
        </View>
      </View>
      <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}>
        {isLoading ? (
          <View className="p-8 items-center"><ActivityIndicator color="#2563EB" /></View>
        ) : items.length === 0 ? (
          <NoDataView message="No sales recorded yet" />
        ) : (
          <View>
            {/* Table Header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <Text style={{ flex: 0.5, fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Rank</Text>
              <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Product</Text>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Sold</Text>
              <Text style={{ flex: 1.5, fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Revenue</Text>
            </View>
            {/* Table Rows */}
            {items.map((item, idx) => (
              <View key={item.product_id}
                style={{
                  flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16,
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  borderBottomWidth: idx < items.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9',
                  alignItems: 'center'
                }}>
                <Text style={{ flex: 0.5, fontSize: 13, fontWeight: '800', color: '#2563EB' }}>#{idx + 1}</Text>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{item.category}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: '#2563EB', textAlign: 'center' }}>{item.total_sold}</Text>
                <Text style={{ flex: 1.5, fontSize: 13, fontWeight: '800', color: '#0F172A', textAlign: 'right' }}>₨ {item.total_revenue.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── AI Actions Section ───────────────────────────────────────────────────────

const ACTION_STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  executed: { color: '#16A34A', bg: '#DCFCE7', icon: <CheckCircle2 size={14} color="#16A34A" /> },
  pending: { color: '#EA580C', bg: '#FEE0C0', icon: <Clock size={14} color="#EA580C" /> },
  insight: { color: '#2563EB', bg: '#DBEAFE', icon: <Zap size={14} color="#2563EB" /> },
};

const RecentAIActionsSection = () => {
  const { data: workflows = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['workflows'],
    queryFn: workflowsApi.getAll,
    refetchInterval: 3000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const displayList = workflows.slice(0, 3); // show top 3

  return (
    <View className="px-5 pb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Recent AI Actions</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator color="#2563EB" style={{ marginVertical: 12 }} />
      ) : displayList.length === 0 ? (
        <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginVertical: 12 }}>No recent actions taken by AI.</Text>
      ) : (
        displayList.map((item, index) => {
          const statusMapped = item.status === 'completed' ? 'executed' : item.status === 'pending' ? 'pending' : 'insight';
          const s = ACTION_STATUS_CONFIG[statusMapped] || ACTION_STATUS_CONFIG.insight;
          const timeFormatted = item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

          // Robust fallback mapping for the new Orchestrator payload schema
          const title = item.action_log?.action_category || item.context_data?.decision?.action_type || item.name || 'AI Insight Generation';
          const description = item.action_log?.log_message || item.context_data?.insight?.summary || item.description || 'AI analyzed business context and formulated a recommendation.';
          const projectedImpact = item.context_data?.decision?.expected_impact || item.projected_impact || null;

          return (
            <View key={item.id || index} className="flex-row">
              <View className="items-center mr-3" style={{ width: 32 }}>
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: s.bg }}>{s.icon}</View>
                {index < displayList.length - 1 && <View style={{ flex: 1, width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />}
              </View>
              <View className="flex-1 pb-5">
                <View className="flex-row justify-between items-center mb-1">
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', textTransform: 'capitalize' }}>{title.replace(/_/g, ' ')}</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>{timeFormatted}</Text>
                </View>
                <Text style={{ fontSize: 12, lineHeight: 17, color: '#475569', marginBottom: 6 }}>{description}</Text>
                {projectedImpact && (
                  <View className="self-start px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{projectedImpact}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

// ─── Weekly Sales Section ────────────────────────────────────────────────────

const WeeklySalesSection = () => {
  const { data: weeklySalesData, isLoading, refetch } = useQuery<{ data: { day: string; revenue: number; orders: number }[] }>({
    queryKey: ['weekly-sales'],
    queryFn: dashboardApi.getWeeklySales,
    refetchInterval: 10000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const points = weeklySalesData?.data || [];

  const chartData = points.map(p => ({
    value: p.revenue / 1000, // display in thousands
    label: p.day,
  }));

  const hasData = chartData.some(d => d.value > 0);

  return (
    <View className="mx-5 mb-6">
      <View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Weekly Sales</Text>
        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 1, marginBottom: 12 }}>Revenue trend over the last 7 days (PKR Thousands)</Text>
      </View>
      <View className="rounded-2xl p-4" style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' }}>
        {isLoading ? (
          <View className="items-center py-8"><ActivityIndicator color="#16A34A" /></View>
        ) : !hasData ? (
          <NoDataView message="No sales data recorded this week" />
        ) : (
          <LineChart
            data={chartData}
            color="#16A34A"
            thickness={3}
            noOfSections={4}
            hideRules
            xAxisLabelTextStyle={{ fontSize: 9, color: '#94A3B8' }}
            yAxisTextStyle={{ fontSize: 9, color: '#94A3B8' }}
            height={160}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#E2E8F0"
            pointerConfig={{
              pointerStripColor: '#16A34A',
              pointerStripWidth: 1.5,
              pointerColor: '#16A34A',
              radius: 5,
              pointerLabelComponent: (items: any) => {
                if (!items || items.length === 0) return null;
                return (
                  <View style={{
                    backgroundColor: '#1E293B',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    position: 'absolute',
                    bottom: 20,
                    left: -40,
                    width: 90,
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>₨ {Math.round(items[0].value * 1000).toLocaleString()}</Text>
                  </View>
                );
              }
            }}
          />
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const DashboardScreen = () => {
  const { data: metrics, isLoading, isRefetching, refetch } = useQuery<Metrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: dashboardApi.getMetrics,
    refetchInterval: 3000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const fmt = (n: number) => n >= 1000000 ? `₨${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `₨${(n / 1000).toFixed(0)}K` : `₨${n}`;

  return (
    <ScreenWrapper noPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-4">
          <View className="flex-row items-center mb-1">
            <BrainCircuit size={18} color="#2563EB" />
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#2563EB', marginLeft: 6, textTransform: 'uppercase' }}>NexusForge</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>Operations Overview</Text>
          <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>AI-managed · Live data</Text>
        </View>

        {/* KPI Grid */}
        {isLoading ? <MetricsSkeleton /> : (
          <View className="px-5 mb-6">
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <KpiCard label="Total Revenue" value={fmt(metrics?.total_revenue ?? 0)} colorKey="revenue" icon={<TrendingUp size={18} color={KPI_COLORS.revenue.icon} />} />
              <KpiCard label="Total Orders" value={(metrics?.orders_today ?? 0).toLocaleString()} colorKey="orders" icon={<CheckCircle2 size={18} color={KPI_COLORS.orders.icon} />} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <KpiCard label="Campaigns" value={`${metrics?.active_campaigns ?? 0} Active`} colorKey="campaigns" icon={<Megaphone size={18} color={KPI_COLORS.campaigns.icon} />} />
              <KpiCard label="Low Stock" value={`${metrics?.low_stock_alerts ?? 0} SKUs`} colorKey="alerts" icon={<AlertTriangle size={18} color={KPI_COLORS.alerts.icon} />} />
            </View>
          </View>
        )}

        {/* Weekly Sales Chart */}
        <WeeklySalesSection />

        {/* Monthly Sales Chart */}
        <MonthlySalesSection />

        {/* Low Stock */}
        <LowStockSection />

        {/* High Demand */}
        <HighDemandSection />

        {/* Recent AI Actions */}
        <RecentAIActionsSection />
      </ScrollView>
    </ScreenWrapper>
  );
};
