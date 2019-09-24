import { join } from "path";
import * as vscode from 'vscode';

import { fileExists, filterExistingPaths } from "./utils";

const relativeValuesPath: string = 'assets/local-data/values.json';

export interface Paths {
    msys32Paths: string[];
    idfPaths: string[];
}

export enum PathTypes {
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

    public static async setValues(context: vscode.ExtensionContext, values: Paths): Promise<void> {
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

    public static async pathIsRegistered(context: vscode.ExtensionContext, path: string, type: PathTypes): Promise<boolean> {
        const paths = await this.getValues(context);
        var pathsArray: string[] = [];
        switch (type) {
            case PathTypes.MSYS32: {
                pathsArray = paths.msys32Paths;
                break;
            }
            case PathTypes.IDF: {
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

    public static async removeRegister(context: vscode.ExtensionContext, path: string, type: PathTypes) {
        var values = await this.getValues(context);
        switch (type) {
            case PathTypes.MSYS32: {
                values.msys32Paths.splice(values.msys32Paths.indexOf(path, type), 1);
                break;
            }
            case PathTypes.IDF: {
                values.idfPaths.splice(values.idfPaths.indexOf(path), 1);
                break;
            }
        }
        await this.setValues(context, values);
    }

    public static async addRegister(context: vscode.ExtensionContext, path: string, type: PathTypes) {
        var values = await this.getValues(context);
        switch (type) {
            case PathTypes.MSYS32: {
                values.msys32Paths.push(path);
                break;
            }
            case PathTypes.IDF: {
                values.idfPaths.push(path);
                break;
            }
        }
        await this.setValues(context, values);
    }
}
