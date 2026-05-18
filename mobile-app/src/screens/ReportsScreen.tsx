import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, Filter, MapPin, CalendarDays, TrendingUp, CheckCircle,
  Package, AlertTriangle, ShieldCheck, HelpCircle, Users, Mail, Phone,
  ArrowUpRight, Sparkles, ChevronRight
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { salesApi, productsApi, dashboardApi } from '../api/endpoints';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ─── Constants & Types ────────────────────────────────────────────────────────

const CITIES = ['All', 'Karachi', 'Lahore', 'Islamabad', 'Peshawar'];
const DATE_PRESETS = ['All Time', 'Last 7 Days', 'Last 30 Days'];
const REPORT_TYPES = [
  { key: 'sales', label: 'Sales Report', icon: <TrendingUp size={14} /> },
  { key: 'inventory', label: 'Inventory Report', icon: <Package size={14} /> },
  { key: 'customers', label: 'Orders & Customers', icon: <Users size={14} /> },
];

interface SaleItem { product_id: number; quantity: number; unit_price: number; }
interface Sale {
  id: string; type: string; city: string; discount_applied: number;
  total_amount?: number; items: SaleItem[]; created_at?: string;
  customer_name?: string; customer_phone?: string; customer_email?: string;
  delivery_address?: string;
}

interface Product { id: string | number; name: string; sku: string; base_price: number; category?: string; inventory: any[]; }

// Helper for total inventory stock
const getProductStock = (p: Product) => {
  if (!p?.inventory) return 0;
  return p.inventory.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
};

