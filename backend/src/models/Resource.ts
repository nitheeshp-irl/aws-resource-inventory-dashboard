import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ResourceAttributes {
  id: string;
  accountId: string;
  region: string;
  resourceType: string;
  name: string;
  arn: string;
  tags: Record<string, string>;
  status: string;
  metadata: Record<string, any>;
  createdAt?: Date;
  lastUpdated?: Date;
}

interface ResourceCreationAttributes extends Optional<ResourceAttributes, 'id' | 'createdAt' | 'lastUpdated'> {}

class Resource extends Model<ResourceAttributes, ResourceCreationAttributes> implements ResourceAttributes {
  public id!: string;
  public accountId!: string;
  public region!: string;
  public resourceType!: string;
  public name!: string;
  public arn!: string;
  public tags!: Record<string, string>;
  public status!: string;
  public metadata!: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly lastUpdated!: Date;
}

Resource.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arn: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Resource',
    tableName: 'resources',
    indexes: [
      {
        fields: ['accountId'],
      },
      {
        fields: ['region'],
      },
      {
        fields: ['resourceType'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['arn'],
        unique: true,
      },
    ],
  }
);

export default Resource;
