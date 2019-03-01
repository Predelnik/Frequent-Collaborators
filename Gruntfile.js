module.exports = function(grunt) {
  grunt.initConfig({
      'gh-pages': {
        options: {
          base: 'dist'
        },
        src: ['**']
      },
      'ts': {
          default : {
              'tsconfig' : "tsconfig.json"
          }
      }
  });
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.registerTask("default", ['ts', 'gh-pages']);
};