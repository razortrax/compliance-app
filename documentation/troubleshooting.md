# Troubleshooting Guide

## Development Environment Issues

### Problem: Static Assets Not Loading (404s)
**Symptoms:**
- CSS/JS chunks returning 404
- Font files not loading
- Pages load but styling is broken
- Console errors for `/_next/static/*` files

**Solution:**
```bash
npm run reset
```

### Problem: Build Cache Corruption
**Symptoms:**
- `MODULE_NOT_FOUND` for existing files
- Inconsistent build results
- "Cannot find module" errors

**Solution:**
```bash
npm run fresh-dev
```

### Emergency Recovery
If the app becomes completely unusable:

1. **Full Reset:**
   ```bash
   git stash
   npm run reset
   npm run dev
   ```

2. **Check Environment:**
   ```bash
   node --version  # Should be 18.x or 20.x+
   npm --version   # Should be 8.x+
   ```

3. **Nuclear Option:**
   ```bash
   rm -rf node_modules package-lock.json .next .env.local
   npm install
   # Restore .env.local from backup
   npm run dev
   ```

## Prevention

- Never use `npm install --force` unless absolutely necessary
- Don't manually edit `package-lock.json`
- Clear caches gradually (`rm -rf .next` first, then node_modules if needed)
- Commit working states frequently
- Keep environment variables backed up separately

## Known Working Environment
- Node.js: v22.17.0
- npm: 10.9.2
- Next.js: 14.2.30
- macOS: 23.4.0

Last verified: January 2025 