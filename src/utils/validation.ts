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

import { FileType, } from 'vscode';

import * as SysItemUtils from './sys-item';

export async function isValidFolder(
    mandatoryFiles: Array<string>, mandatoryFolders: Array<string>,
    mutuallyExclusiveFilesGroup: Array<Array<string>>, mutuallyExclusiveFoldersGroup: Array<Array<string>>,
): Promise<boolean> {

    if (!await SysItemUtils.allElementsExist(mandatoryFiles, FileType.File)) {
        return false;
    }

    if (!await SysItemUtils.allElementsExist(mandatoryFolders, FileType.Directory)) {
        return false;
    }

    for (let index = 0; index < mutuallyExclusiveFilesGroup.length; index++) {
        if (!await SysItemUtils.anyElementExist(mutuallyExclusiveFilesGroup[index], FileType.File)) {
            return false;
        }
    }

    for (let index = 0; index < mutuallyExclusiveFoldersGroup.length; index++) {
        if (!await SysItemUtils.anyElementExist(mutuallyExclusiveFoldersGroup[index], FileType.Directory)) {
            return false;
        }
    }
    
    return true;
}