# Aishwarya Xerox Backend API

A Node.js/Express backend API for the Aishwarya Xerox printing service with MongoDB Atlas integration.

## Features

- **File Upload**: Secure file upload with validation (PDF, DOC, DOCX)
- **Order Management**: Complete CRUD operations for orders
- **Admin Authentication**: JWT-based admin authentication
- **File Storage**: Local file storage in uploads/ directory
- **Database**: MongoDB Atlas integration with Mongoose ODM
- **Security**: Rate limiting, CORS, helmet, input validation
- **Statistics**: Dashboard statistics and analytics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB Atlas with Mongoose 8.0+
- **Authentication**: JWT (jsonwebtoken 9.0+)
- **File Upload**: Multer 1.4+
- **Validation**: Joi 17.11+
- **Security**: Helmet, CORS, Rate Limiting

## MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account

2. **Create a Cluster**
   - Choose M0 (Free tier)
   - Select your preferred region
   - Create cluster

3. **Database Access**
   - Go to Database Access
   - Add a new database user
   - Choose password authentication
   - Set username and password
   - Grant "Read and write to any database" role

4. **Network Access**
   - Go to Network Access
   - Add IP Address
   - For development: Add 0.0.0.0/0 (Allow access from anywhere)
   - For production: Add your VPS IP address

5. **Get Connection String**
   - Go to Clusters → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## Installation

1. **Clone and Setup**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aishwarya_xerox?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_super_secret_jwt_key_here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=xerox123
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=uploads/
   FRONTEND_URL=http://localhost:8080
   ```

3. **Create Default Admin**
   ```bash
   node scripts/createAdmin.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout

### Orders
- `POST /api/orders` - Create new order (with file upload)
- `GET /api/orders/:orderId` - Get order by ID
- `GET /api/orders` - Get all orders (Admin only)
- `PATCH /api/orders/:orderId/status` - Update order status (Admin only)
- `GET /api/orders/:orderId/files/:fileName` - Download file (Admin only)
- `DELETE /api/orders/:orderId` - Delete order (Admin only)

### Statistics
- `GET /api/stats/dashboard` - Get dashboard statistics (Admin only)

### Health Check
- `GET /api/health` - Server health check

## File Upload

Files are stored in the `uploads/` directory with the following structure:
```
uploads/
├── 1703123456789-uuid-document.pdf
├── 1703123456790-uuid-report.docx
└── ...
```

**File Restrictions:**
- Maximum file size: 10MB
- Maximum files per order: 10
- Allowed types: PDF, DOC, DOCX

## Database Schema

### Order Schema
```javascript
{
  orderId: String (unique),
  fullName: String,
  phoneNumber: String,
  printType: String,
  bindingColorType: String,
  copies: Number,
  paperSize: String,
  printSide: String,
  selectedPages: String,
  colorPages: String,
  bwPages: String,
  specialInstructions: String,
  files: [FileSchema],
  status: String,
  totalCost: Number,
  orderDate: Date,
  updatedAt: Date
}
```

### Admin Schema
```javascript
{
  username: String (unique),
  password: String (hashed),
  email: String,
  lastLogin: Date,
  isActive: Boolean
}
```

## VPS Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or CentOS 8+
   - Node.js 18+
   - PM2 for process management
   - Nginx for reverse proxy

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install nginx -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd aishwarya-xerox/server

   # Install dependencies
   npm install --production

   # Create uploads directory
   mkdir -p uploads
   chmod 755 uploads

   # Set environment variables
   cp .env.example .env
   # Edit .env with production values

   # Create admin user
   node scripts/createAdmin.js

   # Start with PM2
   pm2 start server.js --name "aishwarya-xerox-api"
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           client_max_body_size 10M;
       }

       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. **SSL Certificate (Optional)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Security Considerations

- Change default admin credentials
- Use strong JWT secret
- Enable MongoDB Atlas IP whitelist
- Use HTTPS in production
- Regular security updates
- Monitor file uploads
- Implement backup strategy

## Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs aishwarya-xerox-api

# Restart application
pm2 restart aishwarya-xerox-api
```

## Backup Strategy

1. **Database Backup**
   - MongoDB Atlas provides automated backups
   - Manual backup: Use mongodump/mongorestore

2. **File Backup**
   ```bash
   # Create backup script
   #!/bin/bash
   tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
   ```

## Support

For issues and support:
- Check server logs: `pm2 logs`
- Monitor system resources: `htop`
- Database monitoring: MongoDB Atlas dashboard