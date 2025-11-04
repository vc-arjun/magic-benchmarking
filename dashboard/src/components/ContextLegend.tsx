import React from 'react';

interface ContextLegendItem {
  index: number;
  contextKey: string;
  contextLabel: string;
}

interface Props {
  items?: ContextLegendItem[];
}

export const ContextLegend: React.FC<Props> = ({ items }) => {
  // Safety check for undefined items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">
        Execution Context Legend (X axis)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((legend) => (
          <div key={legend.contextKey} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
              {legend.index}
            </div>
            <div className="text-xs text-gray-700 leading-tight" style={{ whiteSpace: 'pre-line' }}>
              {legend.contextLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
