/**
 * ABOUTME: Detects permission denial conditions from Claude Code agent output.
 * Parses stdout to identify when Claude Code is waiting for user permission
 * to execute an operation, enabling blocked task handling in the execution engine.
 */

/**
 * Result of permission denial detection.
 */
export interface PermissionDenialResult {
  /** Whether a permission denial/request was detected */
  isBlocked: boolean;

  /** The operation that was blocked (e.g., 'git commit', 'file modification') */
  operation?: string;

  /** Extracted message describing the permission request (if detected) */
  message?: string;

  /** The command or action that was blocked */
  blockedCommand?: string;
}

/**
 * Input for permission denial detection.
 */
export interface PermissionDenialInput {
  /** Standard output from the agent */
  stdout: string;

  /** Standard error output from the agent */
  stderr?: string;

  /** Exit code from the agent process */
  exitCode?: number;

  /** Agent plugin identifier (e.g., 'claude', 'opencode') */
  agentId?: string;
}

/**
 * Pattern definition for matching permission denial indicators.
 */
interface PermissionPattern {
  /** Regular expression to match against output */
  pattern: RegExp;

  /** Human-readable operation name */
  operationName: string;

  /** Optional pattern to extract the blocked command */
  commandPattern?: RegExp;
}

/**
 * Permission denial patterns for Claude Code.
 * These match the output when Claude is requesting permission for an operation.
 *
 * Pattern design notes:
 * - Use word boundaries (\b) to avoid matching mid-word
 * - Use negative lookbehind for past-tense exclusion (was/were/had been)
 * - Use line-start anchors (^) where appropriate for message boundaries
 */
const PERMISSION_PATTERNS: PermissionPattern[] = [
  // Bash command permission request
  // Claude outputs: "Claude wants to run: <command>"
  // Uses ^ anchor to match at line/message start
  {
    pattern: /^Claude wants to (?:run|execute)[:\s]+(.+)/im,
    operationName: 'bash command',
    commandPattern: /^Claude wants to (?:run|execute)[:\s]+(.+)/im,
  },
  // File write permission
  // Claude outputs: "Claude wants to write to: <path>"
  {
    pattern: /^Claude wants to (?:write|create|modify)(?: to)?[:\s]+(.+)/im,
    operationName: 'file modification',
    commandPattern: /^Claude wants to (?:write|create|modify)(?: to)?[:\s]+(.+)/im,
  },
  // Edit file permission
  // Claude outputs: "Claude wants to edit: <path>"
  {
    pattern: /^Claude wants to edit[:\s]+(.+)/im,
    operationName: 'file edit',
    commandPattern: /^Claude wants to edit[:\s]+(.+)/im,
  },
  // Generic permission request format
  // Negative lookbehind excludes past-tense phrases like "was waiting", "were waiting", "had been waiting"
  {
    pattern: /(?<!was\s)(?<!were\s)(?<!been\s)\bwaiting for (?:user )?(?:permission|approval)\b/i,
    operationName: 'operation',
  },
  // Permission prompt indicators in JSONL output
  {
    pattern: /"type"\s*:\s*"permission"/i,
    operationName: 'permission request',
  },
  // User input required indicator
  // Negative lookbehind excludes past-tense like "required" when preceded by context indicating past
  {
    pattern: /(?<!previously\s)(?<!already\s)\brequires? (?:user )?(?:input|confirmation|approval)\b/i,
    operationName: 'user confirmation',
  },
  // Git operations that commonly require permission
  {
    pattern: /(?:git (?:commit|push|pull|merge|rebase).*?\brequires?\b|permission.*?git)/i,
    operationName: 'git operation',
  },
  // Interactive prompt detected
  {
    pattern: /(?:press|hit|type)\s+(?:\[?[yYnN]\]?|enter|return)\s+to\s+(?:continue|confirm|proceed)/i,
    operationName: 'interactive prompt',
  },
];

