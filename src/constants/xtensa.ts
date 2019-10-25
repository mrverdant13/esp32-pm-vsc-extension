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

export namespace Paths {
    export const Folders: Array<string> = [
        join('bin/'),
        join('include/'),
        join('lib/'),
        join('libexec/'),
        join('share/'),
        join('xtensa-esp32-elf/'),
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
    [
        'terminal.integrated.env.linux',
        [
            [
                'PATH',
                ['', '/bin:${env:PATH}']
            ]
        ]
    ],
];