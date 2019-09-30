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

import {
    join
} from "path";

import * as vscode from 'vscode';

import {
    toolchainFolders,
    idfFolders,
    extensionValuesFile,
    colonToolchainPath,
    colonIdfPath,
    vscSettingsTemplateFile,
    vscCCppPropsTemplateFile,
    vscSettingsFile,
    menuconfigBashPath,
    vscCCppPropsFile
} from "./constants";
import {
    fileExists,
    filterExistingFolders,
    folderExists
} from "./utils";

export interface Paths {
    toolchainPaths: Array<string>;
    idfPaths: Array<string>;
}

export enum PathType {
    TOOLCHAIN = 0,
    IDF = 1,
}

export class PathsManager {

    private static toPaths(json: string): Paths {
        // Parse string to Paths.
        const tempPaths: Paths = JSON.parse(json);

        // If the toolchainPaths is not defined, assign an emptyarray.
        if (tempPaths.toolchainPaths === undefined) {
            tempPaths.toolchainPaths = [];
        }

        // If the idfPaths is not defined, assign an emptyarray.
        if (tempPaths.idfPaths === undefined) {
            tempPaths.idfPaths = [];
        }

        // return the parsed Paths.
        return tempPaths;
    }

    private static pathsToJson(value: Paths): string {
        // Convert Paths to string.
        return JSON.stringify(value);
    }

    private static async setValues(context: vscode.ExtensionContext, values: Paths): Promise<void> {
        // Write the Paths to the extension values file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(context.asAbsolutePath(extensionValuesFile)),
            Buffer.from(this.pathsToJson(values))
        );
    }

    public static async getValues(context: vscode.ExtensionContext): Promise<Paths> {
        // Get the registered paths from the extension values file.
        const paths: Paths = this.toPaths(
            (await fileExists(context.asAbsolutePath(extensionValuesFile)))
                ? (await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath(extensionValuesFile)))).toString()
                : '{}');

        // Filter only the existing toolchain folders.
        paths.toolchainPaths = await filterExistingFolders(paths.toolchainPaths);

        // Filter only the existing ESP-IDF folders.
        paths.idfPaths = await filterExistingFolders(paths.idfPaths);

        // Update the paths stored in the extension values file.
        await this.setValues(context, paths);

        // Return the resulting existing paths.
        return paths;
    }

    private static async pathIsRegistered(context: vscode.ExtensionContext, path: string, type: PathType): Promise<boolean> {

        // Get the existing paths.
        const paths = await this.getValues(context);

        // Select the paths of interest.
        var pathsArray: string[] = [];
        switch (type) {
            case PathType.TOOLCHAIN: {
                pathsArray = paths.toolchainPaths;
                break;
            }
            case PathType.IDF: {
                pathsArray = paths.idfPaths;
                break;
            }
        }

        // Check if the passed path is already registered.
        const value = pathsArray.find((pathElement) => {
            return (pathElement === path);
        });

        // If the value is undefined, the path is not registered.
        if (value === undefined) {
            return false;
        }
        // Else, the path is already registered.
        else {
            return true;
        }
    }

    // private static async removeRegister(context: vscode.ExtensionContext, path: string, type: PathType) {
    //     const values = await this.getValues(context);
    //     switch (type) {
    //         case PathType.TOOLCHAIN: {
    //             values.toolchainPaths.splice(values.toolchainPaths.indexOf(path, type), 1);
    //             break;
    //         }
    //         case PathType.IDF: {
    //             values.idfPaths.splice(values.idfPaths.indexOf(path), 1);
    //             break;
    //         }
    //     }
    //     await this.setValues(context, values);
    // }

    private static async addRegister(context: vscode.ExtensionContext, path: string, type: PathType) {
        // Get the existing paths.
        const values = await this.getValues(context);

        // Add the passed path to the paths of interest.
        switch (type) {
            case PathType.TOOLCHAIN: {
                values.toolchainPaths.push(path);
                break;
            }
            case PathType.IDF: {
                values.idfPaths.push(path);
                break;
            }
        }

        // Update the paths stored in the extension values file.
        await this.setValues(context, values);
    }

    public static async registerPath(context: vscode.ExtensionContext, pathType: PathType) {

        // Variables
        var referencialName: string = '';
        var neededFolders: Array<string> = [];

        // Set the referencial name of the path to be registered.
        // Set the characteristic folders contained for the path type of interest.
        switch (pathType) {
            case PathType.TOOLCHAIN: {
                referencialName = "Espressif Toolchain";
                neededFolders = toolchainFolders;
                break;
            }
            case PathType.IDF: {
                referencialName = "ESP-IDF API";
                neededFolders = idfFolders;
                break;
            }
        }

        // The user must select the location of the folder.
        const selectedElement = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "Select a " + referencialName + " folder"
        });
        if (selectedElement === undefined) {
            vscode.window.showErrorMessage("" + referencialName + " folder not selected");
            return;
        }

        // Get the path of the selected folder.
        const elementApsolutePath: string = join(selectedElement[0].fsPath).replace(/\\/gi, '/');

        // Check if the folder is valid.
        const folderIsValid: boolean = !neededFolders.some(async (neededFolder) => {
            return (!await folderExists(join(elementApsolutePath, neededFolder)));
        });
        if (folderIsValid) {
            vscode.window.showErrorMessage("Invalid " + referencialName + " folder.");
            return;
        }

        // The folder path must not include empty spaces.
        if (elementApsolutePath.includes(" ")) {
            vscode.window.showErrorMessage("The " + referencialName + " path should not include spaces.");
            return;
        }

        // If the path is already registered, notify the user.
        if (await PathsManager.pathIsRegistered(context, elementApsolutePath, pathType)) {
            vscode.window.showWarningMessage("The provided " + referencialName + " path was already registered.");
            return;
        }

        // Register the selected path.
        await PathsManager.addRegister(context, elementApsolutePath, pathType);

        // Notify the user.
        await vscode.window.showInformationMessage(referencialName + ' path registered.');
    }

    public static async setConfiguration(context: vscode.ExtensionContext, toolchainPath: string, idfPath: string, projectPath: string) {
        // Get the VSC settings template content.
        var vscSettings: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath(vscSettingsTemplateFile)))).toString();

        // Replace the :<CONSTANTS>: values in the template.
        vscSettings = vscSettings.replace(RegExp(':' + colonToolchainPath + ':', 'gi'), toolchainPath);
        vscSettings = vscSettings.replace(RegExp(':' + colonIdfPath + ':', 'gi'), idfPath);

        // Write the refactored content in a final VSC settings file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, vscSettingsFile)),
            Buffer.from(vscSettings)
        );

        // Get the VSC C/C++ properties template content.
        var vscCCppProperties: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath(vscCCppPropsTemplateFile)))).toString();

        // Replace the :<CONSTANTS>: values in the template.
        vscCCppProperties = vscCCppProperties.replace(RegExp(':' + colonToolchainPath + ':', 'gi'), toolchainPath);
        vscCCppProperties = vscCCppProperties.replace(RegExp(':' + colonIdfPath + ':', 'gi'), idfPath);

        // Write the refactored content in a final VSC settings file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, vscCCppPropsFile)),
            Buffer.from(vscCCppProperties)
        );

        // Content of the Menuconfig bash.
        const menuconfigContent: string =
            'echo "ESP32-PM: Launching graphical config menu..."' + '\n' +
            'set CHERE_INVOKING=1' + '\n' +
            'start ' + toolchainPath + '/mingw32.exe make menuconfig';

        // Write the content of the Menuconfig file in its file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, menuconfigBashPath)),
            Buffer.from(menuconfigContent)
        );
    }
}
