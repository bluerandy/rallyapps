Ext.define('Rally.apps.releasetracking.VisualizationBannerApp', {
        extend : 'Rally.app.TimeboxScopedApp',
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
        },
        _releaseChanged : function(release)
        {
            this.getContext().setTimeboxScope(release, 'release');
            this._updateStatsBanner();
        },
        _iterationChanged : function(iteration)
        {
            this._updateStatsBanner();
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
