var DOWNLOADS_DIR = "downloads/";
var FILENAME = "nederlands1";

var spawn = require('child_process').spawn
  , fs = require('fs')

var utils = {

  mp4toGIF: function(mp4file, cb) {
    cb = cb || function() {};

    var params = ['-y','-i',mp4file];

    params.push('-s');
    params.push('vga');
    params.push('-vf');
    params.push('format=rgb8,format=rgb24');
    params.push('-pix_fmt');
    params.push('rgb24');
    params.push('-r');
    params.push('10');

    outputfilename = mp4file.replace('.mp4','.gif');
    params.push(outputfilename);

    var stream = spawn('avconv', params);
    stream.stdout.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);

    stream.on('exit', function(e) {
      console.log("Video " + outputfilename+ " created");
      cb(null, outputfilename);
    });

  },
  seq: function(str) {
    return parseInt(str.replace(FILENAME,''),10);
  },
  cleanDownloadsDirectory: function(max_downloads, cb) {
    cb = cb || function() {};

    var max_downloads = (typeof max_downloads != 'undefined') ? max_downloads : MAX_DOWNLOADS;
    var dir = DOWNLOADS_DIR;
    var files = fs.readdirSync(dir);

    if(files.length <= max_downloads) return cb(null);

    files.sort(function(a, b) { return utils.seq(b) - utils.seq(a); });

    for(var i= max_downloads; i < files.length; i++) {
      // console.log("Removing file "+dir+files[i]+ " modified "+(new Date(fs.statSync(dir+files[i]).mtime.getTime()).toString()));
      fs.unlink(dir+files[i]);
    }
    cb(null);
  }
};

module.exports = utils;