import $ from 'jquery';

const LISTENER_NAMESPACE = "dashboard-link-generator";

//Helper function for creating App Integration API's URI part responsible for selections
export function createSelectionURLPart (fieldSelections,tagSeparator,valueSeparator,checkForTooManySelections) {
  var returnObject = {
    selectionURLPart : "",
    tooManySelectionsPossible : false,
    suspectedFields : []
  };
  fieldSelections.forEach(function (item) {
    //If this function is instructed to check for tooManySelections, it checks if the selection contains the keywords of, ALL, or NOT, indicating that the selection is not in the 'x of y values' format
    if (checkForTooManySelections && (item.includes(" of ") || item.includes("ALL") || item.includes("NOT")) && item.split(valueSeparator).length == 1) {
      returnObject.tooManySelectionsPossible = true;
      returnObject.suspectedFields.push(item.split(tagSeparator)[0]);
    }
    //Otherwise it just creates the selections part of the URL
    else {
      returnObject.selectionURLPart += "/select/"+encodeURIComponent(item.split(tagSeparator)[0]) + "/" + encodeURIComponent(item.split(tagSeparator)[1].replace(tagSeparator,";"));
      const splitForBrackets = returnObject.selectionURLPart.split("%3B%3B%3B%3B");
      returnObject.selectionURLPart = splitForBrackets.join("%3B").replace(/\*/g, '');
    }
  });
  return returnObject;
}

//Helper funciton for adding on a "qv-activate" event of button/link
export function addOnActivateButtonEvent ($element,config,layout,url,recipient,topic,body) {
  var encodedURL = encodeURIComponent(url);
  $("#generateDashboardLink").off(`qv-activate.${LISTENER_NAMESPACE}`);
  $("#generateDashboardLink").on(`qv-activate.${LISTENER_NAMESPACE}`, function () {
    var finalURL = encodedURL;

    if(layout.outputMethod == "email"){
      //Opening a new email with the user settings' input subject, the dashboard generated link, and the user settings' input body
      window.location.href = 'mailto:' + recipient + '?subject=' + topic + '&body=' + body + " " + "%0D%0A" + "%0D%0A" + encodedURL + "%0D%0A" + "%0D%0A" + "%0D%0A" + "http://www.qlik.com";
    }
    else if(layout.outputMethod == "clipboard"){
      $('.dashboardLinkGenerator').off(`click.${LISTENER_NAMESPACE}`);
      $('.dashboardLinkGenerator').on(`click.${LISTENER_NAMESPACE}`, function() {
        copyTextToClipboard(url);

      });
      //Changing the button's text temporarily to mark success
      document.getElementById('generateDashboardLink').innerHTML= "Copied To Clipboard!";
      //Waiting for 1.5 seconds and resetting the button's text so that users are not discouraged to make new selections and generate new links
      setTimeout(function(){
        document.getElementById('generateDashboardLink').innerHTML= "Copy Dashboard Link";
      },1500);
    }
    else if(layout.outputMethod == "textbox"){
      //Adding the dashboard generated link to the textbox
      document.getElementById('textbox').value = decodeURIComponent(finalURL);

      //Copying the textbox's text (which we just added the generated link to)
      $('.dashboardLinkGenerator').off(`click.${LISTENER_NAMESPACE}`);
      $('.dashboardLinkGenerator').on(`click.${LISTENER_NAMESPACE}`, function() {
        var copyTextarea = document.querySelector('.linkTextboxArea');
        copyTextarea.select();
        try {
          document.execCommand('copy');
        }
        catch (err) {
          console.log(err); // eslint-disable-line no-console
        }
      });
      //Changing the button's text temporarily to mark success
      document.getElementById('generateDashboardLink').innerHTML= "Copied To Clipboard!";
      //Waiting for 1.5 seconds and resetting the button's text so that users are not discouraged to make new selections and generate new links
      setTimeout(function(){
        document.getElementById('generateDashboardLink').innerHTML= "Generate Link";
      },1500);
    }
    window.onbeforeunload = null;
    return false;
  });
  $("#generateDashboardLink").prop("disabled",false);
}

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

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


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.log(err); // eslint-disable-line no-console
  }

  document.body.removeChild(textArea);
}
