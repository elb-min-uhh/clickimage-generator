# clickimage-generator

The _clickimage-generator_ was developed as web application to easily create
click images. The WebApp is available under
https://elb-min-uhh.github.io/clickimage-generator/ and can be opened platform
independently in the most common browsers when cloning the repository.
The application outputs HTML source code for the
[clickimage.js](https://github.com/elb-min-uhh/clickimage.js).

## Usage

Simply load an image using drag and drop or the file chooser. After that you
can add Pins using the _Add_ Button. To edit a pin, select it by clicking on
the pin on the image and check the *Edit Pin* section.

The image is only loaded on your local device and no data will be send to other
servers.

### Edit Pin

The edit pin section is displayed whenever a pin is selected (marked red).
You can change the orientation by simply changing the value.

By editing the index, you will change the order of the pins.
Saying you have four pins and the third selected, updating its index to *1*
will make the current pins *1* and *2* increment their index (to *2* and *3*).

When clicking on *Move* you will move the pin to the next position you click on
the image. You can also keep your mouse or finger down to drag it over the
image.

There is no *undo* so make sure to not click *Remove* if you do not really want
to remove the selected pin, as there is no confirmation dialog yet.

### Import Code

To import and edit your code, you have to select the image first. After that,
select the *Source Code* button and paste your code into the text area. Make
sure to copy the outer `div.clickimage` with everything in it and nothing else.
After clicking on *Import Changes* the main page will be visible again and
display your clickimage pins.

## License

_clickimage-generator_ is developed by
[dl.min](https://www.min.uni-hamburg.de/studium/digitalisierung-lehre/ueber-uns.html)
of Universität Hamburg.

The software is using [MIT-License](http://opensource.org/licenses/mit-license.php).

cc-by Michael Heinecke, Arne Westphal, dl.min, Universität Hamburg
