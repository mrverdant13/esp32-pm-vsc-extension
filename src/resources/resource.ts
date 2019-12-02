import * as vscode from 'vscode';

import * as FileUtils from '../utils/file';
import * as PathUtils from '../utils/path';
import * as SysItemUtils from '../utils/sys-item';
import * as ValidationUtils from '../utils/validation';
import * as VscUtils from '../utils/vsc';

import { ExtensionPaths } from '../extension/paths';

import { ProjectAssets } from '../project/assets';

// interface ResourceSettings {
//     label: string;
//     field: string;
//     vscSettings: Object;
// }

export abstract class Resource {
    protected constructor() { }

    // Mandatory files.
    protected static readonly MandatoryFiles: Array<string> = [];

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [];

    // Mutually exclusive files group.
    protected static readonly MutuallyExclusiveFilesGroup: Array<Array<string>> = [];

    // Mutually exclusive folders group.
    protected static readonly MutuallyExclusiveFoldersGroup: Array<Array<string>> = [];

    // Validation method.
    protected static async isValidResourceFolder(resourceAbsolutePath: string): Promise<boolean> {
        try {
            const mandatoryFiles: Array<string> =
                PathUtils.prefixPaths(resourceAbsolutePath, this.MandatoryFiles);
            const mandatoryFolders: Array<string> =
                PathUtils.prefixPaths(resourceAbsolutePath, this.MandatoryFolders);

            const mutuallyExclusiveFilesGroup: Array<Array<string>> =
                this.MutuallyExclusiveFilesGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(resourceAbsolutePath, files));
            const mutuallyExclusiveFoldersGroup: Array<Array<string>> =
                this.MutuallyExclusiveFoldersGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(resourceAbsolutePath, files));

            return await ValidationUtils.isValidFolder(
                mandatoryFiles, mandatoryFolders,
                mutuallyExclusiveFilesGroup, mutuallyExclusiveFoldersGroup
            );
        } catch (error) { throw error; }
    }

    protected static readonly OneLevelSettings: Array<[string, Array<string>]> = [];

    protected static readonly TwoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [];

    protected static async registerResource(context: vscode.ExtensionContext, label: string, field: string): Promise<void> {
        try {
            // The user must select the location of the folder.
            const selectedElementAbsolutePath: string = (await VscUtils.pickFolder(
                "Select a " + label + " folder",
                label + " folder not selected")
            );

            if (!await this.isValidResourceFolder(selectedElementAbsolutePath)) {
                throw Error("The selected folder does not correspond to a " + label + " one.");
            }

            // The folder path must not include empty spaces.
            if (selectedElementAbsolutePath.includes(" ")) {
                throw Error("The " + label + " path should not include spaces.");
            }

            // Set the folder for the project.
            {
                // Get the project path.
                const projectPath: string = VscUtils.getWorkspacePath();

                // Read the 'c_cpp_properties.json' file.
                let configContent = JSON.parse(
                    (await SysItemUtils.fileExists(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
                        ? (await FileUtils.readFile(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
                        : (await FileUtils.readFile(context.asAbsolutePath(ExtensionPaths.VscCCppPropsFile)))
                );

                configContent.env[field] = selectedElementAbsolutePath;

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
                    this.OneLevelSettings.forEach((field: [string, Array<string>]) => {
                        configContent[field[0]] = field[1].join(selectedElementAbsolutePath);
                    });
                    this.TwoLevelSettings.forEach((field: [string, Array<[string, Array<string>]>]) => {
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

    protected static async isRegisteredAndValid(context: vscode.ExtensionContext, field: string): Promise<boolean> {
        try {
            const projectPath: string = VscUtils.getWorkspacePath();

            let configContent = JSON.parse(
                (await SysItemUtils.fileExists(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
                    ? (await FileUtils.readFile(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
                    : (await FileUtils.readFile(context.asAbsolutePath(ExtensionPaths.VscCCppPropsFile)))
            );

            if (configContent.env[field] === undefined) {
                return false;
            }

            if (!await this.isValidResourceFolder(configContent.env[field])) {
                return false;
            }

            return true;
        } catch (error) { throw error; }
    }
}