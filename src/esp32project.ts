import {
    join
} from "path";

import * as vscode from 'vscode';

import {
    espressifFolders,
    espressifFiles,
    esp32PmFiles,
    colonConstants,
    esp32PmFolders
} from "./constants";
import {
    fileExists,
    folderExists
} from "./utils";

function getProjectPath(): string {

    // Check if there are no workspace folders.
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders === undefined) {
        return '';
    }

    // If this point is reached, the project exists and its path is returned.
    return workspaceFolders[0].uri.fsPath;

}

export async function isEspressifProject(): Promise<boolean> {

    // Get the project path.
    const projectPath = getProjectPath();
    if (projectPath === '') {
        return false;
    }

    // Check if each characteristic file exists.
    for (let index = 0; index < espressifFiles.length; index++) {
        const espressifFilePath: string = join(projectPath, espressifFiles[index]);
        if (!await fileExists(espressifFilePath)) {
            return false;
        }
    }

    // Check if each characteristic folder exists.
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

    // Get the project path.
    const projectPath = getProjectPath();
    if (projectPath === '') {
        return false;
    }

    // Check if each characteristic file exists.
    // and it their :<CONSTANTS>: values has been replaced.
    for (let index = 0; index < esp32PmFiles.length; index++) {
        const esp32PmFilePath: string = join(projectPath, esp32PmFiles[index]);
        if (!await fileExists(esp32PmFilePath)) {
            return false;
        }
        for (let ind = 0; ind < colonConstants.length; ind++) {
            if ((await vscode.workspace.fs.readFile(vscode.Uri.file(esp32PmFilePath))).toString().includes(':' + colonConstants[ind] + ':')) {
                return false;
            }
        }
    }

    // Check if each characteristic folder exists.
    for (let index = 0; index < esp32PmFolders.length; index++) {
        const esp32PmFolderPath: string = join(projectPath, esp32PmFolders[index]);
        if (!await folderExists(esp32PmFolderPath)) {
            return false;
        }
    }

    // If this point is reached, the project is valid.
    return true;
}

