import React from 'react';
import { NetworkResults } from '@/types/reports';
import { MultiSelectDropdown } from '../MultiSelectDropdown';
import { NetworkFilterState } from './types';

interface Props {
  data: NetworkResults;
  filters: NetworkFilterState;
  onFiltersChange: (filters: NetworkFilterState) => void;
  totalRequests: number;
  totalProducts: number;
}

export const NetworkFilterControls: React.FC<Props> = ({
  data,
  filters,
  onFiltersChange,
  totalRequests,
  totalProducts,
}) => {
  // Extract unique values from data
  const requestTypes = [...new Set(
    data.results.flatMap(result => 
      result.requests.map(req => req.type)
    )
  )];

  const products = [data.product];

  const networks = [...new Set(
    data.results.map(result => result.context.network)
  )];

  const cpus = [...new Set(
    data.results.map(result => result.context.cpu)
  )];

  const userStates = [...new Set(
    data.results.map(result => result.context.user_state)
  )];

  const urls = [...new Set(
    data.results.flatMap(result => 
      result.requests.map(req => req.url)
    )
  )].slice(0, 20); // Limit to first 20 URLs for UI performance

  // Prepare dropdown options
  const requestTypeOptions = requestTypes.map((type) => ({
    value: type,
    label: type.toUpperCase(),
  }));

  const productOptions = products.map((product) => ({
    value: product,
    label: product,
  }));

  const networkOptions = networks.map((network) => ({
    value: network,
    label: network.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const cpuOptions = cpus.map((cpu) => ({
    value: cpu,
    label: cpu.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const userStateOptions = userStates.map((userState) => ({
    value: userState,
    label: userState.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const urlOptions = urls.map((url) => {
    const urlObj = new URL(url);
    const shortUrl = `${urlObj.hostname}${urlObj.pathname}`;
    return {
      value: url,
      label: shortUrl.length > 40 ? `${shortUrl.substring(0, 37)}...` : shortUrl,
    };
  });

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
  ];

  const viewTypeOptions = [
    { value: 'latency', label: 'Latency (ms)' },
    { value: 'size', label: 'Size (bytes)' },
    { value: 'status', label: 'Status Codes' },
  ];

  return (
    <div className="bg-white p-6 shadow-lg border border-gray-200 h-full">
      <div className="flex flex-col mb-6">
        <h2 className="text-xl font-bold text-gray-800">Network Analysis Controls</h2>
        <div className="text-sm text-gray-500">
          Showing {totalRequests} {totalRequests === 1 ? 'request' : 'requests'} • {totalProducts}{' '}
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

        {/* View Type Selector */}
        <MultiSelectDropdown
          label="View Type"
          options={viewTypeOptions}
          selectedValues={[filters.viewType]}
          onChange={(values) =>
            onFiltersChange({ ...filters, viewType: values[0] as 'latency' | 'size' | 'status' })
          }
          placeholder="Select view type..."
          multiSelect={false}
        />

        {/* Request Type Selector */}
        <MultiSelectDropdown
          label="Request Types"
          options={requestTypeOptions}
          selectedValues={filters.selectedRequestTypes}
          onChange={(values) => onFiltersChange({ ...filters, selectedRequestTypes: values as any })}
          placeholder="Select request types..."
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

        {/* URL Selector for Comparison */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-gray-800">Performance Comparison</h4>
            <p className="text-xs text-gray-600">Select specific requests to compare</p>
          </div>
          <MultiSelectDropdown
            label="Select URLs to Compare"
            options={urlOptions}
            selectedValues={filters.selectedUrls}
            onChange={(values) => onFiltersChange({ ...filters, selectedUrls: values })}
            placeholder="Choose requests for comparison..."
          />
        </div>
      </div>
    </div>
  );
};
