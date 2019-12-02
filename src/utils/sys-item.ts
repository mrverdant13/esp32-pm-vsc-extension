import * as vscode from 'vscode';

import {
    readdirSync,
    lstatSync,
} from 'fs';

import * as PathUtils from './path';

export async function elementExists(path: string, type: vscode.FileType): Promise<boolean> {
    try {
        // Get the info regarding the passed file path.
        const fileStat: vscode.FileStat = await vscode.workspace.fs.stat(vscode.Uri.file(path));

        // Return the validation of the file type.
        return fileStat.type === type;
    } catch (error) {
        // If this point is reached, an exception was thrown and, thus, the file does not exist.
        return false;
    }
}

export async function folderExists(path: string): Promise<boolean> {
    try {
        // Return the revision of the folder existence.
        return await elementExists(path, vscode.FileType.Directory);
    } catch (error) {
        throw error;
    }
}

export async function fileExists(path: string): Promise<boolean> {
    try {
        // Return the revision of the file existence.
        return await elementExists(path, vscode.FileType.File);
    } catch (error) {
        throw error;
    }
}

export async function allElementsExist(folders: Array<string>, type: vscode.FileType): Promise<boolean> {
    try {
        // Check if all elements exist.
        for (let index = 0; index < folders.length; index++) {
            if (!await elementExists(folders[index], type)) {
                return false;
            }
        }
        return true;
    } catch (error) {
        throw error;
    }
}

export async function anyElementExist(folders: Array<string>, type: vscode.FileType): Promise<boolean> {
    try {
        // Check if any element exists.
        for (let index = 0; index < folders.length; index++) {
            if (await elementExists(folders[index], type)) {
                return true;
            }
        }
        return false;
    } catch (error) {
        throw error;
    }
}

export function getFolders(path: string): Array<string> {
    try {
        // Get the elements inside the passed folder and filter the directories.
        return readdirSync(path).filter((element) => {
            if (lstatSync(PathUtils.joinPaths(path, element)).isDirectory()) {
                return PathUtils.joinPaths(element);
            }
        });
    } catch (error) {
        throw error;
    }
}

export function getFiles(path: string): Array<string> {
    try {
        // Get the elements inside the passed folder and filter the files.
        return readdirSync(path).filter((element) => {
            if (lstatSync(PathUtils.joinPaths(path, element)).isFile()) {
                return PathUtils.joinPaths(element);
            }
        });
    } catch (error) {
        throw error;
    }
}

export async function filterExistingFolders(folders: Array<string>): Promise<Array<string>> {
    try {
        var existingPaths: Array<string> = [];

        // Check if each of the passed folders exist and, if so, append them to a final array.
        for (var index: number = 0; index < folders.length; index++) {
            if (await folderExists(folders[index])) {
                existingPaths.push(PathUtils.joinPaths(folders[index]));
            }
        }

        // Return the resulting array.
        return existingPaths;
    } catch (error) {
        throw error;
    }
}

export async function copyElement(originFilePath: string, destinationFilePath: string): Promise<void> {
    try {
        // Copy element.
        await vscode.workspace.fs.copy(
            vscode.Uri.file(originFilePath),
            vscode.Uri.file(destinationFilePath),
            { overwrite: true }
        );
    } catch (error) {
        throw error;
    }
}
