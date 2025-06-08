#!/usr/bin/env bash
set -eu

# プロジェクトのルートディレクトリに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "${PROJECT_ROOT}" || exit

# 共通設定の読み込み
. "${SCRIPT_DIR}/shared.sh"

printf "%s Bootstrap start\n" "${ROCKET}"
printf "%s Working directory: %s\n" "${ROCKET}" "$(pwd)"

# エラー発生を追跡するフラグ
HAS_ERROR=0

# ステップの記録
step=0
record_step() {
  printf "\n%s Step %d: %s\n" "${ROCKET}" "$((++step))" "$*"
}

# 中断時の処理
trap 'echo -e "${RED}[✖] Aborted at step ${step}${RESET}"; exit 1' ERR INT

##############################################################################
##
##  Git コミットテンプレートの設定
##  - コミットメッセージのテンプレートを設定
##  - プロジェクトの一貫性のあるコミットメッセージを維持
##
##############################################################################
record_step "Git commit message: Start"
if command -v git >/dev/null 2>&1; then
  if git config commit.template "$COMMIT_MSG_TEMPLATE"; then
    printf "%s Git commit message: git config commit.template is %s\n" "${CHECK_MARK}" "$(git config commit.template)"
    printf "%s Git commit message: Success\n" "${CHECK_MARK}"
  else
    printf "%s Git commit message: Failed to configure template\n" "${ERROR_MARK}"
    HAS_ERROR=1
  fi
else
  printf "%s Git is not installed\n" "${ERROR_MARK}"
  printf "    %s Please install Git using one of the following methods:\n" "${ERROR_MARK}"
  printf "    %s • Official guide: https://git-scm.com/downloads\n" "${GRAY}"
  printf "    %s • Using Homebrew: brew install git\n" "${GRAY}"
  HAS_ERROR=1
fi

##############################################################################
##
##  mise のインストール
##  - .mise.toml に定義された環境をインストール
##  - bun などの開発ツールをインストール
##
##############################################################################
record_step "mise install: Start"
if command -v mise >/dev/null 2>&1; then
  if mise install; then
    printf "%s mise install: Success\n" "${CHECK_MARK}"
  else
    printf "%s mise install: Failed\n" "${ERROR_MARK}"
    printf "    %s Please check the error message above and try again\n" "${GRAY}"
    printf "    %s If the issue persists, see: https://mise.jdx.dev/getting-started.html\n" "${GRAY}"
    HAS_ERROR=1
  fi
else
  printf "%s mise is not installed\n" "${ERROR_MARK}"
  printf "    %s Please install mise using one of the following methods:\n" "${ERROR_MARK}"
  printf "    %s • Official guide: https://mise.jdx.dev/getting-started.html\n" "${GRAY}"
  printf "    %s • Using Homebrew: brew install mise\n" "${GRAY}"
  printf "    %s • Using curl: curl https://mise.jdx.dev/install.sh | sh\n" "${GRAY}"
  HAS_ERROR=1
fi

##############################################################################
##
##  bun のセットアップ
##  - プロジェクトの依存関係をインストール
##  - package.json に定義されたパッケージを管理
##
##############################################################################
record_step "bun install: Start"
if command -v bun >/dev/null 2>&1; then
  if bun install; then
    printf "%s bun install: Success\n" "${CHECK_MARK}"
  else
    printf "%s bun install: Failed\n" "${ERROR_MARK}"
    printf "    %s Please check the error message above and try again\n" "${GRAY}"
    printf "    %s If the issue persists, run 'bun install --verbose' for more details\n" "${GRAY}"
    HAS_ERROR=1
  fi
else
  printf "%s bun is not installed\n" "${ERROR_MARK}"
  if command -v mise >/dev/null 2>&1; then
    printf "    %s Please install bun using mise:\n" "${ERROR_MARK}"
    printf "    %s Run 'mise install' to install bun from .mise.toml\n" "${GRAY}"
  else
    printf "    %s Please install mise first, then run 'mise install' to install bun\n" "${ERROR_MARK}"
    printf "    %s See mise installation instructions above\n" "${GRAY}"
  fi
  HAS_ERROR=1
fi

##############################################################################
##
##  .dev.vars ファイル準備と API_KEY 設定 (対話形式)
##
##############################################################################
record_step ".dev.vars ファイル準備と API_KEY 設定: 開始"

source_env_file=".dev.vars.example"
target_env_file=".dev.vars"

# .dev.vars.example (コピー元) が存在するか確認
if [ ! -f "$source_env_file" ]; then
  printf "%s %s が見つかりません。 .dev.vars の準備と API_KEY 設定をスキップします。\n" "${ERROR_MARK}" "$source_env_file"
