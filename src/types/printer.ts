export type PrinterConnectionType = 'USB / Driver' | 'LAN / Network IP' | 'Bluetooth Wireless' | 'System Default';
export type PaperSize = '80mm' | '58mm' | 'A4';

export interface PrinterDevice {
  id: string;
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  paperWidth: PaperSize;
  ipAddress?: string;
  port?: number;
  isDefault: boolean;
  status: 'Ready' | 'Connected' | 'Offline';
  autoCut: boolean;
  cashDrawerKick: boolean;
  copies: number;
}

export interface PrinterSettingsState {
  selectedPrinterId: string;
  alwaysAskBeforePrinting: boolean;
  paperSize: PaperSize;
  copies: number;
  openCashDrawerOnSettle: boolean;
  autoCutPaper: boolean;
}
