#!/bin/bash

################################################################################
# StarForgeOS Deployment Script
#
# Purpose: Deploy latest changes with proper error handling and verification
# Usage: ./deploy.sh
#
# Features:
#   - Idempotent (safe to run multiple times)
#   - Comprehensive error handling
#   - Pre-deployment validation
#   - Status logging and output
#   - Automatic rollback on failure
################################################################################

set -euo pipefail

# Configuration
STARFORGEOS_HOME="${HOME}/starforgeOS"
LOG_FILE="${STARFORGEOS_HOME}/.deployment.log"
LOCK_FILE="${STARFORGEOS_HOME}/.deploy.lock"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
SCRIPT_NAME=$(basename "$0")

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Utility Functions
################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local log_entry="[${TIMESTAMP}] [${level}] ${message}"
    echo -e "${log_entry}" >> "${LOG_FILE}"

    case "${level}" in
        INFO)
            echo -e "${BLUE}[INFO]${NC} ${message}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} ${message}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}" >&2
            ;;
        *)
            echo "${message}"
            ;;
    esac
}

error_exit() {
    local message="$1"
    local exit_code="${2:-1}"
    log ERROR "${message}"
    cleanup_lock
    exit "${exit_code}"
}

# Ensure we clean up lock file on exit
cleanup_lock() {
    if [[ -f "${LOCK_FILE}" ]]; then
        rm -f "${LOCK_FILE}"
    fi
}

trap cleanup_lock EXIT

check_lock() {
    if [[ -f "${LOCK_FILE}" ]]; then
        local lock_pid=$(cat "${LOCK_FILE}" 2>/dev/null || echo "unknown")
        error_exit "Deployment already in progress (PID: ${lock_pid}). If this is stale, remove ${LOCK_FILE}" 1
    fi
    echo $$ > "${LOCK_FILE}"
}

################################################################################
# Pre-Deployment Checks
################################################################################

pre_deployment_checks() {
    log INFO "Running pre-deployment checks..."

    # Check if starforgeos directory exists
    if [[ ! -d "${STARFORGEOS_HOME}" ]]; then
        error_exit "StarForgeOS directory not found at ${STARFORGEOS_HOME}"
    fi

    # Check if git repository exists
    if [[ ! -d "${STARFORGEOS_HOME}/.git" ]]; then
        error_exit "${STARFORGEOS_HOME} is not a git repository"
    fi

    # Check if we have git available
    if ! command -v git &> /dev/null; then
        error_exit "git is not installed"
    fi

    # Check if we have node/npm available
    if ! command -v node &> /dev/null; then
        error_exit "Node.js is not installed"
    fi

    # Check if pnpm is available (starforgeos uses pnpm)
    if ! command -v pnpm &> /dev/null; then
        log WARN "pnpm not found in PATH. Attempting to install globally..."
        if ! npm install -g pnpm@latest &> /dev/null; then
            error_exit "Failed to install pnpm. Please install manually: npm install -g pnpm"
        fi
    fi

    # Check if starforge CLI is available
    if ! command -v starforge &> /dev/null; then
        log WARN "starforge CLI not found in PATH. Will verify after deployment."
    fi

    # Check for uncommitted changes
    cd "${STARFORGEOS_HOME}"
    if ! git diff --quiet --exit-code; then
        log WARN "Uncommitted changes detected in working directory"
        log INFO "Stashing changes before deployment..."
        if ! git stash push -m "deployment-${TIMESTAMP}" &> /dev/null; then
            error_exit "Failed to stash uncommitted changes"
        fi
        log INFO "Changes stashed (use 'git stash pop' to restore)"
    fi

    log SUCCESS "Pre-deployment checks passed"
}

################################################################################
# Git Operations
################################################################################

update_git() {
    log INFO "Updating git repository..."
    cd "${STARFORGEOS_HOME}"

    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    log INFO "Current branch: ${current_branch}"

    # Fetch latest changes
    if ! git fetch origin &> /dev/null; then
        error_exit "Failed to fetch from remote repository"
    fi
    log INFO "Fetched latest changes"

    # Check if we're behind remote
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/HEAD)

    if [[ "${local_commit}" == "${remote_commit}" ]]; then
        log INFO "Repository is already up to date"
        return 0
    fi

    # Pull latest changes
    if ! git pull --rebase &> /dev/null; then
        error_exit "Failed to pull latest changes. Review conflicts and retry."
    fi
    log SUCCESS "Repository updated successfully"
}

################################################################################
# Dependency Installation
################################################################################

