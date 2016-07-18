'use strict'

const PATH    = require('path');
const Rx      = require('rxjs/Rx');
const Boom    = require('boom');
const PostCss = require('postcss');

module.exports = function (bundle$, request, reply, options){

    // Complement bundle info
    bundle$ = bundle$.map(bundle => {
        bundle.options = Object.assign({}, options);
        if (!this.util.is(bundle.options.plugins).array()) bundle.options.plugins = [];
        if (!this.util.is(bundle.options.engine).object()) bundle.options.engine = {};
        bundle.body = bundle.body.toString('utf8');
        bundle.options.engine = this.util
            .object({
                from : bundle.path,
                to   : PATH.join(bundle.root, `~${PATH.basename(bundle.path)}`),
                map  : { inline:true }
            })
            .merge(bundle.options.engine)
        return bundle;
    });

    // Process bundle contents with postcss
    bundle$ = bundle$.mergeMap(bundle => {
        const postcss = PostCss(bundle.options.plugins)
            .process(bundle.body, bundle.options.engine);
        return Rx.Observable
            .from(postcss)
            .map(result => {
                bundle.body = result.css;
                return bundle;
            });
    });

    // respond to user with bundle contents or error.
    bundle$.subscribe(
        bundle => reply(bundle.body).type('text/css'),
        error  => reply(Boom.wrap(error))
    )
}

