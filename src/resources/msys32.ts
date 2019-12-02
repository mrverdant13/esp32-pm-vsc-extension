import { Resource } from "./resource";

export class Msys32 extends Resource {
    protected constructor() {
        super();
    }

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        'home',
        'etc/profile.d',
    ];

    public static async validate(resourceAbsolutePath: string) {
        try {
            if (!(await this.isValidFolder(resourceAbsolutePath))) {
                throw Error('The selected folder is not an "msys32" one.');
            }
        } catch (error) {
            throw error;
        }
    }

    public static readonly OneLevelSettings: Array<[string, Array<string>]> = [
        [
            'terminal.integrated.shell.windows',
            ['', '/usr/bin/bash.exe']
        ],
    ];

}