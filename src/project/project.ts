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