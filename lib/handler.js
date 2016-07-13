'use strict'

const PATH    = require('path');
const Rx      = require('rxjs/Rx');
const Boom    = require('boom');
const PostCss = require('postcss');

module.exports = function (file$, request, reply, options){

    const static_file$ = file$
        .filter(file => file.type == 'static');

    const bundle_file$ = file$
        .filter(file => file.type == 'bundle')
        .map(file => {
            file.options = Object.assign({}, options);
            if (!this.util.is(file.options.plugins).array()) file.options.plugins = [];
            if (!this.util.is(file.options.engine).object()) file.options.engine = {};
            file.body = file.body.toString('utf8');
            file.options.engine = this.util
                .object({
                    from : file.path,
                    to   : PATH.join(file.root, `~${PATH.basename(file.path)}`),
                    map  : { inline:true }
                })
                .merge(file.options.engine)
            return file;
        })
        .mergeMap(file => Rx.Observable
            .from(PostCss(file.options.plugins).process(file.body, file.options.engine))
            .map(result => {
                file.body = result.css;
                return file;
            })
        )

    Rx.Observable
        .merge(static_file$, bundle_file$)
        .subscribe(
            file => reply(file.body).type('text/css'),
            err  => {
                this.server.log('error',  err.message);
                reply(Boom.wrap(err, err.statusCode || 500))
            }
        )
}

