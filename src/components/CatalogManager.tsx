import React, { useState } from 'react';
import { SeafoodItem, SeafoodCategory, SeafoodForm, StorageTemp, UnitOfMeasure, BusinessProfile } from '../types/billing';
import { formatCurrency } from '../utils/storage';
import {
  Fish,
  Plus,
  Search,
  Edit2,
  Trash2,
  Thermometer,
  Shield,
  Layers,
  MapPin,
  Check,
} from 'lucide-react';

interface CatalogManagerProps {
  catalog: SeafoodItem[];
  profile: BusinessProfile;
  onUpdateCatalog: (items: SeafoodItem[]) => void;
  onSelectForInvoice?: (item: SeafoodItem) => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  catalog,
  profile,
  onUpdateCatalog,
  onSelectForInvoice,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | SeafoodCategory>('All');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SeafoodItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [category, setCategory] = useState<SeafoodCategory>('Fin Fish');
  const [form, setForm] = useState<SeafoodForm>('Whole / Round');
  const [storageTemp, setStorageTemp] = useState<StorageTemp>('Fresh on Ice (0°C to 2°C)');
  const [catchOrigin, setCatchOrigin] = useState('');
  const [defaultUnit, setDefaultUnit] = useState<UnitOfMeasure>('kg');
  const [unitPrice, setUnitPrice] = useState<number>(20);
  const [minOrderQty, setMinOrderQty] = useState<number>(5);

  const openNewItemModal = () => {
    setEditingItem(null);
    setName('');
    setScientificName('');
    setCategory('Fin Fish');
    setForm('Whole / Round');
    setStorageTemp('Fresh on Ice (0°C to 2°C)');
    setCatchOrigin('North Atlantic');
    setDefaultUnit('kg');
    setUnitPrice(22.00);
    setMinOrderQty(5);
    setShowItemModal(true);
  };

