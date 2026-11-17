<#
.SYNOPSIS
    One-command Windows bootstrap for The Reading Room video studio.
.PARAMETER WithScriptSkills
    Clone sibling repository Yuzakhodayari/channel-script-skills into channel-script-skills/.
.PARAMETER WithUpstreamRefs
    Clone third-party upstream reference repositories into _refs/ for local study.
.PARAMETER SkipModelDownload
    Skip downloading tools/models/selfie_segmenter.tflite (~244 KB).
#>
param(
    [switch]$WithScriptSkills,
    [switch]$WithUpstreamRefs,
    [switch]$SkipModelDownload
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StudioDir = Join-Path $RepoRoot "studio"
$ToolsDir = Join-Path $RepoRoot "tools"
$VenvDir = Join-Path $ToolsDir ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$ModelDir = Join-Path $ToolsDir "models"
$ModelFile = Join-Path $ModelDir "selfie_segmenter.tflite"
$ModelUrl = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"

function Write-Step([string]$Msg) {
    Write-Host "`n==> $Msg" -ForegroundColor Cyan
}

function Resolve-UvBin {
    $cmd = Get-Command uv -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        (Join-Path $env:USERPROFILE ".local\bin\uv.exe"),
        (Join-Path $env:USERPROFILE ".cargo\bin\uv.exe")
    )
    $wingetUv = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages") -Filter uv.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($wingetUv) { $candidates += $wingetUv }
    foreach ($c in $candidates) {
        if ($c -and (Test-Path $c)) { return $c }
    }
    return $null
}

# 1. Verify Node.js >= 20
Write-Step "Checking Node.js (>= 20)..."
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    throw "Node.js is required (>= 20). Install from https://nodejs.org or run: winget install OpenJS.NodeJS.LTS"
}
$nodeVerRaw = (& node -v).Trim()
if ($nodeVerRaw -match '^v(\d+)') {
    $nodeMajor = [int]$Matches[1]
    if ($nodeMajor -lt 20) {
        throw "Node.js $nodeVerRaw found, but >= 20 is required."
    }
    Write-Host "Found Node.js $nodeVerRaw"
}

# 2. Check / install ffmpeg & ffprobe
Write-Step "Checking ffmpeg and ffprobe..."
$ffmpegCmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobeCmd = Get-Command ffprobe -ErrorAction SilentlyContinue
if (-not $ffmpegCmd -or -not $ffprobeCmd) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Installing Gyan.FFmpeg via winget..."
        & winget install --id Gyan.FFmpeg --exact --silent --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install FFmpeg via winget. Please install ffmpeg and add it to PATH."
        }
    } else {
        throw "ffmpeg and ffprobe are required on PATH."
    }
} else {
    Write-Host "Found ffmpeg: $($ffmpegCmd.Source)"
}

# 3. Check / install uv
Write-Step "Checking uv..."
$uvBin = Resolve-UvBin
if (-not $uvBin) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Installing astral-sh.uv via winget..."
        & winget install --id astral-sh.uv --exact --silent --accept-package-agreements --accept-source-agreements
        $uvBin = Resolve-UvBin
    }
    if (-not $uvBin) {
        throw "uv is required. Install via winget (winget install astral-sh.uv) or https://docs.astral.sh/uv/"
    }
}
Write-Host "Found uv: $uvBin"

# 4. Create tools/.venv (Python 3.12) and install pinned requirements
Write-Step "Setting up Python 3.12 environment at tools/.venv..."
if (-not (Test-Path $VenvPython)) {
    & $uvBin venv $VenvDir --python 3.12
    if ($LASTEXITCODE -ne 0) { throw "Failed to create Python 3.12 venv via uv." }
}
& $uvBin pip install --python $VenvPython -r (Join-Path $ToolsDir "requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "uv pip install failed." }
& $uvBin pip check --python $VenvPython
if ($LASTEXITCODE -ne 0) { throw "uv pip check reported dependency conflicts." }

# 5. Pre-download selfie_segmenter.tflite (~244 KB)
if (-not $SkipModelDownload) {
    Write-Step "Checking MediaPipe selfie_segmenter.tflite..."
    if (-not (Test-Path $ModelFile) -or ((Get-Item $ModelFile).Length -lt 100000)) {
        New-Item -ItemType Directory -Force -Path $ModelDir | Out-Null
        Write-Host "Downloading selfie_segmenter.tflite -> $ModelFile"
        Invoke-WebRequest -Uri $ModelUrl -OutFile $ModelFile -UseBasicParsing
    } else {
        Write-Host "Model ready: $ModelFile"
    }
}

# 6. Install studio npm dependencies, build procedural SFX, and run lint
Write-Step "Installing studio packages, building SFX, and running lint..."
Push-Location $StudioDir
try {
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
    & npm run sfx:build
    if ($LASTEXITCODE -ne 0) { throw "npm run sfx:build failed." }
    & npm run lint
    if ($LASTEXITCODE -ne 0) { throw "npm run lint failed." }
} finally {
    Pop-Location
}

# 7. Optional sibling repositories
if ($WithScriptSkills) {
    Write-Step "Cloning optional channel-script-skills..."
    $skillsDir = Join-Path $RepoRoot "channel-script-skills"
    if (-not (Test-Path $skillsDir)) {
        & git clone "https://github.com/Yuzakhodayari/channel-script-skills.git" $skillsDir
    } else {
        Write-Host "Already present: $skillsDir"
    }
}

if ($WithUpstreamRefs) {
    Write-Step "Cloning optional third-party reference repositories into _refs/..."
    $refsDir = Join-Path $RepoRoot "_refs"
    New-Item -ItemType Directory -Force -Path $refsDir | Out-Null
    $lemoDir = Join-Path $refsDir "lemo-opuscar"
    $mgDir = Join-Path $refsDir "mg-styles-15"
    if (-not (Test-Path $lemoDir)) {
        & git clone --depth 1 "https://github.com/lemomo-ai/lemo-opuscar.git" $lemoDir
    }
    if (-not (Test-Path $mgDir)) {
        & git clone --depth 1 "https://github.com/Vincentwei1021/mg-styles-15.git" $mgDir
    }
}

Write-Host "`nSetup complete. Copy studio/.env.example to studio/.env if you plan to run Gemini room-object swaps." -ForegroundColor Green
