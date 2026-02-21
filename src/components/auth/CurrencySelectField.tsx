import { useState, useMemo, useEffect, useRef } from "react";
import { useCurrencies, useCurrencyTypes } from "@/hooks";
import { authClient } from "@/lib/auth";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxCollection,
} from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import type { Currency } from "@/types";
import type { CurrencyType } from "@/api/client/currency-types";

const GROUP_ORDER = ["Commodity", "Fiat", "Crypto"];

interface CurrencyGroup {
  value: string;
  items: Currency[];
}

interface CurrencySelectFieldProps {
  label?: string;
  description?: string;
}

export function CurrencySelectField({ 
  label = "Preferred Currency", 
  description = "Select your preferred currency for transactions" 
}: CurrencySelectFieldProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const isSelectingRef = useRef(false);
  
  // Get current user session to access preferredCurrencyId
  const { data: session, isLoading: isLoadingSession } = authClient.useSession();
  
  const { data: currencies = [], isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: currencyTypes = [] } = useCurrencyTypes();

  // Current value from session
  const currentValue = session?.user?.preferredCurrencyId || null;

  // Create a lookup map for currency types
  const currencyTypeMap = useMemo(() => {
    const map = new Map<string, CurrencyType>();
    for (const type of currencyTypes) {
      map.set(type.id, type);
    }
    return map;
  }, [currencyTypes]);

  // Create a lookup map for currencies by ID
  const currencyById = useMemo(() => {
    const map = new Map<string, Currency>();
    for (const currency of currencies) {
      map.set(currency.id, currency);
    }
    return map;
  }, [currencies]);

  // Group currencies by their type
  const groupedCurrencies: CurrencyGroup[] = useMemo(() => {
    const groups = new Map<string, Currency[]>();
    
    for (const currency of currencies) {
      const typeId = currency.currencyTypeId;
      const typeName = typeId ? currencyTypeMap.get(typeId)?.name || "Other" : "Other";
      if (!groups.has(typeName)) {
        groups.set(typeName, []);
      }
      groups.get(typeName)!.push(currency);
    }
    
    // Sort groups by predefined order, then alphabetically
    const sortedEntries = Array.from(groups.entries()).sort((a, b) => {
      const indexA = GROUP_ORDER.indexOf(a[0]);
      const indexB = GROUP_ORDER.indexOf(b[0]);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });
    
    // Sort currencies within each group alphabetically by code
    return sortedEntries.map(([type, items]) => ({
      value: type,
      items: items.sort((a, b) => a.code.localeCompare(b.code)),
    }));
  }, [currencies, currencyTypeMap]);

  // Filter currencies based on search query
  const filteredCurrencies: CurrencyGroup[] = useMemo(() => {
    if (!searchQuery) return groupedCurrencies;
    
    const lowerQuery = searchQuery.toLowerCase();
    return groupedCurrencies
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.code.toLowerCase().includes(lowerQuery) ||
          item.name.toLowerCase().includes(lowerQuery) ||
          (item.symbol && item.symbol.toLowerCase().includes(lowerQuery))
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [groupedCurrencies, searchQuery]);

  const handleValueChange = async (newValue: string) => {
    if (!newValue || newValue === currentValue) return;
    
    setIsUpdating(true);
    try {
      await authClient.updateUser({
        preferredCurrencyId: newValue,
      });
    } catch (error) {
      console.error("Failed to update preferred currency:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get the currently selected currency for display
  const selectedCurrency = currentValue ? currencyById.get(currentValue) : null;

  const isLoading = isLoadingSession || isLoadingCurrencies || currencies.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
      <Combobox
        items={groupedCurrencies}
        filteredItems={filteredCurrencies}
        filter={null}
        value={currentValue || ""}
        onInputValueChange={(val, eventDetails) => {
          if (isSelectingRef.current) {
            return;
          }
          const reason = eventDetails?.reason;
          if (reason === "input-change" || reason === "input-paste" || reason === "input-clear" || reason === "clear-press") {
            setSearchQuery(val);
          }
        }}
        onValueChange={(val) => {
          if (val) {
            isSelectingRef.current = true;
            handleValueChange(val);
            setSearchQuery("");
            setTimeout(() => {
              isSelectingRef.current = false;
            }, 0);
          }
        }}
        disabled={isLoading || isUpdating}
        itemToStringLabel={(id) => {
          const currency = currencyById.get(id as string);
          if (!currency) return "";
          return `${currency.code} - ${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}`;
        }}
      >
        <ComboboxInput
          placeholder={isLoading ? "Loading..." : selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : "Select currency..."}
          showClear
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>No currencies found.</ComboboxEmpty>
          <ComboboxList>
            {(group: CurrencyGroup, index: number) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: Currency) => (
                    <ComboboxItem key={item.id} value={item.id}>
                      <span className="font-medium w-12">{item.code}</span>
                      <span className="text-muted-foreground text-xs truncate">
                        {item.name}
                        {item.symbol ? ` (${item.symbol})` : ""}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                {index < filteredCurrencies.length - 1 && <ComboboxSeparator />}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
