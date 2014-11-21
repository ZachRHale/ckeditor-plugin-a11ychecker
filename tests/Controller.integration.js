/* bender-tags: editor,unit */
/* bender-ckeditor-plugins: a11ychecker,sourcearea,toolbar,newpage */
/* bender-include: %TEST_DIR%_helpers/require.js, %TEST_DIR%_helpers/requireConfig.js */

/**
 * @fileoverview Integration tests for Controller class.
 */

( function() {
	'use strict';

	bender.editor = {
		startupData: '<p>foo</p>'
	};

	require( [ 'mocking', 'Controller', 'EngineMock', 'ui/ViewerController', 'EngineDefault' ], function( mocking, Controller, EngineMock ) {
		bender.test( {

			_should: {
				ignore: {
					'test enter key in ignore button': !CKEDITOR.env.chrome
				}
			},

			'test non inited plugin .close()': function() {
				window.setTimeout( function() {
					resume( function() {
						// When plugin is not inited its .close() call shouldn't throw any
						// exception.
						this.editor._.a11ychecker.close();
						// No exceptions, all fine.
						assert.isTrue( true );
					} );
				}, CKEDITOR.env.ie ? 500 : 0 );
				wait();
			},

			'test non inited plugin .next()': function() {
				// When plugin is not inited its .next() call shouldn't throw any
				// exception.
				this.editor.execCommand( 'a11ychecker.next' );
				// No exceptions, all fine.
				assert.isTrue( true );
			},

			'test non inited plugin .prev()': function() {
				// When plugin is not inited its .prev() call shouldn't throw any
				// exception.
				this.editor.execCommand( 'a11ychecker.prev' );
				// No exceptions, all fine.
				assert.isTrue( true );
			},

			'test change to sourcemode': function() {
				var a11ychecker = this.editor._.a11ychecker,
					editor = this.editor;

				mocking.spy( a11ychecker, 'close' );

				editor.once( 'mode', function() {
					// Ensure that close was called.
					assert.areEqual( 1, a11ychecker.close.callCount, 'a11ychecker.close call count' );
					a11ychecker.close.restore();

					// Make sure that the editor is in wysiwyg as expected in later tests.
					// Now explaination for that: we need to listen to mode once again, since it will be
					// async, and ONLY THEN resume the tests.
					// Otherwise other tests are going to have invalid command.state (not refreshed).
					editor.once( 'mode', function() {
						resume();
					} );

					editor.setMode( 'wysiwyg' );
				} );

				// Switch to source view.
				this.editor.execCommand( 'source' );

				wait();
			},

			'test command sets listening mode': function() {
				var a11ychecker = this.editor._.a11ychecker;
				a11ychecker.setEngine( new EngineMock() );

				a11ychecker.exec();

				this.editor.execCommand( 'newpage' );

				assert.areSame( Controller.modes.LISTENING, a11ychecker.modeType, 'Listening mode is set' );
			},

			'test enter key in ignore button': function() {
				// This test will simulate *enter* key pressed while ignore button
				// is focused. It should cause bubbling and all kind of these things. (#67)
				// This test is only for Chrome, because other browsers would require
				// a lot of ifs, etc. so it's just a simplification.
				var a11ychecker = this.editor._.a11ychecker;

				// Dispatch AC.
				a11ychecker.setEngine( new EngineMock() );
				a11ychecker.exec();

				// Now pick ignore button, and init KeyboardEvent.
				var viewer = a11ychecker.viewerController.viewer,
					fireMock = mocking.sinon.spy( viewer.form, 'fire' ),
					ignoreButton = viewer.form.parts.ignoreButton,
					keyEvent = document.createEvent( 'KeyboardEvent' );

				// Focus the button.
				ignoreButton.focus();

				// And all the logic needed to dispatch keydown event on ignoreButton.
				keyEvent.initKeyboardEvent( 'keydown', true, true, window, 'Enter', 13 );

				// Chromium workaround.
				Object.defineProperty(keyEvent, 'keyCode', {
					get : function() {
						return 13;
					}
				});

				Object.defineProperty(keyEvent, 'which', {
					get : function() {
						return 13;
					}
				});

				ignoreButton.$.dispatchEvent( keyEvent );

				// Make sure that original fire is restored.
				fireMock.restore();

				mocking.assert.neverCalledWith( fireMock, 'submit' );

				// Dummy assertion.
				assert.isTrue( true );
			}
		} );
	} );
} )();