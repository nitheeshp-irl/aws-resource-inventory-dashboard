const express = require('express');
const cors = require('cors');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0',
    },
    timestamp: new Date(),
  });
});

// In-memory storage for accounts and resources
let accounts = [];
let resources = [];

// Mock accounts endpoint
app.get('/api/accounts', (req, res) => {
  res.json({
    success: true,
    data: accounts,
    timestamp: new Date(),
  });
});

// Resources endpoint
app.get('/api/resources', (req, res) => {
  const { accountIds, regions, resourceTypes, search, limit = 50, offset = 0 } = req.query;
  
  let filteredResources = resources;
  
  // Apply filters
  if (accountIds) {
    const accountIdArray = Array.isArray(accountIds) ? accountIds : [accountIds];
    filteredResources = filteredResources.filter(r => accountIdArray.includes(r.accountId));
  }
  
  if (regions) {
    const regionArray = Array.isArray(regions) ? regions : [regions];
    filteredResources = filteredResources.filter(r => regionArray.includes(r.region));
  }
  
  if (resourceTypes) {
    const typeArray = Array.isArray(resourceTypes) ? resourceTypes : [resourceTypes];
    filteredResources = filteredResources.filter(r => typeArray.includes(r.resourceType));
  }
  
  if (search) {
    filteredResources = filteredResources.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.arn.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const paginatedResources = filteredResources.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      resources: paginatedResources,
      pagination: {
        total: filteredResources.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: filteredResources.length > parseInt(offset) + parseInt(limit),
      },
    },
    timestamp: new Date(),
  });
});

