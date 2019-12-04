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

    // Uninitialized ESP32-PM project validation.
    public static async validate() {
        try {
            // Espressif project validation.
            await EspressifProj.validate();

            // Check if the active workspace contains a valid uninitialized project folder.
            if (!(await this.isValidProjectFolder())) {
                throw Error('This is not an ESP32-PM project.');
            }
        } catch (error) { throw error; }
    }
}