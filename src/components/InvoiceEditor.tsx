import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceLineItem, Client, SeafoodItem, BusinessProfile, UnitOfMeasure } from '../types/billing';
import { InvoiceDocument } from './InvoiceDocument';
import { formatCurrency, generateNextInvoiceNumber } from '../utils/storage';
import {
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Edit3,
  Copy,
  ChevronDown,
  Fish,
  AlertCircle,
  Thermometer,
  Anchor,
} from 'lucide-react';

interface InvoiceEditorProps {
  invoiceToEdit?: Invoice | null;
  clients: Client[];
  catalog: SeafoodItem[];
  profile: BusinessProfile;
  existingInvoices: Invoice[];
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  onClientAdd?: (client: Client) => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoiceToEdit,
  clients,
  catalog,
  profile,
  existingInvoices,
  onSave,
  onCancel,
  onClientAdd,
}) => {
  const isEditing = Boolean(invoiceToEdit);

  // View mode: 'split' on desktop, or toggle tabs
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [quickClientModal, setQuickClientModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoiceToEdit ? invoiceToEdit.invoiceNumber : generateNextInvoiceNumber(existingInvoices)
  );
  const [date, setDate] = useState(
    invoiceToEdit ? invoiceToEdit.date : new Date().toISOString().split('T')[0]
  );
  
  // Default due date: today + 15 days
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };
  const [dueDate, setDueDate] = useState(invoiceToEdit ? invoiceToEdit.dueDate : defaultDueDate());
  const [paymentTerms, setPaymentTerms] = useState(
    invoiceToEdit ? invoiceToEdit.paymentTerms : profile.defaultPaymentTerms || 'Net 15 Days'
  );
  const [status, setStatus] = useState<Invoice['status']>(invoiceToEdit ? invoiceToEdit.status : 'pending');

  // Client Selection
  const [selectedClientId, setSelectedClientId] = useState<string>(invoiceToEdit ? invoiceToEdit.clientId : (clients[0]?.id || ''));
  const [clientName, setClientName] = useState(invoiceToEdit ? invoiceToEdit.clientName : (clients[0]?.name || ''));
  const [clientBusiness, setClientBusiness] = useState(invoiceToEdit ? invoiceToEdit.clientBusiness : (clients[0]?.businessName || ''));
  const [clientEmail, setClientEmail] = useState(invoiceToEdit ? invoiceToEdit.clientEmail : (clients[0]?.email || ''));
  const [clientPhone, setClientPhone] = useState(invoiceToEdit ? invoiceToEdit.clientPhone : (clients[0]?.phone || ''));
  const [clientBillingAddress, setClientBillingAddress] = useState(
    invoiceToEdit ? invoiceToEdit.clientBillingAddress : (clients[0]?.billingAddress || '')
  );
  const [clientDeliveryAddress, setClientDeliveryAddress] = useState(
    invoiceToEdit ? invoiceToEdit.clientDeliveryAddress : (clients[0]?.deliveryPierOrKitchen || '')
  );
  const [clientTaxNumber, setClientTaxNumber] = useState(
    invoiceToEdit ? invoiceToEdit.clientTaxNumber || '' : (clients[0]?.taxNumber || '')
  );

  // Logistics & Traceability
  const [vesselOrDockRef, setVesselOrDockRef] = useState(
    invoiceToEdit ? invoiceToEdit.vesselOrDockRef : 'Pier 17 Cold Berth / M/V Harbor Pioneer'
  );
  const [poNumber, setPoNumber] = useState(invoiceToEdit ? invoiceToEdit.poNumber || '' : '');
  const [catchDate, setCatchDate] = useState(
    invoiceToEdit ? invoiceToEdit.catchDate || '' : new Date().toISOString().split('T')[0]
  );
  const [temperatureAtDispatch, setTemperatureAtDispatch] = useState(
    invoiceToEdit ? invoiceToEdit.temperatureAtDispatch : '1.0°C (Insulated Ice Flake Tote)'
  );

  // Line items
  const [items, setItems] = useState<InvoiceLineItem[]>(
    invoiceToEdit && invoiceToEdit.items.length > 0
      ? invoiceToEdit.items
      : [
          {
            id: 'item-1',
            seafoodItemId: catalog[0]?.id,
            name: catalog[0]?.name || 'Wild Atlantic Salmon (Head-on, Gutted)',
            category: catalog[0]?.category || 'Fin Fish',
            form: catalog[0]?.form || 'Whole / Round',
            origin: catalog[0]?.catchOrigin || 'Gulf of Maine / FAO 21',
            batchOrCatchNo: 'CATCH-SAL-01',
            unit: catalog[0]?.defaultUnit || 'kg',
            quantity: 25,
            unitPrice: catalog[0]?.unitPrice || 19.50,
            discountPercent: 0,
            taxRate: 0,
            lineTotal: 487.50,
          },
        ]
  );

  // Adjustments & Surcharges
  const [discountRate, setDiscountRate] = useState<number>(invoiceToEdit ? invoiceToEdit.discountRate : 0);
  const [coldChainPackagingFee, setColdChainPackagingFee] = useState<number>(
    invoiceToEdit ? invoiceToEdit.coldChainPackagingFee : 35.00
  );
  const [deliveryFreightFee, setDeliveryFreightFee] = useState<number>(
    invoiceToEdit ? invoiceToEdit.deliveryFreightFee : 45.00
  );
  const [taxRate, setTaxRate] = useState<number>(
    invoiceToEdit ? (invoiceToEdit.subtotal > 0 ? (invoiceToEdit.taxAmount / invoiceToEdit.subtotal) * 100 : profile.defaultTaxRate) : profile.defaultTaxRate
  );
  const [amountPaid, setAmountPaid] = useState<number>(invoiceToEdit ? invoiceToEdit.amountPaid : 0);
  const [paymentInstructions, setPaymentInstructions] = useState(
    invoiceToEdit ? invoiceToEdit.paymentInstructions : `ACH / Wire to ${profile.bankName}. Ref: ${invoiceNumber}`
  );
  const [notesTerms, setNotesTerms] = useState(
    invoiceToEdit ? invoiceToEdit.notesTerms : profile.defaultNotes
  );

  // New Client Quick-Add Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientBusiness, setNewClientBusiness] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBillingAddress, setNewClientBillingAddress] = useState('');
  const [newClientDeliveryAddress, setNewClientDeliveryAddress] = useState('');

  // Handle Client Change from dropdown
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientBusiness(found.businessName);
      setClientEmail(found.email);
      setClientPhone(found.phone);
      setClientBillingAddress(found.billingAddress);
      setClientDeliveryAddress(found.deliveryPierOrKitchen);
      setClientTaxNumber(found.taxNumber || '');
      if (found.paymentTerms) {
        setPaymentTerms(found.paymentTerms);
        // update due date
        updateDueDateByTerms(found.paymentTerms, date);
      }
    }
  };

  const updateDueDateByTerms = (terms: string, baseDate: string) => {
    const d = new Date(baseDate);
    if (terms.includes('7')) d.setDate(d.getDate() + 7);
    else if (terms.includes('15')) d.setDate(d.getDate() + 15);
    else if (terms.includes('30')) d.setDate(d.getDate() + 30);
    else if (terms.includes('45')) d.setDate(d.getDate() + 45);
    else if (terms.includes('60')) d.setDate(d.getDate() + 60);
    else if (terms.toLowerCase().includes('receipt') || terms.toLowerCase().includes('cash')) {
      // same date
    } else {
      d.setDate(d.getDate() + 15);
    }
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleTermsChange = (newTerms: string) => {
    setPaymentTerms(newTerms);
    updateDueDateByTerms(newTerms, date);
  };

  // Add Item from Catalog
  const handleAddCatalogItem = (item: SeafoodItem) => {
    const defaultQty = item.minOrderQty || (item.defaultUnit === 'kg' ? 10 : 1);
    const gross = defaultQty * item.unitPrice;
    const newItem: InvoiceLineItem = {
      id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      seafoodItemId: item.id,
      name: item.name,
      category: item.category,
      form: item.form,
      origin: item.catchOrigin,
      batchOrCatchNo: `CATCH-${new Date().getMonth() + 1}${new Date().getDate()}-${item.category.substring(0, 3).toUpperCase()}`,
      unit: item.defaultUnit,
      quantity: defaultQty,
      unitPrice: item.unitPrice,
      discountPercent: 0,
      taxRate: item.taxRate || 0,
      lineTotal: gross,
    };
    setItems((prev) => [...prev, newItem]);
    setShowCatalogPicker(false);
  };

  // Add Custom blank item
  const handleAddCustomItem = () => {
    const newItem: InvoiceLineItem = {
      id: `li-${Date.now()}`,
      name: 'Custom Seafood Item',
      category: 'Fin Fish',
      form: 'Whole / Round',
      origin: 'Ocean Harvest',
      batchOrCatchNo: '',
      unit: 'kg',
      quantity: 10,
      unitPrice: 20.00,
      discountPercent: 0,
      taxRate: 0,
      lineTotal: 200.00,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update line item
  const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Recalculate line total
        const qty = field === 'quantity' ? Number(value) : updated.quantity;
        const price = field === 'unitPrice' ? Number(value) : updated.unitPrice;
        const disc = field === 'discountPercent' ? Number(value) : updated.discountPercent;
        const gross = qty * price;
        const net = gross * (1 - disc / 100);
        updated.lineTotal = Math.max(0, net);
        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Financial calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.lineTotal, 0);
  const discountAmount = (subtotal * Number(discountRate || 0)) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableBase * Number(taxRate || 0)) / 100;
  const total = Math.max(
    0,
    subtotal - discountAmount + taxAmount + Number(coldChainPackagingFee || 0) + Number(deliveryFreightFee || 0)
  );
  const balanceDue = Math.max(0, total - Number(amountPaid || 0));

  // Current calculated invoice object for live document preview
  const currentInvoiceData: Invoice = {
    id: invoiceToEdit ? invoiceToEdit.id : `inv-${Date.now()}`,
    invoiceNumber,
    date,
    dueDate,
    status: balanceDue <= 0.001 ? 'paid' : status,
    clientId: selectedClientId,
    clientName,
    clientBusiness,
    clientEmail,
    clientPhone,
    clientBillingAddress,
    clientDeliveryAddress,
    clientTaxNumber,
    vesselOrDockRef,
    poNumber,
    catchDate,
    temperatureAtDispatch,
    items,
    subtotal,
    discountRate: Number(discountRate || 0),
    discountAmount,
    taxAmount,
    coldChainPackagingFee: Number(coldChainPackagingFee || 0),
    deliveryFreightFee: Number(deliveryFreightFee || 0),
    total,
    amountPaid: Number(amountPaid || 0),
    balanceDue,
    paymentTerms,
    paymentInstructions,
    notesTerms,
    currencySymbol: profile.currencySymbol || '$',
    currencyCode: profile.currencyCode || 'USD',
    createdAt: invoiceToEdit ? invoiceToEdit.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSave = () => {
    if (!invoiceNumber.trim()) {
      alert('Please provide an invoice number.');
      return;
    }
    if (!clientBusiness && !clientName) {
      alert('Please specify the client name or business.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item to the invoice.');
      return;
    }

    onSave(currentInvoiceData);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = () => {
    setAmountPaid(total);
    setStatus('paid');
  };

  const handleCreateQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientBusiness.trim() && !newClientName.trim()) return;

    const newCli: Client = {
      id: `cli-${Date.now()}`,
      name: newClientName,
      businessName: newClientBusiness,
      category: 'Fine Dining Restaurant',
      email: newClientEmail,
      phone: newClientPhone,
      billingAddress: newClientBillingAddress,
      deliveryPierOrKitchen: newClientDeliveryAddress || newClientBillingAddress,
      paymentTerms: 'Net 15 Days',
    };

    if (onClientAdd) {
      onClientAdd(newCli);
    }
    setSelectedClientId(newCli.id);
    setClientName(newCli.name);
    setClientBusiness(newCli.businessName);
    setClientEmail(newCli.email);
    setClientPhone(newCli.phone);
    setClientBillingAddress(newCli.billingAddress);
    setClientDeliveryAddress(newCli.deliveryPierOrKitchen);
    setQuickClientModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (no-print) */}
      <div className="no-print bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </button>
          <div>
            <span className="text-xs text-slate-500">
              {isEditing ? 'Editing Invoice' : 'New Seafood Invoice'}
            </span>
            <h2 className="text-base font-bold text-slate-900 font-mono">
              {invoiceNumber}
            </h2>
          </div>
        </div>

        {/* View Mode & Primary Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Segmented View Control */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'editor'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Invoice Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document Preview</span>
            </button>
          </div>

          {/* Quick Mark Paid */}
          {balanceDue > 0 && (
            <button
              type="button"
              onClick={handleMarkAsPaid}
              className="px-3 py-2 text-xs font-semibold border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark Paid</span>
            </button>
          )}

          {/* Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 border border-slate-300 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / PDF</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-cyan-400" />
            <span>Save & Issue Invoice</span>
          </button>
        </div>
      </div>

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Invoice <strong>{invoiceNumber}</strong> saved successfully! Ready for printing or dispatch.</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(false)}
            className="text-emerald-700 hover:text-emerald-950 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode 1: Editor View */}
      {viewMode === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
          {/* Main Form (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Invoice & Client Card */}
            <div className="bg-white border border-slate-200 p-6 space-y-6">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-cyan-700" />
                  Client & Consignee Details
                </h3>
                <button
                  type="button"
                  onClick={() => setQuickClientModal(true)}
                  className="text-xs font-semibold text-cyan-800 hover:text-cyan-950 hover:underline"
                >
                  + Add New Client
                </button>
              </div>

              {/* Client Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Client Account
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full text-xs border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:border-slate-800"
                  >
                    <option value="">-- Manual Client Entry --</option>
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.businessName} ({cli.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Restaurant / Business Name
                  </label>
                  <input
                    type="text"
                    value={clientBusiness}
                    onChange={(e) => setClientBusiness(e.target.value)}
                    placeholder="e.g., The Mariner Grill & Raw Bar"
                    className="w-full text-xs border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person / Executive Chef
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Chef Julian Ross"
                    className="w-full text-xs border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="kitchen@restaurant.com"
                    className="w-full text-xs border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Phone
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 (207) 555-0199"
                    className="w-full text-xs border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Tax / Resale ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={clientTaxNumber}
                    onChange={(e) => setClientTaxNumber(e.target.value)}
                    placeholder="ME-RES-492019"
                    className="w-full text-xs border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden focus:border-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing Address
                    </label>
                    <textarea
                      rows={2}
                      value={clientBillingAddress}
                      onChange={(e) => setClientBillingAddress(e.target.value)}
                      placeholder="Street, City, State, ZIP"
                      className="w-full text-xs border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Kitchen / Pier Receiving Dock
                    </label>
                    <textarea
                      rows={2}
                      value={clientDeliveryAddress}
                      onChange={(e) => setClientDeliveryAddress(e.target.value)}
                      placeholder="Kitchen service entrance or Cold Dock Stall"
                      className="w-full text-xs border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden focus:border-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Section */}
            <div className="bg-white border border-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Fish className="w-4 h-4 text-cyan-700" />
                    Seafood Catch Line Items ({items.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add fresh ocean fish, crustaceans, and shellfish with weights, units, and rates
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCatalogPicker(!showCatalogPicker)}
                    className="px-3 py-1.5 text-xs font-semibold bg-cyan-50 text-cyan-900 border border-cyan-300 hover:bg-cyan-100 transition-colors flex items-center gap-1.5"
                  >
                    <Fish className="w-3.5 h-3.5" />
                    <span>Quick-Pick Catalog</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Custom Item</span>
                  </button>
                </div>
              </div>

              {/* Quick Catalog Picker Drawer */}
              {showCatalogPicker && (
                <div className="p-4 bg-slate-50 border border-cyan-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase">
                      Select Seafood Item to Insert:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCatalogPicker(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                    {catalog.map((ci) => (
                      <button
                        key={ci.id}
                        type="button"
                        onClick={() => handleAddCatalogItem(ci)}
                        className="text-left p-2.5 bg-white border border-slate-200 hover:border-cyan-600 hover:shadow-xs transition-all text-xs"
                      >
                        <div className="font-semibold text-slate-900 truncate">{ci.name}</div>
                        <div className="text-[11px] text-slate-500 flex justify-between mt-1">
                          <span>{ci.form}</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(ci.unitPrice, profile.currencySymbol)}/{ci.defaultUnit}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items Table / Row List */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* Description */}
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Item #{idx + 1} Description
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            placeholder="e.g., Wild Atlantic Salmon Fillets"
                            className="w-full text-xs font-medium border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900 focus:outline-hidden focus:border-slate-800"
                          />
                        </div>

                        {/* Origin / Batch */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Catch Origin
                          </label>
                          <input
                            type="text"
                            value={item.origin || ''}
                            onChange={(e) => handleItemChange(item.id, 'origin', e.target.value)}
                            placeholder="Gulf of Maine"
                            className="w-full text-xs border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900 focus:outline-hidden"
                          />
                        </div>

                        {/* Batch No */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Batch / Tag #
                          </label>
                          <input
                            type="text"
                            value={item.batchOrCatchNo || ''}
                            onChange={(e) => handleItemChange(item.id, 'batchOrCatchNo', e.target.value)}
                            placeholder="CATCH-882"
                            className="w-full text-xs font-mono border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Delete Row */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Numeric Controls Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                          Unit
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value as UnitOfMeasure)}
                          className="w-full text-xs border border-slate-300 px-2 py-1 bg-white text-slate-800"
                        >
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                          <option value="box (10kg)">box (10kg)</option>
                          <option value="crate (20kg)">crate (20kg)</option>
                          <option value="crate (25kg)">crate (25kg)</option>
                          <option value="dozen">dozen</option>
                          <option value="count">count</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="w-full text-xs font-mono font-medium border border-slate-300 px-2 py-1 bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                          Unit Price ({profile.currencySymbol})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          className="w-full text-xs font-mono font-medium border border-slate-300 px-2 py-1 bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                          Disc %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(item.id, 'discountPercent', e.target.value)}
                          className="w-full text-xs font-mono border border-slate-300 px-2 py-1 bg-white text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                          Line Total
                        </label>
                        <div className="py-1 px-2 font-mono font-bold text-slate-900 text-xs bg-slate-100 border border-slate-200 tabular-nums">
                          {formatCurrency(item.lineTotal, profile.currencySymbol)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seafood Logistics & Perishable Traceability */}
            <div className="bg-white border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                <Thermometer className="w-4 h-4 text-cyan-600" />
                Dock Logistics & Cold-Chain Dispatch Specs
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vessel / Pier Loading Berth
                  </label>
                  <input
                    type="text"
                    value={vesselOrDockRef}
                    onChange={(e) => setVesselOrDockRef(e.target.value)}
                    placeholder="Pier 17 Cold Dock / M/V Atlantic Pioneer"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Client Purchase Order (PO #)
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="PO-2026-99"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dispatch Temperature Log
                  </label>
                  <input
                    type="text"
                    value={temperatureAtDispatch}
                    onChange={(e) => setTemperatureAtDispatch(e.target.value)}
                    placeholder="1.0°C (Ice Flake Pack)"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harvest / Catch Date
                  </label>
                  <input
                    type="date"
                    value={catchDate}
                    onChange={(e) => setCatchDate(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="bg-white border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
                Payment Remittance Advice & Terms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Instructions (Bank/Wire/UPI)
                  </label>
                  <textarea
                    rows={3}
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Perishable Quality & Acceptance Terms
                  </label>
                  <textarea
                    rows={3}
                    value={notesTerms}
                    onChange={(e) => setNotesTerms(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Invoicing Metadata & Financial Summary (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Invoice Meta Settings */}
            <div className="bg-white border border-slate-200 p-5 space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
                Invoice Details
              </h4>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      updateDueDateByTerms(paymentTerms, e.target.value);
                    }}
                    className="w-full border border-slate-300 px-2 py-1.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-slate-300 px-2 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => handleTermsChange(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 bg-white text-slate-900"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7 Days">Net 7 Days</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 45 Days">Net 45 Days</option>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Invoice['status'])}
                  className="w-full border border-slate-300 px-3 py-2 bg-white text-slate-900 font-medium"
                >
                  <option value="pending">Pending (Unpaid)</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Calculations & Fees Card */}
            <div className="bg-white border border-slate-200 p-5 space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
                Fees & Settlement
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(subtotal, profile.currencySymbol)}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Volume Discount (%):</span>
                    <span className="font-mono text-emerald-700">
                      -{formatCurrency(discountAmount, profile.currencySymbol)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                    className="w-full border border-slate-300 px-2 py-1 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Crushed Ice & Insulated Crates:</span>
                    <span className="font-mono">
                      +{formatCurrency(Number(coldChainPackagingFee || 0), profile.currencySymbol)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={coldChainPackagingFee}
                    onChange={(e) => setColdChainPackagingFee(Number(e.target.value))}
                    className="w-full border border-slate-300 px-2 py-1 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Refrigerated Freight / Delivery:</span>
                    <span className="font-mono">
                      +{formatCurrency(Number(deliveryFreightFee || 0), profile.currencySymbol)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryFreightFee}
                    onChange={(e) => setDeliveryFreightFee(Number(e.target.value))}
                    className="w-full border border-slate-300 px-2 py-1 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Sales Tax / VAT (%):</span>
                    <span className="font-mono">
                      +{formatCurrency(taxAmount, profile.currencySymbol)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full border border-slate-300 px-2 py-1 font-mono text-slate-900"
                  />
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-300">
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-900 text-white font-bold">
                    <span className="uppercase tracking-wider">Invoice Total:</span>
                    <span className="font-mono text-base tabular-nums text-cyan-300">
                      {formatCurrency(total, profile.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Amount Paid & Balance Due */}
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Amount Paid So Far ({profile.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full border border-slate-300 px-2 py-1 font-mono font-bold text-emerald-800"
                    />
                  </div>

                  <div className="flex justify-between items-center py-2 px-3 bg-slate-100 border border-slate-200">
                    <span className="font-bold text-slate-900 uppercase">Balance Due:</span>
                    <span
                      className={`font-mono font-bold text-sm tabular-nums ${
                        balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(balanceDue, profile.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-2.5 bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-cyan-400" />
                  <span>Save Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className="w-full py-2 bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>View Printable Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Full Document Preview (Always used for window.print() and previewing) */}
      <div className={viewMode === 'preview' ? 'block' : 'hidden print:block'}>
        <InvoiceDocument
          invoice={currentInvoiceData}
          profile={profile}
          isPrintPreview={true}
        />
      </div>

      {/* Quick Add Client Modal */}
      {quickClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Quick-Add Client / Restaurant
              </h3>
              <button
                type="button"
                onClick={() => setQuickClientModal(false)}
                className="text-slate-400 hover:text-slate-700 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickClient} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Restaurant / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientBusiness}
                  onChange={(e) => setNewClientBusiness(e.target.value)}
                  placeholder="e.g. Marina Wharf Fine Dining"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Person / Head Chef
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Chef Marco Silva"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="chef@restaurant.com"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+1 555-0182"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={newClientBillingAddress}
                  onChange={(e) => setNewClientBillingAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickClientModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Add & Auto-Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
