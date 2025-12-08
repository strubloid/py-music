from pydantic import BaseModel

class BasicAIResponse(BaseModel):
    topic: str
    summary: str
    sources: list[str]
    tools_used: list[str]