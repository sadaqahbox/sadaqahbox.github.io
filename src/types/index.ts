export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  currencyTypeId?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface Box {
  id: string;
  name: string;
  description?: string;
  count: number;
  totalValue: number;
  currencyId?: string;
  currency?: Currency;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Sadaqah {
  id: string;
  boxId: string;
  value: number;
  currencyId: string;
  currency?: Currency;
  createdAt: string;
}

export interface Collection {
  id: string;
  boxId: string;
  emptiedAt: string;
  sadaqahsCollected: number;
  totalValue: number;
  currencyId: string;
  currency?: Currency;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
