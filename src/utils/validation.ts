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