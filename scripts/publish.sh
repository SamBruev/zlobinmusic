#!/bin/bash
set -euo pipefail
site_root=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
cd -- "$site_root"
repo='SamBruev/zlobinmusic'
login=$(gh api user --jq .login)
if [[ "$login" != 'SamBruev' ]]; then
  printf 'Expected GitHub account SamBruev, got %s. No changes made.\n' "$login" >&2
  exit 1
fi
node --check app.js
node scripts/build.mjs
if metadata=$(gh api "repos/$repo" --jq .full_name 2>&1); then
  [[ "$metadata" == "$repo" ]] || exit 1
elif [[ "$metadata" == *'HTTP 404'* ]]; then
  gh repo create "$repo" --public --description 'Zlobin Music — гитара и импровизация с Никитой Злобиным'
else
  printf '%s\n' "$metadata" >&2
  exit 1
fi
if [[ ! -d .git ]]; then git init -b main; fi
[[ "$(git branch --show-current)" == main ]] || { printf 'Expected local main branch.\n' >&2; exit 1; }
if remote_url=$(git remote get-url origin 2>/dev/null); then
  case "$remote_url" in
    https://github.com/SamBruev/zlobinmusic|https://github.com/SamBruev/zlobinmusic.git|git@github.com:SamBruev/zlobinmusic.git) ;;
    *) printf 'Unexpected origin; stopping.\n' >&2; exit 1 ;;
  esac
else
  git remote add origin "https://github.com/$repo.git"
fi
git config user.name >/dev/null 2>&1 || git config user.name 'SamBruev'
git config user.email >/dev/null 2>&1 || git config user.email '167262957+SamBruev@users.noreply.github.com'
git add -- .gitignore .nojekyll README.md index.html styles.css app.js assets scripts docs
if ! git diff --cached --quiet; then git commit -m 'Build Zlobin Music guitar courses preview'; fi
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin main
if pages=$(gh api "repos/$repo/pages" --jq .html_url 2>&1); then
  gh api --method PUT "repos/$repo/pages" --input - <<'JSON'
{"source":{"branch":"main","path":"/docs"}}
JSON
elif [[ "$pages" == *'HTTP 404'* ]]; then
  gh api --method POST "repos/$repo/pages" --input - <<'JSON'
{"source":{"branch":"main","path":"/docs"},"build_type":"legacy"}
JSON
else
  printf '%s\n' "$pages" >&2
  exit 1
fi
printf '\nRequested GitHub Pages publication: https://sambruev.github.io/zlobinmusic/\n'
printf 'Verify the remote deployment before reporting the site as live.\n'
