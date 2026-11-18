import React, { useState } from 'react';
import { RestaurantSettings } from '../types/restaurant';
import { Settings, RefreshCw, Check } from 'lucide-react';

interface RestaurantSettingsModalProps {
  settings: RestaurantSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: RestaurantSettings) => void;
  onResetDefaults: () => void;
  onOpenPrinterSetup?: () => void;
}

export const RestaurantSettingsModal: React.FC<RestaurantSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
  onResetDefaults,
  onOpenPrinterSetup,
}) => {
  const [formData, setFormData] = useState<RestaurantSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof RestaurantSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white border border-slate-300 max-w-lg w-full p-5 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-700" />
            <h3 className="font-bold text-slate-900 uppercase">
              Restaurant Bill & Print Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-base"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              required
              value={formData.restaurantName}
              onChange={(e) => handleChange('restaurantName', e.target.value)}
              className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              placeholder="Fresh Ocean Catches & Sizzling Tawa Delicacies"
              className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                City / Area
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                value={formData.gstinOrTaxNo}
                onChange={(e) => handleChange('gstinOrTaxNo', e.target.value)}
                placeholder="GSTIN: 29AAACK4829P1Z6"
                className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency</label>
              <select
                value={formData.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900 font-bold"
              >
                <option value="₹">₹ (INR - Rupee)</option>
                <option value="$">$ (USD - Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - Pound)</option>
                <option value="AED">AED (Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax / GST (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.taxRatePercent}
                onChange={(e) => handleChange('taxRatePercent', Number(e.target.value))}
                className="w-full border border-slate-300 px-2 py-1.5 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parcel Fee</label>
              <input
                type="number"
                min="0"
                value={formData.defaultParcelCharge}
                onChange={(e) => handleChange('defaultParcelCharge', Number(e.target.value))}
                className="w-full border border-slate-300 px-2 py-1.5 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              UPI ID (For Instant Payment QR on Guest Bill)
            </label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) => handleChange('upiId', e.target.value)}
              placeholder="e.g. seafood@okhdfcbank"
              className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono"
            />
            <span className="text-[10px] text-slate-500">
              When guests scan this QR from their phone, it opens GPay / PhonePe / Paytm with the exact bill amount!
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Receipt Footer Note
            </label>
            <input
              type="text"
              value={formData.receiptFooterNote}
              onChange={(e) => handleChange('receiptFooterNote', e.target.value)}
              className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
            />
          </div>

          {/* Quick Printer Hardware Configuration trigger */}
          {onOpenPrinterSetup && (
            <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Bill Printer Hardware & Default Machine
                </span>
                <span className="text-[10px] text-slate-500">
                  Select thermal model (80mm/58mm), Bluetooth, USB, or Network IP printer.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrinterSetup();
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs whitespace-nowrap"
              >
                Printer Settings
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {confirmReset ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1.5">
                <span className="text-[10px] text-rose-800 font-semibold">Reset all to default?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetDefaults();
                    onClose();
                  }}
                  className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-1.5 py-0.5 text-slate-600 text-[10px]"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold hover:bg-slate-800 flex items-center gap-1"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
