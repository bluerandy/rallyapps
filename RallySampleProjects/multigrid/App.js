var app = null;

Ext.define('CustomApp', {
        extend : 'Rally.app.App',
        requires : [
            'Rally.ui.gridboard.plugin.GridBoardFieldPicker'
        ],
        uses : [
            'Ext.ux.exporter.Exporter'
        ],
        componentCls : 'app',
        // items:{ html:'<a
        // href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3
        // Docs</a>'},
        launch : function()
        {
            app = this;
            this._myModels = [];
            this._myButton = this.add({
                    xtype : 'rallybutton',
                    height : 20,
                    text : 'Export to CSV',
                    listeners : {

                            scope : this,
                            click : function()
                            {
                                var exporter = Ext.create("GridExporter", {});
                                console.log("clicked", exporter);
                                exporter.exportGrid(app._myGrid);
                            }
                    }
            });

            this._boxcontainer = Ext.create('Ext.form.Panel', {
                    title : 'Select the Type of Items to Display in the Grid',
                    width : 500,
                    bodyPadding : 10,
                    items : [
                        {
                                xtype : 'checkboxgroup',
                                columns : 3,
                                vertical : true,
                                listeners : {
                                        change : this._onCheck,
                                        scope : this
                                },
                                items : [
                                                {
                                                        boxLabel : 'Stories',
                                                        name : 'userstory',
                                                        checked : true
                                                },
                                                {
                                                        boxLabel : 'Defects',
                                                        name : 'defect',
                                                        checked : false
                                                },
                                                {
                                                        boxLabel : 'Features',
                                                        name : 'portfolioitem/feature',
                                                        checked : false
                                                }
                                ],
                                scope : this
                        }
                    ]
            });
            this.add(this._boxcontainer);

            // this.add(this._boxcontainer);

            var filter = '';
            // if there is a timebox on the dashboard/page, make use of it
            var timeboxScope = this.getContext().getTimeboxScope();
            if (timeboxScope)
            {
                filter = (timeboxScope.getQueryFilter());
            }

            this._myGrid = this.add({
                    xtype : 'rallygrid',
                    enableBulkEdit : true,
                    // plugins: ''
                    columnCfgs : [
                                    'FormattedID',
                                    'Name',
                                    'ScheduleState',
                                    'Owner'
                    ],
                    context : this.getContext(),
                    storeConfig : {
                            models : [
                                'userstory'
                            ], // default
                            filters : [
                                filter
                            ]
                    }
            });

        },

        _onCheck : function(obj, value)
        {
            var that = this;
            var models = [];
            if (obj)
            { // if no obj, then no models checked
                console.log("obj: ", obj);
                var values = obj.getChecked();
                if (values.length === 0)
                {
                    // no model, for now ignore
                    alert("No Items Checked! You must select at least one item type");
                    return;
                }

                var model;
                Ext.Array.each(values, function(type)
                {
                    model = type.getName();
                    console.log("model: ", model);
                    models.push(model);
                });
                console.log("grid: ", that._myGrid);
                that._myGrid.reconfigureWithModel(models);

                // re-apply filter since reconfiguring model doesn't do this
                var filter = '';
                var timeboxScope = this.getContext().getTimeboxScope();
                if (timeboxScope)
                {
                    filter = (timeboxScope.getQueryFilter());
                }
                var store = this._myGrid.getStore();
                store.clearFilter(!0), store.filter(filter);
            } else
            {
                // no model, for now ignore
                console.log("Nothing checked");
                alert("No Items Checked! You must select at least one work item type");
            }
        },

        _updateGrid : function(myStore)
        {
            console.log("Updating Grid");
            this._myGrid.reconfigure(myStore);
        },

        onTimeboxScopeChange : function(newTimeboxScope)
        {
            // console.log("Timebox Changed called");
            var newFilter = (newTimeboxScope.getQueryFilter());
            var store = this._myGrid.getStore();
            store.clearFilter(true);
            store.filter(newFilter);
            this._updateGrid(store);
        }
});
