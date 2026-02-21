import { useState, useEffect } from 'react';
import { BoxList } from './components/BoxList';
import { BoxDetail } from './components/BoxDetail';
import { CreateBox } from './components/CreateBox';
import { Stats } from './components/Stats';
import './App.css';

export interface Box {
  id: string;
  name: string;
  description?: string;
  count: number;
  totalValue: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({ totalBoxes: 0, totalSadaqahs: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBoxes = async () => {
    try {
      const res = await fetch('/api/boxes');
      const data = await res.json() as { success: boolean; boxes: Box[] };
      if (data.success) {
        setBoxes(data.boxes);
      }
    } catch (error) {
      console.error('Failed to fetch boxes:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json() as { success: boolean; stats: typeof stats };
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBoxes(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleBoxCreated = (box: Box) => {
    setBoxes([box, ...boxes]);
    setShowCreateForm(false);
    fetchStats();
  };

  const handleBoxDeleted = (boxId: string) => {
    setBoxes(boxes.filter(b => b.id !== boxId));
    if (selectedBox?.id === boxId) {
      setSelectedBox(null);
    }
    fetchStats();
  };

  const handleBoxUpdated = (updatedBox: Box) => {
    setBoxes(boxes.map(b => b.id === updatedBox.id ? updatedBox : b));
    if (selectedBox?.id === updatedBox.id) {
      setSelectedBox(updatedBox);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🕌 SadakaBox</h1>
        <p>Track your charity and sadaqah contributions</p>
      </header>

      <main className="app-main">
        <Stats stats={stats} />

        <div className="content">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Your Boxes</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                + New Box
              </button>
            </div>

            {showCreateForm && (
              <CreateBox 
                onCreated={handleBoxCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            <BoxList 
              boxes={boxes}
              selectedBoxId={selectedBox?.id}
              onSelectBox={setSelectedBox}
              onBoxDeleted={handleBoxDeleted}
            />
          </aside>

          <section className="detail">
            {selectedBox ? (
              <BoxDetail 
                box={selectedBox}
                onBoxUpdated={handleBoxUpdated}
              />
            ) : (
              <div className="empty-state">
                <h3>Select a box to view details</h3>
                <p>or create a new box to get started</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
