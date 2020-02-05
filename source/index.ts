import AutocompleteInput from '../lib/auto-complete-input';

const rootElement = document.getElementById('root');

if (rootElement) {
  // @ts-ignore
  const autocompleteInput = new AutocompleteInput(
    [
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
    {
      prepareListItemElement: item => item.classList.add('item'),
      onInputSelected: (label, value) => console.log(label, value),
      onInputRemoved: () => console.log('removed'),
    }
  );

  rootElement.appendChild(autocompleteInput.elements.group);
}
