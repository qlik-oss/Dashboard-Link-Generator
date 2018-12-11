// import qlik from 'qlik';
// import paint from './paint';
import './main.less';
import controller from './controller';
import template from './template.html';

export default {
  definition: {
    type: "items",
    component: "accordion",
    items: {
      exportSettings: {
        type: "items",
        label: "Export Settings",
        items: {
          outputMethod: {
            ref: "outputMethod",
            component: "radiobuttons",
            type: "string",
            label: "Output Method",
            options: [
              { value: "clipboard",
                label: "Copy To Clipboard Button" },
              { value: "textbox",
                label: "Copy From Textbox" }

            ],
            defaultValue: "clipboard",
          },
          maxSelected: {
            ref: "maxSelected",
            type: "integer",
            label: "Max Values Selected in One Field",
            defaultValue: "100",
            min: 1
          }
        }
      }
    }
  },
  support:{
    exportData: false
  },
  template: template,
  controller: ['$scope', '$element', controller],
};
