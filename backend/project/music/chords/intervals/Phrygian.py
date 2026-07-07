from .Interval import Interval

class PhrygianInterval(Interval):
    def __init__(self):
        self.loadInterval()

    def loadInterval(self):
        # Phrygian: H W W W H W W (starts on 3rd degree of major)
        # Triads: min, maj, maj, min, dim, maj, min
        self.interval = ["m", "", "m", "", "dim", "", "m"]
        self.mode = "phrygian"
        self.name = "Phrygian"
        self.description = "Minor scale with a flattened 2nd. Spanish, exotic, dark. Common in metal and flamenco."
        self.degrees = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
        self.interval_semitones = [0, 1, 3, 5, 7, 8, 10]
