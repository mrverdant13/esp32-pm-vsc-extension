/*
Copyright (c) 2019 Karlo Fabio Verde Salvatierra

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as vscode from 'vscode';

import * as Esp32PmProjectConsts from "../constants/esp32pm-project";
import * as EspressifProjectConsts from "../constants/espressif-project";
import * as ExtensionConsts from "../constants/extension-const";
import * as IdfConsts from "../constants/idf";
import * as Msys32Consts from "../constants/msys32";
import * as XtensaConsts from "../constants/xtensa";
import {
    writeFile,
    fileExists,
    readFile,
    folderExists,
    pickFolder,
} from "../utils";
import {
    joinPaths,
} from "../joiner";

// Project path type.
export enum ProjectPathType {
    IDF_PATH = 0,
    MSYS32_PATH = 1,
    XTENSA_PATH = 2,
}

// Project validation type.
export enum ProjectValidationType {
    NONE = 0,
    ESP32PM_PROJ = 1,
    ESPRESSIF_PROJ = 2,
}

export class Project {

    public static async getWorkspacePath(validationType: ProjectValidationType): Promise<string> {
        try {
            // Check if there are no workspace folders.
            if (vscode.workspace.workspaceFolders === undefined) {
                throw Error('There is no available workspace.');
            }

            // Get the workspace path.
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;

            // Validate if necessary.
            switch (validationType) {
                case ProjectValidationType.ESP32PM_PROJ:
                    await Project.validateProject(ProjectValidationType.ESPRESSIF_PROJ, workspacePath);
                    await Project.validateProject(ProjectValidationType.ESP32PM_PROJ, workspacePath);
                    break;
                case ProjectValidationType.ESPRESSIF_PROJ:
                    await Project.validateProject(ProjectValidationType.ESPRESSIF_PROJ, workspacePath);
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

    public static async validateProject(validationType: ProjectValidationType, projectPath: string = ''): Promise<void> {
        const errorMessage: string = 'The selected folder does not contain an ' +
            (validationType === ProjectValidationType.ESP32PM_PROJ ? 'ESP32-PM' : 'Espressif') +
            ' project.';

        try {
            // If the project path is not passed, use the workspace one.
            if (projectPath.length === 0) {
                projectPath = await Project.getWorkspacePath(ProjectValidationType.NONE);
            }

            // Select the files and folders to be used for validation.
            var projectFolders: Array<string> = [];
            var projectFiles: Array<string> = [];
            switch (validationType) {
                case ProjectValidationType.ESP32PM_PROJ: {
                    projectFolders = Esp32PmProjectConsts.Paths.Folders;
                    projectFiles = Esp32PmProjectConsts.Paths.Files;
                    break;
                }
                case ProjectValidationType.ESPRESSIF_PROJ: {
                    projectFolders = EspressifProjectConsts.Paths.Folders;
                    projectFiles = EspressifProjectConsts.Paths.Files;
                    break;
                }
                default: {
                    break;
                }
            }

            // Check if each characteristic file exists.
            for (let index = 0; index < projectFiles.length; index++) {
                const projectFile: string = joinPaths(projectPath, projectFiles[index]);
                if (!await fileExists(projectFile)) {
                    throw Error(errorMessage);
                }
            }

            // Check if each characteristic folder exists.
            for (let index = 0; index < projectFolders.length; index++) {
                const projectFolder: string = joinPaths(projectPath, projectFolders[index]);
                if (!await folderExists(projectFolder)) {
                    throw Error(errorMessage);
                }
            }
        } catch (error) {
            throw error;
        }
    }

    public static async setProjectResourcePath(context: vscode.ExtensionContext, pathType: ProjectPathType): Promise<void> {
        try {
            // Variables
            var pathLabel: string = '';
            var neededFolders: Array<string> = [];

            // Set the label of the path to be registered.
            // Set the characteristic folders for the path type of interest.
            switch (pathType) {
                case ProjectPathType.IDF_PATH: {
                    pathLabel = "ESP-IDF API";
                    neededFolders = IdfConsts.Paths.Folders;
                    break;
                }
                case ProjectPathType.MSYS32_PATH: {
                    pathLabel = "'msys32'";
                    neededFolders = Msys32Consts.Paths.Folders;
                    break;
                }
                case ProjectPathType.XTENSA_PATH: {
                    pathLabel = "'xtensa-esp32-elf'";
                    neededFolders = XtensaConsts.Paths.Folders;
                    break;
                }
            }

            // The user must select the location of the folder.
            const selectedElementAbsolutePath: string = (await pickFolder(
                "Select a " + pathLabel + " folder",
                pathLabel + " folder not selected")
            );

            // Check if the folder is valid.
            for (let index = 0; index < neededFolders.length; index++) {
                if (!await folderExists(joinPaths(selectedElementAbsolutePath, neededFolders[index]))) {
                    throw Error("Invalid " + pathLabel + " folder.");
                }
            }

            // The folder path must not include empty spaces.
            if (selectedElementAbsolutePath.includes(" ")) {
                throw Error("The " + pathLabel + " path should not include spaces.");
            }

            // Set the folder for the project.
            {
                var oneLevelSettings: Array<[string, Array<string>]> = [];
                var twoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [];

                // Get the project path.
                const projectPath: string = await Project.getWorkspacePath(ProjectValidationType.ESPRESSIF_PROJ);

                // Read the 'c_cpp_properties.json' file.
                let configContent = JSON.parse(
                    (await fileExists(joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscCCppPropsFile)))
                        ? (await readFile(joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscCCppPropsFile)))
                        : (await readFile(context.asAbsolutePath(ExtensionConsts.Paths.VscCCppPropsFile)))
                );

                // Set usage paths.
                switch (pathType) {
                    case ProjectPathType.IDF_PATH: {
                        configContent['env']['IDF_PATH'] = selectedElementAbsolutePath;
                        oneLevelSettings = IdfConsts.OneLevelSettings;
                        twoLevelSettings = IdfConsts.TwoLevelSettings;
                        break;
                    }
                    case ProjectPathType.MSYS32_PATH: {
                        configContent['env']['MSYS32_PATH'] = selectedElementAbsolutePath;
                        oneLevelSettings = Msys32Consts.OneLevelSettings;
                        twoLevelSettings = Msys32Consts.TwoLevelSettings;
                        break;
                    }
                    case ProjectPathType.XTENSA_PATH: {
                        configContent['env']['XTENSA_PATH'] = selectedElementAbsolutePath;
                        oneLevelSettings = XtensaConsts.OneLevelSettings;
                        twoLevelSettings = XtensaConsts.TwoLevelSettings;
                        break;
                    }
                }

                // Update the 'c_cpp_properties.json' file.
                await writeFile(
                    joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscCCppPropsFile),
                    JSON.stringify(configContent, undefined, '\t')
                );

                // Update config files.
                {
                    // Read the 'settings.json' file.
                    let configContent = JSON.parse(
                        (await fileExists(joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscSettingsFile)))
                            ? (await readFile(joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscSettingsFile)))
                            : (await readFile(context.asAbsolutePath(ExtensionConsts.Paths.VscSettingsFile)))
                    );

                    // Set the necessary paths.
                    oneLevelSettings.forEach((field: [string, Array<string>]) => {
                        configContent[field[0]] = field[1].join(selectedElementAbsolutePath);
                    });
                    twoLevelSettings.forEach((field: [string, Array<[string, Array<string>]>]) => {
                        field[1].forEach((subfield: [string, Array<string>]) => {
                            configContent[field[0]][subfield[0]] = subfield[1].join(selectedElementAbsolutePath);
                        });
                    });

                    // Update the 'settings.json' file.
                    await writeFile(
                        joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscSettingsFile),
                        JSON.stringify(configContent, undefined, '\t')
                    );

                }
            }
            
            // Reload window.
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
        } catch (error) {
            throw error;
        }
    }
}
