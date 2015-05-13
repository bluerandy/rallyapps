Ext
                .define(
                                "PortfolioItemCSVBulkUpdate",
                                {
                                        extend : 'Rally.app.App',
                                        componentCls : 'app',
                                        logger : new Rally.technicalservices.Logger(),
                                        items : [
                                                        {
                                                                xtype : 'container',
                                                                itemId : 'selection_box',
                                                                layout : {
                                                                    type : 'hbox'
                                                                },
                                                                padding : 10
                                                        },
                                                        {
                                                                xtype : 'container',
                                                                itemId : 'display_box'
                                                        },
                                                        {
                                                                xtype : 'container',
                                                                itemId : 'grid_box'
                                                        },
                                                        {
                                                            xtype : 'tsinfolink'
                                                        }
                                        ],
                                        launch : function()
                                        {
                                            this.down('#selection_box').add({
                                                    xtype : 'rallyportfolioitemtypecombobox',
                                                    itemId : 'type-combo',
                                                    fieldLabel : 'PortfolioItem Type',
                                                    labelWidth : 100,
                                                    labelAlign : 'right',
                                                    margin : 10
                                            });
                                            this.down('#selection_box').add({
                                                    xtype : 'filefield',
                                                    fieldLabel : 'Import File',
                                                    itemId : 'file-import',
                                                    labelWidth : 100,
                                                    labelAlign : 'right',
                                                    msgTarget : 'side',
                                                    allowBlank : false,
                                                    margin : 10,
                                                    buttonText : 'Import...',
                                                    buttonConfig : {
                                                        cls : 'primary rly-small'
                                                    },
                                                    listeners : {
                                                            scope : this,
                                                            change : this._uploadFile
                                                    }
                                            });
                                            this.down('#selection_box').add({
                                                    xtype : 'rallybutton',
                                                    itemId : 'btn-save',
                                                    text : 'Save Updates',
                                                    scope : this,
                                                    margin : '10 10 10 100',
                                                    handler : this._saveUpdates
                                            });
                                            this.down('#selection_box').add({
                                                    xtype : 'container',
                                                    itemId : 'error_box',
                                                    padding : 25,
                                                    flex : 1,
                                                    tpl : '<tpl for="."><font color="red">Error: {Msg}</error><br></tpl>'
                                            });
                                        },
                                        _uploadFile : function(fld, val)
                                        {
                                            this.down('#error_box').update('');
                                            if (val.length == 0)
                                            {
                                                return;
                                            }
                                            var newValue = val.replace(/C:\\fakepath\\/g, '');
                                            fld.setRawValue(newValue);
                                            var upload_file = document.getElementById(fld.fileInputEl.id).files[0].slice();
                                            var me = this;
                                            var reader = new FileReader();
                                            reader.addEventListener("loadend", function()
                                            {
                                                // reader.result contains the
                                                // contents of blob as a typed
                                                // array
                                                me._startImport(reader.result);
                                            });
                                            this.setLoading('Reading File...');
                                            reader.readAsText(upload_file);
                                        },
                                        _getDefaultMapping : function(field)
                                        {
                                            /**
                                             * This looks for a default field in
                                             * 1 of 3 places: 1 - Looks for
                                             * existing settings 2 - Looks to
                                             * see if the field name matches an
                                             * existing field name 3 - Looks to
                                             * see if the field name matches an
                                             * existing field display name
                                             */
                                            var mapping = null;
                                            if (field == 'Rally ID')
                                            {
                                                return 'FormattedID';
                                            }
                                            return mapping;
                                        },
                                        _buildFieldMappers : function(headers, model)
                                        {
                                            Ext.each(headers, function(field)
                                            {
                                                console.log('mappedfield', field);
                                                var cb = this.down('#pnl-mapping').add({
                                                        xtype : 'rallyfieldcombobox',
                                                        fieldLabel : field,
                                                        labelWidth : 300,
                                                        labelAlign : 'right',
                                                        model : model,
                                                        allowNoEntry : true,
                                                        noEntryText : '-- None --',
                                                        emptyText : '-- None --'
                                                });
                                                var mappedField = this._getDefaultMapping(field);
                                                cb.on('ready', function(cb)
                                                {
                                                    cb.setValue(mappedField);
                                                }, this, {
                                                    single : true
                                                });
                                            }, this);
                                        },
                                        _getImportedData : function(textData)
                                        {
                                            this.logger.log('_getImportedData', textData);
                                            // Validate FormattedID field exists
                                            // Vaidate other fields, values and
                                            // correct format
                                            var data = Rally.technicalservices.FileUtilities.CSVtoDataHash(textData);
                                            return data;
                                        },
                                        _startImport : function(file_contents)
                                        {
                                            this.logger.log('_startImport', file_contents);
                                            this.artifactType = this.down('#type-combo').getRecord().get('TypePath');
                                            this.csvData = this._getImportedData(file_contents);
                                            if (this.csvData && this.csvData.length > 0)
                                            {
                                                if (!this.down('tabpanel'))
                                                {
                                                    this.down('#display_box').add({
                                                            xtype : 'tabpanel',
                                                            activeTab : 0,
                                                            itemId : 'pnl-display',
                                                            items : [
                                                                            {
                                                                                    title : 'Fields',
                                                                                    layout : {
                                                                                        type : 'hbox'
                                                                                    },
                                                                                    items : [
                                                                                                    {
                                                                                                            layout : {
                                                                                                                type : 'vbox'
                                                                                                            },
                                                                                                            itemId : 'pnl-mapping'
                                                                                                    },
                                                                                                    {
                                                                                                            xtype : 'rallybutton',
                                                                                                            text : 'Refresh Data',
                                                                                                            scope : this,
                                                                                                            handler : this._refreshGrid
                                                                                                    }
                                                                                    ]
                                                                            },
                                                                            {
                                                                                    title : 'Data',
                                                                                    itemId : 'pnl-grid'
                                                                            // layout:
                                                                            // {type:
                                                                            // 'vbox'}
                                                                            },
                                                                            {
                                                                                    title : 'Log',
                                                                                    itemId : 'pnl-log'
                                                                            }
                                                            ]
                                                    });
                                                }
                                                this.down('#display_box').update('');
                                                this.down('#pnl-log').html = Rally.util.DateTime.formatWithDefaultDateTime(new Date) + '<br/>';
                                                this._buildFieldMappers(Object.keys(this.csvData[0]), this.artifactType);
                                            } else
                                            {
                                                this.down('#display_box').update('File loaded is not a valid CSV file.');
                                            }
                                            this.setLoading(false);
                                        },
                                        _getMappedFields : function()
                                        {
                                            var mappedCbs = this.down('#pnl-mapping').query('rallyfieldcombobox');
                                            this.logger.log('_getMappedFields', mappedCbs);
                                            var mapping = {};
                                            Ext.each(mappedCbs, function(cb)
                                            {
                                                if (cb.getValue())
                                                {
                                                    mapping[cb.fieldLabel] = cb.getValue();
                                                }
                                            });
                                            this.logger.log('_getMappedFields field maps:', mapping);
                                            return mapping;
                                        },
                                        _getKeyForValue : function(valueToFind, hash)
                                        {
                                            var foundKey = null;
                                            Ext.Object.each(hash, function(key, value)
                                            {
                                                if (value == valueToFind)
                                                {
                                                    foundKey = key;
                                                    return false;
                                                }
                                            });
                                            return foundKey;
                                        },
                                        _buildWsapiRecordHash : function(records)
                                        {
                                            var hash = {};
                                            Ext.each(records, function(r)
                                            {
                                                hash[r.get('FormattedID')] = r;
                                            });
                                            return hash;
                                        },
                                        _refreshGrid : function()
                                        {
                                            var data = this.csvData;
                                            // Validate the mappings...
                                            // 1 - Is there a field mapped to
                                            // FormattedID?
                                            this.logger.log('_refreshGrid', this.csvData);
                                            var mappedFields = this._getMappedFields();
                                            var formattedIDKey = this._getKeyForValue('FormattedID', mappedFields);
                                            var fids = [];
                                            Ext.each(data, function(d)
                                            {
                                                fids.push(d[formattedIDKey]);
                                            });
                                            var fetchFields = _.values(mappedFields);
                                            this.setLoading(true);
                                            this._fetchItems(this.artifactType, fids, fetchFields).then({
                                                    scope : this,
                                                    success : function(store)
                                                    {
                                                        // update store with
                                                        // values to be saved
                                                        this.wsapiRecords = this._buildWsapiRecordHash(store);
                                                        var custom_data = this._updateValues(store, this.csvData, mappedFields);
                                                        if (this.down('#update-grid'))
                                                        {
                                                            this.down('#update-grid').destroy();
                                                            // this.down('#btn-save').destroy();
                                                        }
                                                        this.down('#pnl-grid').add({
                                                                xtype : 'rallygrid',
                                                                itemId : 'update-grid',
                                                                store : Ext.create('Rally.data.custom.Store', {
                                                                        data : custom_data,
                                                                        pageSize : custom_data.length
                                                                }),
                                                                showRowActionsColumn : false,
                                                                showPagingToolbar : false,
                                                                columnCfgs : this._getColumnCfgs(fetchFields, this.down('#type-combo').getRecord())
                                                        });
                                                        this.setLoading(false);
                                                        this.down('tabpanel').setActiveTab(1);
                                                    },
                                                    failure : function(error)
                                                    {
                                                        this.setLoading(false);
                                                        this.down('tabpanel').setActiveTab(2);
                                                    }
                                            });
                                        },
                                        _findRecord : function(records, field, value)
                                        {
                                            for (var i = 0; i < records.length; i++)
                                            {
                                                if (records[i].get(field) == value)
                                                {
                                                    return records[i];
                                                }
                                            }
                                            return null;
                                        },
                                        _updateValues : function(records, imported_data, mappedFields)
                                        {
                                            this.logger.log('_updateValues');
                                            var errors = [];
                                            var custom_data = [];
                                            var fidKey = this._getKeyForValue('FormattedID', mappedFields);
                                            Ext.each(imported_data, function(d)
                                            {
                                                var fid = d[fidKey];
                                                var rec = this._findRecord(records, 'FormattedID', fid); // store.findRecord('FormattedID',fid);
                                                if (rec == null)
                                                {
                                                    errors.push({
                                                            'FormattedID' : d.FormattedId,
                                                            'Msg' : Ext.String.format("FormattedID {0} does not exist.", d[fidKey])
                                                    });
                                                    this.logError({
                                                            'FormattedID' : d.FormattedId,
                                                            'Msg' : Ext.String.format("FormattedID {0} does not exist.", d[fidKey])
                                                    });
                                                }
                                                var custom_rec = {
                                                        FormattedID : fid,
                                                        Status : 'NOCHANGE'
                                                };
                                                Ext.each(Object.keys(d), function(key)
                                                {
                                                    var fieldKey = mappedFields[key];
                                                    if (rec)
                                                    {
                                                        if (fieldKey && fieldKey != 'FormattedID')
                                                        {
                                                            var val = d[key];
                                                            if (val && !isNaN(val))
                                                            {
                                                                val = Number(val);
                                                            }
                                                            if (val != rec.get(fieldKey))
                                                            {
                                                                custom_rec.Status = 'CHANGE';
                                                                this.logInfo({
                                                                        'FormattedID' : d.FormattedId,
                                                                        'Msg' : Ext.String.format("Updates needed for FormattedID {0} {1} from {2} to {3}.", d[fidKey], fieldKey, rec.get(fieldKey),
                                                                                        val)
                                                                });
                                                                rec.set(fieldKey, val);
                                                            } else
                                                            {
                                                                this.logInfo({
                                                                        'FormattedID' : d.FormattedId,
                                                                        'Msg' : Ext.String.format("No updates needed for FormattedID {0} {1} field.", d[fidKey], fieldKey)
                                                                });
                                                            }
                                                            custom_rec[fieldKey] = val;
                                                        }
                                                    }
                                                }, this);
                                                if (rec)
                                                {
                                                    custom_data.push(custom_rec);
                                                }
                                            }, this);
                                            return custom_data;
                                        },
                                        logError : function(obj)
                                        {
                                            // this.down('#pnl-log').body.insertHtml("beforeEnd",
                                            // '<span class="ERROR">' + obj.Msg
                                            // + '</span><br/>');
                                            this.down('#pnl-log').html += '<span class="ERROR">' + obj.Msg + '</span><br/>';
                                        },
                                        logInfo : function(obj)
                                        {
                                            this.down('#pnl-log').html += '<span class="INFO">' + obj.Msg + '</span><br/>';
                                        },
                                        _getColumnCfgs : function(fields, model)
                                        {
                                            var gcolcfgs = [];
                                            gcolcfgs
                                                            .push({
                                                                    text : 'Status',
                                                                    xtype : 'templatecolumn',
                                                                    tpl : '<tpl switch="Status"><tpl case="ERROR">' + '<font color="red">Error</font><tpl case="SAVED"><font color="green">Saved</font>' + '<tpl case="NOCHANGE"><font color="gray">Unchanged</font></tpl>'
                                                            });
                                            Ext.each(fields, function(f)
                                            {
                                                var colcfgs = {};
                                                colcfgs['dataIndex'] = f;
                                                colcfgs['text'] = f;
                                                if (f != 'FormattedID')
                                                {
                                                    colcfgs['flex'] = 1;
                                                }
                                                gcolcfgs.push(colcfgs);
                                            });
                                            return gcolcfgs;
                                        },
                                        _updateSavedStatus : function(item, rec, operation, success)
                                        {
                                            this.logger.log('_updateSavedStatus', rec, operation, success);
                                            if (success)
                                            {
                                                item.set('Status', 'SAVED');
                                                item.save();
                                                // rec.set('Status','SAVED');
                                                this.logInfo({
                                                        'FormattedID' : rec.get('FormattedID'),
                                                        'Msg' : rec.get('FormattedID') + ' updated successfully.'
                                                });
                                            } else
                                            {
                                                item.set('Status', 'ERROR');
                                                item.save();
                                                // rec.set('Status','ERROR');
                                                var error = Ext.String.format('Error updating {0}: {1}', rec.get('FormattedID'), operation.error.errors[0]);
                                                this.logError({
                                                        'FormattedID' : item.get('FormattedID'),
                                                        'Msg' : error
                                                });
                                                Rally.ui.notify.Notifier.showError({
                                                    message : error
                                                });
                                            }
                                        },
                                        _saveUpdates : function()
                                        {
                                            this.logger.log('_saveUpdates');
                                            var store = this.down('#update-grid').getStore();
                                            this.setLoading("Saving data...");
                                            var bChange = false;
                                            Ext.each(store.data.items, function(item)
                                            {
                                                console.log('storeitem', item.get('Status'))
                                                if (item.get('Status') == 'CHANGE')
                                                {
                                                    var bChange = true;
                                                    var rec = this.wsapiRecords[item.get('FormattedID')];
                                                    rec.save({
                                                            scope : this,
                                                            callback : function(rec, operation, success)
                                                            {
                                                                this.setLoading(false);
                                                                this._updateSavedStatus(item, rec, operation, success);
                                                            }
                                                    });
                                                }
                                            }, this);
                                            if (!bChange)
                                            {
                                                this.setLoading(false);
                                            }
                                        },
                                        _fetchItems : function(type, formatted_ids, fetch_fields)
                                        {
                                            this.logger.log('_fetchItems', type, formatted_ids, fetch_fields);
                                            var deferred = Ext.create('Deft.Deferred');
                                            var chunker = Ext.create('Rally.technicalservices.data.Chunker', {
                                                    chunkOids : formatted_ids,
                                                    chunkField : 'FormattedID',
                                                    fetch : fetch_fields,
                                                    model : this.artifactType
                                            });
                                            chunker.load().then({
                                                    scope : this,
                                                    success : function(records)
                                                    {
                                                        this.logger.log('chunker success', records);
                                                        deferred.resolve(records);
                                                    },
                                                    failure : function()
                                                    {
                                                        alert('failed');
                                                        deferred.reject('failed');
                                                    }
                                            });
                                            return deferred;
                                        }
                                });