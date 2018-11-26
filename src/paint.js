import $ from 'jquery';
import qlik from 'qlik';
import { addOnActivateButtonEvent, createSelectionURLPart } from './utilities';

const RECORD_SEPARATOR = '&@#$^()';
const TAG_SEPARATOR = '::::';
const VALUE_SEPARATOR = ';;;;';

// IE is missing "String.includes"
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

function paint ($element, layout, component, qTheme) {
  var config = {
    host: window.location.hostname,
    prefix: window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1),
    port: window.location.port,
    isSecure: window.location.protocol === "https:"
  };

  //Getting the current application
  var app = qlik.currApp(component);
  var applicationId = app.model.layout.qFileName;
  if (applicationId.substring(applicationId.length - 4) == '.qvf') {
    applicationId = applicationId.slice(0, -4);
  }
  var applicationIdFr = encodeURIComponent(applicationId);

  //Getting the current sheet
  var CurrentSheet = qlik.navigation.getCurrentSheetId();
  var SheetID = CurrentSheet.sheetId;

  //Creating base part of URL including clearing any leftover
  //selections before opening the new page with our selections
  var baseURL = (config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port : "" ) + "/sense/app/" + applicationIdFr + "/sheet/" + SheetID + "/state/analysis/options/clearselections";

  //If the user chose to output the link through an email, only create a button, otherwise create a textbox as well
  const button = $(`<button name="GenerateDashboardLink" id="generateDashboardLink" class="dashboardLinkGenerator" />`);
  button.attr('style', `background-color: ${qTheme.properties.dataColors.primaryColor};`);
  if(layout.outputMethod == "email"){
    button.text('Email Link');
    $element.html(button);
  }
  else if(layout.outputMethod == "clipboard"){
    button.text('Copy Dashboard Link');
    $element.html(button);
  }
  else if(layout.outputMethod == "textbox"){
    button.text('Generate Link');
    var textboxHTMLCode = '<textarea id="textbox" class="linkTextboxArea" type="text" readOnly="true" style="height: 90%;width: 90%;font-size: 10px;" value="0"/>';
    $element.html('<table style="height:100%;text-align: center;"><tr><td style="width:20%;">'+button[0].outerHTML+'</td><td style="width:80%;">'+textboxHTMLCode+'</td></tr></table>');
  }

  //If in edit mode, do nothing
  if(window.location.pathname.includes("/state/edit")) return;

  const maxValuesSelectedInField = Math.max(1, layout.maxSelected);

  //Create a hypercube with the GetCurrentSelections expression
  app.createCube(
    {
      qMeasures: [{
        qDef: {
          qDef: "=GetCurrentSelections('" + RECORD_SEPARATOR + "','" + TAG_SEPARATOR + "','" + VALUE_SEPARATOR + "'," + maxValuesSelectedInField + ")"
        }
      }],
      qInitialDataFetch: [{
        qTop: 0,
        qLeft: 0,
        qHeight: 1,
        qWidth: 1
      }]
    },
    reply => {
      const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;
      const qText = qMatrix[0][0].qText;

      const fieldSelections = (qText && qText != '-') ? qText.split(RECORD_SEPARATOR) : [];
      if (fieldSelections.length === 0) {
        addOnActivateButtonEvent($element, config, layout, baseURL, layout.emailRecipients, layout.emailTopic, layout.emailBody);
        return;
      }

      const selectionPartOfURL = createSelectionURLPart(fieldSelections, TAG_SEPARATOR, VALUE_SEPARATOR, true);
      if (!selectionPartOfURL.tooManySelectionsPossible) {
        console.log('!selectionPartOfURL.tooManySelectionsPossible');
        addOnActivateButtonEvent($element, config, layout, baseURL + selectionPartOfURL.selectionURLPart, layout.emailRecipients, layout.emailTopic, layout.emailBody);
        return;
      }

      // Create a new hypercube with the number of selections of the suspected fields
      app.createCube(
        {
          qMeasures: selectionPartOfURL.suspectedFields.map(field => ({
            qDef: {
              qDef: "=GetSelectedCount([" + field + "],True())"
            }
          })),
          qInitialDataFetch: [{
            qTop: 0,
            qLeft: 0,
            qHeight: 1,
            qWidth: selectionPartOfURL.suspectedFields.length
          }]
        },
        reply => {
          const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;
          const tooManySelectionsMade = qMatrix[0].some(suspectedSelection => (
            parseInt(suspectedSelection.qText) > layout.maxSelected
          ));
          if (tooManySelectionsMade) {
            //If this is the case for at least one field, disable the button
            $("#generateDashboardLink").text("Too Many Selections");
            $("#generateDashboardLink").prop("disabled", true);
          }
          else {
            //Considering it a false alarm (for example some field has actual value that follows the "x of y" pattern); activate the button
            const selectionPartOfURL = createSelectionURLPart(fieldSelections, TAG_SEPARATOR, VALUE_SEPARATOR, false);
            addOnActivateButtonEvent($element, config, layout, baseURL + selectionPartOfURL.selectionURLPart, layout.emailRecipients, layout.emailTopic, layout.emailBody);
          }
        });
    });
}

export default paint;
