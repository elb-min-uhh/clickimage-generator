/**
* Scripts for the clickimage generator.
*/

(function() {

    var advancedLoad = false;
    var nextPinId = 0;

    window.addEventListener('load', function() {
        if(dragDropSupported() && fileReaderSupported()) advancedLoad = true;

        initImageLoading();
        initPins();
    });

    // Image Loading

    function initImageLoading() {
        var imageBox = document.querySelector('.image_box');
        var fileChooser = imageBox.querySelector('.box_file');

        if(advancedLoad) {
            imageBox.className += " advanced";
            initDragDropListeners(imageBox);
        }

        imageBox.addEventListener('click', function() {
            resetInfos(imageBox);
            fileChooser.click();
        });

        fileChooser.addEventListener('change', function() {
            checkFiles(imageBox, this.files);
        });
    }

    function initDragDropListeners(imageBox) {
        // prevent other listeners
        var events = ["drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop"];
        var prevent = function(e) {
            e.preventDefault();
            e.stopPropagation();
        };
        for(var i = 0; i < events.length; i++) {
            imageBox.addEventListener(events[i], prevent);
        }

        // Drag in/start
        var dragIn = function() {
            resetInfos(imageBox);
            imageBox.classList.add("dragover");
        };
        imageBox.addEventListener("dragover", dragIn);
        imageBox.addEventListener("dragenter", dragIn);

        // Drag out/end
        var dragOut = function() {
            imageBox.classList.remove("dragover");
        };
        imageBox.addEventListener("dragleave", dragOut);
        imageBox.addEventListener("dragend", dragOut);
        imageBox.addEventListener("drop", dragOut);

        // Drop of file(s)
        imageBox.addEventListener("drop", function(e) {
            checkFiles(imageBox, e.dataTransfer.files);
        });
    }

    function resetInfos(imageBox) {
        var infos = imageBox.querySelectorAll('.box_info');
        for(var i = 0; i < infos.length; i++) {
            infos[i].style.display = "none";
        }
    }

    function checkFiles(imageBox, files) {
        // too much files
        if(files.length > 1) {
            imageBox.querySelector('.box_info.box_error.many').style.display = "block";
        }
        else if(files.length === 1) {
            // wrong file type
            if(!files[0].type.match(/^image/)) {
                imageBox.querySelector('.box_info.box_error.type').style.display = "block";
            }
            else {
                loadImage(imageBox, files[0]);
            }
        }
    }

    function loadImage(imageBox, file) {
        var reader = new FileReader();
        reader.onload = function() {
            var dataURL = reader.result;
            var img = document.createElement('img');
            img.src = dataURL;

            imageBox.parentElement.querySelector('.image_con').appendChild(img);
            imageBox.parentElement.classList.add("image_displayed");
        };
        reader.readAsDataURL(file);
    }

    // Add and Edit Pins

    function initPins() {
        initPinButtonListeners();
    }

    function initPinButtonListeners() {
        document.querySelector('.pin_add').addEventListener('click', onAddPin);

        document.querySelector('.show_source').addEventListener('click', function() {
            console.log("SOURCE");
        });

        document.querySelector('.show_demo').addEventListener('click', function() {
            console.log("DEMO");
        });

        document.querySelector('.image_wrap').addEventListener('click', function(e) {

            if(this.classList.contains('image_displayed')) {
                onImageClick(e);
            }
        });
    }

    function onAddPin() {
        resetPinAddition();

        var imageWrap = document.querySelector('.image_wrap');
        imageWrap.classList.add("positioning");
    }

    function onImageClick(event) {
        var imageWrap = document.querySelector('.image_wrap');

        if(imageWrap.classList.contains('positioning')) {
            var posRel = getPositionRel(event, document.querySelector('.image_wrap .image_con'));

            if(posRel.x >= 0 && posRel.x <= 1
                && posRel.y >= 0 && posRel.y <= 1) {
                placePinSelection(posRel);
            }
        }
    }

    function onPinSelected(pin) {
        if(pin.classList.contains('selection_pin')) {
            placePin(pin);
        }
        else {
            selectPin(pin);
        }
    }

    function placePinSelection(position) {
        var imageWrap = document.querySelector('.image_wrap');

        var pinSelection = document.createElement("div");
        pinSelection.classList.add("pin_selection");

        var id = nextPinId;
        nextPinId++;

        var pins = [];
        pins.push(createPin(position, "left", id, "?"));
        pins.push(createPin(position, "right", id, "?"));
        pins.push(createPin(position, "top", id, "?"));
        pins.push(createPin(position, "bottom", id, "?"));

        for(var i = 0; i < pins.length; i++) {
            pins[i].addEventListener('click', function() {
                onPinSelected(this);
            });
            pinSelection.appendChild(pins[i]);
        }

        document.querySelector('.image_wrap .image_con').appendChild(pinSelection);

        imageWrap.classList.remove("positioning");
        imageWrap.classList.add("selecting");

    }

    function createPin(position, orientation, id, text) {
        var pin = document.createElement("div");
        pin.classList.add("image_pin");
        pin.classList.add("selection_pin");
        pin.classList.add(orientation);
        pin.id = "pin_" + id;

        var textElement = document.createElement("div");
        textElement.classList.add("pin_text");
        textElement.innerText = text;
        pin.appendChild(textElement);

        pin.style.left = (position.x * 100) + "%";
        pin.style.top = (position.y * 100) + "%";

        return pin;
    }

    /**
     * Done on selection pins to select the given pin and place it on the picture.
     * @param {*} pin
     */
    function placePin(pin) {
        var imageWrap = document.querySelector('.image_wrap');
        var imageCon = imageWrap.querySelector('.image_con');

        pin.classList.remove('selection_pin');
        setPinIndex(pin, getFirstUniqueIndex());

        imageCon.appendChild(pin);
        resetPinAddition();

        selectPin(pin);
    }

    /**
     * Done on placed pins to select the pin for editing.
     * @param {*} pin
     */
    function selectPin(pin) {
        console.log("Selected", pin.id);
    }

    /**
     * Update the index of a pin. Will rearrange other pins on collision.
     * @param {*} pin the dom element of the .image_pin to change the index of
     * @param {*} index the index to change it to
     */
    function updatePinIndex(pin, index) {
        var currentIndex = pin.dataset.pinIndex ? parseInt(pin.dataset.pinIndex, 10) : Number.MAX_SAFE_INTEGER;
        if(currentIndex == index) return;

        // to place it after the given index when increasing the index
        // will create a gap filled by `rearrangePinIndices` to match the initial
        // index.
        // otherwise before (default)
        if(index > currentIndex) index++;

        // increment all pins indices with their idx >= `index`
        var pins = document.querySelectorAll('.image_wrap .image_con > .image_pin');
        for(var i = 0; i < pins.length; i++) {
            if(pins[i] === pin) continue;

            var pinIndex = pins[i].dataset.pinIndex ? parseInt(pins[i].dataset.pinIndex, 10) : -1;
            if(pinIndex >= index)
                setPinIndex(pins[i], pinIndex + 1);
        }

        setPinIndex(pin, index);
        rearrangePinIndices();
    }

    /**
     * Sets the pins index to a given value without checking or rearranging of
     * other pins.
     * @param {*} pin the dom element of the .image_pin to change the index of
     * @param {*} index the index to change it to
     */
    function setPinIndex(pin, index) {
        pin.dataset.pinIndex = index;
        pin.querySelector('.pin_text').innerText = index;
    }

    /**
     * Rearranges all pins to fill gaps. e.g. [1, 2, 4, 7] will be rearranged
     * to [1, 2, 3, 4].
     */
    function rearrangePinIndices() {
        var pins = document.querySelectorAll('.image_wrap .image_con > .image_pin');
        var pinsArray = Array.prototype.slice.call(pins, 0);
        pinsArray.sort(function(a, b) {
            return (a.dataset.pinIndex ? parseInt(a.dataset.pinIndex, 10) : Number.MAX_SAFE_INTEGER)
                - (b.dataset.pinIndex ? parseInt(b.dataset.pinIndex, 10) : Number.MAX_SAFE_INTEGER);
        });

        // set new index
        for(var i = 0; i < pinsArray.length; i++) {
            if(pinsArray[i].dataset.pinIndex != (i + 1)) setPinIndex(pinsArray[i], i + 1);
        }
    }

    function getFirstUniqueIndex() {
        for(var i = 1; i < Number.MAX_SAFE_INTEGER; i++) {
            if(!document.querySelector('.image_wrap .image_con .image_pin[data-pin-index="' + i + '"]')) {
                return i;
            }
        }
    }

    function resetPinAddition() {
        var imageWrap = document.querySelector('.image_wrap');
        imageWrap.classList.remove("positioning");
        imageWrap.classList.remove("selecting");

        var pinSelections = document.querySelectorAll('.pin_selection');
        for(var i = 0; i < pinSelections.length; i++) {
            pinSelections[i].parentElement.removeChild(pinSelections[i]);
        }
    }

    // Helpers

    function dragDropSupported() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    }

    function fileReaderSupported() {
        return 'FileReader' in window;
    }

    function getPosition(event, parent) {
        var pos = {};

        var bodyBounds = document.body.getBoundingClientRect();
        var bounds = parent.getBoundingClientRect();

        pos.x = event.pageX - (bounds.left - bodyBounds.left);
        pos.y = event.pageY - (bounds.top - bodyBounds.top);

        return pos;
    }

    function getPositionRel(event, parent) {
        var pos = getPosition(event, parent);

        pos.x = pos.x / (parent.offsetWidth);
        pos.y = pos.y / (parent.offsetHeight);

        return pos;
    }

})();
