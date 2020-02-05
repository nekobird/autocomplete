import AutocompleteInput from '../lib/auto-complete-input';

const rootElement = document.getElementById('root');

if (rootElement) {
  // @ts-ignore
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
    prepareListItemElement: item => item.classList.add('item'),
  });

  rootElement.appendChild(autocompleteInput.elements.group);
}
