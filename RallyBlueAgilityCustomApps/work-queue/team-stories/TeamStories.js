var app = null;
Ext.define('TeamStories', {
        extend : 'Rally.app.App',
        mixins : [
            'Rally.Messageable'
        ],
        componentCls : 'app',
        launch : function()
        {
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            var app = this;
        },
        _updateBoard : function()
        {
            var scheduleFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : "ScheduleState",
                    operator : '<',
                    value : 'Completed'
            });
            var blockedFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : "Blocked",
                    value : false
            });
            var timeboxFilter = this.getContext().getTimeboxScope().getQueryFilter();
            var filters = timeboxFilter.and(blockedFilter).and(scheduleFilter);
            this.remove('teamstories');
            this._myGrid = this.add({
                    xtype : 'rallygrid',
                    itemId : 'teamstories',
                    enableBulkEdit : true,
                    columnCfgs : [
                                    {
                                            dataIndex : 'FormattedID',
                                            width : 80
                                    },
                                    {
                                            dataIndex : 'Name',
                                            width : 300
                                    },
                                    {
                                            dataIndex : 'Owner',
                                            width : 120
                                    },
                                    {
                                            text : '',
                                            width : 220,
                                            dataIndex : null
                                    },
                                    {
                                            dataIndex : 'ScheduleState',
                                            width : 80
                                    }
                    ],
                    context : this.getContext(),
                    storeConfig : {
                            models : [
                                'userstory'
                            ],
                            sorters : {
                                    property : 'InProgressDate',
                                    direction : 'ASC'
                            },
                            filters : filters
                    }
            });
        },
        _releaseChanged : function(release)
        {
            this.getContext().setTimeboxScope(release, 'release');
            this._updateBoard();
        },
        _iterationChanged : function(iteration)
        {
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
        }
});
