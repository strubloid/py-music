import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Music, Piano, Guitar, Target, Zap, Maximize2 } from "lucide-react";
import KeySelector from "../../components/KeySelector/KeySelector";
import PianoKeyboard from "../../components/PianoKeyboard/PianoKeyboard";
import GuitarFretboard from "../../components/GuitarFretboard/GuitarFretboard";
import "./ScalesPage.css";

const STORAGE_KEY = "strubloid:scales:visited";
const RANGE_STORAGE_KEY = "strubloid:scales:range";

// Three shared levels: octaves (piano) and frets (fretboard) grow together
const RANGE_LEVELS = [
    { id: 1, octaves: 1, frets: 12, label: "Single", hint: "1 octave · 12 frets" },
    { id: 2, octaves: 2, frets: 17, label: "Double", hint: "2 octaves · 17 frets" },
    { id: 3, octaves: 3, frets: 22, label: "Triple", hint: "3 octaves · 22 frets" },
];

const loadVisited = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
};

const saveVisited = (state) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* ignore */
    }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadStreak = () => {
    try {
        return JSON.parse(localStorage.getItem("strubloid:scales:streak") || "{}");
    } catch {
        return {};
    }
};

const ScalesPage = () => {
    const [selectedKey, setSelectedKey] = useState("C");
    const [selectedInterval, setSelectedInterval] = useState("ionian");
    const [scaleData, setScaleData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availableModes, setAvailableModes] = useState([]);
    const [allModes, setAllModes] = useState([]);
    const [visited, setVisited] = useState(loadVisited);
    const [streak, setStreak] = useState(loadStreak);
    const [tipDismissed, setTipDismissed] = useState(() => localStorage.getItem("strubloid:scales:tip-dismissed") === "1");
    const [rangeLevel, setRangeLevel] = useState(() => {
        try {
            const saved = parseInt(localStorage.getItem(RANGE_STORAGE_KEY) || "1", 10);
            return RANGE_LEVELS.find((r) => r.id === saved)?.id || 1;
        } catch {
            return 1;
        }
    });

    const handleModesWheel = (event) => {
        const { deltaX, deltaY, currentTarget } = event;
        if (Math.abs(deltaY) <= Math.abs(deltaX)) return;
        event.preventDefault();
        currentTarget.scrollLeft += deltaY;
    };

    useEffect(() => {
        fetchAvailableModes();
    }, []);

    useEffect(() => {
        if (selectedKey && selectedInterval) fetchScaleData(selectedKey, selectedInterval);
    }, [selectedKey, selectedInterval, rangeLevel]);

    // Persist range level to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(RANGE_STORAGE_KEY, String(rangeLevel));
        } catch {
            /* ignore */
        }
    }, [rangeLevel]);

    const fetchAvailableModes = async () => {
        try {
            const response = await axios.get("/api/intervals");
            const modes = response.data.intervals || [];
            const filtered = modes.filter((m) => m.key !== "major" && m.key !== "minor");
            setAvailableModes(filtered);
            const defaultMode = filtered.find((m) => m.key === "ionian") || filtered[0];
            if (defaultMode) setSelectedInterval(defaultMode.key);
        } catch {
            setAvailableModes([
                { key: "ionian", name: "Ionian", description: "The major scale." },
                { key: "dorian", name: "Dorian", description: "Minor with raised 6th." },
                { key: "phrygian", name: "Phrygian", description: "Minor with flattened 2nd." },
                { key: "lydian", name: "Lydian", description: "Major with raised 4th." },
                { key: "mixolydian", name: "Mixolydian", description: "Major with flattened 7th." },
                { key: "aeolian", name: "Aeolian", description: "The natural minor scale." },
                { key: "locrian", name: "Locrian", description: "Very rare, diminished." },
            ]);
        }
    };

    useEffect(() => {
        if (!selectedKey || availableModes.length === 0) return;
        // Clear stale data so pill row doesn't show the previous key's mode previews
        setAllModes([]);
        let cancelled = false;
        const fetchAllModes = async () => {
            const key = selectedKey;
            const level = RANGE_LEVELS.find((r) => r.id === rangeLevel) || RANGE_LEVELS[0];
            const results = [];
            for (const mode of availableModes) {
                if (cancelled) return;
                try {
                    const response = await axios.get(`/api/scale/${encodeURIComponent(key)}?interval=${mode.key}&octaves=${level.octaves}`);
                    if (response.data) results.push({ ...response.data, modeKey: mode.key, modeName: mode.name });
                } catch {
                    /* skip */
                }
            }
            if (!cancelled && key === selectedKey) setAllModes(results);
        };
        fetchAllModes();
        return () => { cancelled = true; };
    }, [selectedKey, availableModes, rangeLevel]);

    const fetchScaleData = async (key, interval) => {
        try {
            setLoading(true);
            setError(null);
            const level = RANGE_LEVELS.find((r) => r.id === rangeLevel) || RANGE_LEVELS[0];
            const response = await axios.get(`/api/scale/${encodeURIComponent(key)}?interval=${interval}&octaves=${level.octaves}`);
            setScaleData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch scale data");
        } finally {
            setLoading(false);
        }
    };

    // Track visited modes for the gamified "explored" pill state
    useEffect(() => {
        if (!selectedKey || !selectedInterval) return;
        setVisited((prev) => {
            const dayVisits = prev[selectedKey] || {};
            const next = { ...prev, [selectedKey]: { ...dayVisits, [selectedInterval]: todayKey() } };
            saveVisited(next);
            return next;
        });
        setStreak((prev) => {
            const today = todayKey();
            const newStreak = { ...prev, lastVisit: today, count: prev.lastVisit === today ? prev.count : (prev.count || 0) + 1 };
            try {
                localStorage.setItem("strubloid:scales:streak", JSON.stringify(newStreak));
            } catch {}
            return newStreak;
        });
    }, [selectedKey, selectedInterval]);

    const dismissTip = () => {
        setTipDismissed(true);
        try {
            localStorage.setItem("strubloid:scales:tip-dismissed", "1");
        } catch {}
    };

    // Match current mode only if its key matches the currently-selected key,
    // otherwise fall back to scaleData (avoids showing C-rooted data when user
    // has just switched to F# and the per-mode preloader hasn't completed yet).
    const currentMode = allModes.find((m) => m.modeKey === selectedInterval && m.key === selectedKey);
    const displayData = currentMode || scaleData;

    const modesExplored = useMemo(() => {
        const days = visited[selectedKey] || {};
        return Object.keys(days).length;
    }, [visited, selectedKey]);

    const totalModes = availableModes.length;

    if (error) {
        return (
            <div className="scales-page">
                <div className="error-container">
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button onClick={() => fetchScaleData(selectedKey, selectedInterval)}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="scales-page">
            <header className="scales-topbar">
                <div className="topbar-left">
                    <Music className="topbar-icon" />
                    <div>
                        <h1>Scale Explorer</h1>
                    </div>
                </div>
                <KeySelector selectedKey={selectedKey} onKeyChange={setSelectedKey} loading={loading} />
                <div className="topbar-right">
                    {displayData && (
                        <div className="hero-name">
                            <span className="hero-key">{selectedKey}</span>
                            <span className="hero-mode-name">{currentMode?.modeName || selectedInterval}</span>
                        </div>
                    )}
                    <div className="streak-pill" title={`${modesExplored} of ${totalModes} modes explored today`}>
                        <Zap size={12} />
                        <span>
                            {modesExplored}
                            <span className="streak-sep">/</span>
                            {totalModes}
                        </span>
                    </div>
                </div>
            </header>

            <div className="scales-workbench">
                <aside className="scales-rail">
                    <section className="rail-panel rail-panel-modes">
                        <div className="rail-label">Modes</div>
                        <div className="modes-pill-row" role="tablist" aria-label="Mode selector" onWheel={handleModesWheel}>
                            {allModes.map((mode) => {
                                const isActive = selectedInterval === mode.modeKey;
                                const isVisited = !!(visited[selectedKey] || {})[mode.modeKey];
                                return (
                                    <button
                                        key={mode.modeKey}
                                        role="tab"
                                        aria-selected={isActive}
                                        className={`mode-pill ${isActive ? "active" : ""} ${isVisited ? "visited" : ""}`}
                                        onClick={() => setSelectedInterval(mode.modeKey)}
                                        title={mode.notes ? `${mode.modeName}: ${mode.notes.join(" ")}` : mode.modeName}
                                    >
                                        <span className="mode-pill-name">{mode.modeName}</span>
                                        {isVisited && !isActive && <span className="mode-pill-dot" />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rail-panel rail-panel-range" role="group" aria-label="Instrument range">
                        <div className="rail-label rail-label-inline">
                            <Maximize2 size={13} />
                            <span>Range</span>
                        </div>
                        <div className="range-bar-buttons">
                            {RANGE_LEVELS.map((level) => {
                                const isActive = rangeLevel === level.id;
                                return (
                                    <button key={level.id} type="button" className={`range-btn ${isActive ? "active" : ""}`} onClick={() => setRangeLevel(level.id)} aria-pressed={isActive} title={level.hint}>
                                        <span className="range-btn-label">{level.label}</span>
                                        <span className="range-btn-hint">{level.hint}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {!tipDismissed && (
                        <section className="rail-panel tip-section">
                            <div className="tip-card">
                                <div className="tip-head">
                                    <h4>Practice tip</h4>
                                    <button className="tip-dismiss" onClick={dismissTip} aria-label="Dismiss">
                                        ×
                                    </button>
                                </div>
                                <p>Play each degree in order, ascending then descending. Land on the root on strong beats so the tonal center locks in.</p>
                            </div>
                        </section>
                    )}
                </aside>

                <main className="scales-canvas">
                    {loading && (
                        <div className="loading-row">
                            <div className="loading-spinner" />
                            <span>Loading scale analysis...</span>
                        </div>
                    )}

                    {displayData && !loading && (
                        <>
                            <section className="theory-row">
                                <div className="section-head">
                                    <Target size={14} />
                                    <span>Scale degrees & chords</span>
                                </div>
                                <div className="degrees-grid">
                                    {displayData.scale_degrees?.map((deg, i) => (
                                        <div key={i} className={`degree-card ${deg.degree === 1 ? "root" : ""}`}>
                                            <div className="degree-top">
                                                <span className="degree-roman">{deg.roman}</span>
                                            </div>
                                            <div className="degree-note">{deg.chord || deg.note}</div>
                                            <div className="degree-chord-pill">{deg.function}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className={`instruments-stack ${rangeLevel === 1 ? "range-single" : "range-expanded"}`}>
                                <div className="instrument-card">
                                    <div className="instrument-head">
                                        <Piano size={14} />
                                        <span>Piano</span>
                                        <span className="instrument-head-meta">
                                            {RANGE_LEVELS.find((r) => r.id === rangeLevel)?.octaves} octave{RANGE_LEVELS.find((r) => r.id === rangeLevel)?.octaves > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <PianoKeyboard keyboardData={displayData.keyboard_data} />
                                </div>
                                <div className="instrument-card">
                                    <div className="instrument-head">
                                        <Guitar size={14} />
                                        <span>Fretboard</span>
                                        <span className="instrument-head-meta">{RANGE_LEVELS.find((r) => r.id === rangeLevel)?.frets} frets</span>
                                    </div>
                                    <GuitarFretboard fretboardData={displayData.fretboard_data} fretCount={RANGE_LEVELS.find((r) => r.id === rangeLevel)?.frets || 12} />
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ScalesPage;
