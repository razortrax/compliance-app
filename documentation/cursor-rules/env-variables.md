# Environment Variables

## Required Environment Variables

### Database
- `DATABASE_URL`: PostgreSQL connection string for DigitalOcean database

### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: Sign-in page URL
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: Sign-up page URL  
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: Redirect after sign-in
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`: Redirect after sign-up

### File Storage (DigitalOcean Spaces)
- `DO_SPACES_ENDPOINT`: Spaces endpoint (e.g., https://nyc3.digitaloceanspaces.com)
- `DO_SPACES_REGION`: Spaces region (e.g., nyc3)
- `DO_SPACES_BUCKET`: Bucket name for file storage
- `DO_SPACES_KEY`: Spaces access key ID
- `DO_SPACES_SECRET`: Spaces secret access key
- `DO_SPACES_CDN_ENDPOINT`: (Optional) CDN endpoint for faster file delivery

## Setup Instructions

1. Copy environment variables to `.env.local`
2. Configure DigitalOcean Spaces bucket with public read access
3. Set up CDN (optional but recommended for production)
4. Ensure CORS is configured for your domain
