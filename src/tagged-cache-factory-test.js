/*jshint expr: true*/
define(function(require) {
    var sinon = require('sinon');
    var angular = require('angular');
    require('src/tagged-cache-factory');
    require('angular/mocks');

    describe('Module: tagged.services.cache-factory', function() {
        beforeEach(module('tagged.services.cache-factory'));

        beforeEach(inject(function(taggedCacheFactory) {
            this.cacheFactory = taggedCacheFactory;
            this.clock = sinon.useFakeTimers();
        }));

        afterEach(function() {
            this.clock.restore();
        });

        it('is a factory', function() {
            var cache = this.cacheFactory('my_cache');
            cache.should.be.instanceOf(this.cacheFactory.TaggedCache);
        });

        describe('supports angular cache behavior', function() {
            beforeEach(function() {
                this.cache = this.cacheFactory('my_cache');
            });

            it('can put and get', function() {
                expect(this.cache.get('test_key')).to.be.undefined;
                this.cache.put('test_key', 42);
                this.cache.get('test_key').should.equal(42);
            });

            it('can remove a single entry', function() {
                this.cache.put('test_key', 42);
                this.cache.get('test_key').should.equal(42);
                this.cache.remove('test_key');
                expect(this.cache.get('test_key')).to.be.undefined;
            });

            it('can remove all', function() {
                this.cache.put('test_key_1', 42);
                this.cache.put('test_key_2', 84);
                this.cache.removeAll();
                expect(this.cache.get('test_key_1')).to.be.undefined;
                expect(this.cache.get('test_key_2')).to.be.undefined;
            });

            it('throws exception if cache id already exists', function() {
                var _this = this;
                expect(function() {
                    var cache = _this.cacheFactory('my_cache');
                }).to.throw();
            });

            it('can get caches by id', function() {
                expect(this.cacheFactory.get('my_cache')).to.equal(this.cache);
                expect(this.cacheFactory.get('unknown_cache')).to.be.undefined;
            });

            it('can self destroy', function() {
                this.cache.destroy();
                var cache = this.cacheFactory.get('my_cache');
                expect(cache).to.be.undefined;
            });
        });

        describe('expiration', function() {
            beforeEach(function() {
                this.cache = this.cacheFactory('my_cache');
            });

            it('get returns undefined for expired entry', function() {
                this.cache.put('test_key', 42, 100); // expires in 100ms
                this.cache.get('test_key').should.equal(42);
                this.clock.tick(100);
                this.cache.get('test_key').should.equal(42);
                this.clock.tick(1);
                expect(this.cache.get('test_key')).to.be.undefined;
            });

            [
                -1,
                -1000,
                'foo',
                null,
                undefined,
                true,
                false
            ].forEach(function(ttl) {
                it('ignores invalid ttl ' + JSON.stringify(ttl), function() {
                    this.cache.put('test_key', 42, ttl);
                    expect(this.cache.get('test_key')).to.equal(42);
                    this.clock.tick(10000000);
                    expect(this.cache.get('test_key')).to.equal(42);
                });
            });
        });

        describe('lru with expiration', function() {
            beforeEach(function() {
                this.cache = this.cacheFactory('my_cache', {
                    capacity: 3
                });
            });

            it('removes least recently used entry if none have expired', function() {
                this.cache.put('a', 1); // no expiration
                this.cache.put('b', 2); // no expiration
                this.cache.put('c', 3, 100); // newest entry, but expires soon
                this.clock.tick(99);

                // force a cached entry to drop, in this case, the entry `a` because none have expired
                this.cache.put('d', 4);

                expect(this.cache.get('a')).to.be.undefined; // removed because it was last to be accessed
                expect(this.cache.get('b')).to.equal(2); // still good
                expect(this.cache.get('c')).to.equal(3); // still good
                expect(this.cache.get('d')).to.equal(4); // still good
            });

            it('removes expired entries before removing least recently used entry', function() {
                this.cache.put('a', 1); // no expiration
                this.cache.put('b', 2); // no expiration
                this.cache.put('c', 3, 100); // newest entry, but expires soon
                this.clock.tick(101);

                // force a cached entry to drop, in this case, the expired entry
                this.cache.put('d', 4);

                expect(this.cache.get('a')).to.equal(1); // still good
                expect(this.cache.get('b')).to.equal(2); // still good
                expect(this.cache.get('c')).to.be.undefined; // removed because it expired
                expect(this.cache.get('d')).to.equal(4); // still good
            });

            [
                [ 'tail', 'a', { a: undefined, b: undefined, c: 3, d: 4, e: 5} ],
                [ 'head', 'c', { a: undefined, b: 2, c: undefined, d: 4, e: 5} ],
                [ 'middle', 'b', { a: undefined, b: undefined, c: 3, d: 4, e: 5} ]
            ].forEach(function(data) {
                var entryPosition = data[0];
                var cacheKeyToRemove = data[1];
                var expectedCache = data[2];
                it('does not break LRU when ' + entryPosition + ' is removed manually', function() {
                    var _this = this;
                    // First fill up the cache up to the limit
                    this.cache.put('a', 1);
                    this.cache.put('b', 2);
                    this.cache.put('c', 3);

                    // Remove the specified item from the data provider
                    this.cache.remove(cacheKeyToRemove);

                    // Add two more items to force the LRU item to be purged
                    this.cache.put('d', 4);
                    this.cache.put('e', 5);

                    // Assert the cache contains all the expected items
                    angular.forEach(expectedCache, function(value, key) {
                        expect(_this.cache.get(key)).to.equal(value);
                    });
                });
            });
        });

        describe('tags', function() {
            beforeEach(function() {
                this.cache = this.cacheFactory('my_cache', {
                    capacity: 10
                });
            });

            it('can be removed by tag name', function() {
                this.cache.put('a', 1, null, 'foo'); // single tag
                this.cache.put('b', 2, null, ['foo', 'bar']); // multiple tags
                this.cache.put('c', 3, null, 'bar');
                this.cache.removeMatchingTag('foo');
                expect(this.cache.get('a')).to.be.undefined;
                expect(this.cache.get('b')).to.be.undefined;
                expect(this.cache.get('c')).to.equal(3);
            });
        });
    });
});
