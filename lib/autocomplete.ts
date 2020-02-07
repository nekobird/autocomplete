import {
  hasAncestor,
  toHTMLElementArray,
} from '@nekobird/doko';

type HTMLListElement = HTMLOListElement | HTMLUListElement;

type AutocompleteData = [string, string][];

interface AutocompleteConfig {
  defaultValue: string;

  getGroupElement: () => HTMLElement | null;
  getInputElement: () => HTMLInputElement | null;
  getActualInputElement: () => HTMLInputElement | null;
  getListElement: () => HTMLListElement | null;

  prepareListItemElement: (item: HTMLLIElement) => void;
  prepareListItemAnchorElement: (a: HTMLAnchorElement) => void;

  activateList: (list: HTMLListElement) => void;
  deactivateList: (list: HTMLListElement) => void;

  activateListItem: (item: HTMLLIElement) => void;  
  deactivateListItem: (item: HTMLLIElement) => void;

  onInputSelected: (label: string, value: string) => void;
  onInputRemoved: () => void;
}

const AUTOCOMPLETE_DEFAULT_CONFIG: AutocompleteConfig = {
  defaultValue: '',

  getGroupElement: () => null,
  getInputElement: () => null,
  getActualInputElement: () => null,
  getListElement: () => null,

  prepareListItemElement: item => item.classList.add('item'),
  prepareListItemAnchorElement: a => a,

  activateList: list => list.classList.add('list--active'),
  deactivateList: list => list.classList.remove('list--active'),

  activateListItem: list => list.classList.add('item--active'),
  deactivateListItem: item => item.classList.remove('item--active'),

  onInputSelected: value => {},
  onInputRemoved: () => {},
};

interface AutocompleteElements {
  group: HTMLElement | null;
  input: HTMLInputElement | null;
  actualInput: HTMLInputElement | null;
  list: HTMLListElement | null;
}

class Autocomplete {
  public config: AutocompleteConfig;

  public isListening: boolean = false;

  // Elements
  public elements: AutocompleteElements;
  private elementsAreSet: boolean = false;

  public listData: AutocompleteData;

  // List
  public listIsActive: boolean = false;
  public listItemIsActive: boolean = false;
  public activeListItemIndex: number = 0;

  public inputIsFocused: boolean = false;

  public data: AutocompleteData;

  constructor(data: AutocompleteData = [], config: Partial<AutocompleteConfig>) {
    this.config = { ...AUTOCOMPLETE_DEFAULT_CONFIG };

    this.setConfig(config);

    this.elements = {
      group: null,
      input: null,
      actualInput: null,
      list: null,
    };

    this.data = [...data];
    this.listData = [];

    this.getElements();
    this.listen();
    this.initialize();
  }

  public setConfig(config: Partial<AutocompleteConfig>): AutocompleteConfig {
    typeof config === 'object'
      && Object.assign(this.config, config);
    return this.config;
  }

  private initialize() {
    const value = this.elements.input?.value;
    this.clearActualInput();
    value && this.searchAndUpdateList(value);
  }

  public updateData(data: AutocompleteData) {
    if (Array.isArray(data)) {
      this.data = [...data];
      this.assignValue('', '');
      this.deactivateList();
    }
  }

  public getElements(): boolean {
    this.stopListening();

    const groupElement       = this.config.getGroupElement();
    const inputElement       = this.config.getInputElement();
    const actualInputElement = this.config.getActualInputElement();
    const listElement        = this.config.getListElement();

    if (
         groupElement
      && groupElement instanceof HTMLElement
      && inputElement
      && inputElement instanceof HTMLInputElement
      && actualInputElement
      && actualInputElement instanceof HTMLInputElement
      && listElement
      && (
           listElement instanceof HTMLOListElement
        || listElement instanceof HTMLUListElement
      )
    ) {
      this.elements.group = groupElement;
      this.elements.input = inputElement;
      this.elements.actualInput = actualInputElement;
      this.elements.list = listElement;
      this.elementsAreSet = true;
      return true;
    }

    this.elementsAreSet = false;
    return false;
  }

