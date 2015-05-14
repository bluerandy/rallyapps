Ext.define('wip-limits', {
        extend : 'Rally.app.App',
        mixins : [
            'Rally.Messageable'
        ],
        launch : function()
        {
            this._updateBoard();
        },
        _updateBoard : function(portfolioTimeboxFilter, storyTimeboxFilter)
        {
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
            var me = this;
            var projectGroup = _.groupBy(stories, function(t)
            {
                return t.get("Project") ? t.get("Project")._refObjectName : "none";
            });
            var summaries = _.map(_.keys(projectGroup), function(project)
            {
                var stories = projectGroup[project];
                this.currentProject = project;
                var counts = _.countBy(stories, function(story)
                {
                    return story.get('ScheduleState');
                });
                var values = {};
                var states = [
                                'Backlog',
                                'Defined',
                                'In-Progress',
                                'Completed',
                                'Accepted'
                ];
                _.each(states, function(state)
                {
                    values[state] = _.isUndefined(counts[state]) ? 0 : counts[state];
                    console.log("Getting wip: ", project, state);
                    var wip = this._getWipLimit(project, state);
                    var wipKey = state + 'WIP';
                    if (wip !== null && wip !== undefined)
                    {
                        console.log("wipKey: " + wipKey, "wip: ", wip);
                        values[wipKey] = wip;
                    } else
                    {
                        values[wipKey] = 0;
                    }
                }, me);
                values.project = this.currentProject;
                return values;
            }, this);
            console.log("Summaries: ", summaries);
            var newStore = Ext.create('Rally.data.custom.Store', {
                data : summaries
            });
            newStore.addListener('update', function(store, record, op, fieldNames, eOpts)
            {
                console.log("update", op, record, fieldNames)
            }, store, {
                single : true
            });
            this._displayGrid(newStore);
        },
        _displayGrid : function(store)
        {
            var that = this;
            this.remove('workqueue');
            this.add({
                    xtype : 'rallygrid',
                    itemId : 'workqueue',
                    enablebulkeditable : true,
                    enableEditing : true,
                    store : store,
                    columnCfgs : [
                                    {
                                            text : 'Project',
                                            dataIndex : 'project',
                                            width : 200,
                                            align : 'center'
                                    },
                                    {
                                            text : 'Defined',
                                            dataIndex : 'Defined',
                                            renderer : that.renderLimit,
                                            align : 'center'
                                    },
                                    {
                                            text : 'Defined Limit',
                                            dataIndex : 'DefinedWIP',
                                            editor : {
                                                xtype : 'textfield'
                                            },
                                            align : 'center'
                                    },
                                    {
                                            text : 'In-Progress',
                                            dataIndex : 'In-Progress',
                                            renderer : that.renderLimit,
                                            align : 'center'
                                    },
                                    {
                                            text : 'In-Progress Limit',
                                            dataIndex : 'In-ProgressWIP',
                                            editor : {
                                                xtype : 'textfield'
                                            },
                                            align : 'center'
                                    },
                                    {
                                            text : 'Completed',
                                            dataIndex : 'Completed',
                                            renderer : that.renderLimit,
                                            align : 'center'
                                    },
                                    {
                                            text : 'Completed Limit',
                                            dataIndex : 'CompletedWIP',
                                            editor : {
                                                xtype : 'textfield'
                                            },
                                            align : 'center'
                                    }
                    ]
            });
        },
        renderLimit : function(value, meta, record, row, col, store, gridView)
        {
            var field = null;
            switch (col) {
                case 2:
                    field = "DefinedWIP";
                    break;
                case 4:
                    field = "In-ProgressWIP";
                    break;
                case 6:
                    field = "CompletedWIP";
                    break;
            }
            if (value > record.get(field))
            {
                meta.tdCls = 'over-limit';
            }
            return value;
        },
        _setWipLimit : function(project, state, limit)
        {
            var key = this._getWipKey(project, state);
            var settings = {};
            settings[key] = Ext.JSON.encode(limit);
            console.log("Setting wip limit of " + limit + " for project: " + project, settings);
            Rally.data.PreferenceManager.update({
                    workspace : this.getContext().getWorkspace(),
                    settings : settings,
                    scope : this
            }).then({
                success : function(updatedRecords, notUpdatedRecord, options)
                {
                    console.log('preference update success', updatedRecords, notUpdatedRecord, options);
                }
            });
        },
        _getWipKey : function(project, state)
        {
            return 'project-wip:' + project + ':' + state;
        },
        _getWipLimit : function(project, state)
        {
            console.log("Getting wip limit for project: " + project);
            var key = this._getWipKey(project, state);
            Rally.data.PreferenceManager.load({
                    workspace : this.getContext().getWorkspace(),
                    filterByName : key
            }).then({
                success : function(prefs)
                {
                    console.log("prefs:", prefs, "prefs[key]: ", prefs[key]);
                    if (prefs && prefs[key])
                    {
                        var values = Ext.JSON.decode(prefs[key]);
                        return values;
                    }
                }
            });
        }
});