import { useState, useEffect } from 'react';
import type { Currency } from '../App';
import './AddSadaqah.css';

interface AddSadaqahProps {
  boxId: string;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddSadaqah({ boxId, onAdded, onCancel }: AddSadaqahProps) {
  const [amount, setAmount] = useState(1);
  const [value, setValue] = useState<number>(1);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCurrencies, setFetchingCurrencies] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetch('/api/currencies');
        const data = await res.json() as { success: boolean; currencies: Currency[] };
        if (data.success && data.currencies.length > 0) {
          setCurrencies(data.currencies);
          setCurrencyCode(data.currencies[0].code);
        }
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
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
      const res = await fetch(`/api/boxes/${boxId}/sadaqahs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          value,
          currencyCode,
        }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        onAdded();
      }
    } catch (error) {
      console.error('Failed to add sadaqah:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-sadaqah-form" onSubmit={handleSubmit}>
      <h4>Add Sadaqah</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="form-group">
          <label>Value</label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Currency</label>
          <select 
            value={currencyCode} 
            onChange={(e) => setCurrencyCode(e.target.value)}
            disabled={fetchingCurrencies}
          >
            {currencies.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} {c.symbol ? `(${c.symbol})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || fetchingCurrencies}>
          {loading ? 'Adding...' : `Add ${amount} Sadaqah${amount > 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  );
}
