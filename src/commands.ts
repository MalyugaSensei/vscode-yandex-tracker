import * as vscode from 'vscode'
import { ExtensionState } from "./state";
import { renderTimerInStatusBar, renderTimerInTreeView } from "./ui/renderer";
import { setTrackingStarted, setTrackingStopped, getElapsedMs } from './tracker';
import { setCredentials } from './credentials';
import { TrackerWithState } from './types';
import { TrackerListItem } from './ui/trackerListProvider';
import { logError, logInfo, logWarn } from './utils/logger';
import { TIMER_UPDATE_INTERVAL_MS, TIMER_SAVE_INTERVAL_MS, MAX_RESTORE_TIME_MS, MIN_TIME_TO_SEND_MS, OAUTH_TOKEN_STORAGE_KEY } from './constants';

/**
 * Restores active timer after VS Code restart
 * Automatically stops timer if more than 24 hours have passed
 * @param state Extension state
 */
export const restoreActiveTimer = async (state: ExtensionState) => {
	const activeTaskKey = state.getActiveTaskKey();
	if (!activeTaskKey) {
		return;
	}

	const tracker = state.listProvider.getTracker(activeTaskKey);
	if (!tracker) {
		return;
	}

	if (tracker.state.startedAtMs !== null) {
		state.currentTimerTaskKey = activeTaskKey;

		const timeSinceStart = Date.now() - tracker.state.startedAtMs;
		
		if (timeSinceStart > MAX_RESTORE_TIME_MS) {
			const stoppedState = {
				...tracker.state,
				elapsedMs: tracker.state.elapsedMs + timeSinceStart,
				startedAtMs: null
			};
			await state.saveTimerState(activeTaskKey, stoppedState);
		} else {
			await startTracking(state);
		}
	}
};

/**
 * Starts time tracking for current task
 * @param state Extension state
 */
export const startTracking = async (state: ExtensionState) => {
    if (!state.currentTimerTaskKey || state.currentTimerTaskKey.trim().length === 0) {
        logWarn('Attempt to start timer without selected task');
        vscode.window.showErrorMessage('Error: no task selected for tracking')
        return;
    }

    if (state.isTimerPlay) {
        logInfo('Timer is already running');
        return;
    }

    const tracker = state.listProvider.getTracker(state.currentTimerTaskKey)

    if (!tracker) {
        logError(`Task ${state.currentTimerTaskKey} not found when trying to start timer`);
        vscode.window.showErrorMessage('Error: task not found')
        return;
    }

    state.isTimerPlay = true;

    const newState = setTrackingStarted(tracker.state)
    await state.listProvider.updateTrackerState(state.currentTimerTaskKey, newState)
    
    state.timer.startUpdateTimer(TIMER_UPDATE_INTERVAL_MS, () => {
        renderTimerInStatusBar(state.statusBar, state)
        renderTimerInTreeView(state.listProvider, state)
    })
    
    state.startPeriodicSave(TIMER_SAVE_INTERVAL_MS)
    
    renderTimerInStatusBar(state.statusBar, state)
    renderTimerInTreeView(state.listProvider, state)
}

/**
 * Handles Git branch change - automatically starts timer if exactly one task is associated with the branch
 * @param state Extension state
 * @param branchName New branch name
 */
export const handleBranchChange = async (state: ExtensionState, branchName: string | null) => {
    if (!branchName) {
        return;
    }

    if (state.isTimerPlay) {
        await stopTracking(state);
    }

    const allTasks = state.getAllTasks();
    const tasksForBranch: string[] = [];

    for (const [taskKey, task] of Object.entries(allTasks)) {
        if (task.data.branch === branchName) {
            tasksForBranch.push(taskKey);
        }
    }

    if (tasksForBranch.length === 0) {
        return;
    }

    if (tasksForBranch.length === 1) {
        state.currentTimerTaskKey = tasksForBranch[0];
        await startTracking(state);
        logInfo(`Auto-started timer for task ${tasksForBranch[0]} on branch ${branchName}`);
    } else {
        const taskKeys = tasksForBranch.join(', ');
        vscode.window.showErrorMessage(
            `Multiple tasks (${tasksForBranch.length}) are associated with branch "${branchName}". Please select a task manually. Tasks: ${taskKeys}`
        );
        logWarn(`Multiple tasks found for branch ${branchName}: ${taskKeys}`);
    }
}

/**
 * Stops time tracking for current task
 * @param state Extension state
 */
