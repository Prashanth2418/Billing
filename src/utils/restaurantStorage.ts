import { MenuItem, RestaurantOrder, RestaurantSettings } from '../types/restaurant';
import {
  DEFAULT_RESTAURANT_SETTINGS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
} from '../data/restaurantData';

const STORAGE_KEYS = {
  SETTINGS: 'sfr_settings_v1',
  MENU: 'sfr_menu_v1',
  ORDERS: 'sfr_orders_v1',
  ACTIVE_TABLES: 'sfr_active_tables_v1',
};

export function getStoredRestaurantSettings(): RestaurantSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_RESTAURANT_SETTINGS;
    return { ...DEFAULT_RESTAURANT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RESTAURANT_SETTINGS;
  }
}

export function saveStoredRestaurantSettings(settings: RestaurantSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStoredMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU);
    if (!raw) return INITIAL_MENU_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MENU_ITEMS;
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

export function saveStoredMenuItems(items: MenuItem[]): void {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
}

export function getStoredOrders(): RestaurantOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return INITIAL_ORDERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders: RestaurantOrder[]): void {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

export function formatPrice(amount: number, symbol = '₹'): string {
  const safe = isNaN(amount) ? 0 : amount;
  return `${symbol}${safe.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}

export function generateNextBillNumber(existingOrders: RestaurantOrder[]): string {
  const numbers = existingOrders
    .map((o) => {
      const match = o.billNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  const highest = numbers.length > 0 ? Math.max(...numbers) : 102;
  return `SF-${highest + 1}`;
}
