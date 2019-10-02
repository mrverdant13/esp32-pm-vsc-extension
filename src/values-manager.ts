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

import {
    join,
} from "path";

import * as vscode from 'vscode';

import {
    toolchainFolders,
    idfFolders,
    extensionValuesFile,
    colonToolchainPath,
    colonIdfPath,
    vscSettingsTemplateFile,
    vscCCppPropsTemplateFile,
    vscSettingsFile,
    menuconfigBashPath,
    vscCCppPropsFile,
} from "./constants";
import {
    fileExists,
    filterExistingFolders,
    folderExists,
} from "./utils";

export interface Values {
    toolchainPaths: Array<string>;
    idfPaths: Array<string>;
}

export enum ValueType {
    TOOLCHAIN_PATH = 0,
    IDF_PATH = 1,
}

export class ValuesManager {

    private static toValues(jsonString: string): Values {
        // Parse string to Values.
        const tempValues: Values = JSON.parse(jsonString);

        // If the toolchainPaths is not defined, assign an emptyarray.
        if (tempValues.toolchainPaths === undefined) {
            tempValues.toolchainPaths = [];
        }

        // If the idfPaths is not defined, assign an emptyarray.
        if (tempValues.idfPaths === undefined) {
            tempValues.idfPaths = [];
        }

        // return the parsed Values.
        return tempValues;
    }

    private static valuesToJson(values: Values): string {
        // Convert Values to string.
        return JSON.stringify(values);
    }

    private static async setValues(context: vscode.ExtensionContext, values: Values): Promise<void> {
        // Write the values to the extension values file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(context.asAbsolutePath(extensionValuesFile)),
            Buffer.from(this.valuesToJson(values))
        );
    }

    public static async getValues(context: vscode.ExtensionContext): Promise<Values> {
        // Get the registered values from the extension values file.
        const values: Values = this.toValues(
            (await fileExists(context.asAbsolutePath(extensionValuesFile)))
                ? (await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath(extensionValuesFile)))).toString()
                : '{}');

        // Filter only the existing toolchain folders.
        values.toolchainPaths = await filterExistingFolders(values.toolchainPaths);

        // Filter only the existing ESP-IDF folders.
        values.idfPaths = await filterExistingFolders(values.idfPaths);

        // Update the values stored in the extension values file.
        await this.setValues(context, values);

        // Return the resulting existing values.
        return values;
    }

    private static async valueIsRegistered(context: vscode.ExtensionContext, value: string, valueType: ValueType): Promise<boolean> {

        // Get the existing values.
        const values = await this.getValues(context);

        // Select the values of interest.
        var valuesArray: string[] = [];
        switch (valueType) {
            case ValueType.TOOLCHAIN_PATH: {
                valuesArray = values.toolchainPaths;
                break;
            }
            case ValueType.IDF_PATH: {
                valuesArray = values.idfPaths;
                break;
            }
        }

        // Check if the passed value is already registered.
        const foundValue = valuesArray.find((registeredValue) => {
            return (registeredValue === value);
        });

        // If the found value is undefined, the passed value is not registered.
        if (foundValue === undefined) {
            return false;
        }
        // Else, the passed value is already registered.
        else {
            return true;
        }
    }

    private static async addRegister(context: vscode.ExtensionContext, value: string, valueType: ValueType) {
        // Get the existing values.
        const values = await this.getValues(context);

        // Add the passed value to the values of interest.
        switch (valueType) {
            case ValueType.TOOLCHAIN_PATH: {
                values.toolchainPaths.push(value);
                break;
            }
            case ValueType.IDF_PATH: {
                values.idfPaths.push(value);
                break;
            }
        }

        // Update the values stored in the extension values file.
        await this.setValues(context, values);
    }

    public static async registerValue(context: vscode.ExtensionContext, valueType: ValueType) {

        // Variables
        var valueLabel: string = '';
        var neededFolders: Array<string> = [];

        // Set the label of the value to be registered.
        // Set the characteristic folders for the value type of interest.
        switch (valueType) {
            case ValueType.TOOLCHAIN_PATH: {
                valueLabel = "Espressif Toolchain";
                neededFolders = toolchainFolders;
                break;
            }
            case ValueType.IDF_PATH: {
                valueLabel = "ESP-IDF API";
                neededFolders = idfFolders;
                break;
            }
        }

        // The user must select the location of the folder.
        const selectedElement = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "Select a " + valueLabel + " folder"
        });
        if (selectedElement === undefined) {
            vscode.window.showErrorMessage("" + valueLabel + " folder not selected");
            return;
        }

        // Get the path of the selected folder.
        const selectedElementAbsolutePath: string = join(selectedElement[0].fsPath).replace(/\\/gi, '/');

        // Check if the folder is valid.
        const folderIsValid: boolean = !neededFolders.some(async (neededFolder) => {
            return (!await folderExists(join(selectedElementAbsolutePath, neededFolder)));
        });
        if (folderIsValid) {
            vscode.window.showErrorMessage("Invalid " + valueLabel + " folder.");
            return;
        }

        // The folder path must not include empty spaces.
        if (selectedElementAbsolutePath.includes(" ")) {
            vscode.window.showErrorMessage("The " + valueLabel + " path should not include spaces.");
            return;
        }

        // If the value is already registered, notify the user.
        if (await ValuesManager.valueIsRegistered(context, selectedElementAbsolutePath, valueType)) {
            vscode.window.showWarningMessage("The provided " + valueLabel + " path was already registered.");
            return;
        }

        // Register the selected value.
        await ValuesManager.addRegister(context, selectedElementAbsolutePath, valueType);

        // Notify the user.
        await vscode.window.showInformationMessage(valueLabel + ' path registered.');
    }

    public static async setConfiguration(context: vscode.ExtensionContext, toolchainPath: string, idfPath: string, projectPath: string) {
        // Get the VSC settings template content.
        var vscSettings: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath(vscSettingsTemplateFile)))).toString();

        // Replace the :<CONSTANTS>: values in the template.
        vscSettings = vscSettings.replace(RegExp(':' + colonToolchainPath + ':', 'gi'), toolchainPath);
        vscSettings = vscSettings.replace(RegExp(':' + colonIdfPath + ':', 'gi'), idfPath);

        // Write the refactored content in a final VSC settings file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, vscSettingsFile)),
            Buffer.from(vscSettings)
        );

        // Get the VSC C/C++ properties template content.
        var vscCCppProperties: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath(vscCCppPropsTemplateFile)))).toString();

        // Replace the :<CONSTANTS>: values in the template.
        vscCCppProperties = vscCCppProperties.replace(RegExp(':' + colonToolchainPath + ':', 'gi'), toolchainPath);
        vscCCppProperties = vscCCppProperties.replace(RegExp(':' + colonIdfPath + ':', 'gi'), idfPath);

        // Write the refactored content in a final VSC settings file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, vscCCppPropsFile)),
            Buffer.from(vscCCppProperties)
        );

        // Content of the Menuconfig bash.
        const menuconfigContent: string =
            'echo "ESP32-PM: Launching graphical config menu..."' + '\n' +
            'set CHERE_INVOKING=1' + '\n' +
            'start ' + toolchainPath + '/mingw32.exe make menuconfig';

        // Write the content of the Menuconfig file in its file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(join(projectPath, menuconfigBashPath)),
            Buffer.from(menuconfigContent)
        );
    }
}
