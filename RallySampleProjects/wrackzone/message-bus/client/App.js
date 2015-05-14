Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
		this.subscribe(this, 'sourceSelectMessage', this._onMessage, this); 
		// request the source to publish the selection information
		this.publish('publishRequest', {} );
    },
    _onMessage: function(message) {
        console.log('Client:Message received from source:', message);
    }

});
