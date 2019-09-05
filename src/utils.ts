import * as vscode from 'vscode';
import { join } from 'path';
import { readdirSync, lstatSync } from 'fs';

const relativeValuesPath: string = 'assets/local-data/values.json';
export const Esp32IdfValuesSeparator: string = '=';

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

export enum Esp32IdfValueType {
    MSYS32 = 0,
    IDF = 1,
}

export async function getEsp32IdfValues(context: vscode.ExtensionContext) {
    var values: Esp32IdfValues = JSON.parse(
        fileExists(join(context.extensionPath, relativeValuesPath))
            ? (await vscode.workspace.openTextDocument(join(context.extensionPath, relativeValuesPath))).getText()
            : '{}'
    );
    if (values.MSYS32_PATHs === undefined) { values.MSYS32_PATHs = []; }
    if (values.IDF_PATHs === undefined) { values.IDF_PATHs = []; }
    return values;
}

export async function setEsp32IdfValues(context: vscode.ExtensionContext, values: Esp32IdfValues) {
    await vscode.workspace.fs.writeFile(
        vscode.Uri.file(join(context.extensionPath, relativeValuesPath)),
        Buffer.from(JSON.stringify(values))
    );
}

export async function removeNonexistentEsp32IdfValues(context: vscode.ExtensionContext, valueType: Esp32IdfValueType) {
    var values: Esp32IdfValues = await getEsp32IdfValues(context);
    switch (valueType) {
        case Esp32IdfValueType.MSYS32: {
            values.MSYS32_PATHs.forEach(
                (msys32Path) => {
                    if (!folderExists(msys32Path.split(Esp32IdfValuesSeparator)[1])) {
                        values.MSYS32_PATHs.splice(values.MSYS32_PATHs.indexOf(msys32Path), 1);
                    }
                }
            );
            break;
        }
        case Esp32IdfValueType.MSYS32: {
            values.IDF_PATHs.forEach(
                (espidfPath) => {
                    if (!folderExists(espidfPath.split(Esp32IdfValuesSeparator)[1])) {
                        values.IDF_PATHs.splice(values.IDF_PATHs.indexOf(espidfPath), 1);
                    }
                }
            );
        }
    }
    await setEsp32IdfValues(context, values);
}