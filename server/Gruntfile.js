module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        nggettext_extract: {
            pot: {
                files: {
                    'languages/template.pot': [
                        'languages/extraDictionary.html',
                        'public/templates/*.html',
                        'public/templates/agenda/*.html',
                        'public/templates/chats/*.html',
                        'public/templates/contacts/*.html',
                        'public/templates/chats/*.html',
                        'public/templates/contacts/*.html',
                        'public/templates/dashboard/*.html',
                        'public/templates/dashboard/asks/*.html',
                        'public/templates/dashboard/asks/directives/*.html',
                        'public/templates/dashboard/cards/*.html',
                        'public/templates/dashboard/cards/directives/*.html',
                        'public/templates/modals/*.html',
                        'public/templates/navbar/*.html',
                        'public/templates/patient/*.html',
                        'public/templates/profile/*.html',
                        'public/templates/recovery/*.html',
                        'public/templates/settings/*.html',
                        'public/templates/tips/*.html',
                        'public/js/controllers/*.js',
                        'public/js/controllers/agenda/*.js',
                        'public/js/controllers/chats/*.js',
                        'public/js/controllers/contacts/*.js',
                        'public/js/controllers/dashboard/*.js',
                        'public/js/controllers/recovery/*.js',
                        'public/js/directives/*.js',
                        'public/js/*.js'
                    ]
                }
            }
        },
        nggettext_compile: {
            all: {
                files: {
                    'public/js/appTranslations.js': ['languages/*.po']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-angular-gettext');

    // Default task(s).
    grunt.registerTask('default', ['nggettext_extract', 'nggettext_compile']);
};