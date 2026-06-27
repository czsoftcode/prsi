# Security review — phases 1–29

- **Range:** `git diff 93bb305b121f43a8bffdba3c94d66e54c1716905..18eb5b1a61b29bffd6fea21a5df4c8b863dfd04c`
- **Reviewed at:** `18eb5b1a61b29bffd6fea21a5df4c8b863dfd04c` / `2.2.2`
- **Method:** Targeted review of security sinks rather than an exhaustive line-by-line audit: browser script trust, DOM construction and persistence, build-time filesystem access, GitHub Actions permissions, npm lifecycle/dependency exposure, and git-shared `.mini/` prompt data. Exact locked dependencies were also checked with `npm audit` on 2026-06-27.
- **Threat model:** This is a static browser game with no backend, accounts, secrets, or application API. Relevant attackers are a compromised analytics or package/action supplier, a malicious git contribution (especially committed `.mini/` instructions), or hostile local/browser input reaching the build scanner or DOM; ordinary remote users have no server-side execution surface.

## Verdict
Four should-know findings. None is a blocker for the static game, but each crosses a real trust boundary under the stated conditions.

## Findings
### SEC-1 · should-know · Locked test toolchain contains known critical/high advisories
**Where:** `package.json:18`

The project locks `vitest@2.1.9`, which brings `vite@5.4.21` and `esbuild@0.21.5` under Vitest even though the direct application build uses the newer `vite@6.4.3`. The official npm audit reports five vulnerable dependency nodes: a critical Vitest arbitrary-file read/execution issue when its UI server is listening (GHSA-5xrq-8626-4rwp), high/moderate Vite path and filesystem-boundary bypasses, and an esbuild development-server cross-origin read issue. The checked-in `npm test` command uses one-shot `vitest run`, so the critical UI-server path is not exposed by the normal CI command and none of these packages ships in the browser bundle. It becomes reachable when a developer starts the affected Vitest UI/server or otherwise exposes the nested development server. Upgrade Vitest to a fixed supported release (the audit proposes `4.1.9`) and re-lock dependencies; verify the test suite after the major upgrade.

### SEC-2 · should-know · Remote analytics host executes unrestricted code in the game origin
**Where:** `index.html:8`

Every visitor loads JavaScript from `https://plausible.softcode.cz/` without a Subresource Integrity hash or a Content Security Policy that meaningfully limits script execution. If that host, its deployment credentials, or DNS/TLS termination is compromised, the returned script runs with the same DOM and localStorage access as the game and can alter gameplay, track children beyond the intended analytics, or replace the page. The game stores no credentials, so confidentiality impact is limited, but integrity and privacy are directly exposed. Prefer a pinned/self-hosted immutable asset with SRI where operationally possible, and deploy a restrictive CSP that allows only the required script source and avoids unrestricted inline script.

### SEC-3 · should-know · Build dependencies and mutable Action tags sit on the Pages deployment path
**Where:** `.github/workflows/deploy.yml:8`

`pages: write` and `id-token: write` are declared at workflow scope, so the build job receives OIDC capability while it runs `npm ci`, tests, and the build. The lock contains executable install hooks (`esbuild` and optional `fsevents`), and all five GitHub Actions are referenced through mutable major-version tags rather than immutable commit SHAs. A compromised locked package release/install script or a moved/compromised Action tag can therefore run before the artifact is uploaded; at minimum it can poison `dist`, which the separate deploy job then publishes, and the build job also has broader credentials than it needs. Give the build job only `contents: read`, move `pages: write` and `id-token: write` to the deploy job, pin Actions to reviewed commit SHAs, and keep dependency update review/audit on the deployment path.

### SEC-4 · should-know · Git-shared `.mini` text becomes privileged agent instructions
**Where:** `.mini/project.md:1`

The repository commits project, phase, discussion, run, and memory text under `.mini/`; `mini context` later concatenates that shared content into prompts. A malicious contributor can hide instructions in one of those files, wait for a developer to check out the branch, and rely on the developer invoking `mini auto` or another workflow with edit/command permissions. At that point prose from the repository is interpreted by an agent that can modify files and run tools; there is no code-level trust boundary in this project between descriptive state and instructions. No malicious payload was found in the reviewed `.mini` files, but the structural path is real. Treat `.mini` changes like executable workflow changes in review, avoid autonomous/elevated modes on untrusted branches, and have the orchestrator clearly delimit untrusted repository text and require human confirmation before consequential commands.

## Checked and clean
- **Process execution:** Application and Vite config contain no `child_process`, shell interpolation, `eval`, or dynamic function construction. Workflow shell commands are static; the remaining execution exposure is the dependency/Action supply chain described above.
- **Filesystem paths:** The theme scanner roots reads under `process.cwd()/public`, accepts only exactly two decimal digits as a theme ID, and constructs fixed filenames. The reviewed input cannot inject `..` or an absolute path into `resolve()`.
- **DOM injection:** Production UI builds elements with `createElement`, assigns user-visible values through `textContent`, and derives image paths from typed card constants or validated two-digit theme IDs. Production code does not use `innerHTML`, `document.write`, or URL-fed HTML.
- **Persistence/parsing:** localStorage contains only theme, music, and hint preferences; theme values are checked against the generated registry and the boolean preferences use fixed comparisons. Failures are caught and do not become code or markup.
- **Network/auth/secrets:** There is no application fetch/XHR/WebSocket, backend listener, authentication, or secret persistence. The only runtime network trust beyond same-origin static assets is the analytics script in SEC-2.
- **Dependency integrity:** `package-lock.json` pins registry URLs and integrity hashes, and the production application has no runtime npm dependency. This limits nondeterminism but does not remove the known advisories or install-script risk in SEC-1/SEC-3.
