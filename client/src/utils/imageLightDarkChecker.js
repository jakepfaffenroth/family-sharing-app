export default function isItDark(imgEl, callback) {
  // console.log('imgEl:', imgEl);
  var fuzzy = 0.1;
  // var img = document.createElement('img');
  const img = document.getElementById(imgEl);
  // console.log('img:', img);
  img.crossOrigin = 'Anonymous';
  // img.src = imgEl;
  // img.style.display = 'none';
  // document.body.appendChild(img);

  // var result;
  img.onload = function() {
    // create canvas
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(this, 0, 0);

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var r, g, b, max_rgb;
    var light = 0,
      dark = 0;

    for (var x = 0, len = data.length; x < len; x += 4) {
      r = data[x];
      g = data[x + 1];
      b = data[x + 2];

      max_rgb = Math.max(Math.max(r, g), b);
      if (max_rgb < 128) dark++;
      else light++;
    }

    var dl_diff = (light - dark) / (this.width * this.height);
    console.log('dl_diff + fuzzy:', dl_diff + fuzzy);
    if (dl_diff + fuzzy < 1) callback(!true);
    /* Dark. */ else callback(!false); /* Not dark. */
    // if (dl_diff + fuzzy < 1) {
    //   /* Dark. */
    //   return true;
    // } else {
    //   /* Not dark. */
    //   return false;
    // }
  };
  // console.log('result:', result);
  // return result;
}
