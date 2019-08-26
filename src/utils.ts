import * as vscode from 'vscode';

export async function folderExists(uri: vscode.Uri): Promise<boolean> {
    var contents: [string, vscode.FileType][] = await vscode.workspace.fs.readDirectory(vscode.Uri.file(uri.fsPath.replace(/[^(\/|\\)]+$/gi, "")));
    return contents.some((element) => { return (element[0] === uri.fsPath.replace(/^.*[\/|\\]/gi, "") && element[1] === vscode.FileType.Directory); });
}

export async function fileExists(uri: vscode.Uri): Promise<boolean> {
    var contents: [string, vscode.FileType][] = await vscode.workspace.fs.readDirectory(vscode.Uri.file(uri.fsPath.replace(/[^(\/|\\)]+$/gi, "")));
    return contents.some((element) => { return (element[0] === uri.fsPath.replace(/^.*[\/|\\]/gi, "") && element[1] === vscode.FileType.File); });
}
