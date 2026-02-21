import { useMemo } from "react";
import { UpdateFieldCard, type SelectOption } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth";
import { useCurrencies } from "@/hooks";
import type { Currency } from "@/db/schema";

export function UpdatePreferredCurrencyCard() {
  // Get current user session to access preferredCurrencyId
  const { data: session } = authClient.useSession();

  const { data: currencies = [], isLoading: isLoadingCurrencies } = useCurrencies();

  // Current value from session
  const currentValue = session?.user?.preferredCurrencyId || "";

  // Convert currencies to select options
  const currencyOptions: SelectOption[] = useMemo(() => {
    if (isLoadingCurrencies || !currencies.length) {
      return [];
    }

    return (currencies as Currency[])
      .map((currency: Currency) => ({
        label: `${currency.name} (${currency.code})`,
        value: currency.id,
      }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [currencies, isLoadingCurrencies]);

  if (isLoadingCurrencies || !currencyOptions.length) {
    return null;
  }

  return (
    <UpdateFieldCard
      className="min-w-md"
      name="preferredCurrencyId"
      label="Preferred Currency"
      description="Select your preferred currency for displaying amounts"
      type="select"
      options={currencyOptions}
      value={currentValue}
      placeholder="Select a currency"
    />
  );
}