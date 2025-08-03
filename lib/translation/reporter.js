// === TRANSLATION REPORTER ===
// Generates detailed translation reports

const fs = require('fs');
const path = require('path');
const { print } = require('../core/terminal');

class TranslationReporter {
  constructor() {
    this.reportFormats = ['markdown', 'json'];
  }

// Generate comprehensive report
  async generateReport(analysis, projectRoot, scanResult = null) {
    const { formatDateTimeForDisplay } = require('../utils/date');
    const timestamp = formatDateTimeForDisplay();
    const reportData = this.buildReportData(analysis, timestamp, scanResult);
    
    // Generate Markdown report
    const mdReport = this.generateMarkdownReport(reportData);
    const mdPath = path.join(projectRoot, 'translation-report.md');
    fs.writeFileSync(mdPath, mdReport, 'utf8');
    
    // Generate JSON report
    const jsonPath = path.join(projectRoot, 'translation-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), 'utf8');
    
    print('\n✅ Reports generated:', 'green');
    print(`   📄 ${mdPath}`, 'cyan');
    print(`   📄 ${jsonPath}`, 'cyan');
    
    return { markdown: mdPath, json: jsonPath };
  }

  // Build report data structure
  buildReportData(analysis, timestamp, scanResult) {
    const report = {
      generated: timestamp,
      summary: {
        totalKeysInUse: analysis.totalUsedKeys,
        totalUniqueKeys: analysis.totalUniqueKeys,
        keysOnlyInCode: analysis.keysOnlyInCode.size,
        keysOnlyInFiles: analysis.keysOnlyInFiles.size,
        inconsistentKeys: analysis.inconsistentKeys.length,
        languages: Object.keys(analysis.languageStats)
      },
      languages: {},
      issues: {
        keysOnlyInCode: Array.from(analysis.keysOnlyInCode),
        keysOnlyInFiles: Array.from(analysis.keysOnlyInFiles),
        inconsistentKeys: analysis.inconsistentKeys
      },
      coverage: {}
    };
    
    // Add language-specific data
    for (const [lang, stats] of Object.entries(analysis.languageStats)) {
      report.languages[lang] = {
        totalKeys: stats.total,
        missingKeys: stats.missing,
        missingKeysList: stats.missingKeys || [],
        coverage: parseFloat(stats.coverage),
        status: stats.missing === 0 ? 'complete' : 'incomplete'
      };
      
      report.coverage[lang] = parseFloat(stats.coverage);
    }
    
    // Add scan result data if available
    if (scanResult) {
      report.fallbackTexts = scanResult.fallbackTexts;
      report.keyUsage = {};
      
      for (const [key, locations] of scanResult.keyUsageMap) {
        report.keyUsage[key] = {
          count: locations.length,
          locations: locations
        };
      }
    }
    
    return report;
  }

  // Generate Markdown report
  generateMarkdownReport(data) {
    const lines = [];
    
    // Header
    lines.push('# 📋 Translation Analysis Report');
    lines.push(`Generated: ${data.generated}`);
    lines.push('');
    
    // Summary
    lines.push('## 📊 Summary');
    lines.push(`- **Keys in use**: ${data.summary.totalKeysInUse}`);
    lines.push(`- **Total unique keys**: ${data.summary.totalUniqueKeys}`);
    lines.push(`- **Keys only in code**: ${data.summary.keysOnlyInCode}`);
    lines.push(`- **Keys only in files**: ${data.summary.keysOnlyInFiles}`);
    lines.push(`- **Inconsistent keys**: ${data.summary.inconsistentKeys}`);
    lines.push(`- **Languages**: ${data.summary.languages.join(', ')}`);
    lines.push('');
    
    // Language Coverage
    lines.push('## 🌍 Language Coverage');
    lines.push('| Language | Total Keys | Missing | Coverage | Status |');
    lines.push('|----------|------------|---------|----------|--------|');
    
    for (const [lang, info] of Object.entries(data.languages)) {
      const status = info.status === 'complete' ? '✅ Complete' : '⚠️ Incomplete';
      lines.push(`| ${lang} | ${info.totalKeys} | ${info.missingKeys} | ${info.coverage}% | ${status} |`);
    }
    lines.push('');
    
    // Issues Section
    if (data.issues.keysOnlyInCode.length > 0) {
      lines.push('## ❌ Keys Only in Code');
      lines.push('These keys are used in your code but not defined in any translation file:');
      lines.push('');
      
      for (const key of data.issues.keysOnlyInCode) {
        const fallback = data.fallbackTexts && data.fallbackTexts[key] 
          ? `"${data.fallbackTexts[key]}"` 
          : 'No fallback';
        lines.push(`- **${key}**: ${fallback}`);
      }
      lines.push('');
    }
    
    if (data.issues.keysOnlyInFiles.length > 0) {
      lines.push('## ⚠️ Unused Keys');
      lines.push('These keys exist in translation files but are not used in code:');
      lines.push('');
      
      for (const key of data.issues.keysOnlyInFiles) {
        lines.push(`- ${key}`);
      }
      lines.push('');
    }
    
    if (data.issues.inconsistentKeys.length > 0) {
      lines.push('## 🔄 Inconsistent Keys');
      lines.push('These keys exist in some languages but not all:');
      lines.push('');
      
      for (const item of data.issues.inconsistentKeys) {
        lines.push(`- **${item.key}**`);
        lines.push(`  - Exists in: ${item.existsIn.join(', ')}`);
        lines.push(`  - Missing in: ${item.missingIn.join(', ')}`);
      }
      lines.push('');
    }
    
    // Missing Translations by Language
    let hasMissing = false;
    for (const [lang, info] of Object.entries(data.languages)) {
      if (info.missingKeysList && info.missingKeysList.length > 0) {
        if (!hasMissing) {
          lines.push('## 📝 Missing Translations by Language');
          lines.push('');
          hasMissing = true;
        }
        
        lines.push(`### ${lang.toUpperCase()}`);
        for (const key of info.missingKeysList) {
          lines.push(`- ${key}`);
        }
        lines.push('');
      }
    }
    
    // Recommendations
    lines.push('## 🔧 Recommendations');
    
    const recommendations = [];
    
    if (data.summary.keysOnlyInCode > 0) {
      recommendations.push(`1. Add ${data.summary.keysOnlyInCode} undefined keys to translation files`);
    }
    
    if (data.summary.keysOnlyInFiles > 0) {
      recommendations.push(`2. Remove ${data.summary.keysOnlyInFiles} unused keys from translation files`);
    }
    
    const needsTranslation = Object.values(data.languages)
      .filter(info => info.missingKeys > 0).length;
    
    if (needsTranslation > 0) {
      const totalMissing = Object.values(data.languages)
        .reduce((sum, info) => sum + info.missingKeys, 0);
      recommendations.push(`3. Translate ${totalMissing} missing translations across ${needsTranslation} languages`);
    }
    
    if (data.summary.inconsistentKeys > 0) {
      recommendations.push(`4. Fix ${data.summary.inconsistentKeys} inconsistent keys`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ All translations are complete and consistent!');
    } else {
      recommendations.push('');
      recommendations.push('**Run `translation-tool --sync` to fix all issues automatically**');
    }
    
    lines.push(...recommendations);
    lines.push('');
    
    // Footer
    lines.push('---');
    lines.push('Generated by Translation Tool v3.0');
    
    return lines.join('\n');
  }

  // Generate summary for console output
  generateConsoleSummary(analysis) {
    const lines = [];
    
    lines.push('📊 Quick Summary:');
    lines.push(`  Keys in use: ${analysis.totalUsedKeys}`);
    
    if (analysis.keysOnlyInCode.size > 0) {
      lines.push(`  ❌ Undefined keys: ${analysis.keysOnlyInCode.size}`);
    }
    
    if (analysis.keysOnlyInFiles.size > 0) {
      lines.push(`  ⚠️ Unused keys: ${analysis.keysOnlyInFiles.size}`);
    }
    
    const incomplete = Object.entries(analysis.languageStats)
      .filter(([lang, stats]) => stats.missing > 0);
    
    if (incomplete.length > 0) {
      lines.push(`  🌐 Incomplete languages: ${incomplete.length}`);
    } else {
      lines.push('  ✅ All languages complete');
    }
    
    return lines.join('\n');
  }
}

module.exports = TranslationReporter;