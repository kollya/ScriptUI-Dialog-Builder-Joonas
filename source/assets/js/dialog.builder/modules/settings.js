
var settings = {
  
  list: {
    importJSON: {
      divider: true,
      status: true,
      label: 'Import JSON <span title="All export settings travel with the importable JSON. If you load the sample or reset the dialog, export settings will go back to defaults.">?</span>',
      settingFor: 'both'
    },
    indentSize: {
      status: false,
      label: 'Indent size 2 spaces (default 4) <span title="I recommend indent size of 4 for JSX and 2 for HTML">?</span>',
      settingFor: 'both'
    },
    cepExport: {
      divider: true,
      status: false,
      label: 'CEP Export (HTML) <span title="The background below the dialog preview is gray when CEP export is on.">?</span>',
      settingFor: 'both' // It's complicated
    },
    includeCSSJS: {
      status: true,
      label: 'CSS and Javascript  <span title="These are both required. If you have already added CSS and JS, you can leave it out of the export.">?</span>',
      settingFor: 'CEP'
    },
    showDialog: {
      divider: true,
      status: true,
      label: 'Show Dialog <span title="Places dialog.show(); at the end for easy testing.">?</span>',
      settingFor: 'SUI'
    },
    functionWrapper: {
      divider: false,
      status: false,
      label: '<s style="color: #bfbfbf;">Function wrapper</s> <span title="Not released yet...">?</span>',
      settingFor: 'SUI'
    },
    compactCode: {
      status: false,
      label: '<s style="color: #bfbfbf;">Compact mode</s> <span title="Not released yet...">?</span>',
      settingFor: 'SUI'
    }
		// exportComments: {
		//   status: true,
		//   label: 'Include comments',
		//   settingFor: 'SUI'
		// },
  },

  // Loaded when the export button is clicked in the toolbar
  html: function() {

    var data = local_storage.get('dialog');
    var shtml = '';
    var subHeadingNumber = 0;
    $.each( settings.list, function( setting, defaults ) {

      // Yea I guess I could've written this way better...
      if ( defaults.divider ) {
        var subHeading = ['General Export Settings', 'CEP', 'SUI'];
        if ( subHeadingNumber > 0 ) shtml += '</div>';
        shtml += '<div class="settings-group">';
        shtml += '<div class="heading">'+ subHeading[ subHeadingNumber ] +' <div class="settings-spinner"></div></div>';
        ++subHeadingNumber;
      }

      
      var disableSetting = false;
      if (
				
        data.settings.cepExport && defaults.settingFor === 'SUI' ||
        !data.settings.cepExport && defaults.settingFor === 'CEP'
      ) {
        disableSetting = true;
      }
      
      var cssJSinfo = '';
      if ( setting === 'includeCSSJS' ) {
        cssJSinfo =
        '<ul class="settings-js-css-info">' +
          '<li>CSS and JS <a href="https://scriptui.joonas.me/docs/CEP-export/getting-started/#the-required-css-and-js-files" target="_blank">download links</a></li>' +
          '<li><a href="https://scriptui.joonas.me/docs/CEP-export/getting-started" target="_blank">Documentation</a></li>' +
        '</ul>'
      }
      
      var settingState = data.settings[ setting ];
      shtml +=
        '<section class="slider-checkbox'+ (disableSetting ? ' setting-disabled' : '') + ' setting-for-' + defaults.settingFor +'">' +
          '<input '+ ( settingState ? 'checked="true"' : '' ) + (disableSetting ? 'disabled="true"' : '') +' data-setting="'+ setting +'" id="scb-'+ setting +'" type="checkbox" />' +
          '<label class="label" for="scb-'+ setting +'">'+ defaults.label +'</label>' +
          cssJSinfo +
        '</section>';

    });
    
    shtml += '</div>';
    return shtml;

  },
  
  toggleEvent: function( _this ) {
    
    var settingsSpinner = _this.closest('.settings-group').find('.settings-spinner');
    settingsSpinner.stop().show(function() {
      
      var setting = _this.data("setting"),
          status = _this.prop('checked');
      
      // Write to local storage
      var data = local_storage.get('dialog');
      data.settings[ setting ] = status;
      local_storage.set('dialog', data);

      // CEP export doesn't exactly disable any of the other settings, they just become obsolte when it's on.
      if ( setting === 'cepExport' ) {
        
        $('html')[ status ? 'addClass' : 'removeClass' ]('cep-export-on');
        
        // var sliderSection = _this.parent();
        
        // Enable
        var siblingsEnable = $('.settings-window ' + (!status ? '.setting-for-SUI' : '.setting-for-CEP') );
        if ( siblingsEnable.length > 0 ) {
          var siblingEnableInputs = siblingsEnable.find('input');
          siblingsEnable.removeClass('setting-disabled');
          siblingEnableInputs.prop('disabled', false);
        }
        // Disable
        var siblingsDisable = $('.settings-window ' + (status ? '.setting-for-SUI' : '.setting-for-CEP') );
        if ( siblingsDisable.length > 0 ) {
          var siblingsDisableInputs = siblingsDisable.find('input');
          siblingsDisable.addClass('setting-disabled');
          siblingsDisableInputs.prop('disabled', true);
        }
        
      }
      
    	sdbExport = getExportCode();
      
    	cmMode = (sdbExport.language === 'javascript') ? {
    		name: sdbExport.language,
    		json: true
    	} : sdbExport.language;
      
      myCodeMirror.setOption("mode", cmMode );
      myCodeMirror.setValue( getExportCode().code );
      settingsSpinner.hide();
      
    });

  },

  // Basically just scoops up the default settings on load and puts them in the local storage...
  setDefaults: function() {
    
    var data = local_storage.get('dialog');
    
    if ( data.settings === undefined ) {
      data.settings = {};
      $.each( settings.list, function( setting, defaults ) {
        data.settings[ setting ] = defaults.status;
      });
      
      local_storage.set('dialog', data);
    }
    else {
      
      if ( data.settings.cepExport ) {
        $('html').addClass('cep-export-on');
      }
      
    }
    
  },
  
  cepExport: {
    onExport: function( data, importJSON ) {
      
      var dialogHTML = '';
      var preStyle = $('<style/>');
      preStyle.text(
        'html, body { margin: 0; height: 100%; background: #535353; } ' +
        '\n#dialog { color: transparent; } ' +
        '\n#dialog svg { display: none; } ' +
        '\n::-webkit-scrollbar { width: 2px; height: 2px; } ' +
        '\n::-webkit-scrollbar-button { width: 0px; height: 0px; } ' +
        '\n::-webkit-scrollbar-thumb { background: #a0a0a0; border-radius: 50px; display: none; } ' +
      	'\n::-webkit-scrollbar-corner { background: transparent; } ' +
        '\n*:hover::-webkit-scrollbar-thumb { display: block; } ' +
        '\nbody::-webkit-scrollbar-track { background: #535353; } '
      );
      dialogHTML += preStyle.prop('outerHTML');
      dialogHTML += processDialogPreview();
      
    	/*global html_beautify*/
    	/*eslint no-undef: ["error", { "typeof": true }] */
      dialogHTML = html_beautify(dialogHTML, {
        indent_size: data.settings.indentSize ? 2 : 4,
        space_in_empty_paren: true,
        templating: null,
        preserve_newlines: true
      });
      
      if ( data.settings.includeCSSJS ) dialogHTML += processCSSandJS();
      return importJSON + dialogHTML;
      
      function processDialogPreview() {
        
        var clone = $('#dialog').clone().wrap('<div/>').parent();
        
        clone.find('#dialog')
          .addClass('cep-mode')
          .removeClass('animated fadeIn');
        // Title bar is not needed....
        clone.find('#dialog-title-bar').remove();
        // Active class is not needed
        clone.find('.active[data-item-type]').removeClass('active');
        // Make editable fields static (minus edittext)
        clone.find('[contenteditable]').filter(':not(.edittext-text-cont)').attr('contenteditable', false);
        // Loop through items...
        clone.find('[data-item-type]').each(function() {
          // Lowercase type names
          $(this).attr('data-item-type', $(this).data('item-type').toLowerCase() );
          // Place varNames
          var id = $(this).data('item-id');
          $(this).attr('data-item-name', customVar.names[ id ] );
        });
        
        var cepDialog = clone.html();
        clone.remove();
        return cepDialog;
        
      }
      
      function processCSSandJS() {
        
        var data = local_storage.get('sdb-cep-dependencies');
        if ( data ) {
          return '\n\n' + data.css + '\n\n' + data.js;
        }
        else {
          return '';
        }
        
      }
      
    }
  }

};
