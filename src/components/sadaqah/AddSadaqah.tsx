import { useState, useEffect } from "react";
import { boxesApi, currenciesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { Currency } from "@/types";

interface AddSadaqahProps {
  boxId: string;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddSadaqah({ boxId, onAdded, onCancel }: AddSadaqahProps) {
  const [amount, setAmount] = useState(1);
  const [value, setValue] = useState<number>(1);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCurrencies, setFetchingCurrencies] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const data = await currenciesApi.getAll();
        if (data.success && data.currencies.length > 0) {
          setCurrencies(data.currencies);
          setCurrencyCode(data.currencies[0].code);
        }
      } catch {
        // Error handled by api.ts
      } finally {
        setFetchingCurrencies(false);
      }
    };
    fetchCurrencies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0 || amount <= 0) return;

    setLoading(true);
    try {
      const data = await boxesApi.addSadaqah(boxId, {
        amount,
        value,
        currencyCode,
      });
      if (data.success) {
        onAdded();
      }
    } catch {
      // Error handled by api.ts
    } finally {
      setLoading(false);
    }
  };

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
              <Select
                value={currencyCode}
                onValueChange={setCurrencyCode}
                disabled={fetchingCurrencies}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.code} {c.symbol ? `(${c.symbol})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingCurrencies}>
              <Plus className="mr-2 h-4 w-4" />
              {loading
                ? "Adding..."
                : `Add ${amount} Sadaqah${amount > 1 ? "s" : ""}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
