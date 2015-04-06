module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")

    watch:
      framework:
        files: [
          "source/*.js",
          "!source/concatinated.js"
        ]
        tasks: [
          "concat:framework",
          "babel:framework",
          "clean:framework"
        ]

    concat:
      framework:
        dest: "source/concatinated.js"
        src: [
          "source/core.js"
          "source/*.js"
        ]

    babel:
      options:
        compact: false
      framework:
        src: "source/concatinated.js"
        dest: "dist/webdb.js"

    clean:
      dist: "dist/"
      framework: "source/concatinated.js"

    uglify:
      framework:
        src: "dist/webdb.js"
        dest: "dist/webdb.min.js"

  require("load-grunt-tasks") grunt

  grunt.registerTask "default", [
    "dist"
    "watch"
  ]

  grunt.registerTask "dist", [
    "clean:dist",
    "concat:framework",
    "babel:framework",
    "clean:framework",
    "uglify:framework"
  ]
