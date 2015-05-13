Ext.override(Rally.ui.combobox.FieldComboBox, {
    _isNotHidden: function(field) {
        var allowedAttributeTypes = ['STRING','BOOLEAN','DATE','DECIMAL','INTEGER','QUANTITY','TEXT'];
        console.log('_isNotHidden', field, field.attributeDefinition);
        if (field.attributeDefinition){
           if (field.name == 'FormattedID'){
               return true;
           }
            if (!Ext.Array.contains(allowedAttributeTypes, field.attributeDefinition.AttributeType)){
             return false;
           }
           if (field.attributeDefinition.Hidden){
               return false;
           }
           if (field.attributeDefinition.ReadOnly){
               return false;
           }
            return true;
        }
        return false;
        //return !field.hidden;
    }
});
Ext.override(Rally.data.custom.Store,{
    findRecord: function(fieldName, fieldValue) {
        Ext.each(this.data.items, function(item){
            if (item.get(fieldName) == fieldValue){
                foundItem = item;
            }
        });
        console.log('find',arguments,this.data);
        var me = this,
            index = me.find.apply(me, arguments);
        console.log(index);
        return index !== -1 ? me.getAt(index) : null;
    }
});