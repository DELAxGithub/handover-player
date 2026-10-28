#!/bin/bash
# Ground truth for the launch-readiness goal. Prints one PASS/FAIL line per goal item.
# Cheap checks first; the expensive prod replays (G1) only run when the cheap ones pass.
R=$HOME/src/10_apps/handover-player
V=$R/docs/verify/first-user-qa-20261029
PROD=${PROD_URL:-https://orion-review.vercel.app}
ENVF="$HOME/.local/bin/delax-run --env-file $R/.env.local --"
rest() { $ENVF sh -c "curl -s -H \"apikey: \$VITE_SUPABASE_ANON_KEY\" -H \"Authorization: Bearer \$VITE_SUPABASE_ANON_KEY\" \"\$VITE_SUPABASE_URL/rest/v1/$1\""; }
count() { python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d) if isinstance(d,list) else 'ERR')"; }
fail=0
p() { echo "$1"; case "$1" in FAIL*) fail=1;; esac; }

# G3 keepalive workflow committed
if git -C "$R" ls-files --error-unmatch .github/workflows/supabase-keepalive.yml >/dev/null 2>&1; then p "PASS G3 keepalive workflow committed"; else p "FAIL G3 .github/workflows/supabase-keepalive.yml not committed"; fi

# G2 legal pages live on prod (SPA fallback would return home text, so check the rendered text)
legal=$(cd $V && PROD=$PROD node -e "
import('puppeteer').then(async({default:pp})=>{const b=await pp.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out=[];for(const u of ['/terms','/privacy']){const pg=await b.newPage();await pg.goto(process.env.PROD+u,{waitUntil:'networkidle2'});const t=await pg.evaluate(()=>document.body.innerText);out.push(u+':'+(/terms of|privacy/i.test(t.slice(0,300))&&!/Start a review/.test(t)));}
await b.close();console.log(out.join(' '))})" 2>/dev/null)
case "$legal" in *false*|"") p "FAIL G2 legal pages on prod: ${legal:-error}";; *) p "PASS G2 legal pages on prod ($legal)";; esac

# G5 / G4 evidence files written by the worker
if grep -q '"success": *true' $V/ios/result.json 2>/dev/null; then p "PASS G5 iOS Simulator Safari evidence"; else p "FAIL G5 $V/ios/result.json missing or success!=true"; fi
if [ -f $V/dropbox/result.json ]; then p "PASS G4 dropbox result recorded: $(head -c 160 $V/dropbox/result.json | tr '\n' ' ')"; else p "FAIL G4 $V/dropbox/result.json missing (write success or an explicit skipped:no-link record)"; fi

if [ $fail -ne 0 ]; then echo "SKIP G1/G6 (fix the FAIL items above first)"; exit 1; fi

# G1: 5 persona replays against prod (creates QA rows, cleaned up right after)
(cd $V/media && nohup python3 -m http.server 4402 >/dev/null 2>&1 & echo $! > /tmp/qa-media.pid); sleep 1
rm -f $V/final-summary.txt
for who in impatient skeptic mobile literal breaker; do
  (cd $V/$who && BASE_URL=$PROD timeout 550 node $who.mjs after > run-prod.log 2>&1; echo "$who $?" >> ../final-summary.txt) &
done
wait
kill $(cat /tmp/qa-media.pid) 2>/dev/null
bad=$(awk '$2!=0' $V/final-summary.txt | tr '\n' ' ')
if [ -z "$bad" ]; then p "PASS G1 all 5 personas exit 0 on $PROD"; else p "FAIL G1 non-zero: $bad"; fi

# G6: delete the QA rows this run (and earlier runs) created, then require zero left
$ENVF sh -c 'for t in "comments?text=like.QA-*" "projects?or=(source_url.like.http://localhost*,source_url.like.http://127.0.0.1*)" "folders?title=like.QA-*"; do curl -s -o /dev/null -X DELETE -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_URL/rest/v1/$t"; done'
n1=$(rest "projects?select=id&or=(source_url.like.http://localhost*,source_url.like.http://127.0.0.1*)" | count)
n2=$(rest "comments?select=id&text=like.QA-*" | count)
n3=$(rest "folders?select=id&title=like.QA-*" | count)
if [ "$n1$n2$n3" = "000" ]; then p "PASS G6 QA rows remaining: projects=0 comments=0 folders=0"; else p "FAIL G6 QA rows remaining: projects=$n1 comments=$n2 folders=$n3"; fi
exit $fail
