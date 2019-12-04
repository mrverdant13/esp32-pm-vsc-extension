import * as vscode from 'vscode';

import * as FileUtils from '../utils/file';
import * as PathUtils from '../utils/path';
import * as SysItemUtils from '../utils/sys-item';
import * as ValidationUtils from '../utils/validation';
import * as VscUtils from '../utils/vsc';

import { ExtensionPaths } from '../extension/paths';

import { ProjectAssets } from '../project/assets';
import { Interface } from 'readline';

enum ProjectConfig {
    VscSettings,
    VscCCppProps,
}

export abstract class Resource {
    protected constructor() { }

    // TODO: Check 'field' initialization.
    // Resource field.
    protected static readonly field: string = '';

    // TODO: Check 'label' initialization.
    // Resource label.
    protected static readonly label: string = '';

    // Mandatory files.
    protected static readonly MandatoryFiles: Array<string> = [];

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [];

    // Mutually exclusive files group.
    protected static readonly MutuallyExclusiveFilesGroup: Array<Array<string>> = [];

    // Mutually exclusive folders group.
    protected static readonly MutuallyExclusiveFoldersGroup: Array<Array<string>> = [];

    // Resource validation method.
    protected static async isValidResourceFolder(resourceAbsolutePath: string): Promise<boolean> {
        try {
            // Prefix characteristic content elements with the provided resource absolute path.
            const mandatoryFiles: Array<string> =
                PathUtils.prefixPaths(resourceAbsolutePath, this.MandatoryFiles);
            const mandatoryFolders: Array<string> =
                PathUtils.prefixPaths(resourceAbsolutePath, this.MandatoryFolders);
            const mutuallyExclusiveFilesGroup: Array<Array<string>> =
                this.MutuallyExclusiveFilesGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(resourceAbsolutePath, files));
            const mutuallyExclusiveFoldersGroup: Array<Array<string>> =
                this.MutuallyExclusiveFoldersGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(resourceAbsolutePath, files));

            // Check if the provided path corresponds to a valid resource according to its content elements.
            return await ValidationUtils.isValidFolder(
                mandatoryFiles, mandatoryFolders,
                mutuallyExclusiveFilesGroup, mutuallyExclusiveFoldersGroup
            );
        } catch (error) { throw error; }
    }

    // One level settings (JSON).
    protected static readonly OneLevelSettings: Array<[string, Array<string>]> = [];

    // Two level settings (JSON).
    protected static readonly TwoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [];

    protected static async registerResource(context: vscode.ExtensionContext): Promise<void> {
        try {
            // The user must select the location of the folder.
            const selectedElementAbsolutePath: string = (await VscUtils.pickFolder(
                "Select a " + this.label + " folder",
                this.label + " folder not selected")
            );

            // Check if the provided path corresponds to a valid resource.
            if (!await this.isValidResourceFolder(selectedElementAbsolutePath)) {
                throw Error("The selected folder does not correspond to a " + this.label + " one.");
            }

            // The folder path must not include empty spaces.
            if (selectedElementAbsolutePath.includes(" ")) {
                throw Error("The " + this.label + " path should not include spaces.");
            }

            // Register resource in the project C/C++ properties.
            await this.registerResourceInWorkspaceCCppProps(context, selectedElementAbsolutePath);

            // Register resource in the project C/C++ properties.
            await this.registerResourceInWorkspaceSettings(context, selectedElementAbsolutePath);

            // Reload window.
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
        } catch (error) { throw error; }
    }

    protected static getConfigFileNames(config: ProjectConfig): [string, string] {
        // Set config files.
        var projConfigFile: string = '';
        var projConfigTemplate: string = '';
        switch (config) {
            case ProjectConfig.VscCCppProps: {
                projConfigFile = ProjectAssets.VscCCppPropsFile;
                projConfigTemplate = ExtensionPaths.VscCCppPropsFile;
                break;
            }
            case ProjectConfig.VscSettings: {
                projConfigFile = ProjectAssets.VscSettingsFile;
                projConfigTemplate = ExtensionPaths.VscSettingsFile;
                break;
            }
        }
        return [projConfigFile, projConfigTemplate];
    }

    protected static async getProjectConfigContent(context: vscode.ExtensionContext, config: ProjectConfig) {
        try {
            // Get the project path.
            const projectPath: string = VscUtils.getWorkspacePath();

            // Return the project config object.
            return JSON.parse(
                (await SysItemUtils.fileExists(PathUtils.joinPaths(projectPath, this.getConfigFileNames(config)[0])))
                    ? (await FileUtils.readFile(PathUtils.joinPaths(projectPath, this.getConfigFileNames(config)[0])))
                    : (await FileUtils.readFile(context.asAbsolutePath(this.getConfigFileNames(config)[1])))
            );
        } catch (error) { throw error; }
    }

    protected static async setProjectConfigContent(config: ProjectConfig, configContent: any) {
        try {
            // Get the project path.
            const projectPath: string = VscUtils.getWorkspacePath();

            // Update the project config file.
            await FileUtils.writeFile(
                PathUtils.joinPaths(projectPath, this.getConfigFileNames(config)[0]),
                JSON.stringify(configContent, undefined, '\t')
            );
        } catch (error) { throw error; }
    }

    protected static async registerResourceInWorkspaceSettings(context: vscode.ExtensionContext, resourceAbsolutePath: string) {
        try {
            // Get content from the project settings file.
            let configContent = await this.getProjectConfigContent(context, ProjectConfig.VscSettings);

            // Set the necessary paths.
            this.OneLevelSettings.forEach((field: [string, Array<string>]) => {
                configContent[field[0]] = field[1].join(resourceAbsolutePath);
            });
            this.TwoLevelSettings.forEach((field: [string, Array<[string, Array<string>]>]) => {
                field[1].forEach((subfield: [string, Array<string>]) => {
                    configContent[field[0]][subfield[0]] = subfield[1].join(resourceAbsolutePath);
                });
            });

            // Update the project settings file content.
            await this.setProjectConfigContent(ProjectConfig.VscSettings, configContent);
        } catch (error) { throw error; }
    }

    protected static async registerResourceInWorkspaceCCppProps(context: vscode.ExtensionContext, resourceAbsolutePath: string) {
        try {
            // Get content from the project C/C++ properties file.
            let configContent = await this.getProjectConfigContent(context, ProjectConfig.VscCCppProps);

            // Set the resource field.
            configContent.env[this.field] = resourceAbsolutePath;

            // Update the project C/C++ properties file content.
            await this.setProjectConfigContent(ProjectConfig.VscCCppProps, configContent);
        } catch (error) { throw error; }
    }

    protected static async isRegisteredAndValid(context: vscode.ExtensionContext): Promise<boolean> {
        try {
            // Get content from the project C/C++ properties file.
            let configContent = await this.getProjectConfigContent(context, ProjectConfig.VscCCppProps);

            // Check if the resource field is in use.
            if (configContent.env[this.field] === undefined) {
                return false;
            }

            // Check if the provided path corresponds to a valid resource.
            if (!await this.isValidResourceFolder(configContent.env[this.field])) {
                return false;
            }

            // Update the project settings file.
            await this.registerResourceInWorkspaceSettings(context, configContent.env[this.field]);
            return true;
        } catch (error) { throw error; }
    }
}