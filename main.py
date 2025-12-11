from dotenv import load_dotenv
from src.music.chords.intervals.Major import MajorInterval
from src.llm.ChatGPT import ChatGPT
from src.music.Music import Music

## Loading environment variables
load_dotenv()

## Starting the language model object
llm = ChatGPT()

## Starting Music LLM
music = Music(llm)

## defining a tune
tune = "G"
music.setTune(tune)

## loading the major interval
interval = MajorInterval()
music.setInterval(interval)

## this should get the notes from the tune that we are passing before
notes = music.getNotesFromTune()
print(f"Notes in the {tune} major scale: {notes}")

## getting chords from the notes
chords = music.getChords()
print(f"Chords in the {tune} major scale: {chords}")

## getting borrowed chords from parallel minor scale
borrowedChords = music.getBorrowedChords()
print(f"Borrowed Chords in the {tune} major scale: {borrowedChords}")

## getting seventh chords
sevenths_to_chords = music.getSeventhNoteToIt()
print(f"\nSeventh chords that resolve to:")
for i, (chord, seventh) in enumerate(zip(chords, sevenths_to_chords)):
    print(f"  {chord} <-- {seventh}")


print("\n")

## common progressions
progressions = music.getChordProgressions()
print(f"Progressions: {tune}:")
for name, prog in progressions.items():
    print(f" : {' - '.join(prog)}")



music.getScale(interval)