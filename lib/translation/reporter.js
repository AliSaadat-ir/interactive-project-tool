// === ENHANCED TRANSLATION REPORTER ===
// lib/translation/reporter.js

const fs = require('fs');
const path = require('path');
const { print } = require('../core/terminal');

class TranslationReporter {
  constructor() {
    this.reportFormats = ['markdown', 'json', 'html', 'csv'];
  }

  // Generate comprehensive report
  async generateReport(analysis, projectRoot, scanResult = null, settings = {}) {
    const { formatDateTimeForDisplay } = require('../utils/date');
    const timestamp = formatDateTimeForDisplay();
    const reportData = this.buildReportData(analysis, timestamp, scanResult);
    
    const format = settings.translationReportFormat || 'both';
    const generatedReports = {};
    
    // Generate reports based on settings
    if (format === 'markdown' || format === 'both') {
      const mdReport = this.generateMarkdownReport(reportData);
      const mdPath = path.join(projectRoot, 'translation-report.md');
      fs.writeFileSync(mdPath, mdReport, 'utf8');
      generatedReports.markdown = mdPath;
    }
    
    if (format === 'json' || format === 'both') {
      const jsonPath = path.join(projectRoot, 'translation-report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), 'utf8');
      generatedReports.json = jsonPath;
    }
    
    // Always generate HTML for better visualization
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlPath = path.join(projectRoot, 'translation-report.html');
    fs.writeFileSync(htmlPath, htmlReport, 'utf8');
    generatedReports.html = htmlPath;
    
    // Generate CSV for data analysis
    const csvReport = this.generateCSVReport(reportData);
    const csvPath = path.join(projectRoot, 'translation-report.csv');
    fs.writeFileSync(csvPath, csvReport, 'utf8');
    generatedReports.csv = csvPath;
    
    print('\n✅ Reports generated:', 'green');
    Object.entries(generatedReports).forEach(([format, path]) => {
      print(`   📄 ${format.toUpperCase()}: ${path}`, 'cyan');
    });
    
    return generatedReports;
  }

  // Build comprehensive report data structure
  buildReportData(analysis, timestamp, scanResult) {
    const report = {
      generated: timestamp,
      projectInfo: {
        totalKeysInUse: analysis.totalUsedKeys,
        totalUniqueKeys: analysis.totalUniqueKeys,
        keysOnlyInCode: analysis.keysOnlyInCode.size,
        keysOnlyInFiles: analysis.keysOnlyInFiles.size,
        inconsistentKeys: analysis.inconsistentKeys.length,
        languages: Object.keys(analysis.languageStats),
        healthScore: this.calculateHealthScore(analysis)
      },
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
        inconsistentKeys: analysis.inconsistentKeys,
        emptyTranslations: this.findEmptyTranslations(analysis),
        duplicateTranslations: this.findDuplicateTranslations(analysis)
      },
      coverage: {},
      metrics: {
        averageCoverage: 0,
        completedLanguages: 0,
        totalMissingTranslations: 0,
        translationProgress: {}
      },
      recommendations: []
    };
    
    // Add language-specific data
    let totalCoverage = 0;
    let totalMissing = 0;
    
    for (const [lang, stats] of Object.entries(analysis.languageStats)) {
      const coverage = parseFloat(stats.coverage);
      totalCoverage += coverage;
      totalMissing += stats.missing;
      
      report.languages[lang] = {
        totalKeys: stats.total,
        missingKeys: stats.missing,
        missingKeysList: stats.missingKeys || [],
        coverage: coverage,
        status: stats.missing === 0 ? 'complete' : 'incomplete',
        completedKeys: stats.total - stats.missing,
        emptyKeys: this.countEmptyKeys(lang, stats),
        quality: this.assessLanguageQuality(stats)
      };
      
      report.coverage[lang] = coverage;
      report.metrics.translationProgress[lang] = {
        completed: stats.total - stats.missing,
        total: analysis.totalUniqueKeys,
        percentage: coverage
      };
      
      if (stats.missing === 0) {
        report.metrics.completedLanguages++;
      }
    }
    
    // Calculate metrics
    report.metrics.averageCoverage = totalCoverage / Object.keys(analysis.languageStats).length;
    report.metrics.totalMissingTranslations = totalMissing;
    
    // Add scan result data if available
    if (scanResult) {
      report.fallbackTexts = scanResult.fallbackTexts;
      report.keyUsage = {};
      report.mostUsedKeys = [];
      report.leastUsedKeys = [];
      
      const usageArray = [];
      for (const [key, locations] of scanResult.keyUsageMap) {
        const usage = {
          key,
          count: locations.length,
          locations: locations
        };
        report.keyUsage[key] = usage;
        usageArray.push(usage);
      }
      
      // Sort by usage
      usageArray.sort((a, b) => b.count - a.count);
      report.mostUsedKeys = usageArray.slice(0, 10);
      report.leastUsedKeys = usageArray.filter(u => u.count === 1).slice(0, 10);
    }
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);
    
