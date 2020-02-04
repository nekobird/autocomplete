import AutocompleteInput from './autocomplete-input';

const rootElement = document.getElementById('root');

if (rootElement) {
  const autocompleteInput = new AutocompleteInput({
    data: [
      ['Alberta',                   'AB'],
      ['British Columbia',          'BC'],
      ['Manitoba',                  'MB'],
      ['New Brunswick',             'NB'],
      ['Newfoundland and Labrador', 'NL'],
      ['Nova Scotia',               'NS'],
      ['Ontario',                   'ON'],
      ['Prince Edward Island',      'PE'],
      ['Quebec',                    'QC'],
      ['Saskatchewan',              'SK'],
    ],
  });

  rootElement.appendChild(autocompleteInput.elements.group);
}
