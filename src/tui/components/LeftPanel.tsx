/**
 * ABOUTME: LeftPanel component for the Ralph TUI.
 * Displays the task list with status indicators (done/active/pending/blocked).
 */

import type { ReactNode } from 'react';
import { colors, getTaskStatusColor, getTaskStatusIndicator } from '../theme.js';
import type { LeftPanelProps, TaskItem } from '../types.js';

/**
 * Single task item row
 */
function TaskRow({
  task,
  isSelected,
}: {
  task: TaskItem;
  isSelected: boolean;
}): ReactNode {
  const statusColor = getTaskStatusColor(task.status);
  const statusIndicator = getTaskStatusIndicator(task.status);

  return (
    <box
      style={{
        width: '100%',
        flexDirection: 'row',
        paddingLeft: 1,
        paddingRight: 1,
        backgroundColor: isSelected ? colors.bg.highlight : 'transparent',
      }}
    >
      <text>
        <span fg={statusColor}>{statusIndicator}</span>
        <span fg={isSelected ? colors.fg.primary : colors.fg.secondary}> {task.title}</span>
      </text>
    </box>
  );
}

/**
 * LeftPanel component showing the scrollable task list
 */
export function LeftPanel({ tasks, selectedIndex }: LeftPanelProps): ReactNode {
  return (
    <box
      title="Tasks"
      style={{
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 30,
        maxWidth: 50,
        flexDirection: 'column',
        backgroundColor: colors.bg.primary,
        border: true,
        borderColor: colors.border.normal,
      }}
    >
      <scrollbox
        style={{
          flexGrow: 1,
          width: '100%',
        }}
      >
        {tasks.length === 0 ? (
          <box style={{ padding: 1 }}>
            <text fg={colors.fg.muted}>No tasks</text>
          </box>
        ) : (
          tasks.map((task, index) => (
            <TaskRow key={task.id} task={task} isSelected={index === selectedIndex} />
          ))
        )}
      </scrollbox>
    </box>
  );
}