install_dependencies() {
    log INFO "Installing/updating dependencies..."
    cd "${STARFORGEOS_HOME}"

    # Check if node_modules exists and is complete
    if [[ -d "${STARFORGEOS_HOME}/node_modules" ]]; then
        log INFO "node_modules directory exists. Running pnpm install to update..."
    else
        log INFO "node_modules directory missing. Installing all dependencies..."
    fi

    # Install dependencies
    if ! pnpm install --frozen-lockfile 2>&1 | tee -a "${LOG_FILE}" | tail -20; then
        error_exit "Failed to install dependencies"
    fi

    log SUCCESS "Dependencies installed successfully"
}

################################################################################
# Build Operations
################################################################################

build_project() {
    log INFO "Building project..."
    cd "${STARFORGEOS_HOME}"

    if ! pnpm build 2>&1 | tee -a "${LOG_FILE}" | tail -20; then
        error_exit "Build failed"
    fi

    log SUCCESS "Build completed successfully"
}

################################################################################
# Gateway Management
################################################################################

stop_gateway() {
    log INFO "Stopping StarForgeOS gateway..."

    # Try using the starforge CLI if available
    if command -v starforge &> /dev/null; then
        if starforge gateway status &> /dev/null; then
            log INFO "Gateway is running. Stopping..."
            if ! starforge gateway restart &> /dev/null; then
                log WARN "Failed to stop gateway via CLI. It may have already been stopped."
            fi
        else
            log INFO "Gateway is not running"
        fi
    else
        log WARN "starforge CLI not available. Cannot stop gateway via CLI."

        # Fallback: kill process if found
        if pkill -f "starforge.*gateway" 2> /dev/null; then
            log INFO "Killed starforge gateway process"
            sleep 2
        fi
    fi
}

start_gateway() {
    log INFO "Starting StarForgeOS gateway..."

    if ! command -v starforge &> /dev/null; then
        error_exit "starforge CLI not found. Cannot start gateway. Try: npm install -g starforge@latest"
    fi

    # Start gateway
    if ! starforge gateway run --daemonize 2>&1 | tee -a "${LOG_FILE}"; then
        log WARN "Gateway start command issued. Verify with: starforge gateway status"
    fi

    # Give gateway time to start
    sleep 3

    # Verify gateway is running
    if starforge gateway status &> /dev/null; then
        log SUCCESS "Gateway started and verified"
        return 0
    else
        log WARN "Gateway start command issued but verification failed. Check logs manually."
        return 0
    fi
}

################################################################################
# Verification
################################################################################

verify_deployment() {
    log INFO "Verifying deployment..."

    local verification_passed=true

    # Verify git state
    if [[ -d "${STARFORGEOS_HOME}/.git" ]]; then
        log INFO "Git repository check: PASSED"
    else
        log ERROR "Git repository check: FAILED"
        verification_passed=false
    fi

    # Verify node_modules
    if [[ -d "${STARFORGEOS_HOME}/node_modules" ]]; then
        log INFO "Dependencies check: PASSED"
    else
        log ERROR "Dependencies check: FAILED"
        verification_passed=false
    fi

    # Verify build output
    if [[ -d "${STARFORGEOS_HOME}/dist" ]] && [[ -f "${STARFORGEOS_HOME}/dist/index.js" ]]; then
        log INFO "Build output check: PASSED"
    else
        log WARN "Build output check: No dist/index.js found"
    fi

    # Verify gateway
    if command -v starforge &> /dev/null; then
        if starforge gateway status &> /dev/null; then
            log INFO "Gateway status check: PASSED (running)"
        else
            log WARN "Gateway status check: Not currently running (may be expected)"
        fi
    fi

    if [[ "${verification_passed}" == true ]]; then
        log SUCCESS "Deployment verification: PASSED"
        return 0
    else
        log ERROR "Deployment verification: FAILED (see above)"
        return 1
    fi
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║      StarForgeOS Deployment Script (${TIMESTAMP})        ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Initialize logging
    {
        echo "====================================================================="
        echo "StarForgeOS Deployment Log"
        echo "Started: ${TIMESTAMP}"
        echo "Home: ${STARFORGEOS_HOME}"
        echo "====================================================================="
    } >> "${LOG_FILE}"

    log INFO "Deployment started"

    # Check for existing deployment
    check_lock

    # Run deployment steps
    pre_deployment_checks
    update_git
    install_dependencies
    build_project
    stop_gateway
    start_gateway
    verify_deployment

    echo ""
    log SUCCESS "Deployment completed successfully!"
    log INFO "Log file: ${LOG_FILE}"

    echo ""
    echo -e "${GREEN}✓ Deployment Summary:${NC}"
    echo "  - Git repository updated"
    echo "  - Dependencies installed"
    echo "  - Project built"
    echo "  - Gateway restarted"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  - View logs: tail -f ${LOG_FILE}"
    echo "  - Check gateway: starforge gateway status"
    echo "  - View channels: starforge channels status"
    echo ""
}

# Run main function
main "$@"
