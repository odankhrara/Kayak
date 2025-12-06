import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hotelService, HotelLocation } from '../../services/hotel.service';

interface LocationAutocompleteProps {
  value: string;
  onChange: (city: string, state: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search city...',
  label = 'Location',
  required = false,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [locations, setLocations] = useState<HotelLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch locations on mount and when input changes
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const data = await hotelService.getLocations(inputValue || undefined);
        setLocations(data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounce);
  }, [inputValue]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location: HotelLocation) => {
    setInputValue(location.label);
    onChange(location.city, location.state);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < locations.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && locations[selectedIndex]) {
          handleSelect(locations[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange('', '');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-slate-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-600 
                     bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
          autoComplete="off"
        />

        {inputValue && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg 
                       border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto"
          >
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                <Search className="h-4 w-4 animate-pulse" />
                Searching...
              </div>
            ) : locations.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">
                {inputValue ? 'No locations found' : 'Type to search cities...'}
              </div>
            ) : (
              <ul className="py-1">
                {locations.map((location, index) => (
                  <li
                    key={`${location.city}-${location.state}`}
                    onClick={() => handleSelect(location)}
                    className={`px-4 py-3 cursor-pointer flex items-center justify-between
                               transition-colors duration-150
                               ${index === selectedIndex 
                                 ? 'bg-blue-50 dark:bg-blue-900/30' 
                                 : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className={`h-4 w-4 ${index === selectedIndex ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {location.city}
                        </span>
                        <span className="text-slate-500">, {location.state}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                      {location.hotelCount} hotel{location.hotelCount !== 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

