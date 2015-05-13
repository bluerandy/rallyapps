Ext.define('BlockedStories', {
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
            var blockedFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : "Blocked",
                    value : true
            });
            var scheduleFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : "ScheduleState",
                    operator : '!=',
                    value : 'Accepted'
            });
            var timeboxFilter = this.getContext().getTimeboxScope().getQueryFilter();
            var filters = timeboxFilter.and(blockedFilter).and(scheduleFilter);
            this.remove('blockedgrid');
            this._myGrid = this.add({
                    xtype : 'rallygrid',
                    itemId : 'blockedgrid',
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
                                            dataIndex : 'ScheduleState',
                                            width : 100
                                    },
                                    {
                                            dataIndex : 'BlockedReason',
                                            width : 150
                                    },
                                    {
                                            text : 'Age (Days)',
                                            dataIndex : 'LastUpdateDate',
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
                                    property : 'LastUpdateDate',
                                    direction : 'ASC'
                            },
                            filters : filters
                    }
            });
        },
        _releaseChanged : function(release)
        {
            console.log("BlockedStories: Got release changed message");
            this.getContext().setTimeboxScope(release, 'release');
            this._updateBoard();
        },
        _iterationChanged : function(iteration)
        {
            console.log("Blocked Stories: Got iteration changed message");
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
        }
});
