from __future__ import annotations

import re
from typing import Sequence

MAJOR_SCALE_INTERVALS = ['W', 'W', 'H', 'W', 'W', 'W', 'H']
MINOR_SCALE_INTERVALS = ['W', 'H', 'W', 'W', 'H', 'W', 'W']

CHORD_FORMULAS = {
    'major': 'a root, major 3rd, and perfect 5th',
    'minor': 'a root, minor 3rd, and perfect 5th',
    'dim': 'a root, minor 3rd, and diminished 5th',
    'diminished': 'a root, minor 3rd, and diminished 5th',
    'aug': 'a root, major 3rd, and augmented 5th',
    'augmented': 'a root, major 3rd, and augmented 5th',
    'maj7': 'a major triad plus a major 7th',
    'major 7th': 'a major triad plus a major 7th',
    'm7': 'a minor triad plus a minor 7th',
    'minor 7th': 'a minor triad plus a minor 7th',
    '7': 'a major triad plus a minor 7th',
    'dom7': 'a major triad plus a minor 7th',
    'dominant 7th': 'a major triad plus a minor 7th',
    'sus2': 'the root, 2nd, and 5th instead of a 3rd',
    'suspended 2nd': 'the root, 2nd, and 5th instead of a 3rd',
    'sus4': 'the root, 4th, and 5th instead of a 3rd',
    'suspended 4th': 'the root, 4th, and 5th instead of a 3rd',
    'dim7': 'a diminished triad plus a diminished 7th',
    '°7': 'a diminished triad plus a diminished 7th',
}


def _normalize_answer(answer: str) -> str:
    return answer.strip().lower()


def _format_answer(answer: str) -> str:
    return answer.strip() or 'the correct answer'


