import React from 'react';
import { Utensils, Settings, Plus, Printer } from 'lucide-react';

interface HeaderProps {
  currentTab: 'pos' | 'tables' | 'sales' | 'menu';
  onNavigate: (tab: 'pos' | 'tables' | 'sales' | 'menu') => void;
  onOpenSettings: () => void;
  onOpenPrinterModal: () => void;
  onNewBill: () => void;
  restaurantName: string;
  activeTablesCount: number;
  defaultPrinterName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenSettings,
  onOpenPrinterModal,
  onNewBill,
  restaurantName,
  activeTablesCount,
  defaultPrinterName = 'Epson TM-T82 (80mm)',
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Zone 1: Single text element Brand wordmark */}
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 bg-slate-900 text-cyan-400 flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-950 uppercase whitespace-nowrap">
              {restaurantName}
            </span>
          </button>

          {/* Zone 2: 4 clean navigation tabs */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onNavigate('pos')}
              className={`transition-colors whitespace-nowrap py-1 ${
                currentTab === 'pos'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-bold'
                  : 'hover:text-slate-950'
              }`}
            >
              POS Billing
            </button>

            <button
              onClick={() => onNavigate('tables')}
              className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
                currentTab === 'tables'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-bold'
                  : 'hover:text-slate-950'
              }`}
            >
              <span>Dining Tables</span>
              {activeTablesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeTablesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('sales')}
              className={`transition-colors whitespace-nowrap py-1 ${
                currentTab === 'sales'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-bold'
                  : 'hover:text-slate-950'
              }`}
            >
              Sales
            </button>

            <button
              onClick={() => onNavigate('menu')}
              className={`transition-colors whitespace-nowrap py-1 ${
                currentTab === 'menu'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-bold'
                  : 'hover:text-slate-950'
              }`}
            >
              Menu & Rates
            </button>
          </nav>

          {/* Zone 3: Actions including Default Printer Machine indicator */}
          <div className="flex items-center gap-2">
            {/* Connected Default Printer Button */}
            <button
              onClick={onOpenPrinterModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              title="Click to change connected printer machine or set default"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-700" />
              <span className="hidden sm:inline truncate max-w-[140px] text-[11px] font-semibold">
                {defaultPrinterName}
              </span>
            </button>

            {/* Restaurant Profile Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-600 hover:text-slate-950 border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Restaurant Details & Tax Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* New Bill */}
            <button
              onClick={onNewBill}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ New Bill</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between py-1.5 border-t border-slate-100 text-xs font-semibold overflow-x-auto gap-4">
          <button
            onClick={() => onNavigate('pos')}
            className={`whitespace-nowrap px-2 py-1 ${
              currentTab === 'pos' ? 'text-slate-950 font-bold' : 'text-slate-500'
            }`}
          >
            POS Billing
          </button>
          <button
            onClick={() => onNavigate('tables')}
            className={`whitespace-nowrap px-2 py-1 flex items-center gap-1 ${
              currentTab === 'tables' ? 'text-slate-950 font-bold' : 'text-slate-500'
            }`}
          >
            <span>Tables</span>
            {activeTablesCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                {activeTablesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('sales')}
            className={`whitespace-nowrap px-2 py-1 ${
              currentTab === 'sales' ? 'text-slate-950 font-bold' : 'text-slate-500'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => onNavigate('menu')}
            className={`whitespace-nowrap px-2 py-1 ${
              currentTab === 'menu' ? 'text-slate-950 font-bold' : 'text-slate-500'
            }`}
          >
            Menu
          </button>
        </div>
      </div>
    </header>
  );
};
