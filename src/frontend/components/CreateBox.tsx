import { useState } from 'react';
import { Box } from '../App';
import './CreateBox.css';

interface CreateBoxProps {
  onCreated: (box: Box) => void;
  onCancel: () => void;
}

export function CreateBox({ onCreated, onCancel }: CreateBoxProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json() as { success: boolean; box: import('../App').Box };
      if (data.success) {
        onCreated(data.box);
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to create box:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Box'}
        </button>
      </div>
    </form>
  );
}
