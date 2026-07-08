import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Flame, Play, RefreshCw, Train, Trophy, Volume2, Waves, XCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { createEarTrainingAudioEngine, EAR_TRAINING_INSTRUMENTS } from "../../audio/earTrainingAudio.jsx";
import { completeDailyChallenge, getDailyChallenges, getUserStreak } from "../../services/api";
import "./EarTraining.css";

const FETCH_LIMIT = 16;
const AUTO_ADVANCE_MS = 1100;
const NOTE_OFFSETS = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
};

const INTERVAL_TO_SEMITONES = {
    "Minor 2nd": 1,
    "Major 2nd": 2,
    "Minor 3rd": 3,
    "Major 3rd": 4,
    "Perfect 4th": 5,
    Tritone: 6,
    "Perfect 5th": 7,
    "Minor 6th": 8,
    "Major 6th": 9,
    "Minor 7th": 10,
    "Major 7th": 11,
    Octave: 12,
};
const NOTE_NAMES = Object.keys(NOTE_OFFSETS);

const getCompletedChallengeIds = () => {
    try {
        return JSON.parse(sessionStorage.getItem("strubloid:completed-ear-training-ids") || "[]");
    } catch {
        return [];
    }
};

const rememberCompletedChallengeId = (challengeId) => {
    const ids = new Set(getCompletedChallengeIds());
    ids.add(challengeId);
    sessionStorage.setItem("strubloid:completed-ear-training-ids", JSON.stringify(Array.from(ids)));
};

