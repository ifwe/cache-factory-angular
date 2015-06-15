[![Build Status](https://travis-ci.org/ifwe/cache-factory-angular.png)](https://travis-ci.org/ifwe/cache-factory-angular)
[![Dependency Status](https://gemnasium.com/ifwe/cache-factory-angular.png)](https://gemnasium.com/ifwe/cache-factory-angular)
[![Coverage Status](https://coveralls.io/repos/ifwe/cache-factory-angular/badge.png)](https://coveralls.io/r/ifwe/cache-factory-angular)

# LRU Cache with expiration support

A drop-in replacement for Angular's `$cacheFactory`, the `taggedCacheFactory` factory provides support cache expiration and tagging.

## Expiration

When the cache is full, items that have expired will be prioritized for removal before falling back to removing the least-recently-used item. This helps ensure that often-used cache entries will eventually be removed to prevent from showing stale content indefinitely.

## Usage

```js
var app = angular.module('MyApp', ['tagged.services.cache-factory']);
app.service('myService', ['taggedCacheFactory', 'mySlowApi', function(taggedCacheFactory, mySlowApi) {
  var cache = taggedCacheFactory('myServiceCache', {
    capacity: 3
  });

  // Let's cache an expensive call
  this.getThingFromSlowServiceById(id) {
    var cacheKey = 'thing-' + id;
    var cached = cache.get(cacheKey);
    if (cached) {
      // Cache hit, return it!
      return cached;
    }

    var promise = mySlowApi.getTheThing(id);
    cache.put(cacheKey, promise); // cache the thing with no expiration
    return promise;
  };

  // Let's cache another expensive call but expire the entry after 60 seconds
  this.getOtherThingFromSlowServiceById(id) {
    var cacheKey = 'other-thing-' + id;
    var cached = cache.get(cacheKey);
    if (cached) {
      // Cache hit, return it!
      return cached;
    }

    var promise = mySlowApi.getTheOtherThing(id);
    cache.put(cacheKey, promise, 60000); // cache for 60 seconds
    return promise;
  };
}]);
```

## Tagging

Each cache entry may optionally contain multiple tags, allowing you to group related cache entries for swift removal at a later time.

## Usage

```js
var app = angular.module('MyApp', ['tagged.services.cache-factory']);
app.service('myBlogService', ['taggedCacheFactory', 'mySlowApi', function(taggedCacheFactory, mySlowApi) {
  var cache = taggedCacheFactory('myBlogCache', {
    capacity: 3
  });

  this.getPost = function(id) {
    var cacheKey = 'blog-post-' + id;
    var cached = cache.get(cacheKey);
    if (cached) {
      // Cache hit, return it!
      return cached;
    }

    var promise = mySlowApi.getBlogPost(id);

    // Cache blog post promise and tag it as 'blog-{id}'
    cache.put(cacheKey, promise, null, 'blog-' + id);

    return promise;
  };

  this.getComments = function(id) {
    var cacheKey = 'blog-comments-' + id;
    var cached = cache.get(cacheKey);
    if (cached) {
      // Cache hit, return it!
      return cached;
    }

    var promise = mySlowApi.getBlogComments(id);

    // Cache blog comments promise and tag it as 'blog-{id}'
    cache.put(cacheKey, promise, null, 'blog-' + id);

    return promise;
  };

  this.deletePost = function(id) {
    // Make API call to delete the post
    return mySlowApi.deleteBlogPost(id)
    .then(function(result) {
      // Delete all cache entries for this post with just one call!
      // In this example, the cache for the post as well as the comments will be removed.
      cache.removeMatchingTag('blog-' + id);
    })
    .catch(function(error) {
      // Oops, something went wrong!
    });
  };
});
```

## Getting Started

To get started, add `tagged-cache-factory-min.js` to your webpage:
```html
<script type="text/javascript" src="path/to/tagged-cache-factory-min.js"></script>
```

And add the module `tagged.services.cache-factory` to your app's dependencies:
```js
var app = angular.module('MyApp', ['tagged.services.cache-factory']);
```

Then simply inject `taggedCacheFactory` whenever you need to create a new cache.

### Requirements

* AngularJS 1.1.5 - 1.3.x
* RequireJS (Optional)

### Using RequireJS
This service can be loaded as an AMD module if you're using RequireJS. There are a few requirements:

1. You must add paths to `angular` in your RequireJS config.
2. You must shim `angular` to export `angular`

At minimum, your requirejs config must include this:
```js
requirejs.config({
  paths: {
    'angular': 'path/to/angular'
  },
  shim: {
    'angular': {
      'exports': 'angular'
    }
  }
});
```

Once configured, you can `require()` the original source file `src/tagged-cache-factory` in your app:
```js
define(['angular', 'path/to/src/tagged-cache-factory'], function(angular) {
  var app = angular.module('MyApp', ['tagged.services.cache-factory']);

  // ...

});
```

## Development

**Requirements**
* nodejs 1.10.x
* npm 1.2.32

To set up the development environment, run these commands once:

```bash
# Global dependencies
$ npm install --global grunt-cli bower

# Local node dependencies (karma, etc.)
$ npm install

# 3rd-party libraries (Angular)
$ bower install
```

**Running Tests**
Once the development environment has been set up, tests can be run in a number of ways:

```bash
# Run all tests once
$ grunt test

# Run tests in development mode (enables file watcher to automatically rerun tests)
$ grunt dev
```

**Building Production Files**
```bash
# Build production files in `./`
$ grunt build
```

## Contributing
Contributions welcome! All we ask is that pull requests include unit tests. Thanks!

Copyright 2015 Tagged, Inc.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ifwe/cache-factory-angular/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

