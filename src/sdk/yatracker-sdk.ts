import * as vscode from 'vscode'
import { YandexTrackerTask, YandexUser } from './types'
import { logError } from '../utils/logger'

export interface YaTrackerCredentials {
    oauthToken: string
    orgId: string
}

export type CredentialsProvider = () => Promise<YaTrackerCredentials | null>

/**
 * SDK for working with Yandex Tracker API v3
 * Provides methods for fetching tasks and sending work time
 */
export class YaTrackerSDK {
    private readonly baseUrl = 'https://api.tracker.yandex.net/v3'
    private readonly getCredentials: CredentialsProvider
    private currentUser: YandexUser | null = null

    constructor(getCredentials: CredentialsProvider) {
        this.getCredentials = getCredentials
    }

    async initialize(): Promise<void> {
        try {
            this.currentUser = await this.getCurrentUser()
        } catch (error) {
            if (error instanceof Response) {
                const data = await error.json() as { errorMessages: string[] }
                const messages = Array.isArray(data.errorMessages) ? data.errorMessages.join(', ') : ''
                vscode.window.showErrorMessage(`SDK initialization error: ${messages}`)
                return;
            }
            vscode.window.showErrorMessage('SDK initialization error')
        }
    }

    private async makeHeaders (): Promise<Record<string, string>> {
        const credentials = await this.getCredentials()
        const config = vscode.workspace.getConfiguration('trackerHelper')


        if (!credentials) {
            throw new Error('[YaTrackerSDK] Credentials not available')
        }

        return {
            "Authorization": "OAuth " + credentials.oauthToken,
            [String(config.get('orgIdHeader'))]: credentials.orgId
        }
    }

    async getCurrentUser (): Promise<YandexUser> {
        const response = await fetch(this.baseUrl + '/myself', {
            method: 'GET',
            headers: await this.makeHeaders(),

        })

        if (!response.ok) {
            logError(`getCurrentUser request error: ${response.status} ${response.statusText}`);
            throw response
        }

        return response.json() as Promise<YandexUser>
    }

    async getTasks (): Promise<YandexTrackerTask[]> {
        const response = await fetch(this.baseUrl + '/issues/_search?expand=transitions', {
            method: 'POST',
            headers: await this.makeHeaders(),
            body: JSON.stringify({
                filter: {
                    assignee: this.currentUser?.uid,
                    author: this.currentUser?.uid
                }
            })
        })

        if (!response.ok) {
            logError(`getTasks request error: ${response.status} ${response.statusText}`);
            throw response
        }

        return response.json() as Promise<YandexTrackerTask[]>
    }

    /**
     * Adds a worklog entry for a task in Yandex Tracker
     * @param taskIdOrKey Task identifier or key
     * @param durationMs Time in milliseconds
     * @param startDate Work start date (if not specified, current date minus duration is used)
     * @param comment Comment for the worklog entry
     * @throws {Error} If API request fails
     */
    async addWorklog(
        taskIdOrKey: string,
        durationMs: number,
        startDate?: Date,
        comment?: string
    ): Promise<void> {
        if (!taskIdOrKey || taskIdOrKey.trim().length === 0) {
            throw new Error('Task key or ID cannot be empty');
        }

        if (durationMs < 0) {
            throw new Error('Time cannot be negative');
        }

        if (durationMs === 0) {
            throw new Error('Time cannot be zero');
        }

        const duration = this.msToISO8601Duration(durationMs);
        
        const start = startDate || new Date(Date.now() - durationMs);
        const startISO = this.formatDateTime(start);

        const body: {
            start: string;
            duration: string;
            comment?: string;
        } = {
            start: startISO,
            duration: duration
        };

        if (comment) {
            body.comment = comment;
        }

        const response = await fetch(`${this.baseUrl}/issues/${taskIdOrKey}/worklog`, {
            method: 'POST',
            headers: {
                ...await this.makeHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            logError(`addWorklog error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Error sending time: ${response.status} ${response.statusText}`);
        }
    }

    /**
     * Converts milliseconds to ISO 8601 duration format
     */
    private msToISO8601Duration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        const YANDEX_WORK_DAY_HOURS = 8;
        const YANDEX_WORK_WEEK_DAYS = 5;

        const days = Math.floor(hours / YANDEX_WORK_DAY_HOURS);
        const weeks = Math.floor(days / YANDEX_WORK_WEEK_DAYS);

        const remainingDays = days % YANDEX_WORK_WEEK_DAYS;
        const remainingHours = hours % YANDEX_WORK_DAY_HOURS;
        const remainingMinutes = minutes % 60;
        const remainingSeconds = seconds % 60;

        let duration = 'P';
        
        if (weeks > 0) {
            duration += `${weeks}W`;
        }
        if (remainingDays > 0) {
            duration += `${remainingDays}D`;
        }
        
        duration += 'T';
        
        if (remainingHours > 0) {
            duration += `${remainingHours}H`;
        }
        if (remainingMinutes > 0) {
            duration += `${remainingMinutes}M`;
        }
        if (remainingSeconds > 0) {
            duration += `${remainingSeconds}S`;
        }

        return duration || 'PT0S';
    }

    /**
     * Formats Date to YYYY-MM-DDThh:mm:ss.sss±hhmm format
     */
    private formatDateTime(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        
        const offset = -date.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
        const offsetMinutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
        const offsetSign = offset >= 0 ? '+' : '-';
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetSign}${offsetHours}${offsetMinutes}`;
    }
}