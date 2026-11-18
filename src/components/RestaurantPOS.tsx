import React, { useState, useMemo, useEffect } from 'react';
import {
  MenuItem,
  OrderLineItem,
  RestaurantOrder,
  RestaurantSettings,
  OrderType,
  PaymentMethod,
  MenuCategory,
} from '../types/restaurant';
import { formatPrice } from '../utils/restaurantStorage';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Save,
  RotateCcw,
  Utensils,
  ShoppingBag,
  Layers,
  Tag,
} from 'lucide-react';

interface RestaurantPOSProps {
  menu: MenuItem[];
  settings: RestaurantSettings;
  activeOrderToEdit?: RestaurantOrder | null;
  allActiveOrders?: RestaurantOrder[];
  onSettleAndPrint: (order: RestaurantOrder) => void;
  onSaveActiveTableOrder: (order: RestaurantOrder) => void;
  onClearOrder: () => void;
  onSelectExistingOrder?: (order: RestaurantOrder) => void;
  onStartNewBillOnTable?: (tableNumber: string) => void;
}

export const RestaurantPOS: React.FC<RestaurantPOSProps> = ({
  menu,
  settings,
  activeOrderToEdit,
  allActiveOrders = [],
  onSettleAndPrint,
  onSaveActiveTableOrder,
  onClearOrder,
  onSelectExistingOrder,
  onStartNewBillOnTable,
}) => {
  // POS Order Form State
  const [orderType, setOrderType] = useState<OrderType>(
    activeOrderToEdit ? activeOrderToEdit.orderType : 'Dine-In'
  );
  const [tableNumber, setTableNumber] = useState<string>(
    activeOrderToEdit ? activeOrderToEdit.tableNumber : 'Table 1'
  );
  const [billLabel, setBillLabel] = useState<string>(
    activeOrderToEdit?.billLabel || 'Bill 1'
  );
  const [customerName, setCustomerName] = useState<string>(
    activeOrderToEdit ? activeOrderToEdit.customerName || '' : ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    activeOrderToEdit ? activeOrderToEdit.customerPhone || '' : ''
  );

  const [cartItems, setCartItems] = useState<OrderLineItem[]>(
    activeOrderToEdit ? activeOrderToEdit.items : []
  );

  const [discountPercent, setDiscountPercent] = useState<number>(
    activeOrderToEdit ? activeOrderToEdit.discountPercent : 0
  );
  const [enableTaxOnOrder, setEnableTaxOnOrder] = useState<boolean>(settings.enableTax);
  const [parcelCharge, setParcelCharge] = useState<number>(
    activeOrderToEdit
      ? activeOrderToEdit.parcelCharge
      : orderType === 'Takeaway'
      ? settings.defaultParcelCharge
      : 0
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    activeOrderToEdit ? activeOrderToEdit.paymentMethod : 'UPI / QR'
  );

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('All');
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState(250);
  const [cartError, setCartError] = useState<string | null>(null);

  // Sync state when activeOrderToEdit changes
  useEffect(() => {
    if (activeOrderToEdit) {
      setOrderType(activeOrderToEdit.orderType);
      setTableNumber(activeOrderToEdit.tableNumber);
      setBillLabel(activeOrderToEdit.billLabel || 'Bill 1');
      setCustomerName(activeOrderToEdit.customerName || '');
      setCustomerPhone(activeOrderToEdit.customerPhone || '');
      setCartItems(activeOrderToEdit.items || []);
      setDiscountPercent(activeOrderToEdit.discountPercent || 0);
      setParcelCharge(activeOrderToEdit.parcelCharge || 0);
      setPaymentMethod(activeOrderToEdit.paymentMethod || 'UPI / QR');
    }
  }, [activeOrderToEdit]);

  // When orderType toggles, adjust default parcel charge
  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'Takeaway' || type === 'Delivery') {
      setParcelCharge(settings.defaultParcelCharge);
      if (tableNumber.startsWith('Table')) {
        setTableNumber(type === 'Takeaway' ? 'Takeaway #1' : 'Delivery');
      }
    } else {
      setParcelCharge(0);
      if (!tableNumber.startsWith('Table')) {
        setTableNumber('Table 1');
      }
    }
  };

  // Find all active bills currently on this selected table
  const activeBillsForThisTable = useMemo(() => {
    if (orderType !== 'Dine-In') return [];
    return allActiveOrders.filter(
      (o) => o.tableNumber === tableNumber && o.status === 'Active'
    );
  }, [allActiveOrders, tableNumber, orderType]);

  // Add Item to Cart
  const handleAddItem = (item: MenuItem) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.menuItemId === item.id);
      if (existingIdx > -1) {
        return prev.map((ci, idx) =>
          idx === existingIdx
            ? {
                ...ci,
                quantity: ci.quantity + 1,
                total: (ci.quantity + 1) * ci.price,
              }
            : ci
        );
      }
      return [
        ...prev,
        {
          id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          total: item.price,
        },
      ];
    });
  };

  // Increment/Decrement/Remove Item
  const handleQtyChange = (lineId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.id === lineId) {
            const newQty = ci.quantity + delta;
            return newQty > 0
              ? { ...ci, quantity: newQty, total: newQty * ci.price }
              : null;
          }
          return ci;
        })
        .filter(Boolean) as OrderLineItem[]
    );
  };

  const handleRemoveLine = (lineId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.id !== lineId));
  };

  const handleUpdateNote = (lineId: string, note: string) => {
    setCartItems((prev) =>
      prev.map((ci) => (ci.id === lineId ? { ...ci, specialNote: note } : ci))
    );
  };

  // Add Custom Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    const newItem: OrderLineItem = {
      id: `li-custom-${Date.now()}`,
      menuItemId: `custom-${Date.now()}`,
      name: customItemName,
      price: Number(customItemPrice),
      quantity: 1,
      total: Number(customItemPrice),
    };
    setCartItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemPrice(250);
    setCustomItemModal(false);
  };

  // Calculations
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.total, 0),
    [cartItems]
  );
  const discountAmount = useMemo(
    () => (subtotal * discountPercent) / 100,
    [subtotal, discountPercent]
  );
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = useMemo(
    () => (enableTaxOnOrder ? (taxableBase * settings.taxRatePercent) / 100 : 0),
    [taxableBase, enableTaxOnOrder, settings.taxRatePercent]
  );
  const grandTotal = Math.round(
    taxableBase + taxAmount + (orderType !== 'Dine-In' ? parcelCharge : 0)
  );

  // Construct current Order
  const currentOrderData: RestaurantOrder = {
    id: activeOrderToEdit ? activeOrderToEdit.id : `ord-${Date.now()}`,
    billNumber: activeOrderToEdit ? activeOrderToEdit.billNumber : 'SF-NEW',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    orderType,
    tableNumber,
    billLabel: billLabel.trim() || 'Bill 1',
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    items: cartItems,
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent: enableTaxOnOrder ? settings.taxRatePercent : 0,
    taxAmount,
    parcelCharge: orderType !== 'Dine-In' ? parcelCharge : 0,
    total: grandTotal,
    paymentMethod,
    paymentStatus: 'Paid',
    status: 'Settled',
    cashierName: settings.cashierName,
    createdAt: activeOrderToEdit ? activeOrderToEdit.createdAt : new Date().toISOString(),
  };

  const handleSettleAndPrintClick = () => {
    if (cartItems.length === 0) {
      setCartError('Please tap at least one dish from the menu to add to this bill.');
      setTimeout(() => setCartError(null), 3500);
      return;
    }
    setCartError(null);
    onSettleAndPrint({
      ...currentOrderData,
      status: 'Settled',
      paymentStatus: 'Paid',
      settledAt: new Date().toISOString(),
    });
  };

  const handleSaveActiveClick = () => {
    if (cartItems.length === 0) {
      setCartError('Please tap dishes to hold on the table.');
      setTimeout(() => setCartError(null), 3500);
      return;
    }
    setCartError(null);
    onSaveActiveTableOrder({
      ...currentOrderData,
      status: 'Active',
      paymentStatus: 'Unpaid',
    });
  };

  // Filter Menu Items
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [menu, selectedCategory, searchQuery]);

  const categories: MenuCategory[] = [
    'All',
    'Starters & Crispy Fry',
    'Main Seafood Curries',
    'Tawa & Ghee Roasts',
    'Biryani, Rice & Breads',
    'Soups & Platters',
    'Beverages & Desserts',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
      {/* LEFT: Menu & Seafood Dishes (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Custom Dish Bar */}
        <div className="bg-white border border-slate-200 p-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fish fry, prawns, curry, crab, neer dosa..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-hidden"
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

          <button
            onClick={() => setCustomItemModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Custom Dish</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Dishes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
          {filteredMenu.map((item) => {
            const inCart = cartItems.find((ci) => ci.menuItemId === item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddItem(item)}
                className={`text-left p-3 bg-white border transition-all flex flex-col justify-between relative group hover:shadow-xs active:scale-98 ${
                  inCart ? 'border-cyan-600 ring-1 ring-cyan-600' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                {/* Quantity Badge if in cart */}
                {inCart && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-cyan-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                    {inCart.quantity}
                  </span>
                )}

                <div>
                  {item.badge && (
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                      {item.badge}
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-950 text-sm tabular-nums">
                    {formatPrice(item.price, settings.currencySymbol)}
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    + Add
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Current Guest Bill & Settle Panel (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div className="space-y-4">
          {/* Order Type & Table Control */}
          <div className="space-y-2.5 pb-3 border-b border-slate-200">
            {/* Dine-In vs Takeaway */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleOrderTypeChange('Dine-In')}
                className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
                  orderType === 'Dine-In'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine-In (Table)</span>
              </button>

              <button
                type="button"
                onClick={() => handleOrderTypeChange('Takeaway')}
                className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
                  orderType === 'Takeaway'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway / Parcel</span>
              </button>
            </div>

            {/* Table Number + Bill Label + Guest Details */}
            {orderType === 'Dine-In' ? (
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                {/* 1. Table Number */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Table
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => {
                      const newTable = e.target.value;
                      setTableNumber(newTable);
                      // Auto calculate bill label for new table
                      const billsOnNewTable = allActiveOrders.filter(
                        (o) => o.tableNumber === newTable && o.status === 'Active'
                      );
                      if (billsOnNewTable.length > 0) {
                        setBillLabel(`Bill ${billsOnNewTable.length + 1}`);
                      } else {
                        setBillLabel('Bill 1');
                      }
                    }}
                    className="w-full text-xs font-bold border border-slate-300 px-2 py-1.5 bg-slate-50 text-slate-900 focus:bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={`Table ${num}`}>
                        Table {num}
                      </option>
                    ))}
                    <option value="VIP Cabin">VIP Cabin</option>
                    <option value="Balcony Sea-View">Balcony Sea-View</option>
                  </select>
                </div>

                {/* 2. Bill Label (e.g. Bill 1, Bill 2, Drinks, etc.) */}
                <div>
                  <label className="block text-[10px] font-semibold text-cyan-800 uppercase mb-0.5 flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />
                    <span>Bill Tab #</span>
                  </label>
                  <input
                    type="text"
                    value={billLabel}
                    onChange={(e) => setBillLabel(e.target.value)}
                    placeholder="e.g. Bill 1, Bill 2"
                    className="w-full text-xs font-bold border border-cyan-400 px-2 py-1.5 text-slate-900 bg-cyan-50/40 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* 3. Guest Name / Phone */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Guest / Phone
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full text-xs border border-slate-300 px-2 py-1.5 text-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Token / Parcel #
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Takeaway #1"
                    className="w-full text-xs font-bold border border-slate-300 px-2 py-1.5 text-slate-900 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Customer Name / Phone
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Optional (e.g. Priya)"
                    className="w-full text-xs border border-slate-300 px-2 py-1.5 text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* MULTI-BILL BAR: If Table 1 (or current table) has multiple active bills */}
            {orderType === 'Dine-In' && activeBillsForThisTable.length > 0 && (
              <div className="bg-amber-50/90 border border-amber-300 p-2.5 rounded-none space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>Active Bills on {tableNumber} ({activeBillsForThisTable.length}):</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (onStartNewBillOnTable) {
                        onStartNewBillOnTable(tableNumber);
                      }
                    }}
                    className="text-[10px] font-bold bg-white border border-amber-400 text-amber-900 px-2 py-0.5 hover:bg-amber-100 flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Plus className="w-3 h-3 text-amber-700" />
                    <span>+ Add Another Bill</span>
                  </button>
                </div>

                {/* Tabs to switch between bills on this table */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeBillsForThisTable.map((b, idx) => {
                    const isSelected = activeOrderToEdit?.id === b.id;
                    const label = b.billLabel || `Bill ${idx + 1}`;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          if (onSelectExistingOrder) {
                            onSelectExistingOrder(b);
                          }
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-bold">{label}</span>
                        <span className="opacity-70 text-[10px] font-mono">({b.billNumber})</span>
                        <span className="font-mono font-bold text-[10px]">
                          {formatPrice(b.total, settings.currencySymbol)}
                        </span>
                      </button>
                    );
                  })}

                  {/* Indicator if current form is a fresh new bill for this table */}
                  {(!activeOrderToEdit || !activeBillsForThisTable.some((b) => b.id === activeOrderToEdit.id)) && (
                    <span className="px-2.5 py-1 text-[11px] font-bold bg-cyan-700 text-white border border-cyan-800 flex items-center gap-1 shadow-xs">
                      <span>Editing New: {billLabel}</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wide">
              <span>
                {tableNumber} ({billLabel}) Items ({cartItems.length})
              </span>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-normal flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="py-10 border border-dashed border-slate-300 text-center text-xs text-slate-400">
                <Utensils className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p>No dishes added yet to {billLabel}.</p>
                <p className="text-[10px] mt-0.5">Tap any seafood dish on the left to add.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {cartItems.map((ci) => (
                  <div
                    key={ci.id}
                    className="p-2 bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 font-semibold text-slate-900 leading-tight">
                        {ci.name}
                      </div>

                      <div className="font-mono font-bold text-slate-950 tabular-nums">
                        {formatPrice(ci.total, settings.currencySymbol)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <div className="text-slate-500">
                        {formatPrice(ci.price, settings.currencySymbol)} each
                      </div>

                      {/* Qty +/- Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(ci.id, -1)}
                          className="w-5 h-5 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-200 text-slate-800 rounded-none"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold font-mono">
                          {ci.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(ci.id, 1)}
                          className="w-5 h-5 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-200 text-slate-800 rounded-none"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(ci.id)}
                          className="ml-1 text-slate-400 hover:text-rose-600"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Kitchen Note */}
                    <input
                      type="text"
                      value={ci.specialNote || ''}
                      onChange={(e) => handleUpdateNote(ci.id, e.target.value)}
                      placeholder="Note: less spicy / extra lemon..."
                      className="text-[10px] italic border-b border-dotted border-slate-300 bg-transparent px-1 py-0.5 text-slate-600 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary & Settlement Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
          {/* Subtotal & Toggles */}
          <div className="space-y-1 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatPrice(subtotal, settings.currencySymbol)}
              </span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span>Discount:</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`px-1.5 py-0.5 border text-[10px] ${
                      discountPercent === d
                        ? 'bg-slate-900 text-white font-bold'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-700">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono tabular-nums">
                  -{formatPrice(discountAmount, settings.currencySymbol)}
                </span>
              </div>
            )}

            {/* Tax toggle */}
            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTaxOnOrder}
                  onChange={(e) => setEnableTaxOnOrder(e.target.checked)}
                  className="rounded-none text-slate-900"
                />
                <span>Restaurant Tax / GST ({settings.taxRatePercent}%)</span>
              </label>
              <span className="font-mono tabular-nums">
                +{formatPrice(taxAmount, settings.currencySymbol)}
              </span>
            </div>

            {orderType !== 'Dine-In' && parcelCharge > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>Parcel Container Fee:</span>
                <span className="font-mono tabular-nums">
                  +{formatPrice(parcelCharge, settings.currencySymbol)}
                </span>
              </div>
            )}
          </div>

          {/* Grand Total Box */}
          <div className="py-2.5 px-3 bg-slate-900 text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider block">
                Total for {tableNumber} ({billLabel}):
              </span>
              <span className="text-[10px] text-slate-400">
                {cartItems.length} items
              </span>
            </div>
            <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
              {formatPrice(grandTotal, settings.currencySymbol)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-1 text-xs">
              {(['Cash', 'UPI / QR', 'Card'] as PaymentMethod[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-1.5 px-2 font-medium border text-center transition-colors ${
                    paymentMethod === mode
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Cart Error Warning */}
          {cartError && (
            <div className="p-2 bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-semibold flex items-center justify-between">
              <span>{cartError}</span>
              <button
                type="button"
                onClick={() => setCartError(null)}
                className="text-rose-600 hover:text-rose-900 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Primary Action: Settle & Print Bill */}
            <button
              type="button"
              onClick={handleSettleAndPrintClick}
              disabled={cartItems.length === 0}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>
                Print Bill & Settle ({tableNumber} · {billLabel}) ({formatPrice(grandTotal, settings.currencySymbol)})
              </span>
            </button>

            {/* Hold Order on Running Table */}
            {orderType === 'Dine-In' && (
              <button
                type="button"
                onClick={handleSaveActiveClick}
                disabled={cartItems.length === 0}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>Save to Running {tableNumber} ({billLabel})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Item Modal */}
      {customItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-300 max-w-sm w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 uppercase">
                Add Custom Seafood Special
              </h3>
              <button
                onClick={() => setCustomItemModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dish / Fish Catch Name *
                </label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g. Fresh Red Snapper Tawa Fry"
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
                />
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
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCustomItemModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Add to Current Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
