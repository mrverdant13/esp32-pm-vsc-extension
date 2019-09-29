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
import { join } from 'path';
import { readdirSync, lstatSync } from 'fs';

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function elementExists(path: string, type: vscode.FileType): Promise<boolean> {
    try {
        var fileStat: vscode.FileStat = await vscode.workspace.fs.stat(vscode.Uri.file(path));
        return fileStat.type === type;
    } catch (error) {
        return false;
    }
}

export async function folderExists(path: string): Promise<boolean> {
    return await elementExists(path, vscode.FileType.Directory);
}

export async function fileExists(path: string): Promise<boolean> {
    return await elementExists(path, vscode.FileType.File);
}

export function getFolders(path: string): string[] {
    return readdirSync(path).filter((element) => {
        if (lstatSync(join(path, element)).isDirectory()) {
            return element;
        }
    });
}

export function getFiles(path: string): string[] {
    return readdirSync(path).filter((element) => {
        if (lstatSync(join(path, element)).isFile()) {
            return element;
        }
    });
}

export async function filterExistingFolders(paths: string[]): Promise<string[]> {
    var existingPaths: string[] = [];
    for (var index: number = 0; index < paths.length; index++) {
        if (await folderExists(paths[index])) {
            existingPaths.push(paths[index]);
        }
    }
    return existingPaths;
}

export function executeShellCommands(name: string, commandLines: string[]): void {
    const task = new vscode.Task(
        { type: "shell" },
        vscode.TaskScope.Workspace,
        name,
        "ESP32-PM",
        new vscode.ShellExecution(commandLines.join(" && "))
    );
    task.presentationOptions.echo = false;
    task.presentationOptions.focus = true;
    vscode.tasks.executeTask(task);
}
