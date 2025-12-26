import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | null = null;

/**
 * Initializes the output channel for logging
 */
export function initializeLogger(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Tracker Helper');
    }
    return outputChannel;
}

/**
 * Gets the output channel for logging
 */
function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        return initializeLogger();
    }
    return outputChannel;
}

/**
 * Logs an informational message
 */
export function logInfo(message: string, ...args: unknown[]): void {
    const channel = getOutputChannel();
    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 
        ? `[${timestamp}] [INFO] ${message} ${JSON.stringify(args)}`
        : `[${timestamp}] [INFO] ${message}`;
    channel.appendLine(formattedMessage);
}

/**
 * Logs a warning message
 */
export function logWarn(message: string, ...args: unknown[]): void {
    const channel = getOutputChannel();
    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 
        ? `[${timestamp}] [WARN] ${message} ${JSON.stringify(args)}`
        : `[${timestamp}] [WARN] ${message}`;
    channel.appendLine(formattedMessage);
}

/**
 * Logs an error message
 */
export function logError(message: string, error?: unknown): void {
    const channel = getOutputChannel();
    const timestamp = new Date().toISOString();
    let errorDetails = '';
    
    if (error instanceof Error) {
        errorDetails = `\n${error.stack || error.message}`;
    } else if (error instanceof Response) {
        errorDetails = `\nHTTP ${error.status} ${error.statusText}`;
    } else if (error) {
        errorDetails = `\n${JSON.stringify(error)}`;
    }
    
    channel.appendLine(`[${timestamp}] [ERROR] ${message}${errorDetails}`);
}

/**
 * Shows the log output channel to the user
 */
export function showLogOutput(): void {
    const channel = getOutputChannel();
    channel.show(true);
}

