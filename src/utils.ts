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

export async function isEsp32idfProject(): Promise<boolean> {
    var workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return false; }
    if (!await folderExists(join(workspaceFolders[0].uri.fsPath, "main/src"))) { return false; }
    if (!await fileExists(join(workspaceFolders[0].uri.fsPath, ".vscode/settings.json"))) { return false; }
    if (!await fileExists(join(workspaceFolders[0].uri.fsPath, ".vscode/c_cpp_properties.json"))) { return false; }
    var filesContent: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, ".vscode/settings.json")))).toString() + (await vscode.workspace.fs.readFile(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, ".vscode/c_cpp_properties.json")))).toString();
    if (filesContent.includes(':MSYS32_PATH:')) { return false; }
    if (filesContent.includes(':IDF_PATH:')) { return false; }
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
