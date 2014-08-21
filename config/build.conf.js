({
  mainConfigFile: '../requirejs.conf.js',
  paths: {
    jquery: 'lib/jquery/jquery.min',
    almond: 'node_modules/almond/almond',
  },
  baseUrl: '..',
  name: "stream",
  include: [
    'almond'
  ],
  stubModules: ['text', 'hgn', 'json'],
  out: "../dist/stream.min.js",
  pragmasOnSave: {
    excludeHogan: true
  },
  cjsTranslate: true,
  optimize: "uglify2",
  preserveLicenseComments: false,
  uglify2: {
    compress: {
      unsafe: true
    },
    mangle: true
  },
  wrap: {
    startFile: 'wrap-start.frag',
    endFile: 'wrap-end.frag'
  },
  generateSourceMaps: true,
  onBuildRead: function(moduleName, path, contents) {
    switch (moduleName) {
      case "jquery":
        contents = "define([], function(require, exports, module) {" + contents + "});";
    }
    return contents;
  }
})
