import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl,
  Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BrainCircuit, Megaphone, Tag, MapPin, CalendarDays, Users,
  Sparkles, Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight,
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { campaignsApi } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: number; name: string; coupon_code: string;
  discount_percent: number; region: string; is_active: boolean;
  ai_generated: boolean; projected_impact: string | null;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: 'Active',    color: '#16A34A', bg: '#DCFCE7', dot: '#4ADE80' },
  inactive:  { label: 'Inactive',  color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' },
};

// ─── Fixed Filter Pill ────────────────────────────────────────────────────────

const FilterPill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={{
      height: 34,
      paddingHorizontal: 14,
      borderRadius: 17,
      marginRight: 8,
      borderWidth: 1.5,
      backgroundColor: active ? '#2563EB' : '#FFFFFF',
      borderColor: active ? '#2563EB' : '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : '#64748B' }}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── No Data ─────────────────────────────────────────────────────────────────

const NoData = ({ message }: { message: string }) => (
  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
      <Megaphone size={32} color="#CBD5E1" />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '700', color: '#94A3B8' }}>No Campaigns Found</Text>
    <Text style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{message}</Text>
  </View>
);

// ─── Campaign Card ─────────────────────────────────────────────────────────────

const CampaignCard = ({
  item, onEdit, onDelete, onToggle,
}: { item: Campaign; onEdit: (c: Campaign) => void; onDelete: (c: Campaign) => void; onToggle: (c: Campaign) => void }) => {
  const s = STATUS_CONFIG[item.is_active ? 'active' : 'inactive'];

  return (
    <View style={{
      marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF',
      borderWidth: 1, borderColor: item.is_active ? '#BBF7D0' : '#E2E8F0', overflow: 'hidden',
    }}>
      {item.is_active && <View style={{ height: 3, backgroundColor: '#16A34A' }} />}
      <View style={{ padding: 16 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            {/* Badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {/* Status pill */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: s.bg }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot, marginRight: 5 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{s.label}</Text>
              </View>
              {item.ai_generated && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                  <BrainCircuit size={10} color="#2563EB" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB', marginLeft: 4 }}>AI Generated</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }} numberOfLines={2}>{item.name}</Text>
          </View>
          {/* Discount badge */}
          <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, minWidth: 60 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#2563EB' }}>{item.discount_percent}%</Text>
            <Text style={{ fontSize: 10, color: '#94A3B8' }}>OFF</Text>
          </View>
        </View>

        {/* Coupon code */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
          <Tag size={12} color="#64748B" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginLeft: 8, fontVariant: ['tabular-nums'] }}>{item.coupon_code}</Text>
        </View>

        {/* Meta */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: item.projected_impact ? 10 : 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MapPin size={12} color="#94A3B8" />
            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 5 }}>{item.region}</Text>
          </View>
        </View>

        {/* Projected impact */}
        {item.projected_impact && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 }}>
            <Sparkles size={12} color="#16A34A" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#16A34A', marginLeft: 6 }}>Projected: {item.projected_impact}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          {/* Toggle active */}
          <TouchableOpacity
            onPress={() => onToggle(item)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: item.is_active ? '#FEF9C3' : '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
          >
            {item.is_active
              ? <ToggleRight size={14} color="#CA8A04" />
              : <ToggleLeft size={14} color="#16A34A" />}
            <Text style={{ fontSize: 11, fontWeight: '700', color: item.is_active ? '#CA8A04' : '#16A34A', marginLeft: 5 }}>
              {item.is_active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          {/* Edit */}
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}
          >
            <Pencil size={13} color="#2563EB" />
          </TouchableOpacity>
          {/* Delete */}
          <TouchableOpacity
            onPress={() => onDelete(item)}
            style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}
          >
            <Trash2 size={13} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── Summary Bar ─────────────────────────────────────────────────────────────

const SummaryBar = ({ campaigns }: { campaigns: Campaign[] }) => {
  const active = campaigns.filter(c => c.is_active).length;
  const aiGen = campaigns.filter(c => c.ai_generated).length;
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, backgroundColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-evenly' }}>
      {[
        { label: 'Active', value: active, color: '#4ADE80' },
        { label: 'AI Created', value: `${aiGen}/${campaigns.length}`, color: '#60A5FA' },
        { label: 'Total', value: campaigns.length, color: '#FDBA74' },
      ].map(s => (
        <View key={s.label} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: s.color }}>{s.value}</Text>
          <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Campaign Form Modal ──────────────────────────────────────────────────────

interface CampaignForm { name: string; coupon_code: string; discount_percent: string; region: string; projected_impact: string; ai_generated: boolean; }
const emptyForm = (): CampaignForm => ({ name: '', coupon_code: '', discount_percent: '', region: '', projected_impact: '', ai_generated: false });

const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor="#CBD5E1" keyboardType={keyboardType}
      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A' }}
    />
  </View>
);

const CampaignFormModal = ({
  visible, onClose, editCampaign, onSaved,
}: { visible: boolean; onClose: () => void; editCampaign: Campaign | null; onSaved: () => void }) => {
  const [form, setForm] = useState<CampaignForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const isEdit = !!editCampaign;

  React.useEffect(() => {
    if (editCampaign) {
      setForm({
        name: editCampaign.name, coupon_code: editCampaign.coupon_code,
        discount_percent: String(editCampaign.discount_percent), region: editCampaign.region,
        projected_impact: editCampaign.projected_impact || '', ai_generated: editCampaign.ai_generated,
      });
    } else {
      setForm(emptyForm());
    }
  }, [editCampaign, visible]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.coupon_code.trim() || !form.discount_percent || !form.region.trim()) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), coupon_code: form.coupon_code.trim().toUpperCase(),
        discount_percent: parseFloat(form.discount_percent), region: form.region.trim(),
        projected_impact: form.projected_impact.trim() || null,
        ai_generated: form.ai_generated,
      };
      if (isEdit && editCampaign) {
        await campaignsApi.update(editCampaign.id, payload);
      } else {
        await campaignsApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 28, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{isEdit ? 'Edit Campaign' : 'Create Campaign'}</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <InputField label="Campaign Name *" value={form.name} onChangeText={(v: string) => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Karachi Summer Surge" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField label="Coupon Code *" value={form.coupon_code} onChangeText={(v: string) => setForm(f => ({ ...f, coupon_code: v.toUpperCase() }))} placeholder="e.g. KHI-SURGE18" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="Discount % *" value={form.discount_percent} onChangeText={(v: string) => setForm(f => ({ ...f, discount_percent: v }))} placeholder="e.g. 18" keyboardType="numeric" />
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>Region *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'All Regions'].map((city) => {
                  const isSelected = form.region === city;
                  return (
                    <TouchableOpacity
                      key={city}
                      onPress={() => setForm(f => ({ ...f, region: city }))}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <MapPin size={12} color={isSelected ? '#2563EB' : '#94A3B8'} style={{ marginRight: 5 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? '#2563EB' : '#475569' }}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <InputField label="Projected Impact" value={form.projected_impact} onChangeText={(v: string) => setForm(f => ({ ...f, projected_impact: v }))} placeholder="e.g. +₨82,000 revenue" />
            {/* AI Generated toggle */}
            <TouchableOpacity
              onPress={() => setForm(f => ({ ...f, ai_generated: !f.ai_generated }))}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BrainCircuit size={16} color="#2563EB" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginLeft: 10 }}>AI Generated</Text>
              </View>
              <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: form.ai_generated ? '#2563EB' : '#E2E8F0', justifyContent: 'center', paddingHorizontal: 2 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', alignSelf: form.ai_generated ? 'flex-end' : 'flex-start' }} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave} disabled={saving}
              style={{ backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 24, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>{isEdit ? 'Save Changes' : 'Create Campaign'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'All', label: 'All' },
  { key: 'active', label: '● Active' },
  { key: 'inactive', label: '○ Inactive' },
];

export const CampaignsScreen = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  const { data = [], isLoading, isRefetching, refetch } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.getAll,
  });

  const filtered = useMemo(() => {
    if (activeTab === 'All') return data;
    return data.filter(c => (activeTab === 'active') === c.is_active);
  }, [data, activeTab]);

  const handleEdit = (c: Campaign) => { setEditCampaign(c); setModalVisible(true); };

  const handleDelete = (c: Campaign) => {
    Alert.alert('Delete Campaign', `Delete "${c.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await campaignsApi.delete(c.id); queryClient.invalidateQueries({ queryKey: ['campaigns'] }); }
        catch { Alert.alert('Error', 'Failed to delete campaign.'); }
      }},
    ]);
  };

  const handleToggle = async (c: Campaign) => {
    try {
      await campaignsApi.update(c.id, { is_active: !c.is_active });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch { Alert.alert('Error', 'Failed to update status.'); }
  };

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['campaigns'] });

  return (
    <ScreenWrapper noPadding>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>Campaigns</Text>
          <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>AI-managed promotions · Live</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setEditCampaign(null); setModalVisible(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}
        >
          <Plus size={15} color="#FFF" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF', marginLeft: 6 }}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar (only when data loaded) */}
      {!isLoading && data.length > 0 && <SummaryBar campaigns={data} />}

      {/* Status filter tabs — fixed height pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6 }}
        style={{ maxHeight: 46, marginBottom: 10 }}
      >
        {STATUS_TABS.map(t => (
          <FilterPill key={t.key} label={t.label} active={activeTab === t.key} onPress={() => setActiveTab(t.key)} />
        ))}
      </ScrollView>

      {/* Count */}
      {!isLoading && (
        <Text style={{ fontSize: 11, color: '#94A3B8', paddingHorizontal: 20, marginBottom: 8 }}>
          {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#2563EB" size="large" />
          <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 10 }}>Loading campaigns...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <CampaignCard item={item} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          ListEmptyComponent={<NoData message={activeTab !== 'All' ? 'No campaigns with this status' : 'No campaigns created yet'} />}
        />
      )}

      <CampaignFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditCampaign(null); }}
        editCampaign={editCampaign}
        onSaved={handleSaved}
      />
    </ScreenWrapper>
  );
};
