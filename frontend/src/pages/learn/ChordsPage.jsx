import React, { useState, useMemo } from "react";
import chordDataService from "../../services/ChordDataService.tsx";
import "../../components/common/ChordDiagram.css";
import "./ChordsPage.css";

// Root notes with sharps
const ROOT_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Chord type definitions
const CHORD_TYPES = [
    { id: "major", label: "Major", symbol: "" },
    { id: "minor", label: "Minor", symbol: "m" },
    { id: "7", label: "Dominant 7", symbol: "7" },
    { id: "maj7", label: "Major 7", symbol: "maj7" },
    { id: "m7", label: "Minor 7", symbol: "m7" },
    { id: "dim", label: "Diminished", symbol: "dim" },
    { id: "aug", label: "Augmented", symbol: "aug" },
    { id: "sus2", label: "Sus2", symbol: "sus2" },
    { id: "sus4", label: "Sus4", symbol: "sus4" },
    { id: "add9", label: "Add9", symbol: "add9" },
    { id: "6", label: "6th", symbol: "6" },
    { id: "9", label: "9th", symbol: "9" },
    { id: "5", label: "Power", symbol: "5" },
    { id: "mM7", label: "Minor Major 7", symbol: "mM7" },
];

// Get chord name from root and type
const getChordName = (root, type) => `${root}${type?.symbol ?? ""}`;

const PianoChordDiagram = ({ chord, size = "large" }) => {
    const renderData = chordDataService.renderPianoKeys(chord, { className: "chord-diagram-piano" });
    const notes = renderData.activeNotes || [];
    const keyOrder = renderData.keyOrder || [];

    const sizes = {
        medium: { whiteWidth: 18, whiteHeight: 70, blackWidth: 11, blackHeight: 45, fontSize: 10 },
        large: { whiteWidth: 22, whiteHeight: 90, blackWidth: 14, blackHeight: 58, fontSize: 11 },
    };

    const { whiteWidth, whiteHeight, blackWidth, blackHeight, fontSize } = sizes[size];
    const whiteKeysCount = keyOrder.filter((k) => !k.includes("#")).length;

    return (
        <div className="piano-chord-preview" title={chord}>
            <div className="piano-chord-diagram" style={{ width: `${whiteKeysCount * whiteWidth}px` }}>
                <div className="piano-keys-wrapper">
                    {keyOrder.map((note, index) => {
                        const isPressed = notes.includes(note);
                        const isBlackKey = note.includes("#");

                        let leftOffset = 0;
                        if (isBlackKey) {
                            const whiteKeysBefore = keyOrder.slice(0, index).filter((k) => !k.includes("#")).length;
                            leftOffset = whiteKeysBefore * whiteWidth - blackWidth / 2;
                        }

                        return (
                            <div
                                key={note}
                                className={`piano-key-diagram ${isBlackKey ? "black" : "white"} ${isPressed ? "active" : ""}`}
                                style={{
                                    width: isBlackKey ? `${blackWidth}px` : `${whiteWidth}px`,
                                    height: isBlackKey ? `${blackHeight}px` : `${whiteHeight}px`,
                                    left: isBlackKey ? `${leftOffset}px` : "auto",
                                    fontSize: `${fontSize}px`,
                                }}
                            >
                                {isPressed && <span className="note-indicator" />}
                            </div>
                        );
                    })}
                </div>
                <div className="chord-label-piano">{chord}</div>
            </div>
        </div>
    );
};

