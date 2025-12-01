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
        # Only update if new value is provided (not None/empty)
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
        
        # Debug: Print context after update
        print(f"[Context] Updated context for {session_id}: origin={context.get('origin')}, destination={context.get('destination')}, budget={context.get('budget')}")
        
        return context
    
    def merge_with_context(self, session_id: str, parsed: ParsedTripRequest) -> ParsedTripRequest:
        """Merge parsed request with existing context"""
        context = self.get_context(session_id)
        
        # Create merged request - use parsed value if provided, otherwise use context
        # This ensures context is preserved when user provides only partial info (like just budget)
        merged = ParsedTripRequest(
            origin=parsed.origin if parsed.origin else context.get('origin'),
            destination=parsed.destination if parsed.destination else context.get('destination'),
            city=parsed.city if parsed.city else context.get('city'),
            budget=parsed.budget if parsed.budget else context.get('budget'),
            travelers=parsed.travelers if parsed.travelers else context.get('travelers'),
            dates=parsed.dates if parsed.dates else context.get('dates'),
            constraints=list(set((parsed.constraints or []) + context.get('constraints', []))),
            confidence=parsed.confidence,
            raw_message=parsed.raw_message
        )
        
        # Update context with merged values (preserves all fields)
        self.update_context(session_id, merged.model_dump())
        
        return merged
    
    def clear_context(self, session_id: str):
        """Clear conversation context"""
        if session_id in self.contexts:
            del self.contexts[session_id]
    
    def get_missing_fields(self, session_id: str) -> list:
        """
        Get list of missing required fields
        Returns at most 1 missing field to ask (max 1 clarifying question)
        """
        context = self.get_context(session_id)
        missing = []
        
        # Priority order: origin, destination, budget
        # Only return the first missing field (max 1 clarifying question)
        if not context.get('origin'):
            missing.append('origin')
            return missing  # Return immediately - max 1 question
        
        # Don't require destination if it's flexible (anywhere, warm region, etc.)
        destination = context.get('destination') or context.get('city')
        if not destination or (destination not in ['warm region', 'tropical region', 'anywhere'] and len(destination) < 3):
            # Only require destination if it's not a flexible one
            if destination not in ['warm region', 'tropical region', 'anywhere']:
                missing.append('destination')
                return missing  # Return immediately - max 1 question
        
        if not context.get('budget'):
            missing.append('budget')
            return missing  # Return immediately - max 1 question
        
        return missing


# Global context manager instance
context_manager = ChatContextManager()

