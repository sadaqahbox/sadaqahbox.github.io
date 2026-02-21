import './CollectionHistory.css';

interface Collection {
  id: string;
  boxId: string;
  emptiedAt: string;
  sadaqahsCollected: number;
  totalValue: number;
  currency: string;
}

interface CollectionHistoryProps {
  collections: Collection[];
}

export function CollectionHistory({ collections }: CollectionHistoryProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (collections.length === 0) {
    return (
      <div className="collection-history-empty">
        <p>No collections yet.</p>
        <p>Use the "Collect" button to empty this box and create a collection record.</p>
      </div>
    );
  }

  return (
    <ul className="collection-history">
      {collections.map((collection) => (
        <li key={collection.id} className="collection-item">
          <div className="collection-icon">🎯</div>
          <div className="collection-info">
            <div className="collection-main">
              <span className="collection-value">
                {collection.totalValue} {collection.currency}
              </span>
              <span className="collection-date">
                {formatDate(collection.emptiedAt)}
              </span>
            </div>
            <span className="collection-count">
              {collection.sadaqahsCollected} sadaqahs collected
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
