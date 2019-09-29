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

import { join } from "path";

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
        const tempPaths: Paths = JSON.parse(json);
        if (tempPaths.toolchainPaths === undefined) {
            tempPaths.toolchainPaths = [];
        }
        if (tempPaths.idfPaths === undefined) {
            tempPaths.idfPaths = [];
        }
        return tempPaths;
    }

    private static pathsToJson(value: Paths): string {
        return JSON.stringify(value);
    }

    private static async setValues(context: vscode.ExtensionContext, values: Paths): Promise<void> {
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(context.extensionPath, extensionValuesFile)),
            Buffer.from(this.pathsToJson(values))
        );
    }

    public static async getValues(context: vscode.ExtensionContext): Promise<Paths> {
        const paths: Paths = this.toPaths(
            (await fileExists(join(context.extensionPath, extensionValuesFile)))
                ? (await vscode.workspace.fs.readFile(vscode.Uri.file(join(context.extensionPath, extensionValuesFile)))).toString()
                : '{}');
        paths.toolchainPaths = await filterExistingFolders(paths.toolchainPaths);
        paths.idfPaths = await filterExistingFolders(paths.idfPaths);
        await this.setValues(context, paths);
        return paths;
    }

    private static async pathIsRegistered(context: vscode.ExtensionContext, path: string, type: PathType): Promise<boolean> {
        const paths = await this.getValues(context);
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
        const value = pathsArray.find((pathElement) => {
            return (pathElement === path);
        });
        if (value === undefined) {
            return false;
        }
        else {
            return true;
        }
    }

    private static async removeRegister(context: vscode.ExtensionContext, path: string, type: PathType) {
        const values = await this.getValues(context);
        switch (type) {
            case PathType.TOOLCHAIN: {
                values.toolchainPaths.splice(values.toolchainPaths.indexOf(path, type), 1);
                break;
            }
            case PathType.IDF: {
                values.idfPaths.splice(values.idfPaths.indexOf(path), 1);
                break;
            }
        }
        await this.setValues(context, values);
    }

    private static async addRegister(context: vscode.ExtensionContext, path: string, type: PathType) {
        const values = await this.getValues(context);
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
        await this.setValues(context, values);
    }

    public static async registerPath(context: vscode.ExtensionContext, pathType: PathType) {

        // Variables
        var referencialName: string = '';
        var neededFolders: Array<string> = [];

        // Set the referencial name of the path to be registered.
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
        const elementApsolutePath: string = join(selectedElement[0].fsPath);

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
        toolchainPath = toolchainPath.replace(/\\/gi, '/');
        idfPath = idfPath.replace(/\\/gi, '/');
        var vscSettings: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(context.extensionPath, vscSettingsTemplateFile)))).toString();
        vscSettings = vscSettings.replace(RegExp(':' + colonToolchainPath + ':', 'gi'), toolchainPath);
        vscSettings = vscSettings.replace(RegExp(':' + colonIdfPath + ':', 'gi'), idfPath);
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, vscSettingsFile)),
            Buffer.from(vscSettings)
        );
        var vscCCppProperties: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(context.extensionPath, vscCCppPropsTemplateFile)))).toString();
        vscCCppProperties = vscCCppProperties.replace(RegExp(':' + colonToolchainPath + ':', 'gi'), toolchainPath);
        vscCCppProperties = vscCCppProperties.replace(RegExp(':' + colonIdfPath + ':', 'gi'), idfPath);
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, vscCCppPropsFile)),
            Buffer.from(vscCCppProperties)
        );
        const menuconfigContent: string =
            'echo "ESP32-PM: Launching graphical config menu..."' + '\n' +
            'set CHERE_INVOKING=1' + '\n' +
            'start ' + toolchainPath + '/mingw32.exe make menuconfig';
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, menuconfigBashPath)),
            Buffer.from(menuconfigContent)
        );
    }
}
