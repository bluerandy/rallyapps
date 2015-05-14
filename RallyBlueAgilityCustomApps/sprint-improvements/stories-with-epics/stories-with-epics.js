Ext.define('stories-with-epics', {
        extend : 'Rally.app.TimeboxScopedApp',
        layout : 'fit',
        requires : [
                        'Rally.data.util.Sorter',
                        'Rally.ui.combobox.FieldComboBox',
                        'Rally.ui.combobox.ComboBox',
                        'Rally.ui.picker.FieldPicker',
                        'Rally.ui.TextField',
                        'Rally.ui.NumberField',
                        'Rally.data.wsapi.Filter',
                        'Rally.ui.grid.Grid',
                        'Rally.data.ModelFactory',
                        'Rally.domain.WsapiModelBuilder',
                        'Rally.ui.grid.plugin.PercentDonePopoverPlugin'
        ],
        scopeType : 'iteration',
        config : {
            defaultSettings : {
                    types : 'hierarchicalrequirement',
                    multiselect : true
            }
        },
        getSettingsFields : function()
        {
            return [
                            {
                                    name : 'type',
                                    xtype : 'rallycombobox',
                                    multiselect : true,
                                    shouldRespondToScopeChange : true,
                                    context : this.getContext(),
                                    storeConfig : {
                                            model : Ext.identityFn('TypeDefinition'),
                                            fetch : [
                                                            'DisplayName',
                                                            'ElementName',
                                                            'TypePath'
                                            ],
                                            filters : [
                                                {
                                                        property : 'Creatable',
                                                        value : true
                                                }
                                            ],
                                            autoLoad : false,
                                            remoteSort : false,
                                            remoteFilter : true
                                    },
                                    displayField : 'DisplayName',
                                    valueField : 'TypePath',
                                    listeners : {
                                            select : function(combo, records)
                                            {
                                                combo.fireEvent('typeselected', records[0].get('TypePath'), combo.context);
                                            },
                                            ready : function(combo)
                                            {
                                                combo.store.sort('DisplayName');
                                                combo.fireEvent('typeselected', combo.getRecord().get('TypePath'), combo.context);
                                            }
                                    },
                                    bubbleEvents : [
                                        'typeselected'
                                    ],
                                    readyEvent : 'ready',
                                    handlesEvents : {
                                        projectscopechanged : function(context)
                                        {
                                            this.refreshWithNewContext(context);
                                        }
                                    }
                            },
                            {
                                    name : 'columns',
                                    fieldLabel : 'Columns',
                                    xtype : 'rallyfieldpicker',
                                    handlesEvents : {
                                        typeselected : function(type, context)
                                        {
                                            this.refreshWithNewModelTypes([
                                                type
                                            ], context);
                                        }
                                    }
                            },
                            {
                                    type : 'query',
                                    config : {
                                        plugins : [
                                                        {
                                                                ptype : 'rallyhelpfield',
                                                                helpId : 194
                                                        },
                                                        'rallyfieldvalidationui'
                                        ]
                                    }
                            },
                            {
                                    name : 'order',
                                    xtype : 'rallytextfield'
                            }
            ];
        },
        launch : function()
        {
            var context = this.getContext(), fetch = this._getFetch(), columns = this._getColumns(fetch);
            this.add({
                    xtype : 'rallygrid',
                    columnCfgs : columns,
                    enableColumnHide : false,
                    enableRanking : true,
                    enableBulkEdit : true,
                    context : this.getContext(),
                    storeConfig : {
                            fetch : fetch,
                            models : [
                                this.getSetting('type')
                            ],
                            filters : this._getFilters(),
                            sorters : Rally.data.util.Sorter.sorters(this.getSetting('order'))
                    }
            });
        },
        onTimeboxScopeChange : function(newTimeboxScope)
        {
            this.callParent(arguments);
            this.down('rallygrid').filter(this._getFilters(), true, true);
        },
        _getFilters : function()
        {
            var filters = [], query = this.getSetting('query'), timeboxScope = this.getContext().getTimeboxScope();
            if (query)
            {
                try
                {
                    query = new Ext.Template(query).apply({
                        user : Rally.util.Ref.getRelativeUri(this.getContext().getUser())
                    });
                } catch (e)
                {
                }
                filters.push(Rally.data.wsapi.Filter.fromQueryString(query));
            }
            if (timeboxScope && this._isSchedulableType(this.getSetting('type')))
            {
                filters.push(timeboxScope.getQueryFilter());
            }
            return filters;
        },
        _isSchedulableType : function(type)
        {
            return _.contains([
                            'hierarchicalrequirement',
                            'task'
            ], type.toLowerCase());
        },
        _getFetchOnlyFields : function()
        {
            return [
                            'LatestDiscussionAgeInMinutes',
                            'Feature.Parent.Name',
                            'Feature.Parent.FormattedID'
            ];
        },
        _getFetch : function()
        {
            var fetch = this.getSetting('columns');
            fetch += ',Feature.Parent.Name, Feature.Parent.FormattedID';
            console.log('Fetch: ', fetch);
            return fetch;
        },
        _getColumns : function(fetch)
        {
            if (fetch)
            {
                var tmp = Ext.Array.difference(fetch.split(','), this._getFetchOnlyFields());
                tmp.push({
                        text : 'Epic ID',
                        dataIndex : 'Feature.Parent.FormattedID',
                        xtype : 'templatecolumn',
                        tpl : Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                }, {
                        text : 'Epic Name',
                        dataIndex : 'Feature.Parent.Name'
                });
                console.log("Columns: ", tmp);
                return tmp;
            }
            return [];
        }
});