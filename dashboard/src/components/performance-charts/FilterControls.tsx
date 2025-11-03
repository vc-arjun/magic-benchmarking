import React from 'react';
import { BenchmarkResults } from '@/types/reports';
import { MultiSelectDropdown } from '../MultiSelectDropdown';
import { FilterState } from './types';

interface Props {
  data: BenchmarkResults;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalMetrics: number;
  totalProducts: number;
}

export const FilterControls: React.FC<Props> = ({
  data,
  filters,
  onFiltersChange,
  totalMetrics,
  totalProducts,
}) => {
  // Prepare dropdown options
  const metricOptions = Object.entries(data.metrics_metadata).map(([key, meta]) => ({
    value: key,
    label: meta.name,
  }));

  const productOptions = data.products.map((product) => ({
    value: product.product,
    label: product.product,
  }));

  const networkOptions = Object.keys(data.execution_matrix.network).map((network) => ({
    value: network,
    label: network.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const cpuOptions = Object.keys(data.execution_matrix.cpu).map((cpu) => ({
    value: cpu,
    label: cpu.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const userStateOptions = Object.keys(data.execution_matrix.user_state).map((userState) => ({
    value: userState,
    label: userState.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
  ];

  return (
    <div className="bg-white p-6 shadow-lg border border-gray-200 h-full">
      <div className="flex flex-col  mb-6">
        <h2 className="text-xl font-bold text-gray-800">Visualization Controls</h2>
        <div className="text-sm text-gray-500">
          Showing {totalMetrics} {totalMetrics === 1 ? 'metric' : 'metrics'} • {totalProducts}{' '}
          {totalProducts === 1 ? 'product' : 'products'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Chart Type Selector */}
        <MultiSelectDropdown
          label="Chart Type"
          options={chartTypeOptions}
          selectedValues={[filters.chartType]}
          onChange={(values) =>
            onFiltersChange({ ...filters, chartType: values[0] as 'bar' | 'line' })
          }
          placeholder="Select chart type..."
          multiSelect={false}
        />

        {/* Metric Selector */}
        <MultiSelectDropdown
          label="Metrics"
          options={metricOptions}
          selectedValues={filters.selectedMetrics}
          onChange={(values) => onFiltersChange({ ...filters, selectedMetrics: values })}
          placeholder="Select metrics..."
        />

        {/* Product Selector */}
        <MultiSelectDropdown
          label="Products"
          options={productOptions}
          selectedValues={filters.selectedProducts}
          onChange={(values) => onFiltersChange({ ...filters, selectedProducts: values })}
          placeholder="Select products..."
        />

        {/* Network Selector */}
        <MultiSelectDropdown
          label="Network Conditions"
          options={networkOptions}
          selectedValues={filters.selectedNetworks}
          onChange={(values) => onFiltersChange({ ...filters, selectedNetworks: values })}
          placeholder="Select networks..."
        />

        {/* CPU Selector */}
        <MultiSelectDropdown
          label="CPU Throttling"
          options={cpuOptions}
          selectedValues={filters.selectedCpus}
          onChange={(values) => onFiltersChange({ ...filters, selectedCpus: values })}
          placeholder="Select CPU settings..."
        />

        {/* User State Selector */}
        <MultiSelectDropdown
          label="User State"
          options={userStateOptions}
          selectedValues={filters.selectedUserStates}
          onChange={(values) => onFiltersChange({ ...filters, selectedUserStates: values })}
          placeholder="Select user states..."
        />
      </div>
    </div>
  );
};
