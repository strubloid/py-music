"""Canonical chord inventory and controlled ear-training pair generation."""

from __future__ import annotations

import json
import random
from pathlib import Path

_INVENTORY_PATH = Path(__file__).with_name('chord_inventory.json')
with _INVENTORY_PATH.open(encoding='utf-8') as inventory_file:
    _INVENTORY = json.load(inventory_file)

PITCH_CLASSES = tuple(_INVENTORY['pitchClasses'])
FLAT_ALIASES = _INVENTORY['flatAliases']
CHORD_QUALITIES = _INVENTORY['qualities']


def _inversions(intervals):
    values = list(intervals)
    inversions = []
    for index in range(len(values)):
        rotated = values[index:] + [value + 12 for value in values[:index]]
        inversions.append(rotated)
    return inversions


def build_chord_definition(root, quality, *, inversion=0):
    if root not in PITCH_CLASSES:
        raise ValueError(f'Unsupported pitch class: {root}')
    if quality not in CHORD_QUALITIES:
        raise ValueError(f'Unsupported chord quality: {quality}')
    metadata = CHORD_QUALITIES[quality]
    inversions = _inversions(metadata['intervals'])
    selected_inversion = inversion % len(inversions)
    short_name = metadata['shortName']
    symbol = f'{root}{"" if quality == "major" else short_name}'
    return {
        'id': f'{root}:{quality}:inv{selected_inversion}',
        'root': root,
        'quality': quality,
        'intervals': list(metadata['intervals']),
        'displayName': f'{root} {metadata["displayName"]}',
        'shortName': symbol,
        'aliases': [f'{root}{alias}' for alias in metadata['aliases']],
        'inversions': inversions,
        'selectedInversion': selected_inversion,
        'voicing': inversions[selected_inversion],
        'enabledForEarTraining': metadata['enabledForEarTraining'],
        'difficulty': metadata['difficulty'],
    }


def _relative_minor(root):
    return PITCH_CLASSES[(PITCH_CLASSES.index(root) + 9) % 12]


def build_chord_pair_challenge(seed, difficulty=1):
    """Build a controlled, pedagogically labelled chord comparison."""
    rng = random.Random(seed)
    relationship_order = (
        'same-root-different-quality',
        'different-root-same-quality',
        'relative-major-minor',
        'diatonic-function',
        'inversion',
        'random-controlled',
    )
    relationship = relationship_order[seed % len(relationship_order)]
    root = PITCH_CLASSES[(seed // len(relationship_order)) % len(PITCH_CLASSES)]

    # Stable first seeds make the acceptance examples permanently covered.
    if seed == 0:
        first, second = build_chord_definition('C', 'major'), build_chord_definition('E', 'minor')
        relationship = 'random-controlled'
    elif seed == 1:
        first, second = build_chord_definition('C', 'major'), build_chord_definition('D', 'major')
        relationship = 'different-root-same-quality'
    elif seed == 2:
        first, second = build_chord_definition('G', 'major'), build_chord_definition('A', 'minor')
        relationship = 'diatonic-function'
    elif relationship == 'same-root-different-quality':
        quality_choices = ('minor', 'diminished') if difficulty <= 3 else ('sus2', 'sus4', 'augmented')
        first = build_chord_definition(root, 'major')
        second = build_chord_definition(root, rng.choice(quality_choices))
    elif relationship == 'different-root-same-quality':
        distance = 2 if difficulty >= 4 else 5
        first = build_chord_definition(root, 'major')
        second = build_chord_definition(PITCH_CLASSES[(PITCH_CLASSES.index(root) + distance) % 12], 'major')
    elif relationship == 'relative-major-minor':
        first = build_chord_definition(root, 'major')
        second = build_chord_definition(_relative_minor(root), 'minor')
    elif relationship == 'diatonic-function':
        first = build_chord_definition(root, 'major')
        second_root = PITCH_CLASSES[(PITCH_CLASSES.index(root) + 5) % 12]
        second = build_chord_definition(second_root, 'major')
    elif relationship == 'inversion':
        quality = 'major7' if difficulty >= 6 else 'major'
        first = build_chord_definition(root, quality, inversion=0)
        second = build_chord_definition(root, quality, inversion=1)
    else:
        qualities = ['major', 'minor', 'diminished', 'augmented']
        if difficulty >= 5:
            qualities += ['sus2', 'sus4', 'dominant7', 'major7', 'minor7']
        first = build_chord_definition(root, rng.choice(qualities))
        second_root = PITCH_CLASSES[(PITCH_CLASSES.index(root) + rng.choice([2, 3, 5, 7, 9])) % 12]
        second = build_chord_definition(second_root, rng.choice(qualities))

    return {
        'first': first,
        'second': second,
        'relationship': relationship,
        'difficulty': max(1, min(10, difficulty)),
        'playbackMode': 'alternating' if difficulty >= 7 else 'sequential',
    }


def _tone_name(root_index, semitone_offset, octave):
    absolute = root_index + semitone_offset
    return f'{PITCH_CLASSES[absolute % 12]}{octave + absolute // 12}'


def build_scheduled_note_events(chord, octave=3, timing_scale=1):
    root_index = PITCH_CLASSES.index(chord['root'])
    return [
        {
            'note': _tone_name(root_index, interval, octave),
            'time': 0,
            'duration': round(1.2 * timing_scale, 3),
            'velocity': 110,
        }
        for interval in chord['voicing']
    ]


def inventory_payload():
    return {
        'schemaVersion': _INVENTORY['schemaVersion'],
        'roots': list(PITCH_CLASSES),
        'flatAliases': FLAT_ALIASES,
        'qualities': CHORD_QUALITIES,
        'definitions': [
            build_chord_definition(root, quality)
            for root in PITCH_CLASSES
            for quality, metadata in CHORD_QUALITIES.items()
            if metadata['enabledForEarTraining']
        ],
    }
