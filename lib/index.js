'use strict';

const Bundler = require('feliz.bundler');
const Handler = require('./handler');
const Package = require('../package.json');

module.exports = {
    name: 'bundle_css',
    data: {
        register: function(server, options, next){
            next();
        }
    },
    when: { 'plugin:bundle_css': function(){

        if (!this.util.is(this.options.bundle_css).object()) this.options.bundle_css = {};
        const options = this.util
            .object({
                index: 'index',
                ext  : { target:'css', source:'css' },
                route: '/static',
                callback: Handler
            })
            .merge(this.options.bundle_css);
        Bundler.call(this, options);
    }}
};

// required by hapi
module.exports.data.register.attributes = { pkg: Package }

