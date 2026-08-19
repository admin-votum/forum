# forum policy publishing checklist

**Status:** draft checklist; policies remain unpublished until factual and legal/operator review.
**Scope:** forum web-only release.

## Before approval

- [ ] Confirm the legal operator/entity, service jurisdictions, governing law, and effective date.
- [ ] Confirm the actual DigitalOcean/PDS, database, media, email, backup, and federation architecture.
- [ ] Replace every placeholder in `PRIVACY-DRAFT.md`, `TERMS-DRAFT.md`, and `MODERATION-DRAFT.md` with verified facts.
- [ ] Confirm retention and deletion behavior, including security logs, moderation/appeals, support mail, backups, legal holds, and federated copies.
- [ ] Verify the real account deletion and data-export flows; document limitations and user-facing URLs.
- [ ] Verify reporting, blocking, muting, takedown, appeal, and security-contact workflows.
- [ ] Confirm `hello@frm.ink` forwarding is monitored and decide whether a dedicated abuse/security address is needed.
- [ ] Obtain operator approval and qualified legal review. These drafts are not legal advice.

## Advertising and measurement decision

- [ ] Keep analytics disabled for the initial release.
- [ ] Keep behavioral/personalized advertising, ad-network scripts, tracking cookies, fingerprinting, and sale/share of personal information disabled.
- [ ] If advertising is introduced later, prefer contextual ads or direct sponsorships selected from page context rather than user history.
- [ ] Before enabling any vendor, complete a separate vendor, privacy, consent, data-processing, supply-chain, and regional opt-out review.
- [ ] Update the privacy notice and change log before enabling a materially different advertising or measurement model.

## Publication

- [ ] Publish the approved privacy notice at the final stable URL.
- [ ] Publish approved terms at the final stable URL.
- [ ] Publish the approved community/moderation policy at the final stable URL.
- [ ] Publish abuse and security reporting instructions at the final stable URL.
- [ ] Link each page from the web client footer, help/settings surface, or other consistently discoverable location.
- [ ] Record publication URLs, version/date, approver, and deployment/release identifier in the compliance matrix.
- [ ] Re-test every published link in production and confirm the contact address receives mail.

## Release evidence

- [ ] Re-run the web build and generated-artifact branding/secret scan against the release commit.
- [ ] Re-generate dependency inventory and CycloneDX SBOM from the final lockfile.
- [ ] Complete third-party license and notice review; preserve upstream license and attribution.
- [ ] Attach redacted PDS/firewall/service/backup/restore/security/federation evidence.
- [ ] Keep this checklist and the matrix with the release record; do not publish internal redacted evidence.
