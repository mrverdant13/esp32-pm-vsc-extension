# ESP32 project manager for Visual Studio Code

Extension that allows its users to build, flash and monitor ESP32 projects based on the ESP-IDF.

----------

## Features

### Supported OS

- Windows

### Commands

- `ESP32-PM: Register ESP-IDF API` : Register the path of a folder that contains an ESP-IDF API.
- `ESP32-PM: Register Espressif Toolchain` : Register the path of a folder that contains an Espressif Toolchain.
- `ESP32-PM: Create project` : Create a new ESP32 project.
- `ESP32-PM: Menuconfig` : Run the `make menuconfig` command, which shows the configuration interface for a ESP32 project.
- `ESP32-PM: Defconfig` : Run the `make defconfig` command, which applies the default configuration values defined in the `sdkconfig.defaults` file.
- `ESP32-PM: Build project` : Run the `make -j all` command, which builds the previously selected project source.
- `ESP32-PM: Flash` : Run the `make flash` command, which flashes a built project using a previously selected serial port.
- `ESP32-PM: Monitor` : Run the `make monitor` command, which opens a terminal using a previously selected serial port.
- `ESP32-PM: Flash & Monitor` : Run the `make flash monitor` command, which flashes a built project and opens a terminal using a previously selected serial port.
- `ESP32-PM: Clean` : Run the `make clean` command, which removes built files.
- `ESP32-PM: Remove auto-generated files` : Remove files auto-generated by this extension.

----------

## Requirements

### For Windows

The following elements are required to be previously installed:

1. The [Espressif Toolchain](https://dl.espressif.com/dl/esp32_win32_msys2_environment_and_toolchain-20190611.zip) (the 'msys32' folder) unzziped in a folder located in a path with no spaces.
2. The ESP-IDF by cloning [its repository](https://github.com/espressif/esp-idf) recursively (git clone --recursive \<repo\>) in a folder located in a path with no spaces. You could use any version.

----------

## Extension Settings

None.

----------

## Known Issues

[Known issues](https://github.com/mrverdant13/esp32-pm-vsc-extension/issues).

----------

## Release Notes

Release notes registered within the [extension changelog](https://github.com/mrverdant13/esp32-pm-vsc-extension/blob/master/CHANGELOG.md).