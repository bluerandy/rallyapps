Ext.define('wip-limits', {
        extend : 'Rally.app.App',
//        preferences : new Rally.PreferenceUtility(),
        mixins : [
            'Rally.Messageable'
        ],
        launch : function()
        {
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            this._updateBoard();
        },
        _updateBoard : function(portfolioTimeboxFilter, storyTimeboxFilter)
        {
            var me = this;
            var model = Rally.data.ModelFactory.getModel({
                    type : 'UserStory',
                    scope : this
            });
            var store = Ext.create('Rally.data.wsapi.Store', {
                    model : 'hierarchicalrequirement',
                    fetch : [
                                    'Name',
                                    'FormattedID',
                                    'Project',
                                    'ScheduleState'
                    ],
                    limit : Infinity
            });
            store.on('load', this._onStoriesLoaded, this);
            store.load();
        },
        _onStoriesLoaded : function(store, stories)
        {
            var wip_test = [];
            var tmp = {};
            tmp["project"] = "IA-Program > IA Project Governance & Leadership";
            tmp["In-Progress"] = 10;
            tmp["Completed"] = 5;
            wip_test.push(tmp);
            var g = _.groupBy(stories, function(t)
            {
                return t.get("Project") ? t.get("Project")._refObjectName : "none";
            });
            // console.log("Group: ", g);
            var summaries = _.map(_.keys(g), function(key)
            {
                var stories = g[key];
                // console.log("Stories: ", stories);
                var counts = _.countBy(stories, function(story)
                {
                    return story.get('ScheduleState');
                });
                var values = {};
                _.each([
                                'Backlog',
                                'Defined',
                                'In-Progress',
                                'Completed',
                                'Accepted'
                ], function(state)
                {
                    values[state] = _.isUndefined(counts[state]) ? 0 : counts[state];
                });
                _.each(wip_test, function(wip)
                {
                    if (wip['project'] == key)
                    {
                        values["in-progress-wip"] = wip['In-Progress'];
                        values["completed-wip"] = wip['Completed'];
                        values['defined-wip'] = 0;
                    } else
                    {
                        values["in-progress-wip"] = 0;
                        values["completed-wip"] = 0;
                        values['defined-wip'] = 0;
                    }
                });
                values["project"] = key;
                // console.log("Counts: ", counts);
                return values;
            });
            console.log("Summaries: ", summaries);
            var newStore = Ext.create('Rally.data.custom.Store', {
                data : summaries,
                listeners : {
                    update : function(store,record,op,fieldNames,eOpts) {
                        console.log("rec:",op,record,fieldNames);
                    }
                }
            });
            this._displayGrid(newStore);
        },
        _displayGrid : function(store)
        {
            // this.remove('workqueue');
            this.add({
                    xtype : 'rallygrid',
                    itemId : 'workqueue',
                    enablebulkeditable : true,
                    enableEditing : true,
                    store : store,

                    columnCfgs : [
                                    {
                                            text : 'Project',
                                            dataIndex : 'project'
                                    },
                                    {
                                            text : 'Backlog',
                                            dataIndex : 'Backlog'
                                    },
                                    {
                                            text : 'Defined',
                                            dataIndex : 'Defined'
                                    },
                                    {
                                            text : 'Defined Limit',
                                            dataIndex : 'defined-wip',
                                            editor : {xtype:'textfield'}

                                    },
                                    {
                                            text : 'In-Progress',
                                            dataIndex : 'In-Progress'
                                    },
                                    {
                                            text : 'In-Progress Limit',
                                            dataIndex : 'in-progress-wip'
                                    },
                                    {
                                            text : 'Completed',
                                            dataIndex : 'Completed'
                                    },
                                    {
                                            text : 'Completed Limit',
                                            dataIndex : 'completed-wip'
                                    },
                                    {
                                            text : 'Accepted',
                                            dataIndex : 'Accepted'
                                    }
                    ]
            });
        },
        _releaseChanged : function(release)
        {
            var releaseStartFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PlannedEndDate',
                    operator : '>=',
                    value : Rally.util.DateTime.toIsoString(release.get('ReleaseStartDate'))
            });
            var releaseEndFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PlannedEndDate',
                    operator : '<=',
                    value : Rally.util.DateTime.toIsoString(release.get('ReleaseDate'))
            });
            var portfolioTimeboxFilter = releaseEndFilter.and(releaseStartFilter);
            var storyFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Release.Name',
                    value : release.get('Name')
            });
            this.getContext().setTimeboxScope(release, 'release');
            this._updateBoard(portfolioTimeboxFilter, storyFilter);
        },
        _iterationChanged : function(iteration)
        {
            var iterationStartFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PlannedEndDate',
                    operator : '>=',
                    value : Rally.util.DateTime.toIsoString(iteration.get('StartDate'))
            });
            var iterationEndFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PlannedEndDate',
                    operator : '<=',
                    value : Rally.util.DateTime.toIsoString(iteration.get('EndDate'))
            });
            var portfolioTimeboxFilter = iterationStartFilter.and(iterationEndFilter);
            var storyFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Iteration.Name',
                    value : iteration.get('Name')
            });
            this.getContext().setTimeboxScope(iteration, 'iteration');
            this._updateBoard(portfolioTimeboxFilter, storyFilter);
        }
});