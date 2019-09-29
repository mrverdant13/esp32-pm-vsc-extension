import { join } from "path";

import * as vscode from 'vscode';

import { fileExists, folderExists } from "./utils";

export async function isEspressifProject(projectPath: string): Promise<boolean> {
    // Constants
    const espressifFiles: Array<string> = [
        'Makefile',
    ];
    const espressifFolders: Array<string> = [
        'main',
    ];

    // Check if each file exist.
    for (let index = 0; index < espressifFiles.length; index++) {
        const espressifFilePath: string = join(projectPath, espressifFiles[index]);
        if (!await fileExists(espressifFilePath)) {
            return false;
        }
    }

    // Check if each folder exist.
    for (let index = 0; index < espressifFolders.length; index++) {
        const espressifFolderPath: string = join(projectPath, espressifFolders[index]);
        if (!await folderExists(espressifFolderPath)) {
            return false;
        }
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
    if (workspaceFolders === undefined) {
        return false;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;

    // Check if each file exist and its :CONSTANTS: values has been replaced.
    for (let index = 0; index < pmFiles.length; index++) {
        const pmFilePath: string = join(workspacePath, pmFiles[index]);
        if (!await fileExists(pmFilePath)) {
            return false;
        }
        if ((await vscode.workspace.fs.readFile(vscode.Uri.file(pmFilePath))).toString().includes(':MSYS32_PATH:')) {
            return false;
        }
        if ((await vscode.workspace.fs.readFile(vscode.Uri.file(pmFilePath))).toString().includes(':IDF_PATH:')) {
            return false;
        }
    }

    // Check if each folder exist.
    for (let index = 0; index < pmFolders.length; index++) {
        const pmFolderPath: string = join(workspacePath, pmFolders[index]);
        if (!await folderExists(pmFolderPath)) {
            return false;
        }
    }

    // If this point is reached, the project is valid.
    return true;
}

