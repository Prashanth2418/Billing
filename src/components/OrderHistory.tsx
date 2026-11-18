import React, { useState, useMemo } from 'react';
import { RestaurantOrder, RestaurantSettings } from '../types/restaurant';
import { formatPrice } from '../utils/restaurantStorage';
import { DailySalesSummary } from './DailySalesSummary';
import {
  Search,
  Printer,
  Calendar,
  DollarSign,
  Download,
  CreditCard,
  QrCode,
  FileText,
  LayoutDashboard,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface OrderHistoryProps {
  orders: RestaurantOrder[];
  settings: RestaurantSettings;
  onPrintOrder: (order: RestaurantOrder) => void;
  onAddSampleTodayOrders?: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  settings,
  onPrintOrder,
  onAddSampleTodayOrders,
}) => {
  // Sales Tab sub-views: 'daily' (Daily Sales Summary) | 'ledger' (All Bills History)
  const [activeSubView, setActiveSubView] = useState<'daily' | 'ledger'>('daily');

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | 'Cash' | 'UPI / QR' | 'Card'>('All');

  // Today's ISO Date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's metrics for quick badges
  const todaySettledCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'Settled' && (o.date === todayStr || o.createdAt.startsWith(todayStr))
    ).length;
  }, [orders, todayStr]);

  // Filtered orders for the ledger view
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (o.status !== 'Settled') return false;
        if (methodFilter !== 'All' && o.paymentMethod !== methodFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          o.billNumber.toLowerCase().includes(q) ||
          o.tableNumber.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          o.items.some((i) => i.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [orders, methodFilter, search]);

  const handleExportCSV = () => {
    const headers = [
      'Bill #',
      'Date',
      'Time',
      'Table/Type',
      'Guest',
      'Items Count',
      'Subtotal',
      'Tax',
      'Total',
      'Payment Mode',
    ];
    const rows = filteredOrders.map((o) => [
      o.billNumber,
      o.date,
      o.time,
      o.tableNumber,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      o.items.length,
      o.subtotal,
      o.taxAmount,
      o.total,
      o.paymentMethod,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Seafood_Restaurant_All_Bills_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 no-print">
      {/* Sub-View Switcher Bar: Daily Sales Summary vs All Bills Ledger */}
      <div className="bg-white border border-slate-200 p-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubView('daily')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              activeSubView === 'daily'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Daily Sales Summary</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubView === 'daily'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-300 text-slate-800'
              }`}
            >
              Today
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('ledger')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              activeSubView === 'ledger'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
            <span>All Bills & Transactions</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubView === 'ledger'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-300 text-slate-800'
              }`}
            >
              {orders.filter((o) => o.status === 'Settled').length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 px-2 flex items-center gap-2 font-mono">
          <span>Date: {todayStr}</span>
          <span>•</span>
          <span>{todaySettledCount} settled today</span>
        </div>
      </div>

      {/* Render Selected View */}
      {activeSubView === 'daily' ? (
        <DailySalesSummary
          orders={orders}
          settings={settings}
          onPrintOrder={onPrintOrder}
          onAddSampleTodayOrders={onAddSampleTodayOrders}
        />
      ) : (
        /* View 2: All Bills & Ledger */
        <div className="space-y-4">
          {/* Search & Export Toolbar */}
          <div className="bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Bill #, Table, Guest name, or dish..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Ledger CSV</span>
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100 text-xs">
              <span className="text-slate-500 mr-2 text-[11px]">Payment Mode:</span>
              {(['All', 'UPI / QR', 'Cash', 'Card'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-3 py-1 font-medium transition-colors ${
                    methodFilter === m
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="py-2.5 px-3">Bill No.</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Table / Type</th>
                    <th className="py-2.5 px-3">Guest Details</th>
                    <th className="py-2.5 px-3">Dishes Ordered</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p>No settled orders found matching the filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-950">
                          {ord.billNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                          <div>{ord.date}</div>
                          <div className="text-[10px] text-slate-400">{ord.time}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {ord.tableNumber}
                          <span className="text-[10px] text-slate-400 font-normal block">
                            {ord.orderType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {ord.customerName ? (
                            <>
                              <div className="font-medium text-slate-900">{ord.customerName}</div>
                              {ord.customerPhone && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {ord.customerPhone}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Walk-in</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                          <span className="font-semibold text-slate-900">
                            {ord.items.length} items:{' '}
                          </span>
                          {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-block text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-200">
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 text-sm tabular-nums whitespace-nowrap">
                          {formatPrice(ord.total, settings.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onPrintOrder(ord)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1 mx-auto"
                            title="Reprint Bill Receipt"
                          >
                            <Printer className="w-3 h-3 text-slate-600" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
