# AWS Resource Inventory Dashboard

A centralized web dashboard that aggregates and displays AWS resources from multiple AWS accounts in a single, unified interface.

## Features

- **Multi-Account Support**: Monitor resources across multiple AWS accounts
- **Resource Types**: EC2, RDS, S3, ECS, EKS, VPC, and more
- **Real-time Filtering**: Filter by account, region, resource type, and status
- **Search Functionality**: Search resources by name, ID, or tags
- **Secure Credential Management**: Encrypted storage of AWS credentials
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-refresh**: Automatic data refresh every 5 minutes

## Architecture

- **Frontend**: React 18 with TypeScript, Material-UI
- **Backend**: Node.js with Express, TypeScript
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT tokens with secure credential encryption
- **AWS Integration**: AWS SDK v3 for JavaScript

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- AWS credentials with appropriate permissions

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aws-resource-inventory
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Backend
cd backend
cp env.example .env
# Edit .env with your configuration

# Frontend
cd ../frontend
# No additional setup required for development
```

4. Start the development servers:
```bash
# From the root directory
npm run dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend development server on http://localhost:3000

### First Time Setup

1. Open http://localhost:3000 in your browser
2. Navigate to "Account Management"
3. Add your first AWS account:
   - Enter account name and AWS Account ID
   - Provide IAM role ARN or access keys
   - Select the primary region
4. Test the connection
5. Go back to the Dashboard to view your resources

## AWS Permissions

The application requires the following IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "rds:DescribeDBInstances",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "ecs:ListClusters",
        "ecs:DescribeClusters",
        "ecs:ListServices",
        "eks:ListClusters",
        "eks:DescribeCluster",
        "resource-groups:GetResources"
      ],
      "Resource": "*"
    }
  ]
}
```

## Development

### Backend Development

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm test            # Run tests
npm run lint        # Run linter
```

### Frontend Development

```bash
cd frontend
npm start           # Start development server
npm run build       # Build for production
npm test           # Run tests
npm run lint       # Run linter
```

### Project Structure

```
aws-resource-inventory/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript types
│   │   └── config/          # Configuration
│   └── data/               # SQLite database
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── hooks/          # Custom React hooks
└── docs/                   # Documentation
```

## API Endpoints

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `POST /api/accounts/:id/test` - Test account connection

### Resources
- `GET /api/resources` - Get all resources with filtering
- `GET /api/resources/summary` - Get resource summary statistics
- `GET /api/resources/account/:accountId` - Get resources for specific account
- `POST /api/resources/refresh` - Refresh all resources
- `POST /api/resources/refresh/:accountId` - Refresh account resources

### System
- `GET /api/health` - Health check

## Security

- AWS credentials are encrypted using bcrypt and stored in OS keychain
- JWT tokens for session management
- Input validation and sanitization
- CORS protection
- Rate limiting (recommended for production)

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Use a production database (PostgreSQL recommended)
4. Set up reverse proxy (nginx recommended)
5. Configure SSL/TLS certificates
6. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information