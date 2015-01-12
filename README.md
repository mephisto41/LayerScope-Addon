# LayerScope Add-on
Firefox browser addon for layerscope Tools.

>  https://wiki.mozilla.org/Platform/GFX/LayerScope

## Requirements
- Before proceeding, please make sure you've installed Python 2.5,
2.6, or 2.7 (if it's not already on your system).
Note that Python 3 is not supported on any platform, and Python 2.7.6
is not supported on Windows.

>  http://python.org/download/

- ADB Helper - You can use WebIDE to download the latest ADB helper

>  https://developer.mozilla.org/en-US/docs/Tools/WebIDE

## Setup, Build, and Test
To get started, first enter the same directory that this README file
is using a shell program, and then execute the following command:

  ```bash
  ./mach bootstrap
  ```

It will do necessay work for you, such as updating layerscope and sdk.
If you want to run and test it, just do:

  ```bash
  ./mach run
  ```

If you want to pack it as xpi file and your firefox browser can load it,
just do:

  ```bash
  ./mach build
  ```

Ok, please enjoy this tool.
