export namespace Paths {
    export const Folders: Array<string> = [
        'bin/',
        'include/',
        'lib/',
        'libexec/',
        'share/',
        'xtensa-esp32-elf/',
    ];
}

export const OneLevelSettings: Array<[string, Array<string>]> = [
];

export const TwoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [
    [
        'terminal.integrated.env.linux',
        [
            [
                'XTENSA_PATH',
                ['', '']
            ]
        ]
    ],
];