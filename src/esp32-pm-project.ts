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
    overwritingFiles,
    overwritingSuffix,
    subprojectsFolder,
    projectTemplatePath,
    boundedProjectName,
    boundedConstant,
} from "./constants";
import {
    fileExists,
    folderExists,
    pickElement,
    copyFile,
    replaceInFile,
} from "./utils";
import {
    Values,
    ValuesManager,
} from "./values-manager";

export enum ValidationType {
    NONE = 0,
    ESPRESSIF_PROJ = 1,
    ESP32_PM_PROJ = 2,
}

export enum SetupType {
    CREATION = 0,
    INITIALIZATION = 1,
}

export async function setupProject(projectPath: string, context: vscode.ExtensionContext, setupType: SetupType, opts: undefined | { projectName: undefined | string }): Promise<void> {
    try {
        // Ask the user which Espressif Toolchain and ESP-IDF API are going to be used with the project.
        const paths: Values = await ValuesManager.getValues(context);
        const toolchainPath = await pickElement(
            paths.toolchainPaths,
            'Select an Espressif Toolchain to be used with the project.',
            'Espressif Toolchain not selected.',
        );
        const idfPath = await pickElement(
            paths.idfPaths,
            'Select an ESP-IDF API to be used with the project.',
            'ESP-IDF API not selected.',
        );

        // Ask the user if the existing project should be launched in the current window or in a new one.
        const windowAction = await pickElement(
            ["Open in new window", "Open in current window"],
            'Select the window to be used with the new project.',
            'Process cancelled.',
        );

        switch (setupType) {
            case SetupType.CREATION:
                // Copy the project template.
                await copyFile(
                    context.asAbsolutePath(projectTemplatePath),
                    projectPath,
                );

                // Set the project name in the Makefile
                await replaceInFile(
                    join(projectPath, 'Makefile'),
                    RegExp(boundedConstant(boundedProjectName), 'gi'),
                    opts['projectName'],
                );


                break;
            case SetupType.INITIALIZATION:
                // Apply sufix.
                for (let index = 0; index < overwritingFiles.length; index++) {
                    const filePath: string = join(projectPath, overwritingFiles[index]);
                    if (await fileExists(filePath)) {
                        await vscode.workspace.fs.rename(vscode.Uri.file(filePath), vscode.Uri.file(filePath + overwritingSuffix), { overwrite: true });
                    }
                }

                // Copy the sub-project examples if the sub-projects folder does not exist.
                if (!await folderExists(join(projectPath, subprojectsFolder))) {
                    await copyFile(
                        context.asAbsolutePath(projectTemplatePath + subprojectsFolder),
                        join(projectPath, subprojectsFolder),
                    );
                }
                break;
        }


        // Use the selected MinGW32 terminal and ESP-IDF API
        await ValuesManager.setConfiguration(context, toolchainPath, idfPath, existingProjectPath);

        // Launch the new project according to the user election.
        await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(existingProjectPath), windowAction.includes("new"));
    } catch (error) {
        throw error;
    }
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