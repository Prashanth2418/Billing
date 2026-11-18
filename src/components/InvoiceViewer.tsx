import React, { useState } from 'react';
import { Invoice, BusinessProfile } from '../types/billing';
import { InvoiceDocument } from './InvoiceDocument';
import { formatCurrency } from '../utils/storage';
import {
  Printer,
  ArrowLeft,
  Edit2,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Download,
} from 'lucide-react';

interface InvoiceViewerProps {
  invoice: Invoice;
  profile: BusinessProfile;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onMarkPaid: (invoiceId: string) => void;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  invoice,
  profile,
  onBack,
  onEdit,
  onMarkPaid,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const isPaid = invoice.status === 'paid' || invoice.balanceDue <= 0.001;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `*SEAFOOD INVOICE: ${invoice.invoiceNumber}*\n` +
      `Merchant: ${profile.companyName}\n` +
      `Client: ${invoice.clientBusiness || invoice.clientName}\n` +
      `Date: ${invoice.date} | Due: ${invoice.dueDate}\n` +
      `Items (${invoice.items.length}):\n` +
      invoice.items.map((i) => ` - ${i.name}: ${i.quantity} ${i.unit} @ ${formatCurrency(i.unitPrice, invoice.currencySymbol)} = ${formatCurrency(i.lineTotal, invoice.currencySymbol)}`).join('\n') +
      `\nTotal: ${formatCurrency(invoice.total, invoice.currencySymbol)}\n` +
      `Amount Due: ${formatCurrency(invoice.balanceDue, invoice.currencySymbol)}\n` +
      `Remittance: ${profile.bankName}, A/C: ${profile.accountNumber}, Routing: ${profile.routingOrIfsc}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (hidden during printing) */}
      <div className="no-print bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </button>
          <div>
            <span className="text-xs text-slate-500">Commercial Seafood Invoice</span>
            <h2 className="text-base font-bold text-slate-900 font-mono">
              {invoice.invoiceNumber}
            </h2>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Copy text summary for email/whatsapp */}
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Copy invoice details to clipboard"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {/* Mark Paid button */}
          {!isPaid && (
            <button
              onClick={() => onMarkPaid(invoice.id)}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark as Paid</span>
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => onEdit(invoice)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 border border-slate-300 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Edit Invoice</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* The Printable Invoice Document */}
      <div className="invoice-container">
        <InvoiceDocument
          invoice={invoice}
          profile={profile}
          isPrintPreview={true}
        />
      </div>
    </div>
  );
};
