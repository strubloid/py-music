"""
Daily Challenges API — seed, fetch, complete, and track streaks.

Generates 1000 music theory questions across categories:
  scales, chords, intervals, theory, ear_training, and general.

Endpoints:
  GET  /api/daily-challenges        — fetch available challenges (paginated)
  POST /api/daily-challenge/<id>/complete — mark as complete, award XP
  POST /api/daily-challenge/seed    — (re)generate 1000 challenges
  GET  /api/user/streak             — compute current daily streak
"""
import json
import random
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required

from ..daily_challenge_explanations import build_daily_challenge_explanation
from ..game_system import calculate_level_from_xp
from backend.project.models import db
from backend.project.models.user import DailyChallenge, ChallengeAttempt

daily_bp = Blueprint('daily', __name__, url_prefix='/api')

# ─── Question generators ───────────────────────────────────────────────────────

NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

SCALE_NAMES = {
    'major':       ['Ionian', 'Major'],
    'minor':       ['Aeolian', 'Natural Minor'],
    'harmonic_minor': ['Harmonic Minor'],
    'melodic_minor':  ['Melodic Minor'],
    'pentatonic_major': ['Pentatonic Major'],
    'pentatonic_minor': ['Pentatonic Minor'],
    'chromatic':   ['Chromatic'],
    'whole_tone':  ['Whole Tone'],
    'dorian':      ['Dorian'],
    'phrygian':    ['Phrygian'],
    'lydian':      ['Lydian'],
    'mixolydian':  ['Mixolydian'],
    'locrian':     ['Locrian'],
}

MAJOR_SCALE_INTERVALS = ['W', 'W', 'H', 'W', 'W', 'W', 'H']
MINOR_SCALE_INTERVALS = ['W', 'H', 'W', 'W', 'H', 'W', 'W']

CHORD_TYPES = [
    ('Major',       ['major', 'Major', 'M', '']),
    ('Minor',       ['minor', 'Minor', 'm', 'min']),
    ('Diminished',  ['dim', 'diminished', '°']),
    ('Augmented',   ['aug', 'augmented', '+']),
    ('Major 7th',   ['maj7', 'M7', 'Major 7th']),
    ('Minor 7th',   ['m7', 'min7', 'Minor 7th']),
    ('Dominant 7th',['7', 'dom7', 'Dominant 7']),
    ('Sus2',        ['sus2', 'Suspended 2nd']),
    ('Sus4',        ['sus4', 'Suspended 4th']),
    ('Dim 7th',     ['dim7', '°7']),
]

INTERVAL_NAMES = {
    1:  'Unison',
    2:  'Major 2nd',
    3:  'Major 3rd',
    4:  'Perfect 4th',
    5:  'Perfect 5th',
    6:  'Major 6th',
    7:  'Major 7th',
    8:  'Octave',
    9:  'Major 9th',
    10: 'Major 10th',
    11: 'Perfect 11th',
    12: 'Perfect 12th',
}

INTERVAL_SEMITONES = {
    'Minor 2nd': 1, 'Major 2nd': 2, 'Minor 3rd': 3, 'Major 3rd': 4,
    'Perfect 4th': 5, 'Tritone': 6, 'Perfect 5th': 7, 'Minor 6th': 8,
    'Major 6th': 9, 'Minor 7th': 10, 'Major 7th': 11, 'Octave': 12,
}

INTERVAL_NAMES_REVERSE = {v: k for k, v in INTERVAL_SEMITONES.items()}


def _semitone_distance(n1, n2):
    """Return semitone distance (positive) between two note names."""
    i1 = NOTES.index(n1)
    i2 = NOTES.index(n2)
    return (i2 - i1) % 12


def _random_note():
    return random.choice(NOTES)


def _random_chord_type():
    return random.choice(CHORD_TYPES)


# ─── Category generators ───────────────────────────────────────────────────────

