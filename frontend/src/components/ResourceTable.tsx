import React from 'react';
import {
  Paper,
  Chip,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { BaseResource, FilterOptions, Pagination } from '../types';

interface ResourceTableProps {
  resources: BaseResource[];
  pagination?: Pagination;
  loading: boolean;
  onFiltersChange: (filters: FilterOptions) => void;
}

const ResourceTable: React.FC<ResourceTableProps> = ({
  resources,
  pagination,
  loading,
  onFiltersChange,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.id}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'resourceType',
      headerName: 'Type',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value.toUpperCase()}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const getStatusColor = (status: string) => {
          switch (status.toLowerCase()) {
            case 'running':
            case 'active':
            case 'available':
              return 'success';
            case 'stopped':
            case 'stopping':
              return 'warning';
            case 'terminated':
            case 'failed':
              return 'error';
            default:
              return 'default';
          }
        };

        return (
          <Chip
            label={params.value}
            size="small"
            color={getStatusColor(params.value)}
            variant="filled"
          />
        );
      },
    },
    {
      field: 'region',
      headerName: 'Region',
      width: 120,
    },
    {
      field: 'accountId',
      headerName: 'Account',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const tags = params.value || {};
        const tagEntries = Object.entries(tags);
        
        if (tagEntries.length === 0) {
          return <Typography variant="caption" color="text.secondary">No tags</Typography>;
        }

        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tagEntries.slice(0, 2).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                size="small"
                variant="outlined"
              />
            ))}
            {tagEntries.length > 2 && (
              <Chip
                label={`+${tagEntries.length - 2} more`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'lastUpdated',
      headerName: 'Last Updated',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption">
          {new Date(params.value).toLocaleString()}
        </Typography>
      ),
    },
  ];

  const handlePageChange = (page: number) => {
    onFiltersChange({
      offset: page * (pagination?.limit || 50),
    });
  };

  const handlePageSizeChange = (pageSize: number) => {
    onFiltersChange({
      limit: pageSize,
      offset: 0,
    });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading resources...
        </Typography>
      </Paper>
    );
  }

  if (resources.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No resources found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your filters or add AWS accounts to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={resources}
        columns={columns}
        pageSizeOptions={[25, 50, 100]}
        paginationModel={{
          page: pagination ? Math.floor(pagination.offset / pagination.limit) : 0,
          pageSize: pagination?.limit || 50,
        }}
        onPaginationModelChange={(model) => {
          handlePageChange(model.page);
          if (model.pageSize !== pagination?.limit) {
            handlePageSizeChange(model.pageSize);
          }
        }}
        rowCount={pagination?.total || 0}
        paginationMode="server"
        loading={loading}
        disableRowSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f0f0f0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: '2px solid #e0e0e0',
          },
        }}
      />
    </Paper>
  );
};

export default ResourceTable;
