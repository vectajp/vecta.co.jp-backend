#!/usr/bin/env bash
# 共通設定 (bootstrap.sh/doctor.sh 向け)
# shellcheck disable=SC2034
. "$(dirname "$0")/config.sh"

# ANSIエスケープシーケンスによる色定義
GREEN=$(printf '\033[32m') || exit $?
readonly GREEN
RED=$(printf '\033[31m') || exit $?
readonly RED
YELLOW=$(printf '\033[33m') || exit $?
readonly YELLOW
BLUE=$(printf '\033[34m') || exit $?
readonly BLUE
GRAY=$(printf '\033[90m') || exit $?
readonly GRAY
RESET=$(printf '\033[0m') || exit $?
readonly RESET

# 記号定義
readonly CHECK_MARK="${GREEN}[✓]${RESET}"
readonly WARN_MARK="${YELLOW}[!]${RESET}"
readonly ERROR_MARK="${RED}[✗]${RESET}"
readonly ERROR_CROSS="${RED}✗${RESET}"
readonly ROCKET="${BLUE}>>>${RESET}"
