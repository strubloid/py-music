from .Interval import Interval

class MajorInterval(Interval):

    # Initializing major interval
    def __init__(self):
        self.loadInterval()

    # Loading major scale interval
    def loadInterval(self):
        self.interval = ["", "m", "m", "", "", "m", "dim"]
        self.interval_semitones = [0, 2, 4, 5, 7, 9, 11]
    
   