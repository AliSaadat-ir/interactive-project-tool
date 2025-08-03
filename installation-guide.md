# Translation Tool v3.0 - Installation & Usage Guide

## 🚀 Installation

### Step 1: Create the Tool Structure
```bash
# Create a new directory for the tool
mkdir translation-tool
cd translation-tool

# Create the directory structure
mkdir -p lib/core lib/translation lib/export-import lib/utils bin
```

### Step 2: Copy All Files
Copy all the provided files to their respective directories:
- `index.js` → root directory
- `package.json` → root directory
- `lib/core/menu.js`
- `lib/core/terminal.js`
- `lib/translation/manager.js`
- `lib/translation/synchronizer.js`
- `lib/translation/scanner.js`
- `lib/translation/translator.js`
- (and other files as needed)

### Step 3: Create the Binary File
Create `bin/translation-tool.js`:
```javascript
#!/usr/bin/env node
require('../index.js');
```

Make it executable:
```bash
chmod +x bin/translation-tool.js
```

### Step 4: Install Globally
```bash
npm install -g .
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in your project root (where you'll run the tool):
```env
# OpenAI API Key (recommended for best translations)
OPENAI_API_KEY=sk-your-api-key-here

# Google Translate API Key (optional)
# GOOGLE_TRANSLATE_API_KEY=your-google-key-here
```

## 📖 Usage

### Basic Commands

```bash
# Run interactive mode
translation-tool

# Quick sync all translations
translation-tool --sync

# Check consistency
translation-tool --check

# Show help
translation-tool --help
```

### Interactive Mode Features

1. **🔄 Full Synchronization** (Recommended)
   - Syncs all language files to have identical keys
   - Updates types.ts automatically
   - Removes unused keys
   - Adds missing translations

2. **➕ Add Missing Translations**
   - Only adds missing translations without removing anything

3. **🗑️ Remove Unused Keys**
   - Removes keys not found in code from all files

4. **📊 Generate Report**
   - Creates detailed translation analysis

## 🎯 Key Features

### 1. English Text Change Detection
When you change English text or fallback:
```typescript
// Before:
{t.welcomeTitle || 'Welcome'}

// After:
{t.welcomeTitle || 'Welcome to Our App'}
```
The tool will:
- Update the English file
- Mark all other languages for retranslation
- Update all language files with new translations

### 2. Perfect Synchronization
- All language files will have exactly the same keys
- types.ts will match exactly
- No missing or extra keys

### 3. Smart Key Detection
Detects various patterns:
```javascript
t.someKey
t['someKey']
t["someKey"]
t.someKey || 'Fallback'
{t.someKey || 'Fallback Text'}
$t.someKey
$t('someKey')
```

## 🔍 Example Workflow

### Initial Setup
```bash
cd /path/to/your/dubai-estate-ai-main-next
translation-tool --sync
```

### After Adding New Features
```typescript
// You add new component with:
<h1>{t.newFeature || 'New Feature'}</h1>
<p>{t.featureDescription || 'This is amazing'}</p>
```

Run:
```bash
translation-tool --sync
```

Result:
- Adds `newFeature` and `featureDescription` to all language files
- Updates types.ts
- Translates to all languages

### After Removing Features
```bash
translation-tool --sync
```
- Removes unused keys from all files
- Keeps everything in sync

## 📊 File Structure After Sync

```
lib/translations/
├── types.ts          # Always in sync with exact keys
└── languages/
    ├── en.ts        # Always has all keys with English text
    ├── ar.ts        # Always has all keys with Arabic translations
    ├── es.ts        # Always has all keys with Spanish translations
    └── fr.ts        # Always has all keys with French translations
```

## ⚠️ Important Notes

1. **Always Use --sync**: For best results, use `translation-tool --sync` instead of individual operations

2. **Backup First**: Always commit your changes before running sync operations

3. **Review Translations**: AI translations are good but may need manual review for context

4. **Consistent Fallbacks**: Use consistent fallback texts as they become the English translations

## 🐛 Troubleshooting

### "Property 'X' is missing in type" Error
Run: `translation-tool --sync`

### Different Key Counts in Language Files
Run: `translation-tool --sync`

### English File Not Updating
Make sure your fallback texts are properly formatted:
```javascript
// Correct:
{t.key || 'Text'}

// Incorrect:
{t.key}  // No fallback
```

### API Rate Limits
- The tool automatically handles rate limits
- For large projects, sync may take a few minutes

## 📝 Best Practices

1. **Run Sync Regularly**: After every feature addition/removal
2. **Use Meaningful Keys**: `userProfile.editButton` not `btn1`
3. **Always Include Fallbacks**: Better UX during development
4. **Commit Before Sync**: Easy to review changes
5. **Review AI Translations**: Especially for critical UI text

## 🚨 Emergency Commands

```bash
# Check what's wrong
translation-tool --check

# Force full resync
translation-tool --sync

# Generate report to see issues
translation-tool
# Then select: Generate Report
```