export const ReportsScreen = () => {
  // ─── UI States ──────────────────────────────────────────────────────────────
  const [activeReport, setActiveReport] = useState<'sales' | 'inventory' | 'customers'>('sales');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedDatePreset, setSelectedDatePreset] = useState('All Time');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'PDF' | 'Excel'>('PDF');

  // ─── API Hooks ──────────────────────────────────────────────────────────────
  const { data: sales = [], isLoading: loadingSales } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: salesApi.getAll,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: crmData = [], isLoading: loadingCRM } = useQuery<any[]>({
    queryKey: ['crm-analytics'],
    queryFn: dashboardApi.getCRM,
  });

  // ─── Document Export Animation Loop ─────────────────────────────────────────
  const triggerExport = (type: 'PDF' | 'Excel') => {
    setExportType(type);
    setExportProgress(0);
    setExporting(true);
  };



  // ─── Filter Logic ───────────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // City Filter
      const matchCity = selectedCity === 'All' || sale.city === selectedCity;
      // Date preset
      if (!matchCity) return false;
      if (selectedDatePreset === 'All Time') return true;
      if (!sale.created_at) return true;

      const saleDateStr = sale.created_at.split('T')[0]; // "YYYY-MM-DD"
      const today = new Date();
      
      const getPastDateStr = (days: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - days);
        return d.toISOString().split('T')[0];
      };

      if (selectedDatePreset === 'Last 7 Days') {
        return saleDateStr >= getPastDateStr(7);
      }
      if (selectedDatePreset === 'Last 30 Days') {
        return saleDateStr >= getPastDateStr(30);
      }
      return true;
    });
  }, [sales, selectedCity, selectedDatePreset]);

  // ─── Summary Computations ──────────────────────────────────────────────────
  const salesSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalDiscount = 0;
    filteredSales.forEach(s => {
      const subtotal = s.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
      totalRevenue += subtotal;
      totalDiscount += s.discount_applied || 0;
    });
    const netRevenue = Math.max(0, totalRevenue - totalDiscount);
    const avgOrder = filteredSales.length > 0 ? netRevenue / filteredSales.length : 0;
    return { gross: totalRevenue, discount: totalDiscount, net: netRevenue, count: filteredSales.length, avg: avgOrder };
  }, [filteredSales]);

  const inventorySummary = useMemo(() => {
    let totalStock = 0;
    let lowStockCount = 0;
    products.forEach(p => {
      const stock = getProductStock(p);
      totalStock += stock;
      // Trigger threshold check (using default 10 if not present)
      if (stock < 10) {
        lowStockCount++;
      }
    });
    return { totalStock, lowStockCount, totalSkus: products.length };
  }, [products]);

  const customersList = useMemo(() => {
    const list = Array.isArray(crmData) ? crmData : [];
    if (selectedCity === 'All') return list;
    return list.filter((c: any) => c.city === selectedCity);
  }, [crmData, selectedCity]);

  const crmSummary = useMemo(() => {
    const list = Array.isArray(crmData) ? crmData : [];
    const totalSpend = list.reduce((sum: number, c: any) => sum + (c.total_spent || 0), 0);
    const highRiskCount = list.filter((c: any) => c.status === 'At Risk' || c.risk_score === 'High').length;
    return { totalSpend, highRiskCount };
  }, [crmData]);

  // ─── CSV Document Generator ────────────────────────────────────────────────
  const generateCSVContent = () => {
    let headers = '';
    const rows: string[] = [];

    if (activeReport === 'sales') {
      headers = 'Invoice ID,Order Type,City,Total Items,Discount Applied,Gross Total,Net Total,Created At\n';
      filteredSales.forEach(s => {
        const gross = s.items?.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0) || 0;
        const net = Math.max(0, gross - (s.discount_applied || 0));
        const totalItems = s.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        const safeId = (s.id || '').toString().replace(/,/g, '');
        
        rows.push(`${safeId},"${s.type}","${s.city}",${totalItems},${s.discount_applied || 0},${gross},${net},"${s.created_at || 'N/A'}"`);
      });
    } else if (activeReport === 'inventory') {
      headers = 'Product ID,Name,SKU,Category,Total Stock,Karachi,Lahore,Islamabad,Peshawar\n';
      products.forEach(p => {
        const totalStock = getProductStock(p);
        const getCityStock = (city: string) => {
          const inv = p.inventory?.find((i: any) => i.city === city);
          return inv ? inv.quantity : 0;
        };
        const safeId = (p.id || '').toString().replace(/,/g, '');
        const safeName = (p.name || '').replace(/"/g, '""').replace(/,/g, ' ');
        rows.push(`"${safeId}","${safeName}","${p.sku || ''}","${p.category || ''}",${totalStock},${getCityStock('Karachi')},${getCityStock('Lahore')},${getCityStock('Islamabad')},${getCityStock('Peshawar')}`);
      });
    } else if (activeReport === 'customers') {
      headers = 'Customer ID,Name,City,Phone,Email,Total Orders,Total Spent,Risk Score,Status,Last Order\n';
      customersList.forEach(c => {
        const safeId = (c.id || '').toString().replace(/,/g, '');
        const safeName = (c.name || '').replace(/"/g, '""').replace(/,/g, ' ');
        rows.push(`"${safeId}","${safeName}","${c.city || ''}","${c.phone || ''}","${c.email || ''}",${c.total_orders || 0},${c.total_spent || 0},"${c.risk_score || ''}","${c.status || ''}","${c.last_order || ''}"`);
      });
    }

    return headers + rows.join('\n');
  };

  // ─── HTML/Print Document Generator ─────────────────────────────────────────
  const generateHTMLContent = () => {
    let body = '';
    const dateStr = new Date().toLocaleString();

    if (activeReport === 'sales') {
      body = `
        <h1 style="color: #2563EB;">Sales Ledger Report</h1>
        <p><strong>Generated On:</strong> ${dateStr}</p>
        <p><strong>Total Gross Revenue:</strong> PKR ${salesSummary.gross.toLocaleString()}</p>
        <p><strong>Total Discounts:</strong> PKR ${salesSummary.discount.toLocaleString()}</p>
        <p><strong>Net Revenue:</strong> PKR ${salesSummary.net.toLocaleString()}</p>
        <p><strong>Total Invoices:</strong> ${salesSummary.count}</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <tr style="background-color: #F8FAFC;">
            <th>Invoice ID</th>
            <th>Type</th>
            <th>City</th>
            <th>Total Items</th>
            <th>Discount</th>
            <th>Net Amount</th>
          </tr>
          ${filteredSales.map(s => {
            const gross = s.items?.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0) || 0;
            const net = Math.max(0, gross - (s.discount_applied || 0));
            const totalItems = s.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
            return `
              <tr>
                <td>${s.id || 'N/A'}</td>
                <td>${s.type}</td>
                <td>${s.city}</td>
                <td align="center">${totalItems}</td>
                <td align="right">PKR ${s.discount_applied || 0}</td>
                <td align="right"><strong>PKR ${net.toLocaleString()}</strong></td>
              </tr>
            `;
          }).join('')}
        </table>
      `;
    } else if (activeReport === 'inventory') {
      body = `
        <h1 style="color: #2563EB;">Regional Inventory Stock Report</h1>
        <p><strong>Generated On:</strong> ${dateStr}</p>
        <p><strong>Total Items in Stock:</strong> ${inventorySummary.totalStock.toLocaleString()} units</p>
        <p><strong>Low Stock SKUs:</strong> ${inventorySummary.lowStockCount}</p>
        <p><strong>Unique SKU count:</strong> ${inventorySummary.totalSkus}</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <tr style="background-color: #F8FAFC;">
            <th>Product ID</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Total Stock</th>
            <th>Karachi</th>
            <th>Lahore</th>
            <th>Islamabad</th>
            <th>Peshawar</th>
          </tr>
          ${products.map(p => {
            const totalStock = getProductStock(p);
            const getCityStock = (city: string) => {
              const inv = p.inventory?.find((i: any) => i.city === city);
              return inv ? inv.quantity : 0;
            };
            return `
              <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.sku}</td>
                <td>${p.category || 'N/A'}</td>
                <td align="center"><strong>${totalStock}</strong></td>
                <td align="center">${getCityStock('Karachi')}</td>
                <td align="center">${getCityStock('Lahore')}</td>
                <td align="center">${getCityStock('Islamabad')}</td>
                <td align="center">${getCityStock('Peshawar')}</td>
              </tr>
            `;
          }).join('')}
        </table>
      `;
    } else if (activeReport === 'customers') {
      body = `
        <h1 style="color: #2563EB;">Registered Customer Database & CRM Report</h1>
        <p><strong>Generated On:</strong> ${dateStr}</p>
        <p><strong>Total Clients:</strong> ${customersList.length}</p>
        <p><strong>At-Risk / High Risk Clients:</strong> ${crmSummary.highRiskCount}</p>
        <p><strong>Net Spending:</strong> PKR ${crmSummary.totalSpend.toLocaleString()}</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <tr style="background-color: #F8FAFC;">
            <th>Customer ID</th>
            <th>Name</th>
            <th>City</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Orders</th>
            <th>Total spent</th>
            <th>Risk Rating</th>
          </tr>
          ${customersList.map(c => `
            <tr>
              <td>${c.id}</td>
              <td>${c.name}</td>
              <td>${c.city}</td>
              <td>${c.phone}</td>
              <td>${c.email}</td>
              <td align="center">${c.total_orders}</td>
              <td align="right">PKR ${c.total_spent.toLocaleString()}</td>
              <td align="center" style="color: ${c.risk_score === 'High' ? '#EF4444' : c.risk_score === 'Medium' ? '#F59E0B' : '#10B981'}; font-weight: bold;">
                ${c.risk_score}
              </td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    return `
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #1E293B; }
            th { text-align: left; background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1; text-transform: uppercase; font-size: 11px; color: #475569; }
            td, th { padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
          </style>
        </head>
        <body>
          <div style="border-bottom: 3px solid #2563EB; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 20px; font-weight: 800; color: #0F172A;">NexusForge AI Operations Center</span>
          </div>
          ${body}
        </body>
      </html>
    `;
  };

  useEffect(() => {
    if (!exporting) return;
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(async () => {
            setExporting(false);
            
            try {
              const isPDF = exportType === 'PDF';
              const fileExtension = isPDF ? 'html' : 'csv';
              const mimeType = isPDF ? 'text/html' : 'text/csv';
              const fileContent = isPDF ? generateHTMLContent() : generateCSVContent();
              const fileName = `${activeReport}_report_${Date.now()}.${fileExtension}`;
              const docDirectory = (FileSystem as any).documentDirectory;
              const fileUri = `${docDirectory}${fileName}`;
              
              await FileSystem.writeAsStringAsync(fileUri, fileContent, {
                encoding: FileSystem.EncodingType.UTF8
              });
              
              const sharingAvailable = await Sharing.isAvailableAsync();
              if (sharingAvailable) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: mimeType,
                  dialogTitle: `Export ${exportType} Report`,
                  UTI: isPDF ? 'public.html' : 'public.comma-separated-values-text'
                });
              } else {
                Alert.alert('Unsupported', 'Sharing is not supported on this device platform.');
              }
            } catch (err) {
              console.log('Error generating or sharing report:', err);
              Alert.alert('Export Failed', 'An error occurred while compiling and saving the document.');
            }
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [exporting, exportType, activeReport, filteredSales, products, customersList, salesSummary, inventorySummary, crmSummary]);

  // ─── Render Sub-components ─────────────────────────────────────────────────

  const renderSalesLedger = () => {
    if (loadingSales) return <ActivityIndicator color="#2563EB" style={{ marginVertical: 40 }} />;
    if (filteredSales.length === 0) {
      return (
        <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16 }}>
          <FileText size={48} color="#CBD5E1" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B', marginTop: 12 }}>No Sales Records Found</Text>
          <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Try broadening your filter settings</Text>
        </View>
      );
    }
    return (
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
        {/* Table Header */}
        <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <Text style={{ flex: 1.2, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Invoice ID</Text>
          <Text style={{ flex: 1.5, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Type & City</Text>
          <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>Items</Text>
          <Text style={{ flex: 1.5, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Net Total</Text>
        </View>
        {/* Rows */}
        {filteredSales.map((sale, idx) => {
          const subtotal = sale.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
          const finalAmount = Math.max(0, subtotal - (sale.discount_applied || 0));
          const totalItems = sale.items.reduce((sum, i) => sum + i.quantity, 0);

          return (
            <View key={sale.id || idx} style={{
              flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16,
              backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FFFDFD',
              borderBottomWidth: idx < filteredSales.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9',
              alignItems: 'center'
            }}>
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>#{sale.id}</Text>
                <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                  {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'Today'}
                </Text>
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>{sale.city}</Text>
                <Text style={{ fontSize: 10, color: '#2563EB', marginTop: 2, fontWeight: '700' }}>{sale.type}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 13, color: '#475569', textAlign: 'center', fontWeight: '500' }}>{totalItems}</Text>
              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>₨ {finalAmount.toLocaleString()}</Text>
                {sale.discount_applied > 0 && (
                  <Text style={{ fontSize: 9, color: '#EF4444', fontWeight: '700', marginTop: 1 }}>-₨ {sale.discount_applied}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderInventoryLedger = () => {
    if (loadingProducts) return <ActivityIndicator color="#2563EB" style={{ marginVertical: 40 }} />;
    return (
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
        {/* Table Header */}
        <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Product</Text>
          <Text style={{ flex: 1.2, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>SKU Code</Text>
          <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Stock Level</Text>
        </View>
        {/* Rows */}
        {products.map((p, idx) => {
          const stock = getProductStock(p);
          const isLow = stock < 10;

          return (
            <View key={p.id || idx} style={{
              flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16,
              backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FFFDFD',
              borderBottomWidth: idx < products.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9',
              alignItems: 'center'
            }}>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: isLow ? '#EA580C' : '#16A34A', fontWeight: '700', marginTop: 2 }}>
                  {isLow ? '⚠️ Low Stock Alert' : '✅ Healthy Stock'}
                </Text>
              </View>
              <Text style={{ flex: 1.2, fontSize: 12, color: '#475569', textAlign: 'center', fontVariant: ['tabular-nums'] }}>{p.sku}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: isLow ? '#EF4444' : '#0F172A' }}>{stock}</Text>
                <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>units</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderCustomersLedger = () => {
    if (loadingCRM) return <ActivityIndicator color="#2563EB" style={{ marginVertical: 40 }} />;
    return (
      <View>
        {/* Customer Spending Matrix */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
          {/* Table Header */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <Text style={{ flex: 1.8, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Customer Details</Text>
            <Text style={{ flex: 1.2, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>Orders</Text>
            <Text style={{ flex: 1.5, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Total Spent</Text>
          </View>
          {/* Rows */}
          {customersList.map((c: any, idx: number) => {
            const riskMappedColor = c.risk_score > 60 ? '#EF4444' : c.risk_score > 30 ? '#F59E0B' : '#10B981';
            const riskMappedText = c.risk_score > 60 ? 'High Risk' : c.risk_score > 30 ? 'Medium' : 'Loyal';

            return (
              <View key={c.id || idx} style={{
                flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16,
                backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FFFDFD',
                borderBottomWidth: idx < customersList.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9',
                alignItems: 'center'
              }}>
                <View style={{ flex: 1.8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{c.name}</Text>
                  <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{c.email || c.phone || 'No Contact'}</Text>
                </View>
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{c.order_count}</Text>
                  <View style={{ backgroundColor: `${riskMappedColor}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: riskMappedColor }}>{riskMappedText}</Text>
                  </View>
                </View>
                <Text style={{ flex: 1.5, fontSize: 14, fontWeight: '800', color: '#2563EB', textAlign: 'right' }}>₨ {c.total_spent.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>

        {/* Deliveries Ledger Card representing deliveries details */}
        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Package size={14} color="#0F172A" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginLeft: 6 }}>Dispatch Notification Log</Text>
          </View>
          {filteredSales.filter(s => s.type === 'Online Delivery').map((sale, idx) => (
            <View key={sale.id || idx} style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>Delivery #{sale.id.slice(-6).toUpperCase()}</Text>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>Mock SMS Sent</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#0F172A', fontWeight: '600' }}>To: {sale.customer_name || 'N/A'}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }} numberOfLines={1}>Address: {sale.delivery_address || 'N/A'}</Text>
              <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Dispatch Trigger: ₨ 200 fee included</Text>
            </View>
          ))}
          {filteredSales.filter(s => s.type === 'Online Delivery').length === 0 && (
            <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', paddingVertical: 10 }}>No online delivery orders in this filter range.</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper noPadding>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>Enterprise Reports</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Generate high-fidelity analytics ledgers</Text>
            </View>
            {/* Export Buttons */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={() => triggerExport('PDF')}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 }}
              >
                <Download size={13} color="#FFF" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF', marginLeft: 4 }}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => triggerExport('Excel')}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 }}
              >
                <Download size={13} color="#FFF" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF', marginLeft: 4 }}>Excel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Report Tab Selectors */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 }}>
          {REPORT_TYPES.map(tab => {
            const isSelected = activeReport === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveReport(tab.key as any)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                  gap: 6
                }}
              >
                {React.cloneElement(tab.icon, { color: isSelected ? '#2563EB' : '#64748B' })}
                <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#2563EB' : '#64748B' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filter Toolbar Collapsible Panel */}
        <View style={{ marginHorizontal: 20, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <Filter size={12} color="#64748B" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Filters</Text>
          </View>

          {/* Location Filters */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 6 }}>CITY / SEGMENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 12 }}>
            {CITIES.map(city => {
              const isSel = selectedCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  onPress={() => setSelectedCity(city)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 8, borderWidth: 1,
                    backgroundColor: isSel ? '#FFFFFF' : '#F1F5F9',
                    borderColor: isSel ? '#2563EB' : '#E2E8F0'
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isSel ? '#2563EB' : '#64748B' }}>{city}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date Range Filters */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 6 }}>DATE RANGE PRESET</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {DATE_PRESETS.map(preset => {
              const isSel = selectedDatePreset === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setSelectedDatePreset(preset)}
                  style={{
                    flex: 1, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center',
                    backgroundColor: isSel ? '#FFFFFF' : '#F1F5F9',
                    borderColor: isSel ? '#2563EB' : '#E2E8F0'
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isSel ? '#2563EB' : '#64748B' }}>{preset}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dynamic KPI Cards Panel */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          {activeReport === 'sales' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#EFF6FF', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563EB99' }}>NET REVENUE</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>₨ {salesSummary.net.toLocaleString()}</Text>
              </View>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#F0FDF4', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A99' }}>AVG INVOICE</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>₨ {Math.round(salesSummary.avg).toLocaleString()}</Text>
              </View>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#FDF4FF', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#9333EA99' }}>TOTAL ORDERS</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>{salesSummary.count}</Text>
              </View>
            </View>
          )}

          {activeReport === 'inventory' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#EFF6FF', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563EB99' }}>TOTAL STOCK</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>{inventorySummary.totalStock.toLocaleString()} u</Text>
              </View>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#FFF7ED', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#EA580C99' }}>LOW STOCK SKUS</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444', marginTop: 4 }}>{inventorySummary.lowStockCount}</Text>
              </View>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#F0FDF4', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A99' }}>SKU COUNT</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>{inventorySummary.totalSkus}</Text>
              </View>
            </View>
          )}

          {activeReport === 'customers' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#EFF6FF', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563EB99' }}>REGISTERED</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>{customersList.length} clients</Text>
              </View>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#FFF5F5', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#E53E3E99' }}>RISK COUNT</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#E53E3E', marginTop: 4 }}>{crmSummary.highRiskCount} critical</Text>
              </View>
              <View style={{ flex: 1, padding: 14, backgroundColor: '#FDF4FF', borderRadius: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#9333EA99' }}>NET SPENDING</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>₨ {(crmSummary.totalSpend / 1000).toFixed(0)}k</Text>
              </View>
            </View>
          )}
        </View>

        {/* Selected Report Ledger Grid Table */}
        <View style={{ paddingHorizontal: 20 }}>
          {activeReport === 'sales' && renderSalesLedger()}
          {activeReport === 'inventory' && renderInventoryLedger()}
          {activeReport === 'customers' && renderCustomersLedger()}
        </View>
      </ScrollView>

      {/* Document Generator Premium Progress Overlay Modal */}
      <Modal visible={exporting} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center',
            shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 12
          }}>
            <ActivityIndicator size="large" color={exportType === 'PDF' ? '#EF4444' : '#16A34A'} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 16 }}>Generating {exportType}...</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' }}>
              Formatting tables, compiling dynamic KPI metrics, and building print templates.
            </Text>

            {/* Premium Animated Progress Bar */}
            <View style={{ width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 20, overflow: 'hidden' }}>
              <View style={{
                width: `${exportProgress}%`, height: 6,
                backgroundColor: exportType === 'PDF' ? '#EF4444' : '#16A34A',
                borderRadius: 3
              }} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8 }}>{exportProgress}%</Text>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};
