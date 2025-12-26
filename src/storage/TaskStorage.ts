import * as vscode from 'vscode';
import { TASK_STORAGE_KEY } from '../constants';
import { TrackerState, TrackerWithState } from '../types';
import { logWarn, logInfo } from '../utils/logger';

/**
 * Service for managing task storage in VS Code workspace state
 */
export class TaskStorage {
    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Gets all tasks from storage
     */
    getAllTasks(): Record<string, TrackerWithState> {
        return this.context.workspaceState.get<Record<string, TrackerWithState>>(TASK_STORAGE_KEY, {});
    }

    /**
     * Adds new tasks to storage (merges with existing)
     */
    async addTasks(tasks: Record<string, TrackerWithState>): Promise<void> {
        const mapping = this.context.workspaceState.get<Record<string, TrackerWithState>>(TASK_STORAGE_KEY, {});
        const updated = {
            ...mapping,
            ...tasks
        };
        await this.context.workspaceState.update(TASK_STORAGE_KEY, updated);
    }

    /**
     * Updates timer state for a specific task
     */
    async saveTimerState(taskKey: string, state: TrackerState): Promise<void> {
        const mapping = this.context.workspaceState.get<Record<string, TrackerWithState>>(TASK_STORAGE_KEY, {});
        if (!mapping[taskKey]) {
            logWarn(`Task ${taskKey} not found in storage when saving timer state`);
            return;
        }
        mapping[taskKey].state = state;
        await this.context.workspaceState.update(TASK_STORAGE_KEY, mapping);
    }

    /**
     * Loads timer state for a specific task
     */
    async loadTimerState(taskKey: string): Promise<TrackerState | undefined> {
        const mapping = this.context.workspaceState.get<Record<string, TrackerWithState>>(TASK_STORAGE_KEY, {});
        return mapping[taskKey]?.state;
    }

    /**
     * Assigns a Git branch to a task
     */
    async assignTaskWithBranch(taskKey: string, branch: string): Promise<void> {
        if (!taskKey || !branch) {
            logWarn('Invalid params for assignTaskWithBranch', { taskKey, branch });
            return;
        }
        const mapping = this.context.workspaceState.get<Record<string, TrackerWithState>>(TASK_STORAGE_KEY, {});
        if (!mapping[taskKey]) {
            logWarn(`Task ${taskKey} not found when trying to assign branch`);
            return;
        }
        mapping[taskKey].data.branch = branch;
        await this.context.workspaceState.update(TASK_STORAGE_KEY, mapping);
        logInfo(`Branch ${branch} assigned to task ${taskKey}`);
    }

    /**
     * Gets the key of the active task (with running timer)
     */
    getActiveTaskKey(): string | null {
        const allTasks = this.getAllTasks();
        for (const [taskKey, task] of Object.entries(allTasks)) {
            if (task.state?.startedAtMs !== null) {
                return taskKey;
            }
        }
        return null;
    }

    /**
     * Clears all tasks from storage
     */
    async clearAllTasks(): Promise<void> {
        await this.context.workspaceState.update(TASK_STORAGE_KEY, undefined);
        logInfo('All tasks cleared from storage');
    }
}

