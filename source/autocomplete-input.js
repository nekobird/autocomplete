// @params {
//   label: string
// 	 id: string
// 	 name: string
// 	 placeholder?: string
// 	 data: [[key: string] => string]
// }

const AUTOCOMPLETE_DEFAULT_CONFIG = {
  label: '',
  data: [],
};

class AutocompleteInput {
  constructor(config) {
    this.config = { ...AUTOCOMPLETE_DEFAULT_CONFIG };

    this.setConfig(config);

    this.isListening = false;

    this.inputElement = null;
    this.groupElement = null;
    this.actualInputElement = null;

    this.currentSearchResult = [];

    this.listItemIsActive = false;
    this.activeListItem = null;

    this.createElements();
    this.listen();
  }

  setConfig(config) {
    if (typeof config === 'object') {
      Object.assign(this.config, config);
    }
    return this.config;
  }

  // Create elements
  createElements() {
    this.createGroupElement();
    this.createInputElement();
    this.createActualInputElement();
    this.createListElement();

    this.composeElements();
  }

  createGroupElement() {
    this.groupElement = document.createElement('div');
    if (typeof this.config.prepareGroupElement === 'function') {
      this.config.prepareGroupElement(this.groupElement);
    }
  }

  createInputElement() {
    this.inputElement = document.createElement('input');
    if (typeof this.config.prepareInputElement === 'function') {
      this.config.prepareInputElement(this.inputElement);
    }
  }

  createActualInputElement() {
    this.actualInputElement = document.createElement('input');
    if (typeof this.config.prepareActualInputElement === 'function') {
      this.config.prepareActualInputElement(this.actualInputElement);
    }
  }

  createListElement() {
    this.listElement = document.createElement('ol');
    if (typeof this.config.prepareListElement === 'function') {
      this.config.prepareListElement(this.listElement);
    }
  }

  composeElements() {
    this.groupElement.appendChild(this.inputElement);
    this.groupElement.appendChild(this.actualInputElement);
    this.groupElement.appendChild(this.listElement);
  }

  assignValue(value, actualValue) {
    this.inputElement.value = value;
    this.actualInputElement.value = actualValue;
  }

  updateList(data) {
    if (this.listElement && this.currentSearchResult.length) {
      this.listElement.innerHTML = '';
      this.currentSearchResult.forEach(([label, value]) => {
        const item = document.createElement('li');
        item.classList.add('item');
        item.setAttribute('data-item-value', value);
        item.textContent = label;
        item.addEventListener('click', function(event) {
          this.assignValue(item.textContent, item.dataset.itemValue);
        }.bind(this), true);
        this.listElement.appendChild(item);
      });
    }
  }

  search(searchString) {
    const filteredData = this.config.data.filter(datum => {
      const [searchValue, value] = datum;
      const searchRegex = new RegExp(`(${searchString.trim().toLowerCase()})`);
      return searchValue.toLowerCase().match(searchRegex);
    });
    this.currentSearchResult = filteredData;
    this.updateList();
  }

  deactivateAllItems() {
    const items = this.listElement.querySelectorAll('li');
    if (items) {
      for (const item of items) {
        item.classList.remove('item--active');
      }
    }
  }

  getActiveItem() {
    if (this.listItemIsActive) {
      const items = this.listElement.querySelectorAll('li');
      const item = items[this.activeListItem];
      if (item) {
        return item;
      }
    }
    return null;
  }

  disableActiveListItem() {
    this.listItemIsActive = false;
    this.activeListItem = 0;
  }

  handleKeyboardEvents(event) {
    switch (event.key) {
      case 'Enter': {
        if (this.listItemIsActive) {
          const item = this.getActiveItem();
          if (item) {
            this.assignValue(item.textContent, item.dataset.itemValue);
          }
        } else {
          if (this.currentSearchResult.length) {
            this.actualInputElement.value = this.currentSearchResult[0][1];
            this.inputElement.value = this.currentSearchResult[0][0];
          } else {
            this.actualInputElement.value = '';
          }
        }
        break;
      }

      case 'ArrowUp': {
        const items = this.listElement.querySelectorAll('li');
        if (items && items.length > 0) {
          if (!this.listItemIsActive) {
            this.listItemIsActive = true;
            this.activeListItem = 0;
          } else {
            this.activeListItem--;
          }

          const item = Array.from(items)[this.activeListItem];
          if (item) {
            this.deactivateAllItems();
            item.classList.add('item--active');
          }
        }
        break;
      }

      case 'ArrowDown': {
        const items = this.listElement.querySelectorAll('li');
        if (items && items.length > 0) {
          if (!this.listItemIsActive) {
            this.listItemIsActive = true;
            this.activeListItem = 0;
          } else {
            this.activeListItem++;
          }

          const item = Array.from(items)[this.activeListItem];
          if (item) {
            this.deactivateAllItems();
            item.classList.add('item--active');
          }
        }
        
        break;
      }
    }
  }

  // Listen
  listen() {
    if (!this.isListening && this.inputElement) {
      this._handleInput = function(event) {
        this.actualInputElement.value = '';
        if (event.target.value === '') {
          this.actualInputElement.value = '';
        } else {
          this.search(event.target.value);
        }
      }.bind(this);

      this._handleKeyup = function(event) {
        this.handleKeyboardEvents(event);
      }.bind(this);

      this.inputElement.addEventListener('input', this._handleInput, true);
      this.inputElement.addEventListener('keyup', this._handleKeyup, true);
    }
  }

  stopListening() {
    if (this.isListening && this.inputElement) {
      this.inputElement.removeEventListener('input', this._handleInput);
    }
  }
}

export default AutocompleteInput;
