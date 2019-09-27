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

import { fileExists, filterExistingPaths, folderExists } from "./utils";

const relativeValuesPath: string = 'assets/local-data/values.json';

export interface Paths {
    msys32Paths: string[];
    idfPaths: string[];
}

export enum PathType {
    MSYS32 = 0,
    IDF = 1,
}

export class PathsManager {

    private static toPaths(json: string): Paths {
        var tempPaths: Paths = JSON.parse(json);
        if (tempPaths.msys32Paths === undefined) { tempPaths.msys32Paths = []; }
        if (tempPaths.idfPaths === undefined) { tempPaths.idfPaths = []; }
        return tempPaths;
    }

    private static pathsToJson(value: Paths): string {
        return JSON.stringify(value);
    }

    private static async setValues(context: vscode.ExtensionContext, values: Paths): Promise<void> {
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(context.extensionPath, relativeValuesPath)),
            Buffer.from(this.pathsToJson(values))
        );
    }

    public static async getValues(context: vscode.ExtensionContext): Promise<Paths> {
        var paths: Paths = this.toPaths(
            (await fileExists(join(context.extensionPath, relativeValuesPath)))
                ? (await vscode.workspace.fs.readFile(vscode.Uri.file(join(context.extensionPath, relativeValuesPath)))).toString()
                : '{}');
        paths.msys32Paths = await filterExistingPaths(paths.msys32Paths);
        paths.idfPaths = await filterExistingPaths(paths.idfPaths);
        await this.setValues(context, paths);
        return paths;
    }

    private static async pathIsRegistered(context: vscode.ExtensionContext, path: string, type: PathType): Promise<boolean> {
        const paths = await this.getValues(context);
        var pathsArray: string[] = [];
        switch (type) {
            case PathType.MSYS32: {
                pathsArray = paths.msys32Paths;
                break;
            }
            case PathType.IDF: {
                pathsArray = paths.idfPaths;
                break;
            }
        }
        var value = pathsArray.find((pathElement) => {
            return (pathElement === path);
        });
        if (value === undefined) { return false; }
        else { return true; }
    }

    private static async removeRegister(context: vscode.ExtensionContext, path: string, type: PathType) {
        var values = await this.getValues(context);
        switch (type) {
            case PathType.MSYS32: {
                values.msys32Paths.splice(values.msys32Paths.indexOf(path, type), 1);
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
        var values = await this.getValues(context);
        switch (type) {
            case PathType.MSYS32: {
                values.msys32Paths.push(path);
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

        // Constants
        const msys32NeededFolders: Array<string> = [
            'home',
            'etc/profile.d'
        ];
        const idfNeededFolders: Array<string> = [
            'components',
            'examples'
        ];

        // Variables
        var referencialName: string = '';
        var neededFolders: Array<string> = [];

        // Set the referencial name of the path to be registered.
        switch (pathType) {
            case PathType.MSYS32: {
                referencialName = "Espressif Toolchain";
                neededFolders = msys32NeededFolders;
                break;
            }
            case PathType.IDF: {
                referencialName = "ESP-IDF API";
                neededFolders = idfNeededFolders;
                break;
            }
        }

        // The user must select the location of the folder.
        var selectedElement = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "Select a " + referencialName + " folder"
        });
        if (selectedElement === undefined) { vscode.window.showErrorMessage("" + referencialName + " folder not selected"); return; }

        // Get the path of the selected folder.
        var elementApsolutePath: string = join(selectedElement[0].fsPath);

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

    public static async setConfiguration(context: vscode.ExtensionContext, msys32Path: string, idfPath: string, projectPath: string) {
        msys32Path = msys32Path.replace(/\\/gi, '/');
        idfPath = idfPath.replace(/\\/gi, '/');
        var vscSettings: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(context.extensionPath, 'assets/configTemplate/_settings.json')))).toString();
        vscSettings = vscSettings.replace(/\:MSYS32_PATH\:/gi, msys32Path);
        vscSettings = vscSettings.replace(/\:IDF_PATH\:/gi, idfPath);
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, '.vscode/settings.json')),
            Buffer.from(vscSettings)
        );
        var vscCCppProperties: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(context.extensionPath, 'assets/configTemplate/_c_cpp_properties.json')))).toString();
        vscCCppProperties = vscCCppProperties.replace(/\:MSYS32_PATH\:/gi, msys32Path);
        vscCCppProperties = vscCCppProperties.replace(/\:IDF_PATH\:/gi, idfPath);
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, '.vscode/c_cpp_properties.json')),
            Buffer.from(vscCCppProperties)
        );
    }
}
