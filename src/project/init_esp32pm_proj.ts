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

    // Initialized ESP32-PM project validation.
    public static async validate(context: vscode.ExtensionContext) {
        try {
            // Espressif project validation.
            await EspressifProj.validate();

            // Uninitialized ESP32-PM project validation.
            await UninitEsp32pmProj.validate();

            // Check if the active workspace contains a valid initialized project folder.
            if (!(await this.isValidProjectFolder())) {
                throw Error('This ESP32-PM project is not initialized.');
            }

            // Registered ESP-IDF validation.
            await Idf.validate(context);

            // Resource validation for Windows.
            if (process.platform === 'win32') {
                // Registered MSYS32 validation.
                await Msys32.validate(context);
            }
            // Resource validation for Linux.
            else if (process.platform === 'linux') {
                // Registered XTENSA validation.
                await Xtensa.validate(context);
            }
        } catch (error) { throw error; }
    }
}