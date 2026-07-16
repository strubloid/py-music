import unittest

from backend.project.music_analysis import analyze_scale_build


class Music21ScaleAnalysisTest(unittest.TestCase):
    def test_exact_d_dorian_formula_is_confirmed_and_spelled(self):
        result = analyze_scale_build('D', 'dorian', [0, 2, 4, 5, 7, 9, 11])
        self.assertEqual(result['analysisEngine'], 'music21')
        self.assertTrue(result['confirmed'])
        self.assertEqual(result['formula'], ['1', '2', 'b3', '4', '5', '6', 'b7'])
        self.assertEqual(result['characteristicDegree'], '6')
        self.assertEqual(result['expectedSpellings'], ['D', 'E', 'F', 'G', 'A', 'B', 'C'])

    def test_music21_candidates_rank_the_actual_formula_over_client_target(self):
        result = analyze_scale_build('C', 'ionian', [0, 2, 3, 5, 7, 9, 10])
        self.assertFalse(result['confirmed'])
        best = result['candidates'][0]
        self.assertEqual((best['root'], best['mode']), ('C', 'dorian'))
        self.assertTrue(best['confirmed'])

    def test_invalid_pitch_class_is_rejected(self):
        with self.assertRaisesRegex(ValueError, '0 through 11'):
            analyze_scale_build('C', 'ionian', [0, 12])


if __name__ == '__main__':
    unittest.main()
