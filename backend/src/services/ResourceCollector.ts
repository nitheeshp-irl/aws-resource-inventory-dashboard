import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import {
  ECSClient,
  ListClustersCommand,
  DescribeClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  EKSClient,
  ListClustersCommand as EKSListClustersCommand,
  DescribeClusterCommand,
} from '@aws-sdk/client-eks';
import {
  STSClient,
  GetCallerIdentityCommand,
} from '@aws-sdk/client-sts';
import { fromIni, fromEnv } from '@aws-sdk/credential-providers';
import {
  ResourceCollection,
  EC2Resource,
  RDSResource,
  S3Resource,
  ECSResource,
  EKSResource,
  VPCResource,
  CollectionError,
  AWSCredentials,
} from '../types';

export class ResourceCollector {
  private credentials: AWSCredentials;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
  }

  /**
   * Collect all resources from an AWS account
   */
  async collectAllResources(accountId: string): Promise<ResourceCollection> {
    const timestamp = new Date();
    const errors: CollectionError[] = [];
    const resources = {
      ec2: [] as EC2Resource[],
      rds: [] as RDSResource[],
      s3: [] as S3Resource[],
      ecs: [] as ECSResource[],
      eks: [] as EKSResource[],
      vpc: [] as VPCResource[],
    };

    // Collect resources in parallel
    const promises = [
      this.collectEC2Resources(accountId).catch(error => {
        errors.push({ service: 'ec2', region: this.credentials.region, error: error.message, timestamp });
        return [];
      }),
      this.collectRDSResources(accountId).catch(error => {
        errors.push({ service: 'rds', region: this.credentials.region, error: error.message, timestamp });
        return [];
      }),
      this.collectS3Resources(accountId).catch(error => {
        errors.push({ service: 's3', region: this.credentials.region, error: error.message, timestamp });
        return [];
      }),
      this.collectECSResources(accountId).catch(error => {
        errors.push({ service: 'ecs', region: this.credentials.region, error: error.message, timestamp });
        return [];
      }),
      this.collectEKSResources(accountId).catch(error => {
        errors.push({ service: 'eks', region: this.credentials.region, error: error.message, timestamp });
        return [];
      }),
      this.collectVPCResources(accountId).catch(error => {
        errors.push({ service: 'vpc', region: this.credentials.region, error: error.message, timestamp });
        return [];
      }),
    ];

    const results = await Promise.all(promises);
    resources.ec2 = results[0] as EC2Resource[];
    resources.rds = results[1] as RDSResource[];
    resources.s3 = results[2] as S3Resource[];
    resources.ecs = results[3] as ECSResource[];
    resources.eks = results[4] as EKSResource[];
    resources.vpc = results[5] as VPCResource[];

    return {
      accountId,
      timestamp,
      resources,
      errors,
    };
  }

  /**
   * Collect EC2 instances
   */
  async collectEC2Resources(accountId: string): Promise<EC2Resource[]> {
    const client = new EC2Client({
      region: this.credentials.region,
      credentials: this.credentials,
    });

    const command = new DescribeInstancesCommand({});
    const response = await client.send(command);

    const resources: EC2Resource[] = [];

    response.Reservations?.forEach(reservation => {
      reservation.Instances?.forEach(instance => {
        if (instance.InstanceId) {
          const tags = this.extractTags(instance.Tags);
          const name = tags.Name || instance.InstanceId;

          resources.push({
            id: instance.InstanceId,
            accountId,
            region: this.credentials.region,
            resourceType: 'ec2',
            name,
            arn: `arn:aws:ec2:${this.credentials.region}:${accountId}:instance/${instance.InstanceId}`,
            tags,
            status: instance.State?.Name || 'unknown',
            instanceType: instance.InstanceType || 'unknown',
            state: instance.State?.Name || 'unknown',
            publicIp: instance.PublicIpAddress,
            privateIp: instance.PrivateIpAddress || '',
            vpcId: instance.VpcId || '',
            subnetId: instance.SubnetId || '',
            createdAt: instance.LaunchTime || new Date(),
            lastUpdated: new Date(),
          });
        }
      });
    });

    return resources;
  }

  /**
   * Collect RDS instances
   */
  async collectRDSResources(accountId: string): Promise<RDSResource[]> {
    const client = new RDSClient({
      region: this.credentials.region,
      credentials: this.credentials,
    });

    const command = new DescribeDBInstancesCommand({});
    const response = await client.send(command);

    const resources: RDSResource[] = [];

    response.DBInstances?.forEach(dbInstance => {
      if (dbInstance.DBInstanceIdentifier) {
        const tags = this.extractTags(dbInstance.TagList);
        const name = dbInstance.DBInstanceIdentifier;

        resources.push({
          id: dbInstance.DBInstanceIdentifier,
          accountId,
          region: this.credentials.region,
          resourceType: 'rds',
          name,
          arn: dbInstance.DBInstanceArn || '',
          tags,
          status: dbInstance.DBInstanceStatus || 'unknown',
          engine: dbInstance.Engine || 'unknown',
          engineVersion: dbInstance.EngineVersion || 'unknown',
          dbInstanceClass: dbInstance.DBInstanceClass || 'unknown',
          allocatedStorage: dbInstance.AllocatedStorage || 0,
          endpoint: dbInstance.Endpoint?.Address,
          port: dbInstance.Endpoint?.Port || 0,
          createdAt: dbInstance.InstanceCreateTime || new Date(),
          lastUpdated: new Date(),
        });
      }
    });

    return resources;
  }

  /**
   * Collect S3 buckets
   */
  async collectS3Resources(accountId: string): Promise<S3Resource[]> {
    const client = new S3Client({
      region: this.credentials.region,
      credentials: this.credentials,
    });

    const listCommand = new ListBucketsCommand({});
    const response = await client.send(listCommand);

    const resources: S3Resource[] = [];

    if (response.Buckets) {
      for (const bucket of response.Buckets) {
        if (bucket.Name) {
          try {
            // Get bucket location
            const locationCommand = new GetBucketLocationCommand({ Bucket: bucket.Name });
            const locationResponse = await client.send(locationCommand);
            const region = locationResponse.LocationConstraint || 'us-east-1';

            resources.push({
              id: bucket.Name,
              accountId,
              region,
              resourceType: 's3',
              name: bucket.Name,
              arn: `arn:aws:s3:::${bucket.Name}`,
              tags: {},
              status: 'active',
              bucketName: bucket.Name,
              creationDate: bucket.CreationDate || new Date(),
              versioning: false, // Would need additional API call to get this
              encryption: false, // Would need additional API call to get this
              createdAt: bucket.CreationDate || new Date(),
              lastUpdated: new Date(),
            });
          } catch (error) {
            console.error(`Failed to get location for bucket ${bucket.Name}:`, error);
          }
        }
      }
    }

    return resources;
  }

  /**
   * Collect ECS clusters and services
   */
  async collectECSResources(accountId: string): Promise<ECSResource[]> {
    const client = new ECSClient({
      region: this.credentials.region,
      credentials: this.credentials,
    });

    const resources: ECSResource[] = [];

    try {
      // List clusters
      const listClustersCommand = new ListClustersCommand({});
      const clustersResponse = await client.send(listClustersCommand);

      if (clustersResponse.clusterArns) {
        // Describe clusters
        const describeClustersCommand = new DescribeClustersCommand({
          clusters: clustersResponse.clusterArns,
        });
        const clusters = await client.send(describeClustersCommand);

        for (const cluster of clusters.clusters || []) {
          if (cluster.clusterName) {
            resources.push({
              id: cluster.clusterArn || cluster.clusterName,
              accountId,
              region: this.credentials.region,
              resourceType: 'ecs',
              name: cluster.clusterName,
              arn: cluster.clusterArn || '',
              tags: this.extractTags(cluster.tags),
              status: cluster.status || 'unknown',
              clusterName: cluster.clusterName,
              serviceName: undefined,
              taskDefinition: '',
              desiredCount: 0,
              runningCount: cluster.runningTasksCount || 0,
              pendingCount: cluster.pendingTasksCount || 0,
              createdAt: new Date(),
              lastUpdated: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to collect ECS resources:', error);
    }

    return resources;
  }

  /**
   * Collect EKS clusters
   */
  async collectEKSResources(accountId: string): Promise<EKSResource[]> {
    const client = new EKSClient({
      region: this.credentials.region,
      credentials: this.credentials,
    });

    const resources: EKSResource[] = [];

    try {
      const listCommand = new EKSListClustersCommand({});
      const response = await client.send(listCommand);

      if (response.clusters) {
        for (const clusterName of response.clusters) {
          const describeCommand = new DescribeClusterCommand({ name: clusterName });
          const cluster = await client.send(describeCommand);

          if (cluster.cluster) {
            resources.push({
              id: cluster.cluster.arn || clusterName,
              accountId,
              region: this.credentials.region,
              resourceType: 'eks',
              name: clusterName,
              arn: cluster.cluster.arn || '',
              tags: this.extractTags(cluster.cluster.tags as any),
              status: cluster.cluster.status || 'unknown',
              clusterName,
              version: cluster.cluster.version || 'unknown',
              endpoint: cluster.cluster.endpoint || '',
              nodeGroups: (cluster.cluster as any).nodeGroups || [],
              createdAt: cluster.cluster.createdAt || new Date(),
              lastUpdated: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to collect EKS resources:', error);
    }

    return resources;
  }

  /**
   * Collect VPC resources
   */
  async collectVPCResources(accountId: string): Promise<VPCResource[]> {
    const client = new EC2Client({
      region: this.credentials.region,
      credentials: this.credentials,
    });

    const resources: VPCResource[] = [];

    try {
      const command = new DescribeVpcsCommand({});
      const response = await client.send(command);

      response.Vpcs?.forEach(vpc => {
        if (vpc.VpcId) {
          const tags = this.extractTags(vpc.Tags);
          const name = tags.Name || vpc.VpcId;

          resources.push({
            id: vpc.VpcId,
            accountId,
            region: this.credentials.region,
            resourceType: 'vpc',
            name,
            arn: `arn:aws:ec2:${this.credentials.region}:${accountId}:vpc/${vpc.VpcId}`,
            tags,
            status: vpc.State || 'unknown',
            cidrBlock: vpc.CidrBlock || '',
            state: vpc.State || 'unknown',
            isDefault: vpc.IsDefault || false,
            subnets: [], // Would need additional API call to get subnets
            createdAt: new Date(),
            lastUpdated: new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Failed to collect VPC resources:', error);
    }

    return resources;
  }

  /**
   * Extract tags from AWS resource tags
   */
  private extractTags(tags?: any[]): Record<string, string> {
    const tagMap: Record<string, string> = {};
    
    if (tags) {
      tags.forEach(tag => {
        if (tag.Key && tag.Value) {
          tagMap[tag.Key] = tag.Value;
        }
      });
    }
    
    return tagMap;
  }

  /**
   * Validate AWS credentials by getting caller identity
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const client = new STSClient({
        region: this.credentials.region,
        credentials: this.credentials,
      });

      const command = new GetCallerIdentityCommand({});
      await client.send(command);
      return true;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }
}
