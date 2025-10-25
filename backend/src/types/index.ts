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
  createdAt: Date;
  lastUpdated: Date;
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
  creationDate: Date;
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
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  isActive: boolean;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Resource Collection
export interface ResourceCollection {
  accountId: string;
  timestamp: Date;
  resources: {
    ec2: EC2Resource[];
    rds: RDSResource[];
    s3: S3Resource[];
    ecs: ECSResource[];
    eks: EKSResource[];
    vpc: VPCResource[];
  };
  errors: CollectionError[];
}

// Collection Error
export interface CollectionError {
  service: string;
  region: string;
  error: string;
  timestamp: Date;
}

// AWS Credentials
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

// Error Response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse['error'];
  timestamp: Date;
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
