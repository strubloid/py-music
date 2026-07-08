from __future__ import annotations

import re
from typing import Sequence


def _normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', text.strip().lower())


def _safe_choice_hint(question: str) -> str:
    normalized_question = _normalize(question)
    if 'semitone' in normalized_question:
        return 'Count the semitone distance, then match that number to the interval name.'
    if 'degree' in normalized_question:
        return 'Think in scale degrees: count from the tonic as 1.'
    if 'mode' in normalized_question:
        return 'Modes are ordered from the major scale degrees; match the degree clue to the mode.'
    if 'chord' in normalized_question or 'triad' in normalized_question:
        return 'Look at the chord formula: root, 3rd quality, 5th quality, and any added 7th.'
    if 'scale' in normalized_question:
        return 'Use the scale pattern or note count, then compare it with the choices.'
    if 'time signature' in normalized_question or 'beat' in normalized_question or 'note' in normalized_question:
        return 'Use the rhythm value or beat count in the question, then match the closest choice.'
    return 'Use the key word in the prompt and eliminate choices that do not match that music idea.'


def build_daily_challenge_explanation(
    category: str,
    title: str,
    question: str,
    options: Sequence[str],
    correct_index: int,
) -> str:
    """Build a pre-answer hint that never reveals the correct option.

    This text is shown before the player answers on /play/daily, so it must teach
    the method, not state the answer. The result intentionally avoids using
    correct_index/correct_answer except for signature compatibility.
    """
    normalized_question = _normalize(question)

    if category == 'scales':
        pattern_match = re.search(r'(?:interval pattern:|uses the pattern|pattern:)\s*([WH,\-\s]+)', question, flags=re.IGNORECASE)
        if pattern_match:
            return 'W = whole step (2 semitones), H = half step (1 semitone). Compare the recipe with the scale choices.'
        return 'Look for the scale recipe or note count, then match it to the choices.'

    if category == 'chords':
        return 'Read the chord symbol after the root. Suffixes show quality, added tones, or suspended tones.'

    if category in {'intervals', 'ear_training'}:
        if 'semitone' in normalized_question:
            return 'Use the semitone count to identify the interval quality and number.'
        return 'Count the distance from the first note to the second note, then match the interval name.'

    if category in {'theory', 'general'}:
        return _safe_choice_hint(question)

    return 'Use the prompt clue, eliminate unlikely choices, then lock in the best match.'
