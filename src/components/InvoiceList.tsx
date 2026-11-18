import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus, BusinessProfile } from '../types/billing';
import { formatCurrency } from '../utils/storage';
import {
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Filter,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  profile: BusinessProfile;
  onCreateNew: () => void;
  onEdit: (invoice: Invoice) => void;
  onViewPrint: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onMarkPaid: (invoiceId: string) => void;
  onDelete: (invoiceId: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  profile,
  onCreateNew,
  onEdit,
  onViewPrint,
  onDuplicate,
  onMarkPaid,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [sortField, setSortField] = useState<'date' | 'total' | 'invoiceNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    const now = new Date();

    invoices.forEach((inv) => {
      totalBilled += inv.total;
      totalPaid += inv.amountPaid;
      totalOutstanding += inv.balanceDue;

      const isUnpaid = inv.balanceDue > 0.01;
      const isPastDue = new Date(inv.dueDate) < now;
      if (isUnpaid && (inv.status === 'overdue' || isPastDue)) {
        overdueCount++;
      }
    });

    return {
      totalBilled,
      totalPaid,
      totalOutstanding,
      overdueCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'overdue') {
            const isPastDue = new Date(inv.dueDate) < new Date() && inv.balanceDue > 0.01;
            if (inv.status !== 'overdue' && !isPastDue) return false;
          } else if (inv.status !== statusFilter) {
            return false;
          }
        }

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
        const matchClient = inv.clientName.toLowerCase().includes(q);
        const matchBusiness = inv.clientBusiness.toLowerCase().includes(q);
        const matchPO = (inv.poNumber || '').toLowerCase().includes(q);
        const matchItem = inv.items.some((i) => i.name.toLowerCase().includes(q));

        return matchNumber || matchClient || matchBusiness || matchPO || matchItem;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
          return sortOrder === 'desc' ? diff : -diff;
        }
        if (sortField === 'total') {
          return sortOrder === 'desc' ? b.total - a.total : a.total - b.total;
        }
        if (sortField === 'invoiceNumber') {
          return sortOrder === 'desc'
            ? b.invoiceNumber.localeCompare(a.invoiceNumber)
            : a.invoiceNumber.localeCompare(b.invoiceNumber);
        }
        return 0;
      });
  }, [invoices, searchQuery, statusFilter, sortField, sortOrder]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice #',
      'Date',
      'Due Date',
      'Client Business',
      'Contact',
      'Status',
      'Subtotal',
      'Packaging/Ice',
      'Freight',
      'Tax',
      'Total',
      'Amount Paid',
      'Balance Due',
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.date,
      inv.dueDate,
      `"${inv.clientBusiness.replace(/"/g, '""')}"`,
      `"${inv.clientName.replace(/"/g, '""')}"`,
      inv.status,
      inv.subtotal.toFixed(2),
      inv.coldChainPackagingFee.toFixed(2),
      inv.deliveryFreightFee.toFixed(2),
      inv.taxAmount.toFixed(2),
      inv.total.toFixed(2),
      inv.amountPaid.toFixed(2),
      inv.balanceDue.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Seafood_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 4-Metric SaaS Ledger Header (tabular-nums, domain-authentic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Total Seafood Billed</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(metrics.totalBilled, profile.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Across {metrics.totalCount} issued invoices
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {formatCurrency(metrics.totalOutstanding, profile.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Awaiting dock / kitchen remittance
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Total Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatCurrency(metrics.totalPaid, profile.currencySymbol)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Cleared to operating account
          </div>
        </div>

        {/* Overdue Accounts */}
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Overdue Accounts</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {metrics.overdueCount} Invoices
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Exceeded net credit period
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Status Filter Tabs, Sort, and Actions */}
      <div className="bg-white border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, restaurant, catch item, PO..."
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons: Export & New Invoice */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onCreateNew}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>+ New Seafood Invoice</span>
            </button>
          </div>
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({invoices.filter((i) => i.status === 'pending' && i.balanceDue > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1 font-medium transition-colors ${
                statusFilter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue ({metrics.overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 font-medium transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid ({invoices.filter((i) => i.status === 'paid' || i.balanceDue <= 0.01).length})
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="border border-slate-300 bg-white px-2 py-1 text-slate-800 focus:outline-hidden"
            >
              <option value="date">Invoice Date</option>
              <option value="total">Amount Total</option>
              <option value="invoiceNumber">Invoice Number</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              title="Toggle Asc/Desc"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Invoice Data Grid */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Client / Business</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Catches / Items</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No invoices matched your filter.</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Try adjusting the search query or create a new invoice.
                    </p>
                    <button
                      onClick={onCreateNew}
                      className="mt-3 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      + Create First Invoice
                    </button>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid' || inv.balanceDue <= 0.01;
                  const isOverdue =
                    !isPaid && (inv.status === 'overdue' || new Date(inv.dueDate) < new Date());

                  // Quick species names summary
                  const speciesSummary =
                    inv.items.map((i) => i.name.split('(')[0].trim()).slice(0, 2).join(', ') +
                    (inv.items.length > 2 ? ` +${inv.items.length - 2} more` : '');

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onViewPrint(inv)}
                    >
                      {/* Invoice # */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-950 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {inv.clientBusiness || inv.clientName}
                        </div>
                        {inv.clientBusiness && (
                          <div className="text-[11px] text-slate-500">{inv.clientName}</div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {inv.date}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                          {inv.dueDate}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                        <span className="font-medium text-slate-800">{inv.items.length} items</span>
                        {speciesSummary && <span className="text-slate-400"> · {speciesSummary}</span>}
                      </td>

                      {/* Status (Zero-pill compliant clean text with icon) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(inv.total, profile.currencySymbol)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span className={inv.balanceDue > 0 ? 'text-slate-900' : 'text-emerald-700'}>
                          {formatCurrency(inv.balanceDue, profile.currencySymbol)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* Print / View */}
                          <button
                            type="button"
                            onClick={() => onViewPrint(inv)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Print / View Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEdit(inv)}
                            className="p-1 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => onDuplicate(inv)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Duplicate as New Invoice"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Mark Paid */}
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => onMarkPaid(inv.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                onDelete(inv.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
