import { TrackerState } from "./types"

/**
 * Creates initial timer state
 * @returns Timer state with zero elapsed time and inactive status
 */
export function createTimerState(): TrackerState {
    return { elapsedMs: 0, startedAtMs: null }
}

/**
 * Starts time tracking
 * @param state Current timer state
 * @returns New state with tracking start time set
 */
export function setTrackingStarted(state: TrackerState): TrackerState {
    if (state.startedAtMs !== null) return state
    return { ...state, startedAtMs: Date.now() }
}

/**
 * Stops time tracking and adds elapsed time to accumulated time
 * @param state Current timer state
 * @returns New state with stopped timer and updated accumulated time
 */
export function setTrackingStopped(state: TrackerState): TrackerState {
    if (state.startedAtMs === null) return state
    const elapsed = Date.now() - state.startedAtMs
    return {
        ...state,
        elapsedMs: state.elapsedMs + elapsed,
        startedAtMs: null
    }
}

/**
 * Resets timer to initial state
 * @param state Current timer state
 * @returns Timer state with zero elapsed time
 */
export function resetTimer(state: TrackerState): TrackerState {
    return { elapsedMs: 0, startedAtMs: null }
}

/**
 * Gets total elapsed time in milliseconds
 * @param state Timer state
 * @returns Total elapsed time in milliseconds (including current session if timer is active)
 */
export function getElapsedMs(state: TrackerState): number {
    if (state.startedAtMs === null) return state.elapsedMs
    return state.elapsedMs + (Date.now() - state.startedAtMs)
}

/**
 * Creates a snapshot of timer state, saving accumulated time and restarting the count
 * Used for periodic state saving
 * @param state Current timer state
 * @returns New state with saved accumulated time and new start time
 */
export function snapshotTimerState(state: TrackerState): TrackerState {
    if (state.startedAtMs === null) return state
    const now = Date.now()
    const currentElapsed = now - state.startedAtMs
    return {
        elapsedMs: state.elapsedMs + currentElapsed,
        startedAtMs: now
    }
}