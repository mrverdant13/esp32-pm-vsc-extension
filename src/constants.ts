// Characteristic files of an ESP32-PM project.
export const supportedOSs: Array<string> = [
    'win32',
];

// Sub-projects folder.
export const subprojectsFolder: string = 'main/src/';

// Sub-projects entry point prefix.
export const entryPointPrefix: string = 'main';

// Sub-projects entry point extensions.
export const entryPointExtensions: Array<string> = [
    '.c',
    '.cpp',
];

// Characteristic files of an Espressif project.
export const espressifFiles: Array<string> = [
    'Makefile',
];

// Characteristic folders of an Espressif project.
export const espressifFolders: Array<string> = [
    'main',
];

// Characteristic files of an ESP32-PM project.
export const esp32PmFiles: Array<string> = [
    '.vscode/settings.json',
    '.vscode/c_cpp_properties.json',
];

// Characteristic files of an ESP32-PM project.
export const esp32PmFolders: Array<string> = [
    subprojectsFolder,
];

// Colon-surrounded constant strings.
export const colonConstants: Array<string> = [
    'MSYS32_PATH',
    'IDF_PATH',
];

// Characteristic folders of an Espressif Toolchain.
export const toolchainFolders: Array<string> = [
    'home',
    'etc/profile.d'
];

// Characteristic folders of an ESP-IDF API.
export const idfFolders: Array<string> = [
    'components',
    'examples'
];

// File to store extension values.
export const extensionValuesFile: string = 'assets/local-data/values.json';