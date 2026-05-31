# Anything Mobile — Project Conventions

## Code Cleanup Rules

When removing a module or feature, always check and clean up these artifacts:

### 1. Polyfill files
- `polyfills/native/<module>.native.*`
- `polyfills/web/<module>.web.*`
- `polyfills/shared/<module>.*`

### 2. Metro config aliases
- `metro.config.js`: `WEB_ALIASES`, `NATIVE_ALIASES`, `SHARED_ALIASES`, `DEV_ONLY_NATIVE_ALIASES` and their resolve logic

### 3. Config references
- `app.json` — remove from `plugins` array
- `eas.json` — remove any build-specific overrides
- `patches/` — remove related patch-package patches if the package is removed

### 4. Dependencies
- `package.json` — remove unused `dependencies` / `devDependencies`
- Run `npm ls <pkg>` to confirm nothing else depends on it

### 5. Dead imports
- After deleting a file, run `rg "from '@/utils/<deleted-file>'"` (or `Select-String`) to find remaining imports
- After deleting a route, check that no `router.push` / `Link` still references it

### 6. Test files
- Delete `*.test.*` / `*.spec.*` files for removed modules

### 7. Duplicate directories
- Check for parallel dirs like `src/__create/` vs `__create/` that may have duplicate files

### 8. Verify cleanup
1. `git status` to review all changed/deleted files
2. `npx tsc --noEmit` to check no import errors remain (if tsc is available)
3. Confirm no `grep -r "oldModuleName"` matches remain
