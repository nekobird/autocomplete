import {
  hasAncestor,
} from '@nekobird/doko';

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
    typeof config === 'object'
      && Object.assign(this.config, config);
    return this.config;
  }

  public getElement(): HTMLElement | null {
    return this.elements.group || null;
  }

  // Create elements
  private createElements(): void {
    this.createGroupElement();
    this.createInputElement();
    this.createActualInputElement();
    this.createListElement();

    this.composeElements();
  }

  private createGroupElement(): void {
    this.elements.group = document.createElement('div');
    typeof this.config.prepareGroupElement === 'function'
      && this.config.prepareGroupElement(this.elements.group);
  }

  private createInputElement(): void {
    this.elements.input = document.createElement('input');
    this.elements.input.setAttribute('type', 'text');
    typeof this.config.prepareInputElement === 'function'
      && this.config.prepareInputElement(this.elements.input);
  }

  private createActualInputElement(): void {
    this.elements.actualInput = document.createElement('input');
    this.elements.actualInput.setAttribute('type', 'text');
    this.elements.actualInput.setAttribute('disabled', 'true');
    typeof this.config.prepareActualInputElement === 'function'
      && this.config.prepareActualInputElement(this.elements.actualInput);
  }

  private createListElement(): void {
    this.elements.list = document.createElement('ol');
    typeof this.config.prepareListElement === 'function'
      && this.config.prepareListElement(this.elements.list);
  }

  private composeElements(): void {
    if (
         this.elements.group
      && this.elements.input
      && this.elements.actualInput
      && this.elements.list
    ) {
      this.elements.group.appendChild(this.elements.input);
      this.elements.group.appendChild(this.elements.actualInput);
      this.elements.group.appendChild(this.elements.list);

      return;
    }

    console.error('autocomplete: group, input, actualInput, or list is undefined.');
  }

  public assignValue(label?: string, value?: string): void {
    if (
         this.elements.input
      && this.elements.actualInput
      && typeof label === 'string'
      && typeof value === 'string'
    ) {
      this.elements.input.value = label;
      this.elements.actualInput.value = value;

      return;
    }

    console.error('autocomplete: Cannot assign value because input or actualInput is undefined.');
  }

  // List

  private deactivateList(): void {
    if (this.elements.list) {
      this.config.deactivateList(this.elements.list);
      this.elements.list.innerHTML = '';
      this.listIsActive = false;
    }
  }

  private showList(): void {
    this.elements.list && this.config.activateList(this.elements.list);
  }

  private deactivateAllListItems(): void {
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

  private resetListAndListItems(): void {
    if (this.elements.list) {
      this.deactivateAllListItems();
      this.deactivateList();

      this.listItemIsActive = false;
      this.activeListItemIndex = 0;
    }
  }

  private getActiveListItem(): HTMLLIElement | null {
    if (this.listItemIsActive && this.elements.list) {
      const items = this.elements.list.querySelectorAll('li');
      return items[this.activeListItemIndex] || null;
    }
    return null;
  }

  private updateList() {
    if (this.elements.list && this.searchResults.length) {
      this.config.deactivateList(this.elements.list);
      this.elements.list.innerHTML = '';

      this.searchResults.forEach(([label, value]) => {
        // list item
        const item = document.createElement('li');
        item.classList.add('item');
        item.setAttribute('data-label', label);
        item.setAttribute('data-value', value);

        // anchor
        const a = document.createElement('a');
        a.setAttribute('data-label', label);
        a.setAttribute('data-value', value);
        a.textContent = label;

        item.appendChild(a);
        
        a.addEventListener('click', event => {
          event.preventDefault();
          this.assignValue(item.dataset.label, item.dataset.value);
          this.resetListAndListItems();
        }, true);

        this.elements.list!.appendChild(item);
      });

      this.showList();
    }
  }

  private showAllListItems() {
    if (this.elements.list) {
      this.searchResults = [...this.config.data];
      this.updateList();
    }
  }

  private searchAndUpdateList(searchString: string) {
    const _searchString = searchString.trim().toLowerCase();
    if (_searchString) {
      this.searchResults = this.config.data.filter(([label]) => {
        const searchRegex = new RegExp(`(${_searchString.trim().toLowerCase()})`);
        return label.toLowerCase().match(searchRegex);
      });

      this.searchResults.sort(([labelA], [labelB]) => (
        labelA.trim().toLowerCase().search(_searchString)
        - labelB.trim().toLowerCase().search(_searchString))
      );

      this.updateList();
    }
  }

  private applyActiveListItem() {
    const item = this.getActiveListItem();
    item && this.assignValue(item.dataset.label, item.dataset.value);
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
    } else if (this.searchResults.length) {
      this.applyFirstSearchResult();
    } else {
      this.clearActualInput();
    }
  }

  private goUpListItem() {
    if (this.elements.list) {
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
  }

  private goDownListItem() {
    if (this.elements.list) {
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
  }

  private handleKeyboardEvents(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter': {
        this.applyValue();
        this.resetListAndListItems();
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
        this.resetListAndListItems();
        break;
      }
    }
  }

  private handleInput = event => {
    if (this.elements.actualInput) {
      this.elements.actualInput.value = '';
      event.target.value === ''
        ? this.showAllListItems()
        : this.searchAndUpdateList(event.target.value);
    }
  }

  private handleKeyup = event => {
    this.handleKeyboardEvents(event);
  }

  private handleFocus = event => {
    this.showAllListItems();
  }

  private handleOutsideClick = event => {
    this.elements.group && !hasAncestor(event.target, this.elements.group) && this.resetListAndListItems();
  }

  // Listen
  public listen(): void {
    if (!this.isListening && this.elements.input) {
      this.elements.input.addEventListener('focus', this.handleFocus, true);
      this.elements.input.addEventListener('input', this.handleInput, true);
      this.elements.input.addEventListener('keyup', this.handleKeyup, true);
      window.addEventListener('click', this.handleOutsideClick, true);
    }
  }

  public stopListening() {
    if (this.isListening && this.elements.input) {
      this.elements.input.removeEventListener('focus', this.handleFocus);
      this.elements.input.removeEventListener('input', this.handleInput);
      this.elements.input.removeEventListener('keyup', this.handleKeyup);
      window.removeEventListener('click', this.handleOutsideClick);
    }
  }
}

export default AutocompleteInput;
