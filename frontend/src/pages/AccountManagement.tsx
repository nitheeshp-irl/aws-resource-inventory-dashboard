import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { AccountConfig } from '../types';

const AccountManagement: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountConfig | null>(null);
  const [formData, setFormData] = useState<Partial<AccountConfig & { accessKeyId?: string; secretAccessKey?: string }>>({
    name: '',
    accountId: '',
    roleArn: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    isActive: true,
  });
  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accountsData, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiService.accounts.getAll(),
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: (account: Partial<AccountConfig>) => apiService.accounts.create(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: ({ id, account }: { id: string; account: Partial<AccountConfig> }) =>
      apiService.accounts.update(id, account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiService.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => apiService.accounts.testConnection(id),
  });

  const accounts = accountsData?.data || [];

  const resetForm = () => {
    setFormData({
      name: '',
      accountId: '',
      roleArn: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      isActive: true,
    });
    setEditingAccount(null);
  };

  const handleOpenDialog = (account?: AccountConfig) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        accountId: account.accountId,
        roleArn: account.roleArn || '',
        accessKeyId: '',
        secretAccessKey: '',
        region: account.region,
        isActive: account.isActive,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, account: formData });
    } else {
      createAccountMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteAccountMutation.mutate(id);
    }
  };

  const handleTestConnection = (id: string) => {
    testConnectionMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load accounts: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Account Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Account
        </Button>
      </Box>

      {accounts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No AWS accounts configured
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first AWS account to start monitoring resources.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {accounts.map((account) => (
            <Grid item xs={12} md={6} lg={4} key={account.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {account.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                        {account.accountId}
                      </Typography>
                    </Box>
                    <Chip
                      label={account.isActive ? 'Active' : 'Inactive'}
                      color={account.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Region: {account.region}
                    </Typography>
                    {account.roleArn && (
                      <Typography variant="body2" color="text.secondary">
                        Role: {account.roleArn.split('/').pop()}
                      </Typography>
                    )}
                    {account.lastSync && (
                      <Typography variant="body2" color="text.secondary">
                        Last sync: {new Date(account.lastSync).toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={() => handleTestConnection(account.id)}
                      disabled={testConnectionMutation.isPending}
                    >
                      Test
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(account)}
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(account.id)}
                      disabled={deleteAccountMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {testConnectionMutation.isPending && testConnectionMutation.variables === account.id && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Testing connection...</Typography>
                    </Box>
                  )}

                  {testConnectionMutation.isSuccess && testConnectionMutation.variables === account.id && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="success.main">
                        Connection successful
                      </Typography>
                    </Box>
                  )}

                  {testConnectionMutation.isError && testConnectionMutation.variables === account.id && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" fontSize="small" />
                      <Typography variant="caption" color="error.main">
                        Connection failed
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Account Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Edit Account' : 'Add New Account'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Account Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="AWS Account ID"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              margin="normal"
              required
              placeholder="123456789012"
            />
            <TextField
              fullWidth
              label="IAM Role ARN (Optional)"
              value={formData.roleArn}
              onChange={(e) => setFormData({ ...formData, roleArn: e.target.value })}
              margin="normal"
              placeholder="arn:aws:iam::123456789012:role/CrossAccountRole"
            />
            <TextField
              fullWidth
              label="Access Key ID (Optional)"
              value={formData.accessKeyId || ''}
              onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
              margin="normal"
              placeholder="AKIAIOSFODNN7EXAMPLE"
            />
            <TextField
              fullWidth
              label="Secret Access Key (Optional)"
              type="password"
              value={formData.secretAccessKey || ''}
              onChange={(e) => setFormData({ ...formData, secretAccessKey: e.target.value })}
              margin="normal"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Region</InputLabel>
              <Select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                label="Region"
              >
                <MenuItem value="us-east-1">US East (N. Virginia)</MenuItem>
                <MenuItem value="us-east-2">US East (Ohio)</MenuItem>
                <MenuItem value="us-west-1">US West (N. California)</MenuItem>
                <MenuItem value="us-west-2">US West (Oregon)</MenuItem>
                <MenuItem value="eu-west-1">Europe (Ireland)</MenuItem>
                <MenuItem value="eu-west-2">Europe (London)</MenuItem>
                <MenuItem value="eu-central-1">Europe (Frankfurt)</MenuItem>
                <MenuItem value="ap-southeast-1">Asia Pacific (Singapore)</MenuItem>
                <MenuItem value="ap-southeast-2">Asia Pacific (Sydney)</MenuItem>
                <MenuItem value="ap-northeast-1">Asia Pacific (Tokyo)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.accountId || createAccountMutation.isPending || updateAccountMutation.isPending}
          >
            {editingAccount ? 'Update' : 'Add'} Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountManagement;
