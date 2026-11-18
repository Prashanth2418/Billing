export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'SGD';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export interface BusinessProfile {
  companyName: string;
  tradeName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string; // GST/VAT/EIN
  fisheryLicenseNo: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrIfsc: string;
  swiftBic: string;
  upiId?: string;
  defaultPaymentTerms: string;
  defaultNotes: string;
  currencySymbol: string;
  currencyCode: CurrencyCode;
  defaultTaxRate: number;
  authorizedSignatory: string;
  signatoryTitle: string;
  logoUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  category: 'Fine Dining Restaurant' | 'Fishmonger / Market' | 'Hotel & Resort' | 'Wholesale Distributor' | 'Catering Co.' | 'Retail Customer';
  email: string;
  phone: string;
  billingAddress: string;
  deliveryPierOrKitchen: string;
  taxNumber?: string;
  paymentTerms: string;
  notes?: string;
}

export type SeafoodCategory = 'Fin Fish' | 'Crustaceans' | 'Mollusks / Shellfish' | 'Cephalopods' | 'Smoked & Prepared';
export type SeafoodForm = 'Whole / Round' | 'Fillet (Skin-on)' | 'Fillet (Skinless)' | 'Steaks' | 'Live' | 'IQF Blast Frozen' | 'Shucked' | 'Cleaned Tubes & Tentacles';
export type StorageTemp = 'Fresh on Ice (0°C to 2°C)' | 'Super-chilled (-1°C)' | 'Deep Frozen (-18°C)' | 'Aerated Live Tank';
export type UnitOfMeasure = 'kg' | 'lb' | 'box (10kg)' | 'crate (20kg)' | 'crate (25kg)' | 'dozen' | 'count';

export interface SeafoodItem {
  id: string;
  name: string;
  scientificName?: string;
  category: SeafoodCategory;
  form: SeafoodForm;
  storageTemp: StorageTemp;
  catchOrigin: string; // e.g., North Atlantic (FAO 27), Bay of Bengal, Alaska Waters
  defaultUnit: UnitOfMeasure;
  unitPrice: number;
  taxRate: number;
  inStock: boolean;
  minOrderQty?: number;
}

export interface InvoiceLineItem {
  id: string;
  seafoodItemId?: string;
  name: string;
  category: SeafoodCategory;
  form: SeafoodForm;
  origin?: string;
  batchOrCatchNo?: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: number;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  
  // Client info snapshot
  clientId: string;
  clientName: string;
  clientBusiness: string;
  clientEmail: string;
  clientPhone: string;
  clientBillingAddress: string;
  clientDeliveryAddress: string;
  clientTaxNumber?: string;
  
  // Seafood logistics
  vesselOrDockRef: string; // e.g., "Pier 14 Cold Dock / M/V Pacific Dawn"
  poNumber?: string;
  catchDate?: string;
  temperatureAtDispatch: string;
  
  // Financial lines
  items: InvoiceLineItem[];
  subtotal: number;
  discountRate: number; // overall percentage discount if any
  discountAmount: number;
  taxAmount: number;
  coldChainPackagingFee: number; // Crushed ice, thermal insulated boxes
  deliveryFreightFee: number; // Refrigerated transport
  total: number;
  amountPaid: number;
  balanceDue: number;
  
  // Meta
  paymentTerms: string;
  paymentInstructions: string;
  notesTerms: string;
  currencySymbol: string;
  currencyCode: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}
