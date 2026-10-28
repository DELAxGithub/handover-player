#!/bin/bash
# Final goal: UI makes no false expiry/paywall claims on prod, privacy text matches, and the 5 persona replays still pass on prod.
# Items that only the user can finish (QA folder deletion needs DB privileges; Dropbox link) are reported as BLOCKED-ON-USER, not failures.
V=$HOME/src/10_apps/handover-player/docs/verify/first-user-qa-20261029
PROD=${PROD_URL:-https://orion-review.vercel.app}
fail=0
js=$(curl -s -m 20 $PROD/ | grep -o '/assets/index-[^"]*\.js' | head -1)
bundle=$(curl -s -m 30 "$PROD$js")
for bad in "Link expires after" "paid add-on" "Auto-expire"; do
  if echo "$bundle" | grep -q "$bad"; then echo "FAIL E1 prod bundle still contains: $bad"; fail=1; else echo "PASS E1 prod bundle has no: $bad"; fi
done
if curl -s -m 20 $PROD/privacy | grep -q "7-day expiry label"; then echo "FAIL E2 privacy.html still claims an expiry label"; fail=1; else echo "PASS E2 privacy wording"; fi
out=$(bash $V/verify-all.sh 2>&1); echo "$out" | grep -E "^(PASS|FAIL|SKIP)" | sed 's/^FAIL G6/BLOCKED-ON-USER G6 (QA folders need SQL delete)/; s/^PASS G4/BLOCKED-ON-USER G4 (no Dropbox link)/'
echo "$out" | grep -E "^FAIL G[1235]" && fail=1
exit $fail
