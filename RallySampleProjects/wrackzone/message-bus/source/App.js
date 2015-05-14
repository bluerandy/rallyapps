var app = null;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout : 'column',
    items : [
    	{
    		xtype: 'rallyreleasecombobox',
    		itemId : 'releaseCombo',
    		columnWidth : .25
    	},
    	{
    		xtype: 'rallyiterationcombobox',
    		itemId : 'iterationCombo',
    		columnWidth : .25
    	}
    ],
    
    launch: function() {
    	app = this;
    	app.release = null; app.iteration = null;
    	this.down('#releaseCombo').on('select', this._selectRelease, this);
    	this.down('#iterationCombo').on('select', this._selectIteration, this);
    	this.subscribe(this, 'publishRequest', this._onMessage, this); 
    },

    _selectRelease : function(combo,record,ndx) {
    	app.release = _.first(record);
    	app._publish();
    },
    
    _selectIteration : function(combo,record,ndx) {
		app.iteration = _.first(record);
		app._publish();
    },

    _publish : function() {
    	console.log("Source:publish",{ release:app.release,iteration:app.iteration});
    	this.publish('sourceSelectMessage', { release:app.release,iteration:app.iteration} );
    },

    _onMessage: function(message) {
        console.log('Publish Request Received', message);
        app._publish();
    }


});
