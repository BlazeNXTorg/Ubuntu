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
| Boot time | ~2 min with the desktop stack, ~1 min SSH-only (measured ~50 s for the apt install) |
| Backup | `$HOME` + custom paths, restored into the next session |

## Secrets required

`Settings → Secrets and variables → Actions`:

| Secret | Purpose |
|---|---|
| `TAILSCALE_AUTH_KEY` | ephemeral reusable key from the Tailscale admin console |
| `LINUX_PASSWORD` | password for **both** `root` and `runner` (SSH + RDP) |

## Accounts

| Account | Password | Powers |
|---|---|---|
| `root` | `LINUX_PASSWORD` secret | full root, direct login over SSH and RDP |
| `runner` | `LINUX_PASSWORD` secret | passwordless `sudo` — also full root |

`root_login: false` disables the root account login (SSH `PermitRootLogin no`,
xrdp `AllowRootLogin=false`) and leaves you with `runner` + sudo.

> **Security:** root plus a simple password on a reachable port is the easiest way
> into a box. It is reachable only from your tailnet, but anyone in that tailnet can
> take it over with one command. Set `root_login: false` when you do not need it.

## Run it

`Actions` → **BlazeNXT Ubuntu Workstation** → **Run workflow**.
The full desktop stack installs in **~50 seconds** on the ubuntu-24.04 image
(measured), so a session is usable about **2 minutes** after you press Run.
Set `install_desktop: false` for an SSH + Docker box that is ready almost immediately.

Read the run **Summary** for the live addresses.

## Sandbox folder and backups

Put the agent's work in **`/workspace`** — it is created at boot and is the one
thing that survives. Backups are **encrypted with AES-256 before upload** (the
`BACKUP_PASSPHRASE` secret), because this repository is public and artifacts on a
public repo are downloadable by anyone.

| | |
|---|---|
| Persisted by default | `/workspace` + tiny config files (`.ssh`, `.gitconfig`, `.bashrc`, `.profile`, ...) |
| Add more | `persist_paths` input, e.g. `/opt/data;/srv/app` |
| Encrypted | yes — gpg symmetric AES-256, verified by a decrypt-and-compare self-test on every backup |
| Size cap | `persist_max_mb` (default 300). Over the cap the upload is **skipped** with a warning, never silently uploaded |
| Kept | latest backup only (older ones pruned) |
| Without the passphrase | backup is skipped entirely — plaintext is never uploaded to a public repo |

Decrypt a backup on your own machine:

```bash
gpg --decrypt -o backup.tar.gz backup.tar.gz.gpg   # enter the passphrase
tar -xzf backup.tar.gz
```

> Note: `$HOME` is **not** backed up wholesale. This image ships gigabytes of
> runtimes in `$HOME` (the runner's own `actions-runner` alone measured 1353 MB),
> so home-wide backups were unpredictable and blew past the cap. Explicit paths only.

## Continuity - manual only

**Nothing starts on its own.** There is no cron and no self-chaining. You start a
session from the Actions tab when you need one and cancel it when the work is done.

To start: `Actions` -> **BlazeNXT Ubuntu Workstation** -> **Run workflow**.
To stop:  `Actions` -> **BlazeNXT Ubuntu STOP** -> type `STOP`.

A session still ends by itself at `duration_minutes` (default 330) and saves its
backup then; GitHub's hard ceiling of 355 minutes applies regardless.

## Sandbox folder and backups

Put the agent's work in **`/workspace`** — it is created at boot and is the one
thing that survives. Backups are **encrypted with AES-256 before upload** (the
`BACKUP_PASSPHRASE` secret), because this repository is public and artifacts on a
public repo are downloadable by anyone.

| | |
|---|---|
| Persisted by default | `/workspace` + tiny config files (`.ssh`, `.gitconfig`, `.bashrc`, `.profile`, ...) |
| Add more | `persist_paths` input, e.g. `/opt/data;/srv/app` |
| Encrypted | yes — gpg symmetric AES-256, verified by a decrypt-and-compare self-test on every backup |
| Size cap | `persist_max_mb` (default 300). Over the cap the upload is **skipped** with a warning, never silently uploaded |
| Kept | latest backup only (older ones pruned) |
| Without the passphrase | backup is skipped entirely — plaintext is never uploaded to a public repo |

Decrypt a backup on your own machine:

```bash
gpg --decrypt -o backup.tar.gz backup.tar.gz.gpg   # enter the passphrase
tar -xzf backup.tar.gz
```

> Note: `$HOME` is **not** backed up wholesale. This image ships gigabytes of
> runtimes in `$HOME` (the runner's own `actions-runner` alone measured 1353 MB),
> so home-wide backups were unpredictable and blew past the cap. Explicit paths only.

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
