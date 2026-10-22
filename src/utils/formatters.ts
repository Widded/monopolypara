/**
 * Currency and date formatting utilities for Monopoly Istanbul
 */

/**
 * Formats a numeric amount to Turkish Monopoly standard: e.g. 1.500 ₺, 250 ₺
 */
export function formatMoney(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0 ₺';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 ₺';
  
  // Format with Turkish locale (dot for thousands separator)
  const formattedNumber = Math.round(num).toLocaleString('tr-TR');
  return `${formattedNumber} ₺`;
}

/**
 * Returns formatted string with positive/negative sign
 */
export function formatMoneyDelta(amount: number): string {
  const absFormatted = formatMoney(Math.abs(amount));
  if (amount > 0) return `+${absFormatted}`;
  if (amount < 0) return `-${absFormatted}`;
  return absFormatted;
}

/**
 * Formats ISO date string to Turkish short date/time
 */
export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  
  const isToday = 
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (isToday) {
    return `${hours}:${minutes}`;
  }

  const day = date.getDate();
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const month = months[date.getMonth()];
  return `${day} ${month} ${hours}:${minutes}`;
}

/**
 * Returns clean relative time in Turkish: e.g. "2 dk önce", "az önce"
 */
export function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'az önce';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}

/**
 * Generates a clean, readable short room code with fixed WID- prefix and digits: e.g. WID-48291
 */
export function generateRoomCode(): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `WID-${randomDigits}`;
}

/**
 * Generates a 4-digit player recovery PIN: e.g. '7492'
 */
export function generateRecoveryPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generates or retrieves a secure client session token, supporting per-player and per-room isolation
 */
export function getOrCreateSessionToken(playerId?: string, roomId?: string): string {
  if (typeof window === 'undefined') return 'sess_default';

  // 1. Oyuncuya özel token varsa öncelikli olarak onu getir
  if (playerId) {
    const playerToken = localStorage.getItem(`monopoly_token_p_${playerId}`);
    if (playerToken) return playerToken;
  }

  // 2. Odaya özel token varsa onu getir
  if (roomId) {
    const roomToken = localStorage.getItem(`monopoly_token_r_${roomId}`);
    if (roomToken) return roomToken;
  }

  // 3. Genel oturum tokeni
  const storageKey = 'monopoly_session_token';
  let token = localStorage.getItem(storageKey);
  if (!token) {
    token = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    try {
      localStorage.setItem(storageKey, token);
    } catch {}
  }

  if (playerId) {
    try {
      localStorage.setItem(`monopoly_token_p_${playerId}`, token);
    } catch {}
  }
  if (roomId) {
    try {
      localStorage.setItem(`monopoly_token_r_${roomId}`, token);
    } catch {}
  }

  return token;
}

export function savePlayerSessionToken(playerId: string, token: string, roomId?: string): void {
  if (typeof window === 'undefined' || !token) return;
  try {
    localStorage.setItem('monopoly_session_token', token);
    if (playerId) localStorage.setItem(`monopoly_token_p_${playerId}`, token);
    if (roomId) localStorage.setItem(`monopoly_token_r_${roomId}`, token);
  } catch {}
}

export function resetSessionToken(): string {
  if (typeof window === 'undefined') return 'sess_new';
  const storageKey = 'monopoly_session_token';
  const token = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
  try {
    localStorage.setItem(storageKey, token);
  } catch {}
  return token;
}

/**
 * Transaction type display names in Turkish
 */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  transfer: 'Para Gönderimi',
  debt_lend: 'Borç Verme',
  debt_payment: 'Borç Ödemesi',
  debt_settlement: 'Anlaşmalı Borç Kapatma',
  banker_adjust: 'Banka / Düzeltme',
  bank_payment: 'Bankaya Ödeme',
  bankruptcy: 'İflas',
  reversal: 'İşlem İptali',
};
