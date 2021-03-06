Ext.define('BlockedStories', {
    extend: 'Rally.app.App',
    currentTimebox: null,
    layout: {
        type: "fit"
    },
    mixins: [
        'Rally.Messageable'
    ],
    componentCls: 'app',
    launch: function() {
        this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
        this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
        var app = this;
        if (this.currentTimebox === null)
            this.publish('requestTimebox', this);
    },
    _updateBoard: function() {
        var blockedFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "Blocked",
            value: true
        });
        var scheduleFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "ScheduleState",
            operator: '!=',
            value: 'Accepted'
        });
        var timeboxFilter = this.getContext().getTimeboxScope().getQueryFilter();
        var filters = timeboxFilter.and(blockedFilter).and(scheduleFilter);
        this.remove('blockedgrid');
        this._myGrid = this.add({
            xtype: 'rallygrid',
            itemId: 'blockedgrid',
            enableBulkEdit: true,
            columnCfgs: [{
                dataIndex: 'FormattedID',
                width: 80
            }, {
                dataIndex: 'Name',
                width: 300
            }, {
                dataIndex: 'Owner',
                width: 120
            }, {
                dataIndex: 'BlockedReason',
                width: 220
            }, {
                dataIndex: 'ScheduleState',
                width: 80
            }],
            context: this.getContext(),
            storeConfig: {
                models: [
                    'userstory'
                ],
                filters: filters
            }
        });
    },
    _releaseChanged: function(release) {
        // me.logger.log("Blocked stories: got release change", release, this.currentTimebox);
        if (release !== null) {
            // if (this.currentTimebox === null || release.get('Name') !=
            // this.currentTimebox.get('Name'))
            // {
            this.currentTimebox = release;
            this.getContext().setTimeboxScope(release, 'release');
            this._updateBoard();
            // } else
            // {
            // // me.logger.log("Blocked stories: Release change message, no
            // change");
            // }
        }
    },
    _iterationChanged: function(iteration) {
        // me.logger.log("Blocked stories: got iteration change", iteration, this.currentTimebox);
        if (iteration !== null) {
            // if (this.currentTimebox === null || iteration.get('Name') !=
            // this.currentTimebox.get('Name'))
            // {
            this.currentTimebox = iteration;
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
            // } else
            // {
            // // me.logger.log("Blocked stories: iteration change message, no
            // change");
            // }
        }
    }
});
