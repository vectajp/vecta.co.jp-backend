#!/usr/bin/env bash
set -eu

# プロジェクトのルートディレクトリに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "${PROJECT_ROOT}" || exit

# 共通設定の読み込み
. "${SCRIPT_DIR}/shared.sh"

# チェック項目数と問題のある項目数の初期化
TOTAL_CHECKS=0
ISSUES_FOUND=0

printf "Doctor summary:\n"

##############################################################################
##
##  Git のインストールと設定のチェック
##  - Git本体のインストール
##  - コミットテンプレートの設定
##
##############################################################################
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v git >/dev/null 2>&1; then
  if [ -f "$COMMIT_MSG_TEMPLATE" ]; then
    printf "%s Git (commit template configured ($COMMIT_MSG_TEMPLATE))\n" "${CHECK_MARK}"
  else
    printf "%s Git\n" "${WARN_MARK}"
    printf "    %s Commit template is not configured\n" "${ERROR_CROSS}"
    printf "    %s Run 'make bs' to configure the commit template\n" "${GRAY}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
else
  printf "%s Git is not installed\n" "${ERROR_MARK}"
  printf "    %s Please install Git from: https://git-scm.com/downloads\n" "${ERROR_CROSS}"
  printf "    %s For macOS, you can also use Homebrew: brew install git\n" "${GRAY}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

##############################################################################
##
##  mise のインストールチェック
##  - ランタイムマネージャとして使用
##  - bun のインストールに必要
##
##############################################################################
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v mise >/dev/null 2>&1; then
  MISE_VERSION=$(mise --version 2>/dev/null | head -n1 || echo "version unknown")
  printf "%s mise (%s)\n" "${CHECK_MARK}" "${MISE_VERSION}"
else
  printf "%s mise is not installed\n" "${ERROR_MARK}"
  printf "    %s Please install mise using one of the following methods:\n" "${ERROR_CROSS}"
  printf "    %s • Official guide: https://mise.jdx.dev/getting-started.html\n" "${GRAY}"
  printf "    %s • Using Homebrew: brew install mise\n" "${GRAY}"
  printf "    %s • Using curl: curl https://mise.jdx.dev/install.sh | sh\n" "${GRAY}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

##############################################################################
##
##  bun のインストールと依存関係のチェック
##  - bun本体のインストール（mise経由）
##  - node_modulesの存在確認
##
##############################################################################
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v bun >/dev/null 2>&1; then
  BUN_VERSION=$(bun --version 2>/dev/null || echo "version unknown")
  if [ -d "node_modules" ]; then
    printf "%s bun (%s)\n" "${CHECK_MARK}" "${BUN_VERSION}"
  else
    printf "%s bun (%s)\n" "${WARN_MARK}" "${BUN_VERSION}"
    printf "    %s Dependencies are not installed\n" "${ERROR_CROSS}"
    printf "    %s Run 'make bs' to install project dependencies\n" "${GRAY}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
else
  printf "%s bun is not installed\n" "${ERROR_MARK}"
  if command -v mise >/dev/null 2>&1; then
    printf "    %s Please install bun using mise:\n" "${ERROR_CROSS}"
    printf "    %s Run 'mise install' to install bun from .mise.toml\n" "${GRAY}"
  else
    printf "    %s Please install mise first, then run 'mise install' to install bun\n" "${ERROR_CROSS}"
    printf "    %s See mise installation instructions above\n" "${GRAY}"
  fi
  printf "    %s After installation, run 'make bs' to set up the project\n" "${GRAY}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

##############################################################################
##
##  lefthook のインストールと設定のチェック
##  - lefthook本体のインストール（bun経由）
##  - Gitフックの設定確認
##
##############################################################################
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v lefthook >/dev/null 2>&1; then
  LEFTHOOK_VERSION=$(lefthook version 2>/dev/null || echo "version unknown")
  if lefthook install -f >/dev/null 2>&1; then
    printf "%s lefthook (%s)\n" "${CHECK_MARK}" "${LEFTHOOK_VERSION}"
  else
    printf "%s lefthook (%s)\n" "${WARN_MARK}" "${LEFTHOOK_VERSION}"
    printf "    %s Git hooks are not configured\n" "${ERROR_CROSS}"
    printf "    %s Run 'make bs' to configure Git hooks\n" "${GRAY}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
else
  printf "%s lefthook is not installed\n" "${ERROR_MARK}"
  if command -v bun >/dev/null 2>&1; then
    printf "    %s Please install lefthook using bun:\n" "${ERROR_CROSS}"
    printf "    %s Run 'bun i' to install project dependencies including lefthook\n" "${GRAY}"
  else
    printf "    %s Please install bun first, then run 'bun i' to install lefthook\n" "${ERROR_CROSS}"
    printf "    %s See bun installation instructions above\n" "${GRAY}"
  fi
  printf "    %s After installation, run 'make bs' to configure Git hooks\n" "${GRAY}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

##############################################################################
##
##  チェック結果のサマリー表示
##  - 問題がある場合は警告を表示
##  - 問題がない場合は成功を表示
##
##############################################################################
if [ "$ISSUES_FOUND" -gt 0 ]; then
  printf "\n%s Doctor found issues in %d categories.\n" "${WARN_MARK}" "${ISSUES_FOUND}"
  printf "%s Run 'make bs' after fixing the above issues to complete the setup.\n" "${GRAY}"
else
  printf "\n%s No issues found!\n" "${CHECK_MARK}"
fi
