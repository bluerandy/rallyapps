var app = null;
Ext.define('TeamStories', {
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
        var scheduleFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "ScheduleState",
            operator: '<',
            value: 'Completed'
        });
        var blockedFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "Blocked",
            value: false
        });
        var timeboxFilter = this.getContext().getTimeboxScope().getQueryFilter();
        var filters = timeboxFilter.and(blockedFilter).and(scheduleFilter);
        this.remove('teamstories');
        this._myGrid = this.add({
            xtype: 'rallygrid',
            itemId: 'teamstories',
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
                text: '',
                width: 220,
                dataIndex: null
            }, {
                dataIndex: 'ScheduleState',
                width: 80
            }],
            context: this.getContext(),
            storeConfig: {
                models: [
                    'userstory'
                ],
                sorters: {
                    property: 'InProgressDate',
                    direction: 'ASC'
                },
                filters: filters
            }
        });
    },
    _releaseChanged: function(release) {
        // me.logger.log("Team stories: got release change", release, this.currentTimebox);
        if (release !== null) {
            // if (this.currentTimebox === null || release.get('Name') !=
            // this.currentTimebox.get('Name'))
            // {
            this.currentTimebox = release;
            this.getContext().setTimeboxScope(release, 'release');
            this._updateBoard();
            // } else
            // {
            // // me.logger.log("Team stories: Release change message, no
            // change");
            // }
        }
    },
    _iterationChanged: function(iteration) {
        // me.logger.log("Team stories: got iteration change", iteration, this.currentTimebox);
        if (iteration !== null) {
            // if (this.currentTimebox === null || iteration.get('Name') !=
            // this.currentTimebox.get('Name'))
            // {
            this.currentTimebox = iteration;
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
            // } else
            // {
            // // me.logger.log("Team stories: iteration change message, no
            // change");
            // }
        }
    }
});
