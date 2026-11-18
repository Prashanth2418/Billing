import React, { useState } from 'react';
import { BusinessProfile, CurrencyCode } from '../types/billing';
import { Anchor, Building, CreditCard, Shield, RefreshCw, Check } from 'lucide-react';

interface BusinessSettingsModalProps {
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: BusinessProfile) => void;
  onResetDefaults: () => void;
}

export const BusinessSettingsModal: React.FC<BusinessSettingsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  onResetDefaults,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (code: CurrencyCode) => {
    const symbolMap: Record<CurrencyCode, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      CAD: 'CA$',
      AUD: 'A$',
      SGD: 'S$',
    };
    setFormData((prev) => ({
      ...prev,
      currencyCode: code,
      currencySymbol: symbolMap[code] || '$',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white border border-slate-300 max-w-2xl w-full p-6 shadow-2xl text-xs space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-700" />
              Seafood Business Profile & Billing Settings
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              These details appear on all generated client invoices, printouts, and wire instructions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Business Identity */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              Company Legal & Commercial Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trade Name / Tagline
                </label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => handleChange('tradeName', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fishery Commercial License #
                </label>
                <input
                  type="text"
                  value={formData.fisheryLicenseNo}
                  onChange={(e) => handleChange('fisheryLicenseNo', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax / GSTIN / EIN / VAT #
                </label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => handleChange('taxNumber', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harbor / Pier Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange('addressLine1', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Berth / Terminal Line 2
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => handleChange('addressLine2', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State / Region</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Currency & Banking */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-600" />
              Settlement, Currency & Wire Instructions
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Currency
                </label>
                <select
                  value={formData.currencyCode}
                  onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                  className="w-full border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD (CA$ - Canadian Dollar)</option>
                  <option value="AUD">AUD (A$ - Australian Dollar)</option>
                  <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Payment Terms
                </label>
                <select
                  value={formData.defaultPaymentTerms}
                  onChange={(e) => handleChange('defaultPaymentTerms', e.target.value)}
                  className="w-full border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7 Days">Net 7 Days</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.defaultTaxRate}
                  onChange={(e) => handleChange('defaultTaxRate', Number(e.target.value))}
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Beneficiary</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => handleChange('accountName', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account # / IBAN</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Routing / IFSC / SWIFT</label>
                <input
                  type="text"
                  value={formData.routingOrIfsc}
                  onChange={(e) => handleChange('routingOrIfsc', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Merchant UPI ID / Quick-Pay (Optional)
                </label>
                <input
                  type="text"
                  value={formData.upiId || ''}
                  onChange={(e) => handleChange('upiId', e.target.value)}
                  placeholder="e.g. harbortide@okhdfcbank"
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Signatory */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              Authorized Signatory & Seal
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Signatory Name</label>
                <input
                  type="text"
                  value={formData.authorizedSignatory}
                  onChange={(e) => handleChange('authorizedSignatory', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Signatory Title</label>
                <input
                  type="text"
                  value={formData.signatoryTitle}
                  onChange={(e) => handleChange('signatoryTitle', e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset business profile and sample data to defaults?')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 text-white font-semibold hover:bg-slate-800 flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
