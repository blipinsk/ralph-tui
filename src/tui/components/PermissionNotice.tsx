/**
 * ABOUTME: Permission notice banner component displayed at session start.
 * Informs users that certain operations may require manual intervention
 * when running with restricted permissions.
 */

import type { ReactNode } from 'react';
import { colors } from '../theme.js';

/**
 * Props for the PermissionNotice component
 */
export interface PermissionNoticeProps {
  /** Whether the notice is visible */
  visible: boolean;
}

/**
 * Operations that may be blocked and require manual intervention
 */
const BLOCKED_OPERATIONS = [
  'git commit / push',
  'file modifications outside workspace',
  'package installations',
];

/**
 * Permission notice banner displayed at session start.
 * Explains that certain operations may require manual intervention
 * when running in restricted mode.
 */
export function PermissionNotice({
  visible,
}: PermissionNoticeProps): ReactNode {
  if (!visible) {
    return null;
  }

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
          width: 60,
          height: 14,
          backgroundColor: colors.bg.secondary,
          border: true,
          borderColor: colors.status.info,
          flexDirection: 'column',
          padding: 1,
        }}
      >
        {/* Title */}
        <text fg={colors.status.info}>
          Permission Notice
        </text>

        {/* Spacer */}
        <box style={{ height: 1 }} />

        {/* Description */}
        <text fg={colors.fg.primary}>
          Some operations may require manual intervention when
        </text>
        <text fg={colors.fg.primary}>
          running with restricted permissions:
        </text>

        {/* Spacer */}
        <box style={{ height: 1 }} />

        {/* List of operations */}
        {BLOCKED_OPERATIONS.map((op, index) => (
          <text key={index} fg={colors.fg.secondary}>
            {`  • ${op}`}
          </text>
        ))}

        {/* Spacer */}
        <box style={{ height: 1 }} />

        {/* Explanation */}
        <text fg={colors.fg.muted}>
          Blocked operations will be presented for manual execution.
        </text>

        {/* Spacer */}
        <box style={{ height: 1 }} />

        {/* Hint */}
        <text fg={colors.fg.dim}>
          Press any key to continue • Disable in config: showPermissionNotice: false
        </text>
      </box>
    </box>
  );
}
