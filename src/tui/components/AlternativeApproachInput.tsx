/**
 * ABOUTME: Input component for collecting user-provided alternative approaches.
 * When a task is blocked, allows users to describe a different approach for Claude
 * to evaluate and attempt, rather than just retrying with the same approach.
 */

import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { colors } from '../theme.js';

/**
 * Props for the AlternativeApproachInput component
 */
export interface AlternativeApproachInputProps {
  /** Whether the input is visible */
  visible: boolean;

  /** Task title for context */
  taskTitle: string;

  /** Original operation that was blocked */
  blockedOperation: string;

  /** The blocked command (if available) */
  blockedCommand?: string;

  /** Called when user submits an alternative approach */
  onSubmit: (alternative: string) => void;

  /** Called when user cancels input */
  onCancel: () => void;
}

/**
 * Input dialog for collecting alternative approach descriptions.
 * Users can describe what they want Claude to try instead of the blocked operation.
 */
export function AlternativeApproachInput({
  visible,
  taskTitle,
  blockedOperation,
  blockedCommand,
  onSubmit,
  onCancel,
}: AlternativeApproachInputProps): ReactNode {
  const [inputValue, setInputValue] = useState('');

  const handleKeypress = useCallback(
    (key: { name: string; sequence?: string }) => {
      if (!visible) return;

      switch (key.name) {
        case 'escape':
          setInputValue('');
          onCancel();
          break;

        case 'return':
        case 'enter': {
          const trimmed = inputValue.trim();
          if (trimmed.length > 0) {
            onSubmit(trimmed);
            setInputValue('');
          }
          break;
        }

        case 'backspace':
          setInputValue((prev) => prev.slice(0, -1));
          break;

        default:
          // Handle character input via key.sequence
          if (key.sequence && key.sequence.length === 1 && key.name !== 'backspace') {
            setInputValue((prev) => prev + key.sequence);
          }
          break;
      }
    },
    [visible, inputValue, onSubmit, onCancel]
  );

  useKeyboard(handleKeypress);

  if (!visible) {
    return null;
  }

  const dialogWidth = 72;
  const dialogHeight = 18;

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
          borderColor: colors.accent.primary,
          flexDirection: 'column',
          padding: 1,
        }}
      >
        {/* Title */}
        <box style={{ marginBottom: 1 }}>
          <text fg={colors.accent.primary}>
            {'[TIP] Suggest Alternative Approach'}
          </text>
        </box>

        {/* Context */}
        <box style={{ marginBottom: 1 }}>
          <text fg={colors.fg.muted}>
            Task: <span fg={colors.fg.primary}>{taskTitle}</span>
          </text>
        </box>

        <box style={{ marginBottom: 1 }}>
          <text fg={colors.fg.muted}>
            Blocked: <span fg={colors.status.warning}>{blockedOperation}</span>
          </text>
        </box>

        {blockedCommand && (
          <box style={{ marginBottom: 1 }}>
            <text fg={colors.fg.dim}>
              {`  $ ${blockedCommand.slice(0, 50)}${blockedCommand.length > 50 ? '...' : ''}`}
            </text>
          </box>
        )}

        {/* Instructions */}
        <box style={{ marginBottom: 1, marginTop: 1 }}>
          <text fg={colors.fg.secondary}>
            Describe an alternative approach for Claude to evaluate and try.
          </text>
        </box>

        <box style={{ marginBottom: 1 }}>
          <text fg={colors.fg.dim}>
            Claude will analyze if this achieves the original goal before attempting.
          </text>
        </box>

        {/* Input field */}
        <box
          style={{
            marginTop: 1,
            padding: 1,
            backgroundColor: colors.bg.tertiary,
            border: true,
            borderColor: colors.border.muted,
            height: 3,
          }}
        >
          <text fg={colors.fg.primary}>
            {inputValue}
            <span fg={colors.accent.primary}>{'█'}</span>
          </text>
        </box>

        {/* Spacer */}
        <box style={{ flexGrow: 1 }} />

        {/* Actions */}
        <box style={{ marginTop: 1 }}>
          <text fg={colors.fg.muted}>
            <span fg={colors.status.success}>[Enter]</span>
            {' Submit  '}
            <span fg={colors.fg.dim}>[Esc]</span>
            {' Cancel'}
          </text>
        </box>
      </box>
    </box>
  );
}
