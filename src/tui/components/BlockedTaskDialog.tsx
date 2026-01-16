/**
 * ABOUTME: Dialog component for presenting blocked commands requiring user action.
 * Displays blocked operation context, the exact command in a copy-paste format,
 * and provides three action options: done, skip, or provide alternative.
 */

import type { ReactNode } from 'react';
import { colors } from '../theme.js';

/**
 * Information about a blocked operation for display in the dialog.
 */
export interface BlockedOperationInfo {
  /** The type of operation blocked (e.g., 'bash command', 'file modification') */
  operation: string;

  /** Human-readable message explaining the permission request */
  message: string;

  /** The exact command/path that was blocked (for copy-paste) */
  blockedCommand?: string;

  /** Task ID that is blocked */
  taskId: string;

  /** Task title that is blocked */
  taskTitle: string;
}

/**
 * Props for the BlockedTaskDialog component
 */
export interface BlockedTaskDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;

  /** Information about the blocked operation */
  blockedInfo: BlockedOperationInfo | null;
}

/**
 * Map operation types to user-friendly explanations of why they need permission.
 */
function getOperationContext(operation: string): { why: string; affects: string } {
  switch (operation.toLowerCase()) {
    case 'bash command':
      return {
        why: 'Claude Code needs to run a shell command to complete this task.',
        affects: 'This command will execute in your terminal with your permissions.',
      };
    case 'file modification':
      return {
        why: 'Claude Code needs to create or modify a file to complete this task.',
        affects: 'This will write changes to your filesystem.',
      };
    case 'file edit':
      return {
        why: 'Claude Code needs to edit an existing file to complete this task.',
        affects: 'This will modify the contents of the specified file.',
      };
    case 'git operation':
      return {
        why: 'Claude Code needs to perform a git operation to complete this task.',
        affects: 'This may modify your git history or push changes to a remote.',
      };
    case 'permission request':
    case 'user confirmation':
      return {
        why: 'Claude Code needs your approval before proceeding.',
        affects: 'Review the operation details before allowing it to continue.',
      };
    case 'interactive prompt':
      return {
        why: 'Claude Code encountered an interactive prompt requiring input.',
        affects: 'The operation is waiting for user input to proceed.',
      };
    default:
      return {
        why: 'Claude Code needs permission to perform an operation.',
        affects: 'Review the details below before proceeding.',
      };
  }
}

/**
 * Modal dialog for blocked task presentation.
 * Shows context about why the command is needed, what it affects,
 * the exact command in a copy-paste friendly format, and action options.
 *
 * Keyboard handling is done by parent component:
 * - 'd' for done (user ran the command manually)
 * - 'x' for skip (abandon this operation)
 * - 'a' for alternative (provide an alternative approach - retry)
 */
export function BlockedTaskDialog({
  visible,
  blockedInfo,
}: BlockedTaskDialogProps): ReactNode {
  if (!visible || !blockedInfo) {
    return null;
  }

  const { operation, message, blockedCommand, taskTitle } = blockedInfo;
  const context = getOperationContext(operation);

  // Calculate dialog dimensions
  // Command display needs enough width for reasonable commands
  const dialogWidth = 70;
  // Height varies based on content but we use a reasonable default
  const dialogHeight = 22;

  return (
    <box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <box
        style={{
          width: dialogWidth,
          height: dialogHeight,
          backgroundColor: colors.bg.secondary,
          border: true,
          borderColor: colors.status.warning,
          flexDirection: 'column',
          padding: 1,
        }}
      >
        {/* Title bar */}
        <box style={{ marginBottom: 1 }}>
          <text fg={colors.status.warning}>
            {'⊘ Blocked Operation'}
          </text>
        </box>

        {/* Task context */}
        <box style={{ marginBottom: 1 }}>
          <text fg={colors.fg.muted}>
            Task: <span fg={colors.fg.primary}>{taskTitle}</span>
          </text>
        </box>

        {/* Operation type */}
        <box style={{ marginBottom: 1 }}>
          <text fg={colors.fg.muted}>
            Operation: <span fg={colors.accent.secondary}>{operation}</span>
          </text>
        </box>

        {/* Why context */}
        <box style={{ marginBottom: 1 }}>
          <text fg={colors.fg.secondary}>
            <span fg={colors.accent.primary}>Why: </span>
            {context.why}
          </text>
        </box>

        {/* What it affects */}
        <box style={{ marginBottom: 1 }}>
          <text fg={colors.fg.secondary}>
            <span fg={colors.accent.primary}>Affects: </span>
            {context.affects}
          </text>
        </box>

        {/* Message from the detection */}
        {message && (
          <box style={{ marginBottom: 1 }}>
            <text fg={colors.fg.dim}>
              {message}
            </text>
          </box>
        )}

        {/* Command code block - copy-paste friendly */}
        {blockedCommand && (
          <box
            style={{
              marginTop: 1,
              marginBottom: 1,
              padding: 1,
              backgroundColor: colors.bg.tertiary,
              border: true,
              borderColor: colors.border.muted,
            }}
          >
            <text fg={colors.fg.muted}>Command to run:</text>
            <text fg={colors.accent.tertiary}>
              {`  $ ${blockedCommand}`}
            </text>
          </box>
        )}

        {/* Spacer to push actions to bottom */}
        <box style={{ flexGrow: 1 }} />

        {/* Action options */}
        <box style={{ marginTop: 1 }}>
          <text fg={colors.fg.muted}>
            {'Actions: '}
            <span fg={colors.status.success}>[d]</span>
            {' Done  '}
            <span fg={colors.status.warning}>[x]</span>
            {' Skip  '}
            <span fg={colors.accent.primary}>[a]</span>
            {' Alternative'}
          </text>
        </box>

        {/* Action descriptions */}
        <box style={{ marginTop: 1 }}>
          <text fg={colors.fg.dim}>
            {'d = ran command manually | x = skip this task | a = retry with different approach'}
          </text>
        </box>
      </box>
    </box>
  );
}
