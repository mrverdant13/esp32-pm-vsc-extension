import {
    join,
} from "path";

import {
    projectValuesFilePath,
} from "../constants";

import {
    getWorkspacePath,
    ValidationType,
} from "../esp32-pm-project";

import {
    writeFile,
    fileExists,
    readFile,
    folderExists,
} from "../utils";

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

export interface Esp32PmProjectValues {
    idfPath: string;
    toolchainPath: string;
}

export enum ProjectValueType {
    IDF_PATH = 0,
    TOOLCHAIN_PATH = 1,
}

export class Esp32PmProject {
    private static jsonToValues(jsonString: string): Esp32PmProjectValues {
        try {
            // Parse string to Esp32PmProjectValues.
            const values: Esp32PmProjectValues = JSON.parse(jsonString);

            // If the idfPath is undefined, assign an empty string.
            if (values.idfPath === undefined) {
                values.idfPath = '';
            }

            // If the toolchainPath is undefined, assign an empty string.
            if (values.toolchainPath === undefined) {
                values.toolchainPath = '';
            }

            // Return the parsed values.
            return values;
        } catch (error) {
            throw error;
        }
    }

    private static valuesToJsonString(value: Esp32PmProjectValues): string {
        try {
            // Convert Esp32PmProjectValues to string.
            return JSON.stringify(value);
        } catch (error) {
            throw error;
        }
    }

    private static async setValues(values: Esp32PmProjectValues): Promise<void> {
        try {
            // Validate if the project is an Espressif one.
            const projectPath: string = await getWorkspacePath(ValidationType.ESP32_PM_PROJ);

            // Write the values to the project values file.
            await writeFile(
                join(projectPath, projectValuesFilePath),
                Esp32PmProject.valuesToJsonString(values)
            );
        } catch (error) {
            throw error;
        }
    }

    public static async getValues(): Promise<Esp32PmProjectValues> {
        try {
            // Validate if the project is an Espressif one.
            const projectPath: string = await getWorkspacePath(ValidationType.ESP32_PM_PROJ);

            // Get the project values.
            const values: Esp32PmProjectValues = Esp32PmProject.jsonToValues(
                (await fileExists(join(projectPath, projectValuesFilePath)))
                    ? (await readFile(join(projectPath, projectValuesFilePath)))
                    : '{}'
            );

            // Filter existing folders only.
            if (!await folderExists(values.idfPath)) {
                values.idfPath = '';
            }
            if (!await folderExists(values.toolchainPath)) {
                values.toolchainPath = '';
            }

            // Update project values.
            await Esp32PmProject.setValues(values);

            // Return values.
            return values;
        } catch (error) {
            throw error;
        }
    }
}
