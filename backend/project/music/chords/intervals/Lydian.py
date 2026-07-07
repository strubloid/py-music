from .Interval import Interval

class LydianInterval(Interval):
    def __init__(self):
        self.loadInterval()

    def loadInterval(self):
        # Lydian: W W W H W W H (starts on 4th degree of major)
        # Triads: maj, maj, min, dim, maj, min, min
        self.interval = ["", "", "m", "dim", "", "m", "m"]
        self.mode = "lydian"
        self.name = "Lydian"
        self.description = "Major scale with a raised 4th. Dreamy, floating, ethereal. Brighter than major."
        self.degrees = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
        self.interval_semitones = [0, 2, 4, 6, 7, 9, 11]
