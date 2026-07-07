from .Interval import Interval

class AeolianInterval(Interval):
    def __init__(self):
        self.loadInterval()

    def loadInterval(self):
        # Aeolian = Natural Minor: W H W W H W W (starts on 6th degree of major)
        # Triads: min, dim, maj, min, min, maj, maj
        self.interval = ["m", "dim", "", "m", "m", "", ""]
        self.mode = "aeolian"
        self.name = "Aeolian (Natural Minor)"
        self.description = "The natural minor scale. Sad, dark, introspective. Found in most minor-key music."
        self.degrees = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
        self.interval_semitones = [0, 2, 3, 5, 7, 8, 10]
