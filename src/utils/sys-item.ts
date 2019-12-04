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
