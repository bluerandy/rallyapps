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
        app = this;
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
                width: 100
            }, {
                dataIndex: 'Name',
                flex: 1
            }, {
                dataIndex: 'Owner',
                flex: 0.5
            }, {
                dataIndex: 'ScheduleState',
                width: 100
            }, {
                dataIndex: 'BlockedReason',
                flex: 2
            }, {
                text: 'Age (Days)',
                dataIndex: 'LastUpdateDate',
                width: 60,
                renderer: function(value) {
                    var today = new Date();
                    return Math.floor((today - value) / (1000 * 60 * 60 * 24));
                }
            }],
            context: this.getContext(),
            storeConfig: {
                models: [
                    'userstory'
                ],
                sorters: {
                    property: 'LastUpdateDate',
                    direction: 'ASC'
                },
                filters: filters
            }
        });
    },
    _releaseChanged: function(release) {
        if (this.currentTimebox === null || release.get('Name') != this.currentTimebox.get('Name')) {
            this.currentTimebox = release;
            this.getContext().setTimeboxScope(release, 'release');
            this._updateBoard();
        } else {
            // me.logger.log("aging tasks: Release change message, no change");
        }
    },
    _iterationChanged: function(iteration) {
        if (this.currentTimebox === null || iteration.get('Name') != this.currentTimebox.get('Name')) {
            this.currentTimebox = iteration;
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
        } else {
            // me.logger.log("tasks: iteration change message, no change");
        }
    }
});
