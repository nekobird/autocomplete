import AutocompleteInput from './autocomplete-input';

const rootElement = document.getElementById('root');

if (rootElement) {
  const autocompleteInput = new AutocompleteInput({
    data: [
      ['Ontario',          'ON'],
      ['British Columbia', 'BC'],
      ['Quebec',           'QC'],
      ['Nunavut',          'NU'],
    ],
  });

  rootElement.appendChild(autocompleteInput.elements.group);
}
