var config = require('./config');

exports = module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-node-webkit-builder');


    grunt.initConfig({
        copy: {
            nwk: {
                files: {
                    './build/app/package.json': './nodewebkit.json',
                    './build/app/passthrough.html': './public/passthrough.html'
                }
            }
        },
        clean: {
            nwk: {
                src: ['./build/**/*']
            }
        },
        nodewebkit: {
            options: {
                platforms: ['osx'],//, 'linux32', 'linux64'],
                buildDir: './build',
            },
            src: ['./build/app/**/*']
        }
    });

    grunt.registerTask('build', [
        'clean',
        'copy:nwk',
        'nodewebkit'
    ]);
};
