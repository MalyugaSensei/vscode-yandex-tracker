// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ASSIGN_TASK_WITH_BRANCH_COMMAND, FETCH_TASK_COMMAND, SET_OAUTH_TOKEN_COMMAND, START_TIMER_COMMAND, STOP_TIMER_COMMAND, SEND_TIME_ALL_COMMAND, SEND_TIME_TASK_COMMAND, CLEAR_ALL_DATA_COMMAND } from './constants';
import { setOAuthToken, fetchTasks, startTracking, stopTracking, restoreActiveTimer, sendTimeForTask, sendTimeForAllTasks, clearAllData } from './commands';
import { ExtensionState } from './state';
import { createStatusBar } from './ui/statusBar';
import { getCurrentBranch, setupGitBranchListener } from './gitApi';
import { TrackerListItem } from './ui/trackerListProvider';
import { snapshotTimerState } from './tracker';
import { initializeLogger, logError } from './utils/logger';

let state: ExtensionState;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	initializeLogger();
	state = new ExtensionState(context);
	
	createStatusBar(state);
	
	const hasCredentials = await state.hasCredentials();
	await vscode.commands.executeCommand('setContext', 'tracker-helper.hasCredentials', hasCredentials);
	
	const listView = state.registerTrackList();

	state.yaTrackerSDK.initialize().catch(error => {
		logError('Failed to initialize SDK', error);
	});
	
	restoreActiveTimer(state).catch(error => {
		logError('Failed to restore active timer', error);
	});

	setupGitBranchListener(state).then(disposable => {
		if (disposable) {
			context.subscriptions.push(disposable);
		}
	}).catch(error => {
		logError('Failed to setup Git branch listener', error);
	});

	const updateCredentialsContext = async () => {
		const hasCredentials = await state.hasCredentials();
		await vscode.commands.executeCommand('setContext', 'tracker-helper.hasCredentials', hasCredentials);
		state.listProvider.refresh();
		return hasCredentials;
	};

	listView.onDidChangeVisibility(async (e) => {
		if (e.visible) {
			const hasCredentials = await state.hasCredentials();
			if (hasCredentials) {
				const allTasks = state.getAllTasks();
				if (Object.keys(allTasks).length === 0) {
					await fetchTasks(state).catch(error => {
						logError('Failed to auto-fetch tasks on view visibility', error);
					});
				}
			}
		}
	});

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async (e) => {
			if (e.affectsConfiguration('trackerHelper.orgId')) {
				const hasCredentials = await updateCredentialsContext();
				if (hasCredentials) {
					await state.yaTrackerSDK.initialize().catch(error => {
						logError('Failed to reinitialize SDK after orgId change', error);
					});
					const allTasks = state.getAllTasks();
					if (Object.keys(allTasks).length === 0) {
						await fetchTasks(state).catch(error => {
							logError('Failed to auto-fetch tasks after orgId change', error);
						});
					}
				}
			}
		}),
	);

	context.subscriptions.push(
		state.statusBar,
		listView,
		vscode.commands.registerCommand(START_TIMER_COMMAND, async (item?: TrackerListItem) => {
			if (item) {
				state.currentTimerTaskKey = item.tracker.data.taskKey
			}
			await startTracking(state);
		}),

		vscode.commands.registerCommand(STOP_TIMER_COMMAND, async (item?: TrackerListItem) => {
			if (item) {
				state.currentTimerTaskKey = item.tracker.data.taskKey
			}
			await stopTracking(state);
		}),

		vscode.commands.registerCommand(FETCH_TASK_COMMAND, async () => {
			await fetchTasks(state)
		}),

		vscode.commands.registerCommand(SET_OAUTH_TOKEN_COMMAND, async () => {
			await setOAuthToken(context, state)
		}),

		vscode.commands.registerCommand(ASSIGN_TASK_WITH_BRANCH_COMMAND, async (item: TrackerListItem) => {
			const currentBranch = await getCurrentBranch()
			await state.assignTaskWithBranch(item.tracker.data.taskKey, currentBranch)
		}),

		vscode.commands.registerCommand(SEND_TIME_TASK_COMMAND, async (item: TrackerListItem) => {
			await sendTimeForTask(state, item)
		}),

		vscode.commands.registerCommand(SEND_TIME_ALL_COMMAND, async () => {
			await sendTimeForAllTasks(state)
		}),

		vscode.commands.registerCommand(CLEAR_ALL_DATA_COMMAND, async () => {
			await clearAllData(context, state)
		}),

		vscode.window.onDidChangeWindowState(async (e) => {
			if (!e.focused && state.isTimerPlay && state.currentTimerTaskKey) {
				const tracker = state.listProvider.getTracker(state.currentTimerTaskKey);
				if (tracker && tracker.state.startedAtMs !== null) {
					const snapshot = snapshotTimerState(tracker.state);
					await state.saveTimerState(state.currentTimerTaskKey, snapshot);
				}
			}
		})
	)
}

// This method is called when your extension is deactivated
export async function deactivate() {
	await state.dispose();
}
