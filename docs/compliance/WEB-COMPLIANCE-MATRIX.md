# forum web compliance matrix — draft

Status: **in progress; pending operator and legal approval**  
Scope: forum web release only. Native iOS/Android, App Clip, share extension, and auxiliary legacy services are out of scope for this release.

## Evidence baseline

- Local checkout: `/Users/roma/Desktop/frm`
- Audited commit: `783dfe2a123b5c3a245d1e43a01e543d05849394`
- Upstream remote: `https://github.com/bluesky-social/social-app`
- Audited web artifact: `web-build/` generated successfully by `pnpm build-web` in the isolated compliance worktree; existing compile and bundle-size warnings were emitted.
- Netlify project: `forumweb` (`site_id a7fe0b38-2b91-44c1-8b23-c09afc70f2ca`), linked with the authenticated Netlify CLI.
- Production deploy: `6a6cbe4125e8360bd993500e` at `https://6a6cbe4125e8360bd993500e--forumweb.netlify.app`, published to `https://frm.ink` on 2026-07-31.

## Gate table

| Gate | Current state | Evidence / next action |
|---|---|---|
| Runtime smoke check | Pass for deployed web artifact | Fixed `NavSignupCard` to obtain the theme via `useTheme()` instead of referencing an undefined `t`, and changed its home label to forum. `pnpm run typecheck:web` now passes; production bundle `main.e834011f.js` contains the corrected label and no literal type-error text. |
| Splash eye animation | Pass for initial-load implementation | The static first-paint splash now has an immediate CSS blink cycle (`frm-blink`) with reduced-motion handling; the React logo also begins in the blink state and opens after 130ms before its normal periodic blink cycle. Production deploy `6a6cc724dadd8e1034402e8e` published on 2026-07-31. |
| ArtOfFact feed navigation | Pass for deployed desktop web surface | Added ArtOfFact as a first-class external feed entry beside Following and pinned Feeds/Universe in `DesktopFeeds`; removed leading pictographic emoji from pinned feed labels while preserving their underlying descriptors. The legacy right-rail card remains available beneath Trending. Production deploy `6a6cc4f85f94ce1e2d47baa7` published on 2026-07-31; live bundle contains the ArtOfFact entry and emoji-normalization logic. |
| Live `frm.ink` web deployment | Pass for deployment; broader release gates remain open | Production deploy `6a6cbe4125e8360bd993500e` published through Netlify project `forumweb`. `https://frm.ink` returned HTTP 200 and live checks passed for title, manifest, favicon links, forum branding, and absence of old upstream branding in landing HTML. |
| Web title, metadata, favicon, splash | Pass for verified live surface | Live HTML title is `forum`; manifest name/short_name are `forum`; favicon and splash/logo assets are linked/present. Full rendered-browser interaction and every asset variant remain outside this curl check. |
| Public Bluesky identity removed from web surface | Partial pass | Verified live landing HTML contains no `bluesky`, `bsky.social`, or `go.bsky.app` strings. Source and bundled protocol-required/upstream references remain and need classification; do not treat this as a whole-repository removal. |
| Upstream license preserved | Partial pass | Root `LICENSE` is retained. Legal review must confirm obligations for the final fork commit. |
| Fork attribution / NOTICE | Draft added | Review `NOTICE-FRM-DRAFT.md`; contact is now `hello@frm.ink`; obtain legal approval. |
| Dependency attribution / SBOM | Evidence generated from current lockfile | Re-generate against the final release lockfile and complete license/notice review. |
| Privacy policy | Not published | Draft and publish under operator-approved URL. |
| Terms | Not published | Draft and publish under operator-approved URL. |
| Community / moderation policy | Not published | Draft and publish; verify reporting, blocking, muting, takedown and appeal behavior. |
| Support / abuse / security contact | Temporary forwarding address configured | Verify forwarding remains monitored; replace with dedicated addresses later. |
| Account deletion / export | Not evidenced | Test real web flows and capture URLs/screenshots. |
| Security review | Firewall applied; Caddy routing verified; remaining hardening operator-deferred | Redacted server output (2026-07-31): Caddy uses on-demand TLS for `pds.frm.ink` and `*.pds.frm.ink`, reverse-proxying to local `localhost:3000`; TLS ask endpoint is local. Public HTTPS root/health checks passed; external TCP 3000 probe timed out after firewall application, consistent with blocking. Backup/restore, maintenance, monitoring, and update-control evidence are operator-deferred. |
| PDS / federation operations | Preliminary host evidence received; operational evidence operator-deferred | Redacted server output (2026-07-31): Docker Compose project `/pds/compose.yaml` active with PDS, Caddy, and Watchtower containers; `/pds/pds.env` is used. Host networking means container ports are host ports. Caddy config/upstream verified; backups/restore, secrets handling, auto-update policy, monitoring, and federation behavior remain unevidenced by operator choice. |
| Analytics / advertising | Decision recorded: contextual-only if ads are added later | No analytics, behavioral/personalized advertising, ad-network scripts, tracking cookies, fingerprinting, or sale/share of personal information. Future contextual/direct sponsorship requires separate vendor, privacy, consent, and supply-chain review. |

## Release blockers

1. Confirm `hello@frm.ink` remains monitored and publish it only after operator/legal approval.
2. Publish operator-approved privacy, terms, moderation, and abuse/security pages.
3. Finish web artifact scan after the rebrand changes are committed.
4. Re-generate the SBOM against the final lockfile and complete the third-party license/notice inventory.
5. Obtain legal review of upstream license/trademark attribution.
6. Produce evidence for account deletion/export and moderation workflows.
7. Complete production PDS backup, restore, security, and federation evidence.
