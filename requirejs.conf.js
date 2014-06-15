require.config({
  paths: {
    jasmine: 'lib/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'lib/jasmine/lib/jasmine-core/jasmine-html',
    "event-emitter": 'lib/event-emitter/src/event-emitter',
    'inherits': 'node_modules/inherits/inherits_browser',
    'util-extend': 'node_modules/util-extend/extend',
    events: 'node_modules/events/events'
  },
  packages: [{
    name: 'stream',
    location: 'src/'
  }],
  shim: {
    jasmine: {
        exports: 'jasmine'
    },
    'jasmine-html': {
        deps: ['jasmine'],
        exports: 'jasmine'
    }
  }
});
