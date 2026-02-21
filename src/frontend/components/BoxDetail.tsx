import { useState, useEffect } from 'react';
import type { Box, Currency, Tag } from '../App';
import { SadaqahList } from './SadaqahList';
import { AddSadaqah } from './AddSadaqah';
import { CollectionHistory } from './CollectionHistory';
import './BoxDetail.css';

interface Sadaqah {
  id: string;
  boxId: string;
  value: number;
  currencyId: string;
  currency?: Currency;
  createdAt: string;
}

interface Collection {
  id: string;
  boxId: string;
  emptiedAt: string;
  sadaqahsCollected: number;
  totalValue: number;
  currencyId: string;
  currency?: Currency;
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
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);

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

  const fetchAvailableTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json() as { success: boolean; tags: Tag[] };
      if (data.success) {
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSadaqahs(), fetchCollections(), fetchAvailableTags()]);
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

  const handleAddTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/boxes/${box.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        // Refresh box to get updated tags
        const boxRes = await fetch(`/api/boxes/${box.id}`);
        const boxData = await boxRes.json() as { success: boolean; box: Box };
        if (boxData.success) {
          onBoxUpdated(boxData.box);
        }
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/boxes/${box.id}/tags/${tagId}`, {
        method: 'DELETE',
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        // Refresh box to get updated tags
        const boxRes = await fetch(`/api/boxes/${box.id}`);
        const boxData = await boxRes.json() as { success: boolean; box: Box };
        if (boxData.success) {
          onBoxUpdated(boxData.box);
        }
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const getCurrencyDisplay = () => {
    if (!box.currency) return '';
    return box.currency.symbol || box.currency.code;
  };

  // Filter out tags already assigned to the box
  const unassignedTags = availableTags.filter(
    (tag) => !box.tags?.some((t) => t.id === tag.id)
  );

  if (loading) {
    return <div className="box-detail-loading">Loading...</div>;
  }

  return (
    <div className="box-detail">
      <header className="box-detail-header">
        <div>
          <h2>{box.name}</h2>
          {box.description && <p className="box-description">{box.description}</p>}
          
          {/* Tags section */}
          <div className="box-tags-section">
            {box.tags && box.tags.length > 0 && (
              <div className="box-tags-list">
                {box.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="box-tag-item"
                    style={{ 
                      backgroundColor: tag.color ? `${tag.color}30` : '#e0e7ff',
                      color: tag.color || '#4f46e5',
                      border: `1px solid ${tag.color || '#c7d2fe'}`,
                    }}
                  >
                    {tag.name}
                    <button 
                      className="tag-remove-btn"
                      onClick={() => handleRemoveTag(tag.id)}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {unassignedTags.length > 0 && (
              <div className="tag-selector-wrapper">
                <button 
                  className="btn btn-sm btn-tag-add"
                  onClick={() => setShowTagSelector(!showTagSelector)}
                >
                  {showTagSelector ? 'Cancel' : '+ Add Tag'}
                </button>
                
                {showTagSelector && (
                  <div className="tag-dropdown">
                    {unassignedTags.map((tag) => (
                      <button
                        key={tag.id}
                        className="tag-option"
                        onClick={() => {
                          handleAddTag(tag.id);
                          setShowTagSelector(false);
                        }}
                        style={{ 
                          backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                          color: tag.color || '#374151',
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
          <span className="stat-label">{getCurrencyDisplay() || 'Value'}</span>
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
