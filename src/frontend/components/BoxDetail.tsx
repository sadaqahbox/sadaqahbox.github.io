import { useState, useEffect } from 'react';
import { Box } from '../App';
import { SadaqahList } from './SadaqahList';
import { AddSadaqah } from './AddSadaqah';
import { CollectionHistory } from './CollectionHistory';
import './BoxDetail.css';

interface Sadaqah {
  id: string;
  boxId: string;
  value: number;
  currency: string;
  createdAt: string;
  location?: string;
}

interface Collection {
  id: string;
  boxId: string;
  emptiedAt: string;
  sadaqahsCollected: number;
  totalValue: number;
  currency: string;
}

interface BoxDetailProps {
  box: Box;
  onBoxUpdated: (box: Box) => void;
}

export function BoxDetail({ box, onBoxUpdated }: BoxDetailProps) {
  const [sadaqahs, setSadaqahs] = useState<Sadaqah[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState<'sadaqahs' | 'collections'>('sadaqahs');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSadaqahs = async () => {
    try {
      const res = await fetch(`/api/boxes/${box.id}/sadaqahs`);
      const data = await res.json() as { success: boolean; sadaqahs: Sadaqah[] };
      if (data.success) {
        setSadaqahs(data.sadaqahs);
      }
    } catch (error) {
      console.error('Failed to fetch sadaqahs:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch(`/api/boxes/${box.id}/collections`);
      const data = await res.json() as { success: boolean; collections: Collection[] };
      if (data.success) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSadaqahs(), fetchCollections()]);
      setLoading(false);
    };
    loadData();
  }, [box.id]);

  const handleSadaqahAdded = async () => {
    await fetchSadaqahs();
    // Refresh box data to get updated count
    try {
      const res = await fetch(`/api/boxes/${box.id}`);
      const data = await res.json() as { success: boolean; box: Box };
      if (data.success) {
        onBoxUpdated(data.box);
      }
    } catch (error) {
      console.error('Failed to refresh box:', error);
    }
    setShowAddForm(false);
  };

  const handleCollect = async () => {
    if (!confirm(`Collect all sadaqahs from "${box.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/boxes/${box.id}/empty`, { method: 'POST' });
      const data = await res.json() as { success: boolean; box: Box };
      if (data.success) {
        onBoxUpdated(data.box);
        await fetchSadaqahs();
        await fetchCollections();
      }
    } catch (error) {
      console.error('Failed to collect:', error);
    }
  };

  if (loading) {
    return <div className="box-detail-loading">Loading...</div>;
  }

  return (
    <div className="box-detail">
      <header className="box-detail-header">
        <div>
          <h2>{box.name}</h2>
          {box.description && <p className="box-description">{box.description}</p>}
        </div>
        <div className="box-detail-actions">
          {box.count > 0 && (
            <button className="btn btn-primary" onClick={handleCollect}>
              🎯 Collect
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Sadaqah'}
          </button>
        </div>
      </header>

      <div className="box-stats-summary">
        <div className="stat">
          <span className="stat-number">{box.count}</span>
          <span className="stat-label">Sadaqahs</span>
        </div>
        <div className="stat">
          <span className="stat-number">{box.totalValue}</span>
          <span className="stat-label">{box.currency || 'Value'}</span>
        </div>
        <div className="stat">
          <span className="stat-number">{collections.length}</span>
          <span className="stat-label">Collections</span>
        </div>
      </div>

      {showAddForm && (
        <AddSadaqah 
          boxId={box.id}
          onAdded={handleSadaqahAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'sadaqahs' ? 'active' : ''}`}
          onClick={() => setActiveTab('sadaqahs')}
        >
          Sadaqahs ({sadaqahs.length})
        </button>
        <button
          className={`tab ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          Collections ({collections.length})
        </button>
      </div>

      {activeTab === 'sadaqahs' ? (
        <SadaqahList sadaqahs={sadaqahs} currency={box.currency} />
      ) : (
        <CollectionHistory collections={collections} />
      )}
    </div>
  );
}
