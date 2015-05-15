Ext.define('RightVisualizationBannerApp', {
    extend: 'Rally.app.App',
    currentTimebox: null,
    requires: [
        'Rally.data.wsapi.TreeStoreBuilder',
        'Rally.ui.cardboard.plugin.FixedHeader',
        'Rally.ui.cardboard.plugin.ColumnPolicy',
        'Rally.app.Message',
        'Rally.clientmetrics.ClientMetricsRecordable',
        'Rally.apps.releasetracking.StatsBanner'
    ],
    mixins: [
        'Rally.clientmetrics.ClientMetricsRecordable',
        'Rally.Messageable'
    ],
    componentCls: 'RightVisualizationBannerApp',
    alias: 'RightVisualizationBannerApp',
    autoScroll: false,
    config: {
        defaultSettings: {
            ignoreProjectScoping: true
        }
    },
    launch: function() {
        this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
        this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
        this.add({
            xtype: 'spacer'
        });
        this._statsBanner = this.add({
            xtype: 'RightStatsBanner',
            itemId: 'RightStatsBanner',
            context: this.getContext(),
            margin: '0 0 5px 0'
        });
    },
    _releaseChanged: function(release) {
        console.log("right Visualization banner: Got release changed message: ", release);
        if (this.currentTimebox === null || release.get('Name') != this.currentTimebox.get('Name')) {
            console.log("visual release: setting timebox");
            this.currentTimebox = release;
            console.log("visual release: setting context timebox");
            this.getContext().setTimeboxScope(release, 'release');
            this._updateStatsBanner();
        } else {
            console.log("right Visualization: Release change message, no change");
        }
    },
    _iterationChanged: function(iteration) {
        console.log("righ Visualization banner: Got iteration changed message: ", iteration);
        if (this.currentTimebox === null || iteration.get('Name') != this.currentTimebox.get('Name')) {
            console.log("visual iteration: setting timebox");
            this.currentTimebox = iteration;
            // this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateStatsBanner();
        } else {
            console.log("Visualization: iteration change message, no change");
        }
    }
});
