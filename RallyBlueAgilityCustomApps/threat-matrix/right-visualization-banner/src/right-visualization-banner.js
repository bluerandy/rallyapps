Ext.define('RightVisualizationBannerApp', {
        extend : 'Rally.app.App',
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
        componentCls : 'RightVisualizationBannerApp',
        alias : 'RightVisualizationBannerApp',
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
                xtype : 'spacer'
            });
            this._statsBanner = this.add({
                    xtype : 'RightStatsBanner',
                    itemId : 'RightStatsBanner',
                    context : this.getContext(),
                    margin : '0 0 5px 0'
            });
        }
});
