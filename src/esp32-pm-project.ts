import {
    join,
} from "path";

import * as vscode from 'vscode';

import {
    espressifFolders,
    espressifFiles,
    esp32PmFiles,
    colonConstants,
    esp32PmFolders,
} from "./constants";
import {
    fileExists,
    folderExists,
} from "./utils";

export async function isEspressifProject(projectPath: string): Promise<boolean> {

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

export async function isEsp32PmProject(projectPath: string): Promise<boolean> {

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

export async function getProjectPath(): Promise<string> {

    // Check if there are no workspace folders.
    if (vscode.workspace.workspaceFolders === undefined) {
        throw Error('There is no available workspace.');
    }

    // Set the project path.
    const currentProjectPath = vscode.workspace.workspaceFolders[0].uri.fsPath;


    // Check if each characteristic file exists.
    // and it their :<CONSTANTS>: values has been replaced.
    for (let index = 0; index < esp32PmFiles.length; index++) {
        const esp32PmFilePath: string = join(currentProjectPath, esp32PmFiles[index]);
        if (!await fileExists(esp32PmFilePath)) {
            throw Error('The current workspace does not contain an ESP32-PM project.');
        }
        for (let ind = 0; ind < colonConstants.length; ind++) {
            if ((await vscode.workspace.fs.readFile(vscode.Uri.file(esp32PmFilePath))).toString().includes(':' + colonConstants[ind] + ':')) {
                throw Error('There are unsolved ESP32-PM project values that has not been set. Execute the "ESP32-PM: Initialize existing project" command.');
            }
        }
    }

    // Check if each characteristic folder exists.
    for (let index = 0; index < esp32PmFolders.length; index++) {
        const esp32PmFolderPath: string = join(currentProjectPath, esp32PmFolders[index]);
        if (!await folderExists(esp32PmFolderPath)) {
            throw Error('The current workspace does not contain an ESP32-PM project.');
        }
    }

    // If this point is reached, the project is valid.
    return currentProjectPath;
}

export async function validateProject(): Promise<void> {
    try {
        await getProjectPath();
    } catch (error) {
        throw error;
    }
}
