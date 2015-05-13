Ext.define('Rally.debug.logger', {
        constructor : function(config)
        {
            Ext.apply(this, config);
        },
        log : function(args)
        {
            var timestamp = "[ " + Ext.util.Format.date(new Date(), "Y-m-d H:i:s.u") + " ]";
            var output_args = [];
            output_args = Ext.Array.push(output_args, [
                timestamp
            ]);
            output_args = Ext.Array.push(output_args, Ext.Array.slice(arguments, 0));
            window.console && console.log.apply(console, output_args);
        }
});