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
import {
    join,
} from 'path';
import {
    readdirSync,
    lstatSync,
} from 'fs';

export function delay(ms: number) {
    // Create a promise with specific duration.
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function showQuickPickFrom(elements: Array<string>, hint: string, canPickMany: boolean = false) {
    // Show a custom pick menu.
    return await vscode.window.showQuickPick(
        elements,
        {
            placeHolder: hint,
            canPickMany: canPickMany
        }
    );
}

async function elementExists(path: string, type: vscode.FileType): Promise<boolean> {
    try {
        // Get the info regarding the passed file path.
        const fileStat: vscode.FileStat = await vscode.workspace.fs.stat(vscode.Uri.file(path));

        // Return the validation of the file type.
        return fileStat.type === type;
    } catch (error) {
        // If this point is reached, an exception was thrown and, thus, the file does not exist.
        return false;
    }
}

export async function folderExists(path: string): Promise<boolean> {
    // Return the revision of the folder existence.
    return await elementExists(path, vscode.FileType.Directory);
}

export async function fileExists(path: string): Promise<boolean> {
    // Return the revision of the file existence.
    return await elementExists(path, vscode.FileType.File);
}

export function getFolders(path: string): string[] {
    // Get the elements inside the passed folder and filter the directories.
    return readdirSync(path).filter((element) => {
        if (lstatSync(join(path, element)).isDirectory()) {
            return element;
        }
    });
}

export function getFiles(path: string): string[] {
    // Get the elements inside the passed folder and filter the files.
    return readdirSync(path).filter((element) => {
        if (lstatSync(join(path, element)).isFile()) {
            return element;
        }
    });
}

export async function filterExistingFolders(folders: string[]): Promise<string[]> {
    var existingPaths: string[] = [];

    // Check if each of the passed folders exist and, if so, append them to a final array.
    for (var index: number = 0; index < folders.length; index++) {
        if (await folderExists(folders[index])) {
            existingPaths.push(folders[index]);
        }
    }

    // Return the resulting array.
    return existingPaths;
}

export function executeShellCommands(name: string, commandLines: string[]): void {

    // Create a task related to a terminal which will execute the passed commands.
    const task = new vscode.Task(
        { type: "shell" },
        vscode.TaskScope.Workspace,
        name,
        "ESP32-PM",
        new vscode.ShellExecution(commandLines.join(" && "))
    );

    // The executed commands will not be printed.
    task.presentationOptions.echo = false;

    // The generated terminal will take focus.
    task.presentationOptions.focus = true;

    // Execute the task.
    vscode.tasks.executeTask(task);
}
