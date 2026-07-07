from .Interval import Interval

class MinorInterval(Interval):

    # Initializing minor interval
    def __init__(self):
        self.loadInterval()

    # Loading minor scale interval  
    def loadInterval(self):
        self.interval = ["m", "dim", "", "m", "m", "", ""]
        self.interval_semitones = [0, 2, 3, 5, 7, 8, 10]
