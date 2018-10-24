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
        '       <div class="guesty-single-row">' +
        '           <div class="guesty-primary">' +
        '               <div class="guesty-primary-image">' +
        '                   <img src="__LISTING.IMAGE__" alt="__LISTING.IMAGE.ALT__">' +
        '               </div>' +
        '               <div class="guesty-gallery">__LISTING.GALLERY__</div>' +
        '           </div>' +
        '           <div class="guesty-secondary">' +
        '               <div class="guesty-secondary-header">' +
        '                   <div class="guesty-secondary-header-left">' +
        '                       <h1>__LISTING.TITLE__</h1>' +
        '                   </div>' +
        '                   <div class="guesty-secondary-header-right">' +
        '                       <p class="guesry-listing-price">__LISTING.PRICE__</p>' +
        '                       <p class="guesry-listing-per-night">Avg.per night</p>' +
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
        $listing = $listing.replace('__LISTING.ADDRESS__', item.address.full);
        $listing = $listing.replace('__LISTING.TAG__', (item.tags.length > 0 ? '' + item.tags.join(",") + '' : ''));
        $listing = $listing.replace('__LISTING.IMAGE__', item.picture['large']);
        $listing = $listing.replace('__LISTING.ALT__', item.picture['caption'] || item.title);
        $listing = $listing.replace('__LISTING.GALLERY__', buildGalleryUI(item));
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

        for(var i in GUESTY_ARGS){
            if(GUESTY_ARGS.hasOwnProperty(i)){
                __options[i] = GUESTY_ARGS[i];
            }
        }

        if(__options.limit && !isNaN(parseInt(__options.limit))){
            _limit = __options.limit;
        }

        listingID = typeof id !== "undefined" ? id : null;

        prepareUI();
    }

})(window, document, window.jQuery || window.$);