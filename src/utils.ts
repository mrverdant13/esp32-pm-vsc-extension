import * as vscode from 'vscode';
import { join } from 'path';

export async function isEsp32idfProject(): Promise<boolean> {
    var workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return false; }
    return await folderExists(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, ".esp32-idf")));
}

export function createEspIdfTerminal(name: string): vscode.Terminal {
    const _terminal = vscode.window.createTerminal({
        name: name,
    });
    _terminal.hide();
    _terminal.sendText("stty -echo && tput rs1");
    return _terminal;
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function folderExists(uri: vscode.Uri): Promise<boolean> {
    var contents: [string, vscode.FileType][] = await vscode.workspace.fs.readDirectory(vscode.Uri.file(uri.fsPath.replace(/[^(\/|\\)]+$/gi, "")));
    return contents.some((element) => { return (element[0] === uri.fsPath.replace(/^.*[\/|\\]/gi, "") && element[1] === vscode.FileType.Directory); });
}

export async function fileExists(uri: vscode.Uri): Promise<boolean> {
    var contents: [string, vscode.FileType][] = await vscode.workspace.fs.readDirectory(vscode.Uri.file(uri.fsPath.replace(/[^(\/|\\)]+$/gi, "")));
    return contents.some((element) => { return (element[0] === uri.fsPath.replace(/^.*[\/|\\]/gi, "") && element[1] === vscode.FileType.File); });
}
