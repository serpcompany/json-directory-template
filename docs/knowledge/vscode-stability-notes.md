# VS Code Stability Notes

## 2026-03-23 crash audit

Observed from local VS Code logs:

- `main.log` repeatedly recorded `CodeWindow: renderer process gone (reason: crashed, code: 5)`
- one crash sequence also logged `CodeWindow: detected unresponsive` immediately before the renderer crash
- no matching macOS crash report was present under `~/Library/Logs/DiagnosticReports`, which points more toward VS Code/Electron renderer instability than an OS-level app crash dump
- the active log session contained a large extension/process footprint:
  - `30` `window*` log directories under one VS Code log session
  - `624` `mcpServer*.log` files under that same session
- `window1/renderer.log` showed heavy extension/skill churn and repeated extension-host-side errors such as:
  - duplicate skill discovery warnings
  - repeated `q hook keyboard-focus-changed vscode 0` failures because `q` was not found
  - Foam document-link errors for untitled buffers

## Likely cause

The strongest evidence points to renderer overload and extension churn, not a problem in this repo's build code itself.

Contributing factors:

- too many active VS Code windows / renderer instances in one session
- a very large MCP/extension footprint per session
- noisy failing extension hooks (`q` command not found)
- repeated extension host restarts around the same time as renderer crashes

## Recommendations

### Highest impact

- keep fewer VS Code windows open at once
- avoid launching many parallel shell/search processes during one session
- reduce active MCP/extension load to the tools needed for the current task

### Extension cleanup

- remove or disable the extension or hook that keeps calling `q hook keyboard-focus-changed`
- disable unused extensions that were added during experimentation if they are not part of the normal workflow
- reduce duplicate skill/agent discovery sources if possible so the renderer does less startup work

### Workflow hygiene for this repo

- prefer narrower `rg` searches over broad repo-wide scans when the target area is already known
- keep verification commands scoped to the files/packages being changed
- avoid stacking many long-running tasks in parallel from VS Code
- prefer one active branch/task window for this repo instead of opening many windows/tabs for the same workspace

## Files checked

- `~/Library/Application Support/Code/logs/20260323T101227/main.log`
- `~/Library/Application Support/Code/logs/20260323T101227/sharedprocess.log`
- `~/Library/Application Support/Code/logs/20260323T101227/window1/renderer.log`
- `~/Library/Application Support/Code/logs/20260323T101227/ptyhost.log`
- `~/Library/Logs/DiagnosticReports`
