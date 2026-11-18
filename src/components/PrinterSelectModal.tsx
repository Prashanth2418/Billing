import React, { useState } from 'react';
import { PrinterDevice, PaperSize, PrinterConnectionType } from '../types/printer';
import {
  Printer,
  CheckCircle2,
  Wifi,
  Usb,
  Bluetooth,
  Monitor,
  Plus,
  Trash2,
  Check,
  Star,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface PrinterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  printers: PrinterDevice[];
  selectedPrinterId: string;
  onSelectAndPrint: (
    printer: PrinterDevice,
    setAsDefault: boolean,
    paperWidth: PaperSize,
    copies: number
  ) => void;
  onUpdatePrinters: (printers: PrinterDevice[]) => void;
  isSettingsOnly?: boolean; // if opened just to configure printers without printing
}

export const PrinterSelectModal: React.FC<PrinterSelectModalProps> = ({
  isOpen,
  onClose,
  printers,
  selectedPrinterId,
  onSelectAndPrint,
  onUpdatePrinters,
  isSettingsOnly = false,
}) => {
  const [currentSelectedId, setCurrentSelectedId] = useState(
    selectedPrinterId || printers[0]?.id || 'prn-epson-80'
  );
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [paperWidth, setPaperWidth] = useState<PaperSize>('80mm');
  const [copies, setCopies] = useState<number>(1);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [btStatusMsg, setBtStatusMsg] = useState<string | null>(null);

  // New printer form
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState<PrinterConnectionType>('USB / Driver');
  const [newWidth, setNewWidth] = useState<PaperSize>('80mm');
  const [newIp, setNewIp] = useState('192.168.1.200');

  if (!isOpen) return null;

  const activePrinter = printers.find((p) => p.id === currentSelectedId) || printers[0];

  // Helper for connection icons
  const getConnectionIcon = (type: PrinterConnectionType) => {
    switch (type) {
      case 'USB / Driver':
        return <Usb className="w-4 h-4 text-cyan-700 shrink-0" />;
      case 'LAN / Network IP':
        return <Wifi className="w-4 h-4 text-emerald-700 shrink-0" />;
      case 'Bluetooth Wireless':
        return <Bluetooth className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'System Default':
      default:
        return <Monitor className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  const handleSelectPrinter = (p: PrinterDevice) => {
    setCurrentSelectedId(p.id);
    setPaperWidth(p.paperWidth);
    setCopies(p.copies || 1);
  };

  const handleConfirm = () => {
    if (!activePrinter) return;
    onSelectAndPrint(activePrinter, setAsDefault, paperWidth, copies);
    onClose();
  };

  const handleTestPrint = () => {
    setTestPrintSuccess(true);
    // Send test print through browser print with a test flag
    setTimeout(() => {
      window.print();
    }, 150);
    setTimeout(() => {
      setTestPrintSuccess(false);
    }, 3000);
  };

  // Web Bluetooth pairing attempt if hardware supports
  const handleConnectBluetooth = async () => {
    setBtStatusMsg('Searching for Bluetooth Thermal Receipt Printers...');
    try {
      if ('bluetooth' in navigator) {
        // @ts-ignore
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
        });
        if (device && device.name) {
          const newBtPrinter: PrinterDevice = {
            id: `prn-bt-${Date.now()}`,
            name: device.name || 'Bluetooth Receipt Printer',
            model: 'Direct Wireless ESC/POS',
            connectionType: 'Bluetooth Wireless',
            paperWidth: '58mm',
            isDefault: true,
            status: 'Connected',
            autoCut: false,
            cashDrawerKick: false,
            copies: 1,
          };
          onUpdatePrinters([newBtPrinter, ...printers]);
          setCurrentSelectedId(newBtPrinter.id);
          setBtStatusMsg(`Connected to ${device.name}! Set as active printer.`);
        }
      } else {
        setBtStatusMsg('Web Bluetooth is supported in Chrome/Edge browsers. System pairing is also available.');
      }
    } catch (err: any) {
      setBtStatusMsg(`Connection standard: Printer will receive jobs through system print spooler.`);
    }
  };

  const handleAddNewPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPrn: PrinterDevice = {
      id: `prn-custom-${Date.now()}`,
      name: newName,
      model: newModel || newName,
      connectionType: newType,
      paperWidth: newWidth,
      ipAddress: newType === 'LAN / Network IP' ? newIp : undefined,
      isDefault: false,
      status: 'Ready',
      autoCut: true,
      cashDrawerKick: false,
      copies: 1,
    };

    onUpdatePrinters([...printers, newPrn]);
    setCurrentSelectedId(newPrn.id);
    setShowAddCustomModal(false);
    setNewName('');
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = printers.filter((p) => p.id !== id);
    onUpdatePrinters(remaining);
    if (currentSelectedId === id && remaining.length > 0) {
      setCurrentSelectedId(remaining[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 no-print-backdrop">
      <div className="bg-white border border-slate-300 max-w-lg w-full p-5 sm:p-6 shadow-2xl text-xs space-y-4 max-h-[95vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center">
              <Printer className="w-4 h-4 text-cyan-800" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                {isSettingsOnly ? 'Printer Hardware & Defaults' : 'Select Printer Machine to Print Bill'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Choose receipt printer, paper roll size, and set default device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Printer Selection List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">
              Available Connected Printer Machines:
            </span>
            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="text-[11px] font-semibold text-cyan-800 hover:text-cyan-950 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Other Printer</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {printers.map((p) => {
              const isSelected = p.id === currentSelectedId;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPrinter(p)}
                  className={`p-3 border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-400 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="pt-0.5">
                      <input
                        type="radio"
                        name="printer-selection"
                        checked={isSelected}
                        onChange={() => handleSelectPrinter(p)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                        {p.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 border border-amber-300 uppercase tracking-wide">
                            <Star className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          {getConnectionIcon(p.connectionType)}
                          {p.connectionType}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{p.paperWidth} Roll</span>
                        {p.ipAddress && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-600">IP: {p.ipAddress}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-center">
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 font-semibold">
                      {p.status}
                    </span>
                    {p.id.startsWith('prn-custom') && (
                      <button
                        onClick={(e) => handleDeleteCustom(p.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete this custom printer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checkbox: SET AS DEFAULT PRINTER MACHINE */}
        <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              className="mt-0.5 text-slate-900 focus:ring-slate-900 w-4 h-4 rounded-none"
            />
            <div>
              <span className="font-bold text-slate-900 text-xs block">
                Set as Default Printer for all future seafood bills
              </span>
              <span className="text-[11px] text-slate-500 leading-snug block">
                The restaurant billing system will automatically route print jobs to this machine without asking every time.
              </span>
            </div>
          </label>
        </div>

        {/* Paper Size & Copies Controls */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
              Receipt Paper Width
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['80mm', '58mm', 'A4'] as PaperSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPaperWidth(size)}
                  className={`py-1.5 px-2 text-center text-xs font-semibold border transition-colors ${
                    paperWidth === size
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 block">
              {paperWidth === '80mm' ? 'Standard restaurant thermal' : paperWidth === '58mm' ? 'Compact handheld POS' : 'Full-page invoice'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
              Print Copies
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCopies(num)}
                  className={`py-1.5 px-2 text-center text-xs font-semibold border transition-colors ${
                    copies === num
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num} {num === 1 ? 'Copy' : 'Copies (Guest + KOT)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bluetooth Pairing & Direct Feed test */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={handleConnectBluetooth}
            className="text-cyan-800 hover:text-cyan-950 font-semibold flex items-center gap-1 hover:underline"
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>Connect Bluetooth Printer</span>
          </button>

          <button
            type="button"
            onClick={handleTestPrint}
            className="px-2.5 py-1 text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"
          >
            <Printer className="w-3 h-3 text-slate-500" />
            <span>{testPrintSuccess ? 'Sending Test...' : 'Test Printer Feed'}</span>
          </button>
        </div>

        {btStatusMsg && (
          <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 text-[10px]">
            {btStatusMsg}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>{isSettingsOnly ? 'Save Default Printer' : 'Confirm & Print Bill'}</span>
          </button>
        </div>
      </div>

      {/* Add Custom / Network IP Printer Sub-Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white border border-slate-300 max-w-sm w-full p-5 shadow-2xl text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 uppercase">
                Add Printer Machine Profile
              </h4>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewPrinter} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Printer Name / Label *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Counter Bill Printer 1"
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Printer Model
                </label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="e.g. Epson TM-T82 / TVS RP-3160 / Generic ESC/POS"
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Connection</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PrinterConnectionType)}
                    className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900"
                  >
                    <option value="USB / Driver">USB / Driver</option>
                    <option value="LAN / Network IP">LAN / Network IP</option>
                    <option value="Bluetooth Wireless">Bluetooth Wireless</option>
                    <option value="System Default">System Default</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paper Roll</label>
                  <select
                    value={newWidth}
                    onChange={(e) => setNewWidth(e.target.value as PaperSize)}
                    className="w-full border border-slate-300 px-2 py-1.5 bg-white text-slate-900 font-bold"
                  >
                    <option value="80mm">80mm (Standard)</option>
                    <option value="58mm">58mm (Mini POS)</option>
                    <option value="A4">A4 (Normal Sheet)</option>
                  </select>
                </div>
              </div>

              {newType === 'LAN / Network IP' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Printer IP Address (Port 9100)
                  </label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="192.168.1.180"
                    className="w-full border border-slate-300 px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Save Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
