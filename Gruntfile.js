var config = require('./config');

exports = module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-node-webkit-builder');


    grunt.initConfig({
        copy: {
            nwk: {
                files: {
                    './release/app/package.json': './nodewebkit.json',
                    './release/app/passthrough.html': './public/passthrough.html'
                }
            }
        },
        clean: {
            nwk: {
                src: ['./release/**/*']
            }
        },
        nodewebkit: {
            options: {
                platforms: ['osx', 'win', 'linux32', 'linux64'],
                buildDir: './release',
            },
            src: ['./release/app/**/*']
        }
    });

    grunt.registerTask('release', [
        'clean',
        'copy:nwk',
        'nodewebkit'
    ]);
};
