# Dashboard-Link-Generator
Allows you to share your current dashboard by generating a link to your app/sheet/selections.

This Qlik Sense extension generates a shareable link to the current app, sheet, and selections made so that the person receiving the link can see exactly what you're seeing. You can share the generated link through three output methods: Copy to Clipboard, Create New Email with link, or a Textbox.

[![CircleCI](https://circleci.com/gh/qlik-oss/Dashboard-Link-Generator.svg?style=svg)](https://circleci.com/gh/qlik-oss/Dashboard-Link-Generator)

# Usage
- The extension was built to take up as least real estate on the sheet as possible, all three output methods are able to scale down to a 1 x 1 square.
- Please make sure to include both folders, DashboardLinkGenerator and DashboardLinkGeneratorURLResolver, in the extensions folder.


# Output Methods
## Copy To Clipboard
![alt tag](resources/Copy%20To%20Clipboard%20Output%20Method.png)
## New Email with link
![alt tag](resources/New%20Email%20Output%20Method.png)
![alt tag](resources/New%20Generated%20Email.png)
## Textbox
![alt tag](resources/Copy%20to%20Textbox%20Output%20Method.png)


# Credit
- Original App Integration logic for 2.x created by Piotr Cyupla


# Installation

1. Download the extension zip, `qlik-share-button_<version>.zip`, from the latest release(https://github.com/qlik-oss/Dashboard-Link-Generator/tree/master/FEI-DashboardLinkGenerator/releases/latest)
2. Install the extension:

   a. **Qlik Sense Desktop**: unzip to a directory under [My Documents]/Qlik/Sense/Extensions.

   b. **Qlik Sense Server**: import the zip file in the QMC.


# Developing the extension

If you want to do code changes to the extension follow these simple steps to get going.

1. Get Qlik Sense Desktop
1. Create a new app and add the extension to a sheet.
2. Clone the repository
3. Run `npm install`
4. Set the environment variable `BUILD_PATH` to your extensions directory. It will be something like `C:/Users/<user>/Documents/Qlik/Sense/Extensions/<extension_name>`.
5. You now have two options. Either run the watch task or the build task. They are explained below. Both of them default to development mode but can be run in production by setting `NODE_ENV=production` before running the npm task.

   a. **Watch**: `npm run watch`. This will start a watcher which will rebuild the extension and output all needed files to the `buildFolder` for each code change you make. See your changes directly in your Qlik Sense app.

   b. **Build**: `npm run build`. If you want to build the extension package. The output zip-file can be found in the `buildFolder`.

# Limitations

See [Limitations](docs/LIMITATIONS.md)

# Original authors

[https://github.com/fadyheiba](https://github.com/fadyheiba/)


# License

Released under the MIT License
