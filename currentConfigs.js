'use strict';
var http = require('http');

// Creating a little node server
http.createServer(function (req, res) {
    process.env.CUSTOMCONNSTR_resturl = 'https://snsserverdevbackend.azurewebsites.net';
    var config = {
        production: false,
        b2CData: {
            tenant: process.env.CUSTOMCONNSTR_b2cTenantID,
            clientID: process.env.CUSTOMCONNSTR_b2cClientID,
            signUpSignInPolicy: process.env.CUSTOMCONNSTR_b2cPolicyName,
            b2cScopes: [process.env.CUSTOMCONNSTR_b2cScopes]
        },
        vmUrl: process.env.CUSTOMCONNSTR_backendHost,
        did: process.env.CUSTOMCONNSTR_did,
        embedUrl:process.env.CUSTOMCONNSTR_pbiEmbedUrl
    };


    try {

        const headers = {
            'Content-Type': 'application/json',

        };
		res.writeHead(200, headers);
        res.end(JSON.stringify(config));
    } catch (err) {
        res.writeHead(500);
        res.end(err.toString());
    }
}).listen(process.env.PORT);