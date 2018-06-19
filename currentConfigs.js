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
            //signUpPolicy: "b2c_1_sign_up",
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

        // http.get(process.env.CUSTOMCONNSTR_resturl + '/api/GetAzureADConfiguration', (resp) => {
        //     let data = '';

        //     // A chunk of data has been recieved.
        //     resp.on('data', (chunk) => {
        //         data += chunk;
        //     });

        //     // The whole response has been received. Print out the result.
        //     resp.on('end', () => {
        //         console.log(JSON.parse(data));
        //         config.config.clientId=JSON.parse(data).ApplicationId;
        //         config.config.tenant=JSON.parse(data).ActiveDirectoryTenant;
        //         res.writeHead(200, headers);
        //         res.end(JSON.stringify(config));
        //     });

        // }).on("error", (err) => {
        //     console.log("Error: " + err.message);
        // });

    } catch (err) {
        res.writeHead(500);
        res.end(err.toString());
    }
}).listen(process.env.PORT);