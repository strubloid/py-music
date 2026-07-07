from .Interval import Interval

class IonianInterval(Interval):
    def __init__(self):
        self.loadInterval()

    def loadInterval(self):
        # Ionian = Major scale: W W H W W W H
        # Triads: maj, min, min, maj, maj, min, dim
        self.interval = ["", "m", "m", "", "", "m", "dim"]
        self.mode = "ionian"
        self.name = "Ionian (Major)"
        self.description = "The major scale. Bright, happy, resolved. Root, major 3rd, perfect 5th."
        self.degrees = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
        self.interval_semitones = [0, 2, 4, 5, 7, 9, 11]