// Render a single chord variation SVG (standalone, not using ChordDiagram's cycling)
const ChordVariationDiagram = ({ variation, chordName, size = "large" }) => {
    const sizes = {
        small: { width: 90, height: 135, fretSpacing: 18 },
        medium: { width: 120, height: 170, fretSpacing: 22 },
        large: { width: 150, height: 200, fretSpacing: 27 },
    };

    const { width, height, fretSpacing } = sizes[size];
    const leftMargin = 20;
    const stringSpacing = (width - leftMargin) / 5;

    const parseStringFret = (fret) => {
        if (fret === "x" || fret === "X") return -1;
        const num = parseInt(fret);
        return isNaN(num) ? -1 : num;
    };

    const fretNumbers = variation.frets
        .map((f) => {
            const parsed = parseStringFret(f);
            return parsed > 0 ? parsed : null;
        })
        .filter((f) => f !== null);

    const minFret = fretNumbers.length > 0 ? Math.min(...fretNumbers) : 1;
    const maxFret = fretNumbers.length > 0 ? Math.max(...fretNumbers) : 4;
    const hasOpenStrings = variation.frets.some((f) => parseStringFret(f) === 0);
    const startFret = hasOpenStrings && minFret <= 5 ? 0 : minFret;
    const showFretNumber = startFret >= 5;

    const getFretPosition = (absoluteFret, startFret) => {
        if (absoluteFret === 0) return null;
        const relativeFret = startFret === 0 ? absoluteFret : absoluteFret - startFret + 1;
        return 30 + (relativeFret - 0.5) * fretSpacing;
    };

    const getFingerColor = (finger) => {
        const colors = {
            0: "transparent",
            1: "#ff6b6b",
            2: "#4ecdc4",
            3: "#45b7d1",
            4: "#96ceb4",
        };
        return colors[finger] || "#333";
    };

    return (
        <div className="chord-variation-item">
            <div className="chord-variation-label">{variation.position}</div>
            <div className="chord-variation-diagram">
                <svg width={width + 20} height={height + 20} className="chord-diagram">
                    {/* String names */}
                    {chordDataService.guitarStringNames.map((stringName, index) => {
                        const x = leftMargin + index * stringSpacing;
                        return (
                            <text key={`string-name-${index}`} x={x} y="10" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#888">
                                {stringName}
                            </text>
                        );
                    })}

                    {/* Fret position indicator */}
                    {showFretNumber && (
                        <text x="0" y="34" fontSize="14" fontWeight="bold" fill="#888">
                            {startFret}
                        </text>
                    )}

                    {/* Nut */}
                    <line x1={leftMargin} y1="30" x2={width + leftMargin - 20} y2="30" stroke={startFret === 0 || startFret === 1 ? "#8B4513" : "#555"} strokeWidth={startFret === 0 || startFret === 1 ? "5" : "3.5"} />

                    {/* Frets */}
                    {[1, 2, 3, 4].map((fret) => (
                        <line key={fret} x1={leftMargin} y1={30 + fret * fretSpacing} x2={width + leftMargin - 20} y2={30 + fret * fretSpacing} stroke="#555" strokeWidth="3" />
                    ))}

                    {/* Strings */}
                    {chordDataService.guitarStringNames.map((string, index) => (
                        <line key={string + index} x1={leftMargin + index * stringSpacing} y1="30" x2={leftMargin + index * stringSpacing} y2={30 + 4 * fretSpacing} stroke="#888" strokeWidth="3" />
                    ))}

                    {/* Finger positions */}
                    {variation.frets.map((fretStr, stringIndex) => {
                        const fret = parseStringFret(fretStr);
                        const x = leftMargin + stringIndex * stringSpacing;
                        const finger = variation.fingers[stringIndex];

                        if (fret === -1) {
                            return (
                                <g key={stringIndex}>
                                    <line x1={x - 3} y1="18" x2={x + 3} y2="26" stroke="#ff4444" strokeWidth="4" />
                                    <line x1={x - 3} y1="26" x2={x + 3} y2="18" stroke="#ff4444" strokeWidth="4" />
                                </g>
                            );
                        } else if (fret === 0) {
                            return (
                                <g key={stringIndex}>
                                    <circle cx={x} cy="22" r="5" fill="#1a1a1a" stroke="#4CAF50" strokeWidth="3" />
                                    <text x={x} y="26" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#4CAF50">
                                        0
                                    </text>
                                </g>
                            );
                        } else if (fret > 0) {
                            const y = getFretPosition(fret, startFret);
                            return (
                                <g key={stringIndex}>
                                    <circle cx={x} cy={y} r="8" fill={getFingerColor(finger)} stroke="#333" strokeWidth="3" />
                                    {finger && finger !== 0 && (
                                        <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">
                                            {finger}
                                        </text>
                                    )}
                                </g>
                            );
                        }
                        return null;
                    })}

                    {/* Chord name */}
                    <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ccc">
                        {chordName}
                    </text>
                </svg>
            </div>
        </div>
    );
};