def generate_scales_questions(count):
    questions = []
    for _ in range(count):
        root = _random_note()
        scale_type = random.choice(list(SCALE_NAMES.keys()))
        names = SCALE_NAMES[scale_type]
        correct_name = names[0]

        # Pick 3 wrong scale names
        wrong = []
        pool = [n for k, v in SCALE_NAMES.items() for n in v if n != correct_name]
        wrong = random.sample(pool, min(3, len(pool)))

        options = [correct_name] + wrong
        random.shuffle(options)
        correct_idx = options.index(correct_name)

        questions.append({
            'category': 'scales',
            'title': f'Scale Recipe: {scale_type.replace("_", " ").title()}',
            'question': f'Scale recipe time: {root} uses the pattern {", ".join(MAJOR_SCALE_INTERVALS if "major" in scale_type or scale_type in ("ionian", "lydian", "mixolydian") else MINOR_SCALE_INTERVALS)}. Which scale fits?',
            'options': options,
            'correct_index': correct_idx,
            'explanation': build_daily_challenge_explanation('scales', f'Identify the {scale_type.replace("_", " ").title()} Scale', f'Which scale type is built on the root note {root} with the interval pattern: {", ".join(MAJOR_SCALE_INTERVALS if "major" in scale_type or scale_type in ("ionian", "lydian", "mixolydian") else MINOR_SCALE_INTERVALS)}?', options, correct_idx),
            'xp_reward': random.choice([25, 50, 75]),
            'difficulty': random.choice([1, 2]),
        })
    return questions


def generate_chords_questions(count):
    questions = []
    for _ in range(count):
        root = _random_note()
        chord_label, chord_aliases = _random_chord_type()
        correct_name = chord_aliases[0]

        # Wrong chord types
        wrong_pool = [c[1][0] for c in CHORD_TYPES if c[1][0] != correct_name]
        wrong = random.sample(wrong_pool, min(3, len(wrong_pool)))

        options = [correct_name] + wrong
        random.shuffle(options)
        correct_idx = options.index(correct_name)

        questions.append({
            'category': 'chords',
            'title': 'Chord Stack',
            'question': f'Chord stack check: what quality is {root}{correct_name}?',
            'options': options,
            'correct_index': correct_idx,
            'explanation': build_daily_challenge_explanation('chords', f'Identify the {root} Chord', f'What type of chord is {root}{correct_name}? (e.g., Major, Minor, Seventh, etc.)', options, correct_idx),
            'xp_reward': random.choice([25, 50, 75]),
            'difficulty': random.choice([1, 2, 3]),
        })
    return questions


def generate_intervals_questions(count):
    questions = []
    for _ in range(count):
        n1 = _random_note()
        n2 = _random_note()
        if n1 == n2:
            n2 = NOTES[(NOTES.index(n1) + random.choice([2, 3, 4, 5, 7])) % 12]
        semitones = _semitone_distance(n1, n2)
        correct_name = INTERVAL_NAMES_REVERSE.get(semitones, f'{semitones} semitones')

        # Wrong interval names
        wrong_pool = [v for k, v in INTERVAL_NAMES_REVERSE.items() if v != correct_name]
        wrong = random.sample(wrong_pool, min(3, len(wrong_pool)))

        options = [correct_name] + wrong
        random.shuffle(options)
        correct_idx = options.index(correct_name)

        questions.append({
            'category': 'intervals',
            'title': 'Leap Check',
            'question': f'Leap check: {n1} → {n2} is {semitones} semitones. What interval is it?',
            'options': options,
            'correct_index': correct_idx,
            'explanation': build_daily_challenge_explanation('intervals', 'Identify the Interval', f'What is the interval between {n1} and {n2}? ({n1} → {n2} = {semitones} semitones)', options, correct_idx),
            'xp_reward': random.choice([25, 50]),
            'difficulty': random.choice([1, 2]),
        })
    return questions


