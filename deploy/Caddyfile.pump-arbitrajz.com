pump.arbitrajz.com {
    encode gzip zstd

    root * /srv/data/arbitrajz/frontend/build
    file_server

    @api path /api/*
    reverse_proxy @api 127.0.0.1:8010

    @spa {
        not path /api/*
        not file
    }
    rewrite @spa /index.html
    file_server
}