export const stopTracking = async (state: ExtensionState) => {
    if (!state.isTimerPlay) {
        logInfo('Attempt to stop inactive timer');
        return;
    }

    if (!state.currentTimerTaskKey || state.currentTimerTaskKey.trim().length === 0) {
        logWarn('Attempt to stop timer without selected task');
        vscode.window.showErrorMessage('Error: no task selected')
        return;
    }

    const tracker = state.listProvider.getTracker(state.currentTimerTaskKey)

    if (!tracker) {
        logError(`Task ${state.currentTimerTaskKey} not found when trying to stop timer`);
        vscode.window.showErrorMessage('Error: task not found')
        return;
    }

    state.isTimerPlay = false;
    
    const newState = setTrackingStopped(tracker.state)
    await state.listProvider.updateTrackerState(state.currentTimerTaskKey, newState)
    renderTimerInStatusBar(state.statusBar, state)
    renderTimerInTreeView(state.listProvider, state)
    
    state.timer.stopUpdateTimer()
    state.stopPeriodicSave()
}

/**
 * Sets OAuth token and organization ID for Yandex Tracker API
 * @param context VS Code extension context
 * @param state Extension state
 */
export const setOAuthToken = async (context: vscode.ExtensionContext, state: ExtensionState) => {
    const token = await vscode.window.showInputBox({
        title: 'OAuth Token',
        prompt: "Enter OAuth token for Yandex Tracker",
        password: true,
        placeHolder: 'Enter token...',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return "Token cannot be empty"
            }
            return null;
        }    
    })

    if (!token) {
        logInfo('Token not entered (dialog cancelled)');
        return;
    }

    try {
        await setCredentials(context, token)

        const hasCredentials = await state.hasCredentials();
        
        if (!hasCredentials) {
            await vscode.window.showWarningMessage(
                'OAuth token saved. Please set Organization ID in settings (trackerHelper.orgId)'
            )
        } else {
            await vscode.window.showInformationMessage('OAuth token saved')
        }
        
        await vscode.commands.executeCommand('setContext', 'tracker-helper.hasCredentials', hasCredentials);
        
        state.listProvider.refresh();
        
        if (hasCredentials) {
            await state.yaTrackerSDK.initialize();
            const allTasks = state.getAllTasks();
            if (Object.keys(allTasks).length === 0) {
                await fetchTasks(state);
            }
        }
        
        logInfo('OAuth token successfully saved');
    } catch (error) {
        logError('Error setting token', error);
        await vscode.window.showErrorMessage('Error setting token')
    }
    
}

/**
 * Fetches task list from Yandex Tracker and adds new tasks to local storage
 * @param state Extension state
 */
export const fetchTasks = async (state: ExtensionState) => {
    try {
    const tasks = await state.yaTrackerSDK?.getTasks() || null
    if (!tasks || tasks.length === 0) {
        logInfo('No tasks found');
        return [];
    }

    const storageTasks = state.getAllTasks()
    const newTasks: Record<string, TrackerWithState> = {}

    for (const task of tasks) {
        if (!storageTasks[task.key]) {
            newTasks[task.key] = {
                data: { taskKey: task.key, taskId: task.id, branch: "" },
                state: { elapsedMs: 0, startedAtMs: null }
            };
        } else {
            const existing = storageTasks[task.key];
            if (!existing.data.taskId) {
                existing.data.taskId = task.id;
                await state.addTasks({ [task.key]: existing });
            }
        }
    }

    if (Object.keys(newTasks).length > 0) {
        await state.addTasks(newTasks)
        state.listProvider.refresh()
    }
    
    } catch (error) {
        if (error instanceof Response) {
            try {
                const errorData = await error.json();
                logError('Error fetching tasks', errorData);
            } catch {
                logError('Error fetching tasks', error);
            }
        } else {
            logError('Error fetching tasks', error);
        }
        await vscode.window.showErrorMessage('Error fetching tasks')
    }
}

/**
 * Sends accumulated time for a specific task to Yandex Tracker
 * Resets task timer after successful send
 * @param state Extension state
 * @param item Task list item with task data
 */
