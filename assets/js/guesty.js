/**
 * Guesty JS API
 * v1.0.0
 */

var Guesty = (function (window, document, $) {

    if (typeof window.jQuery === "undefined") {
        throw new Error("Guesty JS API is dependent on jQuery. You must include jquery before using this script.");
    }

    //  constants

    var GUESTY = "https://api.guesty.com/api/v2/";
    var TOKEN = null;
    var _count = 0;
    var _limit = 7;

    var listingID = null;
    var __options = {};

    var currentPage = 0;
    var $container = null;
    var singleView = false;
    var singleViewItem = null;
    var singleViewItemID = 0;

    var __listings = [];


    var G = {};

    G.pagination = function (e) {
        e.preventDefault();
        currentPage = $(this).data('index') || 0;
        buildListingUI({
            limit: _limit,
            skip: currentPage * _limit
        });

        return false;
    };

    G.openSingle = function (e) {
        e.preventDefault();

        $("body").addClass("guesty-overlay");

        var $singleContainer = jQuery("<div/>").addClass('guesty-single-container');
        $container.append($singleContainer);

        var _id = $(this).data("id");

        if (!_id || typeof __listings[_id] === "undefined" || __listings[_id] === null || __listings[_id] === "") {
            return;
        }

        var item = __listings[_id];

        singleView = true;
        singleViewItem = item;
        singleViewItemID = _id;

        if (item) {
            $singleContainer.append(buildSingleUI(item));
        }

        return false;
    };

    G.close = function (e) {
        e.preventDefault();

        $container.find(".guesty-single-container").remove();
        $("body").removeClass("guesty-overlay");

        singleView = false;
        singleViewItem = null;
        singleViewItemID = 0;

        return false;
    };

    G.openGallery = function (e) {
        e.preventDefault();

        var index = $(this).data("index");
        var src = null;

        if (index === 0) {
            src = singleViewItem.picture["large"];
        }
        else {
            src = typeof singleViewItem.pictures[index - 1] !== "undefined" ? singleViewItem.pictures[index - 1]["large"] : null;
        }

        if (src === null) {
            return false;
        }

        var $main = $container.find(".guesty-single-container .guesty-primary-image img");

        $main.fadeOut(400, function () {
            $(this).attr("src", src).fadeIn(400);
        });

        return false;
    };

    G.openGalleryItem = function (e) {

        if (singleViewItem === null) {
            $("body").addClass("guesty-overlay");

            var $singleContainer = jQuery("<div/>").addClass('guesty-single-container');
            $container.append($singleContainer);

            var _id = $(this).data("id");

            if (!_id || typeof __listings[_id] === "undefined" || __listings[_id] === null || __listings[_id] === "") {
                return;
            }

            var item = __listings[_id];

            singleView = true;
            singleViewItem = item;
            singleViewItemID = _id;

            if (item) {
                $singleContainer.append(buildSingleUI(item));
            }
        }

        var index = $(this).data("index");
        var src = null;

        if (index === 0) {
            src = singleViewItem.picture["large"];
        }
        else {
            src = typeof singleViewItem.pictures[index - 1] !== "undefined" ? singleViewItem.pictures[index - 1]["large"] : null;
        }

        if (src === null) {
            return false;
        }

        var $main = $container.find(".guesty-single-container .guesty-primary-image img");

        $main.fadeOut(400, function () {
            $(this).attr("src", src).fadeIn(400);
        });
    };

    G.handleAmenitiesLess = function (e) {
        e.preventDefault();
        $container.find(".guesty-amenities").removeClass("open");

        return false;

    };
    G.handleAmenitiesMore = function (e) {
        e.preventDefault();
        $container.find(".guesty-amenities").addClass("open");
        return false;

    };

    //  templates

    var TEMPLATES = {};

    TEMPLATES.LISTINGS = "" +

        '<div class="guesty-listing guesty-property">' +
        '   <h2><a href="' + __options.baseURI + '__LISTING.ID__" data-id="__LISTING.ID__" class="guesty-single-handle">__LISTING.TITLE__</a></h2>' +
        '   <p><span class="address">__LISTING.ADDRESS__</span><span class="tags">__LISTING.TAG__</span></p>' +
        '   <div class="guesty-thumbnail">' +
        '       <a href="#" class="guesty-single-handle" data-id="__LISTING.ID__"><img src="__LISTING.IMAGE__" alt="__LISTING.IMAGE.ALT__"></a>' +
        '   </div>' +
        '   <div class="guesty-gallery">__LISTING.GALLERY__</div>' +
        '</div>';

    TEMPLATES.LISTINGS_BOX = "" +

        '<div class="guesty-listing guesty-property guesty-layout-box">' +
        '   <a href="__BASEURI__/listing/__LISTING.ID__" data-id="__LISTING.ID__" class="guesty-single-listing">' +
        '       <div class="guesty-listing-box">' +
        '           <div class="guesty-thumbnail">' +
        '               <img src="__LISTING.IMAGE__" alt="__LISTING.IMAGE.ALT__">' +
        '           </div>' +
        '           <div class="guesty-box-footer">' +
        '               <div class="guesty-footer-left">' +
        '                   <h2>__LISTING.TITLE__</h2>' +
        '                   <p class="guesty-box-meta">' +
        '                       <span class="guesty-meta-guest-count">__LISTING.META.GUESTS__</span>' +
        '                       <span class="guesty-separator">|</span>' +
        '                       <span class="guesty-meta-bedrooms-count">__LISTING.META.BEDROOMS__</span>' +
        '                   </p>' +
        '               </div>' +
        '               <div class="guesty-footer-right">' +
        '                   <p class="guesty-price"><span class="guesty-price-from">From</span><span class="guesty-price-qty">__LISTING.PRICE__</span></p>' +
        '               </div>' +
        '               ' +
        '           </div>' +
        '       </div>' +
        '   </a>' +
        '</div>';

    TEMPLATES.LISTING = "" +
        '<div class="guesty-listing-single-container">' +
        '   <div class="guesty-listing-single guesty-property-single">' +
        // '       <div class="guesty-close"><a href="#">&times;</a></div>' +
        '       <div class="guesty-single-row guesty-single-row-full">' +
        '           <div class="guesty-primary">' +
        '               <div class="guesty-primary-image">__LISTING.CAROUSEL__</div>' +
        '           </div>' +
        '           <div class="guesty-secondary">' +
        '               <div class="guesty-secondary-header separator-black">' +
        '                   <div class="guesty-secondary-header-left">' +
        '                       <h1>__LISTING.TITLE__</h1>' +
        '                   </div>' +
        '                   <div class="guesty-secondary-header-right">' +
        '                       <p class="guesry-listing-price">__LISTING.PRICE__</p>' +
        '                       <p class="guesry-listing-per-night">Avg. per night</p>' +
        '                   </div>' +
        '               </div>' +
        '               <div class="mb-lg-25 mb-45 mt-35">' +
        '                   <div class="separated-datepicker">' +
        '                       <div class="DateRangePicker DateRangePicker_1">' +
        '                           <div>' +
        '                               <div class="DateRangePickerInput DateRangePickerInput_1 DateRangePickerInput__withBorder DateRangePickerInput__withBorder_2">' +
        '                                   <div class="DateInput DateInput_1">' +
        '                                       <input type="text" class="DateInput_input DateInput_input_1" aria-label="Check in" id="startDateId" name="startDateId" value="" placeholder="Check in" autocomplete="off" aria-describedby="DateInput__screen-reader-message-startDateId">' +
        '                                       <p class="DateInput_screenReaderMessage DateInput_screenReaderMessage_1" id="DateInput__screen-reader-message-startDateId">Press the down arrow key to interact with the calendar and select a date. Press the question mark key to get the keyboard shortcuts for changing dates.</p>' +
        '                                   </div>' +
        '                                   <div class="DateRangePickerInput_arrow DateRangePickerInput_arrow_1" aria-hidden="true" role="presentation">' +
        '                                       <svg class="DateRangePickerInput_arrow_svg DateRangePickerInput_arrow_svg_1" viewBox="0 0 1000 1000"><path d="M694.4 242.4l249.1 249.1c11 11 11 21 0 32L694.4 772.7c-5 5-10 7-16 7s-11-2-16-7c-11-11-11-21 0-32l210.1-210.1H67.1c-13 0-23-10-23-23s10-23 23-23h805.4L662.4 274.5c-21-21.1 11-53.1 32-32.1z"></path></svg>' +
        '                                   </div>' +
        '                                   <div class="DateInput DateInput_1">' +
        '                                       <input type="text" class="DateInput_input DateInput_input_1" aria-label="Check out" id="endDateId" name="endDateId" value="" placeholder="Check out" autocomplete="off" aria-describedby="DateInput__screen-reader-message-endDateId">' +
        '                                       <p class="DateInput_screenReaderMessage DateInput_screenReaderMessage_1" id="DateInput__screen-reader-message-endDateId">Press the down arrow key to interact with the calendar andselect a date. Press the question mark key to get the keyboard shortcuts for changing dates.</p>' +
        '                                   </div>' +
        '                               </div>' +
        '                           </div>' +
        '                       </div>' +
        '                   </div>' +
        '               </div>' +
        '               <div class="mb-35">' +
        '                   <div class="Dropdown-root">' +
        '                       <div class="Dropdown-control " data-label="Guests">' +
        '                           <div class="Dropdown-placeholder">Guests</div>' +
        '                           <span class="Dropdown-arrow"></span>' +
        '                       </div>' +
        '                   </div>' +
        '               </div>'+
        '               <a class="d-block" href="__LISTING.PERMALINK__/book?">' +
        '                   <button class="col submit-btn btn btn-primary" disabled="" style="background: rgb(226, 36, 0);">Book</button>' +
        '               </a>'+
        '           </div>' +
        '       </div>' +
        '       <div class="guesty-single-row">' +
        '           <div class="row no-gutters separator">' +
        '               <div class="col-xl p-sm-5 py-5 px-2 listing-general-info-row">' +
        '                   <div class="d-flex">' +
        '                       <div class="listing-general-info-item mr-4">' +
        '                           <div class="icon-label d-flex align-items-center flex-column contained">' +
        '                               <div class="icon-wrap mb-2">' +
        '                                   <img src="/static/media/listing_guests.b6f69025.svg" alt="listing_guests">' +
        '                               </div>' +
        '                               <div class="wide">' +
        '                                   <div class="line-height-12">' +
        '                                       <span class="d-block d-sm-inline text-center">__LISTING.GUESTS.COUNT__</span>' +
        '                                       <span>guests</span>' +
        '                                   </div>' +
        '                               </div>' +
        '                           </div>' +
        '                       </div>' +
        '                       <div class="listing-general-info-item mr-4">' +
        '                           <div class="icon-label d-flex align-items-center flex-column contained">' +
        '                               <div class="icon-wrap mb-2">' +
        '                                   <img src="/static/media/listing_bedrooms.7ddd6a2a.svg" alt="listing_bedrooms">' +
        '                               </div>' +
        '                               <div class="wide">' +
        '                                   <div class="line-height-12">' +
        '                                       <span class="d-block d-sm-inline text-center">__LISTING.BEDROOMS.COUNT__</span>' +
        '                                       <span>bedrooms</span>' +
        '                                   </div>' +
        '                               </div>' +
        '                           </div>' +
        '                       </div>' +
        '                       <div class="listing-general-info-item mr-4">' +
        '                           <div class="icon-label d-flex align-items-center flex-column contained">' +
        '                               <div class="icon-wrap mb-2">' +
        '                                   <img src="/static/media/listing_beds.7143f54e.svg" alt="listing_beds">' +
        '                               </div>' +
        '                               <div class="wide">' +
        '                                   <div class="line-height-12">' +
        '                                       <span class="d-block d-sm-inline text-center">__LISTING.BEDS.COUNT__</span>' +
        '                                       <span>beds</span>' +
        '                                   </div>' +
        '                               </div>' +
        '                           </div>' +
        '                       </div>' +
        '                       <div class="listing-general-info-item">' +
        '                           <div class="icon-label d-flex align-items-center flex-column contained">' +
        '                               <div class="icon-wrap mb-2">' +
        '                                   <img src="/static/media/listing_bathroom.31f189cc.svg" alt="listing_bathroom">' +
        '                               </div>' +
        '                               <div class="wide">' +
        '                                   <div class="line-height-12">' +
        '                                       <span class="d-block d-sm-inline text-center">__LISTING.BATHROOM.COUNT__</span>' +
        '                                       <span>bathrooms</span>' +
        '                                   </div>' +
        '                               </div>' +
        '                           </div>' +
        '                       </div>' +
        '                   </div>' +
        '               </div>' +
        '               <div class="col-xl p-5 text-center listing-address">' +
        '                   <div class="icon-label d-flex align-items-center flex-column contained">' +
        '                       <div class="icon-wrap mb-2">' +
        '                           <img src="/static/media/listing_location.75e1758b.svg" alt="listing_location">' +
        '                       </div>' +
        '                       <div class="">__LISTING.BASEADDRESS__</div>' +
        '                   </div>' +
        '               </div>' +
        '           </div>' +
        '       </div>' +
        '       <div class="guesty-single-row">' +
        '           <div class="guesty-amenities">' +
        '               <h3>Amenities</h3>' +
        '               <div class="guesty-amenities-container">__LISTING.AMENITIES__</div>' +
        '               <div class="amenities-handle">' +
        '                   <a href="#" class="amenities-handle-more">More</a>' +
        '                   <a href="#" class="amenities-handle-less">Less</a>' +
        '               </div>' +
        '           </div>' +
        '       </div>' +
        '       <div class="guesty-single-row">' +
        '           <div class="address"><i class="fas fa-map-marker-alt"></i> __LISTING.ADDRESS__</div>' +
        '           <div class="tags">__LISTING.TAG__</div>' +
        '       </div>' +
        '   </div>' +
        '</div>';

    //  helpers

    function prepareUI() {
        if (!$container) {
            throw new Error("Container not found, Guesty is initialized with no container element.");
        }

        if (listingID) {
            prepareSingleUI();
        }
        else {
            prepareListingsUI();
        }

        registerEvents();
    }

    function prepareListingsUI() {
        currentPage = 0;

        buildListingUI({
            limit: _limit
        });
    }

    function prepareSingleUI() {
        getListing(listingID, {}, function (data) {
            var $singleContainer = jQuery("<div/>").addClass('-guesty-single-container');
            var item = data;

            singleView = true;
            singleViewItem = item;
            singleViewItemID = listingID;

            $container.append($singleContainer);

            if (item) {
                $singleContainer.append(buildSingleUI(item));
            }
        }, function (code, err) {
            console.error(code, err);
        });
    }

    function buildListingUI(params) {
        $container.addClass("guesty-loading");
        getListings(params, function (list) {

            if (!list || list.length === 0) {
                return;
            }

            var $listings = [];

            var gallery = [];

            for (var i in list) {
                if (!list.hasOwnProperty(i)) {
                    continue;
                }
                var item = list[i];
                var $listing = '';

                $listing = TEMPLATES.LISTINGS_BOX.replace('__LISTING.TITLE__', item.title);
                // $listing = $listing.replace('__LISTING.ID__', item.title);
                $listing = $listing.replace(/__BASEURI__/gi, __options.baseURI);
                $listing = $listing.replace(/__LISTING.ID__/gi, item._id);
                $listing = $listing.replace('__LISTING.IMAGE__', item.picture['thumbnail']);
                $listing = $listing.replace('__LISTING.IMAGE.ALT__', item.picture['caption'] || item.title);
                $listing = $listing.replace('__LISTING.META.GUESTS__', item.accommodates + ' ' + (item.accommodates > 1 ? 'guests' : 'guest'));
                $listing = $listing.replace('__LISTING.META.BEDROOMS__', item.bedrooms + ' ' + (item.bedrooms > 1 ? 'bedrooms' : 'bedroom'));
                $listing = $listing.replace('__LISTING.PRICE__', '$' + item.prices['basePriceUSD']);

                $listings.push($listing);
            }

            $container.removeClass("guesty-loading");
            $container.html($listings.join(""));

            if (_count > _limit) {
                $container.append(buildPaginationUI());
            }

        }, function (code, err) {
            console.error(code, err);
        });
    }

    function buildGalleryUI(item, slice) {
        var gallery = [];
        var pictures = item.pictures;

        if (pictures && pictures.length > 0) {
            if (slice) {
                pictures = pictures.splice(0, slice);
            }
            for (var i = 0; i < pictures.length; i++) {
                var thumb = pictures[i].thumbnail || null;
                if (thumb) {
                    gallery.push('<img src="' + thumb + ' " alt="" data-index="' + (i + 1) + '" class="guesty-gallery-item" data-id="' + item._id + '">');
                }
            }
        }

        if (singleView) {
            var picture = item.picture;
            thumb = picture.thumbnail || null;
            if (thumb) {
                gallery.push('<img src="' + thumb + ' " alt="" data-index="0" class="guesty-gallery-item" data-id="' + item._id + '">');
            }
        }

        return "<div class='guesty-gallery-thumb guesty-gallery-" + slice + "'>" + gallery.join("") + "</div>";
    }

    function buildCarouselUI(item, slice) {
        var gallery = [];
        var pictures = item.pictures;
        var imgCount = pictures.length;

        var $item = "";

        var picture = item.picture;
        var large = picture.large || null;

        if (large) {

            $item += '<input type="radio" name="radio-buttons" id="img-0" checked />';
            $item += '<li class="slide-container">';
            $item += '  <div class="slide-image">';
            $item += '      <img src="' + large + '">';
            $item += '  </div>';
            $item += '  <div class="carousel-controls">';
            $item += '      <label for="img-' + imgCount + '" class="prev-slide">';
            $item += '          <span>&lsaquo;</span>';
            $item += '      </label>';
            $item += '      <label for="img-1" class="next-slide">';
            $item += '          <span>&rsaquo;</span>';
            $item += '      </label>';
            $item += '  </div>';
            $item += '</li>';

            gallery.push($item);
        }

        if (pictures && pictures.length > 0) {
            if (slice) {
                pictures = pictures.splice(0, slice);
            }
            for (var i = 0; i < pictures.length; i++) {
                large = pictures[i].large || null;
                if (large) {
                    $item = "";

                    $item += '<input type="radio" name="radio-buttons" id="img-' + (i+1) + '" checked />';
                    $item += '<li class="slide-container">';
                    $item += '  <div class="slide-image">';
                    $item += '      <img src="' + large + '">';
                    $item += '  </div>';
                    $item += '  <div class="carousel-controls">';
                    $item += '      <label for="img-' + i + '" class="prev-slide">';
                    $item += '          <span>&lsaquo;</span>';
                    $item += '      </label>';
                    $item += '      <label for="img-' + ((imgCount - i) > 1 ? (i + 2) : 0) + '" class="next-slide">';
                    $item += '          <span>&rsaquo;</span>';
                    $item += '      </label>';
                    $item += '  </div>';
                    $item += '</li>';

                    gallery.push($item);
                }
            }
        }

        var $html = '';

        $html += '<ul class="slides">';
        $html += gallery.join("");
        $html += '</ul>';

        return "<div class='guesty-gallery-thumb guesty-gallery-" + (slice || 'full') + "'>" + $html + "</div>";
    }

    function buildPaginationUI() {

        var pages = Math.ceil(_count / _limit);
        var pagination = [];

        for (var i = 0; i < pages; i++) {
            pagination.push("<a href='#' data-index='" + i + "' class='guesty-pagination-item" + (currentPage === i ? " active" : "") + "'>" + (i + 1) + "</a>");
        }

        return "<div class='guesty-pagination'>" + pagination.join("") + "</div>";
    }

    function getListings(params, success, fail) {
        success = success || function () {
            };
        fail = fail || function () {
            };

        var paramsStr = [];

        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                paramsStr.push(i + "=" + params[i]);
            }
        }

        $.ajax({
            method: 'GET',
            url: GUESTY + 'listings' + (paramsStr.length > 0 ? "?" + paramsStr.join("&") : ""),
            headers: {
                'Authorization': TOKEN
            },
            success: function (response) {

                if (!response || !response.results) {
                    return fail("Invalid response", response);
                }

                _count = response.count || 0;

                var results = response.results;

                console.log(response);

                if (results.length > 0) {
                    for (var i in results) {
                        if (results.hasOwnProperty(i)) {
                            var item = results[i];
                            __listings[item._id] = item;
                        }
                    }
                }

                return success(results);
            },
            error: function (jqXHR, code, err) {
                return fail(code, err);
            }
        });
    }

    function getListing(id, params, success, fail) {
        success = success || function () {
            };
        fail = fail || function () {
            };

        var paramsStr = [];

        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                paramsStr.push(i + "=" + params[i]);
            }
        }

        $.ajax({
            method: 'GET',
            url: GUESTY + 'listings/' + id + (paramsStr.length > 0 ? "?" + paramsStr.join("&") : ""),
            headers: {
                'Authorization': TOKEN
            },
            success: function (response) {

                if (!response) {
                    return fail("Invalid response", response);
                }

                console.log(response);

                return success(response);
            },
            error: function (jqXHR, code, err) {
                return fail(code, err);
            }
        });
    }

    function buildSingleUI(item) {
        var $listing = '';

        var amenities = [];

        if (item.amenities.length > 0) {
            for (var i = 0; i < item.amenities.length; i++) {
                amenities.push("<span class='guesty-amenities-item'><i class='far fa-check-circle'></i><span class='amenity-name'>" + item.amenities[i] + '</span></span>');
            }
        }

        $listing = TEMPLATES.LISTING.replace('__LISTING.TITLE__', item.title);
        $listing = $listing.replace(/__BASEURI__/gi, __options.baseURI);
        $listing = $listing.replace('__LISTING.ID__', item._id);
        $listing = $listing.replace('__LISTING.PERMALINK__', __options.baseURI + '/listing/' + item._id);
        $listing = $listing.replace('__LISTING.ADDRESS__', item.address.full);
        $listing = $listing.replace('__LISTING.TAG__', (item.tags.length > 0 ? '' + item.tags.join(",") + '' : ''));
        $listing = $listing.replace('__LISTING.IMAGE__', item.picture['large']);
        $listing = $listing.replace('__LISTING.CAROUSEL__', buildCarouselUI(item));
        $listing = $listing.replace('__LISTING.ALT__', item.picture['caption'] || item.title);
        // $listing = $listing.replace('__LISTING.GALLERY__', buildGalleryUI(item));
        $listing = $listing.replace('__LISTING.AMENITIES__', amenities.join(""));
        $listing = $listing.replace('__LISTING.PRICE__', '$' + item.prices['basePriceUSD']);

        return $listing;
    }

    function registerEvents() {
        $container.on("click", ".guesty-pagination-item", G.pagination);
        $container.on("click", ".guesty-single-handle", G.openSingle);
        $container.on("click", ".guesty-close a", G.close);
        $container.on("click", ".guesty-gallery-item", G.openGalleryItem);
        $container.on("click", ".amenities-handle-more", G.handleAmenitiesMore);
        $container.on("click", ".amenities-handle-less", G.handleAmenitiesLess);
    }


    return function (container, token, id) {
        $container = $(container);
        TOKEN = token;

        for (var i in GUESTY_ARGS) {
            if (GUESTY_ARGS.hasOwnProperty(i)) {
                __options[i] = GUESTY_ARGS[i];
            }
        }

        if (__options.limit && !isNaN(parseInt(__options.limit))) {
            _limit = __options.limit;
        }

        listingID = typeof id !== "undefined" ? id : null;

        prepareUI();
    }

})(window, document, window.jQuery || window.$);