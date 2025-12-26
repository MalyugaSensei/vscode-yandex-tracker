import * as vscode from 'vscode'
import { OAUTH_TOKEN_STORAGE_KEY } from './constants'
import { YaTrackerCredentials, CredentialsProvider } from './sdk/yatracker-sdk'

export async function getCredentials(context: vscode.ExtensionContext): Promise<YaTrackerCredentials | null> {
    const token = await context.secrets.get(OAUTH_TOKEN_STORAGE_KEY)
    const config = vscode.workspace.getConfiguration('trackerHelper')
    const orgId = config.get<string>('orgId', '')

    if (!token || !token.trim() || !orgId || !orgId.trim()) {
        return null
    }

    return { oauthToken: token, orgId }
}

export function createCredentialsProvider(context: vscode.ExtensionContext): CredentialsProvider {
    return async () => {
        return getCredentials(context)
    }
}

export async function setCredentials(
    context: vscode.ExtensionContext,
    token: string
): Promise<void> {
    await context.secrets.store(OAUTH_TOKEN_STORAGE_KEY, token)
}