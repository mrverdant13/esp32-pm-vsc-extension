// Sub-project entry point suffix.
const Suffix: string = 'main';

// Sub-project entry point potential extensions.
const Extensions: Array<string> = [
    '.c',
    '.cpp',
];

export function validateEntryPoint(entryPointCandidate: string): void {
    if (!Extensions.some((extension) => {
        return entryPointCandidate.endsWith(extension);
    })) {
        throw Error('The active file is not a C/C++ file.');
    }
}