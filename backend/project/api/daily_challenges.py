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
import re
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from sqlalchemy.exc import IntegrityError

from backend.project.extensions import limiter
from ..daily_challenge_explanations import build_daily_challenge_explanation
from ..game_system import calculate_level_from_xp, get_mode_base_xp
from backend.project.models import db
from backend.project.models.user import (
    DailyChallenge, ChallengeAttempt, DailyHintUsage, DailyHintReveal,
)
from backend.project.music.chord_inventory import (
    CHORD_QUALITIES,
    PITCH_CLASSES,
    build_chord_definition,
    build_chord_pair_challenge,
    build_scheduled_note_events,
    inventory_payload,
)

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

# Semitone offsets are the canonical source for visuals; step labels remain only
# for explanations and accessible scale rails.
SCALE_FORMULAS = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
    'pentatonic_major': [0, 2, 4, 7, 9],
    'pentatonic_minor': [0, 3, 5, 7, 10],
    'chromatic': list(range(12)),
    'whole_tone': [0, 2, 4, 6, 8, 10],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'locrian': [0, 1, 3, 5, 6, 8, 10],
}
SCALE_DEGREES = ['1', '2', '3', '4', '5', '6', '7']
CHORD_INTERVALS = {
    'Major': [0, 4, 7], 'Minor': [0, 3, 7], 'Diminished': [0, 3, 6],
    'Augmented': [0, 4, 8], 'Major 7th': [0, 4, 7, 11],
    'Minor 7th': [0, 3, 7, 10], 'Dominant 7th': [0, 4, 7, 10],
    'Sus2': [0, 2, 7], 'Sus4': [0, 5, 7], 'Dim 7th': [0, 3, 6, 9],
}
HINT_LIMITS = {
    'unranked': 2, 'bronze': 3, 'silver': 4, 'gold': 5, 'platinum': 6,
    'diamond': 7, 'master': 8, 'grandmaster': 9, 'virtuoso': 10,
    'maestro': 11, 'legendary': 12,
}
RANK_LEVELS = {
    'unranked': 10, 'bronze': 20, 'silver': 35, 'gold': 50, 'platinum': 70,
    'diamond': 90, 'master': 115, 'grandmaster': 140, 'virtuoso': 170,
    'maestro': 200, 'legendary': 250,
}
RANK_ORDER = list(RANK_LEVELS)
RANK_XP_PER_LEVEL = 500

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

# This catalog is intentionally small for the first listening vocabulary.  The
# browser receives the tones/voicing it must play, rather than trying to infer a
# chord from a display-oriented guitar-shape data set.
EAR_CHORD_QUALITIES = {
    quality: metadata
    for quality, metadata in CHORD_QUALITIES.items()
    if metadata['enabledForEarTraining']
}


def _shuffle_options(correct, candidates, rng, count=4):
    wrong = [item for item in candidates if item != correct]
    options = [correct] + rng.sample(wrong, min(count - 1, len(wrong)))
    rng.shuffle(options)
    return options, options.index(correct)


def _tone_name(note_index, octave):
    return f'{NOTES[note_index % 12]}{octave + (note_index // 12)}'


def _scale_visual(root, scale_type):
    intervals = SCALE_FORMULAS[scale_type]
    root_index = NOTES.index(root)
    return {
        'kind': 'scale', 'root': root, 'intervals': intervals,
        'degrees': SCALE_DEGREES[:len(intervals)],
        'notes': [NOTES[(root_index + interval) % 12] for interval in intervals],
        'pitch_classes': [(root_index + interval) % 12 for interval in intervals],
    }


def _chord_visual(root, label):
    intervals = CHORD_INTERVALS[label]
    root_index = NOTES.index(root)
    return {'kind': 'chord', 'chords': [{
        'root': root, 'intervals': intervals,
        'notes': [NOTES[(root_index + interval) % 12] for interval in intervals],
        'degrees': ['1', '3', '5', '7'][:len(intervals)],
    }]}


def _interval_visual(first, second, semitones, direction='up'):
    return {'kind': 'interval', 'notes': [first, second], 'semitones': semitones, 'direction': direction}


