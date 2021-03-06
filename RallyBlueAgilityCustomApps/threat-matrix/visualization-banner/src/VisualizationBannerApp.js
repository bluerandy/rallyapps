Ext.define('Rally.apps.releasetracking.VisualizationBannerApp', {
        extend : 'Rally.app.TimeboxScopedApp',
        currentTimebox : null,
        requires : [
                        'Rally.data.wsapi.TreeStoreBuilder',
                        'Rally.ui.cardboard.plugin.FixedHeader',
                        'Rally.ui.cardboard.plugin.ColumnPolicy',
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
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            this.add({
                    xtype : 'timebox-selector',
                    context : this.getContext()
            });
            if (this.currentTimebox === null)
                this.publish('timeboxRequest', this);
        },
        _releaseChanged : function(release)
        {
            // me.logger.log("Visualization banner: Got release changed message: ", release);
            if (this.currentTimebox === null || release.get('Name') != this.currentTimebox.get('Name'))
            {
                // me.logger.log("visual release: setting timebox");
                this.currentTimebox = release;
                // me.logger.log("visual release: setting context timebox");
                this.getContext().setTimeboxScope(release, 'release');
                this._updateStatsBanner();
            } else
            {
                // me.logger.log("Visualization: Release change message, no change");
            }
        },
        _iterationChanged : function(iteration)
        {
            // me.logger.log("Visualization banner: Got iteration changed message: ", iteration);
            if (this.currentTimebox === null || iteration.get('Name') != this.currentTimebox.get('Name'))
            {
                // me.logger.log("visual iteration: setting timebox");
                this.currentTimebox = iteration;
                // this.getContext().setTimeboxScope(iteration, 'iteration');
                this._updateStatsBanner();
            } else
            {
                // me.logger.log("Visualization: iteration change message, no change");
            }
        },
        _updateStatsBanner : function()
        {
            this.remove('statsBanner');
            this._statsBanner = this.add({
                    xtype : 'statsbanner',
                    itemId : 'statsBanner',
                    context : this.getContext(),
                    margin : '0 0 5px 0'
            });
        }
});