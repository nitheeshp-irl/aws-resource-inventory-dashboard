import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AccountAttributes {
  id: string;
  name: string;
  accountId: string;
  roleArn?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  isActive: boolean;
  lastSync?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'lastSync' | 'createdAt' | 'updatedAt'> {}

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: string;
  public name!: string;
  public accountId!: string;
  public roleArn?: string;
  public accessKeyId?: string;
  public secretAccessKey?: string;
  public region!: string;
  public isActive!: boolean;
  public lastSync?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    roleArn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accessKeyId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secretAccessKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'us-east-1',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
  }
);

export default Account;