def build_daily_challenge_explanation(
    category: str,
    title: str,
    question: str,
    options: Sequence[str],
    correct_index: int,
) -> str:
    correct_answer = options[correct_index] if 0 <= correct_index < len(options) else ''
    normalized_question = question.lower()
    normalized_answer = _normalize_answer(correct_answer)

    if category == 'scales':
        pattern_match = re.search(r'(?:interval pattern:|uses the pattern|pattern:)\s*([WH,\s]+)', question, flags=re.IGNORECASE)
        pattern = pattern_match.group(1).strip() if pattern_match else ''
        if pattern:
            cleaned_pattern = pattern.replace(' ', '')
            if cleaned_pattern == ','.join(MAJOR_SCALE_INTERVALS):
                return 'W = whole step (2 semitones), H = half step (1 semitone).'
            if cleaned_pattern == ','.join(MINOR_SCALE_INTERVALS):
                return 'W = whole step (2 semitones), H = half step (1 semitone).'
            return f'W = whole step (2 semitones), H = half step (1 semitone). Pattern: {pattern}. Answer: {_format_answer(correct_answer)}.'
        return f'The correct scale type is {_format_answer(correct_answer)}.'

    if category == 'chords':
        formula = CHORD_FORMULAS.get(normalized_answer, 'the standard chord tones for that chord quality')
        return f'{_format_answer(correct_answer)} chord = {formula}.'

    if category in {'intervals', 'ear_training'}:
        semitone_match = re.search(r'(\d+) semitones', question)
        semitones = semitone_match.group(1) if semitone_match else None
        note_match = re.search(r'([A-G]#?)\s*→\s*([A-G]#?).*?(\d+) semitones', question, flags=re.IGNORECASE)
        if not note_match:
            note_match = re.search(r'between\s+([A-G]#?)\s+and\s+([A-G]#?)', question, flags=re.IGNORECASE)
        if not note_match:
            note_match = re.search(r'From\s+([A-G]#?)\s+to\s+([A-G]#?)', question, flags=re.IGNORECASE)
        if note_match and semitones:
            left = note_match.group(1).upper()
            right = note_match.group(2).upper()
            return f'{left}→{right} = {semitones} semitones, so it is a {_format_answer(correct_answer)}.'
        return f'Interval answer: {_format_answer(correct_answer)}.'

    if category == 'theory':
        if 'interval pattern of a major scale' in normalized_question:
            return 'Major scale pattern = W-W-H-W-W-W-H, where W is a whole step and H is a half step.'
        if 'perfect 5th' in normalized_question:
            return 'A perfect 5th spans 7 semitones.'
        if 'pentatonic scale' in normalized_question:
            return 'A standard pentatonic scale has 5 notes.'
        if 'caged' in normalized_question:
            return 'CAGED refers to the five chord shapes C, A, G, E, and D.'
        if 'major' in normalized_question and 'sharps' in normalized_question:
            return 'A major key signature is built from the notes in the scale; A major has 3 sharps.'
        if 'relative minor' in normalized_question:
            return 'The relative minor shares the same key signature as the major key.'
        if 'tonic of the d major scale' in normalized_question:
            return 'The tonic is the first note of the scale.'
        if 'triad' in normalized_question:
            return 'A triad is a three-note chord.'
        if 'major scale' in normalized_question and '1st and 3rd' in normalized_question:
            return 'The 1st to 3rd notes of a major scale form a major 3rd.'
        if 'contains all 12 notes' in normalized_question:
            return 'The chromatic scale uses all 12 semitones.'
        if 'standard guitar' in normalized_question and 'strings' in normalized_question:
            return 'A standard guitar has 6 strings.'
        if 'standard tuning' in normalized_question:
            return 'Standard guitar tuning from low to high is E-A-D-G-B-E.'
        if '5th of c major' in normalized_question:
            return 'The 5th note of C major is G.'
        if 'which mode starts on the 2nd degree' in normalized_question:
            return 'Dorian is the second mode of the major scale.'
        if 'barre chord' in normalized_question:
            return 'A barre chord uses one finger to press multiple strings across the fretboard.'
        if 'half steps' in normalized_question and 'octave' in normalized_question:
            return 'An octave contains 12 semitones.'
        if 'dominant 7th' in normalized_question:
            return 'A dominant 7th is a major triad with a minor 7th.'
        if 'tempo' in normalized_question:
            return 'Tempo means the speed of the beat.'
        if 'subdominant' in normalized_question:
            return 'The subdominant is the 4th scale degree.'
        if '4/4 time signature' in normalized_question:
            return '4/4 time means 4 beats per measure.'
        if 'arpggio' in normalized_question or 'arpeggio' in normalized_question:
            return 'An arpeggio plays the notes of a chord one after another.'
        if 'mediant' in normalized_question:
            return 'The mediant is the 3rd scale degree.'
        if 'c major triad' in normalized_question:
            return 'A C major triad is built from C, E, and G.'
        if 'diminished' in normalized_question and 'triad' in normalized_question:
            return 'A diminished triad stacks two minor 3rds.'
        if 'circle of fifths' in normalized_question:
            return 'The circle of fifths has 12 keys.'
        return f'The correct answer is {_format_answer(correct_answer)}.'

    if category == 'general':
        if 'whole note' in normalized_question and 'quarter note' in normalized_question:
            return 'A whole note equals 4 quarter notes.'
        if 'half note' in normalized_question and 'eighth note' in normalized_question:
            return 'A half note equals 2 eighth notes.'
        if 'sixteenth notes' in normalized_question and 'quarter note' in normalized_question:
            return 'A quarter note equals 4 sixteenth notes.'
        if 'dotted half note' in normalized_question:
            return 'A dotted half note equals 3 quarter notes.'
        if 'whole note in 4/4' in normalized_question:
            return 'In 4/4 time, a whole note lasts 4 beats.'
        if 'clef' in normalized_question:
            return f'This is a clef question; the correct answer is {_format_answer(correct_answer)}.'
        if 'forte' in normalized_question or 'piano' in normalized_question or 'crescendo' in normalized_question:
            return f'{_format_answer(correct_answer)} is the correct dynamic marking meaning.'
        if 'syncopation' in normalized_question:
            return 'Syncopation places emphasis on weak beats or off-beats.'
        if 'dotted quarter note' in normalized_question:
            return 'A dotted quarter note lasts 1.5 beats.'
        if '3/4 time' in normalized_question:
            return '3/4 time means 3 beats per measure.'
        if 'triplet' in normalized_question:
            return 'A triplet fits 3 notes into the space of 2.'
        if 'accelerando' in normalized_question:
            return 'Accelerando means gradually getting faster.'
        if 'bass' in normalized_question and 'strings' in normalized_question:
            return 'A standard bass has 4 strings.'
        if 'violin' in normalized_question and 'family' in normalized_question:
            return 'The violin belongs to the string family.'
        if 'piano' in normalized_question and 'keys' in normalized_question:
            return 'A standard piano has 88 keys.'
        if 'pedals' in normalized_question:
            return 'The sustain, soft, and una corda pedals are found on a piano.'
        if 'highest-pitched string instrument' in normalized_question:
            return 'The violin is the highest-pitched standard orchestral string instrument.'
        if 'sharp' in normalized_question:
            return 'A sharp raises a note by a semitone.'
        if 'flat' in normalized_question:
            return 'A flat lowers a note by a semitone.'
        if 'natural' in normalized_question:
            return 'A natural cancels a sharp or flat.'
        if 'double sharp' in normalized_question:
            return 'A double sharp raises a note by two semitones.'
        if 'staccato' in normalized_question:
            return 'Staccato means short and detached.'
        if 'cadence' in normalized_question:
            return 'A cadence is a harmonic resolution.'
        if 'perfect authentic cadence' in normalized_question:
            return 'A perfect authentic cadence moves from V to I.'
        if 'plagal cadence' in normalized_question:
            return 'A plagal cadence moves from IV to I.'
        if 'deceptive cadence' in normalized_question:
            return 'A deceptive cadence moves from V to vi.'
        if 'counterpoint' in normalized_question:
            return 'Counterpoint combines independent melodies.'
        if 'century did the modern guitar originate' in normalized_question:
            return 'The modern guitar developed in the 19th century.'
        if 'father of modern classical guitar' in normalized_question:
            return 'Andrés Segovia is often called the father of modern classical guitar.'
        if 'period did j.s. bach compose' in normalized_question:
            return 'J.S. Bach is a Baroque composer.'
        if 'the four seasons' in normalized_question:
            return 'The Four Seasons was composed by Vivaldi.'
        if 'sgt. pepper' in normalized_question:
            return 'The Beatles released Sgt. Pepper’s Lonely Hearts Club Band.'
        if '1st string' in normalized_question or 'high e' in normalized_question:
            return 'The high E string is tuned to E4.'
        if 'standard guitar tuning' in normalized_question:
            return 'Standard guitar tuning from low to high is E-A-D-G-B-E.'
        if 'ukulele' in normalized_question:
            return 'A standard ukulele is tuned G-C-E-A.'
        if 'frets' in normalized_question:
            return 'A typical electric guitar has around 21–24 frets.'
        if 'drop d' in normalized_question:
            return 'Drop D tuning lowers the low E string to D.'
        if 'andante' in normalized_question:
            return 'Andante is a moderate walking tempo, around 76–108 BPM.'
        if 'presto' in normalized_question:
            return 'Presto means very fast, around 168–200 BPM.'
        if 'adagio' in normalized_question:
            return 'Adagio is a slow tempo, around 66–76 BPM.'
        if 'allegro' in normalized_question:
            return 'Allegro means fast and lively.'
        if 'lento' in normalized_question:
            return 'Lento means slow.'
        if 'dark and sad' in normalized_question:
            return 'Aeolian is the natural minor mode.'
        if 'bright and happy' in normalized_question:
            return 'Ionian is the major mode.'
        if '3rd degree of the major scale' in normalized_question:
            return 'Phrygian is the third mode of the major scale.'
        if 'raised 4th' in normalized_question:
            return 'Lydian has a raised 4th scale degree.'
        if 'flat 7th' in normalized_question:
            return 'Mixolydian has a flat 7th.'
        if 'g major chord' in normalized_question:
            return 'A G major chord is G-B-D.'
        if 'am chord' in normalized_question:
            return 'An A minor chord is A-C-E.'
        if 'd major chord' in normalized_question:
            return 'A D major chord is D-F#-A.'
        if 'e minor chord' in normalized_question:
            return 'An E minor chord is E-G-B.'
        if 'power chord' in normalized_question:
            return 'A power chord uses the root and fifth only.'
        if 'difference between major and minor chords' in normalized_question:
            return 'The 3rd interval determines whether a chord is major or minor.'
        if 'sus2' in normalized_question:
            return 'A sus2 chord replaces the 3rd with the 2nd.'
        if 'sus4' in normalized_question:
            return 'A sus4 chord replaces the 3rd with the 4th.'
        if 'seventh chord' in normalized_question:
            return 'A standard seventh chord has 4 notes.'
        if 'inversion' in normalized_question:
            return 'An inversion puts a note other than the root in the bass.'
        if 'capo' in normalized_question:
            return 'A capo clamps across the fretboard to raise the key.'
        if 'vibrato' in normalized_question:
            return 'Vibrato is a slight, expressive pitch variation.'
        if 'harmonics' in normalized_question:
            return 'Harmonics are overtones produced by lightly touching a string.'
        if 'tremolo' in normalized_question:
            return 'Tremolo is rapid repetition of a note.'
        if 'riff' in normalized_question:
            return 'A riff is a short repeated musical phrase.'
        if 'major scale' in normalized_question and 'notes are in a standard major scale' in normalized_question:
            return 'A standard major scale has 7 notes.'
        if 'pentatonic scale' in normalized_question:
            return 'A pentatonic scale has 5 notes.'
        if '5th note of the c major scale' in normalized_question:
            return 'The 5th note of C major is G.'
        if '3rd note of the d major scale' in normalized_question:
            return 'The 3rd note of D major is F#.'
        if 'relative minor of g major' in normalized_question:
            return 'The relative minor of G major is E minor.'
        if 'relative major of a minor' in normalized_question:
            return 'The relative major of A minor is C major.'
        if 'blues scale' in normalized_question:
            return 'A blues scale is a minor pentatonic scale with a flat 5th.'
        if 'e minor pentatonic scale' in normalized_question:
            return 'E minor pentatonic is E-G-A-B-D.'
        if 'legato' in normalized_question:
            return 'Legato means smooth and connected.'
        if 'pizzicato' in normalized_question:
            return 'Pizzicato means plucking the strings.'
        if 'glissando' in normalized_question:
            return 'A glissando is a rapid slide between notes.'
        if 'arpeggio' in normalized_question:
            return 'An arpeggio plays chord notes one after another.'
        if 'what interval is c to g' in normalized_question:
            return 'C to G is a perfect 5th.'
        if 'what interval is c to f' in normalized_question:
            return 'C to F is a perfect 4th.'
        if 'what interval is c to e' in normalized_question:
            return 'C to E is a major 3rd.'
        if 'what interval is a to c' in normalized_question:
            return 'A to C is a minor 3rd.'
        if 'what interval is c to b' in normalized_question:
            return 'C to B is a major 7th.'
        return f'The correct answer is {_format_answer(correct_answer)}.'

    return f'The correct answer is {_format_answer(correct_answer)}.'
