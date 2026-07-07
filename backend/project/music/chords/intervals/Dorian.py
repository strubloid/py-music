from .Interval import Interval

class DorianInterval(Interval):
    def __init__(self):
        self.loadInterval()

    def loadInterval(self):
        # Dorian: W H W W W H W (starts on 2nd degree of major)
        # Triads: min, min, maj, maj, min, dim, maj
        self.interval = ["m", "m", "", "m", "", "dim", ""]
        self.mode = "dorian"
        self.name = "Dorian"
        self.description = "Minor scale with a raised 6th. Soulful, jazzy, slightly bright despite being minor. Popular in funk and jazz."
        self.degrees = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
        self.interval_semitones = [0, 2, 3, 5, 7, 9, 10]
