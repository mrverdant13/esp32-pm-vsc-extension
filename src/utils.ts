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

export async function pickElement(elements: Array<string>, hint: string, errorMessage: string, canPickMany: boolean = false): Promise<string> {
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
}

export async function pickFolder(prompt: string, errorMessage: string): Promise<string> {
    try {
        // Show a custom folder selection folder.
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
        return selectedFolder[0].fsPath;
    } catch (error) {
        throw error;
    }
}

export async function introduceString(prompt: string, errorMessage: string) {
    try {
        // Show a custom text input.
        const newProjectName: string | undefined = await vscode.window.showInputBox({ prompt: prompt });

        // If no text was introduced, throw an error.
        if (newProjectName === undefined || newProjectName.trim().length === 0) {
            throw Error(errorMessage);
        }

        // Return the introduced string.
        return newProjectName;
    } catch (error) {
        throw error;
    }
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
    try {
        // Return the revision of the folder existence.
        return await elementExists(path, vscode.FileType.Directory);
    } catch (error) {
        throw error;
    }
}

export async function fileExists(path: string): Promise<boolean> {
    try {
        // Return the revision of the file existence.
        return await elementExists(path, vscode.FileType.File);
    } catch (error) {
        throw error;
    }
}

export function getFolders(path: string): Array<string> {
    try {
        // Get the elements inside the passed folder and filter the directories.
        return readdirSync(path).filter((element) => {
            if (lstatSync(join(path, element)).isDirectory()) {
                return element;
            }
        });
    } catch (error) {
        throw error;
    }
}

export function getFiles(path: string): Array<string> {
    try {
        // Get the elements inside the passed folder and filter the files.
        return readdirSync(path).filter((element) => {
            if (lstatSync(join(path, element)).isFile()) {
                return element;
            }
        });
    } catch (error) {
        throw error;
    }
}

export async function filterExistingFolders(folders: Array<string>): Promise<Array<string>> {
    try {
        var existingPaths: Array<string> = [];

        // Check if each of the passed folders exist and, if so, append them to a final array.
        for (var index: number = 0; index < folders.length; index++) {
            if (await folderExists(folders[index])) {
                existingPaths.push(folders[index]);
            }
        }

        // Return the resulting array.
        return existingPaths;
    } catch (error) {
        throw error;
    }
}

export async function readFile(filePath: string): Promise<string> {
    return (await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))).toString();
}

export async function writeFile(filePath: string, content: string): Promise<void> {
    await vscode.workspace.fs.writeFile(
        vscode.Uri.file(filePath),
        Buffer.from(content)
    );
}

export async function copyFile(originFilePath: string, destinationFilePath: string): Promise<void> {
    try {
        await vscode.workspace.fs.copy(
            vscode.Uri.file(originFilePath),
            vscode.Uri.file(destinationFilePath),
            { overwrite: true }
        );
    } catch (error) {
        throw error;
    }
}

export async function replaceInFile(filePath: string, find: RegExp, replace: string): Promise<void> {
    try {
        const fileContent: string = await readFile(filePath);
        await writeFile(
            filePath,
            fileContent.replace(find, replace)
        );
    } catch (error) {
        throw error;
    }
}

export function executeShellCommands(name: string, commandLines: Array<string>): void {
    try {
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

        // The terminal will be first cleared.
        task.presentationOptions.clear = true;

        // The generated terminal will take focus.
        task.presentationOptions.focus = true;

        // Execute the task.
        vscode.tasks.executeTask(task);
    } catch (error) {
        throw error;
    }
}
