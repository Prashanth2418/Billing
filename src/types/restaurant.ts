export type OrderType = 'Dine-In' | 'Takeaway' | 'Delivery';
export type PaymentMethod = 'Cash' | 'UPI / QR' | 'Card' | 'Online';
export type OrderStatus = 'Active' | 'Settled' | 'Cancelled';

export type MenuCategory =
  | 'All'
  | 'Starters & Crispy Fry'
  | 'Main Seafood Curries'
  | 'Tawa & Ghee Roasts'
  | 'Biryani, Rice & Breads'
  | 'Soups & Platters'
  | 'Beverages & Desserts';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  inStock: boolean;
  description?: string;
  badge?: string; // e.g. "Chef's Special", "Bestseller", "Fresh Catch"
}

export interface OrderLineItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialNote?: string; // e.g., "Less Spicy", "Extra Lemon", "Well Done"
  total: number;
}

export interface RestaurantOrder {
  id: string;
  billNumber: string; // e.g., "B-108"
  date: string;
  time: string;
  orderType: OrderType;
  tableNumber: string; // e.g. "Table 4" or "Takeaway #3"
  billLabel?: string; // e.g. "Bill 1", "Bill 2", "Guest A", "Bar"
  customerName?: string;
  customerPhone?: string;
  items: OrderLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  parcelCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Unpaid';
  status: OrderStatus;
  cashierName?: string;
  createdAt: string;
  settledAt?: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  phone: string;
  email: string;
  gstinOrTaxNo: string;
  fssaiLicense?: string;
  currencySymbol: string;
  taxRatePercent: number; // e.g., 5%
  enableTax: boolean;
  defaultParcelCharge: number;
  upiId: string;
  receiptFooterNote: string;
  cashierName: string;
}
