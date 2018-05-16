'use strict';

const imagemin = require("imagemin");
const jpegtran = require("imagemin-jpegtran");
const imageminPngquant = require('imagemin-pngquant');

const fs = require('fs');
const request = require('request');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const identify = (params, callback) => {
    try{
        let tmpFile = `/tmp/inputFile.${params.format}`;
        let buff = Buffer.from(params.base64Image, 'base64');
        fs.writeFileSync(tmpFile, buff, 'base64');
        gm(tmpFile).identify((err, output) => {
            fs.unlinkSync(tmpFile);
            if (err) {
                callback(null, err.message);
            } else {
                callback(null, JSON.stringify(output));
            }
        });
    } catch (err) {
      callback(null, err.message);
    }
};

const save = (params, callback) => {
    let tmpFile = `/tmp/inputFile.${params.format}`,
        buff = Buffer.from(params.base64Image, 'base64'),
        imageName = `images/${params.name}.${params.format}`;

    fs.writeFileSync(tmpFile, buff, 'binary');

    let mainProcess = new Promise((resolve, reject) => {
            if(params.format === 'png'){
                let time1 = + new Date();
                imagemin(['/tmp/inputFile.{jpg,png}'], '/tmp/images', {
                    plugins: [
                        jpegtran(),
                        imageminPngquant({quality: 70, speed: 10})
                    ]
                }).then(files => {
                    console.log(+ new Date() - time1);
                    fs.unlinkSync(tmpFile);
                    resolve(files[0].data);
                }).catch((e) => {
                    console.log('ERROR: ' + e);
                });
            } else {
                fs.unlinkSync(tmpFile);
                resolve(buff);
            }
    });
    mainProcess.then(buffer => {
        return S3.putObject({
          Body: buffer,
          Bucket: params.bucket,
          ContentType: `image/${params.format}`,
          Key: imageName
        }).promise();
      }
    )
    .then(() => {
        S3.getBucketLocation({Bucket: params.bucket}, (err, data) => {
                if (err) callback(messageResponse(`Failed to Get a Bucket Location`));
                callback(null, `http://${params.bucket}.s3-website.${data.LocationConstraint || 'us-east-1'}.amazonaws.com/${imageName}`);
            }
        )
      }
    )
    .catch(err => callback(null, messageResponse(`Error in process: ${err.message}`)));
};

const messageResponse = (message) => {
    return {
              statusCode: 200,
              body: JSON.stringify({ message: message })
            }
}

module.exports.imgOptimize = (event, context, callback) => {
    let params = event || {},
        action = (params && params.action) ? params.action : null;
    if(!params.base64Image && params.url){
        request({url: params.url, method: 'GET', encoding: null}, function (error, response, body) {
            if(error) throw new Error('url request crashed');
            let buffer = Buffer.from(body);
            gm(buffer).format(function(err, value){
                if(err) throw new Error('gm process crashed: ' + err.message);
                params.base64Image = buffer.toString('base64');
                params.name = params['url'].split('/').pop().split('?')[0];
                params.format = value.toLowerCase();
                selectAction(action, params);
            });
        });
    } else {
        selectAction(action, params);
    };

    function selectAction(action, params) {
        switch (action) {
            case 'ping':
                callback(null, 'Just a test');
                break;
            case 'identify':
                identify(params, callback);
                break;
            case 'save':
                save(params, callback);
                break;
            default:
                callback(null, messageResponse('Action missed'));
        }
    };
};