export const sendTimeForTask = async (state: ExtensionState, item: TrackerListItem) => {
    if (!item || !item.tracker) {
        logError('Attempt to send time for invalid item');
        vscode.window.showErrorMessage('Error: invalid task data');
        return;
    }

    const tracker = item.tracker;
    const taskKey = tracker.data.taskKey;
    
    if (!taskKey || taskKey.trim().length === 0) {
        logError('Attempt to send time for task without key');
        vscode.window.showErrorMessage('Error: task key not specified');
        return;
    }

    const taskId = tracker.data.taskId || taskKey;
    const elapsedMs = getElapsedMs(tracker.state);
    
    if (elapsedMs < MIN_TIME_TO_SEND_MS) {
        vscode.window.showWarningMessage(`No time to send for task ${taskKey}`);
        return;
    }

    const comment = await vscode.window.showInputBox({
        title: 'Worklog Comment',
        prompt: `Enter comment for task ${taskKey} (optional)`,
        placeHolder: 'Enter comment...',
    });

    if (comment === undefined) {
        logInfo('Comment input cancelled');
        return;
    }

    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Sending time for ${taskKey}`,
            cancellable: false
        }, async () => {
            await state.yaTrackerSDK.addWorklog(
                taskId,
                elapsedMs,
                undefined,
                comment || undefined
            );
        });

        const resetState = { elapsedMs: 0, startedAtMs: null };
        await state.listProvider.updateTrackerState(taskKey, resetState);
        
        vscode.window.showInformationMessage(`Time sent for task ${taskKey}`);
        logInfo(`Time successfully sent for task ${taskKey}`);
    } catch (error) {
        logError(`Error sending time for task ${taskKey}`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Error sending time: ${errorMessage}`);
    }
}

/**
 * Sends accumulated time for all tasks with accumulated time to Yandex Tracker
 * Shows send progress and success/failure statistics
 * @param state Extension state
 */
export const sendTimeForAllTasks = async (state: ExtensionState) => {
    const allTasks = state.getAllTasks();
    const tasksWithTime: Array<{ taskKey: string; taskId: string; elapsedMs: number }> = [];

    for (const [taskKey, task] of Object.entries(allTasks)) {
        const elapsedMs = getElapsedMs(task.state);
        if (elapsedMs >= MIN_TIME_TO_SEND_MS) {
            tasksWithTime.push({
                taskKey,
                taskId: task.data.taskId || taskKey,
                elapsedMs
            });
        }
    }

    if (tasksWithTime.length === 0) {
        vscode.window.showWarningMessage('No tasks with accumulated time to send');
        return;
    }

    const taskCount = tasksWithTime.length;
    const confirm = await vscode.window.showInformationMessage(
        `Send time for ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}?`,
        'Yes',
        'No'
    );

    if (confirm !== 'Yes') {
        return;
    }

    try {
        let successCount = 0;
        let errorCount = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Sending time for ${taskCount} tasks`,
            cancellable: false
        }, async (progress) => {
            for (let i = 0; i < tasksWithTime.length; i++) {
                const { taskKey, taskId, elapsedMs } = tasksWithTime[i];
                progress.report({
                    increment: 100 / tasksWithTime.length,
                    message: `Sending ${taskKey}...`
                });

                try {
                    await state.yaTrackerSDK.addWorklog(
                        taskId,
                        elapsedMs,
                        undefined,
                        `Time worked on task`
                    );
                    
                    const resetState = { elapsedMs: 0, startedAtMs: null };
                    await state.listProvider.updateTrackerState(taskKey, resetState);
                    successCount++;
                    logInfo(`Time sent for task ${taskKey}`);
                } catch (error) {
                    logError(`Error sending time for task ${taskKey}`, error);
                    errorCount++;
                }
            }
        });

        if (errorCount === 0) {
            vscode.window.showInformationMessage(`Time successfully sent for ${successCount} tasks`);
        } else {
            vscode.window.showWarningMessage(
                `Sent for ${successCount} tasks, errors: ${errorCount}`
            );
        }
    } catch (error) {
        logError('Error sending time for all tasks', error);
        vscode.window.showErrorMessage('Error sending time');
    }
}

/**
 * Clears all stored data (tasks and OAuth token)
 * @param context VS Code extension context
 * @param state Extension state
 */
export const clearAllData = async (context: vscode.ExtensionContext, state: ExtensionState) => {
    const confirm = await vscode.window.showWarningMessage(
        'Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.\n\nБудут удалены:\n- Все задачи и их таймеры\n- OAuth токен',
        { modal: true },
        'Да, удалить все',
        'Отмена'
    );

    if (confirm !== 'Да, удалить все') {
        logInfo('Clear all data cancelled by user');
        return;
    }

    try {
        if (state.isTimerPlay) {
            await stopTracking(state);
        }
        await state.storage.clearAllTasks();
        
        await context.secrets.delete(OAUTH_TOKEN_STORAGE_KEY);
        
        await vscode.commands.executeCommand('setContext', 'tracker-helper.hasCredentials', false);
        
        state.listProvider.refresh();
        
        vscode.window.showInformationMessage('Все данные успешно удалены');
        logInfo('All data cleared successfully');
    } catch (error) {
        logError('Error clearing all data', error);
        vscode.window.showErrorMessage('Ошибка при удалении данных');
    }
}