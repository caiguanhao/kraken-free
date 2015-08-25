var Q = require('q');
var fs = require('fs');
var https = require('https');
var FormData = require('form-data');
var readChunk = require('read-chunk');
var imageType = require('image-type');

module.exports.checkIfImage = checkIfImage;
module.exports.getCookies = getCookies;
module.exports.upload = upload;
module.exports.download = download;

function checkIfImage (input) {
  return Q.fcall(function () {
    if (typeof input === 'string') { // filename
      return Q.nfcall(readChunk, input, 0, 12);
    } else {
      throw 'unknown input';
    }
  }).then(function (buffer) {
    var mime = imageType(buffer).mime;
    if (mime === 'image/jpeg' || mime === 'image/png') {
      return true;
    }
    return false;
  }).catch(function () {
    return false;
  });
}

function getCookies () {
  var deferred = Q.defer();
  var req = https.request({
    host: 'kraken.io',
    port: 443,
    path: '/auth',
    method: 'GET'
  }, function (res) {
    deferred.resolve(parseCookies(res.headers['set-cookie']));
    res.destroy();
  });
  req.on('error', function (e) {
    deferred.reject(e);
  });
  req.end();
  return deferred.promise;
}

function parseCookies (cookies) {
  return cookies.map(function (cookie) {
    var pos = cookie.indexOf('; ');
    if (pos > -1) {
      cookie = cookie.slice(0, pos);
    }
    return cookie;
  }).join('; ');
}

function upload (cookie, input, options) {
  if (typeof cookie !== 'string' || cookie.length === 0) {
    return Q.reject('Error: empty cookie');
  }

  if (typeof options === 'undefined') {
    options = {};
  }

  if (typeof options !== 'object') {
    return Q.reject('Error: options for upload() should be an object');
  }

  var deferred = Q.defer();

  var form = new FormData();

  form.append('lossy', options.lossy ? 'true' : 'false');

  if (typeof input === 'string' && input.length > 0) {
    form.append(input, fs.createReadStream(input));
  } else {
    return Q.reject('Error: unknown input');
  }

  var headers = form.getHeaders()

  headers['cookie'] = cookie;

  var req = https.request({
    host: 'kraken.io',
    port: 443,
    path: '/uploader',
    method: 'POST',
    headers: headers
  });

  form.pipe(req);

  req.on('response', function (res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      deferred.resolve(JSON.parse(data));
    });
    res.on('error', function (err) {
      deferred.reject(err);
    });
  });

  return deferred.promise;
}

function download (input, output) {
  if (typeof input !== 'string' || input.indexOf('https://') !== 0) {
    return Q.reject('Error: unknown download URL');
  }

  var req, file, ret;

  if (typeof output === 'string' && output.length > 0) {
    file = fs.createWriteStream(output);
    ret = { dest: output };
  } else {
    return Q.reject('Error: unknown output');
  }

  var deferred = Q.defer();

  file.on('error', function (err) {
    if (req) req.abort();
    deferred.reject(err);
  });

  file.on('finish', function () {
    deferred.resolve(ret);
  });

  req = https.get(input, function (res) {
    res.pipe(file);
  });

  req.on('error', function (err) {
    deferred.reject(err);
  });

  return deferred.promise;
}
