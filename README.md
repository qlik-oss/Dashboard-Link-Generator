# Dashboard-Link-Generator
## An extension that allows you to share your current dashboard by generating a link to your app/sheet/selections.

This Qlik Sense extension generates a shareable link to the current app, sheet, and selections made so that the person receiving the link can see exactly what you're seeing. You can share the generated link through three output methods: Copy to Clipboard, Create New Email with link, or a textbox.

###Usage:
- The extension was built to take up as least real estate on the sheet as possible, all three output methods are able to scale down to a 1 x 1 square.
- Please make sure to include both folders, DashboardLinkGenerator and DashboardLinkGeneratorURLResolver, in the extensions folder.

###For Sense 2.x:
This version of the extension is for Sense 3.0 and above. If you would like to the version for 2.x version, it is included in a .zip file in the main extension folder (DashboardLinkGenerator folder). However, it is recommended to use this extension in Sense 3.0 as the new release fixed bugs in Sense 2.x that made the link resolution more stable, specifically with date values including spaces.
Included in the main extension folder (DashboardLinkGenerator folder) is a .zip file with the Sense 2.x version of the extension.

![alt tag](https://github.com/fadyheiba/Sense-Third-Party-Engine-Connector/blob/master/3rd%20Party%20Engine%20Connector/Integration%20Flowchart.png)

####Credit:
- Original App Integration logic created by Piotr Cyupla
