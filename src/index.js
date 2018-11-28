import qlik from 'qlik';
import paint from './paint';
import './main.less';

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
              { value: "email",
                label: "Create New Email Button" },
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
      },
      emailOptions: {
        type: "items",
        label: "E-mail Settings",
        items: {
          emailRecipients: {
            ref: "emailRecipients",
            type: "string",
            label: "Recipients",
            defaultValue: "",
            show: false
          },
          emailTopic: {
            ref: "emailTopic",
            type: "string",
            label: "E-mail Subject",
            defaultValue: "Link to Qlik Sense application"
          },

          emailBody: {
            ref: "emailBody",
            type: "string",
            label: "E-mail Body",
            expression: "optional",
            defaultValue: "Thought you might be interested in seeing this: ",
            show: true
          }
        }
      }
    }
  },
  support:{
    exportData: false
  },
  paint: ($element, layout) => {
    const component = this;
    const app = qlik.currApp(this);
    app.theme.getApplied()
      .then(qTheme => {
        paint($element, layout, component, qTheme);
      }).catch(exception => {
        console.error(exception); // eslint-disable-line no-console
      });
  }
};
