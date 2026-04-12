# Update all bundled agent skills from upstream Microsoft repositories.
#
# Skills are bundled in this repo at .agents/skills/ and are available to all
# contributors immediately on clone. This script pulls the latest versions from:
#
#   - https://github.com/microsoft/skills   (Core + SDK skills for Python, .NET, TypeScript, Java, Rust)
#   - https://github.com/microsoft/azure-skills  (24 Azure workflow skills)
#
# microsoft/skills is the canonical source: it bundles azure-skills as a sub-plugin,
# so both repos are refreshed by this single script.
#
# Compatible with Windows PowerShell 5.1 and PowerShell 7+
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\update-skills.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\update-skills.ps1 -UserLevel
#
# After running, git-add and commit .agents/skills/ to share updates with all contributors.

param(
  [switch]$UserLevel   # Also install at user level (~/.agents/skills/) for VS Code auto-discovery
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Agent Skills Updater" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# ── Check for git ─────────────────────────────────────────────────────────────
if ($null -eq (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git not found. Please install Git from https://git-scm.com/ and re-run."
    exit 1
}

$RepoRoot  = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SkillsDir = Join-Path $RepoRoot ".agents\skills"
$TempBase  = [System.IO.Path]::GetTempPath()

function Sync-Repo {
    param([string]$Url, [string]$TempDir)
    if (Test-Path $TempDir) {
        Write-Host "  Refreshing $([System.IO.Path]::GetFileName($TempDir))..." -ForegroundColor DarkCyan
        Push-Location $TempDir
        try { git pull --quiet 2>&1 | Out-Null } finally { Pop-Location }
    } else {
        Write-Host "  Cloning $Url..." -ForegroundColor DarkCyan
        git clone --depth 1 $Url $TempDir --quiet 2>&1 | Out-Null
    }
}

function Copy-Skills {
    param([string]$SourceDir, [string]$DestDir)
    $count = 0
    if (-not (Test-Path $SourceDir)) { return $count }
    Get-ChildItem -Path $SourceDir -Directory | ForEach-Object {
        $dest = Join-Path $DestDir $_.Name
        Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
        $count++
    }
    return $count
}

# ── 1. microsoft/skills ───────────────────────────────────────────────────────
$msSkillsTemp = Join-Path $TempBase "ms-skills-update"
Write-Host "Source 1: microsoft/skills" -ForegroundColor White
Sync-Repo -Url "https://github.com/microsoft/skills" -TempDir $msSkillsTemp

$total = 0

# Core skills (.github/skills/)
$n = Copy-Skills -SourceDir (Join-Path $msSkillsTemp ".github\skills") -DestDir $SkillsDir
Write-Host "    Core skills:       $n" -ForegroundColor White
$total += $n

# SDK plugin bundles (.github/plugins/azure-sdk-*/skills/)
$sdkPlugins = @('azure-sdk-python','azure-sdk-dotnet','azure-sdk-typescript','azure-sdk-java','azure-sdk-rust')
foreach ($plugin in $sdkPlugins) {
    $pluginSkillsPath = Join-Path $msSkillsTemp ".github\plugins\$plugin\skills"
    $n = Copy-Skills -SourceDir $pluginSkillsPath -DestDir $SkillsDir
    $label = "$plugin skills:"
    Write-Host ("    {0,-30} {1}" -f $label, $n) -ForegroundColor White
    $total += $n
}

# ── 2. microsoft/azure-skills ─────────────────────────────────────────────────
$azSkillsTemp = Join-Path $TempBase "azure-skills-update"
Write-Host ""
Write-Host "Source 2: microsoft/azure-skills" -ForegroundColor White
Sync-Repo -Url "https://github.com/microsoft/azure-skills" -TempDir $azSkillsTemp

$n = Copy-Skills -SourceDir (Join-Path $azSkillsTemp "skills") -DestDir $SkillsDir
Write-Host "    Azure skills:      $n" -ForegroundColor White
$total += $n

# ── 3. Optionally mirror to user level ────────────────────────────────────────
if ($UserLevel) {
    $UserSkillsDir = Join-Path $HOME ".agents\skills"
    if (-not (Test-Path $UserSkillsDir)) {
        New-Item -ItemType Directory -Path $UserSkillsDir -Force | Out-Null
    }
    Write-Host ""
    Write-Host "Mirroring to user level ($UserSkillsDir)..." -ForegroundColor DarkCyan
    Copy-Item -Path "$SkillsDir\*" -Destination $UserSkillsDir -Recurse -Force
    Write-Host "  Done." -ForegroundColor White
}

# ── Summary ───────────────────────────────────────────────────────────────────
$installed = (Get-ChildItem -Path $SkillsDir -Directory).Count
Write-Host ""
Write-Host "Done. $installed skills in .agents/skills/ ($total source folders processed)." -ForegroundColor Green
Write-Host "Run 'git add .agents/skills && git commit -m \"chore: update skills\"' to share with contributors." -ForegroundColor DarkGray
