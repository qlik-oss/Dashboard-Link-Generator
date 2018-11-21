import $ from 'jquery';
import qlik from 'qlik';
import { addOnActivateButtonEvent, createSelectionURLPart } from './utilities';

function paint ($element, layout, component, qTheme) {
  //Defining the separators used in GetCurrentSelections function call
  var recordSeparator = '&@#$^()';
  var tagSeparator = '::::';
  var valueSeparator = ';;;;';

  //For IE that doesn't recognize the "includes" function
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
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

  //Obtaining the global object to use it for generating the first part of the App Integration API's URI (host/ip, app id, sheet id)
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

  /*Creating base part of URL including clearing any leftover
          selections before opening the new page with our selections*/
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
    //Creating the button, its name, its CSS class, and its original text
    $element.html('<table style="height:100%;text-align: center;"><tr><td style="width:20%;">'+button[0].outerHTML+'</td><td style="width:80%;">'+textboxHTMLCode+'</td></tr></table>');
  }

  //If in edit mode, do nothing
  if(window.location.pathname.includes("/state/edit"))
    return;

  //Making sure the maximum selected values in a field is at least one
  var maxValuesSelectedInField = layout.maxSelected;
  maxValuesSelectedInField = maxValuesSelectedInField<1?1:maxValuesSelectedInField;

  //Create a hypercube with the GetCurrentSelections expression
  app.createCube({
    qMeasures : [
      {
        qDef : {
          qDef : "=GetCurrentSelections('"+recordSeparator+"','"+tagSeparator+"','"+valueSeparator+"',"+maxValuesSelectedInField+")"
        }
      }
    ],
    qInitialDataFetch : [{
      qTop : 0,
      qLeft : 0,
      qHeight : 1,
      qWidth : 1
    }]
  }, function(reply) {
    //If the app's reply is not empty
    if(reply.qHyperCube.qDataPages[0].qMatrix[0][0].qText && reply.qHyperCube.qDataPages[0].qMatrix[0][0].qText != '-') {
      //Split the app's reply using the recordSeparator
      var fieldSelections = reply.qHyperCube.qDataPages[0].qMatrix[0][0].qText.split(recordSeparator);
      //If the array of split selected fields is more than zero
      if (fieldSelections.length > 0) {
        //Create a part of the App Integration API's URI responsible for selections
        var selectionPartOfURL = createSelectionURLPart(fieldSelections,tagSeparator,valueSeparator,true);
        if(selectionPartOfURL.tooManySelectionsPossible){
          //If tooManySelections is possible, then create a new hypercube with the number of selections of the suspected fields
          var measuresDef = [];
          selectionPartOfURL.suspectedFields.forEach(function(field){
            var measureDefinition = {
              qDef : {
                qDef : "=GetSelectedCount(["+field+"],True())"
              }
            };
            measuresDef.push(measureDefinition);
          });
          app.createCube({
            qMeasures : measuresDef,
            qInitialDataFetch : [{
              qTop : 0,
              qLeft : 0,
              qHeight : 1,
              qWidth : selectionPartOfURL.suspectedFields.length
            }]
          }, function(reply) {
            var tooManySelectionsMade = false;
            reply.qHyperCube.qDataPages[0].qMatrix[0].forEach(function (suspectedSelection) {
              //check if the number of selected values is > "Max number of values selected in one field" property
              if(parseInt(suspectedSelection.qText) > layout.maxSelected)
                tooManySelectionsMade = true;
            });
            if(tooManySelectionsMade) {
              //If this is the case for at least one field, disable the button
              $("#generateDashboardLink").text("Too Many Selections");
              $("#generateDashboardLink").prop("disabled",true);
            }
            else {
              //Considering it a false alarm (for example some field has actual value that follows the "x of y" pattern); activate the button
              var selectionPartOfURL = createSelectionURLPart(fieldSelections,tagSeparator,valueSeparator,false);
              addOnActivateButtonEvent($element,config,layout,baseURL+selectionPartOfURL.selectionURLPart,layout.emailRecipients,layout.emailTopic,layout.emailBody);
            }
          }); //end of tooManySelections hypercube
        } //end of tooManySelections possibility
        else {
          //If there's no possibility of too many selections, activate the button with the selections part added to the baseURL
          addOnActivateButtonEvent($element,config,layout,baseURL+selectionPartOfURL.selectionURLPart,layout.emailRecipients,layout.emailTopic,layout.emailBody);
        }
      } //end of if split selected fields is zero
      else{
        //If the array of split selected fields is zero, activate the button with no selections added to the baseURL
        addOnActivateButtonEvent($element,config,layout,baseURL,layout.emailRecipients,layout.emailTopic,layout.emailBody);
      }
    } //end of if App Integration API's reply is empty
    else{
      //If the app's reply is empty, activate the button with no selections added to the baseURL
      addOnActivateButtonEvent($element,config,layout,baseURL,layout.emailRecipients,layout.emailTopic,layout.emailBody);
    }
  }); //end of reply and createCube
}

export default paint;
