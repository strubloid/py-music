from dotenv import load_dotenv
from classes.scales.ScalesBase import ScalesBase
from langchain_openai import ChatOpenAI

## Loading environment variables
load_dotenv()

## Setting up the language model
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

## Creating an instance of the base scale class
base_scale = ScalesBase(llm)

# notes = base_scale.getNotes("G")
# print(f"A major scale notes: {base_scale.getNotes("A")}")
# print(f"B major scale notes: {base_scale.getNotes("B")}")
# print(f"C major scale notes: {base_scale.getNotes("C")}")
# print(f"D major scale notes: {base_scale.getNotes("D")}")
# print(f"E major scale notes: {base_scale.getNotes("E")}")
# print(f"F major scale notes: {base_scale.getNotes("F")}")

notesOfG = base_scale.setNote("G")
print(f"Gmajor notes: {notesOfG.getNotes()}")

print(f"G major scale notes: {notesOfG.getChords()}")


notesOfA = base_scale.setNote("A")
print(f"A major notes: {notesOfA.getNotes()}")

print(f"A major scale notes: {notesOfA.getChords()}")