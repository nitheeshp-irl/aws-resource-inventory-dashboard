import React from 'react';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  Chip,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import { FilterOptions, ResourceSummary } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  summary?: ResourceSummary;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, summary }) => {
  const resourceTypes = [
    'ec2',
    'rds',
    's3',
    'ecs',
    'eks',
    'vpc',
  ];

  const regions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-central-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
  ];

  const statuses = [
    'running',
    'stopped',
    'active',
    'inactive',
    'available',
    'pending',
    'terminated',
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      offset: 0, // Reset pagination when filters change
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      limit: filters.limit,
      offset: 0,
    });
  };

  const hasActiveFilters = !!(
    filters.accountIds?.length ||
    filters.regions?.length ||
    filters.resourceTypes?.length ||
    filters.statuses?.length ||
    filters.search
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        {hasActiveFilters && (
          <Button size="small" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Search */}
      <TextField
        fullWidth
        label="Search"
        placeholder="Search by name, ID, or ARN..."
        value={filters.search || ''}
        onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
        size="small"
        sx={{ mb: 2 }}
      />

      {/* Resource Types */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Resource Types</InputLabel>
        <Select
          multiple
          value={filters.resourceTypes || []}
          onChange={(e) => handleFilterChange('resourceTypes', e.target.value)}
          input={<OutlinedInput label="Resource Types" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {resourceTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type.toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Regions */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Regions</InputLabel>
        <Select
          multiple
          value={filters.regions || []}
          onChange={(e) => handleFilterChange('regions', e.target.value)}
          input={<OutlinedInput label="Regions" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {regions.map((region) => (
            <MenuItem key={region} value={region}>
              {region}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Statuses */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          multiple
          value={filters.statuses || []}
          onChange={(e) => handleFilterChange('statuses', e.target.value)}
          input={<OutlinedInput label="Status" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {statuses.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Results per page */}
      <FormControl fullWidth size="small">
        <InputLabel>Results per page</InputLabel>
        <Select
          value={filters.limit || 50}
          onChange={(e) => handleFilterChange('limit', e.target.value)}
          label="Results per page"
        >
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={200}>200</MenuItem>
        </Select>
      </FormControl>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {filters.resourceTypes?.map((type) => (
              <Chip
                key={type}
                label={`Type: ${type}`}
                size="small"
                onDelete={() => {
                  const newTypes = filters.resourceTypes?.filter(t => t !== type);
                  handleFilterChange('resourceTypes', newTypes?.length ? newTypes : undefined);
                }}
              />
            ))}
            {filters.regions?.map((region) => (
              <Chip
                key={region}
                label={`Region: ${region}`}
                size="small"
                onDelete={() => {
                  const newRegions = filters.regions?.filter(r => r !== region);
                  handleFilterChange('regions', newRegions?.length ? newRegions : undefined);
                }}
              />
            ))}
            {filters.statuses?.map((status) => (
              <Chip
                key={status}
                label={`Status: ${status}`}
                size="small"
                onDelete={() => {
                  const newStatuses = filters.statuses?.filter(s => s !== status);
                  handleFilterChange('statuses', newStatuses?.length ? newStatuses : undefined);
                }}
              />
            ))}
            {filters.search && (
              <Chip
                label={`Search: ${filters.search}`}
                size="small"
                onDelete={() => handleFilterChange('search', undefined)}
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default FilterPanel;
