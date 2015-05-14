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
        currentTimebox : null,
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
            if (this.currentTimebox === null)
            {
                console.log("timebox null, requesting timebox");
                this.publish('requestTimebox', this);
            }
        },
        _releaseChanged : function(release)
        {
            console.log("Visualization banner: Got release changed message: ", release);
            if (this.currentTimebox === null || release.get('Name') != this.currentTimebox.get('Name'))
            {
                console.log("visual release: setting timebox");
                this.currentTimebox = release;
                console.log("visual release: setting context timebox");
                this.getContext().setTimeboxScope(release, 'release');
                this._updateStatsBanner();
            } else
            {
                console.log("Visualization: Release change message, no change");
            }
        },
        _iterationChanged : function(iteration)
        {
            console.log("Visualization banner: Got iteration changed message: ", iteration);
            if (this.currentTimebox === null || iteration.get('Name') != this.currentTimebox.get('Name'))
            {
                console.log("visual iteration: setting timebox");
                this.currentTimebox = iteration;
                this.getContext().setTimeboxScope(iteration, 'iteration');
                this._updateStatsBanner();
            } else
            {
                console.log("Visualization: iteration change message, no change");
            }
        },
        _updateStatsBanner : function()
        {
            console.log("Creating stats banner...");
            this.remove('statsBanner');
            console.log('removed old banner, adding new one');
            this._statsBanner = this.add({
                    xtype : 'statsbanner',
                    itemId : 'statsBanner',
                    context : this.getContext(),
                    margin : '0 0 5px 0'
            });
        }
});
