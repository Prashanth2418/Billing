import React, { useState } from 'react';
import { RestaurantOrder, RestaurantSettings } from '../types/restaurant';
import { PrinterDevice, PaperSize } from '../types/printer';
import { formatPrice } from '../utils/restaurantStorage';
import { Printer, X, Settings2, CheckCircle2 } from 'lucide-react';

interface RestaurantReceiptProps {
  order: RestaurantOrder;
  settings: RestaurantSettings;
  activePrinter?: PrinterDevice;
  onClose?: () => void;
  onOpenPrinterSelector?: () => void;
  isModal?: boolean;
}

export const RestaurantReceipt: React.FC<RestaurantReceiptProps> = ({
  order,
  settings,
  activePrinter,
  onClose,
  onOpenPrinterSelector,
  isModal = false,
}) => {
  const paperWidth: PaperSize = activePrinter?.paperWidth || '80mm';

  const handlePrint = () => {
    // If user clicked Print Bill, trigger browser print
    window.print();
  };

  // Generate UPI QR code for fast payment scan
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.restaurantName
  )}&am=${order.total}&cu=INR&tn=${encodeURIComponent(`Bill-${order.billNumber}`)}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
    upiPayUrl
  )}&bgcolor=ffffff&color=000000&margin=1`;

  // Dynamically width-adjusted receipt container for 58mm vs 80mm
  const is58mm = paperWidth === '58mm';

  const receiptContent = (
    <div
      className={`restaurant-receipt-print bg-white text-slate-950 font-mono leading-relaxed mx-auto p-4 sm:p-5 border border-slate-300 sm:border-none shadow-none ${
        is58mm ? 'max-w-[240px] text-[10px]' : 'max-w-[310px] text-[11px]'
      }`}
    >
      {/* Restaurant Header */}
      <div className="text-center pb-2">
        <h2 className="text-sm font-bold tracking-tight uppercase text-black font-sans">
          {settings.restaurantName}
        </h2>
        {settings.tagline && (
          <p className="text-[10px] text-slate-600 italic">{settings.tagline}</p>
        )}
        <p className="text-[10px] text-slate-700 mt-0.5">
          {settings.addressLine1}
          {settings.addressLine2 ? `, ${settings.addressLine2}` : ''}
        </p>
        <p className="text-[10px] text-slate-700">{settings.city}</p>
        <p className="text-[10px] font-semibold text-slate-800">Tel: {settings.phone}</p>
        {settings.gstinOrTaxNo && (
          <p className="text-[10px] text-slate-600 font-semibold">{settings.gstinOrTaxNo}</p>
        )}
        {settings.fssaiLicense && (
          <p className="text-[9px] text-slate-500">{settings.fssaiLicense}</p>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-slate-400 my-1.5" />

      {/* Bill & Table Meta */}
      <div className="flex justify-between text-[10px] text-slate-700">
        <div>
          <span>Bill No: </span>
          <strong className="text-black font-bold text-xs">{order.billNumber}</strong>
        </div>
        <div>
          <span>Date: </span>
          <span>{order.date}</span>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-700">
        <div>
          <span>Type: </span>
          <strong className="text-black">{order.tableNumber}{order.billLabel ? ` · ${order.billLabel}` : ''} ({order.orderType})</strong>
        </div>
        <div>
          <span>Time: </span>
          <span>{order.time}</span>
        </div>
      </div>
      {order.customerName && (
        <div className="text-[10px] text-slate-600">
          <span>Guest: </span>
          <span className="font-semibold text-slate-900">{order.customerName}</span>
          {order.customerPhone ? ` (${order.customerPhone})` : ''}
        </div>
      )}

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-slate-400 my-1.5" />

      {/* Items Table */}
      <div className="space-y-1 my-2">
        <div className="flex justify-between font-bold text-[10px] uppercase text-slate-800 border-b border-slate-300 pb-0.5">
          <span className="w-5 text-left">Qty</span>
          <span className="flex-1 text-left px-1">Item</span>
          <span className="w-12 text-right">Rate</span>
          <span className="w-14 text-right">Amount</span>
        </div>

        {order.items.map((item, idx) => (
          <div key={item.id || idx} className="text-[11px] leading-tight pt-1">
            <div className="flex justify-between items-baseline">
              <span className="w-5 text-left font-bold">{item.quantity}</span>
              <span className="flex-1 text-left px-1 font-semibold text-slate-950">
                {item.name}
              </span>
              <span className="w-12 text-right text-[10px] text-slate-600 tabular-nums">
                {formatPrice(item.price, settings.currencySymbol)}
              </span>
              <span className="w-14 text-right font-bold text-slate-950 tabular-nums">
                {formatPrice(item.total, settings.currencySymbol)}
              </span>
            </div>
            {item.specialNote && (
              <div className="text-[9px] text-slate-500 italic pl-6">
                * {item.specialNote}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-slate-400 my-1.5" />

      {/* Financial Calculations */}
      <div className="space-y-0.5 text-[10px] text-slate-700">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {formatPrice(order.subtotal, settings.currencySymbol)}
          </span>
        </div>

        {order.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-800">
            <span>Discount ({order.discountPercent}%):</span>
            <span className="font-semibold tabular-nums">
              -{formatPrice(order.discountAmount, settings.currencySymbol)}
            </span>
          </div>
        )}

        {settings.enableTax && order.taxAmount > 0 && (
          <>
            <div className="flex justify-between">
              <span>CGST ({(order.taxPercent / 2).toFixed(1)}%):</span>
              <span className="tabular-nums">
                {formatPrice(order.taxAmount / 2, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SGST ({(order.taxPercent / 2).toFixed(1)}%):</span>
              <span className="tabular-nums">
                {formatPrice(order.taxAmount / 2, settings.currencySymbol)}
              </span>
            </div>
          </>
        )}

        {order.parcelCharge > 0 && (
          <div className="flex justify-between">
            <span>Container / Parcel Charge:</span>
            <span className="tabular-nums">
              +{formatPrice(order.parcelCharge, settings.currencySymbol)}
            </span>
          </div>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-slate-400 my-1.5" />

      {/* GRAND TOTAL */}
      <div className="flex justify-between items-baseline py-1">
        <span className="text-xs font-bold uppercase text-slate-950">Grand Total:</span>
        <span className="text-base font-bold font-mono text-black tabular-nums">
          {formatPrice(order.total, settings.currencySymbol)}
        </span>
      </div>

      <div className="flex justify-between text-[10px] text-slate-700 pt-0.5">
        <span>Payment Method:</span>
        <strong className="text-black uppercase">{order.paymentMethod} ({order.paymentStatus})</strong>
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-slate-400 my-2" />

      {/* UPI QR Code for instant payment or scan */}
      {settings.upiId && (
        <div className="text-center py-1">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
            Scan UPI QR to Pay
          </p>
          <img
            src={qrSvgUrl}
            alt="UPI QR Code"
            className="w-20 h-20 mx-auto border border-slate-300 p-0.5 bg-white"
            referrerPolicy="no-referrer"
          />
          <p className="text-[9px] text-slate-500 font-mono mt-1">{settings.upiId}</p>
        </div>
      )}

      {/* Footer message */}
      <div className="text-center pt-2 text-[10px] text-slate-600">
        <p className="font-semibold text-slate-800">{settings.receiptFooterNote}</p>
        <p className="text-[9px] text-slate-400 mt-0.5">
          Have a flavorful seafood experience!
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 no-print-backdrop">
        <div className="bg-white border border-slate-300 max-w-sm w-full p-4 shadow-2xl space-y-3 max-h-[95vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="no-print flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase">
                Guest Bill Receipt ({order.billNumber})
              </span>
              {activePrinter && (
                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span>Printer:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                    {activePrinter.name}
                  </span>
                  <span>({activePrinter.paperWidth})</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Preview */}
          <div className="border border-slate-200 bg-slate-50/50 p-2 overflow-x-auto">
            {receiptContent}
          </div>

          {/* Modal Actions */}
          <div className="no-print space-y-2 pt-2 border-t border-slate-200">
            {/* Printer machine config selector shortcut */}
            {onOpenPrinterSelector && (
              <button
                type="button"
                onClick={onOpenPrinterSelector}
                className="w-full text-left p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      {activePrinter?.name || 'Select Printer Machine'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Click to choose machine & set as default
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-cyan-800 bg-white px-2 py-0.5 border border-slate-200">
                  Change
                </span>
              </button>
            )}

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return receiptContent;
};
