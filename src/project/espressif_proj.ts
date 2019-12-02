import { ProjectAssets } from './assets';
import { Project } from './project';

export class EspressifProj extends Project {
    protected constructor() {
        super();
    }

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        ProjectAssets.MainFolder,
    ];

    // Mutually exclusive files group.
    protected static readonly MutuallyExclusiveFilesGroup: Array<Array<string>> = [
        [ProjectAssets.ProjMakeFile, ProjectAssets.CMakeListFile],
    ];

    public static async validate() {
        try {
            if (!(await this.isValidFolder())) {
                throw Error('This is not an Espressif project.');
            }
        } catch (error) {
            throw error;
        }
    }
}