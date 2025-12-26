import { TIMER_SAVE_INTERVAL_MS } from '../constants';
import { snapshotTimerState } from '../tracker';
import { TrackerState } from '../types';

/**
 * Callback for periodic timer save
 */
type TimerSaveCallback = (taskKey: string, state: TrackerState) => Promise<void>;

/**
 * Callback for getting current tracker state
 */
type GetTrackerStateCallback = (taskKey: string) => { state: TrackerState } | undefined;

/**
 * Service for managing timer intervals and state
 */
export class TimerManager {
    public currentTimerTaskKey: string | null = null;
    public isTimerPlay: boolean = false;
    private globalTimer: NodeJS.Timeout | null = null;
    private saveTimer: NodeJS.Timeout | null = null;

    constructor(
        private onSave: TimerSaveCallback,
        private getTrackerState: GetTrackerStateCallback
    ) {}

    /**
     * Starts the UI update timer
     */
    startUpdateTimer(intervalMs: number, onUpdate: () => void): void {
        this.stopUpdateTimer();
        this.globalTimer = setInterval(onUpdate, intervalMs);
    }

    /**
     * Stops the UI update timer
     */
    stopUpdateTimer(): void {
        if (this.globalTimer) {
            clearInterval(this.globalTimer);
            this.globalTimer = null;
        }
    }

    /**
     * Starts periodic saving of timer state
     */
    startPeriodicSave(intervalMs: number = TIMER_SAVE_INTERVAL_MS): void {
        this.stopPeriodicSave();
        this.saveTimer = setInterval(async () => {
            if (!this.isTimerPlay || !this.currentTimerTaskKey) {
                return;
            }
            const tracker = this.getTrackerState(this.currentTimerTaskKey);
            if (tracker && tracker.state.startedAtMs !== null) {
                const snapshot = snapshotTimerState(tracker.state);
                await this.onSave(this.currentTimerTaskKey, snapshot);
            }
        }, intervalMs);
    }

    /**
     * Stops periodic saving
     */
    stopPeriodicSave(): void {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
        }
    }

    /**
     * Disposes all timers
     */
    dispose(): void {
        this.stopUpdateTimer();
        this.stopPeriodicSave();
    }
}

