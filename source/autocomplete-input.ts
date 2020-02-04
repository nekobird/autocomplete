// @params {
//   label: string
// 	 id: string
// 	 name: string
// 	 placeholder?: string
// 	 data: [[key: string] => string]
// }

type AutocompleteData = [string, string][];

interface AutoCompleteInputConfig {
  data: AutocompleteData;

  prepareGroupElement: (element: HTMLElement) => void;
  prepareInputElement: (element: HTMLInputElement) => void;
  prepareActualInputElement: (element: HTMLInputElement) => void;
  prepareListElement: (list: HTMLOListElement) => void;

  activateList: (list: HTMLOListElement) => void;
  deactivateList: (list: HTMLOListElement) => void;

  activateListItem: (item: HTMLLIElement) => void;  
  deactivateListItem: (item: HTMLLIElement) => void;
}

const AUTO_COMPLETE_INPUT_DEFAULT_CONFIG: AutoCompleteInputConfig = {
  prepareGroupElement: group => group.classList.add('autocompleteinput'),
  prepareInputElement: input => input,
  prepareActualInputElement: input => input,
  prepareListElement: list => list,

  activateList: list => list.classList.add('list--active'),
  deactivateList: list => list.classList.remove('list--active'),

  activateListItem: list => list.classList.add('item--active'),
  deactivateListItem: item => item.classList.remove('item--active'),

  data: [],
};

interface AutoCompleteInputElements {
  group: HTMLElement | null;
  input: HTMLInputElement | null;
  actualInput: HTMLInputElement | null;
  list: HTMLOListElement | null;
}

class AutocompleteInput {
  public config: AutoCompleteInputConfig;

  public isListening: boolean = false;

  // Elements
  public elements: AutoCompleteInputElements;

  public searchResults: AutocompleteData;

  // List
  public listIsActive: boolean = false;
  public listItemIsActive: boolean = false;
  public activeListItemIndex: number = 0;

  constructor(config: Partial<AutoCompleteInputConfig>) {
    this.config = { ...AUTO_COMPLETE_INPUT_DEFAULT_CONFIG };

    this.setConfig(config);

    this.elements = {
      group: null,
      input: null,
      actualInput: null,
      list: null,
    };

    this.searchResults = [];

    // list
    this.createElements();
    this.listen();
  }

  public setConfig(config: Partial<AutoCompleteInputConfig>): AutoCompleteInputConfig {
    if (typeof config === 'object') {
      Object.assign(this.config, config);
    }
    return this.config;
  }

  // Create elements
  private createElements(): void {
    this.createGroupElement();
    this.createInputElement();
    this.createActualInputElement();
    this.createListElement();

    this.composeElements();
  }

  private createGroupElement() {
    this.elements.group = document.createElement('div');
    if (typeof this.config.prepareGroupElement === 'function') {
      this.config.prepareGroupElement(this.elements.group);
    }
  }

  private createInputElement() {
    this.elements.input = document.createElement('input');
    this.elements.input.setAttribute('type', 'text');
    if (typeof this.config.prepareInputElement === 'function') {
      this.config.prepareInputElement(this.elements.input);
    }
  }

  private createActualInputElement() {
    this.elements.actualInput = document.createElement('input');
    this.elements.actualInput.setAttribute('type', 'text');
    this.elements.actualInput.setAttribute('disabled', 'true');
    if (typeof this.config.prepareActualInputElement === 'function') {
      this.config.prepareActualInputElement(this.elements.actualInput);
    }
  }

  private createListElement() {
    this.elements.list = document.createElement('ol');
    if (typeof this.config.prepareListElement === 'function') {
      this.config.prepareListElement(this.elements.list);
    }
  }

  private composeElements() {
    if (this.elements.group) {
      this.elements.group.appendChild(this.elements.input);
      this.elements.group.appendChild(this.elements.actualInput);
      this.elements.group.appendChild(this.elements.list);
    }
  }

  public assignValue(label: string, value: string) {
    this.elements.input.value = label;
    this.elements.actualInput.value = value;
  }

  // List

  private hideList() {
    if (this.elements.list) {
      this.config.deactivateList(this.elements.list);
      this.elements.list.innerHTML = '';
      this.listIsActive = false;
    }
  }

  private showList() {
    if (this.elements.list) {
      this.config.activateList(this.elements.list);
    }
  }

