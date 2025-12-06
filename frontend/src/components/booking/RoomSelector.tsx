import { useState, useEffect } from 'react';
import { Minus, Plus, Users, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

export interface RoomType {
  roomId: number;
  roomType: string;
  pricePerNight: number;
  maxGuests: number;
  availableRooms: number;
  description?: string;
}

export interface RoomSelection {
  roomType: string;
  quantity: number;
  pricePerNight: number;
  maxGuests: number;
}

interface RoomSelectorProps {
  rooms: RoomType[];
  totalGuests: number;
  nights: number;
  onSelectionChange: (selections: RoomSelection[], isValid: boolean, totalPrice: number) => void;
  initialSelections?: RoomSelection[];
}

const RoomSelector = ({ 
  rooms, 
  totalGuests, 
  nights, 
  onSelectionChange,
  initialSelections 
}: RoomSelectorProps) => {
  const [selections, setSelections] = useState<Record<string, number>>(() => {
    // Initialize from props or default to 0
    const initial: Record<string, number> = {};
    rooms.forEach(room => {
      const existing = initialSelections?.find(s => s.roomType === room.roomType);
      initial[room.roomType] = existing?.quantity || 0;
    });
    return initial;
  });

  // Calculate totals
  const calculateTotals = () => {
    let totalCapacity = 0;
    let totalPrice = 0;
    let totalRooms = 0;

    rooms.forEach(room => {
      const qty = selections[room.roomType] || 0;
      totalCapacity += qty * room.maxGuests;
      totalPrice += qty * room.pricePerNight * nights;
      totalRooms += qty;
    });

    return { totalCapacity, totalPrice, totalRooms };
  };

  const { totalCapacity, totalPrice, totalRooms } = calculateTotals();
  const isValid = totalCapacity >= totalGuests && totalRooms > 0;
  const capacityShortfall = totalGuests - totalCapacity;

  // Notify parent of changes
  useEffect(() => {
    const roomSelections: RoomSelection[] = rooms
      .filter(room => (selections[room.roomType] || 0) > 0)
      .map(room => ({
        roomType: room.roomType,
        quantity: selections[room.roomType],
        pricePerNight: room.pricePerNight,
        maxGuests: room.maxGuests,
      }));

    onSelectionChange(roomSelections, isValid, totalPrice);
  }, [selections, isValid, totalPrice]);

  const handleQuantityChange = (roomType: string, delta: number) => {
    const room = rooms.find(r => r.roomType === roomType);
    if (!room) return;

    const currentQty = selections[roomType] || 0;
    const newQty = Math.max(0, Math.min(room.availableRooms, currentQty + delta));

    setSelections(prev => ({
      ...prev,
      [roomType]: newQty,
    }));
  };

  // Auto-suggest optimal combination
  const autoSelectRooms = () => {
    // Sort rooms by price efficiency (price per guest capacity)
    const sortedRooms = [...rooms]
      .filter(r => r.availableRooms > 0)
      .sort((a, b) => (a.pricePerNight / a.maxGuests) - (b.pricePerNight / b.maxGuests));

    const newSelections: Record<string, number> = {};
    rooms.forEach(r => newSelections[r.roomType] = 0);

    let remainingGuests = totalGuests;

    for (const room of sortedRooms) {
      if (remainingGuests <= 0) break;
      
      const roomsNeeded = Math.ceil(remainingGuests / room.maxGuests);
      const roomsToBook = Math.min(roomsNeeded, room.availableRooms);
      
      newSelections[room.roomType] = roomsToBook;
      remainingGuests -= roomsToBook * room.maxGuests;
    }

    setSelections(newSelections);
  };

  // Clear all selections
  const clearSelections = () => {
    const cleared: Record<string, number> = {};
    rooms.forEach(r => cleared[r.roomType] = 0);
    setSelections(cleared);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Select Your Rooms</h3>
          <p className="text-sm text-slate-500">
            {totalGuests} guest{totalGuests > 1 ? 's' : ''} • {nights} night{nights > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={autoSelectRooms}
            title="Auto-select best value rooms"
          >
            ✨ Best Value
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearSelections}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Room List */}
      <div className="space-y-3">
        {rooms.map(room => {
          const qty = selections[room.roomType] || 0;
          const roomTotal = qty * room.pricePerNight * nights;
          const isAvailable = room.availableRooms > 0;

          return (
            <div
              key={room.roomType}
              className={`border rounded-xl p-4 transition-all ${
                qty > 0 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-700'
              } ${!isAvailable ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold capitalize">{room.roomType} Room</h4>
                    {qty > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Max {room.maxGuests} guest{room.maxGuests > 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span>{room.availableRooms} available</span>
                  </div>
                  {room.description && (
                    <p className="text-xs text-slate-400 mt-1">{room.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {formatCurrency(room.pricePerNight)}/night
                    </p>
                    {qty > 0 && (
                      <p className="font-semibold text-blue-600">
                        {formatCurrency(roomTotal)}
                      </p>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(room.roomType, -1)}
                      disabled={qty === 0}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        qty === 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{qty}</span>
                    <button
                      onClick={() => handleQuantityChange(room.roomType, 1)}
                      disabled={qty >= room.availableRooms || !isAvailable}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        qty >= room.availableRooms || !isAvailable
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <Card className={`p-4 ${isValid ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className={`font-semibold ${isValid ? 'text-green-700' : 'text-amber-700'}`}>
                {isValid ? 'Selection Valid' : 'Select More Rooms'}
              </span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>
                <span className="font-medium">{totalRooms}</span> room{totalRooms !== 1 ? 's' : ''} selected
              </p>
              <p>
                Total capacity: <span className="font-medium">{totalCapacity}</span> guest{totalCapacity !== 1 ? 's' : ''}
                {!isValid && capacityShortfall > 0 && (
                  <span className="text-amber-600 ml-1">
                    (need {capacityShortfall} more)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total for {nights} night{nights > 1 ? 's' : ''}</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalPrice)}
            </p>
            {totalRooms > 0 && (
              <p className="text-xs text-slate-500">
                {formatCurrency(totalPrice / nights)}/night
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RoomSelector;

