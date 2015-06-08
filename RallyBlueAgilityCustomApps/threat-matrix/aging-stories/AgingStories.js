Ext.define('AgingStories', {
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
        var scheduleFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "ScheduleState",
            value: 'In-Progress'
        });
        var timeboxFilter = app.getContext().getTimeboxScope().getQueryFilter();
        var filters = timeboxFilter.and(scheduleFilter);
        this.remove('agingstoriesgrid');
        this._myGrid = this.add({
            xtype: "rallygrid",
            itemId: 'agingstoriesgrid',
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
                text: '',
                dataIndex: null,
                flex: 2
            }, {
                text: 'Age (Days)',
                dataIndex: 'InProgressDate',
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
                    property: 'InProgressDate',
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
            console.log("aging stories: Release change message, no change");
        }
    },
    _iterationChanged: function(iteration) {
        if (this.currentTimebox === null || iteration.get('Name') != this.currentTimebox.get('Name')) {
            this.currentTimebox = iteration;
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
        } else {
            console.log("Visualization: iteration change message, no change");
        }
    }
});
