/**
* Scripts for the clickimage generator.
*/

(function() {

    var advancedLoad = false;
    var nextPinId = 0;

    var isMoving = false;
    var movingPin;

    window.addEventListener('load', function() {
        if(dragDropSupported() && fileReaderSupported()) advancedLoad = true;

        initImageLoading();
        initMain();
        initSourceTab();
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

    function initMain() {
        initPinButtonListeners();
    }

    function initPinButtonListeners() {
        var generalButtons = document.querySelector('.general_buttons');
        generalButtons.querySelector('.back').addEventListener('click', onBack);
        generalButtons.querySelector('.pin_add').addEventListener('click', onAddPin);
        generalButtons.querySelector('.show_source').addEventListener('click', onShowSource);
        generalButtons.querySelector('.show_demo').addEventListener('click', onShowDemo);

        var imageWrap = document.querySelector('.image_wrap');

        imageWrap.addEventListener('click', onImageClick);
        imageWrap.addEventListener('mousedown', onImageMouseDown);
        imageWrap.addEventListener('mousemove', onImageMouseMove);
        imageWrap.addEventListener('mouseup', onImageMouseUp);
        imageWrap.addEventListener('touchstart', onImageMouseDown);
        imageWrap.addEventListener('touchmove', onImageMouseMove);
        imageWrap.addEventListener('touchend', onImageMouseUp);
        imageWrap.addEventListener('touchcancel', onImageMouseUp);

        document.addEventListener('click', function() {
            resetPinAddition();
        });
    }

    function resetPageState() {
        var page = document.querySelector('.page');
        page.classList.remove('source');
        page.classList.remove('demo');
    }

    function onBack() {
        resetPageState();
    }

    function onAddPin(event) {
        event.stopPropagation();
        resetPinAddition();

        var imageWrap = document.querySelector('.image_wrap');
        imageWrap.classList.add("positioning");
    }

    function onShowSource() {
        resetPageState();

        document.querySelector('.source_con > .source').value = getClickimageSource(true);
        document.querySelector('.page').classList.add('source');
    }

    function onShowDemo() {
        resetPageState();
        var demoCon = document.querySelector('.demo_con');
        demoCon.innerHTML = getClickimageSource();

        var img = demoCon.querySelector('img');
        img.src = document.querySelector('.image_wrap .image_con img').src;

        // from clickimage.js
        try {
            clickimagePins(img); //eslint-disable-line
        } catch(e) {
            // ignore
        }

        document.querySelector('.page').classList.add('demo');
    }

    function onImageClick(event) {
        var imageWrap = document.querySelector('.image_wrap');
        if(!imageWrap.classList.contains('image_displayed')) return;

        if(imageWrap.classList.contains('positioning')) {
            var posRel = getPositionRel(event, document.querySelector('.image_wrap .image_con'));

            if(posRel.x >= 0 && posRel.x <= 1
                && posRel.y >= 0 && posRel.y <= 1) {
                placePinSelection(posRel);
                event.stopPropagation();
            }
        }

        if(imageWrap.classList.contains('moving')) {
            // ignore moving click events, mouse/touch events do everything
            event.stopPropagation();
            event.preventDefault();
        }
    }

    function onImageMouseDown(event) {
        var imageWrap = document.querySelector('.image_wrap');
        if(!imageWrap.classList.contains('image_displayed')) return;

        if(imageWrap.classList.contains('moving')) {
            if(event.type === "touchstart") {
                touchHandler(event);
                return;
            }

            isMoving = true;
            var position = getPositionRel(event, document.querySelector('.image_wrap .image_con'));
            movePin(movingPin, position);

            event.stopPropagation();
            event.preventDefault();
        }
    }

    function onImageMouseMove(event) {
        var imageWrap = document.querySelector('.image_wrap');
        if(!imageWrap.classList.contains('image_displayed')) return;

        if(imageWrap.classList.contains('moving')
            && isMoving) {
            if(event.type === "touchmove") {
                touchHandler(event);
                return;
            }

            var position = getPositionRel(event, document.querySelector('.image_wrap .image_con'));
            movePin(movingPin, position);

            event.stopPropagation();
            event.preventDefault();
        }
    }

    function onImageMouseUp(event) {
        var imageWrap = document.querySelector('.image_wrap');
        if(!imageWrap.classList.contains('image_displayed')) return;

        if(imageWrap.classList.contains('moving')
            && isMoving) {
            if(event.type === "touchend"
                || event.type === "touchcancel") {
                touchHandler(event);
                return;
            }

            isMoving = false;
            movingPin = null;

            resetPinAddition();

            event.stopPropagation();
            event.preventDefault();
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

        movePin(pin, position);

        pin.addEventListener('click', function() {
            onPinSelected(this);
        });

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

        addPinEditPanel(pin);
        selectPin(pin);
    }

    /**
     * Moves a pin to the given position.
     * @param {*} pin
     * @param {*} position
     */
    function movePin(pin, position) {
        if(position.x >= 0 && position.x <= 1
            && position.y >= 0 && position.y <= 1) {
            pin.style.left = (position.x * 100) + "%";
            pin.style.top = (position.y * 100) + "%";
        }
    }

    /**
     * Done on placed pins to select the pin for editing.
     * @param {*} pin
     */
    function selectPin(pin) {
        removeClassForAll(document.querySelectorAll('.image_wrap .image_con > .image_pin'), "active");
        pin.classList.add("active");

        removeClassForAll(document.querySelectorAll('.edit_con > .edit_panels > .edit_panel'), "active");
        document.getElementById(pin.id.replace("pin_", "pin_edit_")).classList.add("active");
    }

    /**
     * Removes a pin and his edit panel
     * @param {*} pin
     */
    function removePin(pin) {
        var editPanel = document.getElementById(pin.id.replace("pin_", "pin_edit_"));
        editPanel.parentElement.removeChild(editPanel);
        pin.parentElement.removeChild(pin);
        rearrangePinIndices();

        if(!document.querySelector('.image_wrap .image_con > .image_pin')) {
            document.querySelector('.edit_con').classList.remove('active');
        }
    }

    /**
     * Removes all created pins.
     */
    function removeAllPins() {
        var pins = document.querySelectorAll('.image_wrap .image_con > .image_pin');
        for(var i = 0; i < pins.length; i++) {
            removePin(pins[i]);
        }
    }

    /**
     * Update the index of a pin. Will rearrange other pins on collision.
     * @param {*} pin the dom element of the .image_pin to change the index of
     * @param {*} index the index to change it to
     */
    function updatePinIndex(pin, index) {
        var currentIndex = pin.dataset.pinIndex ? parseInt(pin.dataset.pinIndex, 10) : Number.MAX_VALUE;
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

        var editPanel = document.getElementById(pin.id.replace("pin_", "pin_edit_"));
        if(editPanel) editPanel.querySelector('.pin_index').value = index;
    }

    /**
     * Rearranges all pins to fill gaps. e.g. [1, 2, 4, 7] will be rearranged
     * to [1, 2, 3, 4].
     */
    function rearrangePinIndices() {
        var pins = document.querySelectorAll('.image_wrap .image_con > .image_pin');
        var pinsArray = Array.prototype.slice.call(pins, 0);
        pinsArray.sort(function(a, b) {
            return (a.dataset.pinIndex ? parseInt(a.dataset.pinIndex, 10) : Number.MAX_VALUE)
                - (b.dataset.pinIndex ? parseInt(b.dataset.pinIndex, 10) : Number.MAX_VALUE);
        });

        // set new index
        for(var i = 0; i < pinsArray.length; i++) {
            if(pinsArray[i].dataset.pinIndex != (i + 1)) setPinIndex(pinsArray[i], i + 1);
        }
    }

    function getFirstUniqueIndex() {
        for(var i = 1; i < Number.MAX_VALUE; i++) {
            if(!document.querySelector('.image_wrap .image_con > .image_pin[data-pin-index="' + i + '"]')) {
                return i;
            }
        }
    }

    function addPinEditPanel(pin) {
        var con = document.createElement('div');
        con.innerHTML = DEFAULT_EDIT_PANEL;

        var panel = con.firstChild;
        panel.id = pin.id.replace("pin_", "pin_edit_");

        var pinOrientationSelect = panel.querySelector('.pin_orientation');
        var pinIndexInput = panel.querySelector('.pin_index');

        // set current values
        pinOrientationSelect.value = getPinOrientation(pin);
        pinIndexInput.value = pin.dataset.pinIndex;

        // add listeners
        pinOrientationSelect.addEventListener('change', function() {
            setPinOrientation(pin, pinOrientationSelect.value);
        });
        panel.querySelector('.pin_update_index').addEventListener('click', function() {
            onPinIndexUpdate(pin, pinIndexInput);
        });
        panel.querySelector('.pin_move').addEventListener('click', function(e) {
            onPinMove(e, pin);
        });
        panel.querySelector('.pin_remove').addEventListener('click', function(e) {
            onPinRemove(e, pin);
        });

        var edit_panels = document.querySelector('.edit_panels');
        if(edit_panels.children.length === 0) edit_panels.parentElement.classList.add('active');
        edit_panels.appendChild(panel);
    }

    function onPinIndexUpdate(pin, pinIndexInput) {
        try {
            var index = parseInt(pinIndexInput.value, 10);
            updatePinIndex(pin, index);
            pinIndexInput.value = pin.dataset.pinIndex;
        } catch(e) {
            // do nothing
        }
    }

    function onPinMove(event, pin) {
        event.stopPropagation();
        resetPinAddition();

        var imageWrap = document.querySelector('.image_wrap');
        imageWrap.classList.add("moving");

        movingPin = pin;
    }

    function onPinRemove(event, pin) {
        event.stopPropagation();
        removePin(pin);
    }

    function setPinOrientation(pin, orientation) {
        pin.classList.remove("bottom");
        pin.classList.remove("top");
        pin.classList.remove("left");
        pin.classList.remove("right");
        pin.classList.add(orientation);
    }

    function getPinOrientation(pin) {
        var orientation = "bottom";
        if(pin.classList.contains("top")) orientation = "top";
        else if(pin.classList.contains("left")) orientation = "left";
        else if(pin.classList.contains("right")) orientation = "right";
        return orientation;
    }

    function resetPinAddition() {
        var imageWrap = document.querySelector('.image_wrap');
        imageWrap.classList.remove("positioning");
        imageWrap.classList.remove("selecting");
        imageWrap.classList.remove("moving");

        var pinSelections = document.querySelectorAll('.pin_selection');
        for(var i = 0; i < pinSelections.length; i++) {
            pinSelections[i].parentElement.removeChild(pinSelections[i]);
        }
    }

    // source tab

    function initSourceTab() {
        initSourceListeners();
    }

    function initSourceListeners() {
        document.querySelector('.source_con .load').addEventListener('click', onSourceLoad);
    }

    function onSourceLoad() {
        var con = document.createElement('div');
        con.innerHTML = document.querySelector('.source_con .source').value;

        // reset pins
        resetPinAddition();
        removeAllPins();

        try {
            var img = con.querySelector('img');
            createPinsFromString(img.dataset.pins);
            loadPinInfos(con.querySelector('.pininfo').children);
            // get actual src string, without any domain addition (like img.src)
            document.querySelector('.general_edit .image_src').value = img.getAttribute("src");
            document.querySelector('.general_edit .image_invert_colors').checked =
                con.querySelector('.imagebox').classList.contains('invert');
        } catch(e) {
            //TODO display some error
        }

        resetPageState();
    }

    function createPinsFromString(data) {
        var coords = parsePinCoordinates(data); //eslint-disable-line

        for(var i = 0; i < coords.length; i++) {
            var position = { x: parseFloat(coords[i][0]) / 100, y: parseFloat(coords[i][1]) / 100 };
            var orientation = "bottom";
            if(coords[i].length >= 3) orientation = coords[i][2];

            var pin = createPin(position, orientation, nextPinId++, i + 1);
            placePin(pin);
        }
    }

    function loadPinInfos(infos) {
        var pins = document.querySelectorAll('.image_wrap .image_con > .image_pin');
        for(var i = 0; i < infos.length; i++) {
            var pin = pins[i];
            var editPanel = document.getElementById(pin.id.replace("pin_", "pin_edit_"));
            var html = infos[i].innerHTML;
            var leadingWhitepace = html.match(/^\s+/)[0].replace(/(\r?\n)*/, "");
            // remove leading whitespace after linebreak
            html = html.replace(new RegExp("(\\r?\\n) {1," + leadingWhitepace.length + "}", "g"), "$1").trim();
            editPanel.querySelector('.pin_inline').checked = infos[i].classList.contains('inline');
            editPanel.querySelector('.pin_text').value = html;
        }
    }

    // clickimage.js source functions

    function getClickimageSource(includeSrc) {
        var img = document.createElement('img');
        if(includeSrc) img.src = document.querySelector('.general_edit .image_src').value;
        img.dataset.pins = getDataPinString();

        var source =
            (document.querySelector('.general_edit .image_invert_colors').checked ?
                DEFAULT_CLICKIMAGE_SOURCE_INVERTED : DEFAULT_CLICKIMAGE_SOURCE)
                .replace("<!--img-->", img.outerHTML)
                .replace("<!--pins-->", getPinInfoString());

        return source;
    }

    function getDataPinString() {
        var string = "";

        var pins = document.querySelectorAll('.image_wrap .image_con > .image_pin');
        for(var i = 0; i < pins.length; i++) {
            if(i > 0) string += "; ";
            string += pins[i].style.left.replace(/%/, '');
            string += ", ";
            string += pins[i].style.top.replace(/%/, '');

            if(pins[i].classList.contains('top')) string += ", 'top'";
            else if(pins[i].classList.contains('left')) string += ", 'left'";
            else if(pins[i].classList.contains('right')) string += ", 'right'";
        }

        return string;
    }

    function getPinInfoString() {
        var string = "";

        var editPanels = document.querySelectorAll('.edit_con > .edit_panels > .edit_panel');
        for(var i = 0; i < editPanels.length; i++) {
            var code = editPanels[i].querySelector('.pin_text').value.replace(/(\r?\n)/g, '$1            ');
            var divCode = '<div>';
            if(editPanels[i].querySelector('.pin_inline').checked) divCode = '<div class="inline">';

            if(i > 0) string += '        ';
            string += divCode;
            string += '\r\n';
            string += '            ' + code + '\r\n';
            string += '        ' + '</div>\r\n';
        }

        return string;
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

    function removeClassForAll(elements, clazz) {
        for(var i = 0; i < elements.length; i++) {
            elements[i].classList.remove(clazz);
        }
    }

    function touchHandler(event) {
        var touches = event.changedTouches,
            first = touches[0],
            type = "";
        switch(event.type) {
            case "touchstart": type = "mousedown"; break;
            case "touchmove": type = "mousemove"; break;
            case "touchend": type = "mouseup"; break;
            default: return;
        }

        // initMouseEvent(type, canBubble, cancelable, view, clickCount,
        //                screenX, screenY, clientX, clientY, ctrlKey,
        //                altKey, shiftKey, metaKey, button, relatedTarget);

        var simulatedEvent = document.createEvent("MouseEvent");

        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0/*left*/, null);

        first.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
        event.stopPropagation();
    }

    // const elements

    var DEFAULT_EDIT_PANEL =
        '<div class="edit_panel">'
        + '<div class="edit_tools">'
        + '    <div class="row">'
        + '        <label>'
        + '            Orientation:'
        + '            <select class="pin_orientation">'
        + '                <option value="top">Up</option>'
        + '                <option value="bottom">Down</option>'
        + '                <option value="left">Left</option>'
        + '                <option value="right">Right</option>'
        + '            </select>'
        + '        </label>'
        + '        <label>'
        + '            Index:'
        + '            <input type="number" class="pin_index" step="1" />'
        + '            <button class="pin_update_index">Update</button>'
        + '        </label>'
        + '        <label>'
        + '            <button class="pin_move">Move</button>'
        + '        </label>'
        + '        <label>'
        + '            <button class="pin_remove">Remove</button>'
        + '        </label>'
        + '    </div>'
        + '    <div class="row">'
        + '        <label><input class="pin_inline" type="checkbox" /> Inline Content'
        + '    </div>'
        + '</div >'
        + '<textarea class="pin_text" placeholder="Enter HTML..."></textarea>'
        + '</div >';

    var DEFAULT_CLICKIMAGE_SOURCE =
        '<div class="clickimage">\r\n'
        + '    <div class="imagebox">\r\n'
        + '        <!--img-->\r\n'
        + '    </div>\r\n'
        + '    <div class="pininfo">\r\n'
        + '        <!--pins-->'
        + '    </div>\r\n'
        + '</div>\r\n';

    var DEFAULT_CLICKIMAGE_SOURCE_INVERTED =
        '<div class="clickimage">\r\n'
        + '    <div class="imagebox invert">\r\n'
        + '        <!--img-->\r\n'
        + '    </div>\r\n'
        + '    <div class="pininfo">\r\n'
        + '        <!--pins-->'
        + '    </div>\r\n'
        + '</div>\r\n';

})();
