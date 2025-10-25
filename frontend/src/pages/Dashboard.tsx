import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import ResourceTable from '../components/ResourceTable';
import FilterPanel from '../components/FilterPanel';
import { FilterOptions } from '../types';

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    limit: 50,
    offset: 0,
  });

  // Fetch resource summary
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['resourceSummary', filters.accountIds],
    queryFn: () => apiService.resources.getSummary(filters),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch resources
  const { data: resourcesData, isLoading: resourcesLoading, error: resourcesError, refetch: refetchResources } = useQuery({
    queryKey: ['resources', filters],
    queryFn: () => apiService.resources.getAll(filters),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleRefresh = async () => {
    await refetchResources();
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const summary = summaryData?.data;
  const resources = resourcesData?.data;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          AWS Resource Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={resourcesLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Resources
              </Typography>
              <Typography variant="h4">
                {summaryLoading ? <CircularProgress size={24} /> : summary?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Resource Types
              </Typography>
              <Typography variant="h4">
                {summaryLoading ? <CircularProgress size={24} /> : summary?.byType?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Regions
              </Typography>
              <Typography variant="h4">
                {summaryLoading ? <CircularProgress size={24} /> : summary?.byRegion?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Status Types
              </Typography>
              <Typography variant="h4">
                {summaryLoading ? <CircularProgress size={24} /> : summary?.byStatus?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resource Type Breakdown */}
      {summary?.byType && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resources by Type
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {summary.byType.map((item) => (
              <Chip
                key={item.resourceType}
                label={`${item.resourceType}: ${item.count}`}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Status Breakdown */}
      {summary?.byStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resources by Status
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {summary.byStatus.map((item) => (
              <Chip
                key={item.status}
                label={`${item.status}: ${item.count}`}
                color={item.status === 'running' || item.status === 'active' ? 'success' : 'default'}
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Error Display */}
      {(summaryError || resourcesError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {summaryError?.message || resourcesError?.message || 'Failed to load data'}
        </Alert>
      )}

      {/* Filters and Resources */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            summary={summary}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          <ResourceTable
            resources={resources?.resources || []}
            pagination={resources?.pagination}
            loading={resourcesLoading}
            onFiltersChange={handleFiltersChange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
