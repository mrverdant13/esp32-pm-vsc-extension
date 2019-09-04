import * as vscode from 'vscode';
import { join } from 'path';
import { readdirSync, lstatSync } from 'fs';

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

export function folderExists(path: string): boolean {
    return getFolders(path.replace(/[^(\/|\\)]+$/gi, "")).some((folder) => {
        return folder === path.replace(/^.*[\/|\\]/gi, "");
    });
}

export function fileExists(path: string): boolean {
    return getFiles(path.replace(/[^(\/|\\)]+$/gi, "")).some((file) => {
        return file === path.replace(/^.*[\/|\\]/gi, "");
    });
}

export async function isEsp32idfProject(): Promise<boolean> {
    var workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return false; }
    return await fileExists(join(workspaceFolders[0].uri.fsPath, "esp32-idf.json"));
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

export interface Esp32IdfValues {
    MSYS32_PATHs: Array<string>;
    IDF_PATHs: Array<string>;
}

export async function getEsp32IdfValues(context: vscode.ExtensionContext) {
    var values: Esp32IdfValues = JSON.parse(
        fileExists(join(context.extensionPath, 'assets/local-data/values.json'))
            ? (await vscode.workspace.openTextDocument(join(context.extensionPath, 'assets/local-data/values.json'))).getText()
            : '{}'
    );
    if (values.MSYS32_PATHs === undefined) { values.MSYS32_PATHs = []; }
    if (values.IDF_PATHs === undefined) { values.IDF_PATHs = []; }
    return values;
}
