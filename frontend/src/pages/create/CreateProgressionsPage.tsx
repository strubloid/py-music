import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ListMusic } from 'lucide-react';
import KeySelector from '../../components/KeySelector/KeySelector';
import ProgressionBuilder from '../../components/common/ProgressionBuilder';
import LyricsSection from '../../components/common/LyricsSection';
import { useAuth } from '../../contexts/AuthContext';
import { useChordPanel } from '../../contexts/ChordPanelContext';
import { createProgression } from '../../services/api';
import './CreateProgressionsPage.scss';

const CreateProgressionsPage = () => {
  const { isLoggedIn, isGuest, promptLogin } = useAuth();
  const { progressionLines, lyrics, chordOverLyrics } = useChordPanel();
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedInterval, setSelectedInterval] = useState('major');
  const [scaleData, setScaleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedKey && selectedInterval) {
      fetchScaleData(selectedKey, selectedInterval);
    }
  }, [selectedKey, selectedInterval]);

  const fetchScaleData = async (key, interval) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/scale/${encodeURIComponent(key)}?interval=${interval}`);
      setScaleData(res.data);
    } catch {
      setScaleData(null);
    } finally {
      setLoading(false);
    }
  };

  const bumpNewSongsCount = () => {
    const current = parseInt(localStorage.getItem('newSongsCount') || '0', 10)
    localStorage.setItem('newSongsCount', String(current + 1))
  }

  const handleSave = useCallback(async (chords) => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      if (isLoggedIn) {
        await createProgression({
          name: saveName,
          key: selectedKey,
          interval: selectedInterval,
          chords,
          lyrics: JSON.stringify(lyrics),
          chordOverLyrics: JSON.stringify(chordOverLyrics),
        });
      } else {
        // Guest: save to localStorage
        const existing = JSON.parse(localStorage.getItem('guestProgressions') || '[]');
        const newProg = {
          id: `guest_${Date.now()}`,
          name: saveName,
          key: selectedKey,
          interval: selectedInterval,
          chords_json: JSON.stringify(chords),
          lyrics_json: JSON.stringify(lyrics),
          chord_over_lyrics_json: JSON.stringify(chordOverLyrics),
          created_at: new Date().toISOString(),
        };
        existing.push(newProg);
        localStorage.setItem('guestProgressions', JSON.stringify(existing));
      }
      bumpNewSongsCount();
      setSaveName('');
    } catch {
      // silent — don't alert
    } finally {
      setSaving(false);
    }
  }, [saveName, isLoggedIn, selectedKey, selectedInterval, lyrics, chordOverLyrics]);

  const onSaveClick = () => {
    if (!saveName.trim()) {
      if (isGuest) promptLogin('save');
      return;
    }
    // Flatten all progression lines into a single chord list
    const chords = progressionLines.flat();
    handleSave(chords);
  };

  return (
    <div className="create-page">
      <div className="create-header">
        <div className="header-row">
          <ListMusic className="page-icon" size={24} />
          <h1>Create Progression</h1>
        </div>
        <KeySelector
          selectedKey={selectedKey}
          onKeyChange={setSelectedKey}
          selectedInterval={selectedInterval}
          onIntervalChange={setSelectedInterval}
          availableIntervals={[
            { key: 'major', name: 'Major' },
            { key: 'minor', name: 'Minor' },
          ]}
          loading={loading}
        />
      </div>

      <div className="save-row">
        <input
          type="text"
          placeholder="Name your progression..."
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          className="save-name-input"
        />
        <button
          className="save-btn"
          onClick={onSaveClick}
          disabled={saving || !saveName.trim()}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {!isLoggedIn && (
          <span className="guest-hint">
            <button onClick={() => promptLogin('save')} className="link-btn">
              Sign up free
            </button>{' '}
            to save permanently
          </span>
        )}
      </div>

      {scaleData && <ProgressionBuilder scaleData={scaleData} onSave={handleSave} saveName={saveName} />}
      <LyricsSection />
    </div>
  );
};

export default CreateProgressionsPage;
