import { StatusBarItem } from "vscode";
import { TrackerListProvider } from "./trackerListProvider";
import { getElapsedMs } from "../tracker";
import { ExtensionState } from "../state";
import { formatDuration } from "../utils/time";

export const renderTimerInStatusBar = (statusBar: StatusBarItem, state: ExtensionState) => {
    if (!state.currentTimerTaskKey || !state.isTimerPlay) {
        statusBar.hide();
        return;
    }

    const tracker = state.listProvider.getTracker(state.currentTimerTaskKey)
    if (!tracker) {
        statusBar.hide();
        return;
    }

    const elapsedMs = getElapsedMs(tracker.state);
    const time = formatDuration(elapsedMs);
    statusBar.text = `${tracker.data.taskKey}: ${time}`;
    statusBar.show();
}

export const renderTimerInTreeView = (listProvider: TrackerListProvider, state: ExtensionState) => {
    if (state.isTimerPlay && state.currentTimerTaskKey) {
        listProvider.refreshItem(state.currentTimerTaskKey);
    }
}

