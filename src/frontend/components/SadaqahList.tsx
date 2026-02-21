import type { Currency } from '../App';
import './SadaqahList.css';

interface Sadaqah {
  id: string;
  boxId: string;
  value: number;
  currencyId: string;
  currency?: Currency;
  createdAt: string;
}

interface SadaqahListProps {
  sadaqahs: Sadaqah[];
  currency?: Currency;
}

export function SadaqahList({ sadaqahs, currency }: SadaqahListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getCurrencyDisplay = (sadaqah: Sadaqah) => {
    // Use sadaqah's own currency if available, otherwise fall back to box's currency
    const cur = sadaqah.currency || currency;
    if (!cur) return sadaqah.currencyId;
    return cur.symbol || cur.code;
  };

  if (sadaqahs.length === 0) {
    return (
      <div className="sadaqah-list-empty">
        <p>No sadaqahs in this box yet.</p>
        <p>Add some to get started!</p>
      </div>
    );
  }

  return (
    <ul className="sadaqah-list">
      {sadaqahs.map((sadaqah) => (
        <li key={sadaqah.id} className="sadaqah-item">
          <div className="sadaqah-main">
            <span className="sadaqah-value">
              {sadaqah.value} {getCurrencyDisplay(sadaqah)}
            </span>
            <span className="sadaqah-date">{formatDate(sadaqah.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
