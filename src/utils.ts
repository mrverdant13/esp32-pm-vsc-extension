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
        if (lstatSync(join(path, element)).isDirectory()) { return element; }
    });
}

export function getFiles(path: string): string[] {
    return readdirSync(path).filter((element) => {
        if (lstatSync(join(path, element)).isFile()) { return element; }
    });
}

export async function isEspressifProject(projectPath: string): Promise<boolean> {
    // Constants
    const espressifFiles: Array<string> = [
        'Makefile'
    ];
    const espressifFolders: Array<string> = [
        'main'
    ];

    // Check if each file exist.
    for (let index = 0; index < espressifFiles.length; index++) {
        const espressifFilePath: string = join(projectPath, espressifFiles[index]);
        if (!await fileExists(espressifFilePath)) { return false; }
    }

    // Check if each folder exist.
    for (let index = 0; index < espressifFolders.length; index++) {
        const espressifFolderPath: string = join(projectPath, espressifFolders[index]);
        if (!await folderExists(espressifFolderPath)) { return false; }
    }

    // If this point is reached, the project is valid.
    return true;
}

export async function isEsp32PmProject(): Promise<boolean> {

    // Constants
    const pmFiles: Array<string> = [
        '.vscode/settings.json',
        '.vscode/c_cpp_properties.json'
    ];
    const pmFolders: Array<string> = [
        'main/src'
    ];

    // Get the workspace path.
    var workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders === undefined) { return false; }
    const workspacePath = workspaceFolders[0].uri.fsPath;

    // Check if each file exist and its :CONSTANTS: values has been replaced.
    for (let index = 0; index < pmFiles.length; index++) {
        const pmFilePath: string = join(workspacePath, pmFiles[index]);
        if (!await fileExists(pmFilePath)) { return false; }
        if ((await vscode.workspace.fs.readFile(vscode.Uri.file(pmFilePath))).toString().includes(':MSYS32_PATH:')) { return false; }
        if ((await vscode.workspace.fs.readFile(vscode.Uri.file(pmFilePath))).toString().includes(':IDF_PATH:')) { return false; }
    }

    // Check if each folder exist.
    for (let index = 0; index < pmFolders.length; index++) {
        const pmFolderPath: string = join(workspacePath, pmFolders[index]);
        if (!await folderExists(pmFolderPath)) { return false; }
    }

    // If this point is reached, the project is valid.
    return true;
}

export async function filterExistingPaths(paths: string[]): Promise<string[]> {
    var existingPaths: string[] = [];
    for (var index: number = 0; index < paths.length; index++) {
        if (await folderExists(paths[index])) {
            existingPaths.push(paths[index]);
        }
    }
    return existingPaths;
}

export function executeShellCommands(name: string, commandLines: string[]): void {
    var _task = new vscode.Task(
        { type: "shell" },
        vscode.TaskScope.Workspace,
        name,
        "ESP32-IDF",
        new vscode.ShellExecution(commandLines.join(" && "))
    );
    _task.presentationOptions.echo = false;
    _task.presentationOptions.focus = true;
    vscode.tasks.executeTask(_task);
}
