import {
    join,
} from "path";

import * as vscode from 'vscode';

import {
    espressifFolders,
    espressifFiles,
    esp32PmFiles,
    boundedConstants,
    esp32PmFolders,
    constantBounder,
} from "./constants";
import {
    fileExists,
    folderExists,
} from "./utils";

export enum ValidationType {
    NONE = 0,
    ESPRESSIF_PROJ = 1,
    ESP32_PM_PROJ = 2,
}

export async function validateEspressifProject(projectPath: string = ''): Promise<void> {
    const errorMessage: string = 'The selected folder does not contain an Espressif project.';
    try {
        // If the project path is not passed, use the workspace one.
        if (projectPath.length === 0) {
            projectPath = await getWorkspacePath(ValidationType.NONE);
        }

        // Check if each characteristic file exists.
        for (let index = 0; index < espressifFiles.length; index++) {
            const espressifFilePath: string = join(projectPath, espressifFiles[index]);
            if (!await fileExists(espressifFilePath)) {
                throw Error(errorMessage);
            }
        }

        // Check if each characteristic folder exists.
        for (let index = 0; index < espressifFolders.length; index++) {
            const espressifFolderPath: string = join(projectPath, espressifFolders[index]);
            if (!await folderExists(espressifFolderPath)) {
                throw Error(errorMessage);
            }
        }
    } catch (error) {
        throw error;
    }
}

export async function validateEsp32PmProject(projectPath: string = ''): Promise<void> {
    const isNotEsp32PmProjectMessage: string = 'The current workspace does not contain an ESP32-PM project.';
    const constantValuesUnsolved: string = 'There are unsolved ESP32-PM project values that has not been set. Execute the "ESP32-PM: Initialize existing project" command.';

    try {
        // If the project path is not passed, use the workspace one.
        if (projectPath.length === 0) {
            projectPath = await getWorkspacePath(ValidationType.ESPRESSIF_PROJ);
        }

        // Check if each characteristic file exists.
        // and it their :<CONSTANTS>: values has been replaced.
        for (let index = 0; index < esp32PmFiles.length; index++) {
            const esp32PmFilePath: string = join(projectPath, esp32PmFiles[index]);
            if (!await fileExists(esp32PmFilePath)) {
                throw Error(isNotEsp32PmProjectMessage);
            }
            for (let ind = 0; ind < boundedConstants.length; ind++) {
                if ((await vscode.workspace.fs.readFile(vscode.Uri.file(esp32PmFilePath))).toString().includes(constantBounder + boundedConstants[ind] + constantBounder)) {
                    throw Error(constantValuesUnsolved);
                }
            }
        }

        // Check if each characteristic folder exists.
        for (let index = 0; index < esp32PmFolders.length; index++) {
            const esp32PmFolderPath: string = join(projectPath, esp32PmFolders[index]);
            if (!await folderExists(esp32PmFolderPath)) {
                throw Error(isNotEsp32PmProjectMessage);
            }
        }
    } catch (error) {
        throw error;
    }
}

export async function getWorkspacePath(validationType: ValidationType): Promise<string> {
    try {
        // Check if there are no workspace folders.
        if (vscode.workspace.workspaceFolders === undefined) {
            throw Error('There is no available workspace.');
        }

        // Get the workspace path.
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;

        // Validate if necessary.
        switch (validationType) {
            case ValidationType.ESPRESSIF_PROJ:
                await validateEspressifProject(workspacePath);
                break;
            case ValidationType.ESP32_PM_PROJ:
                await validateEsp32PmProject(workspacePath);
                break;
            default:
                break;
        }

        // Return the workspace path.
        return workspacePath;
    } catch (error) {
        throw error;
    }
}