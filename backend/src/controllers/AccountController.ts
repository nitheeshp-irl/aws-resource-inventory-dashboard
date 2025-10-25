import { Request, Response } from 'express';
import { Account } from '../models';
import { AuthService } from '../services/AuthService';
import { ResourceCollector } from '../services/ResourceCollector';
import { ApiResponse, FilterOptions } from '../types';

export class AccountController {
  /**
   * Get all configured accounts
   */
  static async getAccounts(req: Request, res: Response): Promise<void> {
    try {
      const accounts = await Account.findAll({
        attributes: { exclude: ['accessKeyId', 'secretAccessKey'] },
        order: [['createdAt', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        data: accounts,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNTS_FETCH_ERROR',
          message: 'Failed to fetch accounts',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get a specific account by ID
   */
  static async getAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await Account.findByPk(id, {
        attributes: { exclude: ['accessKeyId', 'secretAccessKey'] },
      });

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

      const response: ApiResponse = {
        success: true,
        data: account,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching account:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_FETCH_ERROR',
          message: 'Failed to fetch account',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create a new account
   */
  static async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        accountId,
        roleArn,
        accessKeyId,
        secretAccessKey,
        region = 'us-east-1',
      } = req.body;

      // Validate required fields
      if (!name || !accountId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name and Account ID are required',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      // Check if account already exists
      const existingAccount = await Account.findOne({ where: { accountId } });
      if (existingAccount) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'ACCOUNT_EXISTS',
            message: 'Account with this ID already exists',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        };
        res.status(409).json(response);
        return;
      }

      // Validate credentials if provided
      if (accessKeyId && secretAccessKey) {
        const credentials = { accessKeyId, secretAccessKey, region };
        const collector = new ResourceCollector(credentials);
        const isValid = await collector.validateCredentials();
        
        if (!isValid) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid AWS credentials',
              timestamp: new Date(),
            },
            timestamp: new Date(),
          };
          res.status(400).json(response);
          return;
        }

        // Encrypt and store credentials
        await AuthService.encryptCredentials(accountId, credentials);
      }

      // Create account
      const account = await Account.create({
        name,
        accountId,
        roleArn,
        region,
        isActive: true,
      });

      const response: ApiResponse = {
        success: true,
        data: account,
        timestamp: new Date(),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating account:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_CREATE_ERROR',
          message: 'Failed to create account',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Update an existing account
   */
  static async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const account = await Account.findByPk(id);
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

      // Handle credential updates
      if (updateData.accessKeyId && updateData.secretAccessKey) {
        const credentials = {
          accessKeyId: updateData.accessKeyId,
          secretAccessKey: updateData.secretAccessKey,
          region: updateData.region || account.region,
        };

        const collector = new ResourceCollector(credentials);
        const isValid = await collector.validateCredentials();
        
        if (!isValid) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid AWS credentials',
              timestamp: new Date(),
            },
            timestamp: new Date(),
          };
          res.status(400).json(response);
          return;
        }

        await AuthService.encryptCredentials(account.accountId, credentials);
      }

      // Remove sensitive data from update
      delete updateData.accessKeyId;
      delete updateData.secretAccessKey;

      await account.update(updateData);

      const response: ApiResponse = {
        success: true,
        data: account,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating account:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_UPDATE_ERROR',
          message: 'Failed to update account',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete an account
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await Account.findByPk(id);
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

      // Remove stored credentials
      await AuthService.removeCredentials(account.accountId);

      // Delete account
      await account.destroy();

      const response: ApiResponse = {
        success: true,
        data: { message: 'Account deleted successfully' },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting account:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_DELETE_ERROR',
          message: 'Failed to delete account',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Test account connection
   */
  static async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await Account.findByPk(id);
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

      // Get credentials and test connection
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
      const isValid = await collector.validateCredentials();

      const response: ApiResponse = {
        success: true,
        data: { connected: isValid },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error testing connection:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CONNECTION_TEST_ERROR',
          message: 'Failed to test connection',
          details: error,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
}
