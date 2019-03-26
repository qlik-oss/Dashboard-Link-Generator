import $ from 'jquery';
import qlik from 'qlik';

const RECORD_SEPARATOR = '&@#$^()';
const TAG_SEPARATOR = '::::';
const VALUE_SEPARATOR = ';;;;';
const LISTENER_NAMESPACE = "dashboard-link-generator";

const TOO_MANY_SELECTIONS_BTN_LABEL = "Too Many Selections";
const COPY_BTN_LABEL = "Copy Dashboard Link";
const GENERATE_BTN_LABEL = "Generate Link";
const COPY_SUCCESS_LABEL = "Copied To Clipboard!";
const GENERATE_SUCCESS_LABEL = "Link Generated!";

class ShareButtonView {
  constructor(id) {
    this.id = id;
    this.selectionCountCubeId = null;
    this.maxValuesSelectedInField = 0;
    this.suspectedCountCubeId = null;
    this.suspectedFieldCount = 0;
    this.selectionUrl = '';

    this.isInEdit = false;
    this.isTooManySelections = false;
    this.isTextBoxMode = false;
    this.isSuccessMessageActive = false;
  }

  //Updates the button state based on the current component state.
  updateButtonState() {
    let buttonId = `#${this.id}-generateDashboardLink`;
    let button = $(`${buttonId}`);
    button.parent().off(`click.${LISTENER_NAMESPACE}`, `${buttonId}:enabled`);

    if (this.isTooManySelections) {
      button.text(TOO_MANY_SELECTIONS_BTN_LABEL);
    } else if (this.isSuccessMessageActive) {
      button.text(this.isTextBoxMode ? GENERATE_SUCCESS_LABEL : COPY_SUCCESS_LABEL);
    } else {
      button.text(this.isTextBoxMode ? GENERATE_BTN_LABEL : COPY_BTN_LABEL);
      if (!this.isInEdit) {
        var self = this;
        button.parent().on(`click.${LISTENER_NAMESPACE}`, `${buttonId}:enabled`, function () {
          self.setAndCopyUrl(self.selectionUrl);
          self.showSuccess();
          window.onbeforeunload = null;
          return false;
        });
      }
    }
  }

  // Updates the too-many-selection value.
  setTooManySelections(isTooMany) {
    this.isTooManySelections = isTooMany;
    this.updateButtonState();
  }

  // Shows the success message for a breif moment.
  showSuccess() {
    var self = this;
    self.isSuccessMessageActive = true;
    self.updateButtonState();
    setTimeout(function () {
      self.isSuccessMessageActive = false;
      self.updateButtonState();
    }, 1500);
  }

  // Creates the url from the current selections.
  createSelectionURLPart(fieldSelections, checkForTooManySelections) {
    var returnObject = {
      selectionURLPart: "",
      tooManySelectionsPossible: false,
      suspectedFields: []
    };
    fieldSelections.forEach(function (item) {
      //If this function is instructed to check for tooManySelections, it checks if the selection
      // contains the keywords of, ALL, or NOT, indicating that the selection is not in the 'x of y values' format
      if (checkForTooManySelections
        && (item.indexOf(" of ") !== -1 || item.indexOf("ALL") !== -1 || item.indexOf("NOT") !== -1)
        && item.split(VALUE_SEPARATOR).length == 1) {
        returnObject.tooManySelectionsPossible = true;
        returnObject.suspectedFields.push(item.split(TAG_SEPARATOR)[0]);
      }
      //Otherwise it just creates the selections part of the URL
      else {
        returnObject.selectionURLPart += "/select/" + encodeURIComponent(item.split(TAG_SEPARATOR)[0])
          + "/" + encodeURIComponent(item.split(TAG_SEPARATOR)[1].replace(TAG_SEPARATOR, ";"));
        const splitForBrackets = returnObject.selectionURLPart.split("%3B%3B%3B%3B");
        returnObject.selectionURLPart = splitForBrackets.join("%3B");
        // Handle specific characters
        returnObject.selectionURLPart.replace(/\*/g, '%2A');
      }
    });
    return returnObject;
  }

  // Sets the given url to a textbox (which is hidden if not in textbox-mode) and copies the url to
  // the clipboard.
  setAndCopyUrl(url) {
    var textArea = null;
    if (this.isTextBoxMode) {
      textArea = document.querySelector(`#${this.id}-textbox`);
    } else {
      // Create hidden textbox

      textArea = document.createElement("textarea");

      // *** This styling is an extra step which is likely not required. ***
      //
      // Why is it here? To ensure:
      // 1. the element is able to have focus and selection.
      // 2. if element was to flash render it has minimal visual impact.
      // 3. less flakyness with selection and copying which **might** occur if
      //    the textarea element is not visible.
      //
      // The likelihood is the element won't even render, not even a flash,
      // so some of these are just precautions. However in IE the element
      // is visible whilst the popup box asking the user for permission for
      // the web page to copy to the clipboard.
      //

      // Place in top-left corner of screen regardless of scroll position.
      textArea.style.position = 'fixed';
      textArea.style.top = 0;
      textArea.style.left = 0;

      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = '2em';
      textArea.style.height = '2em';

      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = 0;

      // Clean up any borders.
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';

      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
    }

    textArea.value = url;
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.log(err); // eslint-disable-line no-console
    }