def _general_visual(family):
    """One typed, factual visual family for every fixed general-bank family."""
    visuals = {
        'Note Values': {'kind': 'rhythm', 'meter': [4, 4], 'events': [{'value': 'quarter', 'beats': 1}]},
        'Clefs': {'kind': 'staff', 'clef': 'treble', 'notes': [{'note': 'B4', 'position': 'middle-line'}]},
        'Dynamics': {'kind': 'dynamics', 'mark': 'mf'},
        'Rhythm': {'kind': 'rhythm', 'meter': [4, 4], 'events': [{'value': 'quarter', 'beat': 1}]},
        'Instruments': {'kind': 'instrument', 'instrument': 'piano', 'keys': 88},
        'Notation': {'kind': 'staff', 'clef': 'treble', 'notes': [{'note': 'C4'}], 'accidental': 'sharp'},
        'Harmony': {'kind': 'harmony', 'romanNumerals': ['V', 'I'], 'key': 'C'},
        'History': {'kind': 'history', 'subject': 'Music history', 'timeline': []},
        'Tuning': {'kind': 'fretboard', 'tuning': ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']},
        'Tempo': {'kind': 'tempo', 'bpmRange': [76, 108]},
        'Modes': _scale_visual('C', 'major'),
        'Chords': _chord_visual('C', 'Major'),
        'Glossary': {'kind': 'technique', 'subject': 'guitar technique', 'frames': []},
        'Scales': _scale_visual('C', 'major'),
        'Articulation': {'kind': 'technique', 'subject': 'articulation', 'frames': []},
        'Intervals': _interval_visual('C4', 'G4', 7),
    }
    return visuals[family]


def build_ear_exercise(challenge):
    """Create a real, deterministic audio exercise for an ear-training card.

    Existing databases already contain interval-only challenge rows. Deriving a
    payload from the stable challenge id upgrades those rows without a destructive
    reseed, while the frontend still receives explicit notes/chords to play.
    """
    rng = random.Random(challenge.id)
    drill_type = (
        'interval', 'direction', 'shape', 'chord_quality',
        'chord_movement', 'chord_pair', 'inversion',
    )[challenge.id % 7]
    root_index = rng.randrange(len(NOTES))
    base_octave = 3 + rng.randrange(2)
    difficulty = max(1, min(10, (challenge.id % 10) + 1))

    if drill_type == 'interval':
        semitones = rng.choice([3, 4, 5, 7, 8, 9, 12])
        correct = INTERVAL_NAMES_REVERSE[semitones]
        options, correct_index = _shuffle_options(correct, list(INTERVAL_SEMITONES), rng)
        return {
            'type': drill_type,
            'title': 'Interval Signal',
            'question': 'Name the distance between the two notes.',
            'options': options,
            'correct_index': correct_index,
            'notes': [_tone_name(root_index, base_octave), _tone_name(root_index + semitones, base_octave)],
            'answer_mode': 'interval_name',
        }

    if drill_type == 'direction':
        direction = rng.choice(['Ascending', 'Descending'])
        distance = rng.choice([3, 4, 5, 7])
        target = root_index + (distance if direction == 'Ascending' else -distance)
        options = ['Ascending', 'Descending']
        return {
            'type': drill_type,
            'title': 'Direction Call',
            'question': 'Does the second note travel up or down?',
            'options': options,
            'correct_index': options.index(direction),
            'notes': [_tone_name(root_index, base_octave), _tone_name(target, base_octave)],
            'answer_mode': 'melodic_direction',
        }

    if drill_type == 'shape':
        shape, offsets = rng.choice([
            ('Ascending', [0, 3, 7]),
            ('Descending', [7, 3, 0]),
            ('Arch', [0, 7, 3]),
            ('Valley', [7, 0, 3]),
        ])
        options = ['Ascending', 'Descending', 'Arch', 'Valley']
        return {
            'type': drill_type,
            'title': 'Melody Shape',
            'question': 'What contour does this three-note phrase trace?',
            'options': options,
            'correct_index': options.index(shape),
            'notes': [_tone_name(root_index + offset, base_octave) for offset in offsets],
            'answer_mode': 'melodic_contour',
        }

    enabled_qualities = [
        quality for quality, metadata in EAR_CHORD_QUALITIES.items()
        if metadata['difficulty'] <= max(2, difficulty)
    ]
    quality = rng.choice(enabled_qualities)
    chord_definition = build_chord_definition(PITCH_CLASSES[root_index], quality)
    chord_events = build_scheduled_note_events(chord_definition, octave=base_octave)
    chord_notes = [event['note'] for event in chord_events]
    if drill_type == 'chord_quality':
        correct = CHORD_QUALITIES[quality]['displayName']
        labels = [CHORD_QUALITIES[item]['displayName'] for item in enabled_qualities]
        options, correct_index = _shuffle_options(correct, labels, rng)
        return {
            'type': drill_type,
            'title': 'Chord Colour',
            'question': 'Which chord quality do you hear?',
            'options': options,
            'correct_index': correct_index,
            'chords': [chord_notes],
            'chordDefinitions': [chord_definition],
            'events': chord_events,
            'answer_mode': 'single_chord_quality',
            'explanation': f'{correct}: formula {"–".join(str(interval) for interval in chord_definition["intervals"])} semitones.',
        }

    if drill_type == 'chord_pair':
        pair = build_chord_pair_challenge(challenge.id, difficulty)
        relationship_labels = {
            'same-root-different-quality': 'Same root, different quality',
            'different-root-same-quality': 'Different root, same quality',
            'relative-major-minor': 'Relative major and minor',
            'diatonic-function': 'Functional movement',
            'inversion': 'Same chord, different inversion',
            'random-controlled': 'Different root and quality',
        }
        correct = relationship_labels[pair['relationship']]
        options, correct_index = _shuffle_options(correct, list(relationship_labels.values()), rng)
        definitions = [pair['first'], pair['second']]
        chords = [
            [event['note'] for event in build_scheduled_note_events(item, octave=base_octave)]
            for item in definitions
        ]
        return {
            'type': drill_type,
            'title': 'Chord Chase',
            'question': 'What relationship connects the two chords?',
            'options': options,
            'correct_index': correct_index,
            'chords': chords,
            'chordDefinitions': definitions,
            'relationship': pair['relationship'],
            'answer_mode': 'chord_relationship',
            'explanation': f'{definitions[0]["shortName"]} → {definitions[1]["shortName"]}: {correct}.',
        }

    if drill_type == 'inversion':
        inversion_count = len(chord_definition['inversions'])
        inversion = 1 + (challenge.id % max(1, inversion_count - 1))
        inverted = build_chord_definition(PITCH_CLASSES[root_index], quality, inversion=inversion)
        inverted_notes = [event['note'] for event in build_scheduled_note_events(inverted, octave=base_octave)]
        labels = ['Root position', 'First inversion', 'Second inversion']
        if inversion_count == 4:
            labels.append('Third inversion')
        return {
            'type': drill_type,
            'title': 'Inversion Gate',
            'question': 'Which inversion places the chord tone in the bass?',
            'options': labels,
            'correct_index': inversion,
            'chords': [inverted_notes],
            'chordDefinitions': [inverted],
            'answer_mode': 'inversion',
            'explanation': f'{inverted["shortName"]} is in {labels[inversion].lower()}.',
        }

    movement = rng.choice([3, 4, 5, 7, 9])
    correct = INTERVAL_NAMES_REVERSE[movement]
    options, correct_index = _shuffle_options(correct, list(INTERVAL_SEMITONES), rng)
    second_quality = rng.choice(enabled_qualities)
    second_root = root_index + movement
    second_definition = build_chord_definition(PITCH_CLASSES[second_root % 12], second_quality)
    second_chord = [event['note'] for event in build_scheduled_note_events(second_definition, octave=base_octave)]
    return {
        'type': 'chord_movement',
        'title': 'Chord Journey',
        'question': 'Name the root movement between these two chords.',
        'options': options,
        'correct_index': correct_index,
        'chords': [chord_notes, second_chord],
        'chordDefinitions': [chord_definition, second_definition],
        'answer_mode': 'root_interval_between_chords',
        'explanation': f'The roots move by {correct.lower()}.',
    }


def serialize_challenge(challenge):
    data = challenge.to_dict()
    data['xp_reward'] = get_mode_base_xp('challenge', challenge.difficulty)
    # Pre-visual rows remain playable during the additive-column migration.
    # Newly seeded rows always persist a specific payload below.
    if not data['visual']:
        data['visual'], data['question_type'], data['question'] = _legacy_visual(challenge)
    if challenge.category != 'ear_training':
        return data

    exercise = build_ear_exercise(challenge)
    data.update({
        'title': exercise['title'],
        'question': exercise['question'],
        'options': exercise['options'],
        'correct_index': exercise['correct_index'],
        'explanation': exercise.get('explanation', data.get('explanation')),
        'exercise': exercise,
        'question_type': f'ear-{exercise["type"]}',
        'visual': _ear_visual(exercise),
    })
    return data


def _ear_visual(exercise):
    if exercise['type'] in {'interval', 'direction'}:
        notes = exercise['notes']
        return _interval_visual(notes[0], notes[1], 0, 'down' if exercise['type'] == 'direction' and notes[1] < notes[0] else 'up')
    if exercise['type'] == 'shape':
        return {'kind': 'melody', 'notes': exercise['notes']}
    definitions = exercise.get('chordDefinitions', [])
    chords = [
        {
            'root': item['root'], 'intervals': item['intervals'],
            'notes': [NOTES[(NOTES.index(item['root']) + interval) % 12] for interval in item['intervals']],
        }
        for item in definitions
    ]
    return {'kind': 'chord', 'chords': chords}


def _legacy_visual(challenge):
    """Give pre-migration rows a real visual while users work through the old bank."""
    question = challenge.question or ''
    if challenge.category == 'scales':
        root_match = re.search(r'([A-G](?:#|b)?)\s+uses the pattern', question, flags=re.IGNORECASE)
        root = root_match.group(1) if root_match else 'C'
        root = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}.get(root, root)
        return _scale_visual(root, 'minor' if 'minor' in (challenge.title or '').lower() else 'major'), 'scale-identification', 'Which scale is this?'
    if challenge.category == 'intervals':
        match = re.search(r'([A-G](?:#|b)?)\s*→\s*([A-G](?:#|b)?).*?(\d+)\s+semitones', question, flags=re.IGNORECASE)
        if match:
            first, second, semitones = match.groups()
            return _interval_visual(first, second, int(semitones)), 'interval-identification', 'Name this interval.'
    if '5th of C Major' in question:
        return _scale_visual('C', 'major'), 'theory-scale-degree-note', 'Which note is degree 5?'
    if challenge.category == 'chords':
        match = re.search(r'([A-G](?:#|b)?)(m7|maj7|dim7|sus2|sus4|dim|aug|m|7)?\?', question, flags=re.IGNORECASE)
        if match:
            root, suffix = match.groups()
            quality = {'m': 'Minor', 'dim': 'Diminished', 'aug': 'Augmented', 'maj7': 'Major 7th', 'm7': 'Minor 7th', '7': 'Dominant 7th', 'sus2': 'Sus2', 'sus4': 'Sus4', 'dim7': 'Dim 7th'}.get((suffix or '').lower(), 'Major')
            return _chord_visual(root, quality), 'chord-quality', 'What quality is this chord?'
    return {'kind': 'history', 'subject': challenge.title, 'timeline': []}, 'legacy-concept', question


