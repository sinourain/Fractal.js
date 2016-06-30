const R = require('ramda')
const F = require('../../../lib')
const h = F.h


module.exports = F.def({
  init: ({key}) => ({
    key,
    color: 'red',
  }),
  inputs: {
    toggleColor: (ctx, Action, _) => Action.ToggleColor(),
  },
  actions: {
    ToggleColor: [[], m => R.evolve({color: c => (c == 'red') ? 'blue' : 'red'}, m)],
  },
  interfaces: {
    view: (ctx, i, m) => h('div', [
      h('div', 'Home Page :)'),
      h('div', {
        style: {backgroundColor: m.color, color: 'white', padding: '20px'},
        on: {click: i.toggleColor},
      }, 'Omg a toogling color!! Click me!!'),
    ]),
  },
})
