from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class ToolExecution(BaseModel):
    name: str
    input: Optional[Dict[str, Any]]
    output: Optional[Dict[str, Any]]
    duration_ms: int


class AgentQuery(BaseModel):
    query: str


class AgentResponse(BaseModel):
    query: str
    result: str
    tools: List[ToolExecution]
    total_duration_ms: int
    created_at: datetime
