import { useState, useEffect } from 'react';
import type { Box, Tag } from '../App';
import './CreateBox.css';

interface CreateBoxProps {
  onCreated: (box: Box) => void;
  onCancel: () => void;
}

export function CreateBox({ onCreated, onCancel }: CreateBoxProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTags, setFetchingTags] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags');
        const data = await res.json() as { success: boolean; tags: Tag[] };
        if (data.success) {
          setAvailableTags(data.tags);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setFetchingTags(false);
      }
    };
    fetchTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          description,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        }),
      });
      const data = await res.json() as { success: boolean; box: Box };
      if (data.success) {
        onCreated(data.box);
        setName('');
        setDescription('');
        setSelectedTagIds([]);
      }
    } catch (error) {
      console.error('Failed to create box:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <form className="create-box-form" onSubmit={handleSubmit}>
      <h3>Create New Box</h3>
      <div className="form-group">
        <label htmlFor="box-name">Name *</label>
        <input
          id="box-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Ramadan Charity"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="box-description">Description</label>
        <textarea
          id="box-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={2}
        />
      </div>
      
      {availableTags.length > 0 && (
        <div className="form-group">
          <label>Tags</label>
          <div className="tag-selector">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`tag-chip ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag.id)}
                style={{ 
                  backgroundColor: selectedTagIds.includes(tag.id) ? (tag.color || '#6366f1') : 'transparent',
                  borderColor: tag.color || '#6366f1',
                  color: selectedTagIds.includes(tag.id) ? '#fff' : (tag.color || '#6366f1'),
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || fetchingTags}
        >
          {loading ? 'Creating...' : 'Create Box'}
        </button>
      </div>
    </form>
  );
}
