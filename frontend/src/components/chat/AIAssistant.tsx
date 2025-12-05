import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { aiRecommendationsApi } from '../../api/aiRecommendationsApi';
import './AIAssistant.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  bundles?: any[];
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Generate session ID when component mounts
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      // Connect to WebSocket for real-time updates
      const websocket = aiRecommendationsApi.connectChatWebSocket(user.id || 1);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          if (data.message) {
            addMessage(data.message, 'assistant', data.bundles, data.parsed_request);
            setLoading(false);
          } else if (data.error) {
            addMessage(data.error, 'assistant');
            setLoading(false);
          } else {
            // If no message field, still reset loading
            setLoading(false);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          addMessage('Sorry, I encountered an error processing the response.', 'assistant');
          setLoading(false);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setLoading(false);
        // Fallback to HTTP on WebSocket error
        if (messages.length > 0 && messages[messages.length - 1].sender === 'user') {
          // Last message was from user, try HTTP fallback
          const lastUserMessage = messages[messages.length - 1].text;
          aiRecommendationsApi.sendChatMessage(
            lastUserMessage,
            user?.id || 1,
            sessionId
          ).then(response => {
            addMessage(response.message, 'assistant', response.bundles);
          }).catch(err => {
            addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
          });
        }
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
  }, [isOpen, isAuthenticated, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (text: string, sender: 'user' | 'assistant', bundles?: any[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      bundles,
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
          session_id: sessionId,
        }));
      } else {
        // Fallback to HTTP
        const response = await aiRecommendationsApi.sendChatMessage(
          userMessage,
          user?.id || 1,
          sessionId
        );
        addMessage(response.message, 'assistant', response.bundles);
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

  // Show button to all users, but require login for chat
  const handleButtonClick = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Button - Always visible */}
      <button
        className="ai-assistant-button"
        onClick={handleButtonClick}
        aria-label="Open AI Assistant"
        title={isAuthenticated ? "AI Travel Assistant" : "Login to use AI Assistant"}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel - Only show if authenticated */}
      {isOpen && isAuthenticated && (
        <div className="ai-assistant-panel">
          <div className="ai-assistant-header">
            <h3>AI Travel Assistant</h3>
            <button
              className="ai-assistant-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="ai-assistant-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message ai-message-${message.sender}`}
              >
                <div className="ai-message-content">
                  <p>{message.text}</p>
                  {message.bundles && message.bundles.length > 0 && (
                    <div className="ai-bundles">
                      <p className="ai-bundles-title">Recommended Bundles:</p>
                      {message.bundles.map((bundle: any) => {
                        const handleBundleClick = async () => {
                          try {
                            setLoading(true);
                            // If bundle doesn't have flights/hotels arrays, fetch full bundle details
                            let fullBundle = bundle;
                            // Check if we need to fetch - if no flights AND no hotels, or if bundle has an id but missing detailed data
                            const needsFetch = bundle.id && (
                              (!bundle.flights || !Array.isArray(bundle.flights) || bundle.flights.length === 0) && 
                              (!bundle.hotels || !Array.isArray(bundle.hotels) || bundle.hotels.length === 0)
                            );
                            
                            if (needsFetch) {
                              // Fetch full bundle details from API
                              console.log('Fetching full bundle details for ID:', bundle.id);
                              fullBundle = await aiRecommendationsApi.getBundle(bundle.id);
                              console.log('Full bundle fetched:', fullBundle);
                            }

                            // Navigate to booking with bundle data
                            // If bundle has flights, navigate to first flight booking
                            // Otherwise, navigate to first hotel booking
                            if (fullBundle.flights && Array.isArray(fullBundle.flights) && fullBundle.flights.length > 0) {
                              const flight = fullBundle.flights[0];
                              
                              // Map flight fields to what booking page expects
                              const flightEntity = {
                                // Booking page expects these fields
                                flightId: flight.id,
                                airlineName: flight.airline,
                                flightNumber: flight.flight_number,
                                departureAirport: flight.origin,
                                arrivalAirport: flight.destination,
                                pricePerTicket: flight.discounted_price || flight.original_price || 0,
                                ticketPrice: flight.discounted_price || flight.original_price || 0,
                                // Also include original fields for compatibility
                                ...flight,
                                // Map additional fields
                                origin: flight.origin,
                                destination: flight.destination,
                                departureTime: flight.departure_time,
                                arrivalTime: flight.arrival_time,
                              };
                              
                              // Calculate default dates from flight times if available
                              let checkInDate = '';
                              let checkOutDate = '';
                              if (flight.departure_time) {
                                const depDate = new Date(flight.departure_time);
                                checkInDate = depDate.toISOString().split('T')[0];
                                if (flight.arrival_time) {
                                  const arrDate = new Date(flight.arrival_time);
                                  checkOutDate = arrDate.toISOString().split('T')[0];
                                } else {
                                  checkOutDate = checkInDate; // Same day if no arrival time
                                }
                              } else {
                                // Default to tomorrow if no dates
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                checkInDate = tomorrow.toISOString().split('T')[0];
                                checkOutDate = checkInDate;
                              }
                              
                              console.log('Navigating with flight data:', {
                                flightId: flightEntity.flightId,
                                airlineName: flightEntity.airlineName,
                                route: `${flightEntity.departureAirport} → ${flightEntity.arrivalAirport}`,
                                pricePerTicket: flightEntity.pricePerTicket
                              });
                              
                              navigate('/booking/checkout', {
                                state: {
                                  bookingType: 'flight',
                                  entity: flightEntity,
                                  quantity: 1,
                                  checkInDate: checkInDate,
                                  checkOutDate: checkOutDate,
                                  bundle: fullBundle, // Include full bundle for reference
                                },
                              });
                          } else if (fullBundle.hotels && Array.isArray(fullBundle.hotels) && fullBundle.hotels.length > 0) {
                            const hotel = fullBundle.hotels[0];
                            
                            // Calculate default dates (check-in tomorrow, check-out in 2 days)
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const checkOut = new Date(tomorrow);
                            checkOut.setDate(checkOut.getDate() + 2);
                            
                            const formatDate = (date: Date) => date.toISOString().split('T')[0];
                            
                            // Get price - try multiple field names from hotel deal response
                            const pricePerNight = hotel.discounted_price_per_night || 
                                                  hotel.price_per_night || 
                                                  hotel.discounted_price ||
                                                  hotel.price ||
                                                  0;
                            
                            console.log('Navigating with hotel data:', {
                              hotelId: hotel.id,
                              name: hotel.name,
                              pricePerNight,
                              city: hotel.city
                            });
                            
                            navigate('/booking/checkout', {
                              state: {
                                bookingType: 'hotel',
                                entity: {
                                  hotelId: hotel.id,
                                  hotelName: hotel.name, // Booking page expects hotelName
                                  name: hotel.name, // Keep for compatibility
                                  city: hotel.city,
                                  state: hotel.state || hotel.country || '',
                                  country: hotel.country,
                                  address: hotel.address,
                                  // Create rooms array as expected by booking page (line 59)
                                  rooms: [{
                                    roomType: 'standard',
                                    pricePerNight: pricePerNight,
                                    available: true
                                  }],
                                  // Also set pricePerNight directly for fallback
                                  pricePerNight: pricePerNight,
                                },
                                quantity: 1,
                                checkInDate: formatDate(tomorrow),
                                checkOutDate: formatDate(checkOut),
                                bundle: fullBundle, // Include full bundle for reference
                              },
                            });
                            } else {
                              // Fallback: navigate to bundle details or show message
                              console.warn('Bundle has no bookable items:', fullBundle);
                              toast.error('This bundle does not contain bookable items. Please try another bundle.');
                            }
                          } catch (error: any) {
                            console.error('Error handling bundle click:', error);
                            toast.error(error.response?.data?.detail || error.message || 'Failed to load bundle details');
                          } finally {
                            setLoading(false);
                          }
                        };

                        return (
                          <div 
                            key={bundle.id} 
                            className="ai-bundle-card"
                            onClick={handleBundleClick}
                            style={{ cursor: 'pointer' }}
                            title="Click to book this bundle"
                          >
                          <h4>{bundle.name}</h4>
                          <p>{bundle.description}</p>
                          <div className="ai-bundle-price">
                              <span className="ai-price">${(bundle.total_price || bundle.totalPrice || 0).toFixed(2)}</span>
                              {(bundle.savings > 0 || bundle.savings === 0) && (
                              <span className="ai-savings">
                                  Save ${(bundle.savings || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                          {bundle.tags && bundle.tags.length > 0 && (
                            <div className="ai-bundle-tags">
                              {bundle.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="ai-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                              Click to book →
                            </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="ai-message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            {loading && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-content">
                  <div className="ai-loading">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-assistant-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about travel deals..."
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="ai-send-button"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