/**
 * Patterns that indicate the agent is blocked waiting for input.
 * These are more generic indicators that execution has stalled.
 * Uses negative lookbehind to exclude past-tense phrases.
 */
const BLOCKED_INDICATORS: RegExp[] = [
  // Stdin waiting patterns - exclude past tense "was waiting", "were waiting"
  /(?<!was\s)(?<!were\s)(?<!been\s)\bwaiting for input\b/i,
  /(?<!was\s)(?<!were\s)(?<!been\s)\bawaiting response\b/i,
  /(?<!was\s)(?<!were\s)(?<!been\s)\bpaused for confirmation\b/i,
  // Common permission tool patterns in JSONL
  /"tool"\s*:\s*"(?:Bash|Write|Edit)"[\s\S]*?"blocked"\s*:\s*true/i,
];

/**
 * Detects permission denial conditions from Claude Code agent output.
 * Examines stdout to determine if Claude is waiting for user permission
 * to execute an operation.
 */
export class PermissionDenialDetector {
  /**
   * Detect if the agent output indicates a permission denial/request condition.
   *
   * @param input - The detection input containing stdout, stderr, exitCode, and agentId
   * @returns Detection result with isBlocked flag and optional operation/message
   */
  detect(input: PermissionDenialInput): PermissionDenialResult {
    const { stdout, stderr, agentId } = input;

    // Only check Claude-based agents (case-insensitive match for agent IDs containing 'claude')
    // Examples: 'claude', 'claude-code', 'Claude-3', 'CLAUDE_AGENT'
    if (agentId && !this.isClaudeAgent(agentId)) {
      return { isBlocked: false };
    }

    // Combine output for checking
    const combinedOutput = `${stdout}\n${stderr || ''}`;

    // Check permission patterns first
    for (const { pattern, operationName, commandPattern } of PERMISSION_PATTERNS) {
      if (pattern.test(combinedOutput)) {
        const message = this.extractMessage(combinedOutput, pattern);
        const blockedCommand = commandPattern
          ? this.extractCommand(combinedOutput, commandPattern)
          : undefined;

        return {
          isBlocked: true,
          operation: operationName,
          message,
          blockedCommand,
        };
      }
    }

    // Check blocked indicators as secondary detection
    for (const pattern of BLOCKED_INDICATORS) {
      if (pattern.test(combinedOutput)) {
        return {
          isBlocked: true,
          operation: 'blocked operation',
          message: this.extractMessage(combinedOutput, pattern),
        };
      }
    }

    return { isBlocked: false };
  }

  /**
   * Extract a relevant message snippet around the matched pattern.
   */
  private extractMessage(output: string, pattern: RegExp): string {
    const match = output.match(pattern);
    if (!match) {
      return 'Permission required';
    }

    // Get context around the match
    const matchIndex = match.index ?? 0;
    const start = Math.max(0, matchIndex - 20);
    const end = Math.min(output.length, matchIndex + match[0].length + 80);

    let message = output.slice(start, end).trim();

    // Clean up the message
    message = message.replace(/\s+/g, ' ');

    // Truncate if too long
    if (message.length > 150) {
      message = message.slice(0, 150) + '...';
    }

    return message;
  }

  /**
   * Extract the blocked command from the output.
   */
  private extractCommand(output: string, pattern: RegExp): string | undefined {
    const match = output.match(pattern);
    if (match && match[1]) {
      let command = match[1].trim();
      // Truncate long commands
      if (command.length > 100) {
        command = command.slice(0, 100) + '...';
      }
      return command;
    }
    return undefined;
  }

  /**
   * Check if the agent ID indicates a Claude-based agent.
   * Performs case-insensitive matching for agent IDs containing 'claude'.
   *
   * @param agentId - The agent identifier to check
   * @returns true if the agent ID contains 'claude' (case-insensitive)
   */
  private isClaudeAgent(agentId: string): boolean {
    return agentId.toLowerCase().includes('claude');
  }
}
