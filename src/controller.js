/* eslint-disable */

import qlik from 'qlik';
import $ from 'jquery';
import { addOnActivateButtonEvent, createSelectionURLPart, copyTextToClipboard } from './utilities';

const RECORD_SEPARATOR = '&@#$^()';
const TAG_SEPARATOR = '::::';
const VALUE_SEPARATOR = ';;;;';

export default ($scope, $element) => {
  const config = {
    host: window.location.hostname,
    prefix: window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1),
    port: window.location.port,
    isSecure: window.location.protocol === "https:"
  };

  const app = qlik.currApp(this);

  let applicationId = app.model.layout.qFileName;
  if (applicationId.substring(applicationId.length - 4) == '.qvf') {
    applicationId = applicationId.slice(0, -4);
  }
  const applicationIdFr = encodeURIComponent(applicationId);
  const CurrentSheet = qlik.navigation.getCurrentSheetId();
  const SheetID = CurrentSheet.sheetId;
  const baseURL = (config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port : "" ) + "/sense/app/" + applicationIdFr + "/sheet/" + SheetID + "/state/analysis/options/clearselections";

  $scope.fieldSelections = [];
  $scope.currentSelectionsCubeId;
  $scope.selectedCountCubeIds = [];
  $scope.buttonUrl = baseURL;
  $scope.textAreaText = '';
  $scope.buttonText;
  $scope.tooManySelectionsMade = false;
  $scope.buttonColor = '';
  $scope.maxValuesSelectedInField = Math.max(1, $scope.layout.maxSelected);
  app.theme.getApplied()
  .then(qTheme => {
    $scope.buttonColor = qTheme.properties.dataColors.primaryColor
  }).catch(exception => {
    console.error(exception); // eslint-disable-line no-console
  });

  const setButtonText = () => {
    if($scope.tooManySelectionsMade) {
      $scope.buttonText = 'Too Many Selections';
    } else {
      $scope.buttonText = $scope.layout.outputMethod === 'clipboard' ? 'Copy Dashboard Link' : 'Generate Link';
    }
  };

  setButtonText();

  const createSelectedCountCube = (selectionPartOfURL) => {
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
      }, (reply) => {
        if(!$scope.selectedCountCubeIds.includes(reply.qInfo.qId)){
          $scope.selectedCountCubeIds.push(reply.qInfo.qId);
        }

        const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;

        let tooManySelectionsMade = false;
        // let maxValuesSelectedInField = Math.max(1, $scope.layout.maxSelected);
        qMatrix[0].forEach((suspectedSelection) => {
          if (parseInt(suspectedSelection.qText) > $scope.maxValuesSelectedInField) {
            tooManySelectionsMade = true;
          }
        });

        $scope.tooManySelectionsMade = tooManySelectionsMade;

        if(!$scope.tooManySelectionsMade) {
          const newSelectionPartOfURL = createSelectionURLPart($scope.fieldSelections, TAG_SEPARATOR, VALUE_SEPARATOR, false);
          $scope.buttonUrl = baseURL + newSelectionPartOfURL.selectionURLPart;
        }

        setButtonText();
      });
  };

  const createCurrentSelectionsCube = () => {
    app.createCube(
      {
        qMeasures: [{
          qDef: {
            qDef: "=GetCurrentSelections('" + RECORD_SEPARATOR + "','" + TAG_SEPARATOR + "','" + VALUE_SEPARATOR + "'," + $scope.maxValuesSelectedInField + ")"
          }
        }],
        qInitialDataFetch: [{
          qTop: 0,
          qLeft: 0,
          qHeight: 1,
          qWidth: 1
        }]
      }, (reply) => {
        $scope.currentSelectionsCubeId = reply.qInfo.qId;
        const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;
        const qText = qMatrix[0][0].qText;
        $scope.fieldSelections = (qText && qText != '-') ? qText.split(RECORD_SEPARATOR) : [];
        $scope.selectedCountCubeIds.forEach(id => {
          app.destroySessionObject(id);
        });
        $scope.selectedCountCubeIds = [];
        if ($scope.fieldSelections.length === 0) {
          $scope.buttonUrl = baseURL;
          $scope.tooManySelectionsMade = false;
          setButtonText();
          return;
        }

        const selectionPartOfURL = createSelectionURLPart($scope.fieldSelections, TAG_SEPARATOR, VALUE_SEPARATOR, true);
        if (!selectionPartOfURL.tooManySelectionsPossible) {
          $scope.buttonUrl = baseURL + selectionPartOfURL.selectionURLPart;
          $scope.tooManySelectionsMade = false;
          setButtonText();
          return;
        }

        createSelectedCountCube(selectionPartOfURL);
      }
    );
  };

  createCurrentSelectionsCube();

  $scope.$watch('layout.maxSelected', (newMaxSelected, oldMaxSelected) => {
    if(newMaxSelected !== oldMaxSelected) {
      $scope.maxValuesSelectedInField = Math.max(1, newMaxSelected);
      app.destroySessionObject($scope.currentSelectionsCubeId);
      createCurrentSelectionsCube();
    }
  });
  $scope.$watch('layout.outputMethod', (newOutputMethod, oldOutputMethod) => {
    if(newOutputMethod !== oldOutputMethod) {
      setButtonText();
    }
  });

  $scope.buttonClick = () => {
    if($scope.options.interactionState === 1) {
      if ($scope.layout.outputMethod === 'clipboard'){

        copyTextToClipboard($scope.buttonUrl);

      } else if ($scope.layout.outputMethod === 'textbox') {

        $scope.textAreaText = $scope.buttonUrl;
        var copyTextarea = $element.find('.linkTextboxArea');
        copyTextarea.select();
        try {
          document.execCommand('copy');
        }
        catch (err) {
          console.log(err); // eslint-disable-line no-console
        }

      }

      $scope.buttonText = 'Copied To Clipboard!';
      //Waiting for 1.5 seconds and resetting the button's text so that users are not discouraged to make new selections and generate new links
      setTimeout(function(){
        setButtonText();
      },1500);
    }
  };
};
