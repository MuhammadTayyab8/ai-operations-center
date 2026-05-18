import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, FlatList,
  RefreshControl, Alert, Modal, ActivityIndicator, KeyboardAvoidingView,
  Platform, Pressable,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, BrainCircuit, Package, ChevronDown, ChevronUp,
  TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Plus, Pencil, Trash2, X, MapPin,
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Badge } from '../components/common/Badge';
import { productsApi } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem { id: number; city: string; quantity: number; low_stock_threshold: number; }
interface Product {
  id: number; name: string; sku: string; base_price: number;
  category: string; ai_updated_at: string | null; inventory: InventoryItem[];
}

const DEFAULT_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'];

// ─── Filter Pill ──────────────────────────────────────────────────────────────

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
    <Text
      numberOfLines={1}
      style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : '#64748B' }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Stock Indicator ──────────────────────────────────────────────────────────

const stockStatus = (inv: InventoryItem[]) => {
  const total = inv.reduce((s, i) => s + i.quantity, 0);
  const anyLow = inv.some(i => i.quantity > 0 && i.quantity <= i.low_stock_threshold);
  const allOut = inv.every(i => i.quantity === 0);
  if (allOut) return 'out_of_stock';
  if (anyLow) return 'low_stock';
  return 'healthy';
};

const StockIndicator = ({ status }: { status: string }) => {
  const cfg: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    healthy: { label: 'In Stock', color: '#16A34A', bg: '#DCFCE7', icon: <CheckCircle2 size={11} color="#16A34A" /> },
    low_stock: { label: 'Low Stock', color: '#EA580C', bg: '#FEE0C0', icon: <AlertTriangle size={11} color="#EA580C" /> },
    out_of_stock: { label: 'Out of Stock', color: '#DC2626', bg: '#FEE2E2', icon: <XCircle size={11} color="#DC2626" /> },
  };
  const c = cfg[status] || cfg.healthy;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: c.bg }}>
      {c.icon}
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.color, marginLeft: 4 }}>{c.label}</Text>
    </View>
  );
};

// ─── Region Bar ───────────────────────────────────────────────────────────────

const RegionBar = ({ region, count, max }: { region: string; count: number; max: number }) => {
  const pct = max > 0 ? count / max : 0;
  const color = count === 0 ? '#DC2626' : count <= 5 ? '#EA580C' : '#16A34A';
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 11, color: '#64748B' }}>{region}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color }}>{count}</Text>
      </View>
      <View style={{ height: 4, backgroundColor: '#E2E8F0', borderRadius: 4 }}>
        <View style={{ width: `${pct * 100}%`, height: 4, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = ({ item, onEdit, onDelete }: { item: Product; onEdit: (p: Product) => void; onDelete: (p: Product) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const maxQty = Math.max(...item.inventory.map(i => i.quantity), 1);
  const totalStock = item.inventory.reduce((s, i) => s + i.quantity, 0);
  const status = stockStatus(item.inventory);

  return (
    <View style={{ marginBottom: 12, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
      {/* Main row */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(!expanded)} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {item.ai_updated_at && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                  <BrainCircuit size={10} color="#2563EB" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563EB', marginLeft: 4 }}>AI Updated</Text>
                </View>
              )}
              <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }}>{item.category}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>{item.sku}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>₨ {item.base_price.toLocaleString()}</Text>
            <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{totalStock} units total</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <StockIndicator status={status} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Edit */}
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onEdit(item); }}
              style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil size={13} color="#2563EB" />
            </TouchableOpacity>
            {/* Delete */}
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onDelete(item); }}
              style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={13} color="#DC2626" />
            </TouchableOpacity>
            {/* Expand toggle */}
            {expanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded inventory */}
      {expanded && (
        <View style={{ padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 12 }}>
            Regional Inventory
          </Text>
          {item.inventory.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#CBD5E1' }}>No inventory records</Text>
          ) : (
            item.inventory.map((inv: any, i: number) => <RegionBar key={i} region={inv.city} count={inv.quantity} max={maxQty} />)
          )}
        </View>
      )}
    </View>
  );
};

// ─── Product Form Modal ───────────────────────────────────────────────────────

interface FormState { name: string; sku: string; base_price: string; category: string; inventory: { city: string; quantity: string; threshold: string }[] }
const emptyForm = (): FormState => ({
  name: '', sku: '', base_price: '', category: '',
  inventory: DEFAULT_CITIES.map(city => ({ city, quantity: '0', threshold: '5' })),
});

const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#CBD5E1"
      keyboardType={keyboardType}
      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A' }}
    />
  </View>
);

