/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

define( [ 'ui/ViewerDescription', 'ui/ViewerNavigation', 'ui/ViewerForm', 'ui/ViewerListeningIndicator', 'ui/ViewerFocusManager', 'ui/ViewerMode' ], function( ViewerDescription, ViewerNavigation, ViewerForm, ViewerListeningIndicator, ViewerFocusManager, ViewerMode ) {
	/**
	 * A class which represents the end-user interface of a11ychecker. Viewer is a panel
	 * which allows to browse and fix issues in the contents.
	 *
	 * *Note*: The panel is built upon the {@link CKEDITOR.ui.panel}.
	 *
	 * @since 4.5
	 * @class CKEDITOR.plugins.a11ychecker.viewer
	 * @constructor Creates a viewer instance.
	 * @param {CKEDITOR.editor} editor The editor instance for which the panel is created.
	 * @param {Object} definition An object containing panel definition.
	 */
	function Viewer( editor, definition ) {
		/**
		 * The editor of this viewer.
		 */
		this.editor = editor;

		/**
		 * The {@link CKEDITOR.ui.panel} of this viewer.
		 */
		this.panel = new CKEDITOR.ui.balloonPanel( editor, definition );

		/**
		 * The {@link CKEDITOR.plugins.a11ychecker.ui.ViewerFocusManager} of this viewer.
		 */
		this.focusManager = new ViewerFocusManager();

		/**
		 * Mode of the Viewer. See {@link CKEDITOR.plugins.a11ychecker.ui.ViewerMode}, {@link #modes}, {@link #setMode}.
		 */
		this.modes = {};

		/**
		 * Current mode of the Viewer. See {@link CKEDITOR.plugins.a11ychecker.ui.ViewerMode}, {@link #modes}, {@link #setMode}.
		 */
		this.mode = null;

		/**
		 * @todo: HACK DETECTED! For the time being we weill simply inject ViewerFocusManager
		 * function to panel. Later on this manager will have to be used in balloon.
		 */
		var that = this;
		this.panel.registerFocusable = function( elem ) {
			that.focusManager.addItem( elem );
			// Adding a item to editor.focusManager is required so that focusing the element outside
			// the editable element won't blur inline editor. (#11)
			that.editor.focusManager.add( elem );
		};
		this.panel.deregisterFocusable = function( elem ) {
			that.focusManager.removeItem( elem );
			that.editor.focusManager.remove( elem );
		};

		this.setupNavigation();
		this.setupDescription();
		this.setupForm();
		this.setupListeningIndicator();

		this.setupModes();
		this.setMode( 'checking' );
	};

	Viewer.prototype = {
		/**
		 * Definitions of {@link CKEDITOR.plugins.a11ychecker.viewerMode}.
		 */
		modesDefinition: {
			listening: {
				updatePanelPosition: function( viewer ) {
					var contentsSpace = viewer.editor.ui.space( 'contents' ),
						contentsSpaceRect = contentsSpace.getClientRect(),
						winGlobal = CKEDITOR.document.getWindow(),
						winGlobalScroll = winGlobal.getScrollPosition(),
						documentElementRect = viewer.editor.document.getDocumentElement().getClientRect();

					viewer.panel.move(
						contentsSpaceRect.bottom - viewer.panel.getHeight() + winGlobalScroll.y + 1 - 10,
						contentsSpaceRect.right - viewer.panel.getWidth() + winGlobalScroll.x - ( contentsSpaceRect.width - documentElementRect.width ) - 1 - 10
					);
				},

				enter: function( viewer ) {
					// viewer.panel.setTitle( 'Accessibility checker: waiting' );
					viewer.panel.parts.panel.addClass( 'cke_a11yc_mode_listening' );
					this.panelWidth = viewer.panel.getWidth();
					viewer.panel.resize( null, null );
					CKEDITOR.tools.setTimeout( function() {
						this.updatePanelPosition( viewer );
					}, 100, this );
				},

				leave: function( viewer ) {
					// viewer.panel.setTitle( 'Accessibility checker' );
					viewer.panel.parts.panel.removeClass( 'cke_a11yc_mode_listening' );
					viewer.panel.resize( this.panelWidth, null );
				},

				panelShowListeners: function( viewer ) {
					var that = this;

					return [
						function() {
							return CKEDITOR.document.getWindow().on( 'resize', function() {
								console.log( 'listener: outer window resize' );
								that.updatePanelPosition( viewer );
							} );
						},
					];
				}
			},

			checking: {
				enter: function( viewer ) {
					viewer.panel.show();
				},

				leave: function( viewer ) {

				},

				panelShowListeners: function( viewer ) {
					return [
						// Hide the panel on iframe window's scroll.
						function() {
							return this.editor.window.on( 'scroll', function() {
								console.log( 'listener: inner window scroll' );
								if ( !this.editor.editable().isInline() ) {
									this.blur();
									this.hide();
								}
							}, this );
						},

						// Hide the panel on editor resize.
						function() {
							return this.editor.on( 'resize', function() {
								console.log( 'listener: resize' );
								this.blur();
								this.hide();
							}, this );
						}
					]
				}
			}
		},

		/**
		 * Setups the navigation bar.
		 */
		setupNavigation: function() {
			this.navigation = new ViewerNavigation( this );

			// Register focusables.
			this.panel.registerFocusable( this.navigation.parts.previous );
			this.panel.registerFocusable( this.navigation.parts.list );
			this.panel.registerFocusable( this.navigation.parts.next );

			this.panel.parts.content.append( this.navigation.parts.wrapper );
		},

		/**
		 * Setups the description area.
		 */
		setupDescription: function() {
			this.description = new ViewerDescription( this.editor.lang.a11ychecker );

			this.panel.parts.content.append( this.description.parts.wrapper );

			this.panel.registerFocusable( this.description.parts.ignoreButton );
		},

		/**
		 * Setups the "quick fix" form.
		 */
		setupForm: function() {
			this.form = new ViewerForm( this );

			this.form.on( 'addInput', function( evt ) {
				this.panel.registerFocusable( evt.data.input );
			}, this );

			this.form.on( 'removeInput', function( evt ) {
				this.panel.deregisterFocusable( evt.data.input );
			}, this );

			this.panel.registerFocusable( this.form.parts.button );
			this.panel.parts.content.append( this.form.parts.wrapper );
		},

		/**
		 * Setups listening indicator.
		 * See {@link CKEDITOR.plugins.a11ychecker.viewerListeningIndicator}.
		 */
		setupListeningIndicator: function() {
			this.listeningIndicator = new ViewerListeningIndicator( this );

			this.panel.registerFocusable( this.listeningIndicator.parts.button );
			this.panel.parts.content.append( this.listeningIndicator.parts.wrapper );
		},

		/**
		 * Setups viewer modes.
		 * See {@link #modes}, {@link #setMode}, {@link CKEDITOR.plugins.a11ychecker.viewerMode}.
		 */
		setupModes: function() {
			for ( var m in this.modesDefinition ) {
				this.modes[ m ] = new ViewerMode( this, this.modesDefinition[ m ] );
			}
		},

		/**
		 * Activates viewer mode.
		 * See {@link #modes}, {@link #setupModes}, {@link CKEDITOR.plugins.a11ychecker.viewerMode}.
		 *
		 * @param {String} mode Mode name, one of {@link #modes}
		 */
		setMode: function( mode ) {
			if ( this.mode ) {
				this.modes[ this.mode ].leaveMode();
			}

			this.modes[ mode ].enterMode();
			this.mode = mode;
		}
	};

	return Viewer;
} );