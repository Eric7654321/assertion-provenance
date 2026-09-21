#!/usr/bin/env bash
# Re-create lab/contract/<SHA>/: the pinned public references used by harness/p2_check.py.
# They are RealWorld files (https://github.com/realworld-apps/realworld); we fetch them rather than
# redistribute them.
set -euo pipefail
SHA=ebbcdeb8d55b42a3a613c787560498b8ef10003f
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/contract/$SHA"
mkdir -p "$DEST"
FILES=(
 docs/src/content/docs/implementation-creation/features.md
 docs/src/content/docs/implementation-creation/expectations.md
 docs/src/content/docs/specifications/backend/api-response-format.md
 docs/src/content/docs/specifications/backend/endpoints.md
 docs/src/content/docs/specifications/backend/error-handling.md
 docs/src/content/docs/specifications/backend/introduction.md
 docs/src/content/docs/specifications/frontend/api.md
 docs/src/content/docs/specifications/frontend/routing.md
 docs/src/content/docs/specifications/frontend/templates.md
 docs/src/content/docs/specifications/frontend/styles.md
 specs/api/openapi.yml
 specs/api/hurl/articles.hurl specs/api/hurl/auth.hurl specs/api/hurl/comments.hurl
 specs/api/hurl/errors_articles.hurl specs/api/hurl/errors_auth.hurl specs/api/hurl/errors_authorization.hurl
 specs/api/hurl/errors_comments.hurl specs/api/hurl/errors_profiles.hurl specs/api/hurl/favorites.hurl
 specs/api/hurl/feed.hurl specs/api/hurl/pagination.hurl specs/api/hurl/profiles.hurl specs/api/hurl/tags.hurl
 specs/e2e/SELECTORS.md specs/e2e/articles.spec.ts specs/e2e/auth.spec.ts specs/e2e/comments.spec.ts
 specs/e2e/error-handling.spec.ts specs/e2e/navigation.spec.ts specs/e2e/null-fields.spec.ts
 specs/e2e/settings.spec.ts specs/e2e/social.spec.ts specs/e2e/url-navigation.spec.ts
 specs/e2e/user-fetch-errors.spec.ts specs/e2e/xss-security.spec.ts
)
for p in "${FILES[@]}"; do
  mkdir -p "$DEST/$(dirname "$p")"
  curl -sSf -o "$DEST/$p" "https://raw.githubusercontent.com/realworld-apps/realworld/$SHA/$p"
done
echo "$SHA" > "$DEST/SHA"
echo "fetched ${#FILES[@]} files into $DEST"
