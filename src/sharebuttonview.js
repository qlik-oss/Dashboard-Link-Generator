import $ from 'jquery';
import qlik from 'qlik';

const LISTENER_NAMESPACE = "dashboard-link-generator";

const COPY_BTN_LABEL = "Copy Dashboard Link";
const PROCESSING_BTN_LABEL = "Processing...";
const TOO_MANY_SELECTIONS_BTN_LABEL = "Too Many Selections";
const GENERATE_BTN_LABEL = "Generate Link";
const COPY_SUCCESS_LABEL = "Copied To Clipboard!";
const GENERATE_SUCCESS_LABEL = "Link Generated!";

class ShareButtonView {
  constructor(app, id) {
    this.id = id;
    this.selectionCountCubeId = null;
    this.maxValuesSelectedInField = 0;
    this.suspectedCountCubeId = null;
    this.suspectedFieldCount = 0;
    this.selectionUrl = '';

    this.isInEdit = false;
    this.isProcessing = false;
    this.isTooManySelections = false;
    this.isTextBoxMode = false;
    this.isSuccessMessageActive = false;

    var self = this;
    this.selState = app.selectionState();
    var listener = function () {
      self.onSelectionChanged(app);
    };
    this.selState.OnData.bind(listener);

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
    var origin = window.location.href.substr(0, window.location.href.indexOf('/sense/app'));   
    this.baseURL = origin + "/sense/app/" + applicationIdFr
      + "/sheet/" + SheetID + "/state/analysis/options/clearselections";
  }

  //Updates the button state based on the current component state.
  updateButtonState() {
    let buttonId = `#${this.id}-generateDashboardLink`;
    let button = $(`${buttonId}`);
    button.parent().off(`click.${LISTENER_NAMESPACE}`, `${buttonId}:enabled`);

    if (this.isProcessing) {
      button.text(PROCESSING_BTN_LABEL);
    } else if (this.isTooManySelections) {
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

  // Updates the is-processing value.
  setProcessing(isProcessing) {
    this.isProcessing = isProcessing;
    this.updateButtonState();
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

  getSelectionsForFieldAsync(app, fieldSelection) {
    var self = this;
    var fieldDef = fieldSelection.qField;
    self.setProcessing(true);
    var df = $.Deferred();

    // Fetch actual data for all selections of the field. Need to do this since the shown values
    // aren't the actual data and might not be a working selected in some cases.
    // For instance, dates.
    var isNumeric = false;    
    var fetchSelections = function (selection) {
      if (selection.length >= fieldSelection.qSelectedCount) {
        // Found all selections
        return selection;
      }      
      //if it is a derived field
      if (fieldSelection.qField.startsWith('=')) {
        fieldDef = fieldSelection.qReadableName;
      }    

      // Still some selections left to fetch. Can only fetch 10k per call.
      return app.createCube({
        qDimensions: [{
          qDef: {
            qFieldDefs: [fieldDef]
          }
        }],
        qInitialDataFetch : [{
          qTop : selection.length,
          qLeft : 0,
          qHeight : 10000,
          qWidth : 1
        }]
      }).then(function (model) {
        // Extract element numbers from matrix
        var matrix = model.layout.qHyperCube.qDataPages[0].qMatrix;
        app.destroySessionObject(model.layout.qInfo.qId);
        for (var i = 0; i < matrix.length; i++) {
          var selectionData = matrix[i].map(function (item) {
            if (isNumeric) {
              return item.qNum;
            }
            if (!isNaN(item.qNum)) {
              isNumeric = true;
              return item.qNum;
            }
            return item.qText;
          });
          selection = selection.concat(selectionData);
        }
        return fetchSelections(selection);
      });
    };

    fetchSelections([]).then(function (selections) {
      self.setProcessing(false);
      df.resolve({
        fieldName: fieldDef,
        values: selections
      });
    });

    return df;
  }

  // Creates the url from the current selections.
  onSelectionChanged(app) {
    var self = this;
    const currentSelectionProps = {
      qInfo: {
        qId: 'CurrentSelection',
        qType: 'CurrentSelection',
      },
      qSelectionObjectDef: {},
    };   
    app.model.getOrCreateSessionObject(currentSelectionProps).then((sessionObj) => {
      return sessionObj.getLayout().then((currentSelectionsObj) => {
      // First make sure there aren't too many selections
        const selections = currentSelectionsObj.qSelectionObject.qSelections;
        for (var key in selections) {
          if (selections[key].qSelectedCount > self.maxSelected) {
            self.setTooManySelections(true);
            return;
          }
        }
        self.setTooManySelections(false);

        var tasks = selections.map(function (selection) {
          return self.getSelectionsForFieldAsync(app, selection)
            .then(function (selectionDataForField) {
              return `/select/${encodeURIComponent(selectionDataForField.fieldName)}/`
                + `${encodeURIComponent(selectionDataForField.values.join(';'))}`
                  .replace(/\*/g, '%2A');
            });
        });      
        return Promise.all(tasks).then(function (urls) {
          self.selectionUrl = self.baseURL
            + (urls.length > 0 ? urls.reduce(function (pre, curr) { return pre + curr; }) : '');
        });
      });
    });
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
    if (this.maxSelected !== layout.maxSelected) {
      var needUpdate = !!this.maxSelected;
      this.maxSelected = layout.maxSelected;
      if (needUpdate) {
        this.onSelectionChanged(app);
      }
    }

    let button = $(`<button
      id="${this.id}-generateDashboardLink"
      class="dashboardLinkGenerator"
      style="background-color: ${qTheme.properties.dataColors.primaryColor};"/>`);

    // If the user choose to output the link to clipboard only create a button, otherwise create a
    // textbox as well
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(navigator.userAgent);
    this.isTextBoxMode = layout.outputMethod === "textbox" && !isMobile;
    if (!this.isTextBoxMode) {
      $element.html(button);
    } else {
      var textboxHTMLCode = `<textarea id="${layout.qInfo.qId}-textbox" class="linkTextboxArea" type="text"
      readOnly="true" style="height: 90%;width: 90%;font-size: 10px;" value="0"/>`;
      $element.html(`<table style="height:100%;text-align: center;"><tr><td style="width:20%;">
      ${button[0].outerHTML}</td><td style="width:80%;">${textboxHTMLCode}</td></tr></table>`);
    }

    this.isInEdit = $element.parent().scope().object.getInteractionState() === 2;
    this.updateButtonState();
  }
}

export default ShareButtonView;
