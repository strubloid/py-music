"""music21-backed analysis for the Scale Lab.

The browser sends pitch classes only. This module owns scale spelling, mode
classification, interval formulas, and candidate ranking so the result is not
client-authored or duplicated in UI code.
"""
from __future__ import annotations

from music21 import interval, note, scale

NOTE_NAMES = ['C', 'C#', 'D', 'E-', 'E', 'F', 'F#', 'G', 'A-', 'A', 'B-', 'B']
MODE_CLASSES = {
    'ionian': scale.MajorScale,
    'dorian': scale.DorianScale,
    'phrygian': scale.PhrygianScale,
    'lydian': scale.LydianScale,
    'mixolydian': scale.MixolydianScale,
    'aeolian': scale.MinorScale,
    'locrian': scale.LocrianScale,
}
MODE_LABELS = {
    'ionian': 'Ionian (Major)', 'dorian': 'Dorian', 'phrygian': 'Phrygian',
    'lydian': 'Lydian', 'mixolydian': 'Mixolydian',
    'aeolian': 'Aeolian (Natural Minor)', 'locrian': 'Locrian',
}
FORMULAS = {
    'ionian': ['1', '2', '3', '4', '5', '6', '7'],
    'dorian': ['1', '2', 'b3', '4', '5', '6', 'b7'],
    'phrygian': ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    'lydian': ['1', '2', '3', '#4', '5', '6', '7'],
    'mixolydian': ['1', '2', '3', '4', '5', '6', 'b7'],
    'aeolian': ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    'locrian': ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
}
CHARACTERISTIC_DEGREES = {
    'ionian': '7', 'dorian': '6', 'phrygian': 'b2', 'lydian': '#4',
    'mixolydian': 'b7', 'aeolian': 'b6', 'locrian': 'b5',
}


def _music21_name(name: str) -> str:
    normalized = name.strip().upper().replace('♭', 'B').replace('♯', '#')
    aliases = {'DB': 'D-', 'EB': 'E-', 'GB': 'G-', 'AB': 'A-', 'BB': 'B-'}
    return aliases.get(normalized, normalized)


def _pitch_classes(root_name: str, mode_key: str) -> tuple[list[int], list[str]]:
    tonic = note.Note(_music21_name(root_name))
    tonic.octave = 3
    scale_object = MODE_CLASSES[mode_key](tonic)
    pitches = scale_object.getPitches(f'{tonic.name}3', f'{tonic.name}4')[:-1]
    return [pitch.pitchClass for pitch in pitches], [pitch.name.replace('-', 'b') for pitch in pitches]


def _candidate(root_pc: int, mode_key: str, selected: set[int]) -> dict:
    root_name = NOTE_NAMES[root_pc]
    expected, spellings = _pitch_classes(root_name, mode_key)
    expected_set = set(expected)
    matches = selected & expected_set
    missing = expected_set - selected
    extra = selected - expected_set
    score = round((len(matches) * 2 - len(extra) * 1.5 - len(missing) * 0.25) / 14, 3)
    return {
        'root': root_name.replace('-', 'b'),
        'rootPitchClass': root_pc,
        'mode': mode_key,
        'name': MODE_LABELS[mode_key],
        'formula': FORMULAS[mode_key],
        'formulaText': ' – '.join(FORMULAS[mode_key]),
        'pitchClasses': expected,
        'spellings': spellings,
        'matchingPitchClasses': sorted(matches),
        'missingPitchClasses': sorted(missing),
        'extraPitchClasses': sorted(extra),
        'matchCount': len(matches),
        'score': score,
        'confirmed': selected == expected_set,
    }


def analyze_scale_build(root_name: str, mode_key: str, selected_notes: list[int]) -> dict:
    if mode_key not in MODE_CLASSES:
        raise ValueError('Unsupported scale family')
    if not isinstance(selected_notes, list) or any(not isinstance(value, int) or value < 0 or value > 11 for value in selected_notes):
        raise ValueError('selectedNotes must contain pitch classes from 0 through 11')

    selected = set(selected_notes)
    tonic = note.Note(_music21_name(root_name))
    root_pc = tonic.pitch.pitchClass
    target = _candidate(root_pc, mode_key, selected)
    ranked = [
        _candidate(candidate_root, candidate_mode, selected)
        for candidate_root in range(12)
        for candidate_mode in MODE_CLASSES
    ]
    ranked.sort(key=lambda item: (-item['confirmed'], -item['score'], len(item['extraPitchClasses']), len(item['missingPitchClasses']), item['rootPitchClass'], item['mode']))

    selected_spellings = [NOTE_NAMES[pitch_class].replace('-', 'b') for pitch_class in sorted(selected)]
    interval_names = []
    for pitch_class in sorted(selected):
        candidate_note = note.Note(NOTE_NAMES[pitch_class])
        interval_names.append(interval.Interval(tonic, candidate_note).simpleName)

    if target['confirmed']:
        message = f"Formula confirmed: {target['root']} {target['name']}."
    else:
        message = f"The formula needs {len(target['missingPitchClasses'])} more note(s) and has {len(target['extraPitchClasses'])} outside note(s)."

    return {
        'analysisEngine': 'music21',
        'confirmed': target['confirmed'],
        'expectedPitchClasses': target['pitchClasses'],
        'expectedSpellings': target['spellings'],
        'missingPitchClasses': target['missingPitchClasses'],
        'extraPitchClasses': target['extraPitchClasses'],
        'selectedSpellings': selected_spellings,
        'selectedIntervals': interval_names,
        'formula': target['formula'],
        'formulaText': target['formulaText'],
        'characteristicDegree': CHARACTERISTIC_DEGREES[mode_key],
        'message': message,
        'candidates': ranked[:5],
    }
