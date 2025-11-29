"""Chat Pydantic schemas for request/response"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    """User chat message schema"""
    message: str = Field(..., description="User's natural language message")
    user_id: Optional[int] = Field(None, description="User ID for conversation context")
    session_id: Optional[str] = Field(None, description="Session ID for conversation tracking")


class ParsedTripRequest(BaseModel):
    """Parsed trip request from NLU"""
    origin: Optional[str] = Field(None, description="Origin airport code or city")
    destination: Optional[str] = Field(None, description="Destination city or region")
    city: Optional[str] = Field(None, description="Destination city")
    dates: Optional[Dict[str, Any]] = Field(None, description="Date range or time window")
    budget: Optional[float] = Field(None, gt=0, description="Total budget in USD")
    travelers: Optional[int] = Field(None, ge=1, description="Number of travelers")
    constraints: List[str] = Field(default_factory=list, description="Constraints and preferences")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Parsing confidence score")
    raw_message: str = Field(..., description="Original user message")


class ChatResponse(BaseModel):
    """AI chat response schema"""
    message: str = Field(..., description="AI response message")
    parsed_request: Optional[ParsedTripRequest] = Field(None, description="Parsed trip request")
    bundles: Optional[List[Dict[str, Any]]] = Field(None, description="Recommended bundles")
    requires_clarification: bool = Field(False, description="Whether clarification is needed")
    clarification_questions: List[str] = Field(default_factory=list, description="Questions to ask user")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None
        }
    }


class ChatContext(BaseModel):
    """Conversation context schema"""
    user_id: int
    session_id: str
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    current_request: Optional[ParsedTripRequest] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

