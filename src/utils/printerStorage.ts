import { PrinterDevice, PrinterSettingsState } from '../types/printer';

const STORAGE_KEYS = {
  PRINTER_LIST: 'sfr_printer_devices_v1',
  PRINTER_PREFS: 'sfr_printer_prefs_v1',
};

export const DEFAULT_PRINTERS: PrinterDevice[] = [
  {
    id: 'prn-epson-80',
    name: 'Epson TM-T82X Thermal Bill Printer',
    model: 'Epson TM-T82X / TM-T88VI',
    connectionType: 'USB / Driver',
    paperWidth: '80mm',
    isDefault: true,
    status: 'Ready',
    autoCut: true,
    cashDrawerKick: true,
    copies: 1,
  },
  {
    id: 'prn-tvs-80',
    name: 'TVS RP-3160 Gold Star Restaurant Printer',
    model: 'TVS Electronics RP-3160 Plus',
    connectionType: 'LAN / Network IP',
    paperWidth: '80mm',
    ipAddress: '192.168.1.180',
    port: 9100,
    isDefault: false,
    status: 'Ready',
    autoCut: true,
    cashDrawerKick: false,
    copies: 1,
  },
  {
    id: 'prn-bt-58',
    name: 'Wireless Bluetooth POS Mini Printer',
    model: '58mm Mobile Bluetooth Thermal POS',
    connectionType: 'Bluetooth Wireless',
    paperWidth: '58mm',
    isDefault: false,
    status: 'Ready',
    autoCut: false,
    cashDrawerKick: false,
    copies: 1,
  },
  {
    id: 'prn-system-default',
    name: 'System Default Printer (Browser Dialog)',
    model: 'Windows / Mac / Android Print Spooler',
    connectionType: 'System Default',
    paperWidth: '80mm',
    isDefault: false,
    status: 'Ready',
    autoCut: true,
    cashDrawerKick: false,
    copies: 1,
  },
];

export const DEFAULT_PRINTER_PREFS: PrinterSettingsState = {
  selectedPrinterId: 'prn-epson-80',
  alwaysAskBeforePrinting: false,
  paperSize: '80mm',
  copies: 1,
  openCashDrawerOnSettle: true,
  autoCutPaper: true,
};

export function getStoredPrinters(): PrinterDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRINTER_LIST);
    if (!raw) return DEFAULT_PRINTERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRINTERS;
  } catch {
    return DEFAULT_PRINTERS;
  }
}

export function saveStoredPrinters(printers: PrinterDevice[]): void {
  localStorage.setItem(STORAGE_KEYS.PRINTER_LIST, JSON.stringify(printers));
}

export function getStoredPrinterPrefs(): PrinterSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRINTER_PREFS);
    if (!raw) return DEFAULT_PRINTER_PREFS;
    return { ...DEFAULT_PRINTER_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINTER_PREFS;
  }
}

export function saveStoredPrinterPrefs(prefs: PrinterSettingsState): void {
  localStorage.setItem(STORAGE_KEYS.PRINTER_PREFS, JSON.stringify(prefs));
}
