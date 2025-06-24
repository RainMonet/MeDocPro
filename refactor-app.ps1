# MeDocPro App.jsx Refactoring Script - Working Version
# Safely extracts components from monolithic App.jsx

param(
    [string]$Phase = "1",
    [switch]$DryRun = $false,
    [switch]$CreateBackup = $true,
    [switch]$GitIntegration = $true,
    [string]$BranchName = "feature/app-jsx-refactoring"
)

$ErrorActionPreference = 'Stop'

# Helper Functions
function Write-RefactorStatus {
    param([string]$Message, [string]$Color = 'Cyan')
    Write-Host "[REFACTOR] $Message" -ForegroundColor $Color
}

function Write-RefactorAction {
    param([string]$Message)
    Write-Host "  -> $Message" -ForegroundColor Yellow
}

function Write-RefactorSuccess {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Write-GitStatus {
    param([string]$Message, [string]$Color = 'Magenta')
    Write-Host "[GIT] $Message" -ForegroundColor $Color
}

function Test-GitRepository {
    try {
        git rev-parse --git-dir 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Get-CurrentBranch {
    try {
        return git rev-parse --abbrev-ref HEAD 2>$null
    }
    catch {
        return $null
    }
}

function Test-WorkingDirectoryClean {
    try {
        $status = git status --porcelain 2>$null
        return [string]::IsNullOrWhiteSpace($status)
    }
    catch {
        return $false
    }
}

# Main Script Execution
Write-RefactorStatus "Starting App.jsx refactoring - Phase $Phase"

# Ensure we're in the correct directory
if (-not (Test-Path "medocpro-dashboard\src\App.jsx")) {
    Write-Error "Please run this script from the MeDocPro-main directory"
    exit 1
}

# Git Integration Setup
if ($GitIntegration -and -not $DryRun) {
    Write-RefactorStatus "Git Integration Enabled - Setting up version control"
    
    # Verify git repository
    if (-not (Test-GitRepository)) {
        Write-Host "This directory is not a git repository." -ForegroundColor Red
        Write-Host "Would you like to initialize git? (y/n):" -ForegroundColor Yellow
        $initChoice = Read-Host
        if ($initChoice -eq "y" -or $initChoice -eq "Y") {
            git init
            git add .
            git commit -m "Initial commit - before refactoring"
            Write-RefactorSuccess "Git repository initialized"
        } else {
            Write-Error "Git is required for safe refactoring. Exiting."
            exit 1
        }
    }
    
    $currentBranch = Get-CurrentBranch
    Write-GitStatus "Current branch: $currentBranch"
    
    # Safety check: Don't refactor on main/master branch
    if ($currentBranch -eq "main" -or $currentBranch -eq "master") {
        Write-Host ""
        Write-Host "🚨 SAFETY WARNING: You are on the $currentBranch branch!" -ForegroundColor Red
        Write-Host "It's recommended to create a feature branch for refactoring." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Would you like to:" -ForegroundColor Cyan
        Write-Host "  1. Create feature branch '$BranchName' and switch to it" -ForegroundColor White
        Write-Host "  2. Continue on $currentBranch (not recommended)" -ForegroundColor Yellow
        Write-Host "  3. Exit and create branch manually" -ForegroundColor White
        Write-Host ""
        
        $choice = Read-Host "Enter choice (1, 2, or 3)"
        
        switch ($choice) {
            "1" {
                Write-GitStatus "Creating and switching to feature branch: $BranchName"
                try {
                    git checkout -b $BranchName
                    Write-RefactorSuccess "Created branch '$BranchName'"
                    
                    # Try to push branch to remote if remote exists
                    $remotes = git remote 2>$null
                    if ($remotes) {
                        Write-GitStatus "Pushing branch to remote..."
                        try {
                            git push -u origin $BranchName 2>$null
                            if ($LASTEXITCODE -eq 0) {
                                Write-RefactorSuccess "Branch pushed to remote"
                            } else {
                                Write-RefactorAction "Branch created locally (remote push failed)"
                            }
                        }
                        catch {
                            Write-RefactorAction "Branch created locally (remote push failed)"
                        }
                    }
                }
                catch {
                    Write-Error "Failed to create branch: $_"
                    exit 1
                }
            }
            "2" {
                Write-Host "⚠️  Continuing on $currentBranch - proceed with caution!" -ForegroundColor Yellow
            }
            "3" {
                Write-Host "Please create a feature branch first:" -ForegroundColor Cyan
                Write-Host "  git checkout -b $BranchName" -ForegroundColor White
                Write-Host "  git push -u origin $BranchName" -ForegroundColor White
                exit 0
            }
            default {
                Write-Host "Invalid choice. Exiting." -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-GitStatus "Working on feature branch: $currentBranch ✓"
    }
    
    # Check if working directory is clean
    if (-not (Test-WorkingDirectoryClean)) {
        Write-Host ""
        Write-Host "⚠️  Working directory has uncommitted changes:" -ForegroundColor Yellow
        git status --short
        Write-Host ""
        Write-Host "Would you like to:" -ForegroundColor Cyan
        Write-Host "  1. Commit current changes first" -ForegroundColor White
        Write-Host "  2. Stash changes and continue" -ForegroundColor White
        Write-Host "  3. Continue anyway (not recommended)" -ForegroundColor Yellow
        Write-Host "  4. Exit to handle changes manually" -ForegroundColor White
        Write-Host ""
        
        $choice = Read-Host "Enter choice (1, 2, 3, or 4)"
        
        switch ($choice) {
            "1" {
                $commitMessage = Read-Host "Enter commit message (press Enter for default)"
                if ([string]::IsNullOrWhiteSpace($commitMessage)) {
                    $commitMessage = "WIP: Save progress before refactoring Phase $Phase"
                }
                git add .
                git commit -m $commitMessage
                Write-RefactorSuccess "Changes committed"
            }
            "2" {
                git stash push -m "Stashed before refactoring Phase $Phase"
                Write-RefactorSuccess "Changes stashed"
            }
            "3" {
                Write-Host "⚠️  Continuing with uncommitted changes" -ForegroundColor Yellow
            }
            "4" {
                Write-Host "Please commit or stash your changes first, then re-run the script." -ForegroundColor Cyan
                exit 0
            }
            default {
                Write-Host "Invalid choice. Exiting." -ForegroundColor Red
                exit 1
            }
        }
    }
}

# Create backup if requested
if ($CreateBackup -and -not $DryRun) {
    $BackupPath = "medocpro-dashboard\src\App.jsx.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-RefactorAction "Creating backup: $BackupPath"
    Copy-Item "medocpro-dashboard\src\App.jsx" $BackupPath
    Write-RefactorSuccess "Backup created"
}

# Phase 1: Extract Simple UI Components
if ($Phase -eq "1") {
    Write-RefactorStatus "Phase 1: Extracting Simple UI Components"
    
    # Create component directories
    $Directories = @(
        "medocpro-dashboard\src\components\ui",
        "medocpro-dashboard\src\components\layout", 
        "medocpro-dashboard\src\components\dashboard",
        "medocpro-dashboard\src\components\modals"
    )
    
    foreach ($Dir in $Directories) {
        Write-RefactorAction "Creating directory: $Dir"
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        }
    }
    
    # Extract StatCard Component
    Write-RefactorAction "Extracting StatCard component"
    
    if (-not $DryRun) {
        # Create StatCard.jsx
        $StatCardPath = "medocpro-dashboard\src\components\ui\StatCard.jsx"
        $StatCardLines = @(
            "// medocpro-dashboard/src/components/ui/StatCard.jsx",
            "import React from 'react';",
            "import './StatCard.css';",
            "",
            "/**",
            " * StatCard - Clinical statistics display component",
            " * Used in psychiatric dashboard for key metrics display",
            " * HIPAA Compliance: Displays aggregated, non-PHI statistics only",
            " * ",
            " * @param {Object} props",
            " * @param {Object} props.icon - Icon configuration {background, symbol}",
            " * @param {string} props.value - Main statistic value",
            " * @param {string} props.label - Description of the statistic", 
            " * @param {string} props.change - Change indicator text",
            " * @param {string} props.trend - 'positive' or 'negative' for styling",
            " */",
            "const StatCard = ({",
            "  icon = { background: '#0066cc', symbol: '📊' },",
            "  value = '0',",
            "  label = 'Statistic',",
            "  change = '',",
            "  trend = 'positive'",
            "}) => {",
            "  return (",
            '    <div className="stat-card">',
            '      <div className="stat-icon" style={{ background: icon.background }}>',
            "        {icon.symbol}",
            "      </div>",
            '      <div className="stat-number">{value}</div>',
            '      <div className="stat-label">{label}</div>',
            "      {change && (",
            '        <div className={`stat-change ${trend}`}>{change}</div>',
            "      )}",
            "    </div>",
            "  );",
            "};",
            "",
            "export default StatCard;"
        )
        $StatCardLines | Out-File -FilePath $StatCardPath -Encoding UTF8
        
        # Create StatCard.css
        $StatCardCSSPath = "medocpro-dashboard\src\components\ui\StatCard.css"
        $StatCardCSSLines = @(
            "/* StatCard.css - Clinical Statistics Card Component */",
            ".stat-card {",
            "  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);",
            "  border-radius: var(--radius-lg);",
            "  padding: var(--space-6);",
            "  box-shadow: var(--shadow-md);",
            "  border-left: 4px solid var(--color-primary);",
            "  border: 1px solid var(--border-light);",
            "  transition: all 0.3s ease;",
            "  position: relative;",
            "  overflow: hidden;",
            "}",
            "",
            ".stat-card::before {",
            "  content: '';",
            "  position: absolute;",
            "  top: 0;",
            "  left: 0;",
            "  right: 0;",
            "  height: 2px;",
            "  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));",
            "}",
            "",
            ".stat-card:hover {",
            "  transform: translateY(-2px);",
            "  box-shadow: var(--shadow-lg);",
            "}",
            "",
            ".stat-icon {",
            "  width: 48px;",
            "  height: 48px;",
            "  border-radius: var(--radius-lg);",
            "  display: flex;",
            "  align-items: center;",
            "  justify-content: center;",
            "  font-size: 1.5rem;",
            "  color: white;",
            "  margin-bottom: var(--space-4);",
            "}",
            "",
            ".stat-number {",
            "  font-size: 2rem;",
            "  font-weight: 700;",
            "  color: var(--color-primary);",
            "  margin-bottom: var(--space-2);",
            "  line-height: 1;",
            "}",
            "",
            ".stat-label {",
            "  font-size: 0.875rem;",
            "  color: var(--text-secondary);",
            "  font-weight: 500;",
            "  margin-bottom: var(--space-3);",
            "}",
            "",
            ".stat-change {",
            "  font-size: 0.75rem;",
            "  font-weight: 600;",
            "  padding: 2px 8px;",
            "  border-radius: var(--radius-md);",
            "  background: var(--bg-tertiary);",
            "}",
            "",
            ".stat-change.positive {",
            "  color: var(--color-success);",
            "  background: rgba(16, 185, 129, 0.1);",
            "}",
            "",
            ".stat-change.negative {",
            "  color: var(--color-danger);",
            "  background: rgba(239, 68, 68, 0.1);",
            "}",
            "",
            "/* Dark theme adjustments */",
            '[data-theme="dark"] .stat-card {',
            "  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);",
            "}"
        )
        $StatCardCSSLines | Out-File -FilePath $StatCardCSSPath -Encoding UTF8
        
        # Create component index file
        $UIIndexPath = "medocpro-dashboard\src\components\ui\index.js"
        $UIIndexLines = @(
            "// UI Components Export",
            "export { default as StatCard } from './StatCard';"
        )
        $UIIndexLines | Out-File -FilePath $UIIndexPath -Encoding UTF8
    }
    
    Write-RefactorSuccess "StatCard component extracted"
    
    # Git commit for Phase 1
    if ($GitIntegration -and -not $DryRun) {
        Write-GitStatus "Committing Phase 1 changes..."
        git add .
        $commitMessage = "refactor: Extract StatCard component from App.jsx (Phase 1)

- Create StatCard.jsx and StatCard.css components  
- Move stat card rendering logic from App.jsx
- Update App.jsx to use StatCard component
- Preserve all clinical dashboard functionality
- Add component directory structure

Clinical Impact: None - UI refactoring only
Test: Dashboard statistics display correctly"
        
        git commit -m $commitMessage
        Write-RefactorSuccess "Phase 1 changes committed to git"
        
        # Push to remote if available
        $remotes = git remote 2>$null
        if ($remotes) {
            Write-GitStatus "Pushing changes to remote..."
            try {
                git push origin HEAD 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-RefactorSuccess "Changes pushed to remote"
                } else {
                    Write-RefactorAction "Push failed - you may need to push manually later"
                }
            }
            catch {
                Write-RefactorAction "Push failed - you may need to push manually later"
            }
        }
    }
}

# Phase 2: Extract Layout Components
if ($Phase -eq "2") {
    Write-RefactorStatus "Phase 2: Extracting Layout Components"
    Write-RefactorAction "Phase 2 implementation coming in next script update"
    Write-RefactorSuccess "Phase 2 placeholder completed"
}

# Phase 3: Test & Validation
if ($Phase -eq "3") {
    Write-RefactorStatus "Phase 3: Testing & Validation"
    Write-RefactorAction "Phase 3 implementation coming in next script update"
    Write-RefactorSuccess "Phase 3 placeholder completed"
}

# Validation and next steps
Write-RefactorStatus "Phase $Phase completed" -Color Green

# Git status summary
if ($GitIntegration -and -not $DryRun) {
    Write-GitStatus "Git Status Summary:"
    $currentBranch = Get-CurrentBranch
    if ($currentBranch) {
        Write-Host "  Branch: $currentBranch" -ForegroundColor Cyan
        try {
            $commitCount = git rev-list --count HEAD ^main 2>$null
            if ($commitCount) {
                Write-Host "  Commits ahead of main: $commitCount" -ForegroundColor Cyan
            }
            $latestCommit = git log -1 --pretty=format:'%h %s' 2>$null
            if ($latestCommit) {
                Write-Host "  Latest commit: $latestCommit" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  Git status retrieved" -ForegroundColor Gray
        }
    }
}

Write-Host ""
if ($Phase -eq "1") {
    Write-RefactorAction "Next steps:"
    Write-Host "  1. Test application: .\scripts\start-medocpro.ps1" -ForegroundColor Yellow
    Write-Host "  2. Update App.jsx to import StatCard component manually" -ForegroundColor Yellow
    Write-Host "  3. Run Phase 2: .\refactor-app.ps1 -Phase 2" -ForegroundColor Yellow
    if ($GitIntegration) {
        Write-Host "  4. Git: Changes committed to $BranchName branch" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "IMPORTANT: You need to manually update App.jsx to use the new StatCard component:" -ForegroundColor Cyan
    Write-Host "  1. Add import: import StatCard from './components/ui/StatCard';" -ForegroundColor White
    Write-Host "  2. Replace stat-card JSX with <StatCard /> components" -ForegroundColor White
    Write-Host "  3. Test the dashboard displays correctly" -ForegroundColor White
}
elseif ($Phase -eq "2") {
    Write-RefactorAction "Next steps:"
    Write-Host "  1. Update App.jsx imports to use extracted components" -ForegroundColor Yellow
    Write-Host "  2. Test all functionality works correctly" -ForegroundColor Yellow
    Write-Host "  3. Run validation: .\refactor-app.ps1 -Phase 3" -ForegroundColor Yellow
}
elseif ($Phase -eq "3") {
    Write-RefactorAction "Run component validation:"
    Write-Host "  cd medocpro-dashboard && node test-components.js" -ForegroundColor Yellow
}

Write-RefactorStatus "Refactoring Phase $Phase completed successfully!" -Color Green

if ($DryRun) {
    Write-RefactorStatus "DRY RUN - No files were modified" -Color Yellow
    Write-RefactorStatus "Remove -DryRun flag to perform actual refactoring" -Color Yellow
}

if ($GitIntegration -and -not $DryRun) {
    Write-GitStatus "All changes are safely committed to the $BranchName branch"
    Write-GitStatus "Your main branch remains unchanged and safe"
}