export type TransactionType = 
  | 'transfer' 
  | 'debt_lend' 
  | 'debt_payment' 
  | 'debt_settlement' 
  | 'banker_adjust'
  | 'bank_payment'
  | 'bankruptcy'
  | 'reversal';

export type DebtStatus = 'pending' | 'rejected' | 'active' | 'partially_paid' | 'settled';

export interface Room {
  id: string;
  code: string;
  banker_player_id?: string;
  status: 'active' | 'ended';
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  balance: number;
  is_banker: boolean;
  session_token: string;
  recovery_pin?: string; // 4 haneli geri bağlanma kodu
  is_online?: boolean;   // Oyuncu şu anda masada mı yoksa çıkış mı yaptı
  is_bankrupt?: boolean; // Oyuncu iflas etti mi
  created_at: string;
  // Computed client-side fields
  total_receivable?: number; // Verdiği açık borçlar toplamı (alacak)
  total_debt?: number;       // Diğer oyunculara olan borçlar toplamı (borç)
}

export interface Debt {
  id: string;
  room_id: string;
  creditor_id: string; // Borç veren (alacaklı)
  debtor_id: string;   // Borç alan (borçlu)
  initial_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: DebtStatus;
  description?: string;
  created_at: string;
  updated_at: string;
  // Populated relationships for display
  creditor_name?: string;
  debtor_name?: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  remaining_after: number;
  created_at: string;
}

export interface DebtSettlement {
  id: string;
  debt_id: string;
  agreed_payment: number;
  forgiven_amount: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  room_id: string;
  type: TransactionType;
  from_player_id?: string | null;
  to_player_id?: string | null;
  amount: number;
  description?: string;
  is_reversed?: boolean;
  created_at: string;
  // Populated fields for UI
  from_player_name?: string;
  to_player_name?: string;
}

export interface RoomState {
  room: Room;
  currentPlayer: Player;
  players: Player[];
  debts: Debt[];
  transactions: Transaction[];
}

export type ThemeId = 'fintech' | 'royal' | 'midnight' | 'cyber';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  tagline: string;
  accentColor: string;
  cardBg: string;
  previewBg: string;
}
