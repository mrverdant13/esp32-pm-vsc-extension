import * as vscode from 'vscode';

import * as FileUtils from '../utils/file';
import * as PathUtils from '../utils/path';
import * as SysItemUtils from '../utils/sys-item';
import * as VscUtils from '../utils/vsc';

import { ExtensionPaths } from '../extension/paths';

import { ProjectAssets } from '../project/assets';

import { Idf } from './idf';
import { Msys32 } from './msys32';
import { Xtensa } from './xtensa';

// Project path type.
export enum ProjectResource {
    IDF_PATH,
    MSYS32_PATH,
    XTENSA_PATH,
}

export async function setProjectResourcePath(context: vscode.ExtensionContext, pathType: ProjectResource): Promise<void> {
    try {
        const labelMap: Map<ProjectResource, string> = new Map([
            [ProjectResource.IDF_PATH, "ESP-IDF API"],
            [ProjectResource.MSYS32_PATH, "'msys32'"],
            [ProjectResource.XTENSA_PATH, "'xtensa-esp32-elf'"],
        ]);

        // The user must select the location of the folder.
        const selectedElementAbsolutePath: string = (await VscUtils.pickFolder(
            "Select a " + labelMap.get(pathType) + " folder",
            labelMap.get(pathType) + " folder not selected")
        );

        // The folder path must not include empty spaces.
        if (selectedElementAbsolutePath.includes(" ")) {
            throw Error("The " + labelMap.get(pathType) + " path should not include spaces.");
        }

        switch (pathType) {
            case ProjectResource.IDF_PATH: {
                await Idf.validate(selectedElementAbsolutePath);
                break;
            }
            case ProjectResource.MSYS32_PATH: {
                await Msys32.validate(selectedElementAbsolutePath);
                break;
            }
            case ProjectResource.XTENSA_PATH: {
                await Xtensa.validate(selectedElementAbsolutePath);
                break;
            }
        }

        // Set the folder for the project.
        {
            var oneLevelSettings: Array<[string, Array<string>]> = [];
            var twoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [];

            // Get the project path.
            const projectPath: string = PathUtils.joinPaths(VscUtils.getWorkspacePath());

            // Read the 'c_cpp_properties.json' file.
            let configContent = JSON.parse(
                (await SysItemUtils.fileExists(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
                    ? (await FileUtils.readFile(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
                    : (await FileUtils.readFile(context.asAbsolutePath(ExtensionPaths.VscCCppPropsFile)))
            );

            // Set usage paths.
            switch (pathType) {
                case ProjectResource.IDF_PATH: {
                    configContent['env']['IDF_PATH'] = selectedElementAbsolutePath;
                    oneLevelSettings = Idf.OneLevelSettings;
                    twoLevelSettings = Idf.TwoLevelSettings;
                    break;
                }
                case ProjectResource.MSYS32_PATH: {
                    configContent['env']['MSYS32_PATH'] = selectedElementAbsolutePath;
                    oneLevelSettings = Msys32.OneLevelSettings;
                    twoLevelSettings = Msys32.TwoLevelSettings;
                    break;
                }
                case ProjectResource.XTENSA_PATH: {
                    configContent['env']['XTENSA_PATH'] = selectedElementAbsolutePath;
                    oneLevelSettings = Xtensa.OneLevelSettings;
                    twoLevelSettings = Xtensa.TwoLevelSettings;
                    break;
                }
            }

            // Update the 'c_cpp_properties.json' file.
            await FileUtils.writeFile(
                PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile),
                JSON.stringify(configContent, undefined, '\t')
            );

            // Update config files.
            {
                // Read the 'settings.json' file.
                let configContent = JSON.parse(
                    (await SysItemUtils.fileExists(PathUtils.joinPaths(projectPath, ProjectAssets.VscSettingsFile)))
                        ? (await FileUtils.readFile(PathUtils.joinPaths(projectPath, ProjectAssets.VscSettingsFile)))
                        : (await FileUtils.readFile(context.asAbsolutePath(ExtensionPaths.VscSettingsFile)))
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
                await FileUtils.writeFile(
                    PathUtils.joinPaths(projectPath, ProjectAssets.VscSettingsFile),
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
