import ReactDOM from 'react-dom';
import { DESTROYED_ERR_MSG, DEFAULT_LANG } from './constants.js';
import { debounce, flatten, cloneDeep } from './helper.js';
import {
  Template,
  Size,
  Lang,
  Font,
  Plugins,
  UIProps,
  UIOptions,
  PreviewProps,
  getDefaultFont,
  checkUIProps,
  checkTemplate,
  checkInputs,
  checkUIOptions,
  checkPreviewProps,
} from '@pdfme/common';
import { builtInPlugins } from '@pdfme/schemas';

const generateColumnsAndSampledataIfNeeded = (template: Template) => {
  const { schemas, columns, sampledata } = template;

  const flatSchemaLength = schemas
    .map((schema) => Object.keys(schema).length)
    .reduce((acc, cur) => acc + cur, 0);

  const needColumns = !columns || flatSchemaLength !== columns.length;

  const needSampledata = !sampledata || flatSchemaLength !== Object.keys(sampledata[0]).length;

  // columns
  if (needColumns) {
    template.columns = flatten(schemas.map((schema) => Object.keys(schema)));
  }

  // sampledata
  if (needSampledata) {
    template.sampledata = [
      schemas.reduce(
        (acc, cur) =>
          Object.assign(
            acc,
            Object.keys(cur).reduce(
              (a, c) => Object.assign(a, { [c]: '' }),
              {} as { [key: string]: string }
            )
          ),
        {} as { [key: string]: string }
      ),
    ];
  }

  return template;
};

export abstract class BaseUIClass {
  protected domContainer!: HTMLElement | null;

  protected template!: Template;

  protected size!: Size;

  private lang: Lang = DEFAULT_LANG;

  private font: Font = getDefaultFont();

  private pluginsRegistry: Plugins = builtInPlugins;

  private options = {};

  private readonly setSize = debounce(() => {
    if (!this.domContainer) throw Error(DESTROYED_ERR_MSG);
    this.size = {
      height: this.domContainer.clientHeight || window.innerHeight,
      width: this.domContainer.clientWidth || window.innerWidth,
    };
    this.render();
  }, 100);

  resizeObserver = new ResizeObserver(this.setSize);

  constructor(props: UIProps) {
    checkUIProps(props);

    const { domContainer, template, options = {}, plugins = {} } = props;
    this.domContainer = domContainer;
    this.template = generateColumnsAndSampledataIfNeeded(cloneDeep(template));
    this.options = options;
    this.size = {
      height: this.domContainer!.clientHeight || window.innerHeight,
      width: this.domContainer!.clientWidth || window.innerWidth,
    };
    this.resizeObserver.observe(this.domContainer!);

    const { lang, font } = options;
    if (lang) {
      this.lang = lang;
    }
    if (font) {
      this.font = font;
    }

    if (Object.values(plugins).length > 0) {
      this.pluginsRegistry = plugins;
    }
  }

  protected getLang() {
    return this.lang;
  }

  protected getFont() {
    return this.font;
  }

  protected getPluginsRegistry() {
    return this.pluginsRegistry;
  }

  protected getOptions() {
    return this.options;
  }

  public getTemplate() {
    if (!this.domContainer) throw Error(DESTROYED_ERR_MSG);

    return this.template;
  }

  public updateTemplate(template: Template) {
    checkTemplate(template);
    if (!this.domContainer) throw Error(DESTROYED_ERR_MSG);

    this.template = cloneDeep(template);
    this.render();
  }

  public updateOptions(options: UIOptions) {
    checkUIOptions(options);
    const { lang, font } = options || {};

    if (lang) {
      this.lang = lang;
    }
    if (font) {
      this.font = font;
    }
    this.options = Object.assign(this.options, options);
    this.render();
  }

  public destroy() {
    if (!this.domContainer) throw Error(DESTROYED_ERR_MSG);
    ReactDOM.unmountComponentAtNode(this.domContainer);

    this.resizeObserver.unobserve(this.domContainer);
    this.domContainer = null;
  }

  protected abstract render(): void;
}
export abstract class PreviewUI extends BaseUIClass {
  protected inputs!: { [key: string]: string }[];

  constructor(props: PreviewProps) {
    super(props);
    checkPreviewProps(props);

    this.inputs = cloneDeep(props.inputs);
  }

  public getInputs() {
    if (!this.domContainer) throw Error(DESTROYED_ERR_MSG);

    return this.inputs;
  }

  public setInputs(inputs: { [key: string]: string }[]) {
    if (!this.domContainer) throw Error(DESTROYED_ERR_MSG);
    checkInputs(inputs);
    this.inputs = cloneDeep(inputs);
    this.render();
  }

  protected abstract render(): void;
}
