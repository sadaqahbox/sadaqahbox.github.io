import { useState } from 'react';
import './AddSadaqah.css';

interface AddSadaqahProps {
  boxId: string;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddSadaqah({ boxId, onAdded, onCancel }: AddSadaqahProps) {
  const [amount, setAmount] = useState(1);
  const [value, setValue] = useState<number>(1);
  const [currency, setCurrency] = useState('USD');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

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
          currency,
          location: location || undefined,
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
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="TRY">TRY (₺)</option>
            <option value="SAR">SAR (﷼)</option>
            <option value="AED">AED (د.إ)</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Location (optional)</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Mosque, Home"
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : `Add ${amount} Sadaqah${amount > 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  );
}
