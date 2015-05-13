Ext.define('AgingStories', {
        extend : 'Rally.app.App',
        mixins : [
            'Rally.Messageable'
        ],
        componentCls : 'app',
        launch : function()
        {
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            app = this;
        },
        _updateBoard : function()
        {
            var scheduleFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : "ScheduleState",
                    value : 'In-Progress'
            });
            var timeboxFilter = app.getContext().getTimeboxScope().getQueryFilter();
            var filters = timeboxFilter.and(scheduleFilter);
            this.remove('agingstoriesgrid');
            this._myGrid = this.add({
                    xtype : "rallygrid",
                    itemId : 'agingstoriesgrid',
                    enableBulkEdit : true,
                    columnCfgs : [
                                    {
                                            dataIndex : 'FormattedID',
                                            width : 100
                                    },
                                    {
                                            dataIndex : 'Name',
                                            width : 300
                                    },
                                    {
                                            dataIndex : 'Owner',
                                            width : 100
                                    },
                                    {
                                            text : '',
                                            dataIndex : null,
                                            width : 250
                                    },
                                    {
                                            text : 'Age (Days)',
                                            dataIndex : 'InProgressDate',
                                            width : 60,
                                            renderer : function(value)
                                            {
                                                var today = new Date();
                                                return Math.floor((today - value) / (1000 * 60 * 60 * 24));
                                            }
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
            console.log("Aging stories: Got release changed message");
            app.getContext().setTimeboxScope(release, 'release');
            this._updateBoard();
        },
        _iterationChanged : function(iteration)
        {
            console.log("Aging stories: Got iteration changed message");
            app.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
        }
});
