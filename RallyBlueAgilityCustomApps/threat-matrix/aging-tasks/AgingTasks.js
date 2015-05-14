Ext.define('AgingTasks', {
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
                    property : "State",
                    operator : '!=',
                    value : 'Done'
            });
            var timeboxFilter = this.getContext().getTimeboxScope().getQueryFilter();
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
                                'Task'
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
            console.log("Aging stories: Got release changed message");
            this.getContext().setTimeboxScope(release, 'release');
            this._updateBoard();
        },
        _iterationChanged : function(iteration)
        {
            console.log("Aging stories: Got iteration changed message");
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard();
        }
});