const parseIntervalQuestion = (question = "") => {
    const match = question.match(/Ear check:\s*([A-G]#?)\s*→\s*([A-G]#?)\s*\((\d+)\s*semitones\)/i);
    if (!match) return null;

    return {
        from: match[1],
        to: match[2],
        semitones: Number(match[3]),
    };
};

const noteToMidi = (note, octave) => 12 * (octave + 1) + NOTE_OFFSETS[note];

const getRandomBaseOctave = (challengeId = 0) => 3 + (challengeId % 3);

const midiToToneNote = (midi) => {
    const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${noteName}${octave}`;
};

const buildDiffStars = (difficulty = 1) => "★".repeat(difficulty) + "☆".repeat(Math.max(0, 5 - difficulty));

const buildStimulus = (challenge) => {
    const parsed = parseIntervalQuestion(challenge?.question || "");
    const correctOption = challenge?.options?.[challenge?.correct_index];
    const semitones = parsed?.semitones || INTERVAL_TO_SEMITONES[correctOption] || 4;
    const from = parsed?.from || NOTE_NAMES[(challenge?.id || 0) % NOTE_NAMES.length];
    const baseOctave = getRandomBaseOctave(challenge?.id || 0);
    const rootMidi = noteToMidi(from, baseOctave);
    const targetMidi = rootMidi + semitones;
    const to = parsed?.to || NOTE_NAMES[((targetMidi % 12) + 12) % 12];

    return {
        from,
        to,
        semitones,
        baseOctave,
        rootMidi,
        targetMidi,
        rootToneNote: midiToToneNote(rootMidi),
        targetToneNote: midiToToneNote(targetMidi),
    };
};

const EarTraining = () => {
    const { isLoggedIn, updateUserProgress } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingNext, setLoadingNext] = useState(false);
    const [error, setError] = useState("");
    const [streak, setStreak] = useState(0);
    const [completedToday, setCompletedToday] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [result, setResult] = useState(null);
    const [combo, setCombo] = useState(0);
    const [xpAwarded, setXpAwarded] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [stimulus, setStimulus] = useState(null);
    const [audioReady, setAudioReady] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState(EAR_TRAINING_INSTRUMENTS[0].id);
    const [loadingInstrumentId, setLoadingInstrumentId] = useState(null);
    const [loadedInstrumentIds, setLoadedInstrumentIds] = useState([]);
    const [playbackMode, setPlaybackMode] = useState("melodic");
    const advanceTimerRef = useRef(null);
    const playbackTimerRef = useRef(null);
    const lastPlayedChallengeIdRef = useRef(null);
    const audioEngineRef = useRef(null);

    if (!audioEngineRef.current) {
        audioEngineRef.current = createEarTrainingAudioEngine({
            onStateChange: ({ audioReady: ready, loadedInstrumentIds: loadedIds, loadingInstrumentId: loadingId }) => {
                setAudioReady(ready);
                setLoadedInstrumentIds(loadedIds);
                setLoadingInstrumentId(loadingId);
            },
        });
    }

    const clearScheduledAudio = useCallback(() => {
        if (playbackTimerRef.current) {
            window.clearTimeout(playbackTimerRef.current);
            playbackTimerRef.current = null;
        }

        audioEngineRef.current?.stop();
    }, []);

    const playChallenge = useCallback(
        async (instrumentId = selectedInstrument) => {
            if (!challenge || playing) return;

            clearScheduledAudio();
            setError("");
            setPlaying(true);

            try {
                const nextStimulus = buildStimulus(challenge);
                await audioEngineRef.current.ensureContext();

                lastPlayedChallengeIdRef.current = challenge.id;
                setStimulus(nextStimulus);

                const { durationMs } = await audioEngineRef.current.playInterval({
                    instrumentId,
                    mode: playbackMode,
                    rootToneNote: nextStimulus.rootToneNote,
                    targetToneNote: nextStimulus.targetToneNote,
                });

                const alternateInstrumentId = EAR_TRAINING_INSTRUMENTS.find((item) => item.id !== instrumentId)?.id;
                if (alternateInstrumentId) {
                    audioEngineRef.current.preloadInstrument(alternateInstrumentId);
                }

                if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
                playbackTimerRef.current = window.setTimeout(() => setPlaying(false), durationMs);
            } catch {
                setPlaying(false);
                setError("Unable to start audio. Check your browser sound settings.");
            }
        },
        [challenge, clearScheduledAudio, playbackMode, playing, selectedInstrument],
    );

    const loadChallenge = useCallback(async ({ replace = false, excludeIds = [] } = {}) => {
        setLoadingNext(true);
        setError("");

        try {
            const mergedExcludeIds = Array.from(new Set([...getCompletedChallengeIds(), ...excludeIds]));
            let nextChallenge = null;
            for (let attempt = 0; attempt < 3 && !nextChallenge; attempt += 1) {
                const response = await getDailyChallenges(FETCH_LIMIT, 0, {
                    random: true,
                    excludeIds: mergedExcludeIds,
                });

                const earChallenges = response.data.challenges.filter((item) => item.category === "ear_training");
                nextChallenge = earChallenges.find((item) => !mergedExcludeIds.includes(item.id)) || null;

                if (!nextChallenge) {
                    mergedExcludeIds.push(...response.data.challenges.map((item) => item.id));
                }
            }

            if (!nextChallenge) {
                throw new Error("No ear training challenge available.");
            }

            setChallenge(nextChallenge);
            setSelectedIdx(null);
            setResult(null);
            setXpAwarded(0);
            setStimulus(null);
            setSubmitting(false);
            setLoading(false);
            return { nextChallenge };
        } catch {
            setError("Failed to load an ear-training prompt.");
            setLoading(false);
            if (replace) {
                setChallenge(null);
            }
            return null;
        } finally {
            setLoadingNext(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            setLoading(true);
            try {
                await loadChallenge({ replace: true });
                if (isLoggedIn) {
                    const streakRes = await getUserStreak();
                    if (!cancelled) {
                        setStreak(streakRes.data.streak);
                        setCompletedToday(streakRes.data.completed_today);
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        init();

        return () => {
            cancelled = true;
            clearScheduledAudio();
            if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
            audioEngineRef.current?.dispose();
        };
    }, [clearScheduledAudio, isLoggedIn, loadChallenge]);

    useEffect(() => {
        if (!challenge || !audioReady || lastPlayedChallengeIdRef.current === challenge.id) return;
        playChallenge().catch(() => {});
    }, [audioReady, challenge, playChallenge]);

    const handleSubmit = useCallback(
        async (idx) => {
            if (!challenge || submitting || result) return;

            const isCorrect = idx === challenge.correct_index;
            setSelectedIdx(idx);
            setSubmitting(true);

            const queueNext = () => {
                if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
                advanceTimerRef.current = window.setTimeout(() => {
                    loadChallenge({ replace: true, excludeIds: [challenge.id] }).catch(() => {});
                }, AUTO_ADVANCE_MS);
            };

            try {
                if (isCorrect) {
                    setResult({ correct: true });
                    setCombo((current) => current + 1);
                    rememberCompletedChallengeId(challenge.id);

                    if (isLoggedIn) {
                        const response = await completeDailyChallenge(challenge.id);
                        updateUserProgress({ xp: response.data.xp, level: response.data.level });
                        setXpAwarded(response.data.xp_awarded);

                        const streakRes = await getUserStreak();
                        setStreak(streakRes.data.streak);
                        setCompletedToday(streakRes.data.completed_today);
                    }

                    queueNext();
                } else {
                    setResult({ correct: false });
                    setCombo(0);
                    setXpAwarded(0);
                    rememberCompletedChallengeId(challenge.id);
                    queueNext();
                }
            } catch (err) {
                if (err.response?.status === 400) {
                    setResult({ correct: true });
                    setXpAwarded(0);
                    rememberCompletedChallengeId(challenge.id);
                    queueNext();
                } else {
                    setError("Failed to submit answer.");
                }
            } finally {
                setSubmitting(false);
            }
        },
        [challenge, isLoggedIn, loadChallenge, result, submitting, updateUserProgress],
    );

    const handleInstrumentSelect = useCallback(
        (instrumentId) => {
            setSelectedInstrument(instrumentId);
            if (audioReady && challenge) {
                playChallenge(instrumentId).catch(() => {});
            }
        },
        [audioReady, challenge, playChallenge],
    );

    const activeLabel = challenge?.title || "Interval Recognition";
    const correctOption = challenge?.options[challenge?.correct_index];
    const currentStimulus = stimulus || (challenge ? buildStimulus(challenge) : null);
    const selectedInstrumentMeta = EAR_TRAINING_INSTRUMENTS.find((item) => item.id === selectedInstrument);
    const instrumentReady = loadedInstrumentIds.includes(selectedInstrument);

    if (loading) {
        return (
            <div className="ear-page">
                <div className="ear-loading">
                    <RefreshCw className="spin" size={22} />
                    <p>Loading ear-training drill...</p>
                </div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="ear-page">
                <div className="ear-header">
                    <Train className="ear-icon" size={28} />
                    <div>
                        <h1>Ear Training</h1>
                        <p className="ear-subtitle">Interval recognition with sampled instrument playback.</p>
                    </div>
                    <div className="ear-streak">
                        <Flame size={16} />
                        <span>{streak} day streak</span>
                    </div>
                </div>
                <div className="ear-empty">
                    <p>{error || "No ear-training challenges are available right now."}</p>
                    <button type="button" className="ear-action-button" onClick={() => loadChallenge({ replace: true })} disabled={loadingNext}>
                        <RefreshCw size={16} className={loadingNext ? "spin" : ""} />
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ear-page">
            <div className="ear-header">
                <Train className="ear-icon" size={28} />
                <div>
                    <h1>Ear Training</h1>
                    <p className="ear-subtitle">Hear it, identify it, move on.</p>
                </div>
                <div className="ear-streak">
                    <Flame size={16} />
                    <span>{streak} day streak</span>
                </div>
            </div>

            <div className="ear-layout">
                <section className="ear-card ear-workbench">
                    <div className="ear-card-meta">
                        <span className="ear-tag">{activeLabel}</span>
                        <span className="ear-tag">{selectedInstrumentMeta?.label}</span>
                        <span className="ear-tag">{playbackMode === "harmonic" ? "Harmonic replay" : "Melodic replay"}</span>
                        <span className="ear-xp">+{challenge.xp_reward} XP</span>
                    </div>
                    <h2>Identify the interval by ear.</h2>{" "}
                    <p className="ear-copy">
                        Here you will need to listen some sounds, so get confortable with the chair, get the headphones working and focus on the sound. You will hear a note and after you will need to get the right one,
                        so keep your cool and focus into the sound, get schwifty!
                    </p>
                    <div className="ear-instrument-container">
                        <div className="ear-instrument-switcher" role="group" aria-label="Choose playback instrument">
                            {EAR_TRAINING_INSTRUMENTS.map((instrument) => (
                                <button
                                    key={instrument.id}
                                    type="button"
                                    className={`ear-instrument-button ${selectedInstrument === instrument.id ? "selected" : ""}`}
                                    aria-pressed={selectedInstrument === instrument.id}
                                    onClick={() => handleInstrumentSelect(instrument.id)}
                                    disabled={playing || loadingNext}
                                >
                                    {instrument.label}
                                </button>
                            ))}
                        </div>
                        <p className="ear-instrument-copy">{selectedInstrumentMeta?.description}.</p>
                    </div>
                    <div className="ear-prompt-strip">
                        <div>
                            <span>Difficulty</span>
                            <strong>{buildDiffStars(challenge.difficulty)}</strong>
                        </div>
                        <div>
                            <span>Register</span>
                            <strong>{currentStimulus ? `${currentStimulus.from}${currentStimulus.baseOctave}` : "Ready"}</strong>
                        </div>
                        <div>
                            <span>Instrument</span>
                            <strong>
                                {loadingInstrumentId === selectedInstrument
                                    ? `Loading ${selectedInstrumentMeta?.label?.toLowerCase()}...`
                                    : instrumentReady
                                      ? `${selectedInstrumentMeta?.label} ready`
                                      : "Tap play to unlock"}
                            </strong>
                        </div>
                    </div>
                    <div className="ear-audio-panel">
                        <button type="button" className="ear-play-button" onClick={() => playChallenge()} disabled={loadingNext || playing}>
                            <Play size={18} />
                            {playing ? "Playing..." : instrumentReady ? "Play interval" : `Load ${selectedInstrumentMeta?.label?.toLowerCase() || "instrument"}`}
                        </button>
                        <button type="button" className="ear-action-button" onClick={() => playChallenge()} disabled={loadingNext || playing}>
                            <Volume2 size={16} />
                            Replay
                        </button>
                        <button type="button" className="ear-action-button" onClick={() => setPlaybackMode((current) => (current === "melodic" ? "harmonic" : "melodic"))} disabled={loadingNext || playing}>
                            <Waves size={16} />
                            {playbackMode === "melodic" ? "Switch to harmonic" : "Switch to melodic"}
                        </button>
                        <button type="button" className="ear-action-button" onClick={() => loadChallenge({ replace: true, excludeIds: [challenge.id] })} disabled={loadingNext}>
                            <RefreshCw size={16} className={loadingNext ? "spin" : ""} />
                            Skip
                        </button>
                    </div>
                    {error && <div className="ear-error">{error}</div>}
                    {result && (
                        <div className={`ear-result ${result.correct ? "result-correct" : "result-incorrect"}`}>
                            {result.correct ? (
                                <>
                                    <CheckCircle size={16} />
                                    Correct. {xpAwarded ? `+${xpAwarded} XP.` : "No XP awarded yet."}
                                </>
                            ) : (
                                <>
                                    <XCircle size={16} />
                                    The correct answer was <strong>{correctOption}</strong>.
                                </>
                            )}
                        </div>
                    )}
                    {result && stimulus && (
                        <div className="ear-info-grid">
                            <div>
                                <span>Starting note</span>
                                <strong>{`${stimulus.from}${stimulus.baseOctave}`}</strong>
                            </div>
                            <div>
                                <span>Target note</span>
                                <strong>{`${stimulus.to}${Math.floor(stimulus.targetMidi / 12) - 1}`}</strong>
                            </div>
                            <div>
                                <span>Distance</span>
                                <strong>{stimulus.semitones} semitones</strong>
                            </div>
                        </div>
                    )}
                </section>

                <aside className="ear-rail">
                    <div className="ear-card ear-status-card">
                        <div className="ear-stat">
                            <Trophy size={16} />
                            <div>
                                <span>Combo</span>
                                <strong>{combo}</strong>
                            </div>
                        </div>
                        <div className="ear-stat">
                            <Flame size={16} />
                            <div>
                                <span>Streak</span>
                                <strong>{streak}</strong>
                            </div>
                        </div>
                        <div className="ear-stat">
                            <CheckCircle size={16} />
                            <div>
                                <span>Today</span>
                                <strong>{completedToday ? "Done" : "Ready"}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="ear-card">
                        <h3>Pick one</h3>
                        <div className="ear-options">
                            {challenge.options.map((option, idx) => {
                                const isSelected = selectedIdx === idx;
                                const isCorrect = result && idx === challenge.correct_index;
                                const isWrong = result && isSelected && !isCorrect;

                                return (
                                    <button key={option} type="button" className={`ear-option ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`} onClick={() => handleSubmit(idx)} disabled={submitting || !!result}>
                                        <span>{option}</span>
                                        {isCorrect && <CheckCircle size={16} className="opt-correct-icon" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="ear-card ear-hint-card">
                        <h3>How it works</h3>
                        <p>Switch between piano and guitar, replay the same interval, and compare melodic versus harmonic playback without changing the quiz flow.</p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default EarTraining;