  private deactivateAllListItems() {
    const items = this.elements.list.querySelectorAll('li');
    if (items) {
      items.forEach(item => {
        if (typeof this.config.deactivateListItem === 'function') {
          this.config.deactivateListItem(item);
        }
      });
    }
  }

  private deactivateListItem() {
    this.listItemIsActive = false;
    this.activeListItemIndex = 0;
  }

  private getActiveListItem(): HTMLLIElement | null {
    if (this.listItemIsActive) {
      const items = this.elements.list.querySelectorAll('li');
      return items[this.activeListItemIndex] ?? null;
    }
    return null;
  }

  private updateList() {
    if (this.elements.list && this.searchResults.length) {
      this.config.deactivateList(this.elements.list);
      this.elements.list.innerHTML = '';

      this.searchResults.forEach(([label, value]) => {
        const item = document.createElement('li');
        item.classList.add('item');
        item.setAttribute('data-label', label);
        item.setAttribute('data-value', value);

        const a = document.createElement('a');
        a.setAttribute('data-label', label);
        a.setAttribute('data-value', value);
        a.textContent = label;

        item.appendChild(a);
        
        a.addEventListener('click', event => {
          event.preventDefault();
          this.assignValue(item.dataset.label, item.dataset.value);
          this.hideList();
        }, true);

        this.elements.list.appendChild(item);
      });

      this.showList();
    }
  }

  private search(searchString: string) {
    if (searchString) {
      this.searchResults = this.config.data.filter(([label]) => {
        const searchRegex = new RegExp(`(${searchString.trim().toLowerCase()})`);
        return label.toLowerCase().match(searchRegex);
      });

      this.updateList();
    }
  }

  private applyActiveListItem() {
    const item = this.getActiveListItem();
    if (item) {
      this.assignValue(item.dataset.label, item.dataset.value);
    }
  }

  private applyFirstSearchResult() {
    if (this.searchResults.length) {
      const [label, value] = this.searchResults[0];
      this.assignValue(label, value);
    }
  }

  private clearActualInput() {
    if (this.elements.actualInput) {
      this.elements.actualInput.value = '';
    }
  }

  private applyValue() {
    if (this.listItemIsActive) {
      this.applyActiveListItem();
    }
    else if (this.searchResults.length) {
      this.applyFirstSearchResult();
    }
    else {
      this.clearActualInput();
    }
  }

  private goUpListItem() {
    const items = this.elements.list.querySelectorAll('li');
    if (items && items.length > 0) {

      if (!this.listItemIsActive) {
        return
      }

      this.activeListItemIndex > 0
        ? this.activeListItemIndex--
        : this.activeListItemIndex = 0;

      const activeItem = Array.from(items)[this.activeListItemIndex];

      if (activeItem) {
        this.deactivateAllListItems();
        this.config.activateListItem(activeItem);
      }
    }
  }

  private goDownListItem() {
    const items = this.elements.list.querySelectorAll('li');
    if (items && items.length > 0) {

      if (!this.listItemIsActive) {
        this.listItemIsActive = true;
        this.activeListItemIndex = 0;
      } else {
        this.activeListItemIndex + 1 > items.length - 1
          ? this.activeListItemIndex = 0
          : this.activeListItemIndex++;
      }

      const activeItem = Array.from(items)[this.activeListItemIndex];

      if (activeItem) {
        this.deactivateAllListItems();
        this.config.activateListItem(activeItem);
      }
    }
  }

  private handleKeyboardEvents(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter': {
        this.applyValue();
        this.elements.list.innerHTML = '';
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
        this.deactivateAllListItems();
        this.elements.list.innerHTML = '';
        break;
      }
    }
  }

  private handleInput = event => {
    this.elements.actualInput.value = '';


    if (event.target.value === '') {
      this.elements.actualInput.value = '';
      this.elements.list.innerHTML = '';
    } else {
      this.search(event.target.value);
    }
  }

  private handleKeyup = event => {
    this.handleKeyboardEvents(event);
  }

  // Listen
  listen() {
    if (!this.isListening && this.elements.input) {
      this.elements.input.addEventListener('input', this.handleInput, true);
      this.elements.input.addEventListener('keyup', this.handleKeyup, true);
    }
  }

  stopListening() {
    if (this.isListening && this.elements.input) {
      this.elements.input.removeEventListener('input', this.handleInput);
      this.elements.input.removeEventListener('input', this.handleKeyup);
    }
  }
}

export default AutocompleteInput;
