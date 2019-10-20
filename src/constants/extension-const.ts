// Extension supported OSs.
export const SupportedOSs: Array<string> = [
    'win32',
];

export namespace Paths {
    // VSCode settings template file.
    export const projectTemplate: string = 'assets/templates/project/';

    // VSCode settings template file.
    export const vscConfigTemplate: string = 'assets/templates/.vscode/';
}

export namespace Replaceables {
    // Constant bounder.
    export const Bounder: string = ':';

    // Bounded constant string for the ESP-IDF API path.
    export const IdfPath: string = 'IDF_PATH';

    // Bounded constant string for the Espressif Toolchain path.
    export const ToolchainPath: string = 'TOOLCHAIN_PATH';

    // Bounded constant strings.
    export const UnboundedList: Array<string> = [
        IdfPath,
        ToolchainPath,
    ];

    export function boundedReplaceable(constant: string) {
        return (Bounder + constant + Bounder);
    }

    export const BoundedList: Array<string> = [
        ...UnboundedList.map((unboundedReplaceable) => boundedReplaceable(unboundedReplaceable))
    ];
}