/*
Copyright (c) 2019 Karlo Fabio Verde Salvatierra

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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