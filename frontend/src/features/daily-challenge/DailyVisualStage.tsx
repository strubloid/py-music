import React, { useRef, useState } from "react";
import { Play, Volume2 } from "lucide-react";
import { createEarTrainingAudioEngine } from "../../audio/earTrainingAudio";
import PianoKeyboard from "../../components/PianoKeyboard/PianoKeyboard";
import GuitarFretboard from "../../components/GuitarFretboard/GuitarFretboard";
import "./DailyVisualStage.scss";

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TUNING = ["E", "B", "G", "D", "A", "E"];

const pitchClass = (note = "") => {
    const match = String(note).match(/[A-G](?:#|b)?/i)?.[0];
    const normalized = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" }[match] || match;
    return CHROMATIC.indexOf(normalized);
};

const InstrumentFrame = ({ notes, root, label, mode, children }) => {
    if (mode === "off") return null;
    const normalizedNotes = notes.map((note) => CHROMATIC[pitchClass(note)]).filter(Boolean);
    const normalizedRoot = CHROMATIC[pitchClass(root)] || root;
    const keyboardData = {
        natural_keys: ["C", "D", "E", "F", "G", "A", "B"],
        black_keys: [{ after_natural: 0 }, { after_natural: 1 }, { after_natural: 3 }, { after_natural: 4 }, { after_natural: 5 }],
        scale_notes: normalizedNotes,
        root_note: normalizedRoot,
    };
    const fretboardData = TUNING.map((string) => ({
        string,
        frets: Array.from({ length: 13 }, (_, fret) => {
            const note = CHROMATIC[(pitchClass(string) + fret) % 12];
            return { fret, note, is_scale_note: normalizedNotes.includes(note), is_root: note === normalizedRoot };
        }),
    }));
    return (
        <div className="daily-instrument-frame" aria-label={label}>
            {mode === "guitar" ? <GuitarFretboard fretboardData={fretboardData} fretCount={12} /> : <PianoKeyboard keyboardData={keyboardData} />}
            {children}
        </div>
    );
};

const ScaleVisual = ({ visual, mode }) => (
    <div className="daily-visual-stage__scale">
        <div className="daily-visual-stage__label-row">
            <span>Root {visual.root}</span>
            <span>{visual.notes?.length || 0} tones</span>
        </div>
        <InstrumentFrame notes={visual.notes} root={visual.root} label={`${visual.root} scale shape with ${visual.notes?.join(", ")}`} mode={mode} />
        <div className="daily-visual-stage__degrees" aria-label="Scale degrees">
            {(visual.degrees || []).map((degree, index) => (
                <span key={`${degree}-${index}`}>{degree}</span>
            ))}
        </div>
    </div>
);

const ChordPanel = ({ chord, label, mode }) => (
    <section className="daily-chord-panel" aria-label={`${label} chord notes: ${(chord.notes || []).join(", ")}`}>
        <header>{label}</header>
        <InstrumentFrame notes={chord.notes} root={chord.root} label={`${label}: ${chord.notes?.join(", ")}`} mode={mode} />
        <div className="daily-chord-panel__tones">
            {(chord.notes || []).map((note, index) => (
                <span key={`${note}-${index}`}>
                    <b>{chord.degrees?.[index] || index + 1}</b>
                    {note}
                </span>
            ))}
        </div>
    </section>
);

const ChordVisual = ({ visual, mode }) => (
    <div className={`daily-visual-stage__chords ${visual.chords?.length > 1 ? "is-comparison" : ""}`}>
        {(visual.chords || []).map((chord, index) => (
            <ChordPanel key={`${chord.root}-${index}`} chord={chord} mode={mode} label={visual.chords.length > 1 ? String.fromCharCode(65 + index) : "Chord tones"} />
        ))}
    </div>
);

const IntervalVisual = ({ visual, mode }) => {
    const notes = visual.notes || [];
    const distance = Math.max(1, Math.min(11, Number(visual.semitones) || Math.abs(pitchClass(notes[1]) - pitchClass(notes[0])) || 1));
    return (
        <div className="daily-visual-stage__interval" role="img" aria-label={`Interval from ${notes[0]} to ${notes[1]}`}>
            <div className="daily-interval-staff" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <b className="daily-interval-note daily-interval-note--start">{notes[0]}</b>
                <b className="daily-interval-note daily-interval-note--end" style={{ "--interval-rise": `${Math.max(8, Math.min(62, distance * 5))}%` }}>
                    {notes[1]}
                </b>
                <span className="daily-interval-arc" />
            </div>
            <InstrumentFrame notes={notes} root={notes[0]} label={`Interval endpoints: ${notes.join(" and ")}`} mode={mode} />
        </div>
    );
};

const RhythmVisual = ({ visual }) => {
    const events = visual.events || [];
    return (
        <div className="daily-visual-stage__rhythm" role="img" aria-label={`${visual.meter?.join("/")} rhythm grid`}>
            <strong>{visual.meter?.join("/") || "4/4"}</strong>
            <div className="daily-rhythm-grid">
                {[1, 2, 3, 4].map((beat) => (
                    <span key={beat} className={events[beat - 1] ? "is-hit" : ""}>
                        <i /> <b>{beat}</b>
                    </span>
                ))}
            </div>
        </div>
    );
};

const ConceptVisual = ({ visual }) => {
    if (visual.kind === "harmony")
        return (
            <div className="daily-visual-stage__harmony" role="img" aria-label={`Harmony in ${visual.key || "C"}: ${(visual.romanNumerals || []).join(" to ")}`}>
                {(visual.romanNumerals || []).map((item, index) => (
                    <React.Fragment key={`${item}-${index}`}>
                        <b>{item}</b>
                        {index < visual.romanNumerals.length - 1 && <i>→</i>}
                    </React.Fragment>
                ))}
            </div>
        );
    if (visual.kind === "tempo")
        return (
            <div className="daily-visual-stage__tempo" role="img" aria-label={`Tempo range ${visual.bpmRange?.join(" to ") || ""} beats per minute`}>
                <span>Slow</span>
                <i />
                <b>{visual.marking || `${visual.bpmRange?.[0] || 76}–${visual.bpmRange?.[1] || 108} BPM`}</b>
                <i />
                <span>Fast</span>
            </div>
        );
    if (visual.kind === "dynamics")
        return (
            <div className="daily-visual-stage__dynamics" role="img" aria-label={`Dynamic mark ${visual.mark}`}>
                <b>{visual.mark}</b>
                <span />
                <span />
                <span />
            </div>
        );
    if (visual.kind === "fretboard")
        return (
            <div className="daily-visual-stage__strings" role="img" aria-label={`Guitar tuning: ${(visual.tuning || []).join(", ")}`}>
                {(visual.tuning || []).map((note, index) => (
                    <span key={`${note}-${index}`}>
                        <i />
                        {note}
                    </span>
                ))}
            </div>
        );
    if (visual.kind === "staff")
        return (
            <div className="daily-visual-stage__staff" role="img" aria-label={`${visual.clef || "treble"} clef notation`}>
                <b>{visual.clef === "bass" ? "𝄢" : "𝄞"}</b>
                <i />
                <i />
                <i />
                <i />
                <i />
                <strong>{visual.accidental === "sharp" ? "♯" : visual.notes?.[0]?.note || "♪"}</strong>
            </div>
        );
    if (visual.kind === "melody")
        return (
            <div className="daily-visual-stage__melody" role="img" aria-label={`Three note melody: ${(visual.notes || []).join(", ")}`}>
                {(visual.notes || []).map((note, index) => (
                    <span key={`${note}-${index}`} style={{ "--melody-height": `${20 + (pitchClass(note) % 7) * 9}%` }}>
                        <i />
                        {note}
                    </span>
                ))}
            </div>
        );
    return (
        <div className="daily-visual-stage__concept" role="img" aria-label={`${visual.subject || visual.instrument || "Music"} visual`}>
            <b>{visual.subject || visual.instrument || "Music"}</b>
            <span>♪</span>
            <span>♫</span>
            <span>♪</span>
        </div>
    );
};

const EarReplay = ({ exercise }) => {
    const engine = useRef(null);
    const [playing, setPlaying] = useState(false);
    const replay = async () => {
        if (!exercise || playing) return;
        if (!engine.current) engine.current = createEarTrainingAudioEngine({ onStateChange: () => {} });
        setPlaying(true);
        try {
            await engine.current.ensureContext();
            const playback =
                exercise.chords?.length > 1
                    ? await engine.current.playChordSequence({ instrumentId: "piano", chords: exercise.chords })
                    : exercise.chords?.length === 1
                      ? await engine.current.playChord({ instrumentId: "piano", notes: exercise.chords[0] })
                      : exercise.notes?.length > 2
                        ? await engine.current.playNoteSequence({ instrumentId: "piano", notes: exercise.notes })
                        : await engine.current.playInterval({ instrumentId: "piano", mode: "melodic", rootToneNote: exercise.notes?.[0], targetToneNote: exercise.notes?.[1] });
            window.setTimeout(() => setPlaying(false), playback.durationMs);
        } catch {
            setPlaying(false);
        }
    };
    return (
        <button type="button" className="daily-visual-replay" onClick={replay} disabled={playing}>
            <Volume2 size={16} />
            {playing ? (
                "Listening…"
            ) : (
                <>
                    <Play size={14} />
                    Replay
                </>
            )}
        </button>
    );
};

const legacyVisual = (category, question = "", title = "") => {
    if (category === "intervals") {
        const match = question.match(/([A-G](?:#|b)?)\s*→\s*([A-G](?:#|b)?).*?(\d+)\s+semitones/i);
        if (match) return { kind: "interval", notes: [match[1], match[2]], semitones: Number(match[3]) };
    }
    if (category === "scales") {
        const root = question.match(/([A-G](?:#|b)?)\s+uses the pattern/i)?.[1] || "C";
        const intervals = /minor/i.test(title) ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        return { kind: "scale", root, intervals, degrees: ["1", "2", "3", "4", "5", "6", "7"], notes: intervals.map((interval) => CHROMATIC[(pitchClass(root) + interval) % 12]) };
    }
    if (category === "chords") {
        const match = question.match(/quality is\s+([A-G](?:#|b)?)(m7|maj7|dim7|sus2|sus4|dim|aug|m|7)?\?/i);
        if (match) {
            const intervals = { m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 7: [0, 4, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim7: [0, 3, 6, 9] }[match[2]?.toLowerCase()] || [
                0, 4, 7,
            ];
            return { kind: "chord", chords: [{ root: match[1], intervals, degrees: ["1", "3", "5", "7"], notes: intervals.map((interval) => CHROMATIC[(pitchClass(match[1]) + interval) % 12]) }] };
        }
    }
    if (/5th of C Major/i.test(question)) return { kind: "scale", root: "C", intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ["1", "2", "3", "4", "5", "6", "7"], notes: ["C", "D", "E", "F", "G", "A", "B"] };
    return null;
};

const DailyVisualStage = ({ visual, exercise, category, question, title }) => {
    const [instrument, setInstrument] = useState<"piano" | "guitar" | "off">("piano");
    const effectiveVisual = visual?.kind === "history" ? legacyVisual(category, question, title) : visual;
    if (!effectiveVisual) return null;
    const supportsInstrument = ["scale", "chord", "interval"].includes(effectiveVisual.kind);
    const content =
        effectiveVisual.kind === "scale" ? (
            <ScaleVisual visual={effectiveVisual} mode={instrument} />
        ) : effectiveVisual.kind === "chord" ? (
            <ChordVisual visual={effectiveVisual} mode={instrument} />
        ) : effectiveVisual.kind === "interval" ? (
            <IntervalVisual visual={effectiveVisual} mode={instrument} />
        ) : effectiveVisual.kind === "rhythm" ? (
            <RhythmVisual visual={effectiveVisual} />
        ) : (
            <ConceptVisual visual={effectiveVisual} />
        );
    return (
        <div className="daily-visual-stage-container">
            <section className={`daily-visual-stage ${instrument === "off" ? "daily-visual-stage--off" : ""}`}>
                <header>
                    <span>See the music</span>
                    <div className="daily-visual-stage__actions">
                        {supportsInstrument && (
                            <div className="daily-visual-stage__switch" role="group" aria-label="Visual instrument">
                                <button type="button" className={instrument === "piano" ? "is-active" : ""} onClick={() => setInstrument("piano")}>
                                    Piano
                                </button>
                                <button type="button" className={instrument === "guitar" ? "is-active" : ""} onClick={() => setInstrument("guitar")}>
                                    Guitar
                                </button>
                                <button type="button" className={instrument === "off" ? "is-active" : ""} onClick={() => setInstrument("off")}>
                                    Off
                                </button>
                            </div>
                        )}
                        {exercise && <EarReplay exercise={exercise} />}
                    </div>
                </header>
                {content}
            </section>
        </div>
    );
};

export default DailyVisualStage;
