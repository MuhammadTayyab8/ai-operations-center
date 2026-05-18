import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, FlatList,
  RefreshControl, Alert, Modal, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Pencil, Trash2, X, MapPin, Store, Calendar, FileText, Package, ShoppingCart
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { productsApi, salesApi, campaignsApi } from '../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleItem { product_id: number; quantity: number; unit_price: number; discount?: number; product?: any; }
interface Sale { id: number; type: string; city: string; discount_applied: number; total_amount?: number; items: SaleItem[]; created_at?: string; }
interface Product { id: number; name: string; sku: string; base_price: number; inventory: any[]; }

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'];
const ORDER_TYPES = ['Walk-in', 'Online Delivery'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTotalStock = (p: Product) => {
  if (!p?.inventory) return 0;
  return p.inventory.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
};

// ─── Components ───────────────────────────────────────────────────────────────

const NoData = ({ message }: { message: string }) => (
  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
      <FileText size={32} color="#CBD5E1" />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '700', color: '#94A3B8' }}>No Invoices Found</Text>
    <Text style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{message}</Text>
  </View>
);

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

// ─── Product Selection Modal ──────────────────────────────────────────────────

const ProductSelectionModal = ({ visible, onClose, onSelect, products }: { visible: boolean, onClose: () => void, onSelect: (p: Product) => void, products: Product[] }) => {
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ height: '80%', backgroundColor: '#F8FAFC', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Select Product</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Search size={15} color="#94A3B8" />
              <TextInput
                style={{ flex: 1, paddingVertical: 11, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
                placeholder="Search products..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={p => p.id.toString()}
            contentContainerStyle={{ padding: 16, paddingTop: 0 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>SKU: {item.sku} · Stock: {getTotalStock(item)}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#2563EB' }}>₨ {item.base_price}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#94A3B8' }}>No products found.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
};

// ─── Sales Form Modal ─────────────────────────────────────────────────────────

const SalesFormModal = ({
  visible, onClose, editSale, onSaved, products
}: {
  visible: boolean; onClose: () => void; editSale: Sale | null; onSaved: () => void; products: Product[];
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderType, setOrderType] = useState(ORDER_TYPES[0]);
  const [city, setCity] = useState(CITIES[0]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  
  // Custom delivery order states
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);

  const isEdit = !!editSale;

  // Dynamic campaign discount querying
  const { data: campaignsData = [] } = useQuery<any[]>({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.getAll,
    enabled: visible,
  });

  // Dynamic delivery fee querying
  const { data: deliveryFeeData } = useQuery<any>({
    queryKey: ['delivery-fee'],
    queryFn: salesApi.getDeliveryFee,
    enabled: visible,
  });

  const dbDeliveryFee = deliveryFeeData?.delivery_fee ?? 200;

  const activeCampaign = useMemo(() => {
    return campaignsData.find(c => c.is_active && (c.region === city || c.region === 'All Regions'));
  }, [campaignsData, city]);

  const campaignDiscountPercent = activeCampaign ? activeCampaign.discount_percent : 0;

  useEffect(() => {
    if (editSale) {
      setDate(editSale.created_at ? editSale.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
      setOrderType(editSale.type);
      setCity(editSale.city);
      setItems(editSale.items.map(i => ({
        ...i,
        discount: 0,
        product: products.find(p => p.id === i.product_id)
      })));
      setCustomerName((editSale as any).customer_name || '');
      setDeliveryAddress((editSale as any).delivery_address || '');
      setCustomerEmail((editSale as any).customer_email || '');
      setCustomerPhone((editSale as any).customer_phone || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setOrderType(ORDER_TYPES[0]);
      setCity(CITIES[0]);
      setItems([]);
      setCustomerName('');
      setDeliveryAddress('');
      setCustomerEmail('');
      setCustomerPhone('');
    }
  }, [editSale, visible, products]);

  const handleSave = async () => {
    if (items.length === 0) {
      Alert.alert('Validation', 'Please add at least one product.');
      return;
    }
    if (orderType === 'Online Delivery' && (!customerName.trim() || !deliveryAddress.trim())) {
      Alert.alert('Validation', 'Please fill in Customer Name and Delivery Address.');
      return;
    }
    setSaving(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
      const itemsDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
      const campaignDiscount = subtotal * (campaignDiscountPercent / 100);
      
      const payload = {
        type: orderType,
        city: city,
        discount_applied: itemsDiscount + campaignDiscount,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        customer_name: orderType === 'Online Delivery' ? customerName.trim() : null,
        delivery_address: orderType === 'Online Delivery' ? deliveryAddress.trim() : null,
        customer_phone: orderType === 'Online Delivery' ? customerPhone.trim() : null,
        customer_email: orderType === 'Online Delivery' ? customerEmail.trim() : null,
      };
      
      if (isEdit && editSale) {
        await salesApi.update(editSale.id, payload);
      } else {
        await salesApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to save sale');
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, field: keyof SaleItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 28, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{isEdit ? 'Edit Sale' : 'Add Sale'}</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Sale Details</Text>
            
            {/* Custom Visual Date Picker Trigger */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Date *</Text>
              <TouchableOpacity
                onPress={() => setCalendarVisible(true)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, color: '#0F172A', fontWeight: '500' }}>{date}</Text>
                <Calendar size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Order Type</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {ORDER_TYPES.map(type => (
                  <TouchableOpacity
                    key={type} onPress={() => setOrderType(type)}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, backgroundColor: orderType === type ? '#EFF6FF' : '#FFF', borderColor: orderType === type ? '#3B82F6' : '#E2E8F0' }}
                  >
                    <Text style={{ fontWeight: orderType === type ? '700' : '500', color: orderType === type ? '#2563EB' : '#64748B', fontSize: 13 }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 6 }}>
                {CITIES.map(c => (
                  <TouchableOpacity
                    key={c} onPress={() => setCity(c)}
                    style={{ paddingVertical: 10, paddingHorizontal: 16, marginRight: 10, borderRadius: 20, borderWidth: 1, backgroundColor: city === c ? '#F0FDF4' : '#FFF', borderColor: city === c ? '#22C55E' : '#E2E8F0' }}
                  >
                    <Text style={{ fontWeight: city === c ? '700' : '500', color: city === c ? '#16A34A' : '#64748B', fontSize: 13 }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Campaign Discount Activation Badge */}
              {activeCampaign && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#BFDBFE' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>
                    🔥 {activeCampaign.name}: {activeCampaign.discount_percent}% Off applied for {city}!
                  </Text>
                </View>
              )}
            </View>

            {/* Dynamic Customer Delivery Details Card */}
            {orderType === 'Online Delivery' && (
              <View style={{ marginBottom: 20, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Customer & Delivery Info</Text>
                <InputField label="Customer Name *" value={customerName} onChangeText={setCustomerName} placeholder="e.g. Muhammad Tayyab" />
                <InputField label="Delivery Address *" value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="e.g. House 45, Street 2, Clifton, Karachi" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <InputField label="Email Address" value={customerEmail} onChangeText={setCustomerEmail} placeholder="tayyab@example.com" keyboardType="email-address" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField label="Phone Number" value={customerPhone} onChangeText={setCustomerPhone} placeholder="0333-1234567" keyboardType="phone-pad" />
                  </View>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.8 }}>Products</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                <Plus size={14} color="#2563EB" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', marginLeft: 4 }}>Select Product</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => (
              <View key={idx} style={{ marginBottom: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>{item.product?.name || 'Unknown Product'}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>Stock Qty: {item.product ? getTotalStock(item.product) : '-'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(idx)} style={{ padding: 4 }}>
                    <X size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>Quantity</Text>
                    <TextInput
                      value={String(item.quantity)}
                      onChangeText={v => updateItem(idx, 'quantity', parseInt(v) || 0)}
                      keyboardType="numeric"
                      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0F172A' }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>Discount (₨)</Text>
                    <TextInput
                      value={String(item.discount || 0)}
                      onChangeText={v => updateItem(idx, 'discount', parseFloat(v) || 0)}
                      keyboardType="numeric"
                      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0F172A' }}
                    />
                  </View>
                </View>
              </View>
            ))}

            {items.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
                <Package size={24} color="#CBD5E1" />
                <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>No products added yet</Text>
              </View>
            )}

            {items.length > 0 && (() => {
              const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
              const itemsDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
              const campaignDiscount = subtotal * (campaignDiscountPercent / 100);
              const deliveryFee = orderType === 'Online Delivery' ? dbDeliveryFee : 0;
              const totalAmount = Math.max(0, subtotal - itemsDiscount - campaignDiscount + deliveryFee);

              return (
                <View style={{ marginTop: 12, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOpacity: 0.02, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>Summary</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Total Items</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Subtotal</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>₨ {subtotal.toLocaleString()}</Text>
                  </View>
                  {itemsDiscount > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>Items Discount</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>-₨ {itemsDiscount.toLocaleString()}</Text>
                    </View>
                  )}
                  {campaignDiscount > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>Campaign Discount ({campaignDiscountPercent}%)</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#16A34A' }}>-₨ {campaignDiscount.toLocaleString()}</Text>
                    </View>
                  )}
                  {orderType === 'Online Delivery' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>Delivery Fee</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#B45309' }}>₨ {deliveryFee}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Total Amount</Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#2563EB' }}>₨ {totalAmount.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })()}

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, marginBottom: 24, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>Save Transaction</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      
      <ProductSelectionModal 
        visible={productModalVisible}
        onClose={() => setProductModalVisible(false)}
        products={products}
        onSelect={(p) => {
          if (!items.find(i => i.product_id === p.id)) {
            setItems([...items, { product_id: p.id, quantity: 1, unit_price: p.base_price, discount: 0, product: p }]);
          }
          setProductModalVisible(false);
        }}
      />
      
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        value={date}
        onSelect={setDate}
      />
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const SaleCard = ({ sale, onEdit, onDelete }: { sale: Sale; onEdit: (s: Sale) => void; onDelete: (s: Sale) => void }) => {
  const totalAmount = sale.total_amount ?? sale.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const finalAmount = totalAmount - (sale.discount_applied || 0);
  const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={{ 
      marginBottom: 14, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16,
      borderWidth: 1, borderColor: '#F1F5F9',
      shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 }}>#{sale.id}</Text>
            </View>
            <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563EB', letterSpacing: 0.5 }}>{sale.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>{sale.city}</Text>
          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>{totalItems} items · {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'Today'}</Text>
        </View>
        
        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>₨ {finalAmount.toLocaleString()}</Text>
          {sale.discount_applied > 0 && (
            <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: '700', backgroundColor: '#FEF2F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              -₨ {sale.discount_applied}
            </Text>
          )}
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
        <TouchableOpacity onPress={() => onEdit(sale)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
          <Pencil size={14} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(sale)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={14} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SalesScreen = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editSale, setEditSale] = useState<Sale | null>(null);

  const { data: salesData = [], isLoading: isLoadingSales, isRefetching, refetch } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: salesApi.getAll,
  });

  const { data: productsData = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const filtered = useMemo(() => {
    return salesData.filter(s => {
      const matchCity = s.city.toLowerCase().includes(search.toLowerCase());
      const matchId = String(s.id).includes(search);
      const matchType = s.type.toLowerCase().includes(search.toLowerCase());
      return matchCity || matchId || matchType;
    });
  }, [salesData, search]);

  const handleEdit = (sale: Sale) => {
    setEditSale(sale);
    setModalVisible(true);
  };

  const handleDelete = (sale: Sale) => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice #${sale.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await salesApi.delete(sale.id);
              queryClient.invalidateQueries({ queryKey: ['sales'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            } catch {
              Alert.alert('Error', 'Failed to delete invoice.');
            }
          }
        }
      ]
    );
  };

  const handleAddNew = () => {
    setEditSale(null);
    setModalVisible(true);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    queryClient.invalidateQueries({ queryKey: ['high-demand'] });
  };

  return (
    <ScreenWrapper noPadding>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>Sales</Text>
            <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{salesData.length} invoices · Live transactions</Text>
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

      <View style={{ marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <Search size={15} color="#94A3B8" />
        <TextInput
          style={{ flex: 1, paddingVertical: 11, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          placeholder="Search invoices by ID, city or type..."
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

      {isLoadingSales ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#2563EB" size="large" />
          <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 10 }}>Loading invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <SaleCard sale={item} onEdit={handleEdit} onDelete={handleDelete} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          ListEmptyComponent={
            <NoData message={search ? 'Try adjusting your search' : 'No sales invoices recorded yet'} />
          }
        />
      )}

      <SalesFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditSale(null); }}
        editSale={editSale}
        onSaved={handleSaved}
        products={productsData}
      />
    </ScreenWrapper>
  );
};

// ─── Custom Premium Calendar Modal ───────────────────────────────────────────

const CalendarModal = ({
  visible, onClose, value, onSelect
}: {
  visible: boolean; onClose: () => void; value: string; onSelect: (d: string) => void;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(value || new Date()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Days in selected month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Index of the 1st day (0 = Sun, 1 = Mon, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Shift Sunday (0) to index 6, Monday (1) to index 0
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const days = [];
  // Fill offset slots
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  // Fill actual day numbers
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, width: '100%', maxWidth: 340,
          shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10
        }}>
          {/* Calendar Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={handlePrevMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#475569' }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#475569' }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
              <View key={day} style={{ width: 36, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8' }}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Day Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 8, columnGap: 6 }}>
            {days.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={{ width: 36, height: 36 }} />;
              }

              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateString;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  onPress={() => {
                    onSelect(dateString);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '600', color: isSelected ? '#FFFFFF' : '#334155' }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel Action */}
          <TouchableOpacity onPress={onClose} style={{ marginTop: 20, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

