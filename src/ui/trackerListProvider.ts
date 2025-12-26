import * as vscode from "vscode";
import { TrackerState, TrackerWithState } from "../types";
import { createTimerState, getElapsedMs } from "../tracker";
import { ExtensionState } from "../state";
import { formatDuration } from "../utils/time";

function updateItemProperties(item: TrackerListItem, tracker: TrackerWithState, state: ExtensionState): void {
    const elapsedMs = getElapsedMs(tracker.state);
    const time = formatDuration(elapsedMs);
    item.description = time;
    item.tooltip = `Task: ${tracker.data.taskKey}\nBranch: ${tracker.data.branch}\nTime: ${time}`;
    
    const contexts: string[] = [];
    const isActive = state.currentTimerTaskKey === tracker.data.taskKey && state.isTimerPlay;
    if (isActive) {
        contexts.push('timerActive');
    } else {
        contexts.push('timerInactive');
    }
    item.contextValue = contexts.join(' ');
    
    item.tracker = tracker;
}

export class TrackerListItem extends vscode.TreeItem {
    constructor(public tracker: TrackerWithState, state: ExtensionState) {
        super(tracker.data.taskKey, vscode.TreeItemCollapsibleState.None)
        this.id = tracker.data.taskKey
        this.iconPath = new vscode.ThemeIcon('clock')
        
        updateItemProperties(this, tracker, state);
    }
}

export class TrackerListProvider implements vscode.TreeDataProvider<TrackerListItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TrackerListItem | undefined | null | void> = new vscode.EventEmitter<TrackerListItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TrackerListItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private itemsCache: Map<string, TrackerListItem> = new Map();
    private state: ExtensionState

    constructor(state: ExtensionState) {
        this.state = state
    }

    getTreeItem(element: TrackerListItem): vscode.TreeItem {
        return element;
    }

    private updateItemProperties(item: TrackerListItem, tracker: TrackerWithState): void {
        updateItemProperties(item, tracker, this.state);
    }

    async getChildren(): Promise<TrackerListItem[]> {
        const hasCredentials = await this.state.hasCredentials();
        
        if (!hasCredentials) {
            return [];
        }

        const allTasks = this.state.getAllTasks();
        const taskEntries = Object.entries(allTasks);

        const items = taskEntries.map(([taskKey, task]) => {
            const existingItem = this.itemsCache.get(taskKey);
            if (existingItem) {
                const tracker: TrackerWithState = {
                    data: { taskKey, taskId: task.data.taskId, branch: task.data.branch },
                    state: task.state || createTimerState()
                };
                existingItem.tracker = tracker;
                this.updateItemProperties(existingItem, tracker);
                return existingItem;
            }
            const tracker: TrackerWithState = {
                data: { taskKey, taskId: task.data.taskId, branch: task.data.branch },
                state: task.state || createTimerState()
            };
            const newItem = new TrackerListItem(tracker, this.state);
            this.itemsCache.set(taskKey, newItem);
            return newItem;
        });

        const currentKeys = new Set(taskEntries.map(([key]) => key));
        for (const [key, item] of this.itemsCache.entries()) {
            if (!currentKeys.has(key)) {
                this.itemsCache.delete(key);
            }
        }

        return items;
    }

    getTracker(taskKey: string): TrackerWithState | undefined {
        const allTasks = this.state.getAllTasks();
        const task = allTasks[taskKey];
        if (!task) {
            return undefined;
        }
        return {
            data: { taskKey, taskId: task.data.taskId, branch: task.data.branch },
            state: task.state || createTimerState()
        };
    }

    async updateTrackerState(taskKey: string, state: TrackerState) {
        await this.state.saveTimerState(taskKey, state);
        this.refreshItem(taskKey);
    }

    refreshItem(taskKey: string): void {
        const tracker = this.getTracker(taskKey);
        if (tracker) {
            const item = this.itemsCache.get(taskKey);
            if (item) {
                item.tracker = tracker;
                this.updateItemProperties(item, tracker);
                this._onDidChangeTreeData.fire(item);
            }
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

}