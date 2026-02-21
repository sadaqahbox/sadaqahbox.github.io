import { useState, useEffect } from "react";
import { currenciesApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { X, Plus } from "lucide-react";
import type { Box, Currency } from "@/types";
import type { CreateBoxBody } from "@/api/client";
import { DEFAULT_BASE_CURRENCY_CODE } from "@/api/config";

interface CreateBoxProps {
  onCreated: (box: Box) => void;
  onCancel: () => void;
  createBox?: (data: CreateBoxBody) => void;
  isCreating?: boolean;
}

export function CreateBox({ onCreated, onCancel, createBox, isCreating = false }: CreateBoxProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [selectedBaseCurrencyId, setSelectedBaseCurrencyId] = useState<string>("");
  const [fetchingCurrencies, setFetchingCurrencies] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const currencies = await currenciesApi.getAll();
        setAvailableCurrencies(currencies);
        // Set default currency using the constant (USD if available, otherwise first one)
        const defaultCurrency = currencies.find(c => c.code === DEFAULT_BASE_CURRENCY_CODE);
        if (defaultCurrency) {
          setSelectedBaseCurrencyId(defaultCurrency.id);
        } else if (currencies.length > 0 && currencies[0]) {
          setSelectedBaseCurrencyId(currencies[0].id);
        }
      } catch {
        // Error handled by api.ts
      } finally {
        setFetchingCurrencies(false);
      }
    };
    fetchCurrencies();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (createBox) {
      // Use the mutation from props
      createBox({
        name,
        description,
        baseCurrencyId: selectedBaseCurrencyId || undefined,
      });
    }
    
    // Clear form
    setName("");
    setDescription("");
    onCreated({} as Box); // Let parent handle the actual box from mutation
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Create New Box</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="box-name">Name *</FieldLabel>
            <Input
              id="box-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ramadan Charity"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="box-description">Description</FieldLabel>
            <Textarea
              id="box-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="base-currency">Base Currency</FieldLabel>
            <select
              id="base-currency"
              value={selectedBaseCurrencyId}
              onChange={(e) => setSelectedBaseCurrencyId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={fetchingCurrencies}
            >
              <option value="">Select a currency</option>
              {availableCurrencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name} {currency.symbol ? `(${currency.symbol})` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              All sadaqah values will be converted to this currency. Cannot be changed after adding sadaqahs.
            </p>
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isCreating}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create Box"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
