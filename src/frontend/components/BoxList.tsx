import { Box } from '../App';
import './BoxList.css';

interface BoxListProps {
  boxes: Box[];
  selectedBoxId?: string;
  onSelectBox: (box: Box) => void;
  onBoxDeleted: (boxId: string) => void;
}

export function BoxList({ boxes, selectedBoxId, onSelectBox, onBoxDeleted }: BoxListProps) {
  const handleDelete = async (e: React.MouseEvent, box: Box) => {
    e.stopPropagation();
    if (!confirm(`Delete "${box.name}"? This will also delete all sadaqahs in it.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/boxes/${box.id}`, { method: 'DELETE' });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        onBoxDeleted(box.id);
      }
    } catch (error) {
      console.error('Failed to delete box:', error);
    }
  };

  if (boxes.length === 0) {
    return (
      <div className="box-list-empty">
        <p>No boxes yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <ul className="box-list">
      {boxes.map(box => (
        <li
          key={box.id}
          className={`box-item ${selectedBoxId === box.id ? 'selected' : ''}`}
          onClick={() => onSelectBox(box)}
        >
          <div className="box-info">
            <h4 className="box-name">{box.name}</h4>
            {box.description && (
              <p className="box-description">{box.description}</p>
            )}
            <div className="box-stats">
              <span className="box-count">{box.count} sadaqahs</span>
              <span className="box-value">
                {box.totalValue} {box.currency?.symbol || box.currency?.code || ''}
              </span>
            </div>
            {box.tags && box.tags.length > 0 && (
              <div className="box-tags">
                {box.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="box-tag"
                    style={{ 
                      backgroundColor: tag.color ? `${tag.color}20` : '#e0e7ff',
                      color: tag.color || '#4f46e5',
                      border: `1px solid ${tag.color || '#c7d2fe'}`,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            className="btn btn-sm btn-danger"
            onClick={(e) => handleDelete(e, box)}
            title="Delete box"
          >
            🗑️
          </button>
        </li>
      ))}
    </ul>
  );
}
