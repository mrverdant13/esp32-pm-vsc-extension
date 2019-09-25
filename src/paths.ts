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
}
