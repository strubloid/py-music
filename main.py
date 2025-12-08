from dotenv import load_dotenv
from classes.scales.ScalesBase import ScalesBase
from langchain_openai import ChatOpenAI

## Loading environment variables
load_dotenv()

## Setting up the language model
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

## Creating an instance of the base scale class
base_scale = ScalesBase(llm)

notes = base_scale.getNotes("G")
print(f"G major scale notes: {notes}")