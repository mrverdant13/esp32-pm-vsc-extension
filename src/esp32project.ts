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

