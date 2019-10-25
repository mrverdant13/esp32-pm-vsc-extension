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
    joinPaths,
} from './joiner';
import {
    readdirSync,
    lstatSync,
} from 'fs';
import {
    Project,
    ProjectValidationType,
} from './models/esp32-pm-project';
import * as Esp32PmProjectConsts from "./constants/esp32pm-project";
import * as ExtensionConsts from "./constants/extension-const";

export function delay(ms: number): Promise<unknown> {
    // Create a promise with specific duration.
    return new Promise(resolve => setTimeout(resolve, ms));
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
        return joinPaths(selectedFolder[0].fsPath);
    } catch (error) {
        throw error;
    }
}

export function getActiveFile(): string {
    try {
        // Check if there is active file.
        if (vscode.window.activeTextEditor === undefined || vscode.window.activeTextEditor.document.isClosed || vscode.window.activeTextEditor.document.isUntitled) {
            throw Error('There is no active file.');
        }

        // Return the active file path.
        return joinPaths(vscode.window.activeTextEditor.document.fileName);
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
            if (lstatSync(joinPaths(path, element)).isDirectory()) {
                return joinPaths(element);
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
            if (lstatSync(joinPaths(path, element)).isFile()) {
                return joinPaths(element);
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
                existingPaths.push(joinPaths(folders[index]));
            }
        }

        // Return the resulting array.
        return existingPaths;
    } catch (error) {
        throw error;
    }
}

export async function readFile(filePath: string): Promise<string> {
    try {
        // Return file content as string.
        return (await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))).toString().trim();
    } catch (error) {
        throw error;
    }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
    try {
        // Write content to file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(filePath),
            Buffer.from(content)
        );
    } catch (error) {
        throw error;
    }
}

export async function copyElement(originFilePath: string, destinationFilePath: string): Promise<void> {
    try {
        // Copy element.
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
        // Read file.
        const fileContent: string = await readFile(filePath);

        // Replace value in content and write to file.
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

        // Use the same panel for command terminal execution.
        task.presentationOptions.panel = vscode.TaskPanelKind.Shared;

        // Execute the task.
        vscode.tasks.executeTask(task);
    } catch (error) {
        throw error;
    }
}

export async function getSerialPorts(context: vscode.ExtensionContext): Promise<Array<string>> {
    try {
        // Execute the Windows commands to list the available COM ports.
        executeShellCommands(
            'Generate serial ports',
            [
                'echo -e "ESP32-PM: Generating serial ports list...\n"',
                'export serialPortsFile="' + Esp32PmProjectConsts.Paths.SerialPortsFile + '"',
                'export platform="' + process.platform + '"',
                'bash ' + joinPaths(context.asAbsolutePath(ExtensionConsts.Paths.SerialPortGeneratorFile)),
            ]
        );

        // Create a watcher for the serial ports file deletion.
        const fsw: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher(joinPaths('**', Esp32PmProjectConsts.Paths.SerialPortsFile), true, true, false);
        var serialPorts: Set<string> = new Set();
        var serialPortsChecked: boolean = false;

        // When the serial ports file is deleted, get the found serial ports.
        fsw.onDidDelete(
            async () => {
                const fileContent = (await readFile(joinPaths((await Project.getWorkspacePath(ProjectValidationType.ESP32PM_PROJ)), Esp32PmProjectConsts.Paths.SerialPortsFile + ".txt")));
                if (fileContent.length > 0) {
                    serialPorts = new Set(fileContent.split("\n"));
                }
                serialPortsChecked = true;
            }
        );

        // Wait until all serial ports are checked.
        while (!serialPortsChecked) {
            await delay(100);
        }

        // Delete the watcher.
        fsw.dispose();

        if (serialPorts.size === 0) {
            throw Error('No serial port available.');
        }

        // Return the found serial ports.
        return [...serialPorts];
    } catch (error) {
        throw error;
    }
}
