export interface YandexUser {
    /** API resource address containing user account information */
    self: string;
    /** Unique identifier of the user account in Tracker */
    uid: number;
    /** User login */
    login: string;
    /** Unique identifier of the user account in Tracker */
    trackerUid: number;
    /** Unique identifier of the user account in Yandex 360 for Business and Yandex ID organization */
    passportUid: number;
    /** Unique identifier of the user in Yandex Cloud Organization */
    cloudUid: string;
    /** User first name */
    firstName: string;
    /** User last name */
    lastName: string;
    /** User display name */
    display: string;
    /** User email */
    email: string;
    /** Service parameter */
    external: boolean;
    /** User full access to Tracker: true — full access; false — read-only */
    hasLicense: boolean;
    /** User status in organization: true — user removed from organization; false — active employee */
    dismissed: boolean;
    /** Service parameter */
    useNewFilters: boolean;
    /** Forced notification disable for user: true — notifications disabled; false — notifications enabled */
    disableNotifications: boolean;
    /** Date and time of first user authorization in format YYYY-MM-DDThh:mm:ss.sss±hhmm */
    firstLoginDate: string;
    /** Date and time of last user authorization in format YYYY-MM-DDThh:mm:ss.sss±hhmm */
    lastLoginDate: string;
    /** User addition method: true — via email invitation; false — other method */
    welcomeMailSent: boolean;
}

/** Object with parent task information */
export interface YandexTrackerParentTask {
    /** API resource address containing task information */
    self: string;
    /** Task identifier */
    id: string;
    /** Task key */
    key: string;
    /** Task display name */
    display: string;
}

/** Object with user information */
export interface YandexTrackerUser {
    /** API resource address containing user information */
    self: string;
    /** User identifier */
    id: string;
    /** User display name */
    display: string;
    /** Unique identifier of the user account in Yandex 360 for Business and Yandex ID organization */
    passportUid: number;
    /** Unique identifier of the user in Yandex Cloud Organization */
    cloudUid: string;
}

/** Object with sprint information */
export interface YandexTrackerSprint {
    /** API resource address containing sprint information */
    self: string;
    /** Sprint identifier */
    id: string;
    /** Sprint display name */
    display: string;
}

/** Object with task type information */
export interface YandexTrackerTaskType {
    /** API resource address containing task type information */
    self: string;
    /** Task type identifier */
    id: string;
    /** Task type key */
    key: string;
    /** Task type display name */
    display: string;
}

/** Object with priority information */
export interface YandexTrackerPriority {
    /** API resource address containing priority information */
    self: string;
    /** Priority identifier */
    id: string;
    /** Priority key */
    key: string;
    /** Priority display name */
    display: string;
}

/** Object with task status information */
export interface YandexTrackerStatus {
    /** API resource address containing status information */
    self: string;
    /** Status identifier */
    id: string;
    /** Status key */
    key: string;
    /** Status display name */
    display: string;
}

/** Object with project information */
export interface YandexTrackerProject {
    /** API resource address containing project information */
    self: string;
    /** Project identifier */
    id: string;
    /** Project key */
    key: string;
    /** Project display name */
    display: string;
}

/** Object with queue information */
export interface YandexTrackerQueue {
    /** API resource address containing queue information */
    self: string;
    /** Queue identifier */
    id: string;
    /** Queue key */
    key: string;
    /** Queue display name */
    display: string;
}

/** Object with task projects information */
export interface YandexTrackerTaskProjects {
    /** Primary project of the task */
    primary: YandexTrackerProject;
    /** List of secondary projects of the task */
    secondary: YandexTrackerProject[];
}

export interface YandexTrackerTask {
    /** API resource address containing task information */
    self: string;
    /** Task identifier */
    id: string;
    /** Task key */
    key: string;
    /** Task version. Each task parameter change increments version number. Task editing will be blocked if version reaches limit: 10100 for robots, 11100 for users */
    version: number;
    /** Date and time of last added comment */
    lastCommentUpdatedAt?: string;
    /** Task title */
    summary: string;
    /** Object with parent task information */
    parent?: YandexTrackerParentTask;
    /** Array with alternative task keys information */
    aliases?: string[];
    /** Object with information about last employee who modified the task */
    updatedBy?: YandexTrackerUser;
    /** Task description */
    description?: string;
    /** Array of objects with sprint information */
    sprint?: YandexTrackerSprint[];
    /** Object with task type information */
    type: YandexTrackerTaskType;
    /** Object with priority information */
    priority: YandexTrackerPriority;
    /** Task creation date and time */
    createdAt: string;
    /** Array of objects with task followers information */
    followers?: YandexTrackerUser[];
    /** Object with task creator information */
    createdBy: YandexTrackerUser;
    /** Number of votes for the task */
    votes?: number;
    /** Object with task assignee information */
    assignee?: YandexTrackerUser;
    /** Object with task projects information */
    project?: YandexTrackerTaskProjects;
    /** Object with task queue information */
    queue: YandexTrackerQueue;
    /** Task last update date and time */
    updatedAt: string;
    /** Object with task status information */
    status: YandexTrackerStatus;
    /** Object with previous task status information */
    previousStatus?: YandexTrackerStatus;
    /** Task favorite flag: true — user added task to favorites; false — task not added to favorites */
    favorite?: boolean;
    /** Task tags */
    tags?: string[];
}