  public assignValue(label?: string, value?: string): void {
    const _value = value || this.config.defaultValue
    if (
         this.elements.input
      && this.elements.actualInput
      && typeof label === 'string'
      && typeof value === 'string'
      && (
           this.elements.input.value !== label
        || this.elements.actualInput.value !== _value
      )
    ) {
      this.elements.input.value = label;
      this.elements.actualInput.value = _value;

      label
        ? this.config.onInputSelected(label, _value)
        : this.config.onInputRemoved();

      return;
    }
  }

  // List Items
  private deactivateAllListItemsFromConfig() {
    if (this.elements.list) {
      const items = this.elements.list.querySelectorAll('li');
      if (items) {
        items.forEach(
          item => typeof this.config.deactivateListItem === 'function'
            && this.config.deactivateListItem(item)
        );
      }
    }
  }

  private activateListItem(): void {
    if (this.elements.list) {
      const items = toHTMLElementArray(this.elements.list.querySelectorAll('li'));

      if (this.listIsActive && items.length) {

        if (this.activeListItemIndex > items.length - 1) {
          this.activeListItemIndex = 0;
        } else if (this.activeListItemIndex < 0) {
          this.activeListItemIndex = items.length - 1;
        }

        if (items && Array.from(items)[this.activeListItemIndex]) {
          this.deactivateAllListItemsFromConfig();
          this.config.activateListItem(items[this.activeListItemIndex] as HTMLLIElement);
          this.listItemIsActive = true;
        }
      }
    }
  }

  private deactivateListItems(): void {
    if (this.elements.list) {
      this.deactivateAllListItemsFromConfig();
      this.listItemIsActive = false;
      this.activeListItemIndex = 0;
    }
  }

  private getActiveListItem(): HTMLLIElement | null {
    if (this.listItemIsActive && this.elements.list) {
      const items = this.elements.list.querySelectorAll('li');
      return toHTMLElementArray(items)[this.activeListItemIndex] as HTMLLIElement || null;
    }
    return null;
  }

  private goUpListItem() {
    if (this.listItemIsActive) {
      this.activeListItemIndex--;
      this.activateListItem();
    }
  }

  private goDownListItem() {
    this.listItemIsActive
      ? this.activeListItemIndex++
      : this.activeListItemIndex = 0;
    this.activateListItem();
  }

  // List
  private deactivateList(): void {
    if (this.elements.list) {
      // Deactivate active List Items first
      this.deactivateListItems();

      // Deactivate List.
      this.config.deactivateList(this.elements.list);
      this.elements.list.innerHTML = '';
      this.listIsActive = false;
    }
  }

  private activateList() {
    if (this.elements.list) {
      this.config.deactivateList(this.elements.list);

      this.elements.list.innerHTML = '';

      this.listData.forEach(([label, value]) => {
        // list item
        const item = document.createElement('li');
        item.setAttribute('data-label', label);
        item.setAttribute('data-value', value);
        typeof this.config.prepareListItemElement === 'function'
          && this.config.prepareListItemElement(item);

        // anchor
        const a = document.createElement('a');
        a.setAttribute('data-label', label);
        a.setAttribute('data-value', value);
        a.textContent = label;
        typeof this.config.prepareListItemAnchorElement === 'function'
          && this.config.prepareListItemAnchorElement(a);
        
        a.addEventListener('click', event => {
          event.preventDefault();
          this.assignValue(item.dataset.label, item.dataset.value);
          this.deactivateList();
        }, true);

        item.appendChild(a);

        // Append item to list.
        this.elements.list && this.elements.list.appendChild(item);
      });

      this.config.activateList(this.elements.list);
      this.listIsActive = true;
    }
  }

  private updateListWithAllData() {
    if (this.elements.list) {
      this.listData = [...this.data];
      this.activateList();
    }
  }