else
  # .dev.vars (コピー先) が存在しない場合は .dev.vars.example からコピー
  if [ ! -f "$target_env_file" ]; then
    printf "%s %s が存在しません。%s からコピーします...\n" "${ROCKET}" "$target_env_file" "$source_env_file"
    cp "$source_env_file" "$target_env_file"
    printf "%s %s を作成しました。\n" "${CHECK_MARK}" "$target_env_file"
  else
    printf "%s %s は既に存在します。コピーをスキップします。\n" "${GRAY}[i]${RESET}" "$target_env_file"
  fi

  # --- ここから API_KEY の対話設定 ---
  printf "%s %s 内の API_KEY を確認・設定します...\n" "${ROCKET}" "$target_env_file"

  # .dev.vars 内に空でない API_KEY が既に設定されているか確認 (コメントアウト行や空の値は除外)
  if grep -qE '^[[:space:]]*API_KEY=[^[:space:]]+' "$target_env_file"; then
    printf "%s API_KEY は既に %s 内で値が設定されています。対話設定をスキップします。\n" "${CHECK_MARK}" "$target_env_file"
  else
    # 設定されていない、または値が空の場合、API_KEY の入力を促す
    printf "%s APIアクセス用の API キーを入力してください。\n" "${BLUE}[🔑]${RESET}"
    printf "   %s に保存されます。(入力は非表示になります)\n" "$target_env_file"
    read -s -p "API_KEY を入力: " api_key
    echo "" # 非表示入力の後で改行

    if [ -z "$api_key" ]; then
      printf "%s API_KEY が入力されませんでした。API_KEY は更新されませんでした。\n" "${ERROR_MARK}"
    else
      # 一時ファイルを使用して既存の API_KEY 行を削除/コメントアウトし、新しい行を追記
      tmp_file="${target_env_file}.tmp.$$" # プロセスIDを使って一時ファイル名をユニークに
      # API_KEY 行（コメントアウト含む）を除外して一時ファイルにコピー
      grep -vE '^[[:space:]]*#*[[:space:]]*API_KEY=' "$target_env_file" > "$tmp_file" || true # grep が何も見つけなくてもエラーにしない

      # 新しい API_KEY 行を一時ファイルに追記
      echo "API_KEY=$api_key" >> "$tmp_file"

      # 元のファイルを一時ファイルで上書き
      mv "$tmp_file" "$target_env_file"

      # 念のため確認
      if grep -qE "^API_KEY=$api_key" "$target_env_file"; then
          printf "%s API_KEY が %s に設定/更新されました。\n" "${CHECK_MARK}" "$target_env_file"
      else
          printf "%s API_KEY の設定/更新確認に失敗しました。ファイル (%s) を手動で確認してください。\n" "${ERROR_MARK}" "$target_env_file"
          # クリーンアップ
          rm -f "$tmp_file" # エラー時にも一時ファイルを削除
      fi
    fi
  fi
fi

printf "%s .dev.vars ファイル準備と API_KEY 設定: 完了\n" "${ROCKET}"

##############################################################################
##
##  lefthook のセットアップ
##  - Gitフックの設定
##  - コミット前のチェックやフォーマットを自動化
##
##############################################################################
record_step "lefthook install: Start"
if command -v bun run lefthook >/dev/null 2>&1; then
  if bun run lefthook install; then
    printf "%s lefthook install: Success\n" "${CHECK_MARK}"
  else
    printf "%s lefthook install: Failed\n" "${ERROR_MARK}"
    printf "    %s Please check if Git is properly initialized in this repository\n" "${GRAY}"
    printf "    %s Run 'git init' if this is a new repository\n" "${GRAY}"
    HAS_ERROR=1
  fi
else
  printf "%s lefthook is not installed\n" "${ERROR_MARK}"
  if command -v bun >/dev/null 2>&1; then
    printf "    %s Please install lefthook using bun:\n" "${ERROR_MARK}"
    printf "    %s Run 'bun i' to install project dependencies including lefthook\n" "${GRAY}"
  else
    printf "    %s Please install bun first, then run 'bun i' to install lefthook\n" "${ERROR_MARK}"
    printf "    %s See bun installation instructions above\n" "${GRAY}"
  fi
  HAS_ERROR=1
fi

##############################################################################
##
##  セットアップ完了
##
##############################################################################
if [ "$HAS_ERROR" -eq 0 ]; then
  printf "\n%s Bootstrap finished successfully\n" "${CHECK_MARK}"
  exit 0
else
  printf "\n%s Bootstrap finished with errors\n" "${ERROR_MARK}"
  printf "%s Please fix the issues above and run 'make bs' again\n" "${GRAY}"
  exit 1
fi
