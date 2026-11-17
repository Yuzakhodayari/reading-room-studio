#!/usr/bin/env bash
set -euo pipefail

WITH_SCRIPT_SKILLS=false
WITH_UPSTREAM_REFS=false
SKIP_MODEL_DOWNLOAD=false

for arg in "$@"; do
  case "$arg" in
    --with-script-skills) WITH_SCRIPT_SKILLS=true ;;
    --with-upstream-refs) WITH_UPSTREAM_REFS=true ;;
    --skip-model-download) SKIP_MODEL_DOWNLOAD=true ;;
    -h|--help)
      cat <<'EOF'
Usage: ./setup.sh [options]

Options:
  --with-script-skills   Clone Yuzakhodayari/channel-script-skills into channel-script-skills/
  --with-upstream-refs   Clone upstream reference repos into _refs/ (lemo-opuscar, mg-styles-15)
  --skip-model-download  Skip downloading tools/models/selfie_segmenter.tflite
  -h, --help             Show this help message
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUDIO_DIR="$REPO_ROOT/studio"
TOOLS_DIR="$REPO_ROOT/tools"
VENV_DIR="$TOOLS_DIR/.venv"
VENV_PY="$VENV_DIR/bin/python"
MODEL_DIR="$TOOLS_DIR/models"
MODEL_FILE="$MODEL_DIR/selfie_segmenter.tflite"
MODEL_URL="https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"

step() {
  printf '\n==> %s\n' "$1"
}

# 1. Verify Node.js >= 20
step "Checking Node.js (>= 20)..."
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js (>= 20) is required. Install from https://nodejs.org" >&2
  exit 1
fi
NODE_VER="$(node -v)"
NODE_MAJOR="${NODE_VER#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Error: Node.js $NODE_VER found, but >= 20 is required." >&2
  exit 1
fi
echo "Found Node.js $NODE_VER"

# 2. Check / install ffmpeg & ffprobe
step "Checking ffmpeg and ffprobe..."
if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install ffmpeg
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y ffmpeg
  else
    echo "Error: ffmpeg and ffprobe are required on PATH." >&2
    exit 1
  fi
fi
echo "Found ffmpeg: $(command -v ffmpeg)"

# 3. Check / install uv
step "Checking uv..."
if ! command -v uv >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install uv
  elif command -v curl >/dev/null 2>&1; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
  else
    echo "Error: uv is required. Install from https://docs.astral.sh/uv/" >&2
    exit 1
  fi
fi
echo "Found uv: $(command -v uv)"

# 4. Create tools/.venv (Python 3.12) and install pinned requirements
step "Setting up Python 3.12 environment at tools/.venv..."
if [ ! -x "$VENV_PY" ]; then
  uv venv "$VENV_DIR" --python 3.12
fi
uv pip install --python "$VENV_PY" -r "$TOOLS_DIR/requirements.txt"
uv pip check --python "$VENV_PY"

# 5. Pre-download selfie_segmenter.tflite (~244 KB)
if [ "$SKIP_MODEL_DOWNLOAD" = false ]; then
  step "Checking MediaPipe selfie_segmenter.tflite..."
  if [ ! -f "$MODEL_FILE" ] || [ "$(wc -c < "$MODEL_FILE")" -lt 100000 ]; then
    mkdir -p "$MODEL_DIR"
    curl -fsSL "$MODEL_URL" -o "$MODEL_FILE"
  else
    echo "Model ready: $MODEL_FILE"
  fi
fi

# 6. Install studio dependencies, build SFX, and run lint
step "Installing studio packages, building SFX, and running lint..."
(
  cd "$STUDIO_DIR"
  npm install
  npm run sfx:build
  npm run lint
)

# 7. Optional sibling repositories
if [ "$WITH_SCRIPT_SKILLS" = true ]; then
  step "Cloning optional channel-script-skills..."
  if [ ! -d "$REPO_ROOT/channel-script-skills" ]; then
    git clone "https://github.com/Yuzakhodayari/channel-script-skills.git" "$REPO_ROOT/channel-script-skills"
  fi
fi

if [ "$WITH_UPSTREAM_REFS" = true ]; then
  step "Cloning optional third-party reference repositories into _refs/..."
  mkdir -p "$REPO_ROOT/_refs"
  if [ ! -d "$REPO_ROOT/_refs/lemo-opuscar" ]; then
    git clone --depth 1 "https://github.com/lemomo-ai/lemo-opuscar.git" "$REPO_ROOT/_refs/lemo-opuscar"
  fi
  if [ ! -d "$REPO_ROOT/_refs/mg-styles-15" ]; then
    git clone --depth 1 "https://github.com/Vincentwei1021/mg-styles-15.git" "$REPO_ROOT/_refs/mg-styles-15"
  fi
fi

printf '\nSetup complete. Copy studio/.env.example to studio/.env if you plan to run Gemini room-object swaps.\n'
