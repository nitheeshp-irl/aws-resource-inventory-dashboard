// Base resource interface
export interface BaseResource {
  id: string;
  accountId: string;
  region: string;
  resourceType: string;
  name: string;
  arn: string;
  tags: Record<string, string>;
  status: string;
  createdAt: string;
  lastUpdated: string;
}

// EC2 Resource
export interface EC2Resource extends BaseResource {
  instanceType: string;
  state: string;
  publicIp?: string;
  privateIp: string;
  vpcId: string;
  subnetId: string;
}

// RDS Resource
export interface RDSResource extends BaseResource {
  engine: string;
  engineVersion: string;
  dbInstanceClass: string;
  allocatedStorage: number;
  endpoint?: string;
  port: number;
}

// S3 Resource
export interface S3Resource extends BaseResource {
  bucketName: string;
  region: string;
  creationDate: string;
  versioning: boolean;
  encryption: boolean;
}

// ECS Resource
export interface ECSResource extends BaseResource {
  clusterName: string;
  serviceName?: string;
  taskDefinition: string;
  desiredCount: number;
  runningCount: number;
  pendingCount: number;
}

// EKS Resource
export interface EKSResource extends BaseResource {
  clusterName: string;
  version: string;
  status: string;
  endpoint: string;
  nodeGroups: string[];
}

// VPC Resource
export interface VPCResource extends BaseResource {
  cidrBlock: string;
  state: string;
  isDefault: boolean;
  subnets: string[];
}

// Account Configuration
export interface AccountConfig {
  id: string;
  name: string;
  accountId: string;
  roleArn?: string;
  region: string;
  isActive: boolean;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  timestamp: string;
}

// Filter Options
export interface FilterOptions {
  accountIds?: string[];
  regions?: string[];
  resourceTypes?: string[];
  statuses?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

// Resource Summary
export interface ResourceSummary {
  total: number;
  byType: Array<{ resourceType: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byRegion: Array<{ region: string; count: number }>;
}

// Pagination
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Resources Response
export interface ResourcesResponse {
  resources: BaseResource[];
  pagination: Pagination;
}

// Account with resources
export interface AccountWithResources extends AccountConfig {
  resources?: BaseResource[];
}
