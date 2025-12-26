import * as vscode from 'vscode'
import { logError, logInfo } from './utils/logger'
import { ExtensionState } from './state';
import { handleBranchChange } from './commands';

export const getCurrentBranch = async (): Promise<string | null> => {
    try {
        const extension = vscode.extensions.getExtension('vscode.git')
        if (!extension) {
            return null;
        }
        const gitExtension = extension.isActive ? extension.exports : await extension.activate()
        const git = gitExtension.getAPI(1)
        if (git.repositories.length === 0) {
            return null;
        }

        const repository = git.repositories[0]
        return repository.state.HEAD?.name || null
    } catch (error) {
        logError('Error getting current Git branch', error);
        return null;
    }
}

/**
 * Gets Git repository for listening to branch changes
 */
interface GitRepository {
    state: {
        HEAD: { name: string | null } | null;
        onDidChange: vscode.Event<void>;
    };
}

export const getGitRepository = async (): Promise<GitRepository | null> => {
    try {
        const extension = vscode.extensions.getExtension('vscode.git')
        if (!extension) {
            return null;
        }
        
        const gitExtension = extension.isActive ? extension.exports : await extension.activate()
        const git = gitExtension.getAPI(1)
        
        if (git.repositories.length === 0) {
            return null;
        }

        return git.repositories[0] as GitRepository;
    } catch (error) {
        logError('Error getting Git repository', error);
        return null;
    }
}

/**
 * Sets up listener for Git branch changes
 * @returns Disposable for the listener or null if repository not found
 */
export async function setupGitBranchListener(state: ExtensionState): Promise<vscode.Disposable | null> {
    let repository = await getGitRepository();
    let retries = 0;
    const maxRetries = 5;
    
    while (!repository && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        repository = await getGitRepository();
        retries++;
    }
    
    if (!repository) {
        // Try to set up listener when Git extension becomes available
        const extension = vscode.extensions.getExtension('vscode.git');
        if (extension) {
            Promise.resolve(extension.activate()).then(() => {
                setTimeout(async () => {
                    const repo = await getGitRepository();
                    if (repo) {
                        logInfo('Git repository found after extension activation, setting up listener');
                        setupBranchListenerForRepository(repo, state);
                        // Note: This disposable won't be tracked, but it's a fallback scenario
                        // In normal flow, repository should be found during retries
                    }
                }, 2000);
            }).catch((error: unknown) => {
                logError('Error activating Git extension', error);
            });
        }
        return null;
    }

    return setupBranchListenerForRepository(repository, state);
}

/**
 * Sets up branch change listener for a specific repository
 */
function setupBranchListenerForRepository(repository: GitRepository, state: ExtensionState): vscode.Disposable {
    let lastBranch: string | null = repository.state.HEAD?.name || null;
    logInfo(`Git branch listener initialized. Current branch: ${lastBranch || 'none'}`);

    const disposables: vscode.Disposable[] = [];

    // Listen to repository state changes
    const repoDisposable = repository.state.onDidChange(() => {
        const currentBranch = repository.state.HEAD?.name || null;
        
        if (currentBranch !== lastBranch && currentBranch !== null) {
            logInfo(`Branch changed from ${lastBranch} to ${currentBranch}`);
            lastBranch = currentBranch;
            handleBranchChange(state, currentBranch).catch((error: unknown) => {
                logError('Error handling branch change', error);
            });
        }
    });
    disposables.push(repoDisposable);

    // Also listen to Git extension state changes (for when repositories are added/removed)
    try {
        const extension = vscode.extensions.getExtension('vscode.git');
        if (extension) {
            const getGitExtension = async () => {
                return extension.isActive ? extension.exports : await extension.activate();
            };
            
            getGitExtension().then(gitExt => {
                const git = gitExt.getAPI(1);
                
                const gitStateDisposable = git.onDidChangeState(() => {
                    // Re-check branch when Git state changes
                    const newBranch = repository.state.HEAD?.name || null;
                    if (newBranch !== lastBranch && newBranch !== null) {
                        logInfo(`Branch changed (via Git state change) from ${lastBranch} to ${newBranch}`);
                        lastBranch = newBranch;
                        handleBranchChange(state, newBranch).catch((error: unknown) => {
                            logError('Error handling branch change', error);
                        });
                    }
                });
                disposables.push(gitStateDisposable);
            }).catch((error: unknown) => {
                logError('Error getting Git extension', error);
            });
        }
    } catch (error) {
        logError('Error setting up Git state listener', error);
    }

    return vscode.Disposable.from(...disposables);
}