  const openEditModal = (item: SeafoodItem) => {
    setEditingItem(item);
    setName(item.name);
    setScientificName(item.scientificName || '');
    setCategory(item.category);
    setForm(item.form);
    setStorageTemp(item.storageTemp);
    setCatchOrigin(item.catchOrigin);
    setDefaultUnit(item.defaultUnit);
    setUnitPrice(item.unitPrice);
    setMinOrderQty(item.minOrderQty || 1);
    setShowItemModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      const updated = catalog.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name,
              scientificName,
              category,
              form,
              storageTemp,
              catchOrigin,
              defaultUnit,
              unitPrice: Number(unitPrice),
              minOrderQty: Number(minOrderQty),
            }
          : item
      );
      onUpdateCatalog(updated);
    } else {
      const newItem: SeafoodItem = {
        id: `sea-${Date.now()}`,
        name,
        scientificName,
        category,
        form,
        storageTemp,
        catchOrigin,
        defaultUnit,
        unitPrice: Number(unitPrice),
        taxRate: 0,
        inStock: true,
        minOrderQty: Number(minOrderQty),
      };
      onUpdateCatalog([newItem, ...catalog]);
    }
    setShowItemModal(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Remove this seafood item from catalog?')) {
      onUpdateCatalog(catalog.filter((i) => i.id !== id));
    }
  };

  const handleToggleStock = (id: string) => {
    onUpdateCatalog(
      catalog.map((i) => (i.id === id ? { ...i, inStock: !i.inStock } : i))
    );
  };

  const filteredCatalog = catalog.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.scientificName && item.scientificName.toLowerCase().includes(q)) ||
      item.catchOrigin.toLowerCase().includes(q) ||
      item.form.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Fish className="w-5 h-5 text-cyan-700" />
            Fresh Catch & Seafood Price Sheet
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard market wholesale catalog for rapid quote generation, weight calibration, and cold-chain logging.
          </p>
        </div>

        <button
          onClick={openNewItemModal}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start md:self-auto shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>+ Add Seafood Species</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fish species, lobster, prawns, origin..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 text-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {filteredCatalog.length} species available
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 text-xs">
          {(['All', 'Fin Fish', 'Crustaceans', 'Mollusks / Shellfish', 'Cephalopods', 'Smoked & Prepared'] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2.5 px-3">Species / Commercial Name</th>
                <th className="py-2.5 px-3">Form & Processing</th>
                <th className="py-2.5 px-3">Catch Origin</th>
                <th className="py-2.5 px-3">Storage Temp</th>
                <th className="py-2.5 px-3 text-right">Standard Rate</th>
                <th className="py-2.5 px-3">Availability</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCatalog.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    {item.scientificName && (
                      <div className="text-[11px] text-slate-400 italic">
                        {item.scientificName} · {item.category}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <div>{item.form}</div>
                    <div className="text-[10px] text-slate-400">Min. order: {item.minOrderQty || 1} {item.defaultUnit}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {item.catchOrigin}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Thermometer className="w-3 h-3 text-cyan-600 shrink-0" />
                      {item.storageTemp}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 tabular-nums">
                    {formatCurrency(item.unitPrice, profile.currencySymbol)}
                    <span className="text-slate-400 text-[11px] font-normal"> / {item.defaultUnit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleStock(item.id)}
                      className={`text-[11px] font-medium px-2 py-0.5 border ${
                        item.inStock
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-slate-500 bg-slate-100 border-slate-200 line-through'
                      }`}
                    >
                      {item.inStock ? 'In Stock' : 'Out of Season'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
                        title="Edit Price & Specs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete from Catalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {editingItem ? 'Edit Seafood Species' : 'Add New Seafood Species'}
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-slate-700 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product / Commercial Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yellowfin Tuna Loin (Sashimi Grade)"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scientific Name (Optional)
                </label>
                <input
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  placeholder="e.g. Thunnus albacares"
                  className="w-full border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SeafoodCategory)}
                    className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900"
                  >
                    <option value="Fin Fish">Fin Fish</option>
                    <option value="Crustaceans">Crustaceans</option>
                    <option value="Mollusks / Shellfish">Mollusks / Shellfish</option>
                    <option value="Cephalopods">Cephalopods</option>
                    <option value="Smoked & Prepared">Smoked & Prepared</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Form / Processing</label>
                  <select
                    value={form}
                    onChange={(e) => setForm(e.target.value as SeafoodForm)}
                    className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900"
                  >
                    <option value="Whole / Round">Whole / Round</option>
                    <option value="Fillet (Skin-on)">Fillet (Skin-on)</option>
                    <option value="Fillet (Skinless)">Fillet (Skinless)</option>
                    <option value="Steaks">Steaks</option>
                    <option value="Live">Live</option>
                    <option value="IQF Blast Frozen">IQF Blast Frozen</option>
                    <option value="Shucked">Shucked</option>
                    <option value="Cleaned Tubes & Tentacles">Cleaned Tubes & Tentacles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Unit</label>
                  <select
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value as UnitOfMeasure)}
                    className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900"
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Standard Wholesale Rate ({profile.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catch Origin</label>
                  <input
                    type="text"
                    value={catchOrigin}
                    onChange={(e) => setCatchOrigin(e.target.value)}
                    placeholder="e.g. Casco Bay, Maine"
                    className="w-full border border-slate-300 px-3 py-1.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage Spec</label>
                  <select
                    value={storageTemp}
                    onChange={(e) => setStorageTemp(e.target.value as StorageTemp)}
                    className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900"
                  >
                    <option value="Fresh on Ice (0°C to 2°C)">Fresh on Ice (0°C to 2°C)</option>
                    <option value="Super-chilled (-1°C)">Super-chilled (-1°C)</option>
                    <option value="Deep Frozen (-18°C)">Deep Frozen (-18°C)</option>
                    <option value="Aerated Live Tank">Aerated Live Tank</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  {editingItem ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
