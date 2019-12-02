import * as PathUtils from '../utils/path';
import * as ValidationUtils from '../utils/validation';

export abstract class Resource {
    protected constructor() { }

    // Mandatory files.
    protected static readonly MandatoryFiles: Array<string> = [];

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [];

    // Mutually exclusive files group.
    protected static readonly MutuallyExclusiveFilesGroup: Array<Array<string>> = [];

    // Mutually exclusive folders group.
    protected static readonly MutuallyExclusiveFoldersGroup: Array<Array<string>> = [];

    // Validation method.
    protected static async isValidFolder(resourceAbsolutePath: string): Promise<boolean> {
        try {
            const mandatoryFiles: Array<string> =
                PathUtils.prefixPaths(resourceAbsolutePath, this.MandatoryFiles);
            const mandatoryFolders: Array<string> =
                PathUtils.prefixPaths(resourceAbsolutePath, this.MandatoryFolders);

            const mutuallyExclusiveFilesGroup: Array<Array<string>> =
                this.MutuallyExclusiveFilesGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(resourceAbsolutePath, files));
            const mutuallyExclusiveFoldersGroup: Array<Array<string>> =
                this.MutuallyExclusiveFoldersGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(resourceAbsolutePath, files));

            return await ValidationUtils.isValidFolder(
                mandatoryFiles, mandatoryFolders,
                mutuallyExclusiveFilesGroup, mutuallyExclusiveFoldersGroup
            );
        } catch (error) { throw error; }
    }

    public static readonly OneLevelSettings: Array<[string, Array<string>]> = [];

    public static readonly TwoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [];
}