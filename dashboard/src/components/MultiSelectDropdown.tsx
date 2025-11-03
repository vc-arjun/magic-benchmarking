import React, { useState } from 'react';

interface DropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean; // New prop to control single vs multi-select
}

export const MultiSelectDropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  multiSelect = true, // Default to multi-select for backward compatibility
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const allValues = options.map((opt) => opt.value);
  const isAllSelected = selectedValues.length === allValues.length;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allValues);
    }
  };

  const handleToggleOption = (value: string) => {
    if (multiSelect) {
      // Multi-select behavior
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((v) => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    } else {
      // Single-select behavior
      onChange([value]);
      setIsOpen(false); // Close dropdown after selection in single-select mode
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;

    if (!multiSelect) {
      // Single-select mode: always show the selected option
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }

    // Multi-select mode
    if (isAllSelected) return `All ${label}`;
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left shadow-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <span className="block truncate text-gray-900 text-xs">{getDisplayText()}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {/* Select All Option - only show in multi-select mode */}
            {multiSelect && (
              <div className="border-b border-gray-100">
                <label className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-xs font-medium text-gray-900">All {label}</span>
                </label>
              </div>
            )}

            {/* Individual Options */}
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type={multiSelect ? 'checkbox' : 'radio'}
                  name={multiSelect ? undefined : `${label}-radio`}
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggleOption(option.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-xs text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
