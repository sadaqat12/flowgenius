# Environment Configuration Template

Create a `.env` file in the project root using this template:

```bash
# Environment Configuration Example
# Copy this content to .env and update the values as needed
# NEVER commit .env to git - it contains sensitive information

# Development Environment
NODE_ENV=development

# Database Configuration (for future implementation)
# SCM_DATABASE_PATH=./data/service-calls.db
# SCM_DATABASE_ENCRYPTION_KEY=your_encryption_key_here

# AI Configuration (for future implementation)  
# OPENAI_API_KEY=your_openai_api_key_here
# OPENAI_MODEL=gpt-4
# OPENAI_MAX_TOKENS=1000

# Workflow Configuration (for future implementation)
# N8N_HOST=localhost
# N8N_PORT=5678
# N8N_WEBHOOK_SECRET=your_webhook_secret_here

# Application Settings
# SCM_LOG_LEVEL=info
# SCM_AUTO_BACKUP=true
# SCM_BACKUP_INTERVAL=24h
# SCM_MAX_BACKUP_FILES=30

# Security Settings
# SCM_SESSION_SECRET=your_session_secret_here
# SCM_JWT_SECRET=your_jwt_secret_here
# SCM_ENCRYPTION_ALGORITHM=aes-256-gcm

# Cloud Integration (for future implementation)
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=your_backup_bucket

# Email Configuration (for future implementation)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# EMAIL_FROM=noreply@servicecallmanager.com

# Analytics & Monitoring (for future implementation)
# SENTRY_DSN=your_sentry_dsn_here
# ANALYTICS_ENABLED=false
# TELEMETRY_ENDPOINT=https://your-analytics-endpoint.com

# Development Tools
# DEBUG=service-call-manager:*
# VITE_DEBUG=true
```

## Setup Instructions

1. Copy the content above to a new file named `.env` in the project root
2. Uncomment and update the values you need for your environment
3. Never commit the `.env` file to Git (it's already in .gitignore)
4. Use the security scanning tools to ensure no secrets are accidentally committed 