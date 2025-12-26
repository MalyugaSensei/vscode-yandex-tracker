import * as vscode from 'vscode';
import { TrackerListProvider } from './ui/trackerListProvider';
import { YaTrackerSDK } from './sdk/yatracker-sdk';
import { TASKS_VIEW, TIMER_UPDATE_INTERVAL_MS } from './constants';
import { createCredentialsProvider, getCredentials } from './credentials';
import { TrackerState } from './types';
import { snapshotTimerState } from './tracker';
import { TaskStorage } from './storage/TaskStorage';
import { TimerManager } from './timer/TimerManager';

/**
 * Main extension state coordinator
 * Manages UI components and delegates storage/timer operations to specialized services
 */
export class ExtensionState {
    public statusBar: vscode.StatusBarItem;
    public listProvider: TrackerListProvider;
    public yaTrackerSDK: YaTrackerSDK;
    public storage: TaskStorage;
    public timer: TimerManager;
    public context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.yaTrackerSDK = new YaTrackerSDK(createCredentialsProvider(context));
        this.storage = new TaskStorage(context);
        this.listProvider = new TrackerListProvider(this);
        
        this.timer = new TimerManager(
            async (taskKey, state) => {
                await this.storage.saveTimerState(taskKey, state);
                this.listProvider.refreshItem(taskKey);
            },
            (taskKey) => this.listProvider.getTracker(taskKey)
        );
    }

    async hasCredentials(): Promise<boolean> {
        const credentials = await getCredentials(this.context);
        return credentials !== null;
    }

    registerTrackList() {
        vscode.window.registerTreeDataProvider(TASKS_VIEW, this.listProvider);
        const listView = vscode.window.createTreeView(TASKS_VIEW, {
            treeDataProvider: this.listProvider
        });
        return listView;
    }

    /**
     * Convenience getters for backward compatibility
     */
    get currentTimerTaskKey(): string | null {
        return this.timer.currentTimerTaskKey;
    }

    set currentTimerTaskKey(value: string | null) {
        this.timer.currentTimerTaskKey = value;
    }

    get isTimerPlay(): boolean {
        return this.timer.isTimerPlay;
    }

    set isTimerPlay(value: boolean) {
        this.timer.isTimerPlay = value;
    }

    get globalTimer(): NodeJS.Timeout | null {
        return null; // TimerManager handles this internally
    }

    /**
     * Delegates to TaskStorage
     */
    getAllTasks() {
        return this.storage.getAllTasks();
    }

    async addTasks(tasks: Record<string, import('./types').TrackerWithState>) {
        await this.storage.addTasks(tasks);
        this.listProvider.refresh();
    }

    async assignTaskWithBranch(taskKey: string | null, branch: string | null): Promise<void> {
        if (!taskKey || !branch) {
            return;
        }
        await this.storage.assignTaskWithBranch(taskKey, branch);
        this.listProvider.refreshItem(taskKey);
    }

    async saveTimerState(taskKey: string, state: TrackerState) {
        await this.storage.saveTimerState(taskKey, state);
        this.listProvider.refreshItem(taskKey);
    }

    startPeriodicSave(intervalMs?: number) {
        this.timer.startPeriodicSave(intervalMs);
    }

    stopPeriodicSave() {
        this.timer.stopPeriodicSave();
    }

    async loadTimerState(taskKey: string) {
        return this.storage.loadTimerState(taskKey);
    }

    getActiveTaskKey(): string | null {
        return this.storage.getActiveTaskKey();
    }

    async dispose() {
        if (this.timer.isTimerPlay && this.timer.currentTimerTaskKey) {
            const tracker = this.listProvider.getTracker(this.timer.currentTimerTaskKey);
            if (tracker && tracker.state.startedAtMs !== null) {
                const snapshot = snapshotTimerState(tracker.state);
                await this.saveTimerState(this.timer.currentTimerTaskKey, snapshot);
            }
        }
        
        this.timer.dispose();
        this.statusBar.dispose();
    }
}