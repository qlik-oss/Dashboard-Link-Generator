/* eslint-disable */

import qlik from 'qlik';
import $ from 'jquery';
import { addOnActivateButtonEvent, createSelectionURLPart } from './utilities';

const RECORD_SEPARATOR = '&@#$^()';
const TAG_SEPARATOR = '::::';
const VALUE_SEPARATOR = ';;;;';

export default ($scope) => {
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
  $scope.selectedCountCubeIds = [];
  $scope.buttonUrl = baseURL;
  $scope.tooManySelectionsMade = false;
  let maxValuesSelectedInField = Math.max(1, $scope.layout.maxSelected);

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
        if($scope.selectedCountCubeIds.includes(reply.qInfo.qId)) return;

        $scope.selectedCountCubeIds.push(reply.qInfo.qId);
        const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;

        let tooManySelectionsMade = false;
        qMatrix[0].forEach((suspectedSelection) => {
          if (parseInt(suspectedSelection.qText) > maxValuesSelectedInField) {
            tooManySelectionsMade = true;
          }
        });

        $scope.tooManySelectionsMade = tooManySelectionsMade;

        if(!$scope.tooManySelectionsMade) {
          $scope.buttonUrl = baseURL + selectionPartOfURL.selectionURLPart;
        }
      });
  };
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
    }, (reply) => {
      const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;
      const qText = qMatrix[0][0].qText;
      $scope.fieldSelections = (qText && qText != '-') ? qText.split(RECORD_SEPARATOR) : [];
      $scope.selectedCountCubeIds.forEach(id => {
        app.destroySessionObject(id);
      });
      $scope.selectedCountCubeIds = [];
      if ($scope.fieldSelections.length === 0) {
        $scope.buttonUrl = baseURL;
        return;
      }

      const selectionPartOfURL = createSelectionURLPart($scope.fieldSelections, TAG_SEPARATOR, VALUE_SEPARATOR, true);
      if (!selectionPartOfURL.tooManySelectionsPossible) {
        $scope.buttonUrl = baseURL + selectionPartOfURL.selectionURLPart;
        return;
      }

      createSelectedCountCube(selectionPartOfURL);
    }
  );


  setTimeout(() => {
    console.log('moi');
  },3000);
};
