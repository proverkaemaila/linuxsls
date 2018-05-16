'use strict';

const gm = require('gm').subClass({ imageMagick: true });
const IM = require('imagemagick');
const imagemin = require("imagemin");
const jpegtran = require("imagemin-jpegtran");
const optipng = require("imagemin-optipng");
const imageminPngquant = require('imagemin-pngquant');
const childProcess = require('child_process');

const compress_images = require('compress-images');
const fs = require('fs');
const request = require('request');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();
// const Sharp = require('sharp');

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

// const save = (params, callback) => {
//     let buff = Buffer.from(params.base64Image, 'base64');
//     let imageName = `images/${params.name}.${params.format}`;
//     new Promise((resolve, reject) => {
//         S3.putObject({
//             Body: buff,
//             Bucket: params.bucket,
//             ContentType: `image/${params.format}`,
//             Key: imageName
//           }, () => {
//               resolve();
//           });
//     }).then(() => {
//         S3.getBucketLocation({Bucket: params.bucket}, (err, data) => {
//                 if (err) callback(messageResponse(`Failed to Get a Bucket Location`));
//                 callback(null, `http://${params.bucket}.s3-website.${data.LocationConstraint || 'us-east-1'}.amazonaws.com/${imageName}`);
//             }
//         )
//     });
// }

const save = (params, callback) => {
    let tmpFile = `/tmp/inputFile.${params.format}`,
        buff = Buffer.from(params.base64Image, 'base64'),
        imageName = `images/${params.name}.${params.format}`;

    fs.writeFileSync(tmpFile, buff, 'binary');

    let mainProcess = new Promise((resolve, reject) => {
            // const processingFile = `/tmp/temp.${params.format}`;
            // If neither height nor width was provided, turn this into a thumbnailing request
            // if (!params.height && !params.width) {
            //     params.width = 100;
            // }
            



            // compress_images('/tmp/inputFile.{jpg,JPG,jpeg,JPEG,png,svg,gif}', '/tmp/result', {compress_force: false, statistic: true, autoupdate: true}, false,
            //     {jpg: {engine: 'mozjpeg', command: ['-quality', '60']}},
            //     {png: {engine: 'pngquant', command: ['--quality=20-50']}},
            //     {svg: {engine: 'svgo', command: '--multipass'}},
            //     {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function(obj){
            //         console.log('work hard');
            //         console.log(obj.output);
            //         let result = fs.readFileSync(obj.output);
            //         resolve(new Buffer(result));
            // });

            if(params.format === 'png'){
                let time1 = + new Date();
                imagemin(['/tmp/inputFile.{jpg,png}'], '/tmp/images', {
                    plugins: [
                        jpegtran(),
                        imageminPngquant({quality: 50})
                    ]
                }).then(files => {
                    console.log(+ new Date() - time1);
                    fs.unlinkSync(tmpFile);
                    resolve(files[0].data);
                }).catch((e) => {
                    console.log('ERROR: ' + e);
                });
            }

            // imagemin.buffer(buff, {
            //   plugins: [
            //     jpegtran(),
            //     optipng({optimizationLevel: 7})
            //   ]
            // }).then(function(result_buf) {
            //   console.log("Optimized! Final file size is " + result_buf.length + " bytes");
            //   resolve(result_buf);
            // }).catch(function(err){
            //   console.log("failed to optimize", err);
            //   resolve(buff);
            // });


            // IM.resize({
            //   srcPath: tmpFile,
            //   dstPath: processingFile,
            //   width  : '100%',
            //   quality: 11,
            // }, function(err, stdout){
            //   console.log('resized kittens.jpg to fit within 256x256px');
            //   let result = fs.readFileSync(processingFile);
            //   fs.unlinkSync(tmpFile);
            //   fs.unlinkSync(processingFile);
            //   resolve(new Buffer(result));
            // });
 
            
            // try {
            //     if(params.format === 'png'){
            //         console.log('run tezt');
            //         // compress_images('/tmp/inputFile.{jpg,JPG,jpeg,JPEG,png,svg,gif}', '/tmp/result', {compress_force: false, statistic: true, autoupdate: true}, false,
            //         //     {jpg: {engine: 'mozjpeg', command: ['-quality', '60']}},
            //         //     {png: {engine: 'pngquant', command: ['--quality=20-50']}},
            //         //     {svg: {engine: 'svgo', command: '--multipass'}},
            //         //     {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function(obj){
            //         //         console.log('work hard');
            //         //         console.log(obj.output);
            //         //         let result = fs.readFileSync(obj.output);
            //         //         resolve(new Buffer(result));
            //         // });

                    

            //         // imageMagick.resize({
            //         //   srcPath: tmpFile,
            //         //   dstPath: processingFile,
            //         //   width  : '100%'
            //         // }, function(err, stdout, stderr){
            //         //   if (err) throw err;
            //         //   console.log('resized kittens.jpg to fit within 256x256px');
            //         //   let result = fs.readFileSync(processingFile);
            //         //   fs.unlinkSync(tmpFile);
            //         //   fs.unlinkSync(processingFile);
            //         //   resolve(new Buffer(result));
            //         // });




            //         // gm(buff)
            //         // .quality(params.quality || 100)
            //         // .write(processingFile, function (err) {
            //         //     if (err) callback(err);
            //         //     let result = fs.readFileSync(processingFile);
            //         //     fs.unlinkSync(tmpFile);
            //         //     fs.unlinkSync(processingFile);
            //         //     resolve(new Buffer(result));
            //         // });
                    
            //         // console.log('BUF');
            //         // console.log(buff.length);
            //         // gm(buff)
            //         // .colors(128)
            //         // .quality(10)
            //         // .write(processingFile, function (err) {
            //         //     if (err) callback(err);
            //         //     let result = fs.readFileSync(processingFile);
            //         //     fs.unlinkSync(tmpFile);
            //         //     fs.unlinkSync(processingFile);
            //         //     console.log('RESULT');
            //         //     let rr = new Buffer(result);
            //         //     console.log(rr.length);
            //         //     resolve(new Buffer(result));
            //         // });
            //     } else {
            //         resolve(buff);
            //     }
            // } catch (err) {
            //     reject(`Resize operation failed: ${err.message}`);
            // }
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

/*
    params = {
        action      : required action
        name        : image name
        width       : required width
        height      : required height
        quality     : required image quality
        format      : required image format
       |base64Image : image in base64 string
       |url         : url to the image
        bucket      : S3 bucket to upload the result
    }
*/
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