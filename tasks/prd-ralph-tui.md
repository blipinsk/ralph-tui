# PRD: Ralph TUI - AI Agent Loop Orchestrator

## Introduction

Ralph TUI is a terminal user interface and execution engine for orchestrating AI agent loops. It replaces the existing shell scripts (`ralph.sh`, `ralph-beads.sh`) with a proper TUI application that provides observability, control, and a plugin-based architecture for both agent execution and issue tracking.

The tool manages iterative AI agent workflows where an agent (Claude Code, OpenCode, etc.) works through a list of tasks from an issue tracker (Beads, JSON file, etc.), with the TUI providing real-time visibility into progress, the ability to pause/resume, and session persistence.

**Repository:** `~/dev/ralph-tui` (standalone, installable via npm)

**Tech Stack:** TypeScript + [OpenTUI](https://github.com/sst/opentui) with React reconciler (SST's high-performance TUI framework with Zig-powered rendering)

## Goals

- Replace shell scripts with a robust, user-friendly TUI execution engine
- Provide real-time observability into agent iterations and task progress
- Support pause/resume and graceful interruption of agent loops
- **Plugin architecture for agent providers** (claude, opencode, extensible)
- **Plugin architecture for issue trackers** (json, beads, beads+bv, extensible for Linear/GitHub/etc.)
- Interactive project setup with persistent per-project configuration
- Session persistence to resume interrupted runs
- Iteration output persistence for later review
- Easy installation via `npm install -g ralph-tui` or `npx ralph-tui`
- One instance per git repository (prevent concurrent runs in same repo)

## User Stories

### US-001: Project Scaffolding and Package Setup
**Description:** As a developer, I want to initialize the ralph-tui repository with proper TypeScript/OpenTUI structure so I can start development.

**Acceptance Criteria:**
- [ ] Create `~/dev/ralph-tui` repository
- [ ] Initialize with `pnpm init`
- [ ] Set up TypeScript with strict mode
- [ ] Install OpenTUI dependencies (`@opentui/core`, `@opentui/react`)
- [ ] Install Zig (required by OpenTUI)
- [ ] Set up directory structure: `src/`, `src/commands/`, `src/tui/`, `src/plugins/agents/`, `src/plugins/trackers/`
- [ ] Add `tsconfig.json` with proper config
- [ ] Add build scripts in `package.json`
- [ ] `pnpm build` succeeds

### US-002: Configuration System
**Description:** As a developer, I want a configuration system that supports global defaults and per-project settings so Ralph remembers my preferences.

**Acceptance Criteria:**
- [ ] Global config at `~/.config/ralph/config.yaml`
- [ ] Project config at `.ralph.yaml` in project root
- [ ] Project config overrides global config
- [ ] Config schema includes: `tracker`, `tracker_options`, `agent`, `agent_options`, `max_iterations`, `auto_commit`
- [ ] Config validation with helpful error messages using Zod
- [ ] `ralph config show` command displays merged configuration
- [ ] `pnpm build` succeeds

### US-003: Interactive Project Setup
**Description:** As a user running Ralph in a new project, I want to be asked setup questions so I can configure Ralph for my project.

**Acceptance Criteria:**
- [ ] Detect when no `.ralph.yaml` exists in current directory
- [ ] Prompt: "Which issue tracker?" (list installed tracker plugins)
- [ ] Show tracker-specific follow-up questions (e.g., epic ID for beads)
- [ ] Prompt: "Which agent CLI?" with auto-detection of installed agents
- [ ] Prompt: "Max iterations per run?" (default: 10)
- [ ] Prompt: "Auto-commit on task completion?" (yes/no)
- [ ] Save answers to `.ralph.yaml`
- [ ] Option to skip setup with `--no-setup` flag
- [ ] `pnpm build` succeeds

### US-004: Agent Plugin Architecture
**Description:** As a developer, I want a plugin system for agent providers so I can easily add support for new AI agent CLIs.

**Acceptance Criteria:**
- [ ] Define `AgentPlugin` TypeScript interface: `name`, `detect()`, `execute(prompt, files)`, `interrupt()`
- [ ] Plugin discovery from `~/.config/ralph/plugins/agents/` directory
- [ ] Built-in plugins: `claude`, `opencode`
- [ ] Plugin config in yaml: command path, default flags, timeout
- [ ] Plugins are separate TypeScript modules that implement the interface
- [ ] `ralph plugins agents` shows available agent plugins
- [ ] `pnpm build` succeeds

### US-005: Tracker Plugin Architecture
**Description:** As a developer, I want a plugin system for issue trackers so I can easily add support for new tracking backends.

**Acceptance Criteria:**
- [ ] Define `TrackerPlugin` TypeScript interface (see Technical Considerations)
- [ ] Plugin discovery from `~/.config/ralph/plugins/trackers/` directory
- [ ] Built-in plugins: `json` (default), `beads`, `beads-bv`
- [ ] Plugin config in yaml with tracker-specific options
- [ ] Plugins are separate TypeScript modules that implement the interface
- [ ] `ralph plugins trackers` shows available tracker plugins
- [ ] Each tracker plugin defines its own setup questions
- [ ] Interface supports bidirectional sync for trackers that need it
- [ ] `pnpm build` succeeds

### US-006: Claude Code Agent Plugin
**Description:** As a user, I want Ralph to execute iterations using Claude Code CLI so I can use my preferred agent.

**Acceptance Criteria:**
- [ ] Implement `AgentPlugin` interface for Claude Code
- [ ] Auto-detect `claude` binary in PATH using `which`
- [ ] Execute with `-p` (print mode), `--dangerously-skip-permissions`
- [ ] Support `--model` flag passthrough
- [ ] Capture stdout/stderr and parse for completion signals
- [ ] Handle graceful interruption (send SIGINT via Node child_process)
- [ ] Timeout handling with configurable duration
- [ ] `pnpm build` succeeds

### US-007: OpenCode Agent Plugin
**Description:** As a user, I want Ralph to execute iterations using OpenCode CLI so I can use my preferred agent.

**Acceptance Criteria:**
- [ ] Implement `AgentPlugin` interface for OpenCode
- [ ] Auto-detect `opencode` binary in PATH
- [ ] Execute with `opencode run --agent general`
- [ ] Support `--model` and `--file` flag passthrough
- [ ] Capture stdout/stderr and parse for completion signals
- [ ] Handle graceful interruption
- [ ] Timeout handling with configurable duration
- [ ] `pnpm build` succeeds

### US-008: JSON Tracker Plugin (prd.json) - Default
**Description:** As a user, I want a JSON file tracker as the default so I can use the simpler file-based tracking mode.

**Acceptance Criteria:**
- [ ] Implement `TrackerPlugin` interface for JSON
- [ ] Set as default tracker when no tracker specified
- [ ] Parse `prd.json` file format (see existing example)
- [ ] `getTasks()`: Read user stories with `id`, `title`, `description`, `acceptanceCriteria`, `priority`, `passes`
- [ ] `getNextTask()`: Select highest priority where `passes: false`
- [ ] `completeTask()`: Update `passes: true` in file
- [ ] `isComplete()`: Check all stories have `passes: true`
- [ ] Setup questions: path to prd.json, branch name
- [ ] `pnpm build` succeeds

### US-009: Beads Tracker Plugin
**Description:** As a user, I want a Beads tracker plugin so I can use the git-native issue tracker.

**Acceptance Criteria:**
- [ ] Implement `TrackerPlugin` interface for Beads
- [ ] `detect()`: Check for `.beads/` directory and `bd` binary
- [ ] `getTasks()`: Execute `bd list --parent=EPIC --status=open --json`
- [ ] `getNextTask()`: Select first open task by priority
- [ ] `getTaskDetail()`: Execute `bd show ID`
- [ ] `completeTask()`: Execute `bd update ID --status=closed`
- [ ] `isComplete()`: Check all epic children are closed
- [ ] Bidirectional: sync local changes back to beads
- [ ] Setup questions: epic ID
- [ ] `pnpm build` succeeds

### US-010: Beads + Beads Viewer Tracker Plugin (Smart Mode)
**Description:** As a user, I want a Beads+BV tracker plugin for smart dependency-aware task selection.

**Acceptance Criteria:**
- [ ] Implement `TrackerPlugin` interface extending Beads tracker
- [ ] `detect()`: Check for `.beads/` directory, `bd` binary, and `bv` binary
- [ ] `getNextTask()`: Execute `bv --robot-triage`, filter for epic children
- [ ] Parse JSON output for recommendations with scores and reasons
- [ ] Select unblocked tasks first based on bv scoring
- [ ] Provide "why this task" reasoning to TUI via `getTaskReasoning()`
- [ ] Fall back to beads-only behavior if bv unavailable
- [ ] Bidirectional: sync local changes back to beads
- [ ] `pnpm build` succeeds

### US-011: Core TUI Layout with OpenTUI React
**Description:** As a user, I want a well-organized TUI layout so I can see all relevant information at a glance.

**Acceptance Criteria:**
- [ ] Use OpenTUI framework with React reconciler (`@opentui/core`, `@opentui/react`)
- [ ] Header: Ralph status, epic/project name, elapsed time, tracker name
- [ ] Left panel: Task list with status indicators (done/active/pending/blocked)
- [ ] Right panel: Current iteration details or selected task details
- [ ] Footer: Keyboard shortcuts, progress bar
- [ ] Responsive layout that adapts to terminal size
- [ ] Styled components using OpenTUI primitives
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-012: Task List View
**Description:** As a user, I want to see all tasks in the loop with their status so I can understand overall progress.

**Acceptance Criteria:**
- [ ] List all tasks from active tracker plugin
- [ ] Status indicators: ✓ (done), ▶ (active), ○ (pending), ⊘ (blocked)
- [ ] Show task ID and title (truncated to fit)
- [ ] Highlight currently active task
- [ ] Keyboard navigation (j/k or arrows)
- [ ] Press Enter to drill into task details
- [ ] Show task count: "5/12 complete"
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-013: Task Detail View
**Description:** As a user, I want to drill into task details so I can see full description and acceptance criteria.

**Acceptance Criteria:**
- [ ] Show full task title and ID
- [ ] Show complete description (scrollable if long)
- [ ] Show acceptance criteria as checklist
- [ ] Show priority and labels/tags
- [ ] Show dependencies (blocked by / blocks) - if tracker supports it
- [ ] Show completion notes if closed
- [ ] Press Esc to return to list view
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-014: Iteration History View
**Description:** As a user, I want to see all iterations with key events so I can track what happened in each.

**Acceptance Criteria:**
- [ ] List all iterations: "Iteration 1 of 10"
- [ ] Show iteration status: completed/running/pending
- [ ] Show task worked on in each iteration
- [ ] Show duration of each iteration
- [ ] Show outcome: success/failure/interrupted
- [ ] Keyboard navigation through iterations
- [ ] Press Enter to drill into iteration details
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-015: Iteration Detail View
**Description:** As a user, I want to drill into iteration details to see agent output and key events.

**Acceptance Criteria:**
- [ ] Show iteration number and status
- [ ] Show task ID and title worked on
- [ ] Show start time, end time, duration
- [ ] Show key events timeline (task started, commit made, task closed, etc.)
- [ ] Show agent output (scrollable, potentially large)
- [ ] Syntax highlighting for code blocks in output
- [ ] Link to persisted output file
- [ ] Press Esc to return to iteration list
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-016: Progress Dashboard
**Description:** As a user, I want to see overall progress and time estimates so I know how the run is going.

**Acceptance Criteria:**
- [ ] Show progress bar: tasks completed / total tasks
- [ ] Show iteration progress: current / max iterations
- [ ] Show elapsed time since start
- [ ] Calculate and show estimated time remaining based on average iteration time
- [ ] Show current status: Running / Paused / Completed / Failed
- [ ] Show agent name and tracker name in use
- [ ] Auto-update every second when running
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-017: Pause and Resume
**Description:** As a user, I want to pause and resume Ralph so I can take breaks or handle interruptions.

**Acceptance Criteria:**
- [ ] Press `p` to pause after current iteration completes
- [ ] Show "Pausing after current iteration..." status
- [ ] Show "Paused" status when paused
- [ ] Press `p` again to resume
- [ ] State persisted to session file
- [ ] Can quit while paused and resume later with `ralph resume`
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-018: Graceful Interruption
**Description:** As a user, I want to interrupt Ralph with confirmation so I don't accidentally lose work.

**Acceptance Criteria:**
- [ ] Press `Ctrl+C` shows confirmation dialog
- [ ] Dialog: "Interrupt Ralph? Current iteration will be terminated. [y/N]"
- [ ] Press `y` to confirm: send SIGINT to agent, save state, exit
- [ ] Press `n` or Esc to cancel and continue
- [ ] Press `Ctrl+C` twice quickly to force quit immediately
- [ ] Agent process is properly terminated
- [ ] Session state saved before exit
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-019: Session Persistence
**Description:** As a user, I want Ralph to save session state so I can resume interrupted runs.

**Acceptance Criteria:**
- [ ] Session file: `.ralph-session.json` in project root
- [ ] Save: current iteration, task statuses, start time, pause state, tracker state
- [ ] Save after each iteration completes
- [ ] `ralph resume` command to continue from saved state
- [ ] `ralph status` command to check if resumable session exists
- [ ] Prompt to resume or start fresh when existing session found
- [ ] Clean up session file on successful completion
- [ ] `pnpm build` succeeds

### US-020: Iteration Output Persistence
**Description:** As a user, I want iteration output saved to files so I can review them later.

**Acceptance Criteria:**
- [ ] Create `.ralph/iterations/` directory in project root
- [ ] Save each iteration output to `iteration-{N}-{taskId}.log`
- [ ] Include: timestamp, task details, full agent stdout/stderr, duration, outcome
- [ ] Structured header with metadata, raw output below
- [ ] `ralph logs` command to list/view past iteration logs
- [ ] `ralph logs --iteration 5` to view specific iteration
- [ ] `ralph logs --task US-005` to view iterations for a task
- [ ] Clean up old logs with `ralph logs --clean --keep 10`
- [ ] `pnpm build` succeeds

### US-021: Single Instance Lock
**Description:** As a user, I want Ralph to prevent concurrent runs in the same git repository so I don't corrupt state.

**Acceptance Criteria:**
- [ ] Create lock file `.ralph.lock` when starting
- [ ] Lock file contains: PID, start time, session ID
- [ ] Check for existing lock on startup
- [ ] If lock exists, check if PID is still running
- [ ] If running: error with "Ralph already running in this repo (PID: X)"
- [ ] If stale lock: warn and offer to remove
- [ ] Remove lock file on clean exit
- [ ] Remove lock file on crash recovery
- [ ] `pnpm build` succeeds

### US-022: Execution Engine
**Description:** As a developer, I want a robust execution engine that runs agent iterations so the loop is reliable.

**Acceptance Criteria:**
- [ ] Iteration loop: select task (via tracker) → inject prompt → run agent → check result → update tracker
- [ ] Parse agent output for completion signals (`<promise>COMPLETE</promise>` or tracker-specific)
- [ ] Handle agent errors gracefully (retry? skip? abort?)
- [ ] Respect max iterations limit
- [ ] Emit events for TUI to consume (task started, task completed, iteration done, etc.)
- [ ] Configurable inter-iteration delay
- [ ] Save iteration output to file after each iteration
- [ ] `pnpm build` succeeds

### US-023: Prompt Template System
**Description:** As a user, I want customizable prompt templates so I can tailor agent instructions to my project.

**Acceptance Criteria:**
- [ ] Default templates bundled in package (one per tracker type)
- [ ] Custom template path in config: `prompt_template: ./my-prompt.md`
- [ ] Template variables: `{{taskId}}`, `{{taskTitle}}`, `{{taskDescription}}`, `{{acceptanceCriteria}}`, `{{epicId}}`, `{{epicTitle}}`, `{{trackerName}}`
- [ ] Use Handlebars template engine
- [ ] `ralph template show` to display current template
- [ ] `ralph template init` to copy default template for customization
- [ ] `pnpm build` succeeds

### US-024: PRD Creation Command
**Description:** As a user, I want to create a PRD from a feature description so I can start a new Ralph project.

**Acceptance Criteria:**
- [ ] `ralph init` command starts interactive PRD creation
- [ ] Prompt for feature description
- [ ] Ask 3-5 clarifying questions (similar to PRD skill)
- [ ] Generate markdown PRD following the standard format
- [ ] Save to `./tasks/prd-[feature-name].md`
- [ ] Option to immediately convert to target tracker format
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-025: PRD to JSON Conversion
**Description:** As a user, I want to convert a markdown PRD to prd.json so I can use the JSON tracking mode.

**Acceptance Criteria:**
- [ ] `ralph convert --to json ./tasks/prd-feature.md`
- [ ] Parse user stories from markdown (US-XXX sections)
- [ ] Extract title, description, acceptance criteria
- [ ] Assign priorities based on story order (1, 2, 3...)
- [ ] Generate valid prd.json with `passes: false` for all
- [ ] Prompt for branch name
- [ ] Save to `./prd.json` or custom path
- [ ] `pnpm build` succeeds

### US-026: PRD to Beads Conversion
**Description:** As a user, I want to convert a markdown PRD to Beads issues so I can use the beads tracking mode.

**Acceptance Criteria:**
- [ ] `ralph convert --to beads ./tasks/prd-feature.md`
- [ ] Parse user stories from markdown
- [ ] Create epic bead for the feature
- [ ] Create child beads for each user story
- [ ] Set up dependencies based on story order or explicit deps
- [ ] Apply `ralph` label to all created beads
- [ ] Run `bd sync` after creation
- [ ] Display created bead IDs
- [ ] `pnpm build` succeeds

### US-027: Run Command
**Description:** As a user, I want a simple run command to start Ralph so I can begin working.

**Acceptance Criteria:**
- [ ] `ralph run` starts execution with current config
- [ ] `ralph run --epic EPIC_ID` to specify epic (beads trackers)
- [ ] `ralph run --prd ./prd.json` to specify prd file (json tracker)
- [ ] `ralph run --agent claude --model opus` to override agent settings
- [ ] `ralph run --tracker beads-bv` to override tracker
- [ ] `ralph run --iterations 20` to override max iterations
- [ ] Check for existing session and prompt to resume or start fresh
- [ ] Check for existing lock and error if running
- [ ] Validate configuration before starting
- [ ] `pnpm build` succeeds
- [ ] Verify in terminal

### US-028: Status Command (Headless)
**Description:** As a user, I want a status command for CI/scripts so I can check Ralph status without the TUI.

**Acceptance Criteria:**
- [ ] `ralph status` shows current run status (JSON output with `--json`)
- [ ] Show: running/paused/completed/no-session
- [ ] Show task progress: 5/12 completed
- [ ] Show current iteration: 3/10
- [ ] Show elapsed time
- [ ] Show active tracker and agent
- [ ] Exit code: 0 (completed), 1 (running/paused), 2 (failed)
- [ ] `pnpm build` succeeds

### US-029: Log Output Mode
**Description:** As a user, I want a non-interactive log mode for CI/scripts so I can run Ralph headlessly.

**Acceptance Criteria:**
- [ ] `ralph run --no-tui` runs without TUI
- [ ] Stream structured log output to stdout
- [ ] Log format: `[timestamp] [level] [component] message`
- [ ] Progress updates: `[INFO] [progress] Iteration 3/10: Working on US-005`
- [ ] Agent output streamed with `[AGENT]` prefix
- [ ] Supports all the same flags as TUI mode
- [ ] Still saves iteration output to files
- [ ] `pnpm build` succeeds

### US-030: Help and Documentation
**Description:** As a user, I want comprehensive help so I can learn how to use Ralph.

**Acceptance Criteria:**
- [ ] `ralph --help` shows all commands with descriptions
- [ ] `ralph <command> --help` shows command-specific help
- [ ] `ralph plugins --help` shows plugin management help
- [ ] `ralph docs` opens documentation in browser (or shows URL)
- [ ] In-TUI help: press `?` to show keyboard shortcuts
- [ ] README.md with installation, quick start, configuration reference
- [ ] `pnpm build` succeeds

### US-031: npm Package Configuration
**Description:** As a developer, I want proper npm package setup so users can easily install Ralph.

**Acceptance Criteria:**
- [ ] `package.json` with proper `name`, `version`, `bin` fields
- [ ] Binary entry point: `bin: { "ralph": "./dist/cli.js" }`
- [ ] Shebang in CLI entry: `#!/usr/bin/env node`
- [ ] `files` field to include only necessary files
- [ ] `engines` field specifying Node.js version requirement
- [ ] `npm pack` produces valid tarball
- [ ] `npm install -g .` works locally
- [ ] `npx ralph-tui --help` works

## Functional Requirements

- FR-1: The TUI must use OpenTUI framework with React reconciler
- FR-2: Configuration must be YAML format, mergeable (global + project)
- FR-3: **Agents must be implemented as plugins implementing `AgentPlugin` interface**
- FR-4: **Trackers must be implemented as plugins implementing `TrackerPlugin` interface**
- FR-5: The execution engine must emit events (EventEmitter pattern) that the TUI subscribes to
- FR-6: Session state must be JSON for easy debugging and portability
- FR-7: All external commands (bd, bv, claude, opencode) must have configurable timeouts
- FR-8: The tool must gracefully handle missing dependencies (bd, bv, agents)
- FR-9: Progress estimates must be based on rolling average of last 5 iterations
- FR-10: The TUI must support terminals with minimum 80x24 dimensions
- FR-11: All user-facing text must be clear and jargon-free
- FR-12: Must require Zig installed for OpenTUI's native rendering
- FR-13: Plugin interfaces must be stable and documented for third-party extensions
- FR-14: Only one Ralph instance per git repository (lock file enforcement)
- FR-15: Iteration output must be persisted to files for later review
- FR-16: Tracker plugins must support bidirectional sync where applicable

## Non-Goals

- No web UI (TUI only for v1)
- No remote/distributed execution
- No built-in agent implementation (always delegates to external CLIs)
- No real-time collaboration features
- No automatic PRD generation from code analysis
- No built-in Linear/GitHub/Jira plugins (interface supports them, community can add)
- No plugin registry/marketplace (for now)
- No desktop notifications (for now)
- No watch mode for file changes
- No dry run mode

## Technical Considerations

### Directory Structure
```
ralph-tui/
├── src/
│   ├── cli.ts                # Entry point with Commander.js
│   ├── commands/             # CLI command handlers
│   │   ├── run.ts
│   │   ├── init.ts
│   │   ├── convert.ts
│   │   ├── status.ts
│   │   ├── config.ts
│   │   ├── logs.ts
│   │   └── plugins.ts
│   ├── config/               # Configuration loading/validation
│   │   ├── schema.ts         # Zod schemas
│   │   └── loader.ts
│   ├── engine/               # Execution engine
│   │   ├── engine.ts
│   │   ├── events.ts
│   │   ├── lock.ts           # Instance locking
│   │   └── types.ts
│   ├── plugins/
│   │   ├── agents/           # Agent plugins
│   │   │   ├── interface.ts
│   │   │   ├── claude.ts
│   │   │   └── opencode.ts
│   │   └── trackers/         # Tracker plugins
│   │       ├── interface.ts
│   │       ├── json.ts
│   │       ├── beads.ts
│   │       └── beads-bv.ts
│   ├── tui/                  # OpenTUI React components
│   │   ├── App.tsx
│   │   ├── views/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── IterationList.tsx
│   │   │   └── IterationDetail.tsx
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── ProgressBar.tsx
│   │       └── StatusBadge.tsx
│   ├── session/              # Session persistence
│   │   └── session.ts
│   ├── logs/                 # Iteration output persistence
│   │   └── iteration-logs.ts
│   └── templates/            # Default prompt templates
│       ├── beads.md
│       └── json.md
├── package.json
├── tsconfig.json
├── pnpm-lock.yaml
└── README.md
```

### Dependencies
```json
{
  "dependencies": {
    "@opentui/core": "latest",
    "@opentui/react": "latest",
    "react": "^18.2.0",
    "commander": "^12.0.0",
    "yaml": "^2.3.0",
    "zod": "^3.22.0",
    "handlebars": "^4.7.0",
    "execa": "^8.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0"
  }
}
```

### Agent Plugin Interface
```typescript
interface AgentPlugin {
  /** Unique identifier for this agent */
  name: string;

  /** Human-readable description */
  description: string;

  /** Check if agent CLI is available */
  detect(): Promise<boolean>;

  /** Execute agent with prompt, return output */
  execute(ctx: AgentExecutionContext): Promise<AgentOutput>;

  /** Interrupt running agent gracefully */
  interrupt(): Promise<void>;

  /** Get agent-specific config schema (for setup questions) */
  getConfigSchema(): z.ZodSchema;
}

interface AgentExecutionContext {
  prompt: string;
  files: string[];
  model?: string;
  timeout: number;
  signal: AbortSignal;
  config: Record<string, unknown>;
}

interface AgentOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}
```

### Tracker Plugin Interface
```typescript
interface TrackerPlugin {
  /** Unique identifier for this tracker */
  name: string;

  /** Human-readable description */
  description: string;

  /** Check if tracker is available/configured */
  detect(): Promise<boolean>;

  /** Initialize tracker with config (called once at start) */
  initialize(config: TrackerConfig): Promise<void>;

  /** Get all tasks in the current scope (epic, project, etc.) */
  getTasks(): Promise<Task[]>;

  /** Get the next task to work on (tracker decides priority/order) */
  getNextTask(): Promise<Task | null>;

  /** Get detailed info for a specific task */
  getTaskDetail(taskId: string): Promise<TaskDetail>;

  /** Mark a task as complete */
  completeTask(taskId: string, reason?: string): Promise<void>;

  /** Check if all tasks are complete */
  isComplete(): Promise<boolean>;

  /** Sync local changes back to tracker (bidirectional) */
  sync(): Promise<void>;

  /** Get tracker-specific config schema (for setup questions) */
  getConfigSchema(): z.ZodSchema;

  /** Get setup questions for interactive config */
  getSetupQuestions(): SetupQuestion[];

  /** Optional: Get "why this task" reasoning (for smart trackers like bv) */
  getTaskReasoning?(taskId: string): Promise<string[]>;

  /** Optional: Check if task is blocked */
  isTaskBlocked?(taskId: string): Promise<boolean>;

  /** Optional: Get blocking dependencies */
  getBlockers?(taskId: string): Promise<string[]>;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  priority?: number;
  labels?: string[];
}

interface TaskDetail extends Task {
  description: string;
  acceptanceCriteria?: string[];
  blockedBy?: string[];
  blocks?: string[];
  assignee?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface TrackerConfig {
  [key: string]: unknown;
}

interface SetupQuestion {
  key: string;
  prompt: string;
  type: 'text' | 'select' | 'confirm';
  options?: string[];  // for select type
  default?: string | boolean;
  required?: boolean;
}
```

### Event System
```typescript
type RalphEvent =
  | { type: 'iteration:start'; iteration: number; maxIterations: number }
  | { type: 'iteration:end'; iteration: number; duration: number; success: boolean; logFile: string }
  | { type: 'task:start'; task: Task }
  | { type: 'task:complete'; task: Task; success: boolean }
  | { type: 'task:reasoning'; taskId: string; reasons: string[] }
  | { type: 'agent:output'; chunk: string }
  | { type: 'error'; error: Error; recoverable: boolean }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'tracker:synced' };

class ExecutionEngine extends EventEmitter {
  on(event: 'event', handler: (e: RalphEvent) => void): this;
}
```

### Lock File Format
```typescript
interface LockFile {
  pid: number;
  startTime: string;  // ISO timestamp
  sessionId: string;
  agent: string;
  tracker: string;
}
```

### Iteration Log Format
```
# Ralph Iteration Log
# Iteration: 3
# Task: US-005
# Started: 2025-01-11T10:30:00Z
# Ended: 2025-01-11T10:35:23Z
# Duration: 5m 23s
# Outcome: success

## Task Details
- ID: US-005
- Title: Add sentiment field to citation classifier
- Priority: P1

## Agent Output
[Full stdout/stderr from agent execution]
```

## Success Metrics

- Installation via `npm install -g ralph-tui` works in under 60 seconds
- TUI renders at 60 FPS using OpenTUI's Zig-powered rendering
- TUI renders correctly on common terminals (iTerm2, Alacritty, Terminal.app, Windows Terminal)
- Iteration execution is no slower than current shell scripts
- Session resume works reliably after unexpected termination
- Users can add a new agent plugin by implementing `AgentPlugin` interface
- Users can add a new tracker plugin by implementing `TrackerPlugin` interface
- Iteration logs are readable and useful for debugging
