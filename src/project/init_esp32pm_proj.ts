import * as vscode from 'vscode';

import { ProjectAssets } from './assets';

import { Project } from './project';
import { EspressifProj } from './espressif_proj';
import { UninitEsp32pmProj } from './uninit_esp32pm_proj';

import { Idf } from '../resources/idf';
import { Msys32 } from '../resources/msys32';
import { Xtensa } from '../resources/xtensa';

export class InitEsp32pmProj extends Project {
    protected constructor() {
        super();
    }

    // Mandatory folders.
    protected static readonly MandatoryFiles: Array<string> = [
        ProjectAssets.VscCCppPropsFile,
        ProjectAssets.VscSettingsFile,
    ];

    public static async validate(context: vscode.ExtensionContext) {
        try {
            await EspressifProj.validate();
            await UninitEsp32pmProj.validate();
            if (!(await this.isValidProjectFolder())) {
                throw Error('This ESP32-PM project is not initialized.');
            }
            await Idf.validate(context);
            if (process.platform === 'win32') {
                await Msys32.validate(context);
            }
            else if (process.platform === 'linux') {
                await Xtensa.validate(context);
            }
        } catch (error) {
            throw error;
        }
    }
}