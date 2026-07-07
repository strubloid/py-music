from .Interval import Interval

class LocrianInterval(Interval):
    def __init__(self):
        self.loadInterval()

    def loadInterval(self):
        # Locrian: H W W W H W W (starts on 7th degree of major)
        # Triads: dim, maj, min, min, maj, maj, min
        self.interval = ["dim", "", "m", "m", "", "", "m"]
        self.mode = "locrian"
        self.name = "Locrian"
        self.description = "Diminished scale with a flattened 5th. Very unstable, dark, tense. Rarely used as a tonal center."
        self.degrees = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
        self.interval_semitones = [0, 1, 3, 5, 6, 8, 10]
