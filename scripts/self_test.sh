#!/bin/bash
set -e
PASS=0; FAIL=0; WARNINGS=()

check() {
  if eval "$2" > /dev/null 2>&1; then echo "  ✅ $1"; ((PASS++))
  else echo "  ❌ $1"; ((FAIL++)); WARNINGS+=("$1"); fi
}

echo "🔬 STADIUMIQ SELF-TEST"
echo "====================="

echo ""
echo "📁 Structure"
check "backend/ exists" "[ -d backend ]"
check "frontend/ exists" "[ -d frontend ]"
check ".env not committed" "[ ! -f .env ]"
check "5 compliance docs exist" "[ -f SECURITY_ARCHITECTURE.md ] && [ -f ACCESSIBILITY_COMPLIANCE_REPORT.md ] && [ -f CODE_QUALITY_STANDARDS.md ] && [ -f TESTING_STRATEGY.md ] && [ -f PERFORMANCE_REPORT.md ]"
check "Domain engine + cited source" "[ -f backend/app/engine/calculator.py ] && grep -q 'SOURCE' backend/app/engine/calculator.py"
check "Source is specific, not vague" "! grep -qiE 'SOURCE\s*=\s*\"(industry standard|various sources|common knowledge|general research)\"' backend/app/engine/calculator.py"
check "No SQLite leftovers" "! grep -rq 'sqlite3' backend/app/"
check "Visual identity layer present" "grep -rqE 'backdrop-filter|blur\(|gradient' frontend/src/"
check "Grade/label derived in engine" "grep -qiE 'grade|label|category' backend/app/engine/calculator.py"
check "Auth dependency exists" "[ -f backend/app/core/auth.py ]"
check "Auth uses callback, not shared secret" "grep -q 'auth-refresh' backend/app/core/auth.py && ! grep -qiE 'PB_SIGNING_KEY|jwt\.decode' backend/app/core/auth.py"
check "ProtectedRoute exists" "[ -f frontend/src/components/ProtectedRoute.tsx ]"
check "Login/Signup forms exist" "[ -f frontend/src/components/LoginForm.tsx ] && [ -f frontend/src/components/SignupForm.tsx ]"
check "/api/analyze depends on auth" "grep -q 'get_current_user' backend/app/routes/main.py"

echo ""
echo "📝 README"
check "README has Calculation Methodology" "grep -q 'Calculation Methodology' README.md"
check "README has Approach/How-it-works/Evaluation sections" "grep -q '## Approach' README.md && grep -q '## How It Works' README.md && grep -q '## Evaluation Mapping' README.md"
check "Architecture diagram exists" "([ -f docs/architecture.png ] || [ -f docs/architecture.svg ]) && grep -q 'Architecture' README.md"

echo ""
echo "🔒 Security"
check "No hardcoded secrets" "! grep -rE '(api_key|secret|password)\s*=\s*[\"'\''][^\"'\''\s]{8,}[\"'\'']' backend/app/ 2>/dev/null"
check "Security headers middleware present" "grep -q 'SecurityHeadersMiddleware\|security_headers' backend/app/core/security.py"
check "Rate limiting applied" "grep -q 'limiter' backend/app/routes/main.py"
check "package-lock.json committed" "[ -f frontend/package-lock.json ]"
check "gitleaks config present" "[ -f .gitleaks.toml ]"
check "CSP includes PocketBase origin" "grep -q 'localhost:8090\|POCKETBASE' backend/app/core/security.py"
check "Auth via PocketBase (not hand-rolled)" "! grep -rqi 'bcrypt\|passlib\|hashlib.*password' backend/app/ && grep -qi 'get_current_user\|authWithPassword' backend/app/ frontend/src/ -r 2>/dev/null"

echo ""
echo "💎 Code Quality"
check "TS strict mode" "grep -q '\"strict\": true\|\"strict\":true' frontend/tsconfig.json"
check "ESLint/Prettier configs present" "[ -f frontend/eslint.config.js ] && [ -f frontend/.prettierrc ]"
check "Backend ruff/mypy config present" "grep -q 'ruff\|mypy' backend/pyproject.toml"

echo ""
echo "♿ Accessibility"
check "Skip link present" "grep -rq 'skip.*main\|Skip to' frontend/src/"
check "aria-live in ResultsPanel" "grep -q 'aria-live' frontend/src/components/ResultsPanel.tsx"
check "reduced-motion handled" "grep -rq 'prefers-reduced-motion\|useReducedMotion' frontend/src/"
check "Single Toaster mount" "[ \$(grep -rl 'Toaster' frontend/src/ | wc -l) -le 2 ]"

echo ""
echo "📊 FIFA WC2026 Domain"
check "16 venues defined" "grep -c 'capacity' backend/app/engine/calculator.py | grep -qE '(1[6-9]|[2-9][0-9])'"
check "Crowd density thresholds (4 levels)" "grep -qE 'safe.*moderate.*warning.*critical|SAFE|MODERATE|WARNING|CRITICAL' backend/app/engine/calculator.py"
check "8-minute evacuation standard" "grep -q '8' backend/app/engine/calculator.py && grep -qi 'evacuation' backend/app/engine/calculator.py"
check "Multilingual fan assistant" "[ -f frontend/src/components/FanAssistant.tsx ]"

echo ""
echo "🐳 Docker & Git"
check "Docker compose file exists" "[ -f docker-compose.yml ]"
check "PocketBase has healthcheck" "grep -A3 'pocketbase' docker-compose.yml | grep -q 'healthcheck' || grep -B2 -A5 'healthcheck' docker-compose.yml | grep -q 'pocketbase\|8090'"
check "app waits on healthy" "grep -q 'condition: service_healthy' docker-compose.yml"
check "Single branch" "[ \$(git branch | wc -l) -eq 1 ]"
check "CI workflow exists" "[ -f .github/workflows/ci.yml ]"

echo ""
echo "=========================="
echo "RESULTS: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "🚀 READY TO SUBMIT" || { printf '  ⚠️  %s\n' "${WARNINGS[@]}"; exit 1; }
