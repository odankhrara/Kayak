import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import ComparisonModal from './ComparisonModal';

export interface ComparisonItem {
  id: string;
  type: 'flight' | 'hotel' | 'car';
  name: string;
  provider: string;
  price: number;
  rating?: number;
  details: Record<string, any>;
}

interface ComparisonBarProps {
  items: ComparisonItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  maxItems?: number;
}

export default function ComparisonBar({ items, onRemove, onClear, maxItems = 3 }: ComparisonBarProps) {
  const [showModal, setShowModal] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Selected Items */}
            <div className="flex items-center gap-4 flex-1 overflow-x-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Scale className="w-5 h-5 text-blue-600" />
                <span>Compare ({items.length}/{maxItems})</span>
              </div>
              
              <div className="flex items-center gap-2">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.provider} · ${item.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={onClear}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              
              <Button
                onClick={() => setShowModal(true)}
                disabled={items.length < 2}
              >
                Compare {items.length >= 2 ? `(${items.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showModal && (
          <ComparisonModal
            items={items}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

