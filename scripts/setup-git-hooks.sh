#!/bin/bash

# Setup Git Hooks for Development Standards Enforcement
# Run this script to automatically enforce build validation and code standards

echo "🔧 Setting up Git Hooks for Development Standards..."

# Create git hooks directory if it doesn't exist
mkdir -p .git/hooks

# Pre-commit hook - Enforce build validation
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

echo "🔍 Pre-commit validation starting..."

# 1. Build validation (MANDATORY)
echo "📦 Running build validation..."
npm run build --silent
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ COMMIT REJECTED: Build failed"
  echo ""
  echo "🚨 MANDATORY: Fix all TypeScript compilation errors before committing"
  echo "📖 Read: documentation/cursor-rules/build-validation.md"
  echo ""
  echo "To fix:"
  echo "1. Run: npm run build"
  echo "2. Fix all TypeScript errors systematically"
  echo "3. Re-run this commit"
  echo ""
  exit 1
fi

# 2. Check for suspicious file names
echo "🧹 Checking for deprecated file patterns..."
suspicious=$(git diff --cached --name-only | grep -E "\.(old|backup|copy|broken|disabled)(\.|$)")
if [ -n "$suspicious" ]; then
  echo ""
  echo "❌ COMMIT REJECTED: Suspicious file names detected"
  echo ""
  echo "🚨 BANNED: Files with deprecated naming patterns"
  echo "📖 Read: documentation/cursor-rules/cleanup-procedures.md"
  echo ""
  echo "Problematic files:"
  echo "$suspicious"
  echo ""
  echo "To fix:"
  echo "1. Delete deprecated files: git rm [filename]"
  echo "2. Use proper naming for active files"
  echo "3. Use git history for file recovery, not file renaming"
  echo ""
  exit 1
fi

# 3. Check for dangerous type coercion in new code
echo "🛡️ Checking for unsafe type coercion..."
new_as_any=$(git diff --cached | grep -E "^\+" | grep -E "as any|as unknown" | head -5)
if [ -n "$new_as_any" ]; then
  echo ""
  echo "⚠️  WARNING: Type coercion detected in new code"
  echo ""
  echo "🚨 DISCOURAGED: 'as any' and 'as unknown' type coercion"
  echo "📖 Read: documentation/cursor-rules/type-safety.md"
  echo ""
  echo "Found:"
  echo "$new_as_any"
  echo ""
  echo "To fix:"
  echo "1. Define proper interfaces instead of 'as any'"
  echo "2. Handle undefined/null cases explicitly"
  echo "3. Fix root type definition issues"
  echo ""
  echo "Continue anyway? (y/N)"
  read -r response
  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo "Commit cancelled. Fix type issues before committing."
    exit 1
  fi
fi

# 4. Check for large interface changes without migration plan
echo "📋 Checking for potential interface changes..."
interface_changes=$(git diff --cached --name-only | grep -E "(types|interfaces|components)" | wc -l)
if [ "$interface_changes" -gt 3 ]; then
  echo ""
  echo "⚠️  WARNING: Multiple interface/component files modified"
  echo ""
  echo "🚨 REQUIRED: Change Management Protocol for large changes"
  echo "📖 Read: documentation/cursor-rules/change-management.md"
  echo ""
  echo "Modified files: $interface_changes"
  echo ""
  echo "Required checklist:"
  echo "□ Identified all consumers of modified interfaces"
  echo "□ Planned incremental migration strategy"
  echo "□ Got approval for changes affecting >5 files"
  echo "□ Tested changes systematically"
  echo ""
  echo "Have you followed the Change Management Protocol? (y/N)"
  read -r response
  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo "Commit cancelled. Follow Change Management Protocol first."
    exit 1
  fi
fi

echo "✅ Pre-commit validation passed"
echo ""
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Pre-push hook - Additional safety checks
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh

echo "🚀 Pre-push validation starting..."

# 1. Final build check
echo "📦 Final build validation..."
npm run build --silent
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ PUSH REJECTED: Build still broken"
  echo ""
  echo "🚨 CRITICAL: Cannot push broken builds to remote"
  echo "Fix all compilation errors before pushing"
  echo ""
  exit 1
