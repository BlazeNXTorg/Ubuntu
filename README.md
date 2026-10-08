# BlazeNXT Ubuntu Workstation

An on-demand **Ubuntu 24.04 cloud workstation** you reach from your phone over
Tailscale. Four ways in, one machine:

| Method | How | Best for |
|---|---|---|
| **SSH** | `ssh runner@blazenxt-ubuntu` | terminal, git, docker, scripts |
| **RDP (xrdp)** | Microsoft Remote Desktop → `blazenxt-ubuntu:3389` | same app you already use for Windows |
| **noVNC** | `http://blazenxt-ubuntu:6080/vnc.html` | full XFCE desktop in a browser, nothing to install |
| **code-server** | `http://blazenxt-ubuntu:8080/` | VS Code in the browser |

> **Public repository, on purpose.** Standard GitHub-hosted runners on a public
> repo get **4 vCPU / 16 GB / 14 GB SSD** and **unlimited free minutes**. The same
> workflow on a private repo gets 2 vCPU / 8 GB and burns the free 2,000 min/month.
> Secrets are never exposed — but run logs, run inputs and the job summary are public.

## Why this beats the Windows variant

- **Docker works natively** — Linux containers, `docker compose`, databases, web servers.
  On the Windows runner only Windows containers work, because there is no nested virtualization.
- Cheapest minutes on any plan, and `apt` is far faster than `winget`.
- SSH makes automation trivial.

## What a session gives you

| | |
|---|---|
| Machine | Ubuntu 24.04, **4 vCPU / 16 GB / 14 GB SSD** |
| Session | up to **330 minutes** (GitHub hard-kills at 360) |
| Network | Tailscale node `blazenxt-ubuntu` + MagicDNS |
| Desktop | XFCE via xrdp and via noVNC |
| Docker | preinstalled engine + compose, keep-alive container |
| Watchdog | every 5 min: SSH, xrdp, VNC, noVNC, code-server, Tailscale, Docker self-heal |
| Backup | `$HOME` + custom paths, restored into the next session |

## Secrets required

`Settings → Secrets and variables → Actions`:

| Secret | Purpose |
|---|---|
| `TAILSCALE_AUTH_KEY` | ephemeral reusable key from the Tailscale admin console |
| `LINUX_PASSWORD` | password for the `runner` account (SSH + RDP) |

## Run it

`Actions` → **BlazeNXT Ubuntu Workstation** → **Run workflow**.
Full desktop stack boots in roughly **6–8 minutes**; set `install_desktop: false`
for an SSH + Docker box in about a minute.

Read the run **Summary** for the live addresses.

## Continuity

- Sessions **self-chain**: each one dispatches its own successor when it ends.
- A **6-hourly cron** is the backstop if a session is killed early.
- State is **backed up at shutdown and restored at boot**: `$HOME` (minus caches)
  plus anything in `persist_paths`, capped at `persist_max_mb` (default 300 MB —
  the Free plan gives ~500 MB of artifact storage in total).
- Connect by **node name**, never the raw IP: a Tailscale re-registration can change the IP.

## Hard limits

- **6-hour ceiling.** Every job is killed at 360 min; the VM and everything on it are
  destroyed at the end. Nothing is continuous.
- **24×7 is not possible** on GitHub-hosted runners, and using them as an
  always-on box violates GitHub's Additional Product Terms (consequences include
  job termination, Actions restrictions, repo disabling, account suspension).
  Stop it any time with the **BlazeNXT Ubuntu STOP** workflow.
- **Artifacts on a public repo are publicly downloadable** — never put private
  keys, tokens or sensitive data in the backed-up home folder.
- SSH password login uses a weak default password unless you change `LINUX_PASSWORD`.
- Do not flip this repo private while the cron is on: 24×7 would cost roughly
  **$180/month** at Linux rates, and it would blow past the Free allowance instantly.

## Want it truly permanent?

Rent a small Linux VPS ($5–15/month) and run the same stack. On a real machine
nothing is ephemeral, Docker is native, and this workflow's scripts port over almost unchanged.
