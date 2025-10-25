import sequelize from '../config/database';
import Account from './Account';
import Resource from './Resource';

// Initialize models
const models = {
  Account,
  Resource,
};

// Define associations
// Account has many Resources
Account.hasMany(Resource, { foreignKey: 'accountId', as: 'resources' });
Resource.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Initialize database
export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database models synchronized.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

export { sequelize, Account, Resource };
export default models;
