#!/bin/bash
VIOLATIONS=$(grep -r "from.*/features\|from.*@/app\|from.*src/features\|from.*src/app" src /design-system/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if[ -n "$VIOLATIONS"]; then
       echo "ERROR: Design system components must not import from features/ or app/"
       echo "$VIOLATIONS"
       exit 1
fi     

echo "Import boundary check passed!"