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

import * as PathUtils from '../utils/path';
import * as ValidationUtils from '../utils/validation';
import * as VscUtils from '../utils/vsc';

export abstract class Project {
    protected constructor() { }

    // Mandatory files.
    protected static readonly MandatoryFiles: Array<string> = [];

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [];

    // Mutually exclusive files group.
    protected static readonly MutuallyExclusiveFilesGroup: Array<Array<string>> = [];

    // Mutually exclusive folders group.
    protected static readonly MutuallyExclusiveFoldersGroup: Array<Array<string>> = [];

    // Project validation method.
    protected static async isValidProjectFolder(): Promise<boolean> {
        try {
            // Get workspace path.
            const workspacePath: string = VscUtils.getWorkspacePath();

            // Prefix characteristic content elements with the workspace path.
            const mandatoryFiles: Array<string> =
                PathUtils.prefixPaths(workspacePath, this.MandatoryFiles);
            const mandatoryFolders: Array<string> =
                PathUtils.prefixPaths(workspacePath, this.MandatoryFolders);
            const mutuallyExclusiveFilesGroup: Array<Array<string>> =
                this.MutuallyExclusiveFilesGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files));
            const mutuallyExclusiveFoldersGroup: Array<Array<string>> =
                this.MutuallyExclusiveFoldersGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files));

            // Check if the active workspace contains a valid project according to its content elements.
            return await ValidationUtils.isValidFolder(
                mandatoryFiles, mandatoryFolders,
                mutuallyExclusiveFilesGroup, mutuallyExclusiveFoldersGroup
            );
        } catch (error) { throw error; }
    }
}