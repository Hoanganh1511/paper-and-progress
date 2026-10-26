#!/bin/bash
set -e

echo "Running type check..."
npx tsc --noEmit

echo "Running linter...."
npx eslint . --max-warnings 0

echo "Running formatter check..."
npx prettier --check "src/**/*.{ts,tsx,css,json}"

echo "Running tests..."
npx vitest run

echo "All checks passed!"