const ChordsPage = () => {
    const [selectedRoot, setSelectedRoot] = useState("C");
    const [selectedType, setSelectedType] = useState("major");
    const [selectedChord, setSelectedChord] = useState(null);

    const selectedChordType = useMemo(() => {
        return CHORD_TYPES.find((t) => t.id === selectedType) || CHORD_TYPES[0];
    }, [selectedType]);

    // Build chord name from current selection
    const currentChordName = useMemo(() => {
        return getChordName(selectedRoot, selectedChordType);
    }, [selectedRoot, selectedChordType]);

    // Get all variations for the currently selected chord
    const chordVariations = useMemo(() => {
        if (!currentChordName) return [];
        return chordDataService.getGuitarChordVariations(currentChordName);
    }, [currentChordName]);

    // Get piano chord notes for description
    const pianoNotes = useMemo(() => {
        if (!currentChordName) return [];
        return chordDataService.getPianoChordData(currentChordName);
    }, [currentChordName]);

    // Check if chord has variations data
    const hasVariations = chordVariations.length > 0;
    const hasMultipleVariations = chordVariations.length > 1;

    const handleChordClick = (root, type) => {
        const chordType = typeof type === "string" ? CHORD_TYPES.find((t) => t.id === type) || CHORD_TYPES[0] : type || CHORD_TYPES[0];

        setSelectedRoot(root);
        setSelectedType(chordType.id);
        setSelectedChord(getChordName(root, chordType));
    };

    const handleTypeClick = (type) => {
        setSelectedType(type.id);
        setSelectedChord(getChordName(selectedRoot, type));
    };

    return (
        <div className="chords-page">
            <header className="chords-hero">
                <div className="chords-hero-copy">
                    <p className="hero-kicker">Chord atlas</p>
                    <h1>Chords</h1>
                    <p className="chords-page-subtitle">Browse guitar CAGED shapes and matching piano voicings in one place.</p>
                </div>

                <div className="selected-chord-display">
                    <div className="selected-chord-name">{currentChordName}</div>
                    <div className="selected-chord-copy">
                        <div className="selected-chord-label">Selected chord</div>
                        {pianoNotes.length > 0 && <div className="selected-chord-notes">Notes: {pianoNotes.join(" - ")}</div>}
                    </div>
                </div>
                <div className="chords-hero-summary">
                    <div className="summary-chip muted">
                        <span className="summary-chip-label">Variations</span>
                        <strong>{hasMultipleVariations ? `${chordVariations.length} CAGED` : "Single shape"}</strong>
                    </div>
                </div>
            </header>

            <div className="chords-workbench">
                <aside className="chords-rail">
                    <section className="selector-panel">
                        <div className="selector-label">Root note</div>
                        <div className="root-note-buttons">
                            {ROOT_NOTES.map((root) => (
                                <button key={root} className={`root-note-btn ${selectedRoot === root ? "active" : ""}`} onClick={() => handleChordClick(root, selectedType)}>
                                    {root}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="selector-panel">
                        <div className="selector-label">Chord type</div>
                        <div className="chord-type-buttons">
                            {CHORD_TYPES.map((type) => (
                                <button key={type.id} className={`chord-type-btn ${selectedType === type.id ? "active" : ""}`} onClick={() => handleTypeClick(type)}>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="selector-panel selector-panel-note">
                        <div className="selector-label">Notes</div>
                        <p>{pianoNotes.length > 0 ? pianoNotes.join(" - ") : "Select a chord to load its tones."}</p>
                    </section>
                </aside>

                <main className="chords-lab">
                    {hasVariations && (
                        <div className="chord-variations-panel">
                            <div className="variations-panel-header">
                                <h2>All CAGED variations</h2>
                                <span className="variations-hint">Click any shape to see finger positions</span>
                            </div>
                            <div className="chord-variations-list">
                                {chordVariations.map((variation, index) => (
                                    <ChordVariationDiagram key={`${currentChordName}-${index}`} variation={variation} chordName={currentChordName} size="large" />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="piano-chord-panel">
                        <div className="piano-chord-panel-header">
                            <h2>Piano voicing</h2>
                        </div>
                        <div className="piano-chord-panel-body">
                            <PianoChordDiagram chord={currentChordName} size="large" />
                        </div>
                    </div>

                    <div className="chord-quick-reference">
                        <div className="quick-reference-header">
                            <h2>All {selectedRoot} chords</h2>
                        </div>
                        <div className="chord-type-sections">
                            {CHORD_TYPES.map((type) => {
                                const chordName = getChordName(selectedRoot, type);
                                const variations = chordDataService.getGuitarChordVariations(chordName);
                                const isSelected = selectedChord === chordName;

                                return (
                                    <div key={type.id} className={`chord-type-section ${isSelected ? "selected" : ""}`} onClick={() => handleChordClick(selectedRoot, type)}>
                                        <div className="chord-type-section-header">
                                            <span className="chord-type-label">{type.label}</span>
                                            <span className="chord-type-symbol">{type.symbol || "(none)"}</span>
                                        </div>
                                        <div className="chord-type-section-name">{chordName}</div>
                                        <div className="chord-type-section-count">
                                            {variations.length} shape{variations.length !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChordsPage;
