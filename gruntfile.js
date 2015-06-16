/**
 * Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * See LICENSE.md for license information.
 */

// File specific JSHint configs.
/* jshint node: true */

'use strict';

// Note:
// You can also find some information on how to use some grunt tasks in README.md.

module.exports = function( grunt ) {
	// First register the "default" task, so it can be analyzed by other tasks.
	grunt.registerTask( 'default', [ 'jshint:git', 'jscs:git' ] );

	// Array of paths excluded from linting.
	var lintExclude = [
		'libs/**',
		'samples/jquery.min.js',
		'samples/require.js',
		'tests/_assets/**',
		'tests/_helpers/require.js',
		'tests/_helpers/sinon/**'
	];

	// Basic configuration which will be overloaded by the tasks.
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		'build-js': {
			buildConfig: {
				name: 'build/a11ychecker/plugin',
				out: 'build/a11ychecker/plugin.js',
				paths: {
					'Quail': 'build/a11ychecker/libs/quail/quail.jquery'
				},
				optimize: 'none'	// Do not minify because of AMDClean.
			}
		},

		'build-quickfix': {
			build: {
				source: 'quickfix',
				target: 'build/a11ychecker/quickfix'
			}
		},

		env: {
			dev: {
				DEV: true
			},
			build: {
				DEV: false
			}
		},

		jshint: {
			options: {
				ignores: lintExclude
			}
		},

		jscs: {
			options: {
				excludeFiles: lintExclude
			}
		},

		githooks: {
			all: {
				'pre-commit': 'default'
			}
		},

		less: {
			development: {
				files: {
					'styles/contents.css': 'less/contents.less',
					'skins/moono/a11ychecker.css': 'less/a11ychecker.less'
				},

				options: {
					paths: [ 'less' ]
				}
			},

			// Simply compress the skin file only.
			// If you want to build production CSS use `grunt build-css` rather than `grunt less:production`.
			production: {
				files: {
					'skins/moono/a11ychecker.css': 'less/a11ychecker.less'
				},

				options: {
					paths: [ 'less' ],
					compress: true
				}
			},

			samples: {
				expand: true,
				cwd: 'samples/sdk-assets/',
				src: 'less/sample.less',
				dest: 'samples/sdk-assets/',
				ext: '.css',
				flatten: false,
				rename: function( src, dest ) {
					return src + dest.replace( 'less/', 'css/' );
				},

				options: {
					ieCompat: true,
					paths: [ 'samples/sdk-assets/' ],
					relativeUrls: true,

					sourceMap: true,
					sourceMapRootpath: '/plugins/a11ychecker/',
					sourceMapURL: 'sample.css.map'
				}
			}
		},

		watch: {
			less: {
				files: [ 'less/*.less' ],
				tasks: [ 'less:development' ],
				options: {
					nospawn: true
				}
			},

			samples: {
				files: '<%= less.samples.cwd %><%= less.samples.src %>',
				tasks: [ 'less:samples' ],
				options: {
					nospawn: true
				}
			}
		},

		build: {
			options: {
				// Enable this to make the build code "kind of" readable.
				beautify: false
			}
		},

		clean: {
			build: [ 'build' ],
			buildQuickFixes: [ 'build/a11ychecker/quickfix/*' ]
		},

		copy: {
			build: {
				files: [
					{
						// nonull to let us know if any of given entiries is missing.
						nonull: true,
						src: [ 'plugin.js', 'quailInclude.js', 'skins/**', 'styles/**', 'quickfix/**', 'icons/**', 'lang/*',
							'libs/quail/**' ],
						dest: 'build/a11ychecker/'
					}
				]
			},

			samples: {
				src: [ 'samples/**', '!samples/*.md', '!samples/require.js', '!samples/sdk-assets/less/**' ],
				dest: 'build/a11ychecker/'
			},

			// Copies external dependencies into a build directory.
			external: {
				src: [ '../balloonpanel/skins/**', '../balloonpanel/plugin.js' ],
				dest: 'build/balloonpanel/'
			},

			externalEngines: {
				src: [ '../{htmlcodesniffer,axe}/**' ],
				dest: 'build/htmlcodesniffer/'
			},

			// Copies DISTRIBUTION.md to the README.md.
			readme: {
				src: [ 'DISTRIBUTION.md' ],
				dest: 'build/a11ychecker/README.md'
			}
		},

		compress: {
			build: {
				options: {
					archive: 'build/a11ychecker.zip'
				},
				cwd: 'build/',
				src: [ '*/**' ],
				dest: '',
				expand: true
			}
		},

		uglify: {
			external: {
				files: [
					{
						'build/balloonpanel/plugin.js': [ '../balloonpanel/plugin.js' ]
					},
					{
						// This entry is going to minify QuickFix types.
						expand: true,
						cwd: 'build/a11ychecker/QuickFix',
						src: [ '*.js' ],
						dest: 'build/a11ychecker/QuickFix'
					}
				]
			},
			externalEngines: {
				files: [
					{
						'build/htmlcodesniffer/plugin.js': [ '../htmlcodesniffer/plugin.js' ]
					},
					{
						'build/axe/plugin.js': [ '../axe/plugin.js' ]
					}
				]
			}
		},

		replace: {
			quailInjection: {
				// Replaces {quailPath} in quailInclude.js file.
				src: [ 'build/quailInclude.js' ],
				overwrite: true,
				replacements: [ {
					from: '{quailPath}',
					to: 'libs/quail/quail.jquery.min.js'
				} ]
			}
		},

		preprocess: {
			build: {
				// Builds a sample.
				src: 'samples/index.html',
				dest: 'build/a11ychecker/samples/index.html'
			},

			plugin: {
				options: {
					inline: true
				},
				expand: true,
				src: 'plugin.js',
				dest: 'build/a11ychecker',
				cwd: 'build/a11ychecker'
			}
		},

		'plugin-versions': {
			build: {
				options: {
					plugins: [ 'a11ychecker' ]
				}
			},
			external: {
				options: {
					plugins: [ 'balloonpanel' ]
				}
			},
			externalEngines: {
				options: {
					plugins: [ 'axe', 'htmlcodesniffer' ]
				}
			}
		}
	} );

	require( 'load-grunt-tasks' )( grunt );

	grunt.registerTask( 'build-css', 'Builds production-ready CSS using less.',
		[ 'less:development', 'less:production', 'less:samples' ] );

	grunt.registerTask( 'process', 'Process the HTML files, removing some conditional markup, ' +
		'and replaces revsion hashes.', [ 'env:build', 'preprocess:build', 'plugin-versions:build' ] );

	grunt.registerTask( 'quail-prepare', 'Prepares lib/quail in build directory.',
		[ 'custom-quail', 'replace:quailInjection' ] );

	grunt.registerTask( 'build', 'Generates a build.', [
		'clean:build', 'build-css', 'custom-quail-config', 'copy:build', 'copy:samples', 'copy:readme',
		'quail-prepare', 'preprocess:plugin', 'process', 'build-js', 'plugin-versions:build',
		'clean:buildQuickFixes', 'build-quickfix:build'
	] );

	var fullBuildTasks = [
			'build', 'copy:external', 'plugin-versions:external', 'uglify:external', 'compress:build'
		],
		buildFullDescr = 'Generates a sparse build including external plugin dependencies. Use --engines flag ' +
			'to include additional engines plugins.';

	if ( grunt.option( 'engines' ) ) {
		//fullBuildTasks.splice( 4, 0, 'uglify:externalEngines' );
		fullBuildTasks.splice( 2, 0, 'copy:externalEngines', 'plugin-versions:externalEngines' );
	}

	grunt.registerTask( 'build-full', buildFullDescr, fullBuildTasks );

	grunt.loadTasks( 'dev/tasks' );
};
