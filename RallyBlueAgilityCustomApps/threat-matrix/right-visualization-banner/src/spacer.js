Ext.define('Spacer', {
        extend : 'Ext.Container',
        alias : 'spacer',
        cls : 'spacer',
        layout : 'vbox',
        border : 0,
        width : '100%',
        height : 20,
        constructor : function()
        {
            this.stateId = Rally.environment.getContext().getScopedStateId('spacer');
            this.callParent(arguments);
        },
        initComponent : function()
        {
        }
});
