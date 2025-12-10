from dotenv import load_dotenv
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



