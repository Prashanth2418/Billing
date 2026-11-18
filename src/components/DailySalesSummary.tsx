import React, { useState, useMemo } from 'react';
import { RestaurantOrder, RestaurantSettings, PaymentMethod } from '../types/restaurant';
import { formatPrice } from '../utils/restaurantStorage';
import {
  Calendar,
  DollarSign,
  Receipt,
  QrCode,
  CreditCard,
  Banknote,
  Globe,
  Printer,
  Download,
  UtensilsCrossed,
  ShoppingBag,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from 'lucide-react';

interface DailySalesSummaryProps {
  orders: RestaurantOrder[];
  settings: RestaurantSettings;
  onPrintOrder: (order: RestaurantOrder) => void;
  onAddSampleTodayOrders?: () => void;
}

export const DailySalesSummary: React.FC<DailySalesSummaryProps> = ({
  orders,
  settings,
  onPrintOrder,
  onAddSampleTodayOrders,
}) => {
  // Current ISO date (YYYY-MM-DD)
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  const isCurrentDate = selectedDate === todayISO;

  // Format date nicely for display
  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Navigate dates
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d - 1);
    setSelectedDate(dateObj.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + 1);
    setSelectedDate(dateObj.toISOString().split('T')[0]);
  };

  const handleResetToToday = () => {
    setSelectedDate(todayISO);
  };

  // Filter settled orders for selected date
  const dayOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (o.status !== 'Settled') return false;
        // Match either o.date or o.createdAt prefix
        return o.date === selectedDate || (o.createdAt && o.createdAt.startsWith(selectedDate));
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [orders, selectedDate]);

  // Calculations for the current / selected date
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let subtotalAmount = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let parcelChargeAmount = 0;
    let totalItemsCount = 0;

    let dineInRevenue = 0;
    let dineInOrdersCount = 0;
    let takeawayRevenue = 0;
    let takeawayOrdersCount = 0;

    // Payment methods map
    const paymentBreakdown: Record<
      PaymentMethod,
      { amount: number; count: number; orderIds: string[] }
    > = {
      'Cash': { amount: 0, count: 0, orderIds: [] },
      'UPI / QR': { amount: 0, count: 0, orderIds: [] },
      'Card': { amount: 0, count: 0, orderIds: [] },
      'Online': { amount: 0, count: 0, orderIds: [] },
    };

    dayOrders.forEach((o) => {
      totalRevenue += o.total;
      subtotalAmount += o.subtotal || 0;
      taxAmount += o.taxAmount || 0;
      discountAmount += o.discountAmount || 0;
      parcelChargeAmount += o.parcelCharge || 0;

      const itemsQty = o.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      totalItemsCount += itemsQty;

      if (o.orderType === 'Dine-In') {
        dineInRevenue += o.total;
        dineInOrdersCount += 1;
      } else {
        takeawayRevenue += o.total;
        takeawayOrdersCount += 1;
      }

      const method = o.paymentMethod || 'Cash';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { amount: 0, count: 0, orderIds: [] };
      }
      paymentBreakdown[method].amount += o.total;
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].orderIds.push(o.billNumber);
    });

    const totalOrdersCount = dayOrders.length;
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return {
      totalRevenue,
      subtotalAmount,
      taxAmount,
      discountAmount,
      parcelChargeAmount,
      totalOrdersCount,
      totalItemsCount,
      avgOrderValue,
      dineInRevenue,
      dineInOrdersCount,
      takeawayRevenue,
      takeawayOrdersCount,
      paymentBreakdown,
    };
  }, [dayOrders]);

  // CSV Export for the day's summary
  const handleExportDailyCSV = () => {
    const summaryRows = [
      ['SEAFOOD RESTAURANT DAILY SALES SUMMARY'],
      ['Restaurant', `"${settings.restaurantName}"`],
      ['Date', selectedDate],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['KEY PERFORMANCE METRICS'],
      ['Total Revenue', metrics.totalRevenue],
      ['Total Orders Processed', metrics.totalOrdersCount],
      ['Average Order Value', metrics.avgOrderValue.toFixed(2)],
      ['Gross Subtotal', metrics.subtotalAmount],
      ['Tax Collected', metrics.taxAmount],
      ['Discounts Given', metrics.discountAmount],
      ['Parcel Charges', metrics.parcelChargeAmount],
      ['Total Dish Portions Sold', metrics.totalItemsCount],
      [''],
      ['PAYMENT METHOD BREAKDOWN'],
      ['Payment Method', 'Amount Collected', 'Orders Count', 'Share (%)'],
      ...(['UPI / QR', 'Cash', 'Card', 'Online'] as PaymentMethod[]).map((m) => {
        const item = metrics.paymentBreakdown[m];
        const share = metrics.totalRevenue > 0 ? ((item.amount / metrics.totalRevenue) * 100).toFixed(1) : '0';
        return [m, item.amount, item.count, `${share}%`];
      }),
      [''],
      ['ORDER TYPE BREAKDOWN'],
      ['Dine-In Orders', metrics.dineInOrdersCount, metrics.dineInRevenue],
      ['Takeaway Orders', metrics.takeawayOrdersCount, metrics.takeawayRevenue],
      [''],
      ['SETTLED BILLS LIST'],
      ['Bill #', 'Time', 'Table / Type', 'Guest', 'Payment Mode', 'Total Amount'],
      ...dayOrders.map((o) => [
        o.billNumber,
        o.time,
        `${o.tableNumber} (${o.orderType})`,
        `"${(o.customerName || 'Walk-in').replace(/"/g, '""')}"`,
        o.paymentMethod,
        o.total,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      summaryRows.map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Daily_Sales_Summary_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper payment icon and colors
  const getPaymentDetails = (method: PaymentMethod) => {
    switch (method) {
      case 'UPI / QR':
        return {
          icon: <QrCode className="w-5 h-5 text-cyan-600" />,
          accentBg: 'bg-cyan-50 border-cyan-200',
          textColor: 'text-cyan-900',
          badgeColor: 'bg-cyan-100 text-cyan-800',
          barColor: 'bg-cyan-600',
          description: 'Instant UPI QR & Scan payments',
        };
      case 'Cash':
        return {
          icon: <Banknote className="w-5 h-5 text-emerald-600" />,
          accentBg: 'bg-emerald-50 border-emerald-200',
          textColor: 'text-emerald-900',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          barColor: 'bg-emerald-600',
          description: 'Physical currency in register drawer',
        };
      case 'Card':
        return {
          icon: <CreditCard className="w-5 h-5 text-purple-600" />,
          accentBg: 'bg-purple-50 border-purple-200',
          textColor: 'text-purple-900',
          badgeColor: 'bg-purple-100 text-purple-800',
          barColor: 'bg-purple-600',
          description: 'EDC Card swipe & contactless machine',
        };
      case 'Online':
      default:
        return {
          icon: <Globe className="w-5 h-5 text-indigo-600" />,
          accentBg: 'bg-indigo-50 border-indigo-200',
          textColor: 'text-indigo-900',
          badgeColor: 'bg-indigo-100 text-indigo-800',
          barColor: 'bg-indigo-600',
          description: 'Online web orders & aggregators',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation & Actions Header */}
      <div className="bg-white border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title and Date Badge */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950 uppercase tracking-tight">
                Daily Sales Summary
              </h2>
              {isCurrentDate ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Today (Current Date)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  Historical Date
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {formattedDisplayDate} • Register Settlement & Daily Revenue Performance
            </p>
          </div>

          {/* Date Picker Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Date Switcher */}
            <div className="flex items-center border border-slate-300 bg-slate-50 text-xs">
              <button
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent text-xs font-mono font-semibold px-2 py-1 text-slate-900 focus:outline-hidden"
              />

              <button
                onClick={handleNextDay}
                className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isCurrentDate && (
              <button
                onClick={handleResetToToday}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
              >
                Jump to Today
              </button>
            )}

            {/* Print Summary Button */}
            <button
              onClick={() => setIsPrintSummaryOpen(true)}
              disabled={metrics.totalOrdersCount === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Daily Summary</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportDailyCSV}
              disabled={metrics.totalOrdersCount === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics: Total Revenue, Total Orders, Average Order Value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 bg-slate-900 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-slate-950 tabular-nums">
            {formatPrice(metrics.totalRevenue, settings.currencySymbol)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Net Food Sales:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatPrice(metrics.subtotalAmount, settings.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Total Orders Processed */}
        <div className="bg-white border border-slate-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Orders Processed
            </span>
            <div className="w-8 h-8 bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-slate-950 tabular-nums">
            {metrics.totalOrdersCount}
            <span className="text-xs font-sans font-normal text-slate-500 ml-1.5">
              {metrics.totalOrdersCount === 1 ? 'order' : 'orders'} settled
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Dine-In / Takeaway:</span>
            <span className="font-semibold text-slate-800">
              {metrics.dineInOrdersCount} Dine-In · {metrics.takeawayOrdersCount} Takeaway
            </span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white border border-slate-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Average Order Value
            </span>
            <div className="w-8 h-8 bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-slate-950 tabular-nums">
            {formatPrice(metrics.avgOrderValue, settings.currencySymbol)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Dishes Served:</span>
            <span className="font-semibold text-slate-800">
              {metrics.totalItemsCount} item portions
            </span>
          </div>
        </div>

        {/* Taxes & Charges Collected */}
        <div className="bg-white border border-slate-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxes & Charges
            </span>
            <div className="w-8 h-8 bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-slate-950 tabular-nums">
            {formatPrice(metrics.taxAmount + metrics.parcelChargeAmount, settings.currencySymbol)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>GST / Tax ({settings.taxRatePercent}%):</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatPrice(metrics.taxAmount, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* CORE REQUEST: Breakdown by Payment Method for the Current Date */}
      <div className="bg-white border border-slate-200 shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight flex items-center gap-2">
              <span>Breakdown by Payment Method</span>
              <span className="text-xs font-normal text-slate-500 normal-case font-mono">
                ({isCurrentDate ? 'Current Date: ' : 'Date: '} {selectedDate})
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Comprehensive distribution of collections across Cash, UPI / QR, Card, and digital modes
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-200 self-start sm:self-auto">
            Total Settled: {formatPrice(metrics.totalRevenue, settings.currencySymbol)}
          </div>
        </div>

        {/* Visual Proportional Distribution Bar */}
        {metrics.totalRevenue > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Revenue Share Distribution
              </span>
              <span className="font-mono text-slate-500">100% of Daily Revenue</span>
            </div>

            {/* Multi-segment Bar */}
            <div className="h-4 w-full bg-slate-200 flex overflow-hidden">
              {(['UPI / QR', 'Cash', 'Card', 'Online'] as PaymentMethod[]).map((m) => {
                const item = metrics.paymentBreakdown[m];
                const pct = metrics.totalRevenue > 0 ? (item.amount / metrics.totalRevenue) * 100 : 0;
                if (pct <= 0) return null;
                const details = getPaymentDetails(m);
                return (
                  <div
                    key={m}
                    style={{ width: `${pct}%` }}
                    className={`${details.barColor} transition-all hover:opacity-90 relative group`}
                    title={`${m}: ${formatPrice(item.amount, settings.currencySymbol)} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Distribution Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
              {(['UPI / QR', 'Cash', 'Card', 'Online'] as PaymentMethod[]).map((m) => {
                const item = metrics.paymentBreakdown[m];
                const pct = metrics.totalRevenue > 0 ? (item.amount / metrics.totalRevenue) * 100 : 0;
                const details = getPaymentDetails(m);
                return (
                  <div key={m} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 ${details.barColor}`} />
                    <span className="font-medium text-slate-700">{m}:</span>
                    <span className="font-mono font-bold text-slate-900">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Methods Cards Grid */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['UPI / QR', 'Cash', 'Card'] as PaymentMethod[]).map((method) => {
            const data = metrics.paymentBreakdown[method];
            const details = getPaymentDetails(method);
            const sharePercent =
              metrics.totalRevenue > 0 ? (data.amount / metrics.totalRevenue) * 100 : 0;
            const avgPerOrder = data.count > 0 ? data.amount / data.count : 0;

            return (
              <div
                key={method}
                className={`p-4 border ${details.accentBg} flex flex-col justify-between space-y-3 transition-colors`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {details.icon}
                      <span className="font-bold text-sm text-slate-950">{method}</span>
                    </div>
                    <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 ${details.badgeColor}`}>
                      {sharePercent.toFixed(1)}% Share
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{details.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-2xl font-bold font-mono text-slate-950 tabular-nums">
                    {formatPrice(data.amount, settings.currencySymbol)}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Processed Orders:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {data.count} {data.count === 1 ? 'bill' : 'bills'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-slate-600">
                    <span>Avg. Ticket:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatPrice(avgPerOrder, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Breakdown Summary Table */}
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2.5 px-4">Payment Method</th>
                <th className="py-2.5 px-4 text-center">Orders Count</th>
                <th className="py-2.5 px-4 text-right">Avg. Ticket Size</th>
                <th className="py-2.5 px-4 text-right">Share of Revenue</th>
                <th className="py-2.5 px-4 text-right">Total Amount Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(['UPI / QR', 'Cash', 'Card', 'Online'] as PaymentMethod[]).map((m) => {
                const item = metrics.paymentBreakdown[m];
                const share =
                  metrics.totalRevenue > 0 ? (item.amount / metrics.totalRevenue) * 100 : 0;
                const avgTicket = item.count > 0 ? item.amount / item.count : 0;

                return (
                  <tr key={m} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      {getPaymentDetails(m).icon}
                      <span>{m}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-800">
                      {item.count}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatPrice(avgTicket, settings.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                      {share.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-950 text-sm tabular-nums">
                      {formatPrice(item.amount, settings.currencySymbol)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="py-2.5 px-4 text-slate-900 uppercase">Total Consolidated</td>
                <td className="py-2.5 px-4 text-center font-mono text-slate-950">
                  {metrics.totalOrdersCount}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-950">
                  {formatPrice(metrics.avgOrderValue, settings.currencySymbol)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-950">100.0%</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-950 text-base tabular-nums">
                  {formatPrice(metrics.totalRevenue, settings.currencySymbol)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Dine-In vs Takeaway Order Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
                Dine-In Orders
              </h4>
            </div>
            <span className="font-mono text-xs font-bold text-slate-800">
              {metrics.dineInOrdersCount} Orders
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Revenue from Dining Hall:</span>
            <span className="text-xl font-bold font-mono text-slate-950">
              {formatPrice(metrics.dineInRevenue, settings.currencySymbol)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.totalRevenue > 0
              ? `${((metrics.dineInRevenue / metrics.totalRevenue) * 100).toFixed(1)}% of total daily business`
              : '0%'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
                Takeaway & Parcel
              </h4>
            </div>
            <span className="font-mono text-xs font-bold text-slate-800">
              {metrics.takeawayOrdersCount} Orders
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Revenue from Takeaways:</span>
            <span className="text-xl font-bold font-mono text-slate-950">
              {formatPrice(metrics.takeawayRevenue, settings.currencySymbol)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.totalRevenue > 0
              ? `${((metrics.takeawayRevenue / metrics.totalRevenue) * 100).toFixed(1)}% of total daily business`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Orders Processed for this Date */}
      <div className="bg-white border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight">
              Bills Processed on {selectedDate}
            </h3>
            <p className="text-xs text-slate-500">
              Individual settled bills and customer payment methods for this date
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 border border-slate-200">
            {dayOrders.length} Settled
          </span>
        </div>

        {dayOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No orders have been settled for {selectedDate}.</p>
            {isCurrentDate && onAddSampleTodayOrders && (
              <button
                onClick={onAddSampleTodayOrders}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                + Populate Sample Orders for Today
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold">
                  <th className="py-2.5 px-3">Bill No.</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Table / Type</th>
                  <th className="py-2.5 px-3">Guest Details</th>
                  <th className="py-2.5 px-3">Dishes Ordered</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Bill Total</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dayOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-950">
                      {ord.billNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {ord.time}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {ord.tableNumber}
                      <span className="text-[10px] text-slate-400 font-normal block">
                        {ord.orderType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {ord.customerName ? (
                        <div>
                          <span className="font-medium text-slate-900">{ord.customerName}</span>
                          {ord.customerPhone && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {ord.customerPhone}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                      <span className="font-semibold text-slate-900">
                        {ord.items.length} items:{' '}
                      </span>
                      {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-200">
                        {getPaymentDetails(ord.paymentMethod).icon}
                        <span>{ord.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950 text-sm tabular-nums whitespace-nowrap">
                      {formatPrice(ord.total, settings.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onPrintOrder(ord)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1 mx-auto"
                        title="Reprint Bill Receipt"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Day-End Register Report / Z-Report Modal */}
      {isPrintSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white max-w-md w-full border border-slate-300 shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Daily Register Summary (Z-Report)
                </span>
              </div>
              <button
                onClick={() => setIsPrintSummaryOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal / Paper Preview */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-900 space-y-4">
              <div className="text-center space-y-0.5">
                <h3 className="font-bold text-sm uppercase">{settings.restaurantName}</h3>
                <p className="text-[10px] text-slate-600">{settings.addressLine1}</p>
                <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
                {settings.gstinOrTaxNo && (
                  <p className="text-[10px] text-slate-600">{settings.gstinOrTaxNo}</p>
                )}
                <div className="border-b border-dashed border-slate-400 my-2" />
                <h4 className="font-bold uppercase tracking-wider text-xs">DAILY SALES SUMMARY</h4>
                <p className="text-[11px] font-semibold">Date: {selectedDate}</p>
                <p className="text-[10px] text-slate-500">
                  Closed At: {new Date().toLocaleTimeString()}
                </p>
                <div className="border-b border-dashed border-slate-400 my-2" />
              </div>

              {/* Summary Stats */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Total Orders Settled:</span>
                  <strong className="font-bold">{metrics.totalOrdersCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dine-In Orders:</span>
                  <span>{metrics.dineInOrdersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Takeaway Orders:</span>
                  <span>{metrics.takeawayOrdersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Dishes Sold:</span>
                  <span>{metrics.totalItemsCount}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              {/* Financial Totals */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Food Subtotal:</span>
                  <span>{formatPrice(metrics.subtotalAmount, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({settings.taxRatePercent}%):</span>
                  <span>{formatPrice(metrics.taxAmount, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parcel Charges:</span>
                  <span>{formatPrice(metrics.parcelChargeAmount, settings.currencySymbol)}</span>
                </div>
                {metrics.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Discounts:</span>
                    <span>-{formatPrice(metrics.discountAmount, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="border-b border-slate-900 my-1.5" />
                <div className="flex justify-between text-sm font-bold">
                  <span>TOTAL REVENUE:</span>
                  <span>{formatPrice(metrics.totalRevenue, settings.currencySymbol)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              {/* Payment Methods Breakdown */}
              <div className="space-y-1.5 text-[11px]">
                <div className="font-bold text-xs uppercase tracking-wide">
                  Payment Method Breakdown:
                </div>
                {(['UPI / QR', 'Cash', 'Card', 'Online'] as PaymentMethod[]).map((m) => {
                  const item = metrics.paymentBreakdown[m];
                  return (
                    <div key={m} className="flex justify-between items-center">
                      <span>
                        {m} ({item.count}):
                      </span>
                      <span className="font-bold">
                        {formatPrice(item.amount, settings.currencySymbol)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-b border-dashed border-slate-400 my-3" />

              <div className="pt-4 text-center text-[10px] text-slate-500 space-y-4">
                <div className="flex justify-between items-end px-4 pt-6">
                  <div className="border-t border-slate-400 w-28 text-center pt-1">
                    Cashier Sign
                  </div>
                  <div className="border-t border-slate-400 w-28 text-center pt-1">
                    Manager Sign
                  </div>
                </div>
                <p>*** END OF DAY REGISTER REPORT ***</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsPrintSummaryOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
