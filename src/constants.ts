export const START_TIMER_COMMAND = 'tracker-helper.startTracker'
export const STOP_TIMER_COMMAND = 'tracker-helper.stopTracker'

export const FETCH_TASK_COMMAND = 'tracker-helper.fetch'
export const TASKS_VIEW = 'tracker-helper.tasks'
export const SET_OAUTH_TOKEN_COMMAND = "tracker-helper.setOAuthToken"
export const ASSIGN_TASK_WITH_BRANCH_COMMAND = "tracker-helper.assignTaskWithBranch"
export const SEND_TIME_ALL_COMMAND = "tracker-helper.sendTimeAll"
export const SEND_TIME_TASK_COMMAND = "tracker-helper.sendTimeTask"
export const CLEAR_ALL_DATA_COMMAND = "tracker-helper.clearAllData"

export const OAUTH_TOKEN_STORAGE_KEY = 'yatracker.oauthToken'
export const TASK_STORAGE_KEY = 'tracker-helper.taskStore'

export const TIMER_UPDATE_INTERVAL_MS = 1000
export const TIMER_SAVE_INTERVAL_MS = 5000
export const MAX_RESTORE_TIME_MS = 24 * 60 * 60 * 1000
export const MIN_TIME_TO_SEND_MS = 1000