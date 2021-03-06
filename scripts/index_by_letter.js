const { exec } = require('child_process');

// this is from count_first_letter.js
var letters = [
  [ '0', 331 ], [ '8', 1257 ], [ '5', 1760 ], [ '7', 2160 ], [ '6', 2985 ], [ '9', 6617 ], [ 'Q', 10941 ], [ 'Z', 12333 ], [ 'z', 13730 ], [ '1', 15020 ], [ 'X', 16811 ], [ '3', 21206 ], [ 'Y', 23588 ], [ 'q', 26194 ], [ '4', 36051 ], [ '2', 46293 ], [ 'x', 46596 ], [ 'V', 60109 ], [ 'y', 62576 ], [ 'j', 69583 ], [ 'k', 77361 ], [ 'K', 114570 ], [ 'u', 137840 ], [ 'U', 153613 ], [ 'J', 180759 ], [ 'H', 193045 ], [ 'o', 198120 ], [ 'e', 209484 ], [ 'E', 212545 ], [ 'v', 216882 ], [ 'I', 225190 ], [ 'O', 230944 ], [ 'L', 240517 ], [ 'R', 247462 ], [ 'l', 293748 ], [ 'N', 303798 ], [ 'r', 304409 ], [ 'G', 328141 ], [ 'h', 353250 ], [ 'i', 401841 ], [ 'd', 426433 ], [ 'F', 452021 ], [ 'W', 453925 ], [ 'T', 486140 ], [ 'B', 500498 ], [ 'D', 502646 ], [ 'P', 542778 ], [ 'b', 545149 ], [ 'w', 570698 ], [ 'c', 573780 ], [ 'a', 577527 ], [ 'n', 580906 ], [ 'M', 588070 ], [ 'C', 605527 ], [ 'f', 657588 ],
  [ 's', 217352 ],
  [ 'S', 217352 ],
  [ 'g', 217352 ],
  [ 'm', 820558 ],
  [ 'p', 520558 ],
  [ 't', 920558 ],
  [ 'A', 520558 ],
];

var index = -1;

processNext();

function processNext() {
  index += 1;
  if (index > letters.length - 1) return;

  var letter = letters[index][0];
  console.log(new Date(), 'processing letter ' + letter);
  exec('node --max-old-space-size=16384 index ' + letter, (err) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }

    processNext();
  });
}
