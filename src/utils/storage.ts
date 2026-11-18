import { BusinessProfile, Client, Invoice, SeafoodItem } from '../types/billing';
import {
  DEFAULT_BUSINESS_PROFILE,
  INITIAL_CLIENTS,
  INITIAL_INVOICES,
  INITIAL_SEAFOOD_ITEMS,
} from '../data/defaultData';

const STORAGE_KEYS = {
  PROFILE: 'hts_business_profile_v1',
  CLIENTS: 'hts_clients_v1',
  CATALOG: 'hts_catalog_v1',
  INVOICES: 'hts_invoices_v1',
};

export function getStoredProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_BUSINESS_PROFILE;
    return { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUSINESS_PROFILE;
  }
}

export function saveStoredProfile(profile: BusinessProfile): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function getStoredClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) return INITIAL_CLIENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CLIENTS;
  } catch {
    return INITIAL_CLIENTS;
  }
}

export function saveStoredClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

export function getStoredCatalog(): SeafoodItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (!raw) return INITIAL_SEAFOOD_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SEAFOOD_ITEMS;
  } catch {
    return INITIAL_SEAFOOD_ITEMS;
  }
}

export function saveStoredCatalog(items: SeafoodItem[]): void {
  localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(items));
}

export function getStoredInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) return INITIAL_INVOICES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVOICES;
  } catch {
    return INITIAL_INVOICES;
  }
}

export function saveStoredInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
}

export function resetAllToDefaults(): void {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.CLIENTS);
  localStorage.removeItem(STORAGE_KEYS.CATALOG);
  localStorage.removeItem(STORAGE_KEYS.INVOICES);
}

export function formatCurrency(amount: number, symbol = '$'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `${symbol}${safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateNextInvoiceNumber(existingInvoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const prefix = `HTS-${year}-`;
  
  const numbers = existingInvoices
    .map(inv => {
      const match = inv.invoiceNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n) && n > 0);

  const highest = numbers.length > 0 ? Math.max(...numbers) : 842;
  const nextNum = String(highest + 1).padStart(4, '0');
  return `${prefix}${nextNum}`;
}
