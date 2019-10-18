// Sub-projects entry point prefix.
export const entryPointPrefix: string = 'main';

// Suffix to be used for files that will be overwrited.
export const overwritingSuffix: string = '.old';

// Characteristic files of an ESP32-PM project.
export const supportedOSs: Array<string> = [
    'win32',
];

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
    'main/',
];

// Characteristic folders of an Espressif Toolchain.
export const toolchainFolders: Array<string> = [
    'home/',
    'etc/profile.d/',
];

// Characteristic folders of an ESP-IDF API.
export const idfFolders: Array<string> = [
    'components/',
    'examples/',
];

// Bounder function.
export function boundedConstant(constant: string) {
    return (constantBounder + constant + constantBounder);
}