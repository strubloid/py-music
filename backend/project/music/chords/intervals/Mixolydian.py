from .Interval import Interval

class MixolydianInterval(Interval):
    def __init__(self):
        self.loadInterval()

    def loadInterval(self):
        # Mixolydian: W W H W W H W (starts on 5th degree of major)
        # Triads: maj, min, dim, maj, min, min, maj
        self.interval = ["", "m", "dim", "", "m", "m", ""]
        self.mode = "mixolydian"
        self.name = "Mixolydian"
        self.description = "Major scale with a flattened 7th. Rock, blues, dominant feel. Less resolved than major."
        self.degrees = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
        self.interval_semitones = [0, 2, 4, 5, 7, 9, 10]
