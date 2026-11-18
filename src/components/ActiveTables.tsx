import React from 'react';
import { RestaurantOrder, RestaurantSettings } from '../types/restaurant';
import { formatPrice } from '../utils/restaurantStorage';
import { Utensils, Plus, Receipt, Split, Layers, User } from 'lucide-react';

interface ActiveTablesProps {
  activeOrders: RestaurantOrder[];
  settings: RestaurantSettings;
  onSelectTableForBilling: (tableNumber: string, existingOrder?: RestaurantOrder) => void;
  onAddNewBillToTable: (tableNumber: string) => void;
  onQuickSettle: (order: RestaurantOrder) => void;
}

export const ActiveTables: React.FC<ActiveTablesProps> = ({
  activeOrders,
  settings,
  onSelectTableForBilling,
  onAddNewBillToTable,
  onQuickSettle,
}) => {
  const allTables = [
    'Table 1',
    'Table 2',
    'Table 3',
    'Table 4',
    'Table 5',
    'Table 6',
    'Table 7',
    'Table 8',
    'Table 9',
    'Table 10',
    'Table 11',
    'Table 12',
    'VIP Cabin',
    'Balcony Sea-View',
  ];

  // Group active orders by tableNumber
  const tableOrdersMap: Record<string, RestaurantOrder[]> = {};
  allTables.forEach((t) => {
    tableOrdersMap[t] = [];
  });

  activeOrders.forEach((o) => {
    if (tableOrdersMap[o.tableNumber]) {
      tableOrdersMap[o.tableNumber].push(o);
    } else {
      tableOrdersMap[o.tableNumber] = [o];
    }
  });

  const occupiedTables = allTables.filter((t) => (tableOrdersMap[t]?.length || 0) > 0);
  const occupiedCount = occupiedTables.length;
  const totalDineInBills = activeOrders.filter((o) => o.orderType === 'Dine-In').length;
  const takeawayOrders = activeOrders.filter((o) => o.orderType !== 'Dine-In');

  return (
    <div className="space-y-6 no-print">
      {/* Overview Status Bar */}
      <div className="bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-4 h-4 text-cyan-700" />
            Restaurant Tables & Multiple Bills
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any table to bill, or add multiple split bills / separate guest tabs on the same table.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">
              Vacant: <strong>{allTables.length - occupiedCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-900 font-bold">
              Occupied: {occupiedCount} tables ({totalDineInBills} active bills)
            </span>
          </div>
          {takeawayOrders.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <span className="text-slate-900 font-bold">Takeaways: {takeawayOrders.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allTables.map((tableName) => {
          const ordersForTable = tableOrdersMap[tableName] || [];
          const combinedTableTotal = ordersForTable.reduce((sum, o) => sum + o.total, 0);

          // CASE 1: Multiple Bills on this Table (e.g. 2 or more bills on Table 1)
          if (ordersForTable.length > 1) {
            return (
              <div
                key={tableName}
                className="bg-white border-2 border-amber-600 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative rounded-none"
              >
                <div>
                  {/* Header with Multi-Bill Badge */}
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2 bg-amber-50/70 -mx-4 -mt-4 p-3 mb-3">
                    <div>
                      <span className="font-bold text-slate-950 text-sm block">{tableName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Combined: <strong className="text-slate-900">{formatPrice(combinedTableTotal, settings.currencySymbol)}</strong>
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 uppercase tracking-wide border border-amber-300">
                      <Layers className="w-3 h-3" />
                      {ordersForTable.length} Bills
                    </span>
                  </div>

                  {/* Sub-Bills List */}
                  <div className="space-y-2 mb-3">
                    {ordersForTable.map((ord, idx) => {
                      const label = ord.billLabel || `Bill ${idx + 1}`;
                      return (
                        <div
                          key={ord.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs hover:border-slate-400 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-mono">
                                {idx + 1}
                              </span>
                              <span>{label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({ord.billNumber})</span>
                            </span>
                            <span className="font-mono font-bold text-slate-950 text-xs">
                              {formatPrice(ord.total, settings.currencySymbol)}
                            </span>
                          </div>

                          {ord.customerName && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              <span>{ord.customerName}</span>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 truncate">
                            {ord.items.length} items: {ord.items.map((i) => i.name.split('/')[0].trim()).join(', ')}
                          </div>

                          <div className="grid grid-cols-2 gap-1 pt-1.5 mt-1 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => onSelectTableForBilling(tableName, ord)}
                              className="py-1 px-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-semibold text-center transition-colors"
                            >
                              + Add Food
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickSettle(ord)}
                              className="py-1 px-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-semibold text-center transition-colors flex items-center justify-center gap-1"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Print Bill</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Another Bill button */}
                <button
                  type="button"
                  onClick={() => onAddNewBillToTable(tableName)}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-400 text-amber-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Bill (Bill {ordersForTable.length + 1})</span>
                </button>
              </div>
            );
          }

          // CASE 2: Exactly 1 Active Bill on this Table
          if (ordersForTable.length === 1) {
            const singleOrder = ordersForTable[0];
            return (
              <div
                key={tableName}
                className="bg-white border-2 border-amber-500 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative rounded-none"
              >
                <div>
                  {/* Status indicator badge */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold text-slate-950 text-sm block">{tableName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {singleOrder.billLabel || 'Bill 1'} · {singleOrder.billNumber}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 uppercase tracking-wider">
                      Dining
                    </span>
                  </div>

                  {/* Items & running total */}
                  <div className="my-3 space-y-1 text-xs">
                    {singleOrder.customerName && (
                      <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{singleOrder.customerName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Dishes:</span>
                      <span className="font-bold text-slate-900">{singleOrder.items.length} items</span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate">
                      {singleOrder.items.map((i) => i.name.split('/')[0].trim()).join(', ')}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Running Bill:</span>
                      <span className="font-mono font-bold text-base text-slate-950 tabular-nums">
                        {formatPrice(singleOrder.total, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {/* Quick actions for current bill */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectTableForBilling(tableName, singleOrder)}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold text-center transition-colors"
                    >
                      + Add Food
                    </button>

                    <button
                      type="button"
                      onClick={() => onQuickSettle(singleOrder)}
                      className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>Print Bill</span>
                    </button>
                  </div>

                  {/* Button to add second bill on this same table */}
                  <button
                    type="button"
                    onClick={() => onAddNewBillToTable(tableName)}
                    className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 text-amber-900 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add 2nd Bill to {tableName}</span>
                  </button>
                </div>
              </div>
            );
          }

          // CASE 3: Vacant Table
          return (
            <button
              key={tableName}
              type="button"
              onClick={() => onSelectTableForBilling(tableName)}
              className="text-left bg-white border border-slate-200 hover:border-slate-400 p-4 flex flex-col justify-between hover:bg-slate-50/80 transition-all group min-h-[160px]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-slate-800 text-sm group-hover:text-slate-950">
                  {tableName}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 font-semibold">
                  Vacant
                </span>
              </div>

              <div className="text-center py-2 text-slate-400 group-hover:text-cyan-700 text-xs flex flex-col items-center gap-1">
                <Plus className="w-5 h-5 text-slate-300 group-hover:text-cyan-700" />
                <span className="text-[11px] font-semibold">Start New Bill</span>
              </div>

              <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-1">
                Ready for guests
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Takeaways Section */}
      {takeawayOrders.length > 0 && (
        <div className="mt-8 bg-white border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Active Takeaway & Parcel Orders ({takeawayOrders.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {takeawayOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 bg-slate-50 border border-slate-300 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{ord.tableNumber}</div>
                  <div className="text-[11px] text-slate-500">
                    {ord.customerName ? `${ord.customerName} · ` : ''}
                    {ord.items.length} items
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {formatPrice(ord.total, settings.currencySymbol)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTableForBilling(ord.tableNumber, ord)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onQuickSettle(ord)}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold"
                  >
                    Print Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
