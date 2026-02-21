import './SadaqahList.css';

interface Sadaqah {
  id: string;
  boxId: string;
  value: number;
  currency: string;
  createdAt: string;
  location?: string;
}

interface SadaqahListProps {
  sadaqahs: Sadaqah[];
  currency?: string;
}

export function SadaqahList({ sadaqahs, currency }: SadaqahListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
              {sadaqah.value} {sadaqah.currency}
            </span>
            <span className="sadaqah-date">{formatDate(sadaqah.createdAt)}</span>
          </div>
          {sadaqah.location && (
            <span className="sadaqah-location">📍 {sadaqah.location}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
