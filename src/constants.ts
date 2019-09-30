// Sub-projects folder.
export const subprojectsFolder: string = 'main/src/';

// Sub-projects entry point prefix.
export const entryPointPrefix: string = 'main';

// File to store extension values.
export const extensionValuesFile: string = 'assets/local-data/values.json';

// VSCode settings template file.
export const projectTemplatePath: string = 'assets/projectTemplate/';

// VSCode settings template file.
export const vscSettingsTemplateFile: string = 'assets/configTemplate/_settings.json';

// VSCode C/C++ properties template file.
export const vscCCppPropsTemplateFile: string = 'assets/configTemplate/_c_cpp_properties.json';

// VSCode settings file.
export const vscSettingsFile: string = '.vscode/settings.json';

// VSCode C/C++ properties file.
export const vscCCppPropsFile: string = '.vscode/c_cpp_properties.json';

// VSCode C/C++ properties file.
export const menuconfigBashPath: string = '.vscode/Menuconfig.sh';

// Suffix to be used for files that will be overwrited.
export const overwritingSuffix: string = '.old';

// Colon-surrounded constant string for the project name.
export const colonProjectName: string = 'PROJECT_NAME';

// Colon-surrounded constant string for the Espressif Toolchain path.
export const colonToolchainPath: string = 'TOOLCHAIN_PATH';

// Colon-surrounded constant string for the ESP-IDF API path.
export const colonIdfPath: string = 'IDF_PATH';

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

// Characteristic files of an ESP32-PM project.
export const esp32PmFiles: Array<string> = [
    vscSettingsFile,
    vscCCppPropsFile,
];

// Characteristic folders of an ESP32-PM project.
export const esp32PmFolders: Array<string> = [
    subprojectsFolder,
];

// Colon-surrounded constant strings.
export const colonConstants: Array<string> = [
    colonToolchainPath,
    colonIdfPath,
    colonProjectName,
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

// Files to be overwritten when initializing an existing project.
export const overwritingFiles: Array<string> = [
    'main/main.c',
    'main/main.cpp',
    vscSettingsFile,
    vscCCppPropsFile,
];