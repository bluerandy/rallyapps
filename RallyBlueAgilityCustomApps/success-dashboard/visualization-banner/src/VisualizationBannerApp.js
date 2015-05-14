Ext.define('Rally.apps.releasetracking.VisualizationBannerApp', {
        extend : 'Rally.app.TimeboxScopedApp',
        requires : [
                        'Rally.app.Message',
                        'Rally.clientmetrics.ClientMetricsRecordable',
                        'Rally.apps.releasetracking.StatsBanner'
        ],
        mixins : [
                        'Rally.clientmetrics.ClientMetricsRecordable',
                        'Rally.Messageable'
        ],
        componentCls : 'iterationtrackingboard',
        alias : 'widget.rallyreleasetrackingapp',
        scopeType : 'release',
        autoScroll : false,
        config : {
            defaultSettings : {
                ignoreProjectScoping : true
            }
        },
        launch : function()
        {
            console.log("Launching banner app...");
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            var app = this;
            console.log("creating timebox");
            this._timeboxSelector = this.add({
                    xtype : 'timebox-selector',
                    context : this.getContext()
            });
        },
        _releaseChanged : function(release)
        {
            console.log("Got release changed message: ", release);
            this.getContext().setTimeboxScope(release, 'release');
            this._updateStatsBanner();
        },
        _iterationChanged : function(iteration)
        {
            if (iteration === null)
                console.log("iteration null");
            console.log("Got iteration changed message: ", iteration);
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateStatsBanner();
        },
        _updateStatsBanner : function()
        {
            console.log("Creating stats banner...");
            this.remove('statsBanner');
            this._statsBanner = this.add({
                    xtype : 'statsbanner',
                    itemId : 'statsBanner',
                    context : this.getContext(),
                    margin : '0 0 5px 0'
            });
        }
});
