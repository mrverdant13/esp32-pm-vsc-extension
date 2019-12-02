import * as vscode from 'vscode';

import * as PathUtils from './path';

export function getActiveFile(): string {
    try {
        // Check if there is active file.
        if (vscode.window.activeTextEditor === undefined || vscode.window.activeTextEditor.document.isClosed || vscode.window.activeTextEditor.document.isUntitled) {
            throw Error('There is no active file.');
        }

        // Return the active file path.
        return PathUtils.joinPaths(vscode.window.activeTextEditor.document.fileName);
    } catch (error) {
        throw error;
    }
}

export async function pickElement(elements: Array<string>, hint: string, errorMessage: string, canPickMany: boolean = false): Promise<string> {
    try {
        // Show a custom pick menu.
        const selectedElement = await vscode.window.showQuickPick(
            elements,
            {
                placeHolder: hint,
                canPickMany: canPickMany
            }
        );

        // If no element was selected, throw an error.
        if (selectedElement === undefined) {
            throw Error(errorMessage);
        }

        // Return the selected element.
        return selectedElement;
    } catch (error) {
        throw error;
    }
}

export async function pickFolder(prompt: string, errorMessage: string): Promise<string> {
    try {
        // Show a custom folder selection dialog.
        const selectedFolder: Array<vscode.Uri> | undefined = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: prompt
        });

        // If no folder was selected, throw an error.
        if (selectedFolder === undefined) {
            throw Error(errorMessage);
        }

        // Return the selected folder.
        return PathUtils.joinPaths(selectedFolder[0].fsPath);
    } catch (error) {
        throw error;
    }
}

export async function introduceString(prompt: string, errorMessage: string) {
    try {
        // Show a custom text input.
        const newProjectName: string | undefined = await vscode.window.showInputBox({ prompt: prompt });

        // Check if no text was introduced.
        if (newProjectName === undefined || newProjectName.trim().length === 0) {
            throw Error(errorMessage);
        }

        // Return the introduced string.
        return newProjectName;
    } catch (error) {
        throw error;
    }
}

export function getWorkspacePath(): string {
    try {
        // Check if there are no workspace folders.
        if (vscode.workspace.workspaceFolders === undefined) {
            throw Error('There is no available workspace.');
        }

        // Get the workspace path.
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;

        // Return the workspace path.
        return workspacePath;
    } catch (error) {
        throw error;
    }
}