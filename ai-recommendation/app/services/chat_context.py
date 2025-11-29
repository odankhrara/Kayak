"""Conversation context manager for maintaining chat state"""
from typing import Dict, Any, Optional
from app.schemas.chat_schemas import ParsedTripRequest
import uuid


class ChatContextManager:
    """Manages conversation context for chat sessions"""
    
    def __init__(self):
        # In-memory storage: session_id -> context
        # In production, use Redis or database
        self.contexts: Dict[str, Dict[str, Any]] = {}
    
    def get_context(self, session_id: str) -> Dict[str, Any]:
        """Get conversation context for a session"""
        if session_id not in self.contexts:
            self.contexts[session_id] = {
                'origin': None,
                'destination': None,
                'city': None,
                'budget': None,
                'travelers': None,
                'dates': None,
                'constraints': [],
                'conversation_history': []
            }
        return self.contexts[session_id]
    
    def update_context(self, session_id: str, parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Update context with new parsed information"""
        context = self.get_context(session_id)
        
        # Merge new information with existing context
        if parsed.get('origin'):
            context['origin'] = parsed['origin']
        if parsed.get('destination'):
            context['destination'] = parsed['destination']
        if parsed.get('city'):
            context['city'] = parsed['city']
        if parsed.get('budget'):
            context['budget'] = parsed['budget']
        if parsed.get('travelers'):
            context['travelers'] = parsed['travelers']
        if parsed.get('dates'):
            context['dates'] = parsed['dates']
        if parsed.get('constraints'):
            # Add new constraints without duplicates
            for constraint in parsed['constraints']:
                if constraint not in context['constraints']:
                    context['constraints'].append(constraint)
        
        return context
    
    def merge_with_context(self, session_id: str, parsed: ParsedTripRequest) -> ParsedTripRequest:
        """Merge parsed request with existing context"""
        context = self.get_context(session_id)
        
        # Create merged request
        merged = ParsedTripRequest(
            origin=parsed.origin or context.get('origin'),
            destination=parsed.destination or context.get('destination'),
            city=parsed.city or context.get('city'),
            budget=parsed.budget or context.get('budget'),
            travelers=parsed.travelers or context.get('travelers'),
            dates=parsed.dates or context.get('dates'),
            constraints=list(set((parsed.constraints or []) + context.get('constraints', []))),
            confidence=parsed.confidence,
            raw_message=parsed.raw_message
        )
        
        # Update context
        self.update_context(session_id, merged.model_dump())
        
        return merged
    
    def clear_context(self, session_id: str):
        """Clear conversation context"""
        if session_id in self.contexts:
            del self.contexts[session_id]
    
    def get_missing_fields(self, session_id: str) -> list:
        """Get list of missing required fields"""
        context = self.get_context(session_id)
        missing = []
        
        if not context.get('origin'):
            missing.append('origin')
        if not context.get('destination') and not context.get('city'):
            missing.append('destination')
        if not context.get('budget'):
            missing.append('budget')
        
        return missing


# Global context manager instance
context_manager = ChatContextManager()