fi

# 2. Check for any remaining as any in the entire codebase
echo "🛡️ Checking for type safety violations..."
as_any_count=$(grep -r "as any" src/ --include="*.tsx" --include="*.ts" | wc -l)
if [ "$as_any_count" -gt 10 ]; then
  echo ""
  echo "⚠️  WARNING: High number of 'as any' type coercions: $as_any_count"
  echo ""
  echo "📖 Consider refactoring to improve type safety"
  echo "📖 Read: documentation/cursor-rules/type-safety.md"
  echo ""
fi

echo "✅ Pre-push validation passed"
echo ""
EOF

# Make pre-push hook executable
chmod +x .git/hooks/pre-push

# Commit message template for better commit messages
cat > .git/hooks/prepare-commit-msg << 'EOF'
#!/bin/sh

# Add commit message template if commit message is empty
if [ -z "$(cat $1 | grep -v '^#')" ]; then
  cat > $1 << 'TEMPLATE'

# Follow conventional commit format:
# feat: add new feature
# fix: bug fix
# refactor: code refactoring
# docs: documentation changes
# style: formatting changes
# test: adding tests
# chore: maintenance tasks

# Examples:
# feat: add user management with proper type validation
# fix: resolve driver roleType case sensitivity issue
# refactor: consolidate duplicate form components
# docs: update development standards after interface change incident

# 📖 Development Standards:
# - Build must pass: npm run build
# - No 'as any' type coercion
# - Follow change management for interface changes
# - Delete deprecated files, don't rename them

TEMPLATE
fi
EOF

# Make prepare-commit-msg hook executable
chmod +x .git/hooks/prepare-commit-msg

# Success message
echo ""
echo "✅ Git hooks successfully installed!"
echo ""
echo "🛡️ Automatic enforcement now active for:"
echo "   • Build validation before commits"
echo "   • Deprecated file name detection"
echo "   • Type safety warnings"
echo "   • Change management protocol reminders"
echo "   • Improved commit message templates"
echo ""
echo "📖 To learn more about standards:"
echo "   • Read: DEVELOPMENT_GUIDE.md"
echo "   • Read: documentation/cursor-rules/development-standards.md"
echo ""
echo "🚨 Remember: These hooks enforce our learned lessons from major incidents"
echo "   Following standards prevents cascading failures!"
echo ""

# Optional: Create quick reference script
cat > scripts/dev-check.sh << 'EOF'
#!/bin/bash

# Quick development standards check
# Run this anytime to verify your code meets standards

echo "🔍 Development Standards Check"
echo ""

# 1. Build check
echo "📦 Build validation..."
npm run build --silent
if [ $? -eq 0 ]; then
  echo "   ✅ Build successful"
else
  echo "   ❌ Build failed - fix before proceeding"
  exit 1
fi

# 2. Type safety check
echo "🛡️ Type safety check..."
as_any_count=$(grep -r "as any" src/ --include="*.tsx" --include="*.ts" | wc -l)
echo "   📊 'as any' usage: $as_any_count instances"
if [ "$as_any_count" -gt 0 ]; then
  echo "   ⚠️  Consider refactoring to improve type safety"
fi

# 3. Cleanup check
echo "🧹 File cleanliness check..."
suspicious=$(find src/ -name "*-old*" -o -name "*-copy*" -o -name "*-backup*")
if [ -n "$suspicious" ]; then
  echo "   ⚠️  Suspicious files found:"
  echo "$suspicious"
  echo "   💡 Consider deleting deprecated files"
else
  echo "   ✅ No suspicious files found"
fi

# 4. Recent changes check
echo "📈 Recent development activity..."
commits_today=$(git log --since="1 day ago" --oneline | wc -l)
echo "   📊 Commits today: $commits_today"

echo ""
echo "✅ Development standards check complete!"
echo ""
EOF

chmod +x scripts/dev-check.sh

echo "💡 Bonus: Created scripts/dev-check.sh for quick standards verification"
echo "   Run: ./scripts/dev-check.sh"
echo ""
echo "🎯 Happy disciplined development! 🚀" 