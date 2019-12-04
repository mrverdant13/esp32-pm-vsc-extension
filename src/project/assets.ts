import * as PathUtils from '../utils/path';

export namespace ProjectAssets {
    
    // Sub-projects folder name.
    export const SubProjectsFolderName: string = 'src';

    // Generated available serial ports list temporal file name.
    export const TempGeneratedSerialPortsFileName: string = 'tempSerialPortsFile.txt';

    // Generated available serial ports list final file name.
    export const FinalGeneratedSerialPortsFileName: string = 'finalSerialPortsFile.txt';

    // Project Make file.
    export const ProjMakeFile: string = 'Makefile';

    // Project CMake file.
    export const CMakeListFile: string = 'CMakeList.txt';

    // Project main folder.
    export const MainFolder: string = 'main';

    // VSCode workspace settings file.
    export const VscSettingsFile: string = '.vscode/settings.json';

    // VSCode workspace C/C++ properties file.
    export const VscCCppPropsFile: string = '.vscode/c_cpp_properties.json';

    // Sub-projects folder.
    export const SubProjectsFolder: string = PathUtils.joinPaths('main', SubProjectsFolderName);

    // Generated available serial ports list temporal file.
    export const TempGeneratedSerialPortsFile: string = PathUtils.joinPaths('build', TempGeneratedSerialPortsFileName);

    // Generated available serial ports list final file.
    export const FinalGeneratedSerialPortsFile: string = PathUtils.joinPaths('build', FinalGeneratedSerialPortsFileName);
}