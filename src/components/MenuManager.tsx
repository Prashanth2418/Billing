import React, { useState } from 'react';
import { MenuItem, MenuCategory, RestaurantSettings } from '../types/restaurant';
import { formatPrice } from '../utils/restaurantStorage';
import { Plus, Search, Edit2, Trash2, Utensils, Check, X, AlertTriangle } from 'lucide-react';

interface MenuManagerProps {
  menu: MenuItem[];
  settings: RestaurantSettings;
  onUpdateMenu: (menu: MenuItem[]) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  menu,
  settings,
  onUpdateMenu,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('Starters & Crispy Fry');
  const [price, setPrice] = useState<number>(300);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openNewModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Starters & Crispy Fry');
    setPrice(320);
    setDescription('');
    setBadge('');
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setDescription(item.description || '');
    setBadge(item.badge || '');
    setShowModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      const updated = menu.map((m) =>
        m.id === editingItem.id
          ? {
              ...m,
              name: name.trim(),
              category,
              price: Number(price),
              description: description.trim(),
              badge: badge.trim(),
            }
          : m
      );
      onUpdateMenu(updated);
      showToast(`Updated "${name.trim()}" successfully.`);
    } else {
      const newItem: MenuItem = {
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        category,
        price: Number(price),
        inStock: true,
        description: description.trim(),
        badge: badge.trim(),
      };
      onUpdateMenu([newItem, ...menu]);
      showToast(`Added "${name.trim()}" to menu.`);
    }
    setShowModal(false);
  };

  const handleToggleStock = (id: string) => {
    const updated = menu.map((m) => (m.id === id ? { ...m, inStock: !m.inStock } : m));
    onUpdateMenu(updated);
  };

  // Perform the actual delete without relying on browser confirm()
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const deletedName = itemToDelete.name;
    const updated = menu.filter((m) => m.id !== itemToDelete.id);
    onUpdateMenu(updated);
    setItemToDelete(null);
    if (editingItem && editingItem.id === itemToDelete.id) {
      setShowModal(false);
    }
    showToast(`Deleted "${deletedName}" from menu.`);
  };

  const filteredMenu = menu.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    return (
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 no-print">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-4 h-4 text-cyan-700" />
            Seafood Restaurant Menu & Rates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly adjust daily seafood prices, add fresh catch specials, or remove dishes.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>+ Add Dish</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white border border-slate-200 p-3 space-y-2 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dish name or description..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 text-slate-900 focus:outline-hidden"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {filteredMenu.length} dishes in menu
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 text-xs pt-1 border-t border-slate-100">
          {(
            [
              'All',
              'Starters & Crispy Fry',
              'Main Seafood Curries',
              'Tawa & Ghee Roasts',
              'Biryani, Rice & Breads',
              'Soups & Platters',
              'Beverages & Desserts',
            ] as MenuCategory[]
          ).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                categoryFilter === c
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2.5 px-3">Dish Name & Badge</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMenu.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No dishes found. Click "+ Add Dish" to create one.
                  </td>
                </tr>
              ) : (
                filteredMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-950 text-xs">{item.name}</div>
                      {item.badge && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] max-w-sm truncate">
                      {item.description || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 text-sm tabular-nums">
                      {formatPrice(item.price, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleStock(item.id)}
                        className={`px-2 py-0.5 text-[10px] font-semibold border ${
                          item.inStock
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {item.inStock ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors rounded-xs"
                          title="Edit Dish & Price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors rounded-xs"
                          title="Delete Dish from Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal (Reliable, no browser confirm()) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-300 max-w-sm w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  Delete Dish from Menu?
                </h3>
                <p className="text-slate-600 mt-1 text-xs">
                  Are you sure you want to remove <strong className="text-slate-900 font-bold">"{itemToDelete.name}"</strong>?
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  This dish will immediately be removed from the POS billing screen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 uppercase">
                {editingItem ? 'Edit Dish & Price' : 'Add New Seafood Dish'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dish / Seafood Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Surmai Tawa Fry"
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MenuCategory)}
                    className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900 focus:outline-hidden"
                  >
                    <option value="Starters & Crispy Fry">Starters & Crispy Fry</option>
                    <option value="Main Seafood Curries">Main Seafood Curries</option>
                    <option value="Tawa & Ghee Roasts">Tawa & Ghee Roasts</option>
                    <option value="Biryani, Rice & Breads">Biryani, Rice & Breads</option>
                    <option value="Soups & Platters">Soups & Platters</option>
                    <option value="Beverages & Desserts">Beverages & Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 font-mono font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Special Badge (Optional)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Bestseller, Chef's Special, Fresh Catch"
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Ingredients
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Fresh slice marinated in spices and tawa fried..."
                  className="w-full border border-slate-300 px-3 py-1.5 text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      setItemToDelete(editingItem);
                    }}
                    className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete this dish</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white font-semibold hover:bg-slate-800 shadow-xs"
                  >
                    {editingItem ? 'Save Changes' : 'Add Dish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
