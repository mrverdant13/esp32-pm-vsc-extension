import { ProjectAssets } from './assets';
import { Project } from './project';
import { EspressifProj } from './espressif_proj';
import { UninitEsp32pmProj } from './uninit_esp32pm_proj';

export class InitEsp32pmProj extends Project {
    protected constructor() {
        super();
    }

    // Mandatory folders.
    protected static readonly MandatoryFiles: Array<string> = [
        ProjectAssets.VscCCppPropsFile,
        ProjectAssets.VscSettingsFile,

    ];

    public static async validate() {
        // TODO: Include resource checking (IDF_PATH, XTENSA_PATH, MSYS32_PATH).
        try {
            await EspressifProj.validate();
            await UninitEsp32pmProj.validate();
            if (!(await this.isValidFolder())) {
                throw Error('This ESP32-PM project is not initialized.');
            }
        } catch (error) {
            throw error;
        }
    }
}