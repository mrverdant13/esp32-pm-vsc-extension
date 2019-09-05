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

async function getExistingEsp32IdfPaths(paths: string[]): Promise<string[]> {
    var newPaths: string[] = [];
    for (var index: number = 0; index < paths.length; index++) {
        if (await folderExists(paths[index].split(Esp32IdfValuesSeparator)[1])) {
            newPaths.push(paths[index]);
        }
    }
    return newPaths;
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
        (await fileExists(join(context.extensionPath, relativeValuesPath)))
            ? (await vscode.workspace.fs.readFile(vscode.Uri.file(join(context.extensionPath, relativeValuesPath)))).toString()
            : '{}');
    if (values.MSYS32_PATHs === undefined) { values.MSYS32_PATHs = []; }
    if (values.IDF_PATHs === undefined) { values.IDF_PATHs = []; }
    values.MSYS32_PATHs = await getExistingEsp32IdfPaths(values.MSYS32_PATHs);
    values.IDF_PATHs = await getExistingEsp32IdfPaths(values.IDF_PATHs);
    await setEsp32IdfValues(context, values);
    return values;
}

export async function setEsp32IdfValues(context: vscode.ExtensionContext, values: Esp32IdfValues) {
    await vscode.workspace.fs.writeFile(
        vscode.Uri.file(join(context.extensionPath, relativeValuesPath)),
        Buffer.from(JSON.stringify(values))
    );
    // await vscode.workspace.saveAll(false);
}

async function getValueArray(context: vscode.ExtensionContext, type: Esp32IdfValueType) {
    const values = await getEsp32IdfValues(context);
    var valueArray: Array<string> = [];
    switch (type) {
        case Esp32IdfValueType.MSYS32: {
            valueArray = values.MSYS32_PATHs;
            break;
        }
        case Esp32IdfValueType.IDF: {
            valueArray = values.IDF_PATHs;
            break;
        }
    }
    return valueArray;
}

export async function getRegister(context: vscode.ExtensionContext, path: string, type: Esp32IdfValueType) {
    const value = (await getValueArray(context, type)).find((value) => {
        return value.includes(path);
    });
    if (value === undefined) { return ''; }
    return value;
}

export async function getRegisterName(context: vscode.ExtensionContext, path: string, type: Esp32IdfValueType) {
    return (await getRegister(context, path, type)).split(Esp32IdfValuesSeparator)[0];
}

export async function pathIsRegistered(context: vscode.ExtensionContext, path: string, type: Esp32IdfValueType) {
    return ((await getRegister(context, path, type)) !== '');
}

export async function removeRegister(context: vscode.ExtensionContext, path: string, type: Esp32IdfValueType) {
    var values = await getEsp32IdfValues(context);
    switch (type) {
        case Esp32IdfValueType.MSYS32: {
            values.MSYS32_PATHs.splice(values.MSYS32_PATHs.indexOf(await getRegister(context, path, type)), 1);
            break;
        }
        case Esp32IdfValueType.IDF: {
            values.IDF_PATHs.splice(values.IDF_PATHs.indexOf(await getRegister(context, path, type)), 1);
            break;
        }
    }
    await setEsp32IdfValues(context, values);
}

export async function addRegister(context: vscode.ExtensionContext, name: string, path: string, type: Esp32IdfValueType) {
    var values = await getEsp32IdfValues(context);
    name = name.replace(RegExp(Esp32IdfValuesSeparator, 'gi'), '_');
    switch (type) {
        case Esp32IdfValueType.MSYS32: {
            values.MSYS32_PATHs.push(name + Esp32IdfValuesSeparator + path);
            break;
        }
        case Esp32IdfValueType.IDF: {
            values.IDF_PATHs.push(name + Esp32IdfValuesSeparator + path);
            break;
        }
    }
    await setEsp32IdfValues(context, values);
}