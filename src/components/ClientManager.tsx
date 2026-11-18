import React, { useState, useMemo } from 'react';
import { Client, Invoice, BusinessProfile } from '../types/billing';
import { formatCurrency } from '../utils/storage';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  FilePlus,
  Phone,
  Mail,
  MapPin,
  Building2,
  Receipt,
} from 'lucide-react';

interface ClientManagerProps {
  clients: Client[];
  invoices: Invoice[];
  profile: BusinessProfile;
  onUpdateClients: (clients: Client[]) => void;
  onNewInvoiceForClient: (client: Client) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  invoices,
  profile,
  onUpdateClients,
  onNewInvoiceForClient,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<Client['category']>('Fine Dining Restaurant');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [deliveryPierOrKitchen, setDeliveryPierOrKitchen] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 15 Days');
  const [notes, setNotes] = useState('');

  // Map client stats from invoices
  const clientStats = useMemo(() => {
    const stats: Record<string, { totalBilled: number; balanceDue: number; invoiceCount: number }> = {};
    clients.forEach((c) => {
      stats[c.id] = { totalBilled: 0, balanceDue: 0, invoiceCount: 0 };
    });

    invoices.forEach((inv) => {
      if (stats[inv.clientId]) {
        stats[inv.clientId].totalBilled += inv.total;
        stats[inv.clientId].balanceDue += inv.balanceDue;
        stats[inv.clientId].invoiceCount += 1;
      }
    });

    return stats;
  }, [clients, invoices]);

  const openNewModal = () => {
    setEditingClient(null);
    setName('');
    setBusinessName('');
    setCategory('Fine Dining Restaurant');
    setEmail('');
    setPhone('');
    setBillingAddress('');
    setDeliveryPierOrKitchen('');
    setTaxNumber('');
    setPaymentTerms('Net 15 Days');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setBusinessName(c.businessName);
    setCategory(c.category);
    setEmail(c.email);
    setPhone(c.phone);
    setBillingAddress(c.billingAddress);
    setDeliveryPierOrKitchen(c.deliveryPierOrKitchen);
    setTaxNumber(c.taxNumber || '');
    setPaymentTerms(c.paymentTerms || 'Net 15 Days');
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() && !name.trim()) return;

    if (editingClient) {
      const updated = clients.map((c) =>
        c.id === editingClient.id
          ? {
              ...c,
              name,
              businessName,
              category,
              email,
              phone,
              billingAddress,
              deliveryPierOrKitchen: deliveryPierOrKitchen || billingAddress,
              taxNumber,
              paymentTerms,
              notes,
            }
          : c
      );
      onUpdateClients(updated);
    } else {
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        name,
        businessName,
        category,
        email,
        phone,
        billingAddress,
        deliveryPierOrKitchen: deliveryPierOrKitchen || billingAddress,
        taxNumber,
        paymentTerms,
        notes,
      };
      onUpdateClients([newClient, ...clients]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this client account?')) {
      onUpdateClients(clients.filter((c) => c.id !== id));
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.businessName.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-700" />
            Wholesale Accounts & Restaurant Clients
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage commercial consignees, delivery receiving docks, tax exemptions, and default credit terms.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start md:self-auto shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>+ Add Client Account</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 p-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurant, chef, email, or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 text-slate-900 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredClients.map((cli) => {
          const stats = clientStats[cli.id] || { totalBilled: 0, balanceDue: 0, invoiceCount: 0 };
          return (
            <div
              key={cli.id}
              className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cli.businessName}</h3>
                    <p className="text-xs text-slate-600 font-medium">{cli.name}</p>
                    <span className="text-[11px] text-slate-400">{cli.category}</span>
                  </div>

                  {/* Quick New Invoice Action */}
                  <button
                    onClick={() => onNewInvoiceForClient(cli)}
                    className="px-2.5 py-1 text-xs font-semibold bg-cyan-50 text-cyan-900 border border-cyan-300 hover:bg-cyan-100 transition-colors flex items-center gap-1 shrink-0"
                    title="Generate invoice for this client"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Bill Client</span>
                  </button>
                </div>

                {/* Contact & Address */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cli.email || 'No email on file'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cli.phone || 'No phone on file'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-500 line-clamp-1">{cli.deliveryPierOrKitchen}</span>
                  </div>
                </div>

                {/* Ledger Quick Summary */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Invoices</div>
                    <div className="font-mono font-bold text-slate-800 tabular-nums">
                      {stats.invoiceCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Billed</div>
                    <div className="font-mono font-bold text-slate-900 tabular-nums text-[11px]">
                      {formatCurrency(stats.totalBilled, profile.currencySymbol)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Balance</div>
                    <div
                      className={`font-mono font-bold tabular-nums text-[11px] ${
                        stats.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(stats.balanceDue, profile.currencySymbol)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  Terms: {cli.paymentTerms}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(cli)}
                    className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                    title="Edit Client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cli.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {editingClient ? 'Edit Client Account' : 'Add New Client / Restaurant'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business / Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Marina Wharf Fine Dining"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Chef / Purchasing Agent
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Chef Julian Ross"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full border border-slate-300 px-2 py-2 bg-white text-slate-900"
                  >
                    <option value="Fine Dining Restaurant">Fine Dining Restaurant</option>
                    <option value="Fishmonger / Market">Fishmonger / Market</option>
                    <option value="Hotel & Resort">Hotel & Resort</option>
                    <option value="Wholesale Distributor">Wholesale Distributor</option>
                    <option value="Catering Co.">Catering Co.</option>
                    <option value="Retail Customer">Retail Customer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kitchen@restaurant.com"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (207) 555-0199"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tax / Resale Exemption #
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="ME-RES-492019"
                    className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Agreed Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full border border-slate-300 px-2 py-2 bg-white text-slate-900"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 7 Days">Net 7 Days</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Official registered company billing address"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Receiving Dock / Kitchen Delivery Entrance
                </label>
                <textarea
                  rows={2}
                  value={deliveryPierOrKitchen}
                  onChange={(e) => setDeliveryPierOrKitchen(e.target.value)}
                  placeholder="Delivery pier, bay #, service door, special delivery instructions"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  {editingClient ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