@daily_bp.route('/chords/inventory', methods=['GET'])
@limiter.limit('60 per minute', override_defaults=True)
def chord_inventory():
    """Expose the canonical chord theory inventory used by ear training."""
    return jsonify(inventory_payload())


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
            'title': f'Scale: {scale_type.replace("_", " ").title()}',
            'question': 'Which scale is this?',
            'options': options,
            'correct_index': correct_idx,
            'explanation': build_daily_challenge_explanation('scales', f'Identify the {scale_type.replace("_", " ").title()} Scale', f'Which scale type is built on the root note {root} with the interval pattern: {", ".join(MAJOR_SCALE_INTERVALS if "major" in scale_type or scale_type in ("ionian", "lydian", "mixolydian") else MINOR_SCALE_INTERVALS)}?', options, correct_idx),
            'xp_reward': random.choice([25, 50, 75]),
            'difficulty': random.choice([1, 2]),
            'question_type': 'scale-identification',
            'visual': _scale_visual(root, scale_type),
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
            'question_type': 'chord-quality',
            'visual': _chord_visual(root, chord_label),
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
            'question': 'Name this interval.',
            'options': options,
            'correct_index': correct_idx,
            'explanation': build_daily_challenge_explanation('intervals', 'Identify the Interval', f'What is the interval between {n1} and {n2}? ({n1} → {n2} = {semitones} semitones)', options, correct_idx),
            'xp_reward': random.choice([25, 50]),
            'difficulty': random.choice([1, 2]),
            'question_type': 'interval-identification',
            'visual': _interval_visual(n1, n2, semitones),
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
    theory_types = [
        'perfect-fifth', 'major-scale-pattern', 'pentatonic-count', 'caged', 'key-signature',
        'relative-minor', 'tonic', 'triad', 'scale-degree-interval', 'chromatic-scale',
        'guitar-strings', 'guitar-tuning', 'scale-degree-note', 'mode-degree', 'barre-chord',
        'octave', 'dominant-seventh', 'tempo', 'subdominant', 'meter', 'arpeggio', 'mediant',
        'major-triad', 'diminished-triad', 'circle-of-fifths',
    ]
    theory_visuals = [
        _interval_visual('C4', 'G4', 7), _scale_visual('C', 'major'),
        _scale_visual('C', 'pentatonic_major'), {'kind': 'fretboard', 'tuning': ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'chordShape': 'C-A-G-E-D'},
        {'kind': 'key-signature', 'tonic': 'A', 'mode': 'major', 'accidentals': ['F#', 'C#', 'G#']},
        {'kind': 'circle-of-fifths', 'activeKey': 'C', 'relation': 'relative-minor'},
        {'kind': 'key-signature', 'tonic': 'D', 'mode': 'major', 'accidentals': ['F#', 'C#']},
        _chord_visual('C', 'Major'), _interval_visual('C4', 'E4', 4), _scale_visual('C', 'chromatic'),
        {'kind': 'instrument', 'instrument': 'guitar', 'strings': 6}, {'kind': 'fretboard', 'tuning': ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']},
        _scale_visual('C', 'major'), _scale_visual('C', 'dorian'), {'kind': 'fretboard', 'tuning': ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], 'chordShape': 'barre'},
        _interval_visual('C4', 'C5', 12), _chord_visual('C', 'Dominant 7th'), {'kind': 'tempo', 'marking': 'tempo', 'bpmRange': [60, 120]},
        _scale_visual('G', 'major'), {'kind': 'rhythm', 'meter': [4, 4], 'events': [{'value': 'quarter', 'beat': 1}]},
        {'kind': 'technique', 'subject': 'arpeggio', 'frames': []}, _scale_visual('C', 'major'), _chord_visual('C', 'Major'),
        _chord_visual('C', 'Diminished'), {'kind': 'circle-of-fifths', 'activeKey': 'C'},
    ]
    for _ in range(count):
        q = random.choice(theory_bank)
        index = theory_bank.index(q)
        questions.append({
            'category': 'theory',
            'title': 'Theory Quest',
            'question': q['question'],
            'options': q['options'],
            'correct_index': q['correct_index'],
            'explanation': build_daily_challenge_explanation('theory', 'Music Theory', q['question'], q['options'], q['correct_index']),
            'xp_reward': q['xp_reward'],
            'difficulty': q['difficulty'],
            'question_type': f'theory-{theory_types[index]}',
            'visual': theory_visuals[index],
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
            'question_type': 'ear-training-legacy',
            'visual': _interval_visual(n1, n2, semitones),
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
            'question_type': f'general-{title.lower().replace(" ", "-")}',
            'visual': _general_visual(title),
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
                question_type=q.get('question_type'),
                visual_json=json.dumps(q['visual']),
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


def _utc_hint_state(user, now=None):
    now = now or datetime.utcnow()
    usage_date = now.strftime('%Y-%m-%d')
    reset_at = (datetime(now.year, now.month, now.day) + timedelta(days=1)).isoformat() + 'Z'
    rank_id = (user.rank_id or 'unranked').lower()
    limit = HINT_LIMITS.get(rank_id, HINT_LIMITS['unranked'])
    usage = DailyHintUsage.query.filter_by(user_id=user.id, usage_date=usage_date).first()
    used = usage.used_count if usage else 0
    return usage_date, limit, used, reset_at


def _hint_allowance(user):
    _, limit, used, reset_at = _utc_hint_state(user)
    return {'remaining': max(limit - used, 0), 'limit': limit, 'reset_at': reset_at, 'local_only': False}


def _apply_rank_xp(user, amount):
    """Apply server-owned daily reward progress without skipping promotion gates."""
    if not amount or user.rank_challenge_pending:
        return
    rank_id = (user.rank_id or 'unranked').lower()
    if rank_id not in RANK_LEVELS:
        rank_id = 'unranked'
    user.rank_id = rank_id
    user.rank_xp = (user.rank_xp or 0) + amount
    if user.rank_xp < RANK_XP_PER_LEVEL:
        return
    user.rank_xp -= RANK_XP_PER_LEVEL
    rank_max = RANK_LEVELS[rank_id]
    user.rank_level = min(rank_max, (user.rank_level or 1) + 1)
    if user.rank_level >= rank_max:
        user.rank_level = rank_max
        user.rank_challenge_pending = rank_id != 'legendary'


# ─── Routes ────────────────────────────────────────────────────────────────────

@daily_bp.route('/daily-challenges', methods=['GET'])
@limiter.limit('120 per minute', override_defaults=True)
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

    result = [serialize_challenge(c) for c in challenges]
    completed_count = len(completed_ids)

    return jsonify({
        'challenges': result,
        'total': DailyChallenge.query.count(),
        'completed': completed_count,
        'remaining': max(available_total - len(result), 0) if random_mode else max(available_total - offset - len(result), 0),
        'limit': limit,
        'offset': offset,
        'hint_allowance': _hint_allowance(current_user) if current_user.is_authenticated else {
            'remaining': None, 'limit': None, 'reset_at': None, 'local_only': True,
        },
    })


@daily_bp.route('/daily-challenge/<int:challenge_id>/hint', methods=['POST'])
@login_required
@limiter.limit('120 per hour', override_defaults=True)
def reveal_hint(challenge_id):
    """Spend at most one UTC daily hint for this user's challenge reveal."""
    challenge = DailyChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    usage_date, limit, _, reset_at = _utc_hint_state(current_user)
    # The reveal row is the idempotency key. Locking the usage row keeps supported
    # databases from overspending the daily counter under simultaneous requests.
    reveal = DailyHintReveal.query.filter_by(
        user_id=current_user.id, challenge_id=challenge_id, usage_date=usage_date,
    ).first()
    usage = DailyHintUsage.query.filter_by(
        user_id=current_user.id, usage_date=usage_date,
    ).with_for_update().first()
    if reveal:
        used = usage.used_count if usage else 0
        return jsonify({
            'remaining': max(limit - used, 0), 'limit': limit, 'reset_at': reset_at,
            'explanation': challenge.to_dict()['explanation'], 'already_revealed': True,
        })
    if usage is None:
        usage = DailyHintUsage(user_id=current_user.id, usage_date=usage_date, used_count=0)
        db.session.add(usage)
    if usage.used_count >= limit:
        return jsonify({
            'remaining': 0, 'limit': limit, 'reset_at': reset_at,
            'error': 'No daily hints remaining',
        }), 429

    usage.used_count += 1
    db.session.add(DailyHintReveal(
        user_id=current_user.id, challenge_id=challenge_id, usage_date=usage_date,
    ))
    try:
        db.session.commit()
    except IntegrityError:
        # A concurrent request may have inserted this reveal after our initial
        # read. The unique idempotency key makes that request a successful reopen.
        db.session.rollback()
        reveal = DailyHintReveal.query.filter_by(
            user_id=current_user.id, challenge_id=challenge_id, usage_date=usage_date,
        ).first()
        if reveal:
            usage = DailyHintUsage.query.filter_by(
                user_id=current_user.id, usage_date=usage_date,
            ).first()
            used = usage.used_count if usage else 0
            return jsonify({
                'remaining': max(limit - used, 0), 'limit': limit, 'reset_at': reset_at,
                'explanation': challenge.to_dict()['explanation'], 'already_revealed': True,
            })
        raise
    return jsonify({
        'remaining': limit - usage.used_count, 'limit': limit, 'reset_at': reset_at,
        'explanation': challenge.to_dict()['explanation'], 'already_revealed': False,
    })


@daily_bp.route('/daily-challenge/<int:challenge_id>/complete', methods=['POST'])
@limiter.limit('120 per hour', override_defaults=True)
def complete_challenge(challenge_id):
    """Mark a challenge as complete and award XP."""
    challenge = DailyChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if not current_user.is_authenticated:
        return jsonify({
            'authenticated': False,
            'xp': 0,
            'level': 1,
            'xp_awarded': 0,
            'message': 'Correct! Sign in to save XP and streak progress.',
        })

    today = datetime.utcnow().strftime('%Y-%m-%d')
    data = request.get_json(silent=True) or {}
    reward_mode = data.get('mode', 'challenge')
    if reward_mode not in {'challenge', 'ear-training'}:
        return jsonify({'error': 'mode must be challenge or ear-training'}), 400
    xp_award = get_mode_base_xp(reward_mode, challenge.difficulty)

    # One reward per challenge: completed challenges are filtered out of the list,
    # so a visible challenge should pay its own reward exactly once.
    existing = ChallengeAttempt.query.filter_by(
        user_id=current_user.id,
        challenge_id=challenge_id,
    ).first()
    if existing and existing.completed:
        return jsonify({
            'authenticated': True,
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
    _apply_rank_xp(current_user, xp_award)
    db.session.commit()

    return jsonify({
        'authenticated': True,
        'xp': current_user.xp,
        'level': current_user.level,
        'xp_awarded': xp_award,
        'rank': current_user.to_dict()['rank'],
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
@limiter.exempt
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
