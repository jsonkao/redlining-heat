// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"scripts/svg-inject.min.js":[function(require,module,exports) {
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

!function (o, l) {
  var r,
      a,
      s = "createElement",
      g = "getElementsByTagName",
      b = "length",
      E = "style",
      d = "title",
      y = "undefined",
      k = "setAttribute",
      w = "getAttribute",
      x = null,
      A = "__svgInject",
      C = "--inject-",
      S = new RegExp(C + "\\d+", "g"),
      I = "LOAD_FAIL",
      t = "SVG_NOT_SUPPORTED",
      L = "SVG_INVALID",
      v = ["src", "alt", "onload", "onerror"],
      j = l[s]("a"),
      G = (typeof SVGRect === "undefined" ? "undefined" : _typeof(SVGRect)) != y,
      f = {
    useCache: !0,
    copyAttributes: !0,
    makeIdsUnique: !0
  },
      N = {
    clipPath: ["clip-path"],
    "color-profile": x,
    cursor: x,
    filter: x,
    linearGradient: ["fill", "stroke"],
    marker: ["marker", "marker-end", "marker-mid", "marker-start"],
    mask: x,
    pattern: ["fill", "stroke"],
    radialGradient: ["fill", "stroke"]
  },
      u = 1,
      c = 2,
      O = 1;

  function T(e) {
    return (r = r || new XMLSerializer()).serializeToString(e);
  }

  function P(e, r) {
    var t,
        n,
        i,
        o,
        a = C + O++,
        f = /url\("?#([a-zA-Z][\w:.-]*)"?\)/g,
        u = e.querySelectorAll("[id]"),
        c = r ? [] : x,
        l = {},
        s = [],
        d = !1;

    if (u[b]) {
      for (i = 0; i < u[b]; i++) {
        (n = u[i].localName) in N && (l[n] = 1);
      }

      for (n in l) {
        (N[n] || [n]).forEach(function (e) {
          s.indexOf(e) < 0 && s.push(e);
        });
      }

      s[b] && s.push(E);
      var v,
          p,
          m,
          h = e[g]("*"),
          y = e;

      for (i = -1; y != x;) {
        if (y.localName == E) (m = (p = y.textContent) && p.replace(f, function (e, r) {
          return c && (c[r] = 1), "url(#" + r + a + ")";
        })) !== p && (y.textContent = m);else if (y.hasAttributes()) {
          for (o = 0; o < s[b]; o++) {
            v = s[o], (m = (p = y[w](v)) && p.replace(f, function (e, r) {
              return c && (c[r] = 1), "url(#" + r + a + ")";
            })) !== p && y[k](v, m);
          }

          ["xlink:href", "href"].forEach(function (e) {
            var r = y[w](e);
            /^\s*#/.test(r) && (r = r.trim(), y[k](e, r + a), c && (c[r.substring(1)] = 1));
          });
        }
        y = h[++i];
      }

      for (i = 0; i < u[b]; i++) {
        t = u[i], c && !c[t.id] || (t.id += a, d = !0);
      }
    }

    return d;
  }

  function V(e, r, t, n) {
    if (r) {
      r[k]("data-inject-url", t);
      var i = e.parentNode;

      if (i) {
        n.copyAttributes && function c(e, r) {
          for (var t, n, i, o = e.attributes, a = 0; a < o[b]; a++) {
            if (n = (t = o[a]).name, -1 == v.indexOf(n)) if (i = t.value, n == d) {
              var f,
                  u = r.firstElementChild;
              u && u.localName.toLowerCase() == d ? f = u : (f = l[s + "NS"]("http://www.w3.org/2000/svg", d), r.insertBefore(f, u)), f.textContent = i;
            } else r[k](n, i);
          }
        }(e, r);
        var o = n.beforeInject,
            a = o && o(e, r) || r;
        i.replaceChild(a, e), e[A] = u, m(e);
        var f = n.afterInject;
        f && f(e, a);
      }
    } else D(e, n);
  }

  function p() {
    for (var e = {}, r = arguments, t = 0; t < r[b]; t++) {
      var n = r[t];

      for (var i in n) {
        n.hasOwnProperty(i) && (e[i] = n[i]);
      }
    }

    return e;
  }

  function _(e, r) {
    if (r) {
      var t;

      try {
        t = function i(e) {
          return (a = a || new DOMParser()).parseFromString(e, "text/xml");
        }(e);
      } catch (o) {
        return x;
      }

      return t[g]("parsererror")[b] ? x : t.documentElement;
    }

    var n = l.createElement("div");
    return n.innerHTML = e, n.firstElementChild;
  }

  function m(e) {
    e.removeAttribute("onload");
  }

  function n(e) {
    console.error("SVGInject: " + e);
  }

  function i(e, r, t) {
    e[A] = c, t.onFail ? t.onFail(e, r) : n(r);
  }

  function D(e, r) {
    m(e), i(e, L, r);
  }

  function F(e, r) {
    m(e), i(e, t, r);
  }

  function M(e, r) {
    i(e, I, r);
  }

  function q(e) {
    e.onload = x, e.onerror = x;
  }

  function R(e) {
    n("no img element");
  }

  var e = function z(e, r) {
    var t = p(f, r),
        h = {};

    function n(a, f) {
      f = p(t, f);

      var e = function e(r) {
        var e = function e() {
          var e = f.onAllFinish;
          e && e(), r && r();
        };

        if (a && _typeof(a[b]) != y) {
          var t = 0,
              n = a[b];
          if (0 == n) e();else for (var i = function i() {
            ++t == n && e();
          }, o = 0; o < n; o++) {
            u(a[o], f, i);
          }
        } else u(a, f, e);
      };

      return (typeof Promise === "undefined" ? "undefined" : _typeof(Promise)) == y ? e() : new Promise(e);
    }

    function u(u, c, e) {
      if (u) {
        var r = u[A];
        if (r) Array.isArray(r) ? r.push(e) : e();else {
          if (q(u), !G) return F(u, c), void e();
          var t = c.beforeLoad,
              n = t && t(u) || u[w]("src");
          if (!n) return "" === n && M(u, c), void e();
          var i = [];
          u[A] = i;

          var l = function l() {
            e(), i.forEach(function (e) {
              e();
            });
          },
              s = function f(e) {
            return j.href = e, j.href;
          }(n),
              d = c.useCache,
              v = c.makeIdsUnique,
              p = function p(r) {
            d && (h[s].forEach(function (e) {
              e(r);
            }), h[s] = r);
          };

          if (d) {
            var o,
                a = function a(e) {
              if (e === I) M(u, c);else if (e === L) D(u, c);else {
                var r,
                    t = e[0],
                    n = e[1],
                    i = e[2];
                v && (t === x ? (t = P(r = _(n, !1), !1), e[0] = t, e[2] = t && T(r)) : t && (n = function o(e) {
                  return e.replace(S, C + O++);
                }(i))), r = r || _(n, !1), V(u, r, s, c);
              }
              l();
            };

            if (_typeof(o = h[s]) != y) return void (o.isCallbackQueue ? o.push(a) : a(o));
            (o = []).isCallbackQueue = !0, h[s] = o;
          }

          !function m(e, r, t) {
            if (e) {
              var n = new XMLHttpRequest();
              n.onreadystatechange = function () {
                if (4 == n.readyState) {
                  var e = n.status;
                  200 == e ? r(n.responseXML, n.responseText.trim()) : 400 <= e ? t() : 0 == e && t();
                }
              }, n.open("GET", e, !0), n.send();
            }
          }(s, function (e, r) {
            var t = e instanceof Document ? e.documentElement : _(r, !0),
                n = c.afterLoad;

            if (n) {
              var i = n(t, r) || t;

              if (i) {
                var o = "string" == typeof i;
                r = o ? i : T(t), t = o ? _(i, !0) : i;
              }
            }

            if (t instanceof SVGElement) {
              var a = x;

              if (v && (a = P(t, !1)), d) {
                var f = a && T(t);
                p([a, r, f]);
              }

              V(u, t, s, c);
            } else D(u, c), p(L);

            l();
          }, function () {
            M(u, c), p(I), l();
          });
        }
      } else R();
    }

    return G && function i(e) {
      var r = l[g]("head")[0];

      if (r) {
        var t = l[s](E);
        t.type = "text/css", t.appendChild(l.createTextNode(e)), r.appendChild(t);
      }
    }('img[onload^="' + e + '("]{visibility:hidden;}'), n.setOptions = function (e) {
      t = p(t, e);
    }, n.create = z, n.err = function (e, r) {
      e ? e[A] != c && (q(e), G ? (m(e), M(e, t)) : F(e, t), r && (m(e), e.src = r)) : R();
    }, o[e] = n;
  }("SVGInject");

  "object" == (typeof module === "undefined" ? "undefined" : _typeof(module)) && "object" == _typeof(module.exports) && (module.exports = e);
}(window, document);
},{}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "54342" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","scripts/svg-inject.min.js"], "script")
//# sourceMappingURL=/svg-inject.min.6fb6968a.js.map