    if (!this.isTextBoxMode) {
      document.body.removeChild(textArea);
    }
  }

  paint(app, $element, layout, qTheme) {
    var config = {
      host: window.location.hostname,
      prefix: window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1),
      port: window.location.port,
      isSecure: window.location.protocol === "https:"
    };

    //Getting the current application
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
    var baseURL = (config.isSecure ? "https://" : "http://") + config.host
      + (config.port ? ":" + config.port : "") + "/sense/app/" + applicationIdFr
      + "/sheet/" + SheetID + "/state/analysis/options/clearselections";

    let button = $(`<button
      id="${this.id}-generateDashboardLink"
      class="dashboardLinkGenerator"
      style="background-color: ${qTheme.properties.dataColors.primaryColor};"/>`);

    // If the user choose to output the link to clipboard only create a button, otherwise create a
    // textbox as well
    if (layout.outputMethod == "clipboard") {
      $element.html(button);
    } else if (layout.outputMethod == "textbox") {
      var textboxHTMLCode = `<textarea id="${layout.qInfo.qId}-textbox" class="linkTextboxArea" type="text"
      readOnly="true" style="height: 90%;width: 90%;font-size: 10px;" value="0"/>`;
      $element.html(`<table style="height:100%;text-align: center;"><tr><td style="width:20%;">
      ${button[0].outerHTML}</td><td style="width:80%;">${textboxHTMLCode}</td></tr></table>`);
    }

    this.isInEdit = $element.parent().scope().object.getInteractionState() === 2;
    this.isTextBoxMode = layout.outputMethod === "textbox";
    this.updateButtonState();

    const newMaxValuesSelectedInField = Math.max(1, layout.maxSelected);
    if (newMaxValuesSelectedInField == this.maxValuesSelectedInField) {
      // Already created selection-count cube for this
      return;
    }
    this.maxValuesSelectedInField = newMaxValuesSelectedInField;

    if (this.selectionCountCubeId) {
      // Destroy previous selection-count cube
      app.destroySessionObject(this.selectionCountCubeId);
      this.selectionCountCubeId = null;
    }

    //Create a hypercube with the GetCurrentSelections expression
    app.createCube(
      {
        qMeasures: [{
          qDef: {
            qDef: "=GetCurrentSelections('" + RECORD_SEPARATOR + "','" + TAG_SEPARATOR + "','"
              + VALUE_SEPARATOR + "'," + this.maxValuesSelectedInField + ")"
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
        this.selectionCountCubeId = reply.qInfo.qId;
        const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;
        const qText = qMatrix[0][0].qText;

        const fieldSelections = (qText && qText != '-') ? qText.split(RECORD_SEPARATOR) : [];
        if (fieldSelections.length === 0) {
          this.setTooManySelections(false);
          this.selectionUrl = baseURL;
          return;
        }

        const selectionPartOfURL = this.createSelectionURLPart(fieldSelections, true);
        if (!selectionPartOfURL.tooManySelectionsPossible) {
          this.setTooManySelections(false);
          if (this.suspectedCountCubeId) {
            app.destroySessionObject(this.suspectedCountCubeId);
            this.suspectedCountCubeId = null;
          }
          this.suspectedFieldCount = 0;
          this.selectionUrl = baseURL + selectionPartOfURL.selectionURLPart;
          return;
        }

        if (this.suspectedCountCubeId
          && this.suspectedFieldCount == selectionPartOfURL.suspectedFields.length) {
          // Already have a selection-count-cube, for these fields, so no need to create a new
          return;
        }

        if (this.suspectedCountCubeId) {
          // Destroy current select-count-cube before creating a new one
          app.destroySessionObject(this.suspectedCountCubeId);
          this.suspectedCountCubeId = null;
          this.suspectedFieldCount = 0;
        }

        // Create a new hypercube with the number of selections of the suspected fields
        this.suspectedFieldCount = selectionPartOfURL.suspectedFields.length;
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
              qWidth: this.suspectedFieldCount
            }]
          },
          reply => {
            if (this.suspectedFieldCount == 0) {
              // No longer any suspected fields, so this is about to be destroyed
              return;
            }

            this.suspectedCountCubeId = reply.qInfo.qId;
            const qMatrix = reply.qHyperCube.qDataPages[0].qMatrix;
            const tooManySelectionsMade = qMatrix[0].some(suspectedSelection => (
              parseInt(suspectedSelection.qText) > layout.maxSelected
            ));
            if (tooManySelectionsMade) {
              // If this is the case for at least one field, disable the button
              this.setTooManySelections(true);
            }
          });
      });
  }
}

export default ShareButtonView;
