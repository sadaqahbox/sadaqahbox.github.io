import { useState, useMemo, useEffect } from "react";
import { useCurrencies, useCurrencyTypes } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
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
  ComboboxValue,
} from "@/components/ui/combobox";
import { X, Plus } from "lucide-react";
import type { Currency } from "@/types";
import type { CurrencyType } from "@/api/client/currency-types";

interface AddSadaqahProps {
  boxId: string;
  onAdded: (value: number, currencyId?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const GROUP_ORDER = ["Commodity", "Fiat", "Crypto"];

interface CurrencyGroup {
  value: string;
  items: Currency[];
}

export function AddSadaqah({ boxId, onAdded, onCancel, isLoading }: AddSadaqahProps) {
  const [amount, setAmount] = useState(1);
  const [value, setValue] = useState<number>(1);
  const [currencyId, setCurrencyId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: currencies = [], isLoading: isLoadingCurrencies } = useCurrencies();
  const { data: currencyTypes = [] } = useCurrencyTypes();

  // Set default currency when data loads
  useEffect(() => {
    if (currencies.length > 0 && !currencyId) {
      const usdCurrency = currencies.find(c => c.code === "USD");
      setCurrencyId(usdCurrency?.id || currencies[0]!.id);
    }
  }, [currencies, currencyId]);

  // Create a lookup map for currency types
  const currencyTypeMap = useMemo(() => {
    const map = new Map<string, CurrencyType>();
    for (const type of currencyTypes) {
      map.set(type.id, type);
    }
    return map;
  }, [currencyTypes]);

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

  const selectedCurrency = useMemo(() =>
    currencies.find(c => c.id === currencyId),
    [currencies, currencyId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0 || amount <= 0) return;
    if (!currencyId) return;

    onAdded(value * amount, currencyId);
  };

  const isFetchingCurrencies = isLoadingCurrencies || currencies.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add Sadaqah</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-4">
            <Field>
              <FieldLabel>Amount</FieldLabel>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
              />
            </Field>
            <Field>
              <FieldLabel>Value</FieldLabel>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field>
              <FieldLabel>Currency</FieldLabel>
              <Combobox
                items={filteredCurrencies}
                value={currencyId}
                onValueChange={(val) => {
                  if (val) {
                    setCurrencyId(val);
                    setSearchQuery(""); // Clear search on selection
                  }
                }}
                disabled={isFetchingCurrencies}
                itemToStringLabel={(v)=>selectedCurrency?.name + " ("+ selectedCurrency?.symbol+")"}
              >
                <ComboboxInput
                  placeholder={isFetchingCurrencies ? "Loading..." : "Search by code or name..."}
                  showClear
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isFetchingCurrencies || !currencyId}>
              <Plus className="mr-2 h-4 w-4" />
              {isLoading
                ? "Adding..."
                : `Add ${amount > 1 ? `${amount} × ` : ""}${value} Sadaqah`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
