export interface Sheet {
  id: number;
  slug: string;
  nanoid: string;
  name: string;
  description: string | null;
  currency: string;
  createdBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Participant {
  id: number;
  sheetId: number;
  userId: string | null;
  name: string;
  email: string | null;
  isCreator: boolean | null;
  joinedAt: Date | null;
  leftAt: Date | null;
}

export interface Expense {
  id: number;
  sheetId: number;
  paidBy: number;
  description: string;
  amount: number;
  splitType: 'equal' | 'custom' | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