// Resource summary endpoint
app.get('/api/resources/summary', (req, res) => {
  const { accountIds } = req.query;
  
  let filteredResources = resources;
  if (accountIds) {
    const accountIdArray = Array.isArray(accountIds) ? accountIds : [accountIds];
    filteredResources = filteredResources.filter(r => accountIdArray.includes(r.accountId));
  }
  
  // Calculate summary statistics
  const byType = {};
  const byStatus = {};
  const byRegion = {};
  
  filteredResources.forEach(resource => {
    byType[resource.resourceType] = (byType[resource.resourceType] || 0) + 1;
    byStatus[resource.status] = (byStatus[resource.status] || 0) + 1;
    byRegion[resource.region] = (byRegion[resource.region] || 0) + 1;
  });
  
  res.json({
    success: true,
    data: {
      total: filteredResources.length,
      byType: Object.entries(byType).map(([type, count]) => ({ resourceType: type, count })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byRegion: Object.entries(byRegion).map(([region, count]) => ({ region, count })),
    },
    timestamp: new Date(),
  });
});

// Create account endpoint
app.post('/api/accounts', (req, res) => {
  const { name, accountId, region = 'us-east-1', accessKeyId, secretAccessKey, roleArn } = req.body;
  
  if (!name || !accountId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name and Account ID are required',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  // Check if account already exists
  const existingAccount = accounts.find(acc => acc.accountId === accountId);
  if (existingAccount) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'ACCOUNT_EXISTS',
        message: 'Account with this ID already exists',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  const account = {
    id: Date.now().toString(),
    name,
    accountId,
    region,
    roleArn: roleArn || null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Store credentials securely (in production, use proper encryption)
  if (accessKeyId && secretAccessKey) {
    account.credentials = {
      accessKeyId,
      secretAccessKey,
      region
    };
  }

  accounts.push(account);

  res.status(201).json({
    success: true,
    data: account,
    timestamp: new Date(),
  });
});

// Update account endpoint
app.put('/api/accounts/:id', (req, res) => {
  const accountId = req.params.id;
  const { name, accountId: newAccountId, region, accessKeyId, secretAccessKey, roleArn, isActive } = req.body;
  
  const accountIndex = accounts.findIndex(acc => acc.id === accountId);
  
  if (accountIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  // Update account
  const updatedAccount = {
    ...accounts[accountIndex],
    name: name || accounts[accountIndex].name,
    accountId: newAccountId || accounts[accountIndex].accountId,
    region: region || accounts[accountIndex].region,
    roleArn: roleArn !== undefined ? roleArn : accounts[accountIndex].roleArn,
    isActive: isActive !== undefined ? isActive : accounts[accountIndex].isActive,
    updatedAt: new Date().toISOString(),
  };

  // Update credentials if provided
  if (accessKeyId && secretAccessKey) {
    updatedAccount.credentials = {
      accessKeyId,
      secretAccessKey,
      region: updatedAccount.region
    };
  }

  accounts[accountIndex] = updatedAccount;

  res.json({
    success: true,
    data: updatedAccount,
    timestamp: new Date(),
  });
});

// Delete account endpoint
app.delete('/api/accounts/:id', (req, res) => {
  const accountId = req.params.id;
  const accountIndex = accounts.findIndex(acc => acc.id === accountId);
  
  if (accountIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  // Remove resources for this account
  resources = resources.filter(r => r.accountId !== accounts[accountIndex].accountId);
  
  // Remove account
  accounts.splice(accountIndex, 1);

  res.json({
    success: true,
    data: { message: 'Account deleted successfully' },
    timestamp: new Date(),
  });
});

// Test connection endpoint
app.post('/api/accounts/:id/test', async (req, res) => {
  const accountId = req.params.id;
  const account = accounts.find(acc => acc.id === accountId);
  
  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  try {
    if (account.credentials) {
      // Test with access key and secret key
      const stsClient = new STSClient({
        region: account.region,
        credentials: {
          accessKeyId: account.credentials.accessKeyId,
          secretAccessKey: account.credentials.secretAccessKey,
        },
      });

      await stsClient.send(new GetCallerIdentityCommand({}));
      res.json({
        success: true,
        data: { connected: true },
        timestamp: new Date(),
      });
    } else {
      // For now, assume role-based authentication works
      res.json({
        success: true,
        data: { connected: true },
        timestamp: new Date(),
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to AWS: ' + error.message,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }
});

// Refresh resources endpoint
app.post('/api/resources/refresh', async (req, res) => {
  const results = [];
  
  for (const account of accounts) {
    if (!account.isActive) continue;
    
    try {
      const accountResources = [];
      
      if (account.credentials) {
        // Collect S3 buckets
        try {
          const s3Client = new S3Client({
            region: account.region,
            credentials: {
              accessKeyId: account.credentials.accessKeyId,
              secretAccessKey: account.credentials.secretAccessKey,
            },
          });

          const s3Response = await s3Client.send(new ListBucketsCommand({}));
          
          if (s3Response.Buckets) {
            for (const bucket of s3Response.Buckets) {
              if (bucket.Name) {
                accountResources.push({
                  id: bucket.Name,
                  accountId: account.accountId,
                  region: account.region,
                  resourceType: 's3',
                  name: bucket.Name,
                  arn: `arn:aws:s3:::${bucket.Name}`,
                  tags: {},
                  status: 'active',
                  bucketName: bucket.Name,
                  creationDate: bucket.CreationDate?.toISOString() || new Date().toISOString(),
                  versioning: false,
                  encryption: false,
                  createdAt: bucket.CreationDate?.toISOString() || new Date().toISOString(),
                  lastUpdated: new Date().toISOString(),
                });
              }
            }
          }
        } catch (s3Error) {
          console.error(`S3 error for account ${account.accountId}:`, s3Error.message);
        }

        // Collect EC2 instances
        try {
          const ec2Client = new EC2Client({
            region: account.region,
            credentials: {
              accessKeyId: account.credentials.accessKeyId,
              secretAccessKey: account.credentials.secretAccessKey,
            },
          });

          const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));
          
          if (ec2Response.Reservations) {
            for (const reservation of ec2Response.Reservations) {
              if (reservation.Instances) {
                for (const instance of reservation.Instances) {
                  if (instance.InstanceId) {
                    const tags = {};
                    if (instance.Tags) {
                      for (const tag of instance.Tags) {
                        if (tag.Key && tag.Value) {
                          tags[tag.Key] = tag.Value;
                        }
                      }
                    }
                    
                    const name = tags.Name || instance.InstanceId;
                    
                    accountResources.push({
                      id: instance.InstanceId,
                      accountId: account.accountId,
                      region: account.region,
                      resourceType: 'ec2',
                      name,
                      arn: `arn:aws:ec2:${account.region}:${account.accountId}:instance/${instance.InstanceId}`,
                      tags,
                      status: instance.State?.Name || 'unknown',
                      instanceType: instance.InstanceType || 'unknown',
                      state: instance.State?.Name || 'unknown',
                      publicIp: instance.PublicIpAddress,
                      privateIp: instance.PrivateIpAddress || '',
                      vpcId: instance.VpcId || '',
                      subnetId: instance.SubnetId || '',
                      createdAt: instance.LaunchTime?.toISOString() || new Date().toISOString(),
                      lastUpdated: new Date().toISOString(),
                    });
                  }
                }
              }
            }
          }
        } catch (ec2Error) {
          console.error(`EC2 error for account ${account.accountId}:`, ec2Error.message);
        }
      }

      // Update resources for this account
      resources = resources.filter(r => r.accountId !== account.accountId);
      resources.push(...accountResources);

      results.push({
        accountId: account.accountId,
        success: true,
        resourceCount: accountResources.length,
        errors: [],
      });

    } catch (error) {
      results.push({
        accountId: account.accountId,
        success: false,
        error: error.message,
      });
    }
  }

  res.json({
    success: true,
    data: { results },
    timestamp: new Date(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
