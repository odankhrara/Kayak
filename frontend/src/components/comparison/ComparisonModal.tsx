import { motion } from 'framer-motion';
import { X, Star, CheckCircle, XCircle, Plane, Building2, Car } from 'lucide-react';
import { ComparisonItem } from './ComparisonBar';
import { formatCurrency } from '../../utils/formatters';

interface ComparisonModalProps {
  items: ComparisonItem[];
  onClose: () => void;
}

export default function ComparisonModal({ items, onClose }: ComparisonModalProps) {
  // Get the lowest price item for highlighting
  const lowestPriceId = items.reduce((lowest, item) => 
    item.price < (items.find(i => i.id === lowest)?.price || Infinity) ? item.id : lowest
  , items[0]?.id);

  // Get the highest rated item for highlighting
  const highestRatedId = items.reduce((highest, item) => 
    (item.rating || 0) > (items.find(i => i.id === highest)?.rating || 0) ? item.id : highest
  , items[0]?.id);

  // Get all unique detail keys
  const allKeys = new Set<string>();
  items.forEach(item => {
    Object.keys(item.details).forEach(key => allKeys.add(key));
  });

  // Icon based on type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'hotel': return <Building2 className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      default: return null;
    }
  };

  // Format detail value for display
  const formatDetailValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('price') || key.toLowerCase().includes('rate')) {
        return formatCurrency(value);
      }
      if (key.toLowerCase().includes('duration')) {
        const hours = Math.floor(value / 60);
        const mins = value % 60;
        return `${hours}h ${mins}m`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  // Format key for display
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-display font-bold">Compare Options</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Side-by-side comparison of {items.length} {items[0]?.type}s
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-slate-50 dark:bg-slate-800 rounded-tl-lg w-48">
                  Feature
                </th>
                {items.map((item, index) => (
                  <th key={item.id} className={`text-center p-4 bg-slate-50 dark:bg-slate-800 min-w-[200px] ${index === items.length - 1 ? 'rounded-tr-lg' : ''}`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        {getTypeIcon(item.type)}
                      </div>
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-sm text-slate-500">{item.provider}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price Row */}
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-4 font-medium bg-slate-50/50 dark:bg-slate-800/50">
                  💰 Price
                </td>
                {items.map((item) => (
                  <td key={item.id} className={`p-4 text-center ${item.id === lowestPriceId ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-bold ${item.id === lowestPriceId ? 'text-green-600' : ''}`}>
                        {formatCurrency(item.price)}
                      </span>
                      {item.id === lowestPriceId && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full mt-1">
                          Best Price
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Rating Row */}
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-4 font-medium bg-slate-50/50 dark:bg-slate-800/50">
                  ⭐ Rating
                </td>
                {items.map((item) => (
                  <td key={item.id} className={`p-4 text-center ${item.id === highestRatedId && item.rating ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                    {item.rating ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <Star className={`w-5 h-5 ${item.id === highestRatedId ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-400 fill-yellow-400'}`} />
                          <span className={`text-xl font-bold ${item.id === highestRatedId ? 'text-yellow-600' : ''}`}>
                            {item.rating.toFixed(1)}
                          </span>
                        </div>
                        {item.id === highestRatedId && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full mt-1">
                            Top Rated
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Provider Row */}
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-4 font-medium bg-slate-50/50 dark:bg-slate-800/50">
                  🏢 Provider
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium">
                      {item.provider}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Dynamic Detail Rows */}
              {Array.from(allKeys).map((key) => (
                <tr key={key} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-4 font-medium bg-slate-50/50 dark:bg-slate-800/50">
                    {formatKey(key)}
                  </td>
                  {items.map((item) => {
                    const value = item.details[key];
                    const isBoolean = typeof value === 'boolean';
                    
                    return (
                      <td key={item.id} className="p-4 text-center">
                        {isBoolean ? (
                          value ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                          )
                        ) : (
                          <span>{formatDetailValue(key, value)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 text-center">
            💡 Tip: The best price is highlighted in green, and the top-rated option is highlighted in yellow.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

