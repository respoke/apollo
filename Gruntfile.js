var config = require('./config');

exports = module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jade');


    grunt.initConfig({
        copy: {
            build: {
                expand: true,
                src: [
                    '**/*'
                ],
                cwd: './public/',
                dest: './build/app/'
            }
        },
        jade: {
            options: {
                data: {
                    config: config,
                    title: config.name,
                    error: {}
                },
                pretty: true
            },
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'views',
                        src: './**/*.jade',
                        dest: './build/app/',
                        ext: '.html'
                    }
                ]
            } 
        },
        browserify: {
            build: {
                files: {
                    './build/app/js/apollo.js': './build/app/js/apollo.js'
                }
            }
        },
        nodewebkit: {
            options: {
                platforms: ['win', 'osx', 'linux32', 'linux64'],
                buildDir: './build', // Where the build version of my node-webkit app is saved
            },
            src: ['./build/app'] // Your node-webkit app
        }
    });

    grunt.registerTask('build', [
        'copy',
        'jade',
        'browserify'
    ]);
};
