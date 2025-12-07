import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { aiRecommendationsApi } from '../api/aiRecommendationsApi';
import { toast } from 'react-toastify';
import './AIAssistantPage.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  bundles?: any[];
  parsedRequest?: any;
}

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to WebSocket for real-time updates
      const websocket = aiRecommendationsApi.connectChatWebSocket(user.id || 1);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.message) {
          addMessage(data.message, 'assistant', data.bundles, data.parsed_request);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWs(websocket);

      // Add welcome message
      if (messages.length === 0) {
        addMessage(
          "Hi! I'm your AI travel assistant. I can help you find great deals. Try asking me something like: 'Weekend in Tokyo under $900 for two, SFO departure, pet-friendly, near transit.'",
          'assistant'
        );
      }

      return () => {
        websocket.close();
      };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (text: string, sender: 'user' | 'assistant', bundles?: any[], parsedRequest?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      bundles,
      parsedRequest,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, 'user');
    setLoading(true);

    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send via WebSocket
        ws.send(JSON.stringify({
          message: userMessage,
          user_id: user?.id || 1,
        }));
      } else {
        // Fallback to HTTP
        const response = await aiRecommendationsApi.sendChatMessage(
          userMessage,
          user?.id || 1
        );
        addMessage(response.message, 'assistant', response.bundles, response.parsed_request);
      }
    } catch (error: any) {
      addMessage(
        'Sorry, I encountered an error. Please try again.',
        'assistant'
      );
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBundleClick = async (bundle: any) => {
    if (!isAuthenticated) {
      toast.error('Please login to book this bundle');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Fetch full bundle details
      let fullBundle = bundle;
      if (!Array.isArray(bundle.flights) || bundle.flights.length === 0 || 
          !Array.isArray(bundle.hotels) || bundle.hotels.length === 0) {
        console.log(`Fetching full bundle details for ID: ${bundle.id}`);
        fullBundle = await aiRecommendationsApi.getBundle(bundle.id);
        console.log('Full bundle fetched:', fullBundle);
      }

      // Navigate to checkout with flight or hotel
      if (fullBundle.flights && Array.isArray(fullBundle.flights) && fullBundle.flights.length > 0) {
        const flight = fullBundle.flights[0];
        navigate('/booking/checkout', {
          state: {
            bookingType: 'flight',
            entity: {
              flightId: flight.id || flight.flight_id,
              airlineName: flight.airline,
              flightNumber: flight.flight_number,
              departureAirport: flight.origin,
              arrivalAirport: flight.destination,
              departureDate: flight.departure_time ? new Date(flight.departure_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              arrivalDate: flight.arrival_time ? new Date(flight.arrival_time).toISOString().split('T')[0] : new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
              pricePerTicket: flight.discounted_price || flight.original_price || 0,
              ...flight,
            },
            quantity: 1,
            checkInDate: flight.departure_time ? new Date(flight.departure_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            checkOutDate: flight.arrival_time ? new Date(flight.arrival_time).toISOString().split('T')[0] : new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
            bundle: fullBundle,
          },
        });
      } else if (fullBundle.hotels && Array.isArray(fullBundle.hotels) && fullBundle.hotels.length > 0) {
        const hotel = fullBundle.hotels[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkOut = new Date(tomorrow);
        checkOut.setDate(checkOut.getDate() + 2);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        const pricePerNight = hotel.discounted_price_per_night || hotel.original_price_per_night || 0;

        navigate('/booking/checkout', {
          state: {
            bookingType: 'hotel',
            entity: {
              hotelId: hotel.id,
              hotelName: hotel.name,
              name: hotel.name,
              city: hotel.city,
              state: hotel.state || hotel.country || '',
              country: hotel.country,
              address: hotel.address,
              rooms: [{
                roomType: 'standard',
                pricePerNight: pricePerNight,
                available: true
              }],
              pricePerNight: pricePerNight,
              ...hotel,
            },
            quantity: 1,
            checkInDate: formatDate(tomorrow),
            checkOutDate: formatDate(checkOut),
            bundle: fullBundle,
          },
        });
      } else {
        console.warn('Bundle has no bookable items:', fullBundle);
        toast.error('This bundle does not contain bookable items. Please try another bundle.');
      }
    } catch (error) {
      console.error('Error handling bundle click:', error);
      toast.error('Failed to load bundle details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="ai-assistant-page">
        <div className="ai-assistant-login-prompt">
          <h2>Please log in to use the AI Assistant</h2>
          <p>You need to be logged in to get personalized travel recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-assistant-page">
      <div className="ai-assistant-container">
        <div className="ai-assistant-header-page">
          <h1>AI Travel Assistant</h1>
          <p>Ask me anything about travel deals and I'll help you find the perfect trip!</p>
        </div>

        <div className="ai-assistant-messages-page">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message-page ai-message-${message.sender}`}
            >
              <div className="ai-message-content-page">
                <p>{message.text}</p>
                {message.parsedRequest && (
                  <div className="ai-parsed-info">
                    <p className="ai-parsed-title">I understood:</p>
                    <ul>
                      {message.parsedRequest.origin && (
                        <li>Origin: {message.parsedRequest.origin}</li>
                      )}
                      {message.parsedRequest.destination && (
                        <li>Destination: {message.parsedRequest.destination}</li>
                      )}
                      {message.parsedRequest.budget && (
                        <li>Budget: ${message.parsedRequest.budget}</li>
                      )}
                      {message.parsedRequest.travelers && (
                        <li>Travelers: {message.parsedRequest.travelers}</li>
                      )}
                      {message.parsedRequest.constraints && message.parsedRequest.constraints.length > 0 && (
                        <li>Preferences: {message.parsedRequest.constraints.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                )}
                {message.bundles && message.bundles.length > 0 && (
                  <div className="ai-bundles-page">
                    <p className="ai-bundles-title-page">Recommended Bundles:</p>
                    {message.bundles.map((bundle: any) => (
                      <div 
                        key={bundle.id} 
                        className="ai-bundle-card-page" 
                        onClick={() => handleBundleClick(bundle)}
                        style={{ cursor: 'pointer' }}
                        title="Click to book this bundle"
                      >
                        <h4>{bundle.name}</h4>
                        <p>{bundle.description}</p>
                        <div className="ai-bundle-price-page">
                          <span className="ai-price-page">${(bundle.total_price || bundle.totalPrice || 0).toFixed(2)}</span>
                          {(bundle.savings > 0 || bundle.savings === 0) && (
                            <span className="ai-savings-page">
                              Save ${(bundle.savings || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {bundle.tags && bundle.tags.length > 0 && (
                          <div className="ai-bundle-tags-page">
                            {bundle.tags.map((tag: string, idx: number) => (
                              <span key={idx} className="ai-tag-page">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                          Click to book →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="ai-message-time-page">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
          {loading && (
            <div className="ai-message-page ai-message-assistant">
              <div className="ai-message-content-page">
                <div className="ai-loading-page">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-assistant-input-page">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about travel deals... (e.g., 'Weekend in Tokyo under $900 for two, SFO departure')"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="ai-send-button-page"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;

