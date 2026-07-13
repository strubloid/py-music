import unittest

from backend.project.music.chord_inventory import (
    CHORD_QUALITIES,
    PITCH_CLASSES,
    build_chord_definition,
    build_chord_pair_challenge,
    build_scheduled_note_events,
)


class ChordInventoryTest(unittest.TestCase):
    def test_required_qualities_are_enabled_and_cover_every_root(self):
        required = {
            'major', 'minor', 'diminished', 'augmented', 'sus2', 'sus4',
            'dominant7', 'major7', 'minor7', 'minorMajor7',
            'halfDiminished7', 'diminished7', 'major6', 'minor6', 'power5',
        }
        self.assertTrue(required.issubset(CHORD_QUALITIES))
        enabled = [quality for quality, data in CHORD_QUALITIES.items() if data['enabledForEarTraining']]
        self.assertEqual(len(PITCH_CLASSES) * len(enabled), sum(
            1 for root in PITCH_CLASSES for quality in enabled
            if build_chord_definition(root, quality)['enabledForEarTraining']
        ))

    def test_inversions_preserve_pitch_classes(self):
        for quality in CHORD_QUALITIES:
            chord = build_chord_definition('C', quality)
            expected = {interval % 12 for interval in chord['intervals']}
            for inversion in chord['inversions']:
                self.assertEqual({interval % 12 for interval in inversion}, expected)

    def test_pair_generator_supports_required_examples_and_relationships(self):
        examples = {
            ('C', 'major', 'E', 'minor'),
            ('C', 'major', 'D', 'major'),
            ('G', 'major', 'A', 'minor'),
        }
        generated = set()
        relationships = set()
        for seed in range(600):
            pair = build_chord_pair_challenge(seed=seed, difficulty=seed % 10 + 1)
            generated.add((pair['first']['root'], pair['first']['quality'], pair['second']['root'], pair['second']['quality']))
            relationships.add(pair['relationship'])
            self.assertNotEqual(pair['first']['id'], pair['second']['id'])
        self.assertTrue(examples.issubset(generated))
        self.assertTrue({
            'same-root-different-quality', 'different-root-same-quality',
            'relative-major-minor', 'diatonic-function', 'inversion',
        }.issubset(relationships))

    def test_harmonic_events_share_start_time_and_slow_mode_preserves_pitch(self):
        chord = build_chord_definition('C', 'major7')
        normal = build_scheduled_note_events(chord, octave=3)
        slow = build_scheduled_note_events(chord, octave=3, timing_scale=1.5)
        self.assertEqual({event['time'] for event in normal}, {0})
        self.assertEqual([event['note'] for event in normal], [event['note'] for event in slow])
        self.assertTrue(all(event['duration'] > normal[index]['duration'] for index, event in enumerate(slow)))


if __name__ == '__main__':
    unittest.main()
