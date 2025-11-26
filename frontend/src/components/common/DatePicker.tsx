import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, value, onChange, min, max, required, disabled, placeholder }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="date"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              input pr-10
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
            `}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;

