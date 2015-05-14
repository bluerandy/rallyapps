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
            var tmp = {
                    "project" : "ACP",
                    "In-Progress" : 10,
                    "Completed" : 5
            };
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
                    var wip = this._getWipLimit(key, state);
                    console.log("Got WIP: ", wip);
                    var wipKey = state + "WIP";
                    if (wip !== null)
                    {
                        values[wipKey] = wip;
                    } else
                    {
                        values[wipKey] = 0;
                    }
                });
                values["project"] = key;
                return values;
            });
            console.log("Summaries: ", summaries);
            var newStore = Ext.create('Rally.data.custom.Store', {
                    data : summaries,
                    listeners : {
                        update : function(store, record, op, fieldNames, eOpts)
                        {
                            console.log("rec:", op, record, fieldNames);
                            var project = record.get('project');
                            var state;
                            this._setWipLimit(project, state, op);
                        }
                    }
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
                                            dataIndex : 'project'
                                    },
                                    {
                                            text : 'Defined',
                                            dataIndex : 'Defined',
                                            renderer : that.renderLimit
                                    },
                                    {
                                            text : 'Defined Limit',
                                            dataIndex : 'DefinedWIP',
                                            editor : {
                                                xtype : 'textfield'
                                            }
                                    },
                                    {
                                            text : 'In-Progress',
                                            dataIndex : 'In-Progress',
                                            renderer : that.renderLimit
                                    },
                                    {
                                            text : 'In-Progress Limit',
                                            dataIndex : 'In-ProgressWIP',
                                            editor : {
                                                xtype : 'textfield'
                                            }
                                    },
                                    {
                                            text : 'Completed',
                                            dataIndex : 'Completed',
                                            renderer : that.renderLimit
                                    },
                                    {
                                            text : 'Completed Limit',
                                            dataIndex : 'CompletedWIP',
                                            editor : {
                                                xtype : 'textfield'
                                            }
                                    }
                    ]
            });
        },
        renderLimit : function(value, meta, record, row, col, store, gridView)
        {
            console.log("Row: " + row + "  col: " + col, "Value: " + value, "Record: ", record);
            var field = null;
            switch (col) {
                case 2:
                    field = "defined-wip";
                    break;
                case 4:
                    field = "in-progress-wip";
                    break;
                case 6:
                    field = "completed-wip";
                    break;
            }
            console.log("Value: " + value + "  limit: " + record.get(field));
            if (value > record.get(field))
            {
                console.log("setting meta: ", meta);
                meta.tdCls = 'over-limit';
            }
            return value;
        },
        _setWipLimit : function(project, state, limit)
        {
            settings['project-wip:' + project + ':' + state] = Ext.JSON.Encode(limit);
            console.log("Setting wip limit of " + limit + " for project: " + project);
            Rally.data.PreferenceManager.update({
                    workspace : this.getContext().getWorkspace(),
                    settings : settings,
                    scope : this,
                    success : function(updatedRecords, notUpdatedRecord, options)
                    {
                        me.console.log('success', me.getContext().getWorkspace(), updatedRecords, notUpdatedRecord, options);
                    }
            });
        },
        _getWipLimit : function(project, state)
        {
            console.log("Getting wip limit for project: " + project);
            Rally.data.PreferenceManager.load({
                    workspace : this.getContext().getWorkspace(),
                    filterByName : 'project-wip:' + project + ':' + state,
                    success : function(prefs)
                    {
                        this.console.log("prefs", prefs);
                        if (prefs && prefs[key])
                        {
                            var values = Ext.JSON.decode(prefs[key]);
                            console.console.log(values);
                            return values;
                        }
                    }
            });
        }
});