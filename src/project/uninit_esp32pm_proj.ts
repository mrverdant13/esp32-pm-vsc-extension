import { ProjectAssets } from './assets';
import { Project } from './project';
import { EspressifProj } from './espressif_proj';

export class UninitEsp32pmProj extends Project {
    protected constructor() {
        super();
    }

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        ProjectAssets.SubProjectsFolder,
    ];

    public static async validate() {
        // TODO: Include resource checking (IDF_PATH, XTENSA_PATH, MSYS32_PATH).
        try {
            await EspressifProj.validate();
            if (!(await this.isValidFolder())) {
                throw Error('This is not an ESP32-PM project.');
            }
        } catch (error) {
            throw error;
        }
    }
}