const ProductFormModal = ({
  visible, onClose, editProduct, onSaved
}: {
  visible: boolean; onClose: () => void; editProduct: Product | null; onSaved: () => void;
}) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = !!editProduct;

  React.useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        sku: editProduct.sku,
        base_price: String(editProduct.base_price),
        category: editProduct.category,
        inventory: DEFAULT_CITIES.map(city => {
          const inv = editProduct.inventory.find(i => i.city === city);
          return { city, quantity: String(inv?.quantity ?? 0), threshold: String(inv?.low_stock_threshold ?? 5) };
        }),
      });
    } else {
      setForm(emptyForm());
    }
  }, [editProduct, visible]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.base_price || !form.category.trim()) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        base_price: parseFloat(form.base_price),
        category: form.category.trim(),
        inventory: form.inventory.map(i => ({
          city: i.city, quantity: parseInt(i.quantity) || 0, low_stock_threshold: parseInt(i.threshold) || 5,
        })),
      };
      if (isEdit && editProduct) {
        await productsApi.update(editProduct.id, payload);
      } else {
        await productsApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 28, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {/* Basic Fields */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Product Details</Text>
            <InputField label="Product Name *" value={form.name} onChangeText={(v: string) => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Samsung Galaxy A15" />
            <InputField label="SKU *" value={form.sku} onChangeText={(v: string) => setForm(f => ({ ...f, sku: v }))} placeholder="e.g. SKU-2041" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField label="Base Price (₨) *" value={form.base_price} onChangeText={(v: string) => setForm(f => ({ ...f, base_price: v }))} placeholder="e.g. 42999" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="Category *" value={form.category} onChangeText={(v: string) => setForm(f => ({ ...f, category: v }))} placeholder="e.g. Smartphones" />
              </View>
            </View>

            {/* Inventory per city */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 14 }}>Inventory by Region</Text>
            {form.inventory.map((inv, idx) => (
              <View key={inv.city} style={{ marginBottom: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MapPin size={13} color="#2563EB" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginLeft: 6 }}>{inv.city}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>Quantity</Text>
                    <TextInput
                      value={inv.quantity}
                      onChangeText={v => setForm(f => ({ ...f, inventory: f.inventory.map((it, i) => i === idx ? { ...it, quantity: v } : it) }))}
                      keyboardType="numeric"
                      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0F172A' }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>Min Threshold</Text>
                    <TextInput
                      value={inv.threshold}
                      onChangeText={v => setForm(f => ({ ...f, inventory: f.inventory.map((it, i) => i === idx ? { ...it, threshold: v } : it) }))}
                      keyboardType="numeric"
                      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0F172A' }}
                    />
                  </View>
                </View>
              </View>
            ))}

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 24, opacity: saving ? 0.7 : 1 }}
            >
              {saving
                ? <ActivityIndicator color="#FFF" />
                : <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>{isEdit ? 'Save Changes' : 'Add Product'}</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── No Data View ─────────────────────────────────────────────────────────────

const NoData = ({ message }: { message: string }) => (
  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
      <Package size={32} color="#CBD5E1" />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '700', color: '#94A3B8' }}>No Products Found</Text>
    <Text style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{message}</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: 'All', label: 'All Status' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'low_stock', label: 'Low Stock' },
  { key: 'out_of_stock', label: 'Out of Stock' },
];

export const ProductsScreen = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const { data = [], isLoading, isRefetching, refetch } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  // Dynamic categories from API data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.map(p => p.category)));
    return ['All', ...cats.sort()];
  }, [data]);

  // Filtered list
  const filtered = useMemo(() => {
    return data.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const status = stockStatus(p.inventory);
      const matchStatus = activeStatus === 'All' || status === activeStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [data, search, activeCategory, activeStatus]);

  console.log('data', data);


  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setModalVisible(true);
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await productsApi.delete(product.id);
              queryClient.invalidateQueries({ queryKey: ['products'] });
            } catch {
              Alert.alert('Error', 'Failed to delete product.');
            }
          }
        }
      ]
    );
  };

  const handleAddNew = () => {
    setEditProduct(null);
    setModalVisible(true);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return (
    <ScreenWrapper noPadding>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>Products</Text>
            <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{data.length} SKUs · Live inventory</Text>
          </View>
          <TouchableOpacity
            onPress={handleAddNew}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}
          >
            <Plus size={15} color="#FFF" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF', marginLeft: 6 }}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={{ marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <Search size={15} color="#94A3B8" />
        <TextInput
          style={{ flex: 1, paddingVertical: 11, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          placeholder="Search by name or SKU..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter — dynamic from data */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6 }} style={{ minHeight: 38, marginBottom: 4 }}>
        {categories.map(cat => (
          <FilterPill key={cat} label={cat} active={activeCategory === cat} onPress={() => setActiveCategory(cat)} />
        ))}
      </ScrollView>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }} style={{ minHeight: 40, marginBottom: 8 }}>
        {STATUS_FILTERS.map(f => (
          <FilterPill key={f.key} label={f.label} active={activeStatus === f.key} onPress={() => setActiveStatus(f.key)} />
        ))}
      </ScrollView>

      {/* Count */}
      <Text style={{ fontSize: 11, color: '#94A3B8', paddingHorizontal: 20, marginBottom: 8 }}>
        {filtered.length} of {data.length} results
      </Text>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#2563EB" size="large" />
          <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 10 }}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <ProductCard item={item} onEdit={handleEdit} onDelete={handleDelete} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          ListEmptyComponent={
            <NoData message={search || activeCategory !== 'All' || activeStatus !== 'All' ? 'Try adjusting your filters' : 'No products have been added yet'} />
          }
        />
      )}

      {/* Form Modal */}
      <ProductFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditProduct(null); }}
        editProduct={editProduct}
        onSaved={handleSaved}
      />
    </ScreenWrapper>
  );
};
