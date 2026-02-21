/**
 * Domain types - Pure TypeScript interfaces
 * No Zod dependencies here - just shapes
 */

// ============== Base Types ==============

export interface CurrencyType {
	id: string;
	name: string;
	description?: string;
}

export interface Currency {
	id: string;
	code: string;
	name: string;
	symbol?: string;
	currencyTypeId?: string;
	currencyType?: CurrencyType;
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
	metadata?: Record<string, string>;
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

// ============== Result Types ==============

export interface BoxStats {
	firstSadaqahAt: string | null;
	lastSadaqahAt: string | null;
	totalSadaqahs: number;
}

export interface CollectionResult {
	box: Box;
	collection: {
		id: string;
		sadaqahsCollected: number;
		totalValue: number;
		currencyId: string;
		emptiedAt: string;
	};
}

export interface CollectionsListResult {
	collections: Collection[];
	total: number;
}

export interface DeleteBoxResult {
	deleted: boolean;
	sadaqahsDeleted: number;
	collectionsDeleted: number;
}

export interface CreateSadaqahResult {
	sadaqah: Sadaqah;
	updatedBox: Box;
}

export interface ListSadaqahsResult {
	sadaqahs: Sadaqah[];
	total: number;
	summary: {
		totalSadaqahs: number;
		totalValue: number;
		currency: Currency;
	};
}

export interface AddMultipleResult {
	sadaqahs: Sadaqah[];
	box: Box;
}

// ============== Options Interfaces ==============

export interface AddSadaqahOptions {
	boxId: string;
	value: number;
	currencyId: string;
	amount?: number;
	metadata?: Record<string, string>;
}

export interface CreateTagOptions {
	name: string;
	color?: string;
}

export interface CreateCurrencyOptions {
	code: string;
	name: string;
	symbol?: string;
	currencyTypeId?: string;
}

export interface GetOrCreateOptions {
	code: string;
	name?: string;
	symbol?: string;
	currencyTypeId?: string;
}

export interface CreateCurrencyTypeOptions {
	name: string;
	description?: string;
}

// ============== Pagination ==============

export interface PaginationOptions {
	page?: number;
	limit?: number;
}

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

// ============== List Results ==============

export interface ListResult<T> {
	items: T[];
	pagination: PaginationInfo;
}

// ============== Date Range ==============

export interface DateRange {
	from?: string;
	to?: string;
}
