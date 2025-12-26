export interface TrackerData {
    taskKey: string
    taskId?: string
    branch: string
}

export interface TrackerState {
    elapsedMs: number
    startedAtMs: number | null
}

// Combined type for storage in provider
export interface TrackerWithState {
    data: TrackerData
    state: TrackerState
}