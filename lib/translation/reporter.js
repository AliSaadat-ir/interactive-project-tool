// === ENHANCED TRANSLATION REPORTER ===
// lib/translation/reporter.js

const fs = require('fs');
const path = require('path');
const { print } = require('../core/terminal');
const { getReportFilename } = require('../utils/date');

class TranslationReporter {
  constructor() {
    this.reportFormats = ['markdown', 'json', 'html', 'csv'];
  }

  // Generate comprehensive report
  async generateReport(analysis, projectRoot, scanResult = null, settings = {}) {
    const reportData = this.buildReportData(analysis, new Date().toISOString(), scanResult);
    
    const format = settings.translationReportFormat || 'both';
    const generatedReports = {};
    
    // Generate reports based on settings
    if (format === 'markdown' || format === 'both') {
      const mdReport = this.generateMarkdownReport(reportData);
      const mdPath = path.join(projectRoot, getReportFilename('translation-report', 'md'));
      fs.writeFileSync(mdPath, mdReport, 'utf8');
      generatedReports.markdown = mdPath;
    }
    
    if (format === 'json' || format === 'both') {
      const jsonPath = path.join(projectRoot, getReportFilename('translation-report', 'json'));
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
      generatedReports.json = jsonPath;
    }
    
    // Always generate HTML for better visualization
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlPath = path.join(projectRoot, getReportFilename('translation-report', 'html'));
    fs.writeFileSync(htmlPath, htmlReport, 'utf8');
    generatedReports.html = htmlPath;
    
    // Generate CSV for data analysis
    const csvReport = this.generateCSVReport(reportData);
    const csvPath = path.join(projectRoot, getReportFilename('translation-report', 'csv'));
    fs.writeFileSync(csvPath, csvReport, 'utf8');
    generatedReports.csv = csvPath;
    
    print('\n✅ Reports generated:', 'green');
    Object.entries(generatedReports).forEach(([format, filePath]) => {
      print(`   📄 ${format.toUpperCase()}: ${filePath}`, 'cyan');
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

  // Generate Enhanced HTML report with auto-open capability
  generateHTMLReport(data) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translation Report - ${new Date().toLocaleDateString()}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #24292e;
            background: #f6f8fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 16px;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .health-score {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            position: relative;
            overflow: hidden;
        }
        
        .health-score-circle {
            width: 200px;
            height: 200px;
            margin: 0 auto 1rem;
            position: relative;
        }
        
        .health-score-circle svg {
            transform: rotate(-90deg);
        }
        
        .health-score-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: bold;
        }
        
        .health-good { color: #28a745; }
        .health-warning { color: #ffc107; }
        .health-danger { color: #dc3545; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 30px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #6c757d;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        
        .section h2 {
            color: #24292e;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e1e4e8;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e1e4e8;
        }
        
        th {
            background: #f6f8fa;
            font-weight: 600;
            color: #24292e;
        }
        
        tr:hover {
            background: #f6f8fa;
        }
        
        .progress-bar {
            background: #e1e4e8;
            border-radius: 10px;
            overflow: hidden;
            height: 24px;
            position: relative;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            transition: width 0.3s ease;
            position: relative;
        }
        
        .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-weight: 600;
            font-size: 0.85rem;
        }
        
        .recommendation {
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            border-left: 4px solid;
            background: #f6f8fa;
        }
        
        .rec-high {
            border-color: #dc3545;
            background: #fee;
        }
        
        .rec-medium {
            border-color: #ffc107;
            background: #fffbeb;
        }
        
        .rec-low {
            border-color: #17a2b8;
            background: #e7f5ff;
        }
        
        .rec-success {
            border-color: #28a745;
            background: #d4edda;
        }
        
        .tag {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            margin: 2px;
        }
        
        .tag-complete {
            background: #d4edda;
            color: #155724;
        }
        
        .tag-incomplete {
            background: #fff3cd;
            color: #856404;
        }
        
        .key-usage {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .usage-count {
            background: #e1e4e8;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .chart-container {
            margin: 2rem 0;
        }
        
        .language-card {
            background: #f6f8fa;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .language-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .language-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #24292e;
        }
        
        .quick-actions {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            padding: 2rem;
            margin-top: 2rem;
        }
        
        .quick-actions h3 {
            margin-bottom: 1rem;
        }
        
        .action-button {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-right: 1rem;
            margin-bottom: 1rem;
            transition: transform 0.2s ease;
        }
        
        .action-button:hover {
            transform: scale(1.05);
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .container {
                padding: 10px;
            }
            
            .header {
                padding: 1.5rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header fade-in">
            <h1>📋 Translation Analysis Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="health-score fade-in">
            <div class="health-score-circle">
                <svg width="200" height="200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#e1e4e8" stroke-width="20"/>
                    <circle cx="100" cy="100" r="90" fill="none" 
                            stroke="${data.projectInfo.healthScore >= 80 ? '#28a745' : data.projectInfo.healthScore >= 60 ? '#ffc107' : '#dc3545'}" 
                            stroke-width="20"
                            stroke-dasharray="${data.projectInfo.healthScore * 5.65} 565"
                            stroke-linecap="round"/>
                </svg>
                <div class="health-score-text ${data.projectInfo.healthScore >= 80 ? 'health-good' : data.projectInfo.healthScore >= 60 ? 'health-warning' : 'health-danger'}">
                    ${data.projectInfo.healthScore}
                </div>
            </div>
            <h2>Project Health Score</h2>
            <p>Based on translation completeness, consistency, and usage</p>
        </div>
        
        <div class="stats-grid fade-in">
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
        <div class="section fade-in">
            <h2>🎯 Recommendations</h2>
            ${data.recommendations.map(rec => `
            <div class="recommendation rec-${rec.priority}">
                <strong>${rec.message}</strong><br>
                <small>Action: ${rec.action}</small>
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="section fade-in">
            <h2>🌍 Language Coverage</h2>
            ${Object.entries(data.languages).map(([lang, info]) => `
            <div class="language-card">
                <div class="language-header">
                    <span class="language-name">${lang.toUpperCase()}</span>
                    <span class="tag ${info.status === 'complete' ? 'tag-complete' : 'tag-incomplete'}">
                        ${info.status}
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${info.coverage}%">
                        <span class="progress-text">${info.coverage}%</span>
                    </div>
                </div>
                <div style="margin-top: 0.5rem; color: #6c757d;">
                    ${info.totalKeys} keys • ${info.missingKeys} missing
                </div>
            </div>
            `).join('')}
        </div>
        
        ${data.mostUsedKeys && data.mostUsedKeys.length > 0 ? `
        <div class="section fade-in">
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
        </div>
        ` : ''}
        
        <div class="quick-actions fade-in">
            <h3>🚀 Quick Actions</h3>
            <a href="#" class="action-button" onclick="alert('Run: project-tool --sync')">Fix All Issues</a>
            <a href="#" class="action-button" onclick="alert('Run: project-tool --check')">Check Status</a>
            <a href="#" class="action-button" onclick="alert('Run: project-tool')">Open Interactive Mode</a>
        </div>
    </div>
    
    <script>
        // Animate progress bars on load
        window.addEventListener('load', () => {
            const progressBars = document.querySelectorAll('.progress-fill');
            progressBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        });
        
        // Add fade-in animation to elements
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        });
        
        document.querySelectorAll('.section, .stat-card').forEach(el => {
            observer.observe(el);
        });
    </script>
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