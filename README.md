kraken-free
===========

Use [kraken.io](https://kraken.io/web-interface) Free Online Image Optimizer
to optimize your JPEG and PNG images.

File size limit: <= 1MB

## CLI

```
npm i -g kraken-free
kraken png/example.png
```

## API

```js
var kraken = require('kraken-free');
```

### kraken.checkIfImage(filename)

```
arguments:
  filename - required, path to image file to check
returns
  true if the file exists and is a JPEG or PNG file, otherwise false
```

### kraken.getCookies()

```
arguments: none
returns:
  a promise resolves to a cookie string:
    XSRF-TOKEN= ... ; kraken_sid= ...
```

### kraken.upload(cookie, filename, options)

```
arguments:
  cookie - required, string from getCookies()
  filename - required, path to image file to upload
  options - optional, pass { lossy: true } to set optimization mode to lossy, default is false (loseless).
returns:
  a promise resolves to a JSON-parsed object from upload API response:
    {
      "optimizedSize": 2704,
      "originalSize": 2821,
      "url": "https://dl.kraken.io/web/31/a1f3a034098dfb795e43d48cfbdea2/example.png",
      "thumb": "https://dl.kraken.io/web/31/a1f3a034098dfb795e43d48cfbdea2/thumb.png",
      "status": "kraked"
    }
```

### kraken.download(url, dest)

```
arguments:
  url - required, URL to download
  dest - required, local path to save the file
returns:
  a promise resolves to an object:
    {
      "dest": "kraked/example.png"
    }
```

### Example

```js
var kraken = require('kraken-free');
kraken.getCookies().then(function (cookie) {
  return kraken.upload(cookie, 'png/example.png');
}).then(function (data) {
  return kraken.download(data.url, 'kraked/example.png');
}).then(function (data) {
  console.log(data);
}).catch(function (e) {
  console.error(e.toString());
});
```
