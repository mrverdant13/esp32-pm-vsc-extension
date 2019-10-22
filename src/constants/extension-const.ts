// Extension supported OSs.
export const SupportedOSs: Array<string> = [
    'win32',
    'linux',
];

export namespace Paths {
    // VSCode settings template file.
    export const ProjectTemplate: string = 'assets/templates/project/';

    // VSCode settings template file.
    export const VscConfigTemplate: string = 'assets/templates/.vscode/';
}

export namespace Replaceables {
    // Constant bounder.
    export const Bounder: string = ':';

    // Bounded constant string for the ESP-IDF API path.
    export const IdfPath: string = 'IDF_PATH';

    // Bounded constant string for the 'msys32' folder path.
    export const Msys32Path: string = 'MSYS32_PATH';

    // Unbounded constant strings.
    export const UnboundedList: Array<string> = [
        IdfPath,
        Msys32Path,
    ];

    // Bounded constant strings generator.
    export function boundedReplaceable(constant: string) {
        return (Bounder + constant + Bounder);
    }

    // Bounded constant strings.
    export const BoundedList: Array<string> = [
        ...UnboundedList.map((unboundedReplaceable) => boundedReplaceable(unboundedReplaceable))
    ];
}