  private searchAndUpdateList(searchString: string) {
    const _searchString = searchString.trim().toLowerCase();
    if (_searchString) {
      const matchedResult = this.data.find(([label]) => {
        const searchRegex = new RegExp(`^${_searchString}$`);
        return searchRegex.test(label.toLowerCase())
      });

      if (matchedResult) {
        this.assignValue(...matchedResult);
        this.deactivateList();
      } else {
        this.listData = this.data.filter(([label]) => {
          const searchRegex = new RegExp(`(${_searchString})`);
          return label.toLowerCase().match(searchRegex);
        });

        this.listData.sort(([labelA], [labelB]) => (
          labelA.trim().toLowerCase().search(_searchString)
          - labelB.trim().toLowerCase().search(_searchString))
        );

        this.activateList();
      }
    }
  }

  private applyActiveListItem() {
    const item = this.getActiveListItem();
    if (item) {
      this.assignValue(item.dataset.label, item.dataset.value);
    }
  }

  private applyFirstSearchResult() {
    if (this.listData.length) {
      const [label, value] = this.listData[0];
      this.assignValue(label, value);
    }
  }

  private clearActualInput() {
    if (
      this.elements.actualInput
      && this.elements.actualInput.value
    ) {
      this.elements.actualInput.value = this.config.defaultValue;
      typeof this.config.onInputRemoved === 'function'
        && this.config.onInputRemoved();
    }
  }

  private applyValue() {
    if (this.listItemIsActive) {
      this.applyActiveListItem();
    } else if (this.listData.length) {
      this.applyFirstSearchResult();
    } else {
      this.clearActualInput();
    }
  }

  private handleKeyboardEvents(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter': {
        event.preventDefault();
        this.applyValue();
        this.deactivateList();
        break;
      }

      case 'ArrowUp': {
        this.goUpListItem();
        break;
      }

      case 'ArrowDown': {
        this.goDownListItem();
        break;
      }

      case 'Escape': {
        this.deactivateList();
        break;
      }
    }
  }

  private handleInput = event => {
    this.clearActualInput();
    event.target.value === ''
      ? this.updateListWithAllData()
      : this.searchAndUpdateList(event.target.value);
  }

  private handleKeyup = event => {
    this.handleKeyboardEvents(event);
  }

  private handleFocus = event => {
    this.inputIsFocused = true;
    this.elements.input
      ? this.searchAndUpdateList(event.target.value)
      : this.updateListWithAllData();
  }

  private handleBlur = event => {
    this.inputIsFocused = false;
  }

  private handleOutsideClick = event => {
    this.listIsActive
    && this.elements.group
    && !hasAncestor(event.target, this.elements.group)
    && this.deactivateList();
  }

  private handleInputClick = event => {
    !this.listIsActive
      && this.updateListWithAllData();
  }

  private handleInputDoubleClick = event => {
    this.updateListWithAllData();
  }

  // Listen
  public listen(): void {
    if (!this.isListening && this.elementsAreSet && this.elements.input) {
      this.elements.input.addEventListener('focus', this.handleFocus, true);
      this.elements.input.addEventListener('blur', this.handleBlur, true);

      this.elements.input.addEventListener('input', this.handleInput, true);
      this.elements.input.addEventListener('click', this.handleInputClick, true);
      this.elements.input.addEventListener('dblclick', this.handleInputDoubleClick, true);

      this.elements.input.addEventListener('keyup', this.handleKeyup, true);
      window.addEventListener('click', this.handleOutsideClick, true);

      this.isListening = true;
    }
  }

  public stopListening() {
    if (this.isListening && this.elementsAreSet && this.elements.input) {
      this.elements.input.removeEventListener('focus', this.handleFocus);
      this.elements.input.removeEventListener('blur', this.handleBlur);

      this.elements.input.removeEventListener('input', this.handleInput);
      this.elements.input.removeEventListener('click', this.handleInputClick);
      this.elements.input.removeEventListener('dblclick', this.handleInputDoubleClick);

      this.elements.input.removeEventListener('keyup', this.handleKeyup);
      window.removeEventListener('click', this.handleOutsideClick);

      this.isListening = false;
    }
  }
}

export default AutocompleteInput;
