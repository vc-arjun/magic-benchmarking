import React from 'react';
import { NetworkResults } from '@/types/reports';
import { MultiSelectDropdown } from '../MultiSelectDropdown';
import { NetworkFilterState } from './types';
import { formatNetworkContextLabel } from './utils';

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
  const requestTypes = [
    ...new Set(data.results.flatMap((result) => result.requests.map((req) => req.type))),
  ];

  const products = [data.product];

  const networks = [...new Set(data.results.map((result) => result.context.network))];

  const cpus = [...new Set(data.results.map((result) => result.context.cpu))];

  const userStates = [...new Set(data.results.map((result) => result.context.user_state))];

  // Get available execution contexts
  const availableContexts = [
    ...new Set(data.results.map(result => 
      `${result.context.network}_${result.context.cpu}_${result.context.user_state}`
    ))
  ];

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

  const contextOptions = availableContexts.map((contextKey) => ({
    value: contextKey,
    label: contextKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    fullLabel: formatNetworkContextLabel(contextKey),
  }));


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
        {/* Execution Context Selector */}
        <div className="border-b border-gray-200 pb-4 mb-2">
          <MultiSelectDropdown
            label="Execution Context"
            options={contextOptions}
            selectedValues={[filters.selectedContext]}
            onChange={(values) => onFiltersChange({ ...filters, selectedContext: values[0] || '' })}
            placeholder="Select execution context..."
            multiSelect={false}
          />
          <div className="mt-2 text-xs text-gray-600">
            <strong>Current:</strong> {contextOptions.find(c => c.value === filters.selectedContext)?.fullLabel || 'None selected'}
          </div>
        </div>

        {/* Request Type Selector */}
        <MultiSelectDropdown
          label="Request Types"
          options={requestTypeOptions}
          selectedValues={filters.selectedRequestTypes}
          onChange={(values) =>
            onFiltersChange({ ...filters, selectedRequestTypes: values as any })
          }
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

      </div>
    </div>
  );
};
