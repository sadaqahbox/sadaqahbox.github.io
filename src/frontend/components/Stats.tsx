import './Stats.css';

interface StatsProps {
  stats: {
    totalBoxes: number;
    totalSadaqahs: number;
    totalValue: number;
  };
}

export function Stats({ stats }: StatsProps) {
  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-icon">📦</div>
        <div className="stat-content">
          <span className="stat-value">{stats.totalBoxes}</span>
          <span className="stat-label">Boxes</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🤲</div>
        <div className="stat-content">
          <span className="stat-value">{stats.totalSadaqahs}</span>
          <span className="stat-label">Sadaqahs</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-content">
          <span className="stat-value">${stats.totalValue.toFixed(2)}</span>
          <span className="stat-label">Total Value</span>
        </div>
      </div>
    </div>
  );
}
