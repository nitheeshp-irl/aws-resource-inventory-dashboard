import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Resource, Account } from '../models';
import { AuthService } from '../services/AuthService';
import { ResourceCollector } from '../services/ResourceCollector';
import { ApiResponse, FilterOptions } from '../types';

export class ResourceController {
  /**
   * Get all resources with optional filtering
   */
  static async getResources(req: Request, res: Response): Promise<void> {
    try {
      const {
        accountIds,
        regions,
        resourceTypes,
        statuses,
        search,
        limit = 100,
        offset = 0,
      } = req.query;

      const whereClause: any = {};

      // Apply filters
      if (accountIds) {
        const accountIdArray = Array.isArray(accountIds) ? accountIds : [accountIds];
        whereClause.accountId = { [Op.in]: accountIdArray };
      }

      if (regions) {
        const regionArray = Array.isArray(regions) ? regions : [regions];
        whereClause.region = { [Op.in]: regionArray };
      }

      if (resourceTypes) {
        const typeArray = Array.isArray(resourceTypes) ? resourceTypes : [resourceTypes];
        whereClause.resourceType = { [Op.in]: typeArray };
      }

      if (statuses) {
        const statusArray = Array.isArray(statuses) ? statuses : [statuses];
        whereClause.status = { [Op.in]: statusArray };
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { arn: { [Op.iLike]: `%${search}%` } },
          { id: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: resources } = await Resource.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'accountId'],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['lastUpdated', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        data: {
          resources,
          pagination: {
            total: count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: count > parseInt(offset as string) + parseInt(limit as string),
          },
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching resources:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'RESOURCES_FETCH_ERROR',
          message: 'Failed to fetch resources',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get resources for a specific account
   */
  static async getAccountResources(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const {
        resourceTypes,
        statuses,
        search,
        limit = 100,
        offset = 0,
      } = req.query;

      const whereClause: any = { accountId };

      if (resourceTypes) {
        const typeArray = Array.isArray(resourceTypes) ? resourceTypes : [resourceTypes];
        whereClause.resourceType = { [Op.in]: typeArray };
      }

      if (statuses) {
        const statusArray = Array.isArray(statuses) ? statuses : [statuses];
        whereClause.status = { [Op.in]: statusArray };
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { arn: { [Op.iLike]: `%${search}%` } },
          { id: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: resources } = await Resource.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name', 'accountId'],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['lastUpdated', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        data: {
          resources,
          pagination: {
            total: count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: count > parseInt(offset as string) + parseInt(limit as string),
          },
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching account resources:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_RESOURCES_FETCH_ERROR',
          message: 'Failed to fetch account resources',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get resource summary statistics
   */
  static async getResourceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { accountIds } = req.query;

      const whereClause: any = {};
      if (accountIds) {
        const accountIdArray = Array.isArray(accountIds) ? accountIds : [accountIds];
        whereClause.accountId = { [Op.in]: accountIdArray };
      }

      // Get resource counts by type
      const resourceCounts = await Resource.findAll({
        where: whereClause,
        attributes: [
          'resourceType',
          [Resource.sequelize!.fn('COUNT', Resource.sequelize!.col('id')), 'count'],
        ],
        group: ['resourceType'],
        raw: true,
      });

      // Get resource counts by status
      const statusCounts = await Resource.findAll({
        where: whereClause,
        attributes: [
          'status',
          [Resource.sequelize!.fn('COUNT', Resource.sequelize!.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      // Get resource counts by region
      const regionCounts = await Resource.findAll({
        where: whereClause,
        attributes: [
          'region',
          [Resource.sequelize!.fn('COUNT', Resource.sequelize!.col('id')), 'count'],
        ],
        group: ['region'],
        raw: true,
      });

      const totalResources = await Resource.count({ where: whereClause });

      const response: ApiResponse = {
        success: true,
        data: {
          total: totalResources,
          byType: resourceCounts,
          byStatus: statusCounts,
          byRegion: regionCounts,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching resource summary:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'RESOURCE_SUMMARY_ERROR',
          message: 'Failed to fetch resource summary',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Refresh resources for all accounts
   */
  static async refreshAllResources(req: Request, res: Response): Promise<void> {
    try {
      const accounts = await Account.findAll({ where: { isActive: true } });
      const results = [];

      for (const account of accounts) {
        try {
          const credentials = await AuthService.decryptCredentials(account.accountId);
          if (!credentials) {
            results.push({
              accountId: account.accountId,
              success: false,
              error: 'No credentials found',
            });
            continue;
          }

          const collector = new ResourceCollector(credentials);
          const collection = await collector.collectAllResources(account.accountId);

          // Store resources in database
          await this.storeResourceCollection(collection);

          // Update account last sync time
          await account.update({ lastSync: new Date() });

          results.push({
            accountId: account.accountId,
            success: true,
            resourceCount: Object.values(collection.resources).flat().length,
            errors: collection.errors,
          });
        } catch (error) {
          results.push({
            accountId: account.accountId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const response: ApiResponse = {
        success: true,
        data: { results },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error refreshing resources:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: 'Failed to refresh resources',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Refresh resources for a specific account
   */
  static async refreshAccountResources(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;

      const account = await Account.findOne({ where: { accountId } });
      if (!account) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        };
        res.status(404).json(response);
        return;
      }

      const credentials = await AuthService.decryptCredentials(account.accountId);
      if (!credentials) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NO_CREDENTIALS',
            message: 'No credentials found for this account',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const collector = new ResourceCollector(credentials);
      const collection = await collector.collectAllResources(account.accountId);

      // Store resources in database
      await this.storeResourceCollection(collection);

      // Update account last sync time
      await account.update({ lastSync: new Date() });

      const response: ApiResponse = {
        success: true,
        data: {
          accountId: account.accountId,
          resourceCount: Object.values(collection.resources).flat().length,
          errors: collection.errors,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error refreshing account resources:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_REFRESH_ERROR',
          message: 'Failed to refresh account resources',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Store resource collection in database
   */
  private static async storeResourceCollection(collection: any): Promise<void> {
    const allResources = Object.values(collection.resources).flat();
    
    for (const resource of allResources) {
      await Resource.upsert({
        id: (resource as any).id,
        accountId: (resource as any).accountId,
        region: (resource as any).region,
        resourceType: (resource as any).resourceType,
        name: (resource as any).name,
        arn: (resource as any).arn,
        tags: (resource as any).tags,
        status: (resource as any).status,
        metadata: resource,
        lastUpdated: new Date(),
      });
    }
  }
}
