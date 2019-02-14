import qlik from 'qlik';
import paint from './paint';
import './main.less';

export default {
  definition: {
    type: "items",
    component: "accordion",
    items: {
      appearance: {
        uses: "settings",
        items: {
          selections: {
            show: false
          },
          general: {
            items: {
              showTitles: {
                defaultValue: false
              },
              details: {
                show: false
              }
            }
          }
        }
      },
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
              {
                value: "clipboard",
                label: "Copy To Clipboard Button"
              },
              {
                value: "textbox",
                label: "Copy From Textbox"
              }
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
      about: {
        label: "About",
        component: "items",
        items: {
          header: {
            label: 'Share Button',
            style: 'header',
            component: 'text'
          },
          paragraph1: {
            label: 'A button that creates links so that the current sheet and selections can be shared with others.',
            component: 'text'
          },
          paragraph2: {
            label: 'Share Button is based upon an extension created by Fady Heiba.',
            component: 'text'
          }
        }
      }
    }
  },
  support: {
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
