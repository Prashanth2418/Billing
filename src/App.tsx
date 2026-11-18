/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  RestaurantOrder,
  RestaurantSettings,
} from './types/restaurant';
import { PrinterDevice, PaperSize, PrinterSettingsState } from './types/printer';
import {
  getStoredRestaurantSettings,
  saveStoredRestaurantSettings,
  getStoredMenuItems,
  saveStoredMenuItems,
  getStoredOrders,
  saveStoredOrders,
  generateNextBillNumber,
} from './utils/restaurantStorage';
import {
  getStoredPrinters,
  saveStoredPrinters,
  getStoredPrinterPrefs,
  saveStoredPrinterPrefs,
} from './utils/printerStorage';
import { INITIAL_ORDERS } from './data/restaurantData';
import { Header } from './components/Header';
import { RestaurantPOS } from './components/RestaurantPOS';
import { RestaurantReceipt } from './components/RestaurantReceipt';
import { ActiveTables } from './components/ActiveTables';
import { OrderHistory } from './components/OrderHistory';
import { MenuManager } from './components/MenuManager';
import { RestaurantSettingsModal } from './components/RestaurantSettingsModal';
import { PrinterSelectModal } from './components/PrinterSelectModal';
import { Utensils, CheckCircle2, Printer } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<RestaurantSettings>(getStoredRestaurantSettings);
  const [menu, setMenu] = useState<MenuItem[]>(getStoredMenuItems);
  const [orders, setOrders] = useState<RestaurantOrder[]>(getStoredOrders);

  // Printer Management State
  const [printers, setPrinters] = useState<PrinterDevice[]>(getStoredPrinters);
  const [printerPrefs, setPrinterPrefs] = useState<PrinterSettingsState>(getStoredPrinterPrefs);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isSettingsOnlyPrinterModal, setIsSettingsOnlyPrinterModal] = useState(false);
  const [pendingPrintOrder, setPendingPrintOrder] = useState<RestaurantOrder | null>(null);

  // Navigation
  const [currentTab, setCurrentTab] = useState<'pos' | 'tables' | 'sales' | 'menu'>('pos');
  const [orderToEdit, setOrderToEdit] = useState<RestaurantOrder | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<RestaurantOrder | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    saveStoredRestaurantSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredMenuItems(menu);
  }, [menu]);

  useEffect(() => {
    saveStoredOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveStoredPrinters(printers);
  }, [printers]);

  useEffect(() => {
    saveStoredPrinterPrefs(printerPrefs);
  }, [printerPrefs]);

  // Active default printer
  const activeDefaultPrinter =
    printers.find((p) => p.id === printerPrefs.selectedPrinterId) ||
    printers.find((p) => p.isDefault) ||
    printers[0];

  // Active / Running Orders (currently dining at tables)
  const activeOrders = orders.filter((o) => o.status === 'Active');

  // Settle and Print Bill handler (called from POS Settle button)
  const handleSettleAndPrint = (settledOrder: RestaurantOrder) => {
    const billNum =
      settledOrder.billNumber && settledOrder.billNumber !== 'SF-NEW'
        ? settledOrder.billNumber
        : generateNextBillNumber(orders);

    const finalOrder: RestaurantOrder = {
      ...settledOrder,
      billNumber: billNum,
      status: 'Settled',
      paymentStatus: 'Paid',
      settledAt: new Date().toISOString(),
    };

    setOrders((prev) => {
      const exists = prev.some((o) => o.id === finalOrder.id);
      if (exists) {
        return prev.map((o) => (o.id === finalOrder.id ? finalOrder : o));
      }
      return [finalOrder, ...prev];
    });

    setOrderToEdit(null);
    setReceiptToPrint(finalOrder);

    // If user has "always ask" or wants to select printer:
    if (printerPrefs.alwaysAskBeforePrinting) {
      setPendingPrintOrder(finalOrder);
      setIsSettingsOnlyPrinterModal(false);
      setIsPrinterModalOpen(true);
    } else {
      setToastNotice(
        `Bill ${finalOrder.billNumber} settled! Printing via default printer: ${activeDefaultPrinter?.name}`
      );
      setTimeout(() => setToastNotice(null), 3500);

      // Auto trigger print
      setTimeout(() => {
        window.print();
      }, 250);
    }
  };

  // When user clicks the "Print Bill" button inside the Receipt modal:
  // We can let them choose the printer or print directly to default!
  const handleOpenPrinterSelectForBill = () => {
    setPendingPrintOrder(receiptToPrint);
    setIsSettingsOnlyPrinterModal(false);
    setIsPrinterModalOpen(true);
  };

  // Called when user selects a printer machine and confirms
  const handlePrinterSelectedAndPrint = (
    chosenPrinter: PrinterDevice,
    setAsDefault: boolean,
    paperWidth: PaperSize,
    copies: number
  ) => {
    if (setAsDefault) {
      // Mark as default across all devices
      const updatedList = printers.map((p) => ({
        ...p,
        isDefault: p.id === chosenPrinter.id,
        paperWidth: p.id === chosenPrinter.id ? paperWidth : p.paperWidth,
        copies: p.id === chosenPrinter.id ? copies : p.copies,
      }));
      setPrinters(updatedList);
      setPrinterPrefs((prev) => ({
        ...prev,
        selectedPrinterId: chosenPrinter.id,
        paperSize: paperWidth,
        copies,
      }));
      setToastNotice(`Printer "${chosenPrinter.name}" set as DEFAULT printer for all bills.`);
    } else {
      setPrinterPrefs((prev) => ({
        ...prev,
        selectedPrinterId: chosenPrinter.id,
        paperSize: paperWidth,
        copies,
      }));
      setToastNotice(`Printing to "${chosenPrinter.name}" (${paperWidth}).`);
    }

    setTimeout(() => setToastNotice(null), 4000);

    // Trigger printing if there was a pending order
    if (pendingPrintOrder || receiptToPrint) {
      setTimeout(() => {
        window.print();
      }, 250);
    }
  };

  // Hold / Running table order handler
  const handleSaveActiveTableOrder = (activeOrder: RestaurantOrder) => {
    const billNum =
      activeOrder.billNumber && activeOrder.billNumber !== 'SF-NEW'
        ? activeOrder.billNumber
        : generateNextBillNumber(orders);

    const updated: RestaurantOrder = {
      ...activeOrder,
      billNumber: billNum,
      status: 'Active',
      paymentStatus: 'Unpaid',
    };

    setOrders((prev) => {
      const exists = prev.some((o) => o.id === updated.id);
      if (exists) {
        return prev.map((o) => (o.id === updated.id ? updated : o));
      }
      return [updated, ...prev];
    });

    setOrderToEdit(null);
    setToastNotice(`Order for ${updated.tableNumber} saved to running tables!`);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Add another bill to an existing table (e.g. Table 1 can have Bill 1, Bill 2, etc.)
  const handleAddNewBillToTable = (tableNumber: string) => {
    const existingBillsOnTable = orders.filter(
      (o) => o.tableNumber === tableNumber && o.status === 'Active'
    );
    const newBillLabel = `Bill ${existingBillsOnTable.length + 1}`;
    const newOrder: RestaurantOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      billNumber: generateNextBillNumber(orders),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderType: tableNumber.startsWith('Table') ? 'Dine-In' : 'Takeaway',
      tableNumber,
      billLabel: newBillLabel,
      items: [],
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: settings.enableTax ? settings.taxRatePercent : 0,
      taxAmount: 0,
      parcelCharge: 0,
      total: 0,
      paymentMethod: 'UPI / QR',
      paymentStatus: 'Unpaid',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    setOrderToEdit(newOrder);
    setCurrentTab('pos');
    setToastNotice(`Started new bill (${newBillLabel}) on ${tableNumber}`);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Select Table from Floor Plan
  const handleSelectTableForBilling = (tableNumber: string, existingOrder?: RestaurantOrder) => {
    if (existingOrder) {
      setOrderToEdit(existingOrder);
    } else {
      handleAddNewBillToTable(tableNumber);
    }
    setCurrentTab('pos');
  };

  const handleNewBillClick = () => {
    setOrderToEdit(null);
    setCurrentTab('pos');
  };

  const handleAddSampleTodayOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleBills = INITIAL_ORDERS.map((o, idx) => ({
      ...o,
      id: `sample-${Date.now()}-${idx}`,
      billNumber: generateNextBillNumber(orders),
      date: today,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    }));
    setOrders((prev) => [...sampleBills, ...prev]);
    setToastNotice('Added sample settled orders for today with UPI, Cash, and Card!');
    setTimeout(() => setToastNotice(null), 3000);
  };

  const handleResetDefaults = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'pos' && currentTab !== 'pos') {
            setOrderToEdit(null);
          }
          setCurrentTab(tab);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrinterModal={() => {
          setIsSettingsOnlyPrinterModal(true);
          setIsPrinterModalOpen(true);
        }}
        onNewBill={handleNewBillClick}
        restaurantName={settings.restaurantName}
        activeTablesCount={activeOrders.length}
        defaultPrinterName={activeDefaultPrinter?.name}
      />

      {/* Main Screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Quick Toast Notification */}
        {toastNotice && (
          <div className="no-print mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastNotice}</span>
            </div>
            <button
              onClick={() => setToastNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: POS Billing (Main fast screen) */}
        {currentTab === 'pos' && (
          <RestaurantPOS
            key={orderToEdit ? orderToEdit.id : 'new-bill-key'}
            menu={menu}
            settings={settings}
            activeOrderToEdit={orderToEdit}
            allActiveOrders={activeOrders}
            onSettleAndPrint={handleSettleAndPrint}
            onSaveActiveTableOrder={handleSaveActiveTableOrder}
            onClearOrder={() => setOrderToEdit(null)}
            onSelectExistingOrder={(order) => setOrderToEdit(order)}
            onStartNewBillOnTable={handleAddNewBillToTable}
          />
        )}

        {/* Tab 2: Dining Tables Floor Plan */}
        {currentTab === 'tables' && (
          <ActiveTables
            activeOrders={activeOrders}
            settings={settings}
            onSelectTableForBilling={handleSelectTableForBilling}
            onAddNewBillToTable={handleAddNewBillToTable}
            onQuickSettle={(order) => {
              handleSettleAndPrint(order);
            }}
          />
        )}

        {/* Tab 3: Today's Sales & Bills History */}
        {currentTab === 'sales' && (
          <OrderHistory
            orders={orders}
            settings={settings}
            onPrintOrder={(ord) => setReceiptToPrint(ord)}
            onAddSampleTodayOrders={handleAddSampleTodayOrders}
          />
        )}

        {/* Tab 4: Menu & Pricing Manager */}
        {currentTab === 'menu' && (
          <MenuManager
            menu={menu}
            settings={settings}
            onUpdateMenu={(newMenu) => setMenu(newMenu)}
          />
        )}
      </main>

      {/* Dedicated Thermal Receipt Modal for Preview & Print */}
      {receiptToPrint && (
        <RestaurantReceipt
          order={receiptToPrint}
          settings={settings}
          activePrinter={activeDefaultPrinter}
          isModal={true}
          onClose={() => setReceiptToPrint(null)}
          onOpenPrinterSelector={handleOpenPrinterSelectForBill}
        />
      )}

      {/* Printer Machine Selector & Default Configuration Modal */}
      <PrinterSelectModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        printers={printers}
        selectedPrinterId={printerPrefs.selectedPrinterId}
        onSelectAndPrint={handlePrinterSelectedAndPrint}
        onUpdatePrinters={(updated) => setPrinters(updated)}
        isSettingsOnly={isSettingsOnlyPrinterModal}
      />

      {/* Restaurant Settings Modal */}
      <RestaurantSettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(updated) => setSettings(updated)}
        onResetDefaults={handleResetDefaults}
        onOpenPrinterSetup={() => {
          setIsSettingsOnlyPrinterModal(true);
          setIsPrinterModalOpen(true);
        }}
      />

      {/* Standalone Print-Only container for browser window.print() */}
      {receiptToPrint && (
        <div className="print-only hidden">
          <RestaurantReceipt
            order={receiptToPrint}
            settings={settings}
            activePrinter={activeDefaultPrinter}
            isModal={false}
          />
        </div>
      )}
    </div>
  );
}