def generate_theory_questions(count):
    """Generate music theory trivia questions."""
    theory_bank = [
        {
            'question': 'How many semitones are in a Perfect 5th?',
            'options': ['5', '6', '7', '8'],
            'correct_index': 2,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is the interval pattern of a Major scale?',
            'options': ['W-W-H-W-W-W-H', 'W-H-W-W-H-W-W', 'H-W-W-H-W-W-W', 'W-W-W-H-W-W-H'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 1,
        },
        {
            'question': 'How many notes are in a standard pentatonic scale?',
            'options': ['5', '6', '7', '8'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What does "CAGED" stand for in guitar theory?',
            'options': ['Five chord shapes: C, A, G, E, D', 'A tuning method', 'A scale pattern', 'A strumming pattern'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 2,
        },
        {
            'question': 'How many sharps are in the key of A Major?',
            'options': ['1', '2', '3', '4'],
            'correct_index': 2,
            'xp_reward': 50,
            'difficulty': 2,
        },
        {
            'question': 'What is the relative minor of C Major?',
            'options': ['A Minor', 'E Minor', 'D Minor', 'G Minor'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is the tonic of the D Major scale?',
            'options': ['D', 'A', 'F#', 'G'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is a "triad"?',
            'options': ['A three-note chord', 'A three-beat rhythm', 'A three-string technique', 'A three-note scale'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 1,
        },
        {
            'question': 'What is the interval between the 1st and 3rd note of a Major scale?',
            'options': ['Major 3rd', 'Minor 3rd', 'Perfect 5th', 'Major 2nd'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 2,
        },
        {
            'question': 'Which scale contains all 12 notes?',
            'options': ['Chromatic', 'Whole Tone', 'Pentatonic', 'Blues'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'How many strings does a standard guitar have?',
            'options': ['4', '5', '6', '7'],
            'correct_index': 2,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is the standard tuning of a guitar from low to high?',
            'options': ['E-A-D-G-B-E', 'E-B-G-D-A-E', 'A-D-G-C-E-A', 'D-A-D-G-B-E'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 1,
        },
        {
            'question': 'What note is the 5th of C Major?',
            'options': ['G', 'F', 'A', 'E'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 2,
        },
        {
            'question': 'Which mode starts on the 2nd degree of a Major scale?',
            'options': ['Dorian', 'Phrygian', 'Lydian', 'Mixolydian'],
            'correct_index': 0,
            'xp_reward': 75,
            'difficulty': 3,
        },
        {
            'question': 'What is a "barre chord"?',
            'options': ['A chord where one finger presses multiple strings', 'A chord played with a pick', 'A chord with no open strings', 'A power chord'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'How many half steps (semitones) are in an octave?',
            'options': ['10', '11', '12', '13'],
            'correct_index': 2,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is a "dominant 7th" chord?',
            'options': ['A major triad with a minor 7th', 'A minor triad with a major 7th', 'A major triad with a major 7th', 'A diminished triad with a minor 7th'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 2,
        },
        {
            'question': 'What does "tempo" mean in music?',
            'options': ['Speed of the beat', 'Volume of the sound', 'Pitch of the notes', 'Duration of a song'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is the subdominant of G Major?',
            'options': ['C', 'D', 'E', 'F'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 3,
        },
        {
            'question': 'How many beats are in a standard 4/4 time signature?',
            'options': ['4', '3', '2', '6'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is an "arpggio"?',
            'options': ['Notes of a chord played sequentially', 'A fast scale', 'A repeated note', 'A chord played all at once'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is the mediant of C Major?',
            'options': ['E', 'D', 'F', 'G'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 3,
        },
        {
            'question': 'Which notes are in a C Major triad?',
            'options': ['C-E-G', 'C-D-E', 'C-F-G', 'C-E-A'],
            'correct_index': 0,
            'xp_reward': 25,
            'difficulty': 1,
        },
        {
            'question': 'What is a "diminished" triad?',
            'options': ['Minor 3rd + Minor 3rd', 'Major 3rd + Minor 3rd', 'Major 3rd + Major 3rd', 'Minor 3rd + Major 3rd'],
            'correct_index': 0,
            'xp_reward': 50,
            'difficulty': 2,
        },
        {
            'question': 'How many keys are in the Circle of Fifths?',
            'options': ['12', '24', '15', '7'],
            'correct_index': 2,
            'xp_reward': 75,
            'difficulty': 3,
        },
    ]
    # Generate variations from the bank
    questions = []
    for _ in range(count):
        q = random.choice(theory_bank)
        questions.append({
            'category': 'theory',
            'title': 'Theory Quest',
            'question': q['question'],
            'options': q['options'],
            'correct_index': q['correct_index'],
            'explanation': build_daily_challenge_explanation('theory', 'Music Theory', q['question'], q['options'], q['correct_index']),
            'xp_reward': q['xp_reward'],
            'difficulty': q['difficulty'],
        })
    return questions


def generate_ear_training_questions(count):
    """Generate interval identification questions."""
    questions = []
    interval_choices = ['Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th', 'Octave', 'Minor 7th', 'Major 7th']
    for _ in range(count):
        correct = random.choice(interval_choices)
        wrong = random.sample([i for i in interval_choices if i != correct], 3)
        options = [correct] + wrong
        random.shuffle(options)
        correct_idx = options.index(correct)

        n1 = _random_note()
        semitones = INTERVAL_SEMITONES[correct]
        n2 = NOTES[(NOTES.index(n1) + semitones) % 12]

        questions.append({
            'category': 'ear_training',
            'title': 'Ear Check',
            'question': f'Ear check: {n1} → {n2} ({semitones} semitones). What interval do you hear?',
            'options': options,
            'correct_index': correct_idx,
            'explanation': build_daily_challenge_explanation('ear_training', 'Interval Recognition', f'From {n1} to {n2}, what interval do you hear? (Distance: {semitones} semitones)', options, correct_idx),
            'xp_reward': random.choice([50, 75, 100]),
            'difficulty': random.choice([2, 3, 4]),
        })
    return questions


def generate_general_questions(count):
    """Fill up remaining slots with general music knowledge."""
    general_bank = [
        ('Note Values', 'How many quarter notes equal a whole note?', ['2', '3', '4', '6'], 2, 25, 1),
        ('Note Values', 'How many eighth notes equal a half note?', ['2', '4', '6', '8'], 1, 25, 1),
        ('Note Values', 'How many sixteenth notes in a quarter note?', ['2', '4', '6', '8'], 1, 25, 1),
        ('Note Values', 'A dotted half note equals how many quarter notes?', ['2', '3', '4', '6'], 1, 25, 1),
        ('Note Values', 'How many beats is a whole note in 4/4?', ['1', '2', '3', '4'], 3, 25, 1),
        ('Clefs', 'What is the most common clef in guitar music?', ['Treble Clef', 'Bass Clef', 'Alto Clef', 'Tenor Clef'], 0, 25, 1),
        ('Clefs', 'What clef is also known as the "G clef"?', ['Treble Clef', 'Bass Clef', 'Alto Clef', 'Soprano Clef'], 0, 25, 1),
        ('Clefs', 'What clef is commonly used for bass instruments?', ['Bass Clef', 'Treble Clef', 'Alto Clef', 'Tenor Clef'], 0, 25, 1),
        ('Clefs', 'What is the center line of the treble clef?', ['B', 'D', 'G', 'A'], 1, 25, 2),
        ('Clefs', 'What is the first leger line above the treble clef?', ['A', 'C', 'E', 'G'], 0, 50, 2),
        ('Dynamics', 'What does "forte" mean?', ['Loud', 'Soft', 'Fast', 'Slow'], 0, 25, 1),
        ('Dynamics', 'What does "piano" mean?', ['Soft', 'Loud', 'Fast', 'Slow'], 0, 25, 1),
        ('Dynamics', 'What does "crescendo" mean?', ['Gradually louder', 'Gradually softer', 'Suddenly loud', 'Very soft'], 0, 50, 2),
        ('Dynamics', 'What does "fortissimo" mean?', ['Very loud', 'Very soft', 'Moderately loud', 'Extremely fast'], 0, 50, 2),
        ('Dynamics', 'What does "mezzo piano" mean?', ['Moderately soft', 'Very soft', 'Moderately loud', 'Extremely soft'], 0, 50, 2),
        ('Rhythm', 'What is syncopation?', ['Emphasis on weak beats', 'Playing off-beat notes', 'A fast tempo', 'A type of chord'], 0, 50, 3),
        ('Rhythm', 'What is a dotted quarter note worth?', ['1.5 beats', '1 beat', '2 beats', '0.75 beats'], 0, 50, 2),
        ('Rhythm', 'How many beats in a measure of 3/4 time?', ['2', '3', '4', '6'], 1, 25, 1),
        ('Rhythm', 'What is a "triplet"?', ['Three notes in the space of two', 'Three notes of equal value', 'A three-beat rhythm', 'A three-chord progression'], 0, 50, 2),
        ('Rhythm', 'What does "accelerando" mean?', ['Gradually faster', 'Gradually slower', 'Return to original tempo', 'Suddenly faster'], 0, 50, 2),
        ('Instruments', 'How many strings does a standard 4-string bass have?', ['4', '5', '6', '3'], 0, 25, 1),
        ('Instruments', 'What family does the violin belong to?', ['String', 'Woodwind', 'Brass', 'Percussion'], 0, 25, 1),
        ('Instruments', 'How many keys does a standard piano have?', ['88', '76', '61', '108'], 0, 25, 1),
        ('Instruments', 'What instrument has pedals called "swell", "sustain" and "soft"?', ['Piano', 'Organ', 'Harp', 'Vibraphone'], 0, 50, 2),
        ('Instruments', 'What is the highest-pitched string instrument in a standard orchestra?', ['Violin', 'Viola', 'Cello', 'Double Bass'], 0, 50, 2),
        ('Notation', 'What does a sharp (♯) do to a note?', ['Raises by a semitone', 'Lowers by a semitone', 'Doubles the value', 'Cancels previous accidental'], 0, 25, 1),
        ('Notation', 'What does a flat (♭) do to a note?', ['Lowers by a semitone', 'Raises by a semitone', 'Halves the value', 'Cancels previous accidental'], 0, 25, 1),
        ('Notation', 'What is a "natural" sign?', ['Cancels a sharp or flat', 'Raises by a semitone', 'Lowers by a semitone', 'Adds emphasis'], 0, 25, 1),
        ('Notation', 'What is a "double sharp"?', ['Raises by two semitones', 'Lowers by two semitones', 'Cancels a previous sharp', 'Adds two sharps to the key signature'], 0, 50, 2),
        ('Notation', 'What is a "staccato" mark?', ['Play the note short and detached', 'Play the note long and sustained', 'Play the note with emphasis', 'Play the note quietly'], 0, 25, 1),
        ('Harmony', 'What is a "cadence"?', ['A harmonic resolution', 'A melodic pattern', 'A rhythmic figure', 'A type of scale'], 0, 50, 2),
        ('Harmony', 'What is a "perfect authentic cadence"?', ['V → I', 'IV → I', 'V → vi', 'ii → V'], 0, 50, 3),
        ('Harmony', 'What is a "plagal cadence"?', ['IV → I', 'V → I', 'V → vi', 'I → V'], 0, 75, 3),
        ('Harmony', 'What is a "deceptive cadence"?', ['V → vi', 'V → I', 'IV → I', 'ii → V'], 0, 75, 3),
        ('Harmony', 'What is "counterpoint"?', ['Combining independent melodies', 'Playing chords together', 'A fast tempo', 'A type of ornament'], 0, 75, 3),
        ('History', 'What century did the modern guitar originate?', ['19th century', '18th century', '16th century', '20th century'], 0, 75, 3),
        ('History', 'Who is known as the father of modern classical guitar?', ['Andrés Segovia', 'Paco de Lucía', 'Jimi Hendrix', 'Julian Bream'], 0, 75, 2),
        ('History', 'In what period did J.S. Bach compose?', ['Baroque', 'Classical', 'Romantic', 'Renaissance'], 0, 50, 2),
        ('History', 'Who composed "The Four Seasons"?', ['Vivaldi', 'Bach', 'Mozart', 'Beethoven'], 0, 50, 1),
        ('History', 'Which band released "Sgt. Pepper\'s Lonely Hearts Club Band"?', ['The Beatles', 'The Rolling Stones', 'Led Zeppelin', 'Pink Floyd'], 0, 25, 1),
        ('Tuning', 'What note is the 1st string (high E) on a guitar?', ['E4', 'E3', 'E2', 'E5'], 0, 50, 2),
        ('Tuning', 'What is the standard guitar tuning from low to high?', ['E-A-D-G-B-E', 'E-B-G-D-A-E', 'A-D-G-C-E-A', 'D-A-D-G-B-E'], 0, 50, 1),
        ('Tuning', 'What is the tuning of a standard ukulele?', ['G-C-E-A', 'C-G-E-A', 'A-D-F-B', 'E-A-D-G'], 0, 50, 2),
        ('Tuning', 'How many frets does a typical electric guitar have?', ['21-24', '12-15', '18-20', '27-30'], 0, 50, 2),
        ('Tuning', 'What is "drop D" tuning?', ['D-A-D-G-B-E', 'D-G-D-G-B-D', 'E-A-D-G-B-E', 'D-A-D-F#-A-D'], 0, 50, 2),
        ('Tempo', 'What BPM range is "Andante"?', ['76-108 BPM', '40-60 BPM', '120-168 BPM', '60-76 BPM'], 0, 25, 1),
        ('Tempo', 'What BPM range is "Presto"?', ['168-200 BPM', '76-108 BPM', '120-168 BPM', '40-60 BPM'], 0, 50, 2),
        ('Tempo', 'What BPM range is "Adagio"?', ['66-76 BPM', '40-60 BPM', '76-108 BPM', '168-200 BPM'], 0, 50, 2),
        ('Tempo', 'What does "Allegro" mean?', ['Fast and lively', 'Slow and stately', 'Moderate walking pace', 'Very fast'], 0, 25, 1),
        ('Tempo', 'What does "Lento" mean?', ['Slow', 'Fast', 'Moderate', 'Very fast'], 0, 25, 1),
        ('Modes', 'Which mode is described as "dark and sad"?', ['Aeolian', 'Locrian', 'Phrygian', 'Dorian'], 0, 50, 2),
        ('Modes', 'Which mode is described as "bright and happy"?', ['Ionian', 'Lydian', 'Mixolydian', 'Dorian'], 0, 50, 2),
        ('Modes', 'Which mode starts on the 3rd degree of the major scale?', ['Phrygian', 'Dorian', 'Lydian', 'Mixolydian'], 0, 75, 3),
        ('Modes', 'Which mode has a raised 4th?', ['Lydian', 'Mixolydian', 'Locrian', 'Dorian'], 0, 75, 3),
        ('Modes', 'Which mode has a flat 7th?', ['Mixolydian', 'Lydian', 'Dorian', 'Ionian'], 0, 75, 3),
        ('Chords', 'What notes make up a G Major chord?', ['G-B-D', 'G-A-C', 'G-C-E', 'G-D-F#'], 0, 25, 1),
        ('Chords', 'What notes make up an Am chord?', ['A-C-E', 'A-D-F', 'A-E-G', 'A-C#-E'], 0, 25, 1),
        ('Chords', 'What notes make up a D Major chord?', ['D-F#-A', 'D-F-A', 'D-G-B', 'D-E-F#'], 0, 25, 1),
        ('Chords', 'What notes make up an E Minor chord?', ['E-G-B', 'E-G#-B', 'E-A-C', 'E-F#-G#'], 0, 25, 1),
        ('Chords', 'What is a "power chord"?', ['Root and fifth only', 'Root and third only', 'A full triad', 'A seventh chord'], 0, 25, 1),
        ('Chords', 'What is the difference between Major and Minor chords?', ['The third interval', 'The fifth interval', 'The root note', 'The seventh'], 0, 50, 2),
        ('Chords', 'What does a "sus2" chord replace?', ['The third with the second', 'The fifth with the second', 'The root with the second', 'The seventh with the second'], 0, 50, 2),
        ('Chords', 'What does a "sus4" chord replace?', ['The third with the fourth', 'The fifth with the fourth', 'The root with the fourth', 'The seventh with the fourth'], 0, 50, 2),
        ('Chords', 'How many notes in a standard seventh chord?', ['4', '3', '5', '6'], 0, 25, 1),
        ('Chords', 'What is an "inversion"?', ['A chord with a note other than the root in the bass', 'A chord played backwards', 'A chord with added notes', 'A chord played quietly'], 0, 50, 2),
        ('Glossary', 'What is a "capo"?', ['A device that clamps across the fretboard', 'A type of guitar pick', 'A tuning peg', 'A string damper'], 0, 25, 1),
        ('Glossary', 'What is "vibrato"?', ['A slight variation in pitch for expression', 'A fast strumming pattern', 'A bend in the guitar neck', 'A type of chord'], 0, 25, 1),
        ('Glossary', 'What is "harmonics"?', ['Overtones produced by lightly touching a string', 'A type of chord', 'A specific tuning', 'A strumming technique'], 0, 25, 1),
        ('Glossary', 'What is "tremolo"?', ['Rapid repetition of a note', 'A variation in pitch', 'A sliding technique', 'A picking technique'], 0, 50, 2),
        ('Glossary', 'What is a "riff"?', ['A short repeated musical phrase', 'A type of chord progression', 'A guitar solo', 'A strumming pattern'], 0, 25, 1),
        ('Scales', 'How many notes are in a standard major scale?', ['7', '5', '8', '6'], 0, 25, 1),
        ('Scales', 'How many notes are in a pentatonic scale?', ['5', '7', '6', '8'], 0, 25, 1),
        ('Scales', 'What is the 5th note of the C Major scale?', ['G', 'F', 'A', 'E'], 0, 25, 1),
        ('Scales', 'What is the 3rd note of the D Major scale?', ['F#', 'F', 'G', 'E'], 0, 50, 2),
        ('Scales', 'What is the relative minor of G Major?', ['E Minor', 'A Minor', 'D Minor', 'B Minor'], 0, 50, 2),
        ('Scales', 'What is the relative major of A Minor?', ['C Major', 'G Major', 'F Major', 'D Major'], 0, 50, 2),
        ('Scales', 'What is a "blues scale"?', ['Pentatonic minor with a flat 5th', 'Major scale with flat 3rd and 7th', 'A six-note scale', 'The chromatic scale'], 0, 75, 3),
        ('Scales', 'What are the notes of the E Minor pentatonic scale?', ['E-G-A-B-D', 'E-F#-G-A-B', 'E-F-G-A-B', 'E-G-A-C-D'], 0, 75, 3),
        ('Articulation', 'What does "legato" mean?', ['Smooth and connected', 'Short and detached', 'Heavy and accented', 'Very soft'], 0, 25, 1),
        ('Articulation', 'What does "pizzicato" mean?', ['Plucking the strings', 'Bowing the strings', 'Playing with a mute', 'Playing loudly'], 0, 50, 2),
        ('Articulation', 'What is a "glissando"?', ['A rapid slide between notes', 'A series of fast notes', 'A type of ornament', 'A chord played quickly'], 0, 50, 2),
        ('Articulation', 'What is "arpeggio"?', ['Notes of a chord played sequentially', 'A fast scale run', 'A strumming pattern', 'A repeated note'], 0, 25, 1),
        ('Intervals', 'What interval is C to G?', ['Perfect 5th', 'Perfect 4th', 'Major 3rd', 'Major 6th'], 0, 25, 1),
        ('Intervals', 'What interval is C to F?', ['Perfect 4th', 'Perfect 5th', 'Major 3rd', 'Major 2nd'], 0, 25, 1),
        ('Intervals', 'What interval is C to E?', ['Major 3rd', 'Minor 3rd', 'Perfect 5th', 'Major 6th'], 0, 25, 1),
        ('Intervals', 'What interval is A to C?', ['Minor 3rd', 'Major 3rd', 'Minor 2nd', 'Perfect 4th'], 0, 50, 2),
        ('Intervals', 'What interval is C to B?', ['Major 7th', 'Minor 7th', 'Octave', 'Major 6th'], 0, 50, 2),
    ]
    questions = []
    bank_copy = list(general_bank)
    random.shuffle(bank_copy)
    for i in range(count):
        title, question, options, correct_idx, xp, diff = bank_copy[i % len(bank_copy)]
        questions.append({
            'category': 'general',
            'title': f'Groove Quiz: {title}',
            'question': question,
            'options': options,
            'correct_index': correct_idx,
            'explanation': build_daily_challenge_explanation('general', title, question, options, correct_idx),
            'xp_reward': xp,
            'difficulty': diff,
        })
    return questions


def seed_challenges(target=1000):
    """Generate or regenerate challenges in the database.

    Distributes 1000 questions across categories:
      scales ~180, chords ~180, intervals ~160, theory ~120, ear_training ~120, general ~240
    """
    random.seed(42)  # deterministic seed for reproducibility

    DailyChallenge.query.delete()
    db.session.commit()

    counts = {
        'scales': target * 18 // 100,
        'chords': target * 18 // 100,
        'intervals': target * 16 // 100,
        'theory': target * 12 // 100,
        'ear_training': target * 12 // 100,
    }
    # Fill remainder with general
    used = sum(counts.values())
    counts['general'] = target - used

    generators = {
        'scales': generate_scales_questions,
        'chords': generate_chords_questions,
        'intervals': generate_intervals_questions,
        'theory': generate_theory_questions,
        'ear_training': generate_ear_training_questions,
        'general': generate_general_questions,
    }

    challenges = []
    for cat, gen in generators.items():
        qs = gen(counts[cat])
        for q in qs:
            challenges.append(DailyChallenge(
                category=q['category'],
                title=q['title'],
                question=q['question'],
                options_json=json.dumps(q['options']),
                correct_index=q['correct_index'],
                explanation=q.get('explanation'),
                xp_reward=q['xp_reward'],
                difficulty=q['difficulty'],
            ))

    db.session.add_all(challenges)
    db.session.commit()
    return len(challenges)


def compute_streak(user_id):
    """Calculate consecutive-day streak from ChallengeAttempt records."""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')

    completed_dates = db.session.query(
        db.distinct(ChallengeAttempt.challenge_date)
    ).filter(
        ChallengeAttempt.user_id == user_id,
        ChallengeAttempt.completed == True
    ).order_by(ChallengeAttempt.challenge_date.desc()).all()

    dates = [d[0] for d in completed_dates]
    if not dates:
        return 0

    # Check if the streak is active (today or yesterday was completed)
    if dates[0] != today and dates[0] != yesterday:
        return 0

    streak = 0
    check = dates[0]
    while True:
        if check in dates:
            streak += 1
            # Previous day
            d = datetime.strptime(check, '%Y-%m-%d') - timedelta(days=1)
            check = d.strftime('%Y-%m-%d')
        else:
            break

    return streak


# ─── Routes ────────────────────────────────────────────────────────────────────

@daily_bp.route('/daily-challenges', methods=['GET'])
def get_daily_challenges():
    """Return challenges the current user hasn't completed yet."""
    limit = min(int(request.args.get('limit', 10)), 50)
    offset = int(request.args.get('offset', 0))
    random_mode = request.args.get('random', '0') == '1'
    exclude_ids_raw = request.args.get('exclude_ids', '')
    exclude_ids = {
        int(part)
        for part in exclude_ids_raw.split(',')
        if part.strip().isdigit()
    }

    # Get IDs of completed challenges
    completed_ids = set()
    if current_user.is_authenticated:
        completed_rows = db.session.query(ChallengeAttempt.challenge_id).filter(
            ChallengeAttempt.user_id == current_user.id,
            ChallengeAttempt.completed == True,
            ChallengeAttempt.challenge_id.isnot(None),
        ).all()
        completed_ids = {c[0] for c in completed_rows}

    # Fetch challenges excluding completed ones before paginating so offsets stay stable.
    available_query = DailyChallenge.query
    if completed_ids:
        available_query = available_query.filter(~DailyChallenge.id.in_(completed_ids))
    if exclude_ids:
        available_query = available_query.filter(~DailyChallenge.id.in_(exclude_ids))

    available_total = available_query.count()

    if random_mode:
        candidates = available_query.all()
        challenges = random.sample(candidates, k=min(limit, len(candidates))) if candidates else []
    else:
        challenges = available_query \
            .order_by(DailyChallenge.difficulty.asc(), DailyChallenge.id.asc()) \
            .offset(offset).limit(limit).all()

    result = [c.to_dict() for c in challenges]
    completed_count = len(completed_ids)

    return jsonify({
        'challenges': result,
        'total': DailyChallenge.query.count(),
        'completed': completed_count,
        'remaining': max(available_total - len(result), 0) if random_mode else max(available_total - offset - len(result), 0),
        'limit': limit,
        'offset': offset,
    })


@daily_bp.route('/daily-challenge/<int:challenge_id>/complete', methods=['POST'])
def complete_challenge(challenge_id):
    """Mark a challenge as complete and award XP."""
    challenge = DailyChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if not current_user.is_authenticated:
        return jsonify({
            'xp': 0,
            'level': 1,
            'xp_awarded': 0,
            'message': 'Correct! Sign in to save XP and streak progress.',
        })

    today = datetime.utcnow().strftime('%Y-%m-%d')
    data = request.get_json(silent=True) or {}
    requested_xp_award = data.get('xp_award')
    try:
        requested_xp_award = int(requested_xp_award) if requested_xp_award is not None else None
    except (TypeError, ValueError):
        requested_xp_award = None

    xp_award = requested_xp_award if requested_xp_award and requested_xp_award > 0 else challenge.xp_reward

    # One reward per challenge: completed challenges are filtered out of the list,
    # so a visible challenge should pay its own reward exactly once.
    existing = ChallengeAttempt.query.filter_by(
        user_id=current_user.id,
        challenge_id=challenge_id,
    ).first()
    if existing and existing.completed:
        return jsonify({
            'xp': current_user.xp,
            'level': current_user.level,
            'xp_awarded': 0,
            'already_completed': True,
            'message': 'Challenge already completed.',
        })

    if existing:
        existing.challenge_date = today
        existing.score = xp_award
        existing.completed = True
    else:
        attempt = ChallengeAttempt(
            user_id=current_user.id,
            challenge_id=challenge_id,
            challenge_date=today,
            score=xp_award,
            completed=True,
        )
        db.session.add(attempt)

    # Award XP
    current_user.xp = (current_user.xp or 0) + xp_award
    current_user.level = calculate_level_from_xp(current_user.xp)
    db.session.commit()

    return jsonify({
        'xp': current_user.xp,
        'level': current_user.level,
        'xp_awarded': xp_award,
        'already_completed': False,
        'message': f'+{xp_award} XP!',
    })


@daily_bp.route('/daily-challenge/seed', methods=['POST'])
@login_required
def seed():
    """(Re)generate the daily challenge question bank."""
    count = seed_challenges(1000)
    return jsonify({
        'message': f'✅ Seeded {count} daily challenges',
        'count': count,
    })


@daily_bp.route('/user/streak', methods=['GET'])
def get_streak():
    """Get the user's current daily streak."""
    if not current_user.is_authenticated:
        return jsonify({
            'streak': 0,
            'completed_today': False,
        })

    streak = compute_streak(current_user.id)

    today = datetime.utcnow().strftime('%Y-%m-%d')
    completed_today = ChallengeAttempt.query.filter_by(
        user_id=current_user.id,
        challenge_date=today,
        completed=True,
    ).first() is not None

    return jsonify({
        'streak': streak,
        'completed_today': completed_today,
    })