    return report;
  }

  // Calculate health score
  calculateHealthScore(analysis) {
    let score = 100;
    
    // Deduct for missing keys in code
    score -= analysis.keysOnlyInCode.size * 5;
    
    // Deduct for unused keys
    score -= analysis.keysOnlyInFiles.size * 2;
    
    // Deduct for inconsistent keys
    score -= analysis.inconsistentKeys.length * 3;
    
    // Deduct for incomplete languages
    const incompleteLangs = Object.values(analysis.languageStats)
      .filter(stats => stats.missing > 0).length;
    score -= incompleteLangs * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Find empty translations
  findEmptyTranslations(analysis) {
    const emptyTranslations = {};
    
    for (const [lang, stats] of Object.entries(analysis.languageStats)) {
      if (stats.keys) {
        const empty = Array.from(stats.keys).filter(key => {
          // This would need actual translation content check
          return false; // Placeholder
        });
        if (empty.length > 0) {
          emptyTranslations[lang] = empty;
        }
      }
    }
    
    return emptyTranslations;
  }

  // Find duplicate translations
  findDuplicateTranslations(analysis) {
    const duplicates = {};
    
    // This would analyze translation values for duplicates
    // Placeholder implementation
    
    return duplicates;
  }

  // Count empty keys
  countEmptyKeys(lang, stats) {
    // Placeholder - would need actual translation content
    return 0;
  }

  // Assess language quality
  assessLanguageQuality(stats) {
    if (stats.missing === 0) return 'excellent';
    if (stats.missing <= 5) return 'good';
    if (stats.missing <= 20) return 'fair';
    return 'poor';
  }

  // Generate recommendations
  generateRecommendations(data) {
    const recommendations = [];
    
    if (data.summary.keysOnlyInCode > 0) {
      recommendations.push({
        type: 'error',
        priority: 'high',
        message: `Add ${data.summary.keysOnlyInCode} undefined keys to translation files`,
        action: 'Run sync to add missing keys',
        impact: 'Critical - application may show translation keys instead of text'
      });
    }
    
    if (data.summary.keysOnlyInFiles > 0) {
      recommendations.push({
        type: 'warning',
        priority: 'medium',
        message: `Remove ${data.summary.keysOnlyInFiles} unused keys from translation files`,
        action: 'Run cleanup to remove unused keys',
        impact: 'Medium - reduces file size and maintenance overhead'
      });
    }
    
    const needsTranslation = Object.values(data.languages)
      .filter(info => info.missingKeys > 0);
    
    if (needsTranslation.length > 0) {
      const totalMissing = needsTranslation.reduce((sum, info) => sum + info.missingKeys, 0);
      recommendations.push({
        type: 'warning',
        priority: 'high',
        message: `Translate ${totalMissing} missing translations across ${needsTranslation.length} languages`,
        action: 'Run sync with translation API configured',
        impact: 'High - incomplete translations affect user experience'
      });
    }
    
    if (data.summary.inconsistentKeys > 0) {
      recommendations.push({
        type: 'error',
        priority: 'high',
        message: `Fix ${data.summary.inconsistentKeys} inconsistent keys`,
        action: 'Run sync to fix inconsistencies',
        impact: 'High - causes runtime errors in some languages'
      });
    }
    
    if (data.metrics.averageCoverage < 90) {
      recommendations.push({
        type: 'info',
        priority: 'low',
        message: `Improve translation coverage (currently ${data.metrics.averageCoverage.toFixed(1)}%)`,
        action: 'Focus on languages with lowest coverage',
        impact: 'Low - affects completeness metrics'
      });
    }
    
    // Add language-specific recommendations
    for (const [lang, info] of Object.entries(data.languages)) {
      if (info.quality === 'poor') {
        recommendations.push({
          type: 'warning',
          priority: 'medium',
          message: `${lang.toUpperCase()} translation quality is poor (${info.missingKeys} missing)`,
          action: `Focus on completing ${lang} translations`,
          impact: 'Medium - affects users of this language'
        });
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        priority: 'none',
        message: 'All translations are complete and consistent!',
        action: 'No action required',
        impact: 'None - system is healthy'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2, none: 3 };
      return priority[a.priority] - priority[b.priority];
    });
  }

  // Generate enhanced Markdown report
  generateMarkdownReport(data) {
    const lines = [];
    
    // Header
    lines.push('# 📋 Translation Analysis Report');
    lines.push(`Generated: ${data.generated}`);
    lines.push('');
    
    // Health Score
    const healthEmoji = data.projectInfo.healthScore >= 80 ? '💚' : 
                       data.projectInfo.healthScore >= 60 ? '💛' : '❤️';
    lines.push(`## ${healthEmoji} Project Health: ${data.projectInfo.healthScore}/100`);
    lines.push('');
    
    // Executive Summary
    lines.push('## 📊 Executive Summary');
    lines.push(`- **Keys in use**: ${data.summary.totalKeysInUse}`);
    lines.push(`- **Total unique keys**: ${data.summary.totalUniqueKeys}`);
    lines.push(`- **Undefined keys**: ${data.summary.keysOnlyInCode} ⚠️`);
    lines.push(`- **Unused keys**: ${data.summary.keysOnlyInFiles}`);
    lines.push(`- **Inconsistent keys**: ${data.summary.inconsistentKeys}`);
    lines.push(`- **Languages**: ${data.summary.languages.join(', ')}`);
    lines.push(`- **Average coverage**: ${data.metrics.averageCoverage.toFixed(1)}%`);
    lines.push(`- **Completed languages**: ${data.metrics.completedLanguages}/${data.summary.languages.length}`);
    lines.push('');
    
    // Recommendations
    if (data.recommendations.length > 0) {
      lines.push('## 🎯 Recommendations');
      
      const byPriority = {
        high: data.recommendations.filter(r => r.priority === 'high'),
        medium: data.recommendations.filter(r => r.priority === 'medium'),
        low: data.recommendations.filter(r => r.priority === 'low'),
        none: data.recommendations.filter(r => r.priority === 'none')
      };
      
      if (byPriority.high.length > 0) {
        lines.push('### 🔴 High Priority');
        byPriority.high.forEach(rec => {
          lines.push(`- **${rec.message}**`);
          lines.push(`  - Action: ${rec.action}`);
          lines.push(`  - Impact: ${rec.impact}`);
        });
        lines.push('');
      }
      
      if (byPriority.medium.length > 0) {
        lines.push('### 🟡 Medium Priority');
        byPriority.medium.forEach(rec => {
          lines.push(`- **${rec.message}**`);
          lines.push(`  - Action: ${rec.action}`);
          lines.push(`  - Impact: ${rec.impact}`);
        });
        lines.push('');
      }
      
      if (byPriority.low.length > 0) {
        lines.push('### 🟢 Low Priority');
        byPriority.low.forEach(rec => {
          lines.push(`- ${rec.message}`);
          lines.push(`  - Action: ${rec.action}`);
        });
        lines.push('');
      }
    }
    
    // Language Coverage
    lines.push('## 🌍 Language Coverage');
    lines.push('| Language | Total Keys | Missing | Coverage | Status | Quality |');
    lines.push('|----------|------------|---------|----------|--------|---------|');
    
    for (const [lang, info] of Object.entries(data.languages)) {
      const status = info.status === 'complete' ? '✅' : '⚠️';
      const qualityEmoji = {
        excellent: '⭐⭐⭐',
        good: '⭐⭐',
        fair: '⭐',
        poor: '❌'
      };
      lines.push(`| ${lang.toUpperCase()} | ${info.totalKeys} | ${info.missingKeys} | ${info.coverage}% | ${status} | ${qualityEmoji[info.quality] || '?'} |`);
    }
    lines.push('');
    
    // Translation Progress Chart
    lines.push('## 📈 Translation Progress');
    lines.push('```');
    for (const [lang, progress] of Object.entries(data.metrics.translationProgress)) {
      const filled = Math.round(progress.percentage / 5);
      const empty = 20 - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      lines.push(`${lang.toUpperCase().padEnd(3)} [${bar}] ${progress.percentage.toFixed(1)}% (${progress.completed}/${progress.total})`);
    }
    lines.push('```');
    lines.push('');
    
    // Key Usage Statistics
    if (data.mostUsedKeys && data.mostUsedKeys.length > 0) {
      lines.push('## 📊 Key Usage Statistics');
      lines.push('### Most Used Keys');
      lines.push('| Key | Usage Count | Locations |');
      lines.push('|-----|-------------|-----------|');
      data.mostUsedKeys.forEach(key => {
        const locations = key.locations.slice(0, 3).map(l => `${l.file}:${l.line}`).join(', ');
        const more = key.locations.length > 3 ? ` (+${key.locations.length - 3} more)` : '';
        lines.push(`| ${key.key} | ${key.count} | ${locations}${more} |`);
      });
      lines.push('');
    }
    
    // Issues Section
    if (data.issues.keysOnlyInCode.length > 0) {
      lines.push('## ❌ Keys Only in Code');
      lines.push('These keys are used in your code but not defined in any translation file:');
      lines.push('');
      lines.push('| Key | Fallback Text | Suggested Action |');
      lines.push('|-----|---------------|------------------|');
      
      for (const key of data.issues.keysOnlyInCode) {
        const fallback = data.fallbackTexts && data.fallbackTexts[key] 
          ? `"${data.fallbackTexts[key]}"` 
          : 'No fallback';
        lines.push(`| ${key} | ${fallback} | Add to translation files |`);
      }
      lines.push('');
    }
    
    if (data.issues.keysOnlyInFiles.length > 0) {
      lines.push('## ⚠️ Unused Keys');
      lines.push('These keys exist in translation files but are not used in code:');
      lines.push('');
      
      lines.push('| Key | Languages | Suggested Action |');
      lines.push('|-----|-----------|------------------|');
      for (const key of data.issues.keysOnlyInFiles) {
        const langs = Object.keys(data.languages).filter(lang => {
          const langData = data.languages[lang];
          return !langData.missingKeysList.includes(key);
        }).join(', ');
        lines.push(`| ${key} | ${langs} | Remove or use in code |`);
      }
      lines.push('');
    }
    
    if (data.issues.inconsistentKeys.length > 0) {
      lines.push('## 🔄 Inconsistent Keys');
      lines.push('These keys exist in some languages but not all:');
      lines.push('');
      
      lines.push('| Key | Exists In | Missing In | Action |');
      lines.push('|-----|-----------|------------|--------|');
      for (const item of data.issues.inconsistentKeys) {
        lines.push(`| ${item.key} | ${item.existsIn.join(', ')} | ${item.missingIn.join(', ')} | Sync all languages |`);
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
        
        lines.push(`### ${lang.toUpperCase()} (${info.missingKeysList.length} missing)`);
        lines.push('');
        
        // Group by first part of key for better organization
        const grouped = {};
        info.missingKeysList.forEach(key => {
          const prefix = key.split(/[._]/)[0];
          if (!grouped[prefix]) grouped[prefix] = [];
          grouped[prefix].push(key);
        });
        
        Object.entries(grouped).forEach(([prefix, keys]) => {
          lines.push(`**${prefix}:**`);
          keys.forEach(key => lines.push(`- ${key}`));
          lines.push('');
        });
      }
    }
    
    // Quick Actions
    lines.push('## 🚀 Quick Actions');
    lines.push('');
    lines.push('```bash');
    lines.push('# Fix all issues automatically');
    lines.push('project-tool --sync');
    lines.push('');
    lines.push('# Check current status');
    lines.push('project-tool --check');
    lines.push('');
    lines.push('# Add missing translations only');
    lines.push('project-tool');
    lines.push('# Then select: Manage Translations > Add Missing Translations');
    lines.push('```');
    lines.push('');
    
    // Footer
    lines.push('---');
    lines.push('Generated by Project Tool v4.3.0');
    lines.push('📚 [Documentation](https://github.com/AliSaadat-ir/interactive-project-tool)');
    
    return lines.join('\n');
  }

  // Generate HTML report
  generateHTMLReport(data) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translation Report - ${data.generated}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .health-score {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .health-good { background: #d4edda; color: #155724; }
        .health-warning { background: #fff3cd; color: #856404; }
        .health-danger { background: #f8d7da; color: #721c24; }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        .stat-value { font-size: 32px; font-weight: bold; color: #3498db; }
        .stat-label { color: #6c757d; margin-top: 5px; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th { background: #f8f9fa; font-weight: 600; }
        tr:hover { background: #f8f9fa; }
        .progress-bar {
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            height: 20px;
            margin: 5px 0;
        }
        .progress-fill {
            background: #3498db;
            height: 100%;
            transition: width 0.3s;
        }
        .recommendation {
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid;
        }
        .rec-high { background: #f8d7da; border-color: #dc3545; }
        .rec-medium { background: #fff3cd; border-color: #ffc107; }
        .rec-low { background: #d1ecf1; border-color: #17a2b8; }
        .rec-success { background: #d4edda; border-color: #28a745; }
        .tag {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin: 2px;
        }
        .tag-complete { background: #d4edda; color: #155724; }
        .tag-incomplete { background: #fff3cd; color: #856404; }
        .key-usage {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .usage-count {
            background: #e9ecef;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
            body { padding: 10px; }
            .container { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Translation Analysis Report</h1>
        <p>Generated: ${data.generated}</p>
        
        <div class="health-score ${data.projectInfo.healthScore >= 80 ? 'health-good' : data.projectInfo.healthScore >= 60 ? 'health-warning' : 'health-danger'}">
            Health Score: ${data.projectInfo.healthScore}/100
        </div>
        
        <h2>📊 Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${data.summary.totalUniqueKeys}</div>
                <div class="stat-label">Total Keys</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.languages.length}</div>
                <div class="stat-label">Languages</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.metrics.averageCoverage.toFixed(1)}%</div>
                <div class="stat-label">Average Coverage</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.metrics.completedLanguages}</div>
                <div class="stat-label">Completed Languages</div>
            </div>
        </div>
        
        ${data.recommendations.length > 0 ? `
        <h2>🎯 Recommendations</h2>
        ${data.recommendations.map(rec => `
        <div class="recommendation rec-${rec.priority}">
            <strong>${rec.message}</strong><br>
            <small>Action: ${rec.action}</small>
        </div>
        `).join('')}
        ` : ''}
        
        <h2>🌍 Language Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Language</th>
                    <th>Progress</th>
                    <th>Coverage</th>
                    <th>Status</th>
                    <th>Missing Keys</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(data.languages).map(([lang, info]) => `
                <tr>
                    <td><strong>${lang.toUpperCase()}</strong></td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${info.coverage}%"></div>
                        </div>
                    </td>
                    <td>${info.coverage}%</td>
                    <td>
                        <span class="tag tag-${info.status}">${info.status}</span>
                    </td>
                    <td>${info.missingKeys}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        ${data.mostUsedKeys && data.mostUsedKeys.length > 0 ? `
        <h2>📊 Most Used Keys</h2>
        <table>
            <thead>
                <tr>
                    <th>Key</th>
                    <th>Usage Count</th>
                    <th>First Location</th>
                </tr>
            </thead>
            <tbody>
                ${data.mostUsedKeys.map(key => `
                <tr>
                    <td class="key-usage">
                        <code>${key.key}</code>
                        <span class="usage-count">${key.count}x</span>
                    </td>
                    <td>${key.count}</td>
                    <td><small>${key.locations[0].file}:${key.locations[0].line}</small></td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}
        
        <h2>🚀 Quick Actions</h2>
        <pre style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
# Fix all issues automatically
project-tool --sync

# Check current status
project-tool --check

# Open interactive mode
project-tool
        </pre>
    </div>
</body>
</html>`;
    
    return html;
  }

  // Generate CSV report
  generateCSVReport(data) {
    const lines = [];
    
    // Header
    lines.push('Category,Metric,Value');
    
    // Summary metrics
    lines.push(`Summary,Total Keys,${data.summary.totalUniqueKeys}`);
    lines.push(`Summary,Keys in Use,${data.summary.totalKeysInUse}`);
    lines.push(`Summary,Undefined Keys,${data.summary.keysOnlyInCode}`);
    lines.push(`Summary,Unused Keys,${data.summary.keysOnlyInFiles}`);
    lines.push(`Summary,Inconsistent Keys,${data.summary.inconsistentKeys}`);
    lines.push(`Summary,Languages,${data.summary.languages.length}`);
    lines.push(`Summary,Health Score,${data.projectInfo.healthScore}`);
    lines.push(`Summary,Average Coverage,${data.metrics.averageCoverage.toFixed(1)}%`);
    
    // Language details
    lines.push('');
    lines.push('Language,Total Keys,Missing Keys,Coverage,Status,Quality');
    
    for (const [lang, info] of Object.entries(data.languages)) {
      lines.push(`${lang},${info.totalKeys},${info.missingKeys},${info.coverage}%,${info.status},${info.quality}`);
    }
    
    // Missing translations
    if (Object.values(data.languages).some(info => info.missingKeysList?.length > 0)) {
      lines.push('');
      lines.push('Language,Missing Key');
      
      for (const [lang, info] of Object.entries(data.languages)) {
        if (info.missingKeysList?.length > 0) {
          info.missingKeysList.forEach(key => {
            lines.push(`${lang},${key}`);
          });
        }
      }
    }
    
    // Key usage
    if (data.keyUsage) {
      lines.push('');
      lines.push('Key,Usage Count,First File,First Line');
      
      Object.entries(data.keyUsage).forEach(([key, usage]) => {
        const firstLoc = usage.locations[0];
        lines.push(`${key},${usage.count},${firstLoc.file},${firstLoc.line}`);
      });
    }
    
    return lines.join('\n');
  }

  // Generate console summary
  generateConsoleSummary(analysis) {
    const lines = [];
    
    lines.push('📊 Quick Summary:');
    lines.push(`  Health Score: ${this.calculateHealthScore(analysis)}/100`);
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
      incomplete.forEach(([lang, stats]) => {
        lines.push(`     - ${lang}: ${stats.missing} missing (${stats.coverage}% complete)`);
      });
    } else {
      lines.push('  ✅ All languages complete');
    }
    
    return lines.join('\n');
  }
}

module.exports = TranslationReporter;