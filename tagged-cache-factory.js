/*! tagged-cache-factory - v1.0.0 - 2015-06-12 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['angular'], factory);
    } else {
        // Browser globals
        root.taggedCacheFactory = factory(root.angular);
    }
}(this, function (angular) {
    "use strict";

    var module = angular.module('tagged.services.cache-factory', []);

    module.factory('taggedCacheFactory', ['$cacheFactory', function($cacheFactory) {
        var TaggedCache = function(cacheId, options) {
            this._cache = {};
            this._head = null;
            this._tail = null;
            this._options = angular.extend({
                capacity: false
            }, options || {});
        };

        TaggedCache.prototype.get = function(cacheKey) {
            if (!this._cache.hasOwnProperty(cacheKey)) {
                return undefined;
            }

            var entry = this._cache[cacheKey];

            if (entry.expiration) {
                var now = new Date();
                if (now.getTime() > entry.expiration.getTime()) {
                    this.remove(cacheKey);
                    return undefined;
                }
            }

            // TODO: Update LRU linked list
            moveToHead.call(this, entry);

            return entry.value;
        };

        TaggedCache.prototype.put = function(cacheKey, value, ttl) {
            var entry = {
                key: cacheKey,
                value: value,
                expiration: false
            };

            ttl = parseInt(ttl, 10);

            if (isFinite(ttl) && ttl > 0) {
                entry.expiration = new Date(new Date().getTime() + ttl);
            }

            moveToHead.call(this, entry);

            this._cache[cacheKey] = entry;

            if (this._options.capacity > 0 && Object.keys(this._cache).length > this._options.capacity) {
                clearExpired.call(this);

                if (Object.keys(this._cache).length > this._options.capacity) {
                    purgeTail.call(this);
                }
            }
        };

        var moveToHead = function(entry) {
            if (this._head) {
                entry.next = this._head;
                this._head.previous = entry;
            } else {
                entry.next = null;
            }

            // Head has no previous
            entry.previous = null;

            this._head = entry;

            if (!this._tail) {
                this._tail = entry;
            }
        };

        var purgeTail = function() {
            if (this._head === this._tail) {
                console.log('nothing to do, head === tail');
                // Do not purge
                return;
            }

            var tail = this._tail;
            var previous = tail.previous;
            previous.next = null;
            this._tail = previous;
            delete this._cache[tail.key];
        };

        var clearExpired = function() {
            var now = new Date();
            var _this = this;
            angular.forEach(this._cache, function(entry, cacheKey) {
                if (entry.expiration) {
                    if (now.getTime() > entry.expiration.getTime()) {
                        _this.remove(cacheKey);
                    }
                }
            });
        };

        TaggedCache.prototype.remove = function(cacheKey) {
            if (this._cache.hasOwnProperty(cacheKey)) {
                delete this._cache[cacheKey];
            }
        };

        TaggedCache.prototype.removeAll = function() {
            this._cache = {};
            this._head = null;
            this._tail = null;
        };

        var factory = function(cacheId, options) {
            return new TaggedCache(cacheId, options);
        };

        factory.TaggedCache = TaggedCache;

        return factory;
    }]);

    return module;
}));
