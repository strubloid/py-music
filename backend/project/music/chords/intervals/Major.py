from .Interval import Interval

class MajorInterval(Interval):

    # Initializing major interval
    def __init__(self):
        self.loadInterval()

    # Loading major scale interval
    def loadInterval(self):
        self.interval = ["", "m", "m", "", "", "m", "dim"]
    
   