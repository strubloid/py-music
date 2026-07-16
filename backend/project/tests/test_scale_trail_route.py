import os
import unittest

os.environ['PYMUSIC_DISABLE_BACKGROUND_INIT'] = '1'

from backend.project.api.app import (
    _build_scale_route,
    _public_scale_path_fragment,
    _select_tier1_fragment,
)


class ScaleTrailRouteTest(unittest.TestCase):
    def setUp(self):
        self.positions = _build_scale_route('C', 'ionian', 2, 17)
        self.assertGreater(len(self.positions), 20)

    def test_seeded_route_is_deterministic_and_has_six_or_seven_playable_moves(self):
        for move_count in (6, 7):
            first = [
                _select_tier1_fragment(self.positions, 'C', 'ionian', index, 481516, 'nearest-position')
                for index in range(move_count)
            ]
            second = [
                _select_tier1_fragment(self.positions, 'C', 'ionian', index, 481516, 'nearest-position')
                for index in range(move_count)
            ]
            self.assertEqual(first, second)
            self.assertEqual(len(first), move_count)
            for fragment in first:
                assert fragment is not None
                self.assertEqual(len(fragment['candidates']), 3)
                self.assertEqual(sum(bool(candidate['isCorrect']) for candidate in fragment['candidates']), 1)
                self.assertIn(fragment['degreeClue'], {'1', '2', '3', '4', '5', '6', '7'})

    def test_route_modifiers_change_the_physical_movement_when_playable(self):
        same_string = _select_tier1_fragment(self.positions, 'C', 'ionian', 1, 992, 'same-string')
        alternate = _select_tier1_fragment(self.positions, 'C', 'ionian', 1, 992, 'alternate-strings')
        assert same_string is not None
        assert alternate is not None
        self.assertEqual(same_string['anchor']['stringIndex'], same_string['gap']['stringIndex'])
        self.assertNotEqual(alternate['anchor']['stringIndex'], alternate['gap']['stringIndex'])

    def test_public_fragment_never_exposes_correctness_or_gap(self):
        private = _select_tier1_fragment(self.positions, 'C', 'ionian', 0, 12, 'ascending')
        assert private is not None
        public = _public_scale_path_fragment(private)
        self.assertNotIn('gap', public)
        self.assertTrue(all('isCorrect' not in candidate for candidate in public['candidates']))


if __name__ == '__main__':
    unittest.main()
