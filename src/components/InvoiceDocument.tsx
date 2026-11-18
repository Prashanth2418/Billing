import React from 'react';
import { Invoice, BusinessProfile } from '../types/billing';
import { formatCurrency } from '../utils/storage';
import { Anchor, ShieldCheck, Thermometer, Phone, Mail, Globe, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice;
  profile: BusinessProfile;
  isPrintPreview?: boolean;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  profile,
  isPrintPreview = false,
}) => {
  const isPaid = invoice.status === 'paid' || invoice.balanceDue <= 0.001;
  const isOverdue = invoice.status === 'overdue' || (!isPaid && new Date(invoice.dueDate) < new Date());

  // Generate a mock quick-pay QR SVG
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=SEAFOOD-PAY:${invoice.invoiceNumber}:${invoice.balanceDue}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div
      id="printable-invoice"
      className={`bg-white text-slate-900 mx-auto w-full transition-shadow ${
        isPrintPreview
          ? 'max-w-4xl shadow-xl rounded-none sm:rounded-sm border border-slate-200 p-8 sm:p-12 print:shadow-none print:border-none print:p-0'
          : 'p-6 sm:p-10 border border-slate-200'
      }`}
    >
      {/* Top Header: Business Branding & Invoice Title */}
      <div className="border-b-2 border-slate-900 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          {/* Company Brand Lockup */}
          <div className="flex items-start gap-4">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.companyName}
                className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded-full border border-slate-300 bg-white p-0.5 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-18 h-18 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Anchor className="w-8 h-8 text-cyan-400" />
              </div>
            )}

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 uppercase font-sans">
                {profile.companyName}
              </h1>
              <p className="text-xs text-slate-600 font-medium tracking-wide">
                {profile.tradeName || profile.tagline}
              </p>
              
              <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile.addressLine1}{profile.addressLine2 ? `, ${profile.addressLine2}` : ''}, {profile.city}, {profile.state} {profile.postalCode}</span>
                </p>
                <p className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {profile.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {profile.email}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-1 text-[11px] text-slate-500">
                  <span><strong>License:</strong> {profile.fisheryLicenseNo}</span>
                  <span><strong>Tax/EIN:</strong> {profile.taxNumber}</span>
                  {profile.website && <span><strong>Web:</strong> {profile.website}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Meta Box */}
          <div className="sm:text-right shrink-0">
            <div className="inline-block bg-slate-900 text-white px-4 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
              Commercial Invoice
            </div>
            <div className="text-2xl font-mono font-bold text-slate-950 tracking-tight">
              {invoice.invoiceNumber}
            </div>

            {/* Status Stamp */}
            <div className="mt-2 flex items-center sm:justify-end gap-1.5">
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Paid in Full
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Payment Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Payment Pending
                </span>
              )}
            </div>

            <div className="mt-3 text-xs text-slate-600 space-y-1 font-mono">
              <div>
                <span className="text-slate-400">Issue Date:</span>{' '}
                <span className="font-semibold text-slate-800">{invoice.date}</span>
              </div>
              <div>
                <span className="text-slate-400">Due Date:</span>{' '}
                <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
              </div>
              <div>
                <span className="text-slate-400">Terms:</span>{' '}
                <span className="font-semibold text-slate-800">{invoice.paymentTerms}</span>
              </div>
              {invoice.poNumber && (
                <div>
                  <span className="text-slate-400">P.O. Ref:</span>{' '}
                  <span className="font-semibold text-slate-800">{invoice.poNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Dispatch / Logistics Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200 text-xs">
        {/* Bill To */}
        <div className="bg-slate-50/70 p-4 border border-slate-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Billed To (Client / Consignee)
          </div>
          <div className="text-sm font-bold text-slate-950">
            {invoice.clientBusiness || invoice.clientName}
          </div>
          {invoice.clientBusiness && invoice.clientName && (
            <div className="text-slate-700 font-medium">Attn: {invoice.clientName}</div>
          )}
          <div className="text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
            {invoice.clientBillingAddress || 'Billing address on file'}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap gap-x-4">
            {invoice.clientPhone && <span>Tel: {invoice.clientPhone}</span>}
            {invoice.clientEmail && <span>Email: {invoice.clientEmail}</span>}
            {invoice.clientTaxNumber && <span>Tax ID: {invoice.clientTaxNumber}</span>}
          </div>
        </div>

        {/* Cold-Chain Dispatch & Delivery Destination */}
        <div className="bg-slate-50/70 p-4 border border-slate-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Delivery Dock & Cold-Chain Details
          </div>
          <div className="text-slate-900 font-medium">
            <strong>Destination:</strong> {invoice.clientDeliveryAddress || invoice.clientBillingAddress || 'Standard Delivery'}
          </div>
          <div className="mt-1 text-slate-700">
            <strong>Vessel / Dispatch Pier:</strong> {invoice.vesselOrDockRef || 'Berth 4 Cold Dock Terminal'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-slate-800">
            <Thermometer className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span><strong>Logged Temp:</strong> {invoice.temperatureAtDispatch || '1.0°C (Insulated Pack)'}</span>
          </div>
          {invoice.catchDate && (
            <div className="mt-1 text-slate-600">
              <strong>Catch/Harvest Date:</strong> {invoice.catchDate}
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HACCP Quality & Cold-Chain Standards Verified</span>
          </div>
        </div>
      </div>

      {/* Seafood Line Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Catch Description & Form</th>
              <th className="py-2.5 px-3">Origin / Batch</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3">Unit</th>
              <th className="py-2.5 px-3 text-right">Rate</th>
              <th className="py-2.5 px-3 text-right">Disc</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-b border-slate-300">
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                  No seafood items added to this invoice yet.
                </td>
              </tr>
            ) : (
              invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/60 page-break-inside-avoid">
                  <td className="py-3 px-3 text-center text-slate-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 text-[13px]">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{item.category}</span>
                      <span>·</span>
                      <span>{item.form}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600">
                    <div>{item.origin || 'Ocean Catch'}</div>
                    {item.batchOrCatchNo && (
                      <div className="font-mono text-slate-400 text-[10px]">
                        {item.batchOrCatchNo}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 text-[13px] tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800 tabular-nums">
                    {formatCurrency(item.unitPrice, invoice.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500 tabular-nums">
                    {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 text-[13px] tabular-nums">
                    {formatCurrency(item.lineTotal, invoice.currencySymbol)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Settlement Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 page-break-inside-avoid">
        {/* Left Col: Bank Details & Terms */}
        <div className="md:col-span-7 space-y-4">
          {/* Remittance & Bank Info */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-none text-xs">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
              <span>Remittance & Wire Instructions</span>
              <span className="text-[10px] text-slate-500 font-normal">Reference: {invoice.invoiceNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div>
                <p className="text-[11px] text-slate-500">Bank Name</p>
                <p className="font-semibold text-slate-900">{profile.bankName}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Account Name</p>
                <p className="font-semibold text-slate-900">{profile.accountName}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Account Number / IBAN</p>
                <p className="font-mono font-bold text-slate-900">{profile.accountNumber}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Routing / SWIFT / BIC</p>
                <p className="font-mono font-bold text-slate-900">{profile.routingOrIfsc} / {profile.swiftBic}</p>
              </div>
              {profile.upiId && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] text-slate-500">Direct Merchant UPI / ID</p>
                  <p className="font-mono font-semibold text-cyan-800">{profile.upiId}</p>
                </div>
              )}
            </div>

            {invoice.paymentInstructions && (
              <p className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 italic">
                {invoice.paymentInstructions}
              </p>
            )}
          </div>

          {/* Perishable Seafood Disclaimer & Terms */}
          <div className="text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Perishable Goods Terms & Cold-Chain Acceptance:
            </p>
            <p className="leading-relaxed">
              {invoice.notesTerms || profile.defaultNotes}
            </p>
            <p className="text-[10px] text-slate-400">
              Fresh seafood must be transferred immediately to temperature-controlled refrigeration (&le; 2°C). In case of quality discrepancy, notice must be communicated within 6 hours of physical dock receipt.
            </p>
          </div>
        </div>

        {/* Right Col: Calculation Totals Box */}
        <div className="md:col-span-5">
          <div className="border border-slate-300 divide-y divide-slate-200 text-xs">
            <div className="flex justify-between py-2 px-3 text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatCurrency(invoice.subtotal, invoice.currencySymbol)}
              </span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between py-2 px-3 text-emerald-700">
                <span>Volume Discount ({invoice.discountRate}%):</span>
                <span className="font-mono font-semibold tabular-nums">
                  -{formatCurrency(invoice.discountAmount, invoice.currencySymbol)}
                </span>
              </div>
            )}

            {invoice.coldChainPackagingFee > 0 && (
              <div className="flex justify-between py-2 px-3 text-slate-600">
                <span>Crushed Ice & Insulated Crates:</span>
                <span className="font-mono text-slate-800 tabular-nums">
                  +{formatCurrency(invoice.coldChainPackagingFee, invoice.currencySymbol)}
                </span>
              </div>
            )}

            {invoice.deliveryFreightFee > 0 && (
              <div className="flex justify-between py-2 px-3 text-slate-600">
                <span>Refrigerated Dock Delivery:</span>
                <span className="font-mono text-slate-800 tabular-nums">
                  +{formatCurrency(invoice.deliveryFreightFee, invoice.currencySymbol)}
                </span>
              </div>
            )}

            {invoice.taxAmount > 0 ? (
              <div className="flex justify-between py-2 px-3 text-slate-600">
                <span>Sales Tax / VAT:</span>
                <span className="font-mono text-slate-800 tabular-nums">
                  +{formatCurrency(invoice.taxAmount, invoice.currencySymbol)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between py-2 px-3 text-slate-500 text-[11px]">
                <span>Tax (Fresh Produce 0%):</span>
                <span className="font-mono tabular-nums">$0.00</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between py-3 px-3 bg-slate-900 text-white font-bold text-sm">
              <span className="uppercase tracking-wider">Total Amount:</span>
              <span className="font-mono text-base tabular-nums text-cyan-300">
                {formatCurrency(invoice.total, invoice.currencySymbol)}
              </span>
            </div>

            {/* Paid & Balance */}
            <div className="flex justify-between py-2 px-3 text-slate-600 bg-slate-50">
              <span>Amount Paid:</span>
              <span className="font-mono font-medium text-emerald-700 tabular-nums">
                {formatCurrency(invoice.amountPaid, invoice.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between py-2.5 px-3 bg-slate-100 font-bold text-xs">
              <span className="text-slate-900 uppercase">Balance Due:</span>
              <span
                className={`font-mono text-sm tabular-nums ${
                  invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(invoice.balanceDue, invoice.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Quick Pay QR Preview */}
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-semibold text-slate-900 text-[11px]">Scan to Verify & Remit</div>
              <div className="text-[10px] text-slate-500">Instant wire / terminal lookup</div>
            </div>
            <img
              src={qrSvgUrl}
              alt="Payment QR"
              className="w-14 h-14 border border-slate-300 bg-white p-1"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Footer Sign-off & Seal */}
      <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 page-break-inside-avoid text-xs">
        <div className="text-slate-500 text-[11px] text-center sm:text-left">
          <p className="font-semibold text-slate-700">Thank you for your seafood partnership.</p>
          <p>Direct inquiries: {profile.phone} · {profile.email}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Generated via Harbor Tide Invoicing System · Official Pier Record
          </p>
        </div>

        {/* Authorized Signatory & Stamp */}
        <div className="text-center sm:text-right">
          <div className="inline-block border-b border-slate-400 pb-1 w-48 text-center">
            <span className="font-serif italic text-lg text-slate-800 tracking-wider">
              {profile.authorizedSignatory}
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-800 mt-0.5 uppercase tracking-wide">
            {profile.authorizedSignatory}
          </div>
          <div className="text-[10px] text-slate-500">
            {profile.signatoryTitle || 'Authorized Commercial Signatory'}
          </div>
        </div>
      </div>
    </div>
  );
};
