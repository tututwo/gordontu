(_.GLAssetsLoader = (function () {
  var e,
    t = _.ClassFactory.create(_.EventDispatcher),
    a = {},
    n = SiteConst.DOCUMENT_ROOT + "assets/data/works.json",
    r = SiteConst.DOCUMENT_ROOT + "assets/model/cloth.fbx",
    s = [
      SiteConst.DOCUMENT_ROOT + "assets/textures/titles/title_01.png",
      SiteConst.DOCUMENT_ROOT + "assets/textures/etc/vat_2048_compressed.png",
      SiteConst.DOCUMENT_ROOT + "assets/textures/etc/nat_2048_compressed.png",
      SiteConst.DOCUMENT_ROOT + "assets/textures/etc/menu.png",
      SiteConst.DOCUMENT_ROOT + "assets/textures/fonts/map.png",
      SiteConst.DOCUMENT_ROOT + "assets/textures/etc/scroll.png",
    ],
    o = 0;
  return (
    (t.textures = []),
    (t.typo = []),
    (t.fbx = null),
    (t.coverSvg = null),
    (t.coverSubImage = null),
    (t.works = null),
    (t.getJsonURL = function () {
      return n;
    }),
    (t.init = function (e) {
      if (e != a) throw new Error("GLAssetsLoader is a Singleton Class.");
    }),
    (t.load = function () {
      var e = this;
      fetch(n)
        .then(function (e) {
          return e.json();
        })
        .then(function (t) {
          (e.works = t), (o = 0);
          for (var a, n = 0, l = e.works.works.length; n < l; n++)
            (a = (10 > n ? "0" : "") + n + ".png"),
              s.push(SiteConst.DOCUMENT_ROOT + "assets/textures/typo/t" + a);
          var d = function () {
            o++,
              o < s.length + 4 ||
                e.dispatchEvent(new _.GLEvent(_.GLEvent.ASSETS_LOADED));
          };
          WebFont.load({
            google: {
              families: ["Oswald", "Padauk", "Almarai"],
            },
            active: d,
          }),
            new THREE.FBXLoader().load(r, function (t) {
              (e.fbx = t), d();
            }),
            (e.coverSvg = new Image()),
            (e.coverSvg.onload = function () {
              d();
            }),
            (e.coverSvg.id = "coverSVG"),
            (e.coverSvg.src =
              SiteConst.DOCUMENT_ROOT + "assets/textures/titles/title_01.svg"),
            (e.coverSubImage = new Image()),
            (e.coverSubImage.onload = function () {
              d();
            }),
            (e.coverSubImage.src =
              SiteConst.DOCUMENT_ROOT +
              "assets/textures/titles/title_01_sub.png");
          for (var n = 0; n < s.length; n++)
            6 > n
              ? ((e.textures[n] = new THREE.TextureLoader().load(s[n], d)),
                (e.textures[n].minFilter = THREE.LinearFilter),
                (e.textures[n].magFilter = THREE.LinearFilter))
              : (e.typo[n - 6] = new THREE.TextureLoader().load(s[n], d));
        });
    }),
    (t._static.getInstance = function () {
      return e || (e = new _.GLAssetsLoader(a)), e;
    }),
    t._self
  );
})()),
  (_.GLWheel = (function () {
    var e,
      t = _.ClassFactory.create(_.EventDispatcher),
      a = {};
    return (
      (t.init = function (e) {
        if (e != a) throw new Error("GLWheel is a Singleton Class.");
        else {
          (this.delta = 1),
            (this.position = 0),
            (this.index = 0),
            (this.locked = !1),
            (this.positionLocked = !1),
            (this.dispatchLocked = !1);
          var t = _.Window.getInstance(),
            n = this,
            r = new _.SmoothWheel(
              document.documentElement,
              t.getWindowHeight(),
              1e4,
              function (e) {
                return n.dispatchLocked
                  ? ((n.delta = 0),
                    void (r.scrollPos = r.currentPos = r.scrollTargetPos))
                  : void (n.dispatchEvent(new _.Event("wheel", e.delta)),
                    !n.locked &&
                      ((n.delta = e.delta),
                      !n.positionLocked && (n.position += 0.69 * e.delta),
                      n.dispatchEvent(new _.GLEvent(_.GLEvent.WHEEL_DELTA))));
              },
              {
                type: "fixed",
                direction: "vertical",
              }
            );
          document.documentElement.addEventListener("mouseleave", function (t) {
            null == t.toElement &&
              null == t.relatedTarget &&
              (0 < n.delta ? (n.delta = 1) : (n.delta = -1));
          });
        }
      }),
      (t.setIndex = function (e, t) {
        this.index == e
          ? t &&
            this.dispatchEvent(
              new _.GLEvent(_.GLEvent.LIST_INDEX_CHANGE, {
                force: !0,
              })
            )
          : ((this.index = e),
            this.dispatchEvent(
              new _.GLEvent(
                _.GLEvent.LIST_INDEX_CHANGE,
                t
                  ? {
                      force: !0,
                    }
                  : null
              )
            ));
      }),
      (t._static.getInstance = function () {
        return e || (e = new _.GLWheel(a)), e;
      }),
      t._self
    );
  })()),
  (_.GLRenderer = (function () {
    var e = _.ClassFactory.create(_.EventDispatcher),
      t = _.Window.getInstance();
    return (
      (e.renderer = null),
      (e.quality = 2),
      (e.targetQuality = 2),
      (e.passes = []),
      (e.isSafari = !1),
      (e.init = function (t) {
        e._super.init.apply(this, arguments);
        var a = _.Window.getInstance(),
          n = navigator.userAgent.toLowerCase();
        -1 !== n.indexOf("safari") &&
          -1 === n.indexOf("chrome") &&
          -1 === n.indexOf("edg") &&
          ((this.isSafari = !0), (this.quality = this.targetQuality = 1.5)),
          window.devicePixelRatio < this.quality &&
            (this.quality = this.targetQuality = window.devicePixelRatio),
          -1 !== n.indexOf("windows") &&
            (this.quality = this.targetQuality = 1.5),
          2e3 < a.getWindowWidth() && (this.quality = 1),
          (t.width = a.getWindowWidth() * this.quality),
          (t.height = a.getWindowHeight() * this.quality),
          (t.style.width = a.getWindowWidth() + "px"),
          (t.style.height = a.getWindowHeight() + "px"),
          (this.renderer = new THREE.WebGLRenderer({
            canvas: t,
          })),
          this.renderer.setClearColor(0, 0),
          (this.renderer.antialias = !1);
        var r = this,
          s = _.GLWheel.getInstance(),
          o = function (e, t) {
            var a = 0.27;
            return 0 <= t ? Math.floor(e + 1 - a) : Math.floor(e + a);
          };
        a.addEventListener(_.Event.REQUEST_ANIMATION_FRAME, function () {
          var e = 0.5 * r.renderer.domElement.height,
            t = o(s.position / e, s.delta);
          (s.position += 0.05 * (e * t - s.position)),
            s.setIndex(t),
            r.renderer.clear();
          for (var a = 0, n = r.passes.length; a < n; a++) r.passes[a].render();
        });
        var l = null;
        a.addEventListener(
          _.Event.RESIZE,
          (l = function () {
            var e = a.getWindowWidth(),
              t = a.getWindowHeight();
            (this.quality = 2e3 < e ? 1 : this.targetQuality),
              0.9 < t / e ? (e = t / 0.9) : 540 > t && (t = 540),
              r.renderer.setSize(e * r.quality, t * r.quality),
              (r.renderer.domElement.style.width = (e >> 0) + "px"),
              (r.renderer.domElement.style.height = (t >> 0) + "px"),
              (r.isResizing = !1),
              (s.delta = 1),
              (s.position = 0.5 * (s.index * r.renderer.domElement.height)),
              s.setIndex(s.index, !0);
            var e = a.getWindowWidth(),
              t = a.getWindowHeight(),
              n = r.renderer.domElement.style.width.split("px")[0] >> 0,
              o = r.renderer.domElement.style.height.split("px")[0] >> 0,
              l = r.renderer.domElement.style.left.split("px")[0] >> 0,
              i = r.renderer.domElement.style.top.split("px")[0] >> 0;
            n > e
              ? e - l > n && (r.renderer.domElement.style.left = e - n + "px")
              : (r.renderer.domElement.style.left = "0px"),
              o > t
                ? t - i > o && (r.renderer.domElement.style.top = t - o + "px")
                : (r.renderer.domElement.style.top = "0px");
            var d = document.getElementById("contents");
            if (d) {
              var u = (0.84480234260615 * n) >> 0;
              (d.style.width = (u >> 0) + "px"),
                (d.style.left = r.renderer.domElement.style.left);
            }
            var c = document.getElementById("detail_title");
            if (c) {
              var u = (0.3 * n) >> 0,
                p = (0.1271 * n) >> 0;
              (c.style.width = ((0.890556368960469 * n) >> 0) + "px"),
                (c.style.left = r.renderer.domElement.style.left);
            }
            var m = document.getElementById("detail_navi");
            if (m) {
              var u = n >> 0;
              (m.style.width = (u >> 0) + "px"),
                (m.style.left = r.renderer.domElement.style.left);
            }
            var v = document.getElementById("about");
            v &&
              ((v.style.width = n + "px"),
              (v.style.left = r.renderer.domElement.style.left));
            var C = document.getElementById("about_title");
            if (C) {
              var u = (0.3 * n) >> 0,
                p = (0.1271 * n) >> 0;
              (C.style.width = (u >> 0) + "px"),
                (C.style.marginLeft = p + "px"),
                (C.style.left = r.renderer.domElement.style.left);
            }
            var g = document.getElementById("contact");
            g &&
              ((g.style.width = n + "px"),
              (g.style.left = r.renderer.domElement.style.left));
            var d = document.getElementById("cover");
            if (d) {
              var u = (0.9 * n) >> 0;
              (d.style.width = (u >> 0) + "px"),
                (d.style.left = r.renderer.domElement.style.left);
            }
          })
        ),
          l(),
          s.addEventListener("wheel", function (t) {
            var e,
              n,
              o,
              l,
              i,
              d = t.params,
              u = r.renderer.domElement.style.width.split("px")[0] >> 0,
              c = r.renderer.domElement.style.height.split("px")[0] >> 0,
              p = r.renderer.domElement.style.left.split("px")[0] >> 0,
              m = r.renderer.domElement.style.top.split("px")[0] >> 0,
              v = a.getWindowWidth(),
              C = a.getWindowHeight(),
              g = "works" == r.passes[r.passes.length - 1].currentContent;
            g ||
              ((e =
                document.getElementById("contents") ||
                document.getElementById("about") ||
                document.getElementById("contact")),
              (n = document.getElementById("detail_navi")),
              (o = document.getElementById("about_title")),
              (l = document.getElementById("detail_title")));
            var f = document.getElementById("cover"),
              i = document.getElementById("coverSVG");
            if (0 < d && u + p > v) {
              s.locked = !0;
              var h = p - d;
              h < v - u && (h = v - u),
                (r.renderer.domElement.style.left = h + "px"),
                !g && e && (e.style.left = r.renderer.domElement.style.left),
                !g && n && (n.style.left = r.renderer.domElement.style.left),
                !g && o && (o.style.left = r.renderer.domElement.style.left),
                !g && l && (l.style.left = r.renderer.domElement.style.left),
                i && (i.style.left = r.renderer.domElement.style.left),
                f && (f.style.left = r.renderer.domElement.style.left);
            } else if (0 > d && u > v && 0 > p) {
              s.locked = !0;
              var h = p - d;
              0 < h && (h = 0),
                (r.renderer.domElement.style.left = h + "px"),
                !g && e && (e.style.left = r.renderer.domElement.style.left),
                !g && n && (n.style.left = r.renderer.domElement.style.left),
                !g && o && (o.style.left = r.renderer.domElement.style.left),
                !g && l && (l.style.left = r.renderer.domElement.style.left),
                i && (i.style.left = r.renderer.domElement.style.left),
                f && (f.style.left = r.renderer.domElement.style.left);
            } else if (0 < d && c + m > C) {
              s.locked = !0;
              var h = m - d;
              h < C - c && (h = C - c),
                (r.renderer.domElement.style.top = h + "px");
            } else if (0 > d && c > C && 0 > m) {
              s.locked = !0;
              var h = m - d;
              0 < h && (h = 0), (r.renderer.domElement.style.top = h + "px");
            } else s.locked = !1;
          });
      }),
      (e.addPass = function (e) {
        this.passes.push(e);
      }),
      (e.removePass = function (e) {
        for (
          var t = 0, a = this.passes.length;
          t < length && this.passes[t] != e;
          t++
        );
        t != a && this.passes.splice(t, 1);
      }),
      (e.resetPass = function () {
        this.passes = [];
      }),
      e._self
    );
  })()),
  (_.GLAbstractPass = (function () {
    var e = _.ClassFactory.create(_.EventDispatcher);
    return (
      (this.renderer = null),
      (this.scene = null),
      (this.camera = null),
      (this.inputBuffers = null),
      (this.outputBuffer = null),
      (e.init = function (t, a, n) {
        e._super.init.apply(this, arguments),
          (this.renderer = t),
          (this.inputBuffers = a),
          (this.outputBuffer = n);
        var r = t.renderer.domElement.width * t.quality,
          s = t.renderer.domElement.height * t.quality;
        (this.scene = new THREE.Scene()),
          (this.camera = new THREE.OrthographicCamera(0, r, 0, s, 0.001, 1e4));
      }),
      (e.render = function () {
        this.renderer.renderer.setRenderTarget(this.outputBuffer),
          this.renderer.renderer.render(this.scene, this.camera);
      }),
      (e.resize = function () {
        null != this.outputBuffer &&
          this.outputBuffer.setSize(
            this.renderer.renderer.domElement.width,
            this.renderer.renderer.domElement.height
          );
      }),
      e._self
    );
  })()),
  (_.GLTypoPass = (function () {
    var e = _.ClassFactory.create(_.GLAbstractPass);
    return (
      (e.plane = null),
      (e.locked = !1),
      (e.init = function (t) {
        e._super.init.apply(this, arguments), (win = _.Window.getInstance());
        var a = this.renderer.renderer.domElement.width * t.quality,
          n = this.renderer.renderer.domElement.height * t.quality;
        (this.plane = new THREE.Sprite(
          new THREE.ShaderMaterial({
            uniforms: {
              u_tex0: {
                type: "t",
                value: _.GLAssetsLoader.getInstance().typo[0],
              },
              u_tex1: {
                type: "t",
                value:
                  _.GLAssetsLoader.getInstance().typo[
                    _.GLAssetsLoader.getInstance().typo.length - 2
                  ],
              },
              u_tex2: {
                type: "t",
                value:
                  _.GLAssetsLoader.getInstance().typo[
                    _.GLAssetsLoader.getInstance().typo.length - 1
                  ],
              },
              u_screen: {
                type: "v2",
                value: new THREE.Vector2(
                  this.renderer.renderer.domElement.width,
                  this.renderer.renderer.domElement.height
                ),
              },
              u_position: {
                type: "f",
                value: 0,
              },
              u_max: {
                type: "f",
                value: 3,
              },
            },
            vertexShader:
              "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
            fragmentShader:
              "uniform sampler2D u_tex0;uniform sampler2D u_tex1;uniform sampler2D u_tex2;uniform vec2 u_screen;uniform float u_position;uniform float u_max;varying vec2 vUv;void main() {float base_width = 2732.;float base_height = 1564.;float base_aspect = 1.746803069053708;float aspect = u_screen.x / u_screen.y;float su = 0.377745241581259;float eu = 0.869326500732064;float eu_su = 0.491581259150805;float sv = 0.214833759590793;float ev = 0.785166240409207;float ev_sv = 0.570332480818414;float su_su_1_eu = 0.742980561555075;vec2 uv = vUv;if (aspect / base_aspect > 1.) {float t0 = 1.0 / (ev - sv);uv.y = uv.y * t0 - sv * t0;float t1 = su_su_1_eu / u_screen.x;float su2 = u_screen.x * t1 - u_screen.y * 0.858695652173485 * t1;float t2 = 1.0 / u_screen.x;float eu2 = su2 + u_screen.y * 0.858695652173913 * t2;float t3 = 1.0 / (eu2 - su2);uv.x = uv.x * t3 - su2 * t3;} else {uv.x = uv.x * 2.034251675353687 - 0.768428890543559;float t0 = 0.5 / u_screen.y;sv = u_screen.y * t0 - u_screen.x * 0.326500732064421 * t0;ev = 1.0 - sv;float t1 = 1.0 / (ev - sv);uv.y = uv.y * t1 - sv * t1;}vec4 outColor = vec4(0.);float addpos = mod(u_position, 2.0 * u_max);uv.y -= addpos;outColor = texture2D(u_tex2, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));uv.y += 2.0;outColor += texture2D(u_tex1, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));uv.y += 2.0;outColor += texture2D(u_tex0, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));uv.y += 2.0;outColor += texture2D(u_tex2, uv) * (1.0 - step(step(uv.x, 1.0) * step(0.0, uv.y), 0.0));gl_FragColor = outColor;}",
            transparent: !0,
            alphaTest: 0.01,
          })
        )),
          this.plane.position.set(0.5 * a, 0.5 * n, -0.1),
          this.plane.scale.set(a, -n, 1),
          this.scene.add(this.plane);
        for (
          var r = 0, s = _.GLAssetsLoader.getInstance().typo.length;
          r < s;
          r++
        )
          (_.GLAssetsLoader.getInstance().typo[r].premultiplyAlpha = !1),
            (_.GLAssetsLoader.getInstance().typo[r].needsUpdate = !0);
        var o = this,
          l = 0;
        _.GLWheel.getInstance().addEventListener(
          _.GLEvent.LIST_INDEX_CHANGE,
          function (t) {
            var e = _.GLWheel.getInstance().index,
              a = e % _.GLAssetsLoader.getInstance().works.works.length;
            0 > a && (a += _.GLAssetsLoader.getInstance().works.works.length),
              (a = _.GLAssetsLoader.getInstance().works.works.length - a - 1);
            var n = function (e) {
                return (
                  0 > e &&
                    (e += _.GLAssetsLoader.getInstance().works.works.length),
                  e < _.GLAssetsLoader.getInstance().works.works.length
                    ? e
                    : e - _.GLAssetsLoader.getInstance().works.works.length
                );
              },
              r = e % 3;
            0 > r && (r += 3),
              t.params && t.params.force
                ? 0 === r
                  ? ((o.plane.material.uniforms.u_tex0.value =
                      _.GLAssetsLoader.getInstance().typo[n(a + 1)]),
                    (o.plane.material.uniforms.u_tex1.value =
                      _.GLAssetsLoader.getInstance().typo[n(a - 1)]),
                    (o.plane.material.uniforms.u_tex2.value =
                      _.GLAssetsLoader.getInstance().typo[n(a)]))
                  : 1 === r
                  ? ((o.plane.material.uniforms.u_tex0.value =
                      _.GLAssetsLoader.getInstance().typo[n(a - 1)]),
                    (o.plane.material.uniforms.u_tex1.value =
                      _.GLAssetsLoader.getInstance().typo[n(a)]),
                    (o.plane.material.uniforms.u_tex2.value =
                      _.GLAssetsLoader.getInstance().typo[n(a + 1)]))
                  : 2 === r
                  ? ((o.plane.material.uniforms.u_tex0.value =
                      _.GLAssetsLoader.getInstance().typo[n(a)]),
                    (o.plane.material.uniforms.u_tex1.value =
                      _.GLAssetsLoader.getInstance().typo[n(a + 1)]),
                    (o.plane.material.uniforms.u_tex2.value =
                      _.GLAssetsLoader.getInstance().typo[n(a - 1)]))
                  : void 0
                : 0 < e - l
                ? 0 === r
                  ? (o.plane.material.uniforms.u_tex1.value =
                      _.GLAssetsLoader.getInstance().typo[n(a - 1)])
                  : 1 === r
                  ? (o.plane.material.uniforms.u_tex0.value =
                      _.GLAssetsLoader.getInstance().typo[n(a - 1)])
                  : 2 === r
                  ? (o.plane.material.uniforms.u_tex2.value =
                      _.GLAssetsLoader.getInstance().typo[n(a - 1)])
                  : void 0
                : 0 === r
                ? (o.plane.material.uniforms.u_tex0.value =
                    _.GLAssetsLoader.getInstance().typo[n(a + 1)])
                : 1 === r
                ? (o.plane.material.uniforms.u_tex2.value =
                    _.GLAssetsLoader.getInstance().typo[n(a + 1)])
                : 2 === r
                ? (o.plane.material.uniforms.u_tex1.value =
                    _.GLAssetsLoader.getInstance().typo[n(a + 1)])
                : void 0,
              (l = e);
          }
        );
      }),
      (e.render = function () {
        this.locked ||
          (this.plane.material.uniforms.u_position.value =
            2 *
            (_.GLWheel.getInstance().position /
              (0.5 * this.renderer.renderer.domElement.height))),
          e._super.render.apply(this, arguments);
      }),
      (e.resize = function () {
        e._super.resize.apply(this, arguments);
        var t = this.renderer.renderer.domElement.width * this.renderer.quality,
          a = this.renderer.renderer.domElement.height * this.renderer.quality;
        (this.camera = new THREE.OrthographicCamera(0, t, 0, a, 0.001, 1e4)),
          this.camera.updateProjectionMatrix(),
          this.plane.position.set(0.5 * t, 0.5 * a, -0.1),
          this.plane.scale.set(t, -a, 1),
          (this.plane.material.uniforms.u_screen.value.x =
            this.renderer.renderer.domElement.width),
          (this.plane.material.uniforms.u_screen.value.y =
            this.renderer.renderer.domElement.height);
      }),
      e._self
    );
  })()),
  (_.GLCompositePass = (function () {
    var e = _.ClassFactory.create(_.GLAbstractPass);
    (e.plane = null),
      (e.mouse = {
        x: -100,
        y: 0,
      }),
      (e.hit = []),
      (e.currentContent = "works"),
      (e.isPageMoving = !1),
      (e.locked = !1);
    var t = 0.8,
      a = 1;
    (e.titlePos = []),
      (e.titleMaps = []),
      (e.titleAnimes = []),
      (e.titleTweens = []),
      (e.btn_over_flg = !1),
      e.scrollDomContent,
      (e.officeTexture = null),
      (e.coverDom = null),
      (e.domListeners = []),
      (e.clickEnabled = !0);
    var n = !1,
      r = 268;
    return (
      (e.init = function (s, o) {
        e._super.init.apply(this, arguments);
        var l = _.Window.getInstance(),
          d = this.renderer.renderer.domElement.width * s.quality,
          u = this.renderer.renderer.domElement.height * s.quality;
        n = -1 !== navigator.userAgent.toLowerCase().indexOf("windows");
        for (var c = 0; c < r; c++) this.titlePos.push(0);
        for (var c = 0; c < r; c++) this.titleMaps.push(0);
        for (var c = 0; c < r / 4; c++) this.titleAnimes.push(0);
        (this.plane = new THREE.Sprite(
          new THREE.ShaderMaterial({
            uniforms: {
              device_ratio: {
                type: "f",
                value: s.quality,
              },
              map: {
                type: "t",
                value: o[0],
              },
              u_bg: {
                type: "t",
                value: o[1],
              },
              u_noise: {
                type: "t",
                value: o[2],
              },
              u_cloth: {
                type: "t",
                value: o[3],
              },
              u_menu: {
                type: "t",
                value: _.GLAssetsLoader.getInstance().textures[3],
              },
              u_scroll: {
                type: "t",
                value: _.GLAssetsLoader.getInstance().textures[5],
              },
              u_scroll_alpha: {
                type: "f",
                value: 0,
              },
              u_pow: {
                type: "f",
                value: 0,
              },
              u_time: {
                type: "f",
                value: 0,
              },
              u_screen: {
                type: "v2",
                value: new THREE.Vector2(
                  this.renderer.renderer.domElement.width,
                  this.renderer.renderer.domElement.height
                ),
              },
              u_glitch: {
                type: "f",
                value: 0,
              },
              u_logo_alpha: {
                type: "f",
                value: a,
              },
              u_works_alpha: {
                type: "f",
                value: t,
              },
              u_about_alpha: {
                type: "f",
                value: t,
              },
              u_contact_alpha: {
                type: "f",
                value: t,
              },
              u_flow: {
                type: "f",
                value: 0,
              },
              u_cloth_visible: {
                type: "f",
                value: 1,
              },
              u_cloth_dist: {
                type: "f",
                value: 0,
              },
              u_cloth_dist_x: {
                type: "f",
                value: 1,
              },
              u_cloth_dist_pow: {
                type: "f",
                value: 8,
              },
              u_cloth_dist_size: {
                type: "f",
                value: 1,
              },
            },
            vertexShader:
              "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
            fragmentShader:
              "uniform float device_ratio;uniform sampler2D map;uniform sampler2D u_bg;uniform sampler2D u_noise;uniform sampler2D u_cloth;uniform sampler2D u_menu;uniform sampler2D u_scroll;uniform float u_scroll_alpha;uniform float u_pow;uniform float u_time;uniform vec2 u_screen;uniform float u_glitch;uniform float u_logo_alpha;uniform float u_works_alpha;uniform float u_about_alpha;uniform float u_contact_alpha;uniform float u_flow;uniform float u_cloth_visible;uniform float u_cloth_dist;uniform float u_cloth_dist_x;uniform float u_cloth_dist_pow;uniform float u_cloth_dist_size;varying vec2 vUv;float random (in vec2 _st) {return fract(sin(dot(_st.xy,vec2(12.9898,78.233)))*43758.5453123);}vec2 brownConradyDistortion(vec2 uv, float dist){uv = uv * 2.0 - 1.0;float barrelDistortion1 = 0.1 * dist * 1.1;float barrelDistortion2 = -0.025 * dist * 0.95;float r2 = dot(uv,uv);uv *= 1.0 + barrelDistortion1 * r2 + barrelDistortion2 * r2 * r2;return uv * 0.5 + 0.5;}float remap( float t, float a, float b ){return (t-a)/(b-a);}vec2 remap( vec2 t, vec2 a, vec2 b ){return vec2( remap( t.x, a.x, b.x ), remap( t.y, a.y, b.y ) );}void main() {vec4 outcol = vec4(0.0);vec2 uv = vec2(vUv.x, 1.-vUv.y);float distpow = u_pow * 5.5;distpow = min(distpow, 8.0);float addu = min(distpow * 0.01, 0.2);float addv = min(distpow * 0.015, 0.2);uv = brownConradyDistortion( uv, distpow );vec2 minuv = brownConradyDistortion( vec2(0. - addu,0. - addv), distpow );vec2 maxuv = brownConradyDistortion( vec2(1. + addu,1. + addv), distpow );uv = remap( uv, minuv, maxuv );vec2 outuv = vec2(0.,1.)+vec2(1.,-1.)*uv;float flow_alpha = 1.0;float uu_flow = u_flow + 0.18;vec4 noise = vec4(0.0);float flow;if (u_flow > 0.0) {noise = texture2D( u_noise, vUv );flow = max(uu_flow + noise.r * 0.1 - vUv.y, 0.0);outuv -= vec2(noise.r * flow - flow * 0.25, noise.g * flow - flow * 0.0125 + pow(u_flow, 2.0) * 0.1);flow_alpha = max((1.0 - u_flow) - flow, 0.0);}vec4 bgcol = texture2D( u_bg, outuv ).rgba;outcol += bgcol * flow_alpha;if (u_glitch > 0.0 && u_pow < 0.05) {vec2 typouv = outuv;float r = random(vec2(typouv.y) * u_time);typouv.x += (r - 0.5) * u_glitch;outcol += texture2D( map, typouv ).rgba * vec4(clamp(pow(r, 0.05), 0.0, 0.98));} else {vec4 typocol = texture2D( map, outuv ).rgba;outcol += typocol * flow_alpha;}float menu_su = u_screen.x - 85.5 * device_ratio;float menu_eu = u_screen.x - 50.5 * device_ratio;float menu_sv = u_screen.y - 45.0 * device_ratio;float menu_ev = u_screen.y - 340.0 * device_ratio;if (gl_FragCoord.x > menu_su && gl_FragCoord.x < menu_eu && gl_FragCoord.y < menu_sv && gl_FragCoord.y > menu_ev) {float mt0 = 1.0 / (35.0 * device_ratio);float mt1 = 1.0 / (295.0 * device_ratio);vec2 menu_uv = vec2(gl_FragCoord.x * mt0 - menu_su * mt0, gl_FragCoord.y * mt1 - menu_ev * mt1);vec4 menu_col = texture2D( u_menu, menu_uv ).rgba;if (gl_FragCoord.y > u_screen.y - 91.0 * device_ratio) {menu_col *= u_logo_alpha;} else if (gl_FragCoord.y < u_screen.y - 119.5 * device_ratio && gl_FragCoord.y > u_screen.y - 173.0 * device_ratio) {menu_col *= u_works_alpha;} else if (gl_FragCoord.y < u_screen.y - 197.5 * device_ratio && gl_FragCoord.y > u_screen.y - 246.0 * device_ratio) {menu_col *= u_about_alpha;} else if (gl_FragCoord.y < u_screen.y - 271.5 * device_ratio && gl_FragCoord.y > u_screen.y - 336.0 * device_ratio) {menu_col *= u_contact_alpha;}outcol += menu_col * clamp(menu_col.a * 3.0, 0.0, 1.0);}if (u_cloth_visible > 0.0) {vec4 clothColor = vec4(0.,0.,0.,1.0);noise = texture2D( u_noise, vUv );vec2 m = vec2(0.5, -0.5);vec2 p = vec2(vUv.x, vUv.y - 1.0);float t = min(max(1.0 - length(m - p), 0.0) * u_cloth_dist * 1.0, 1.0);if (pow(noise.r * t, 0.3) + t > 0.2) {vec2 center = vec2(u_cloth_dist_x, 0.5);float dx = center.x - vUv.x;float dy = center.y - vUv.y;float d = sqrt(dx * dx + dy * dy);float dd = 1.4 / (d * 0.1);dd = smoothstep(0.01, 125.0, dd) * u_cloth_dist_pow;float f = d * 0.8;vec2 uv = vUv + vec2(dx * dd * f, dy * dd * f) * u_cloth_dist_size;clothColor = texture2D(u_cloth, uv);}outcol *= 1.0 - clothColor.a;outcol += clothColor;}menu_sv = 142.0 * device_ratio;menu_ev = 0.0;if (gl_FragCoord.x > menu_su && gl_FragCoord.x < menu_eu && gl_FragCoord.y < menu_sv && gl_FragCoord.y > menu_ev) {float st0 = 1.0 / (35.0 * device_ratio);float st1 = 1.0 / menu_sv;vec2 scroll_uv = vec2(gl_FragCoord.x * st0 - menu_su * st0, gl_FragCoord.y * st1 - menu_ev * st1);vec4 scroll_col = texture2D( u_scroll, scroll_uv ).rgba * u_scroll_alpha;outcol = abs(outcol - scroll_col);float line_su = 0.557142857142857;float line_eu = 0.585714285714286;float line_sv = 0.0;float line_ev = 0.68;if (scroll_uv.x > line_su && scroll_uv.x < line_eu && scroll_uv.y > line_sv && scroll_uv.y < line_ev) {vec4 scroll_line_col;float ras = mod(u_time * 0.4, 3.769911184307752);if (1.0 - abs(sin(ras)) < scroll_uv.y || ras > 1.570796326794897) {scroll_line_col = vec4(1.0) * u_scroll_alpha;} else {scroll_line_col = vec4(0.35) * u_scroll_alpha;}outcol = vec4(vec3(abs(outcol - scroll_line_col)), 1.0);}}gl_FragColor = outcol;}",
            transparent: !0,
            alphaTest: 0.01,
          })
        )),
          this.plane.position.set(0.5 * d, 0.5 * u, -0.1),
          this.plane.scale.set(d, -u, 1),
          this.scene.add(this.plane),
          (this.plane.material.uniforms.map.value.premultiplyAlpha = !1),
          (this.plane.material.uniforms.map.value.needsUpdate = !0),
          (this.plane.material.uniforms.u_menu.value.premultiplyAlpha = !1),
          (this.plane.material.uniforms.u_menu.value.needsUpdate = !0),
          (this.plane.material.uniforms.u_scroll.value.premultiplyAlpha = !0),
          (this.plane.material.uniforms.u_scroll.value.needsUpdate = !0),
          (this.planeMain = new THREE.Sprite(
            new THREE.ShaderMaterial({
              uniforms: {
                device_ratio: {
                  type: "f",
                  value: s.quality,
                },
                map: {
                  type: "t",
                  value: o[0],
                },
                u_bg: {
                  type: "t",
                  value: o[1],
                },
                u_noise: {
                  type: "t",
                  value: o[2],
                },
                u_menu: {
                  type: "t",
                  value: _.GLAssetsLoader.getInstance().textures[3],
                },
                u_scroll: {
                  type: "t",
                  value: _.GLAssetsLoader.getInstance().textures[5],
                },
                u_scroll_alpha: {
                  type: "f",
                  value: 1,
                },
                u_pow: {
                  type: "f",
                  value: 0,
                },
                u_time: {
                  type: "f",
                  value: 0,
                },
                u_screen: {
                  type: "v2",
                  value: new THREE.Vector2(
                    this.renderer.renderer.domElement.width,
                    this.renderer.renderer.domElement.height
                  ),
                },
                u_glitch: {
                  type: "f",
                  value: 0,
                },
                u_logo_alpha: {
                  type: "f",
                  value: a,
                },
                u_works_alpha: {
                  type: "f",
                  value: t,
                },
                u_about_alpha: {
                  type: "f",
                  value: t,
                },
                u_contact_alpha: {
                  type: "f",
                  value: t,
                },
                u_flow: {
                  type: "f",
                  value: 0,
                },
              },
              vertexShader:
                "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
              fragmentShader:
                "uniform float device_ratio;uniform sampler2D map;uniform sampler2D u_bg;uniform sampler2D u_noise;uniform sampler2D u_menu;uniform sampler2D u_scroll;uniform float u_scroll_alpha;uniform float u_pow;uniform float u_time;uniform vec2 u_screen;uniform float u_glitch;uniform float u_logo_alpha;uniform float u_works_alpha;uniform float u_about_alpha;uniform float u_contact_alpha;uniform float u_flow;varying vec2 vUv;float random (in vec2 _st) {return fract(sin(dot(_st.xy,vec2(12.9898,78.233)))*43758.5453123);}vec2 brownConradyDistortion(vec2 uv, float dist){uv = uv * 2.0 - 1.0;float barrelDistortion1 = 0.1 * dist * 1.1;float barrelDistortion2 = -0.025 * dist * 0.95;float r2 = dot(uv,uv);uv *= 1.0 + barrelDistortion1 * r2 + barrelDistortion2 * r2 * r2;return uv * 0.5 + 0.5;}float remap( float t, float a, float b ){return (t-a)/(b-a);}vec2 remap( vec2 t, vec2 a, vec2 b ){return vec2( remap( t.x, a.x, b.x ), remap( t.y, a.y, b.y ) );}void main() {vec4 outcol = vec4(0.0);vec2 uv = vec2(vUv.x, 1.-vUv.y);float distpow = u_pow * 5.5;distpow = min(distpow, 8.0);float addu = min(distpow * 0.01, 0.2);float addv = min(distpow * 0.015, 0.2);uv = brownConradyDistortion( uv, distpow );vec2 minuv = brownConradyDistortion( vec2(0. - addu,0. - addv), distpow );vec2 maxuv = brownConradyDistortion( vec2(1. + addu,1. + addv), distpow );uv = remap( uv, minuv, maxuv );vec2 outuv = vec2(0.,1.)+vec2(1.,-1.)*uv;float flow_alpha = 1.0;float uu_flow = u_flow + 0.18;vec4 noise = vec4(0.0);float flow;if (u_flow > 0.0) {noise = texture2D( u_noise, vUv );flow = max(uu_flow + noise.r * 0.1 - vUv.y, 0.0);outuv -= vec2(noise.r * flow - flow * 0.25, noise.g * flow - flow * 0.0125 + pow(u_flow, 2.0) * 0.1);flow_alpha = max((1.0 - u_flow) - flow, 0.0);}vec4 bgcol = texture2D( u_bg, outuv ).rgba;outcol += bgcol * flow_alpha;if (u_glitch > 0.0 && u_pow < 0.05) {vec2 typouv = outuv;float r = random(vec2(typouv.y) * u_time);typouv.x += (r - 0.5) * u_glitch;outcol += texture2D( map, typouv ).rgba * vec4(clamp(pow(r, 0.05), 0.0, 0.98));} else {vec4 typocol = texture2D( map, outuv ).rgba;outcol += typocol * flow_alpha;}float menu_su = u_screen.x - 85.5 * device_ratio;float menu_eu = u_screen.x - 50.5 * device_ratio;float menu_sv = u_screen.y - 45.0 * device_ratio;float menu_ev = u_screen.y - 340.0 * device_ratio;if (gl_FragCoord.x > menu_su && gl_FragCoord.x < menu_eu && gl_FragCoord.y < menu_sv && gl_FragCoord.y > menu_ev) {float mt0 = 1.0 / (35.0 * device_ratio);float mt1 = 1.0 / (295.0 * device_ratio);vec2 menu_uv = vec2(gl_FragCoord.x * mt0 - menu_su * mt0, gl_FragCoord.y * mt1 - menu_ev * mt1);vec4 menu_col = texture2D( u_menu, menu_uv ).rgba;if (gl_FragCoord.y > u_screen.y - 91.0 * device_ratio) {menu_col *= u_logo_alpha;} else if (gl_FragCoord.y < u_screen.y - 119.5 * device_ratio && gl_FragCoord.y > u_screen.y - 173.0 * device_ratio) {menu_col *= u_works_alpha;} else if (gl_FragCoord.y < u_screen.y - 197.5 * device_ratio && gl_FragCoord.y > u_screen.y - 246.0 * device_ratio) {menu_col *= u_about_alpha;} else if (gl_FragCoord.y < u_screen.y - 271.5 * device_ratio && gl_FragCoord.y > u_screen.y - 336.0 * device_ratio) {menu_col *= u_contact_alpha;}outcol += menu_col * clamp(menu_col.a * 3.0, 0.0, 1.0);}menu_sv = 142.0 * device_ratio;menu_ev = 0.0;if (gl_FragCoord.x > menu_su && gl_FragCoord.x < menu_eu && gl_FragCoord.y < menu_sv && gl_FragCoord.y > menu_ev) {float st0 = 1.0 / (35.0 * device_ratio);float st1 = 1.0 / menu_sv;vec2 scroll_uv = vec2(gl_FragCoord.x * st0 - menu_su * st0, gl_FragCoord.y * st1 - menu_ev * st1);vec4 scroll_col = texture2D( u_scroll, scroll_uv ).rgba * u_scroll_alpha;outcol = abs(outcol - scroll_col);float line_su = 0.557142857142857;float line_eu = 0.585714285714286;float line_sv = 0.0;float line_ev = 0.68;if (scroll_uv.x > line_su && scroll_uv.x < line_eu && scroll_uv.y > line_sv && scroll_uv.y < line_ev) {vec4 scroll_line_col;float ras = mod(u_time * 0.4, 3.769911184307752);if (1.0 - abs(sin(ras)) < scroll_uv.y || ras > 1.570796326794897) {scroll_line_col = vec4(1.0) * u_scroll_alpha;} else {scroll_line_col = vec4(0.35) * u_scroll_alpha;}outcol = vec4(vec3(abs(outcol - scroll_line_col)), 1.0);}}gl_FragColor = outcol;}",
              transparent: !0,
              alphaTest: 0.01,
            })
          )),
          this.planeMain.position.set(0.5 * d, 0.5 * u, -0.1),
          this.planeMain.scale.set(d, -u, 1);
        var p =
          n || this.renderer.isSafari
            ? []
            : [
                "float title_su = 0.67606149341142;",
                "float title_eu = 0.891288433382138;",
                "float title_h = (u_screen.x * 588.0 / 2732.0) * 1439.0 / 588.0;",
                "float title_sv = u_screen.y - 99.0;",
                "float title_ev = title_sv - title_h;",
                "if (vUv.x > title_su && vUv.x < title_eu && gl_FragCoord.y < title_sv && gl_FragCoord.y > title_ev) {",
                "vec2 title_uv = vec2((vUv.x - title_su) / (title_eu - title_su), (gl_FragCoord.y - title_ev - 99.0) / (title_h - 99.0));",
                "for (int i = 0; i < " + r + "; i += 4) {",
                "float anim_time = u_detail_title_animes[i / 4] * 0.1;",
                "title_uv.y += anim_time;",
                "if (title_uv.x > u_detail_title_pos[i] && title_uv.x < u_detail_title_pos[i + 2] && title_uv.y > u_detail_title_pos[i + 1] && title_uv.y < u_detail_title_pos[i + 3]) {",
                "vec2 char_uv = vec2((title_uv.x - u_detail_title_pos[i]) / (u_detail_title_pos[i + 2] - u_detail_title_pos[i]), (title_uv.y - u_detail_title_pos[i + 1]) / (u_detail_title_pos[i + 3] - u_detail_title_pos[i + 1]));",
                "vec2 font_uv = vec2(char_uv.x * (u_detail_title_map[i + 2] - u_detail_title_map[i]) + u_detail_title_map[i], char_uv.y * (u_detail_title_map[i + 3] - u_detail_title_map[i + 1]) + u_detail_title_map[i + 1]);",
                "vec4 title_col = texture2D( u_detail_title_font, font_uv).rgba;",
                "if (title_col.a > 0.45) {",
                "title_col *= pow(1.0 - anim_time, 100.0);",
                "outcol.r = (outcol.r + title_col.r) - (outcol.r * title_col.r);",
                "outcol.g = (outcol.g + title_col.g) - (outcol.g * title_col.g);",
                "outcol.b = (outcol.b + title_col.b) - (outcol.b * title_col.b);",
                "outcol.a = (outcol.a + title_col.a) - (outcol.a * title_col.a);",
                "}",
                "}",
                "}",
                "}",
              ];
        (this.planeDetail = new THREE.Sprite(
          new THREE.ShaderMaterial({
            uniforms: {
              device_ratio: {
                type: "f",
                value: s.quality,
              },
              u_menu: {
                type: "t",
                value: _.GLAssetsLoader.getInstance().textures[3],
              },
              u_screen: {
                type: "v2",
                value: new THREE.Vector2(
                  this.renderer.renderer.domElement.width,
                  this.renderer.renderer.domElement.height
                ),
              },
              u_logo_alpha: {
                type: "f",
                value: a,
              },
              u_works_alpha: {
                type: "f",
                value: t,
              },
              u_about_alpha: {
                type: "f",
                value: t,
              },
              u_contact_alpha: {
                type: "f",
                value: t,
              },
              u_detailimage: {
                type: "t",
                value: o[4],
              },
              u_detailimage_flow: {
                type: "f",
                value: 1,
              },
              u_detail_title_pos: {
                type: "fv1",
                value: this.titlePos,
              },
              u_detail_title_font: {
                type: "t",
                value: _.GLAssetsLoader.getInstance().textures[4],
              },
              u_detail_title_map: {
                type: "fv1",
                value: this.titleMaps,
              },
              u_detail_title_animes: {
                type: "fv1",
                value: this.titleAnimes,
              },
              u_detail_scroll: {
                type: "f",
                value: 0,
              },
            },
            vertexShader:
              "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
            fragmentShader: [
              "uniform float device_ratio;",
              "uniform sampler2D u_menu;",
              "uniform vec2 u_screen;",
              "uniform float u_logo_alpha;",
              "uniform float u_works_alpha;",
              "uniform float u_about_alpha;",
              "uniform float u_contact_alpha;",
              "uniform sampler2D u_detailimage;",
              "uniform float u_detailimage_visible;",
              "uniform float u_detailimage_flow;",
              "uniform float u_detail_title_pos[" + r + "];",
              "uniform sampler2D u_detail_title_font;",
              "uniform float u_detail_title_map[" + r + "];",
              "uniform float u_detail_title_animes[" + r / 4 + "];",
              "uniform float u_detail_scroll;",
              "varying vec2 vUv;",
              "void main() {",
              "vec4 outcol = vec4(0.0);",
              "float dscroll = device_ratio * 2.0 * (u_screen.y / u_screen.x) * u_detail_scroll / u_screen.y;",
              "float detailW = u_screen.x / 1.18370883882149;",
              "float detailH = detailW * 9.0 / 16.0;",
              "float t0 = u_screen.y / detailH;",
              "float dist = pow(1.0 - abs(vUv.y - (1.0 - u_detailimage_flow)), 40.0);",
              "vec2 detailUV = vec2(vUv.x * 1.18370883882149, vUv.y * t0 + 1.0 - t0 + dscroll + dist * 0.1 * u_detailimage_flow);",
              "float xgt = step(detailUV.x, 1.0);",
              "float ylt = step(0.0, detailUV.y);",
              "float r = 1.0 - step(xgt * ylt, 0.0);",
              "vec4 detail = texture2D( u_detailimage, detailUV ).rgba * r;",
              "if (1.0 - u_detailimage_flow < vUv.y) {",
              "detail *= (dist + 0.4) * (1.0 - u_detailimage_flow);",
              "}",
              "outcol += detail;",
              p.join(""),
              "float menu_su = u_screen.x - 85.5 * device_ratio;",
              "float menu_eu = u_screen.x - 50.5 * device_ratio;",
              "float menu_sv = u_screen.y - 45.0 * device_ratio;",
              "float menu_ev = u_screen.y - 340.0 * device_ratio;",
              "if (gl_FragCoord.x > menu_su && gl_FragCoord.x < menu_eu && gl_FragCoord.y < menu_sv && gl_FragCoord.y > menu_ev) {",
              "float mt0 = 1.0 / (35.0 * device_ratio);",
              "float mt1 = 1.0 / (295.0 * device_ratio);",
              "vec2 menu_uv = vec2(gl_FragCoord.x * mt0 - menu_su * mt0, gl_FragCoord.y * mt1 - menu_ev * mt1);",
              "vec4 menu_col = texture2D( u_menu, menu_uv ).rgba;",
              "if (gl_FragCoord.y > u_screen.y - 91.0 * device_ratio) {",
              "menu_col *= u_logo_alpha;",
              "} else if (gl_FragCoord.y < u_screen.y - 119.5 * device_ratio && gl_FragCoord.y > u_screen.y - 173.0 * device_ratio) {",
              "menu_col *= u_works_alpha;",
              "} else if (gl_FragCoord.y < u_screen.y - 197.5 * device_ratio && gl_FragCoord.y > u_screen.y - 246.0 * device_ratio) {",
              "menu_col *= u_about_alpha;",
              "} else if (gl_FragCoord.y < u_screen.y - 271.5 * device_ratio && gl_FragCoord.y > u_screen.y - 336.0 * device_ratio) {",
              "menu_col *= u_contact_alpha;",
              "}",
              "outcol += menu_col * clamp(menu_col.a * 3.0, 0.0, 1.0);",
              "}",
              "gl_FragColor = outcol;",
              "}",
            ].join(""),
            transparent: !0,
            alphaTest: 0.01,
          })
        )),
          this.planeDetail.position.set(0.5 * d, 0.5 * u, -0.1),
          this.planeDetail.scale.set(d, -u, 1),
          (this.planeDetail.material.uniforms.u_detail_title_font.value.premultiplyAlpha =
            !0),
          (this.planeDetail.material.uniforms.u_detail_title_font.value.needsUpdate =
            !0),
          (this.planeAbout = new THREE.Sprite(
            new THREE.ShaderMaterial({
              uniforms: {
                device_ratio: {
                  type: "f",
                  value: s.quality,
                },
                u_menu: {
                  type: "t",
                  value: _.GLAssetsLoader.getInstance().textures[3],
                },
                u_screen: {
                  type: "v2",
                  value: new THREE.Vector2(
                    this.renderer.renderer.domElement.width,
                    this.renderer.renderer.domElement.height
                  ),
                },
                u_logo_alpha: {
                  type: "f",
                  value: a,
                },
                u_works_alpha: {
                  type: "f",
                  value: t,
                },
                u_about_alpha: {
                  type: "f",
                  value: t,
                },
                u_contact_alpha: {
                  type: "f",
                  value: t,
                },
                u_about_officeimage: {
                  type: "t",
                  value: null,
                },
                u_about_y: {
                  type: "f",
                  value: 0,
                },
                u_about_delta: {
                  type: "f",
                  value: 0,
                },
                u_about_cover: {
                  type: "f",
                  value: 0,
                },
              },
              vertexShader:
                "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
              fragmentShader:
                "uniform float device_ratio;uniform sampler2D u_menu;uniform vec2 u_screen;uniform float u_logo_alpha;uniform float u_works_alpha;uniform float u_about_alpha;uniform float u_contact_alpha;uniform sampler2D u_about_officeimage;uniform float u_about_y;uniform float u_about_delta;uniform float u_about_cover;varying vec2 vUv;void main() {vec4 outcol = vec4(0.0);vec2 officeUV = vec2(vUv.x, vUv.y * u_screen.y / (u_screen.x * 1063.0 / 2732.0) + u_about_y * device_ratio);officeUV = ((officeUV - vec2(0.5)) / (u_about_y * 0.5 + 1.0)) + vec2(0.0, u_about_delta * pow(abs(vUv.x - 0.5), 2.0)) + vec2(0.5);vec4 office_col = texture2D( u_about_officeimage, officeUV).rgba;if (officeUV.y > 0.0 && officeUV.y < 1.0) {outcol += office_col;}outcol *= step(u_about_cover, vUv.y);float menu_su = u_screen.x - 85.5 * device_ratio;float menu_eu = u_screen.x - 50.5 * device_ratio;float menu_sv = u_screen.y - 45.0 * device_ratio;float menu_ev = u_screen.y - 340.0 * device_ratio;if (gl_FragCoord.x > menu_su && gl_FragCoord.x < menu_eu && gl_FragCoord.y < menu_sv && gl_FragCoord.y > menu_ev) {float mt0 = 1.0 / (35.0 * device_ratio);float mt1 = 1.0 / (295.0 * device_ratio);vec2 menu_uv = vec2(gl_FragCoord.x * mt0 - menu_su * mt0, gl_FragCoord.y * mt1 - menu_ev * mt1);vec4 menu_col = texture2D( u_menu, menu_uv ).rgba;if (gl_FragCoord.y > u_screen.y - 91.0 * device_ratio) {menu_col *= u_logo_alpha;} else if (gl_FragCoord.y < u_screen.y - 119.5 * device_ratio && gl_FragCoord.y > u_screen.y - 173.0 * device_ratio) {menu_col *= u_works_alpha;} else if (gl_FragCoord.y < u_screen.y - 197.5 * device_ratio && gl_FragCoord.y > u_screen.y - 246.0 * device_ratio) {menu_col *= u_about_alpha;} else if (gl_FragCoord.y < u_screen.y - 271.5 * device_ratio && gl_FragCoord.y > u_screen.y - 336.0 * device_ratio) {menu_col *= u_contact_alpha;}outcol += menu_col * clamp(menu_col.a * 3.0, 0.0, 1.0);}gl_FragColor = outcol;}",
              transparent: !0,
              alphaTest: 0.01,
            })
          )),
          this.planeAbout.position.set(0.5 * d, 0.5 * u, -0.1),
          this.planeAbout.scale.set(d, -u, 1),
          (this.planeContact = new THREE.Sprite(
            new THREE.ShaderMaterial({
              uniforms: {
                device_ratio: {
                  type: "f",
                  value: s.quality,
                },
                u_menu: {
                  type: "t",
                  value: _.GLAssetsLoader.getInstance().textures[3],
                },
                u_screen: {
                  type: "v2",
                  value: new THREE.Vector2(
                    this.renderer.renderer.domElement.width,
                    this.renderer.renderer.domElement.height
                  ),
                },
                u_logo_alpha: {
                  type: "f",
                  value: a,
                },
                u_works_alpha: {
                  type: "f",
                  value: t,
                },
                u_about_alpha: {
                  type: "f",
                  value: t,
                },
                u_contact_alpha: {
                  type: "f",
                  value: t,
                },
                u_contact_bg: {
                  type: "f",
                  value: 0,
                },
              },
              vertexShader:
                "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
              fragmentShader:
                "uniform float device_ratio;uniform sampler2D u_menu;uniform vec2 u_screen;uniform float u_logo_alpha;uniform float u_works_alpha;uniform float u_about_alpha;uniform float u_contact_alpha;uniform float u_contact_bg;varying vec2 vUv;void main() {vec4 outcol = vec4(0.0);if (vUv.x < 0.49 && vUv.y < u_contact_bg) {outcol += 1.0;}float menu_su = u_screen.x - 85.5 * device_ratio;float menu_eu = u_screen.x - 50.5 * device_ratio;float menu_sv = u_screen.y - 45.0 * device_ratio;float menu_ev = u_screen.y - 340.0 * device_ratio;if (gl_FragCoord.x > menu_su && gl_FragCoord.x < menu_eu && gl_FragCoord.y < menu_sv && gl_FragCoord.y > menu_ev) {float mt0 = 1.0 / (35.0 * device_ratio);float mt1 = 1.0 / (295.0 * device_ratio);vec2 menu_uv = vec2(gl_FragCoord.x * mt0 - menu_su * mt0, gl_FragCoord.y * mt1 - menu_ev * mt1);vec4 menu_col = texture2D( u_menu, menu_uv ).rgba;if (gl_FragCoord.y > u_screen.y - 91.0 * device_ratio) {menu_col *= u_logo_alpha;} else if (gl_FragCoord.y < u_screen.y - 119.5 * device_ratio && gl_FragCoord.y > u_screen.y - 173.0 * device_ratio) {menu_col *= u_works_alpha;} else if (gl_FragCoord.y < u_screen.y - 197.5 * device_ratio && gl_FragCoord.y > u_screen.y - 246.0 * device_ratio) {menu_col *= u_about_alpha;} else if (gl_FragCoord.y < u_screen.y - 271.5 * device_ratio && gl_FragCoord.y > u_screen.y - 336.0 * device_ratio) {menu_col *= u_contact_alpha;}outcol += menu_col * clamp(menu_col.a * 3.0, 0.0, 1.0);}gl_FragColor = outcol;}",
              transparent: !0,
              alphaTest: 0.01,
            })
          )),
          this.planeContact.position.set(0.5 * d, 0.5 * u, -0.1),
          this.planeContact.scale.set(d, -u, 1);
        var m =
          this.renderer.renderer.domElement.style.width.split("px")[0] >> 0;
        (this.coverDom = document.createElement("div")),
          (this.coverDom.id = "cover"),
          (this.coverDom.className = "cover"),
          (this.coverDom.style.width = ((0.9 * m) >> 0) + "px"),
          (this.coverDom.style.left =
            this.renderer.renderer.domElement.style.left),
          document.body.appendChild(this.coverDom);
      }),
      (e.setClothVisible = function (e) {
        this.plane.material.uniforms.u_cloth_visible.value = e ? 1 : 0;
      }),
      (e.setIndexContent = function () {
        this.scene.remove(this.planeMain),
          this.scene.remove(this.planeDetail),
          this.scene.remove(this.planeAbout),
          this.scene.remove(this.planeContact),
          this.scene.add(this.plane);
      }),
      (e.setWorksContent = function () {
        (this.plane.material.uniforms.u_flow.value =
          this.planeMain.material.uniforms.u_flow.value =
            0),
          this.setMenuOn(),
          this.scene.remove(this.plane),
          this.scene.remove(this.planeDetail),
          this.scene.remove(this.planeAbout),
          this.scene.remove(this.planeContact),
          this.scene.add(this.planeMain),
          gsap.to(this.plane.material.uniforms.u_scroll_alpha, 0.2, {
            value: 1,
          }),
          _.CVCursor.getInstance().switchVideo();
      }),
      (e.setDetailContent = function () {
        this.setMenuOn(),
          this.scene.remove(this.plane),
          this.scene.remove(this.planeMain),
          this.scene.remove(this.planeAbout),
          this.scene.remove(this.planeContact),
          this.scene.add(this.planeDetail),
          (this.plane.material.uniforms.u_flow.value = 0),
          (this.planeContact.material.uniforms.u_contact_bg.value = 0),
          gsap.to(this.plane.material.uniforms.u_scroll_alpha, 0.2, {
            value: 0,
          });
        var e =
          _.GLWheel.getInstance().index %
          _.GLAssetsLoader.getInstance().works.works.length;
        0 > e && (e += _.GLAssetsLoader.getInstance().works.works.length);
        var t = _.GLAssetsLoader.getInstance().works.works[e],
          a = {
            b65: [0.80810546875, 0.939453125, 0.984375, 0.992431640625],
            b66: [0.80810546875, 0.882568359375, 0.984375, 0.93310546875],
            b67: [0.8056640625, 0.82666015625, 0.986328125, 0.876220703125],
            b68: [0.80810546875, 0.769775390625, 0.984375, 0.819091796875],
            b69: [0.80810546875, 0.72412109375, 0.984375, 0.761962890625],
            b70: [0.80810546875, 0.6806640625, 0.984375, 0.717529296875],
            b71: [0.8056640625, 0.625732421875, 0.986328125, 0.676025390625],
            b72: [0.80810546875, 0.566650390625, 0.984375, 0.617431640625],
            b73: [0.80810546875, 0.540771484375, 0.984375, 0.557861328125],
            b74: [0.8037109375, 0.50634765625, 0.984375, 0.534912109375],
            b75: [0.80810546875, 0.446533203125, 0.984375, 0.497802734375],
            b76: [0.80810546875, 0.40283203125, 0.984375, 0.441162109375],
            b77: [0.80810546875, 0.335205078125, 0.984375, 0.39697265625],
            b78: [0.80810546875, 0.280029296875, 0.984375, 0.32666015625],
            b79: [0.8056640625, 0.220703125, 0.986328125, 0.272216796875],
            b80: [0.80810546875, 0.163818359375, 0.984375, 0.212890625],
            b81: [0.7734375, 0.106689453125, 0.986328125, 0.158203125],
            b82: [0.80810546875, 0.048095703125, 0.984375, 0.098876953125],
            b83: [0.5908203125, 0.943115234375, 0.771484375, 0.990234375],
            b84: [0.59326171875, 0.896240234375, 0.76953125, 0.94091796875],
            b85: [0.5908203125, 0.840576171875, 0.76953125, 0.890625],
            b86: [0.59326171875, 0.783203125, 0.76953125, 0.8349609375],
            b87: [0.59326171875, 0.70849609375, 0.76953125, 0.779541015625],
            b88: [0.59326171875, 0.65380859375, 0.76953125, 0.706298828125],
            b89: [0.59326171875, 0.60205078125, 0.76953125, 0.6533203125],
            b90: [0.59326171875, 0.558837890625, 0.76953125, 0.599365234375],
            b33: [0.59326171875, 0.536865234375, 0.76953125, 0.552978515625],
            b124: [0.5927734375, 0.515380859375, 0.77099609375, 0.529296875],
            b47: [0.59326171875, 0.47216796875, 0.76953125, 0.50830078125],
            b44: [0.564453125, 0.450927734375, 0.62451171875, 0.46630859375],
            b39: [0.7080078125, 0.43212890625, 0.76953125, 0.44580078125],
            b45: [0.64599609375, 0.398681640625, 0.66845703125, 0.426025390625],
            b215: [0.64501953125, 0.355224609375, 0.71923828125, 0.39208984375],
            b8482: [0.6669921875, 0.276123046875, 0.76953125, 0.3505859375],
            b46: [0.59326171875, 0.2509765625, 0.625, 0.266357421875],
            b946: [0.552734375, 0.188232421875, 0.771484375, 0.24365234375],
            b169: [0.607421875, 0.11083984375, 0.75439453125, 0.18212890625],
            b174: [0.666015625, 0.0576171875, 0.7705078125, 0.108154296875],
            b97: [0.37646484375, 0.948974609375, 0.5068359375, 0.990478515625],
            b98: [0.37646484375, 0.900390625, 0.5546875, 0.942626953125],
            b99: [0.37646484375, 0.854248046875, 0.5068359375, 0.89453125],
            b100: [0.37646484375, 0.806640625, 0.5546875, 0.8486328125],
            b101: [0.37646484375, 0.759521484375, 0.5068359375, 0.7998046875],
            b102: [0.37841796875, 0.724609375, 0.5498046875, 0.755615234375],
            b103: [0.33740234375, 0.672119140625, 0.51025390625, 0.72314453125],
            b104: [0.37841796875, 0.626953125, 0.5546875, 0.66845703125],
            b105: [0.37841796875, 0.603515625, 0.548828125, 0.619384765625],
            b106: [0.34326171875, 0.57275390625, 0.548828125, 0.597412109375],
            b107: [
              0.37841796875, 0.519287109375, 0.55517578125, 0.565185546875,
            ],
            b108: [0.37841796875, 0.498779296875, 0.5546875, 0.5146484375],
            b109: [
              0.37841796875, 0.423583984375, 0.50732421875, 0.490966796875,
            ],
            b110: [0.37841796875, 0.37451171875, 0.5068359375, 0.416015625],
            b111: [0.37646484375, 0.326904296875, 0.5068359375, 0.367919921875],
            b112: [0.33740234375, 0.27783203125, 0.5068359375, 0.320068359375],
            b113: [0.33740234375, 0.229736328125, 0.5068359375, 0.271728515625],
            b114: [0.37841796875, 0.1904296875, 0.50634765625, 0.221923828125],
            b115: [0.37646484375, 0.148193359375, 0.5068359375, 0.187744140625],
            b116: [0.376953125, 0.11328125, 0.5419921875, 0.1455078125],
            b117: [0.37646484375, 0.06689453125, 0.5048828125, 0.108154296875],
            b118: [0.37841796875, 0.02001953125, 0.5048828125, 0.06201171875],
            b119: [0.15771484375, 0.932373046875, 0.2841796875, 0.9921875],
            b120: [0.15771484375, 0.885009765625, 0.2841796875, 0.92919921875],
            b121: [0.1240234375, 0.8388671875, 0.2841796875, 0.88330078125],
            b122: [0.15771484375, 0.80126953125, 0.2841796875, 0.835693359375],
            b48: [0.1552734375, 0.74853515625, 0.3359375, 0.795166015625],
            b49: [0.15771484375, 0.712646484375, 0.333984375, 0.742431640625],
            b50: [0.15771484375, 0.6572265625, 0.3359375, 0.703857421875],
            b51: [0.1552734375, 0.60498046875, 0.33642578125, 0.651611328125],
            b52: [0.15771484375, 0.54931640625, 0.333984375, 0.599365234375],
            b53: [0.1552734375, 0.498046875, 0.333984375, 0.5439453125],
            b54: [0.1552734375, 0.44482421875, 0.3359375, 0.491455078125],
            b55: [0.15771484375, 0.401123046875, 0.333984375, 0.440673828125],
            b56: [0.1552734375, 0.349853515625, 0.3359375, 0.396240234375],
            b57: [0.1552734375, 0.29736328125, 0.3359375, 0.343994140625],
            s65: [0.08203125, 0.671142578125, 0.1318359375, 0.6845703125],
            s66: [0.08203125, 0.6572265625, 0.1318359375, 0.669921875],
            s67: [0.08154296875, 0.643310546875, 0.13232421875, 0.65625],
            s68: [0.08203125, 0.62890625, 0.1318359375, 0.641845703125],
            s69: [0.08203125, 0.617431640625, 0.1318359375, 0.627197265625],
            s70: [0.08203125, 0.606201171875, 0.1318359375, 0.615966796875],
            s71: [0.08154296875, 0.593017578125, 0.13232421875, 0.60595703125],
            s72: [0.08203125, 0.578125, 0.1318359375, 0.59130859375],
            s73: [0.08203125, 0.57275390625, 0.1318359375, 0.576171875],
            s74: [0.080078125, 0.564697265625, 0.1318359375, 0.57177734375],
            s75: [0.08203125, 0.5498046875, 0.1318359375, 0.562744140625],
            s76: [0.08203125, 0.538818359375, 0.1318359375, 0.548828125],
            s77: [0.08203125, 0.521484375, 0.1318359375, 0.537841796875],
            s78: [0.08203125, 0.507568359375, 0.1318359375, 0.519775390625],
            s79: [0.08154296875, 0.49267578125, 0.13232421875, 0.506103515625],
            s80: [0.08203125, 0.478515625, 0.1318359375, 0.490966796875],
            s81: [0.07275390625, 0.4638671875, 0.13232421875, 0.4775390625],
            s82: [0.08203125, 0.449462890625, 0.1318359375, 0.462158203125],
            s83: [0.08154296875, 0.43603515625, 0.13232421875, 0.44873046875],
            s84: [0.08203125, 0.423828125, 0.1318359375, 0.436279296875],
            s85: [0.08154296875, 0.41015625, 0.1318359375, 0.423583984375],
            s86: [0.08203125, 0.395263671875, 0.1318359375, 0.409423828125],
            s87: [0.08203125, 0.374755859375, 0.1318359375, 0.39501953125],
            s88: [0.08203125, 0.36083984375, 0.1318359375, 0.374755859375],
            s89: [0.08203125, 0.34619140625, 0.1318359375, 0.360107421875],
            s90: [0.08203125, 0.333984375, 0.1318359375, 0.345703125],
            s33: [0.08203125, 0.329345703125, 0.1318359375, 0.3330078125],
            s124: [0.08203125, 0.324462890625, 0.1328125, 0.327880859375],
            s47: [0.08203125, 0.3134765625, 0.1318359375, 0.323486328125],
            s44: [0.0751953125, 0.309326171875, 0.0908203125, 0.31298828125],
            s39: [0.11572265625, 0.305419921875, 0.1318359375, 0.30859375],
            s45: [0.09619140625, 0.29736328125, 0.10205078125, 0.3046875],
            s215: [0.09716796875, 0.287109375, 0.115234375, 0.29638671875],
            s8482: [0.10400390625, 0.267333984375, 0.1318359375, 0.28662109375],
            s46: [0.08203125, 0.261962890625, 0.0908203125, 0.265380859375],
            s946: [0.07421875, 0.24462890625, 0.12060546875, 0.258544921875],
            s169: [0.08642578125, 0.221923828125, 0.12841796875, 0.2421875],
            s174: [0.103515625, 0.207275390625, 0.1318359375, 0.220947265625],
            s97: [0.02294921875, 0.674072265625, 0.06005859375, 0.684326171875],
            s98: [0.02294921875, 0.662353515625, 0.0732421875, 0.6728515625],
            s99: [0.02294921875, 0.6513671875, 0.06005859375, 0.661376953125],
            s100: [0.02294921875, 0.64013671875, 0.0732421875, 0.650390625],
            s101: [
              0.02294921875, 0.628662109375, 0.06005859375, 0.638916015625,
            ],
            s102: [0.0234375, 0.620361328125, 0.07177734375, 0.628662109375],
            s103: [0.01220703125, 0.6064453125, 0.06005859375, 0.6201171875],
            s104: [0.0234375, 0.595947265625, 0.0732421875, 0.606201171875],
            s105: [0.0234375, 0.59130859375, 0.0703125, 0.5947265625],
            s106: [0.0146484375, 0.584228515625, 0.0703125, 0.59033203125],
            s107: [0.0234375, 0.571533203125, 0.0732421875, 0.582763671875],
            s108: [0.0234375, 0.567626953125, 0.0732421875, 0.571044921875],
            s109: [0.0234375, 0.54931640625, 0.060546875, 0.566162109375],
            s110: [0.0234375, 0.5380859375, 0.06005859375, 0.548095703125],
            s111: [0.02294921875, 0.52685546875, 0.06005859375, 0.537109375],
            s112: [0.01220703125, 0.51513671875, 0.06005859375, 0.525634765625],
            s113: [0.01220703125, 0.50390625, 0.06005859375, 0.514404296875],
            s114: [0.0234375, 0.494873046875, 0.06005859375, 0.50244140625],
            s115: [
              0.02294921875, 0.484619140625, 0.06005859375, 0.494873046875,
            ],
            s116: [0.02294921875, 0.4765625, 0.0703125, 0.48486328125],
            s117: [0.02294921875, 0.465576171875, 0.0595703125, 0.475830078125],
            s118: [0.0234375, 0.4541015625, 0.0595703125, 0.465087890625],
            s119: [0.0234375, 0.437744140625, 0.0595703125, 0.453857421875],
            s120: [0.0234375, 0.426025390625, 0.0595703125, 0.4375],
            s121: [0.01513671875, 0.41455078125, 0.0595703125, 0.42578125],
            s122: [0.0234375, 0.4052734375, 0.0595703125, 0.41455078125],
            s48: [0.02294921875, 0.3916015625, 0.07373046875, 0.404052734375],
            s49: [0.0234375, 0.38330078125, 0.0732421875, 0.390380859375],
            s50: [0.0234375, 0.368896484375, 0.07373046875, 0.38134765625],
            s51: [0.02294921875, 0.355224609375, 0.07373046875, 0.367431640625],
            s52: [0.0234375, 0.3408203125, 0.0732421875, 0.35400390625],
            s53: [0.02294921875, 0.327880859375, 0.0732421875, 0.33984375],
            s54: [0.02294921875, 0.314208984375, 0.07373046875, 0.326416015625],
            s55: [0.0234375, 0.302978515625, 0.0732421875, 0.3134765625],
            s56: [0.02294921875, 0.289794921875, 0.07373046875, 0.30224609375],
            s57: [0.02294921875, 0.276123046875, 0.07373046875, 0.288330078125],
          };
        this.titlePos = t.detail_cv.concat();
        var o = t.detail_title_small,
          l = t.detail_title;
        this.titleMaps = [];
        for (var d, u = [], c = 0.04, p = 0; p < o.length; p++)
          (d = o.substr(p, 1)),
            " " != d &&
              "\n" != d &&
              (u.push(c),
              (c += 0.02),
              this.titleMaps.push(...a["s" + d.charCodeAt(0)]));
        for (var d, p = 0; p < l.length; p++)
          (d = l.substr(p, 1)),
            " " != d &&
              "\n" != d &&
              (u.push(c),
              (c += 0.1),
              this.titleMaps.push(...a["b" + d.charCodeAt(0)]));
        this.titleAnimes = [];
        var m = this;
        if (!n && !this.renderer.isSafari)
          for (var v = 0, p = 0; p < this.titlePos.length; p += 4) {
            this.titleAnimes.push(1);
            var C = {
              t: 1,
            };
            gsap.to(C, 2, {
              delay: u[v],
              t: 0,
              ease: Quart.easeOut,
              onUpdate: function (e, t) {
                m.planeDetail.material.uniforms.u_detail_title_animes.value[e] =
                  t.t;
              },
              onUpdateParams: [v, C],
            }),
              this.titleTweens.push(C),
              v++;
          }
        for (var p = this.titlePos.length; p < r; p++) this.titlePos.push(0);
        for (var p = this.titleMaps.length; p < r; p++) this.titleMaps.push(0);
        for (var p = this.titleAnimes.length; p < r / 4; p++)
          this.titleAnimes.push(0);
        (this.planeDetail.material.uniforms.u_detail_title_pos.value =
          this.titlePos),
          (this.planeDetail.material.uniforms.u_detail_title_map.value =
            this.titleMaps),
          (this.planeDetail.material.uniforms.u_detail_title_animes.value =
            this.titleAnimes),
          (this.planeDetail.material.uniforms.u_detailimage_flow.value = 1),
          gsap.to(this.planeDetail.material.uniforms.u_detailimage_flow, 2.5, {
            delay: 0.3,
            value: 0,
            ease: Quart.easeOut,
          });
        var g =
            this.renderer.renderer.domElement.style.width.split("px")[0] >> 0,
          f = document.createElement("div");
        (f.id = "contents"),
          (f.className = "detail_contents"),
          (f.style.width = ((0.84480234260615 * g) >> 0) + "px"),
          (f.style.left = this.renderer.renderer.domElement.style.left);
        var h = document.createElement("div");
        if (
          ((h.className = "detail_wrapper"),
          f.appendChild(h),
          n || this.renderer.isSafari)
        ) {
          var y = document.createElement("div");
          (y.id = "detail_title"),
            (y.className = "detail_title"),
            (y.style.width = ((0.890556368960469 * g) >> 0) + "px"),
            (y.style.left = this.renderer.renderer.domElement.style.left),
            document.body.appendChild(y);
          var E = new Image();
          (E.src =
            SiteConst.DOCUMENT_ROOT +
            "assets/images/detail/" +
            (_.GLAssetsLoader.getInstance().works.works.length - e - 1) +
            ".svg"),
            (E.style.width = "24.0032881216605%"),
            y.appendChild(E),
            gsap.from(y, {
              ease: "power4",
              y: "+=50px",
              opacity: 0,
              duration: 2.5,
              delay: 0.4,
            });
        }
        var b = document.createElement("div");
        (b.className = "detail_table_wrapper"), h.appendChild(b);
        var x = document.createElement("div");
        (x.className = "detail_label"),
          (x.innerText = "CLIENT"),
          b.appendChild(x);
        var w = document.createElement("div");
        (w.className = "detail_value_client"),
          (w.innerText = t.detail_client_name),
          (w.innerHTML = w.innerHTML
            .split("/")
            .join('<span class="slash">/</span>')),
          b.appendChild(w);
        var b = document.createElement("div");
        (b.className = "detail_table_wrapper"), h.appendChild(b);
        var x = document.createElement("div");
        (x.className = "detail_label"),
          (x.innerText = "TYPE"),
          b.appendChild(x);
        var w = document.createElement("div");
        (w.className = "detail_value"),
          (w.innerText = t.type),
          (w.innerHTML = w.innerHTML
            .split("/")
            .join('<span class="slash">/</span>')),
          b.appendChild(w);
        var b = document.createElement("div");
        (b.className = "detail_table_wrapper"), h.appendChild(b);
        var x = document.createElement("div");
        (x.className = "detail_label"),
          (x.innerText = "AGENCY"),
          b.appendChild(x);
        var w = document.createElement("div");
        (w.className = "detail_value"),
          (w.innerText = t.agency),
          (w.innerHTML = w.innerHTML
            .split("/")
            .join('<span class="slash">/</span>')),
          b.appendChild(w);
        var b = document.createElement("div");
        (b.className = "detail_table_wrapper"), h.appendChild(b);
        var x = document.createElement("div");
        (x.className = "detail_label"),
          (x.innerText = "RELEASE"),
          b.appendChild(x);
        var w = document.createElement("div");
        (w.className = "detail_value"),
          (w.innerText = t.date),
          b.appendChild(w);
        var L = document.createElement("div");
        if (
          ((L.className = "detail_description"),
          (L.innerText = t.description),
          h.appendChild(L),
          "" != t.url)
        ) {
          var S = document.createElement("button");
          (S.className = "detail_btn"), (S.innerText = "VISIT SITE");
          var k = null;
          S.addEventListener(
            _.MouseEvent.MOUSE_OVER,
            (k = function () {
              gsap.to(S, 0.2, {
                backgroundColor: "#DDDDDD",
                ease: Linear.easeNone,
              }),
                gsap.to(S, 0.2, {
                  color: "#000000",
                  ease: Linear.easeNone,
                }),
                (m.btn_over_flg = !0),
                _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
            })
          ),
            this.domListeners.push([S, _.MouseEvent.MOUSE_OVER, k]);
          var T = null;
          S.addEventListener(
            _.MouseEvent.MOUSE_OUT,
            (T = function () {
              gsap.to(S, 0.2, {
                backgroundColor: "#000000",
                ease: Linear.easeNone,
              }),
                gsap.to(S, 0.2, {
                  color: "#FFFFFF",
                  ease: Linear.easeNone,
                }),
                (m.btn_over_flg = !1),
                _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
            })
          ),
            this.domListeners.push([S, _.MouseEvent.MOUSE_OUT, T]);
          var I = null;
          S.addEventListener(
            _.MouseEvent.CLICK,
            (I = function () {
              window.open(t.url, "_blank");
            })
          ),
            this.domListeners.push([S, _.MouseEvent.CLICK, I]),
            h.appendChild(S);
        }
        if ("" != t.bts) {
          var A = document.createElement("button");
          (A.className = "detail_btn"),
            "" != t.url && (A.style.marginLeft = "20px"),
            (A.style.width = "205px"),
            (A.innerText = "BEHIND THE SCENE");
          var k = null;
          A.addEventListener(
            _.MouseEvent.MOUSE_OVER,
            (k = function () {
              gsap.to(A, 0.2, {
                backgroundColor: "#DDDDDD",
                ease: Linear.easeNone,
              }),
                gsap.to(A, 0.2, {
                  color: "#000000",
                  ease: Linear.easeNone,
                }),
                (m.btn_over_flg = !0),
                _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
            })
          ),
            this.domListeners.push([A, _.MouseEvent.MOUSE_OVER, k]);
          var T = null;
          A.addEventListener(
            _.MouseEvent.MOUSE_OUT,
            (T = function () {
              gsap.to(A, 0.2, {
                backgroundColor: "#000000",
                ease: Linear.easeNone,
              }),
                gsap.to(A, 0.2, {
                  color: "#FFFFFF",
                  ease: Linear.easeNone,
                }),
                (m.btn_over_flg = !1),
                _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
            })
          ),
            this.domListeners.push([A, _.MouseEvent.MOUSE_OUT, T]);
          var I = null;
          A.addEventListener(
            _.MouseEvent.CLICK,
            (I = function () {
              window.open(t.bts, "_blank");
            })
          ),
            this.domListeners.push([A, _.MouseEvent.CLICK, I]),
            h.appendChild(A);
        }
        var D = document.createElement("div");
        (D.className = "detail_credit_title"),
          (D.innerText = "CREDIT"),
          h.appendChild(D);
        var N = document.createElement("div");
        (N.className = "detail_credit_wrapper"), h.appendChild(N);
        for (
          var O = t.credit, M = O.split("\n"), p = 0, G = M.length;
          p < G;
          p++
        ) {
          var U = M[p].split(" / "),
            F = U[0],
            V = U[1].toUpperCase(),
            R = document.createElement("div");
          (R.className = "detail_credit_box"), N.appendChild(R);
          var P = document.createElement("p");
          (P.className = "detail_credit_position"),
            (P.innerText = F),
            R.appendChild(P);
          var W = document.createElement("p");
          (W.className = "detail_credit_name"),
            (W.innerText = V),
            R.appendChild(W);
        }
        var H = document.createElement("div");
        (H.id = "detail_navi"),
          (H.className = "detail_navi_wrapper"),
          (H.style.width = g + "px"),
          (H.style.left = this.renderer.renderer.domElement.style.left),
          f.appendChild(H);
        var q = document.createElement("a");
        (q.className = "next"), (q.innerText = "NEXT"), H.appendChild(q);
        var k = null;
        q.addEventListener(
          _.MouseEvent.MOUSE_OVER,
          (k = function () {
            (m.btn_over_flg = !0),
              q.classList.add("next_active"),
              _.CVCursor.getInstance().nextPlay(),
              _.CVCursor.getInstance().setState(_.CVCursor.HOVER_WITH_VIDEO);
          })
        ),
          this.domListeners.push([q, _.MouseEvent.MOUSE_OVER, k]);
        var T = null;
        q.addEventListener(
          _.MouseEvent.MOUSE_OUT,
          (T = function () {
            (m.btn_over_flg = !1),
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
          })
        ),
          this.domListeners.push([q, _.MouseEvent.MOUSE_OUT, T]);
        var I = null;
        q.addEventListener(
          _.MouseEvent.CLICK,
          (I = function () {
            (_.GLWheel.getInstance().dispatchLocked = !0),
              m.resetDoms(function () {
                var e =
                  (_.GLWheel.getInstance().index + 1) %
                  _.GLAssetsLoader.getInstance().works.works.length;
                0 > e &&
                  (e += _.GLAssetsLoader.getInstance().works.works.length),
                  (_.GLWheel.getInstance().position =
                    0.5 *
                    (e *
                      _.GLSceneManager.getInstance().getRenderer().renderer
                        .domElement.height)),
                  _.GLWheel.getInstance().setIndex(e, !0),
                  (m.btn_over_flg = !1),
                  (m.renderer.renderer.domElement.style.cursor = "auto"),
                  (m.plane.material.uniforms.u_glitch.value = 0),
                  (m.plane.material.uniforms.u_flow.value = 0),
                  _.GLSceneManager.getInstance().setScene(
                    _.GLSceneManager.SCENE_WORKS_DETAIL,
                    !0
                  ),
                  _.CVCursor.getInstance().play(),
                  _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT),
                  (_.GLWheel.getInstance().dispatchLocked = !1);
              });
          })
        ),
          this.domListeners.push([q, _.MouseEvent.CLICK, I]),
          document.body.appendChild(f),
          (this.scrollDomContent = document.getElementById("contents"));
        for (var z, B = h.children, p = 0, G = B.length; p < G; p++)
          (z = B[p]), (z.style.opacity = 0);
        for (var j, c = 0, p = 0, G = B.length; p < G; p++)
          (j = B[p]),
            "detail_btn" == j.className
              ? (gsap.from(j, {
                  ease: "power4",
                  y: "+=20px",
                  duration: 2.5,
                  delay: 1.2,
                }),
                gsap.to(j, {
                  ease: "power4",
                  opacity: 1,
                  duration: 2.5,
                  delay: 1.2,
                }))
              : (gsap.from(j, {
                  ease: "power4",
                  y: "+=100px",
                  scaleX: "+=0.2",
                  scaleY: "+=0.2",
                  duration: 2.5,
                  delay: c,
                }),
                gsap.to(j, {
                  ease: "power4",
                  opacity: 1,
                  duration: 2.5,
                  delay: c,
                }),
                (c += 0.1));
      }),
      (e.setAboutContent = function () {
        this.setMenuOn(),
          this.scene.remove(this.plane),
          this.scene.remove(this.planeMain),
          this.scene.remove(this.planeDetail),
          this.scene.remove(this.planeContact),
          this.scene.add(this.planeAbout),
          (this.planeDetail.material.uniforms.u_detailimage_flow.value = 1),
          (this.plane.material.uniforms.u_flow.value = 0),
          (this.planeContact.material.uniforms.u_contact_bg.value = 0),
          gsap.to(this.plane.material.uniforms.u_scroll_alpha, 0.2, {
            value: 0,
          }),
          null == this.officeTexture &&
            (this.officeTexture = new THREE.TextureLoader().load(
              SiteConst.DOCUMENT_ROOT + "assets/images/about/office_image.jpg"
            )),
          (this.planeAbout.material.uniforms.u_about_officeimage.value =
            this.officeTexture);
        var e = this,
          t = this.renderer.renderer.domElement.style.width.split("px")[0] >> 0,
          n = document.createElement("div");
        (n.id = "about"),
          (n.className = "about"),
          (n.style.width = t + "px"),
          (n.style.left = this.renderer.renderer.domElement.style.left);
        var r = document.createElement("div");
        (r.className = "about_title"),
          (r.id = "about_title"),
          (r.style.width = ((0.3 * t) >> 0) + "px"),
          (r.style.marginLeft = ((0.1271 * t) >> 0) + "px"),
          (r.style.left = this.renderer.renderer.domElement.style.left),
          document.body.appendChild(r);
        var s = document.createElement("div");
        (s.className = "about_title_image"), r.appendChild(s);
        var o = new Image();
        (o.className = "about_title_image_svg"),
          (o.src =
            "data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20672.14%20229.69%22%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill%3A%23fff%3B%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ctitle%3Etitle_01%3C%2Ftitle%3E%3Cpath%20class%3D%22a%22%20d%3D%22M1.14%2C191.28%2C39.06%2C1.72H76l37.91%2C189.56H81.88l-7.49-43.76h-33l-7.73%2C43.76Zm43.77-65.76H70.65L57.78%2C46Z%22%20transform%3D%22translate(-1.14%200.38)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M125.21%2C191.28V1.72h46.57A102.12%2C102.12%2C0%2C0%2C1%2C194.6%2C4.06a46.33%2C46.33%2C0%2C0%2C1%2C17.55%2C7.84A35.25%2C35.25%2C0%2C0%2C1%2C223.5%2C26.76q4%2C9.36%2C4%2C23.64%2C0%2C11.46-3.16%2C19.66a29.72%2C29.72%2C0%2C0%2C1-9.24%2C13%2C33.74%2C33.74%2C0%2C0%2C1-15.21%2C6.44q11.22%2C1.88%2C18.6%2C7.84a35.89%2C35.89%2C0%2C0%2C1%2C11%2C15.56q3.63%2C9.6%2C3.63%2C23.17a77.48%2C77.48%2C0%2C0%2C1-3.4%2C24%2C44.06%2C44.06%2C0%2C0%2C1-10.06%2C17.31A42.21%2C42.21%2C0%2C0%2C1%2C203%2C187.77a70.05%2C70.05%2C0%2C0%2C1-23.29%2C3.51Zm34.64-112.1h11.7q10.29%2C0%2C15.91-3a16.41%2C16.41%2C0%2C0%2C0%2C7.84-9.36%2C48.59%2C48.59%2C0%2C0%2C0%2C2.23-15.91q0-10.07-3.4-15.57A17.12%2C17.12%2C0%2C0%2C0%2C184%2C27.81a63.08%2C63.08%2C0%2C0%2C0-17.31-2h-6.79Zm0%2C87.76H173q15.68%2C0%2C21.3-7.61t5.62-23.52q0-11.46-2.7-18.6a19.79%2C19.79%2C0%2C0%2C0-8.89-10.65q-6.19-3.51-16.5-3.51H159.85Z%22%20transform%3D%22translate(-1.14%200.38)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M297.68%2C193.85q-20.13%2C0-32.06-7.49a41.4%2C41.4%2C0%2C0%2C1-17.08-21.53q-5.14-14-5.15-33.23V60.69q0-19.19%2C5.15-32.88A40.37%2C40.37%2C0%2C0%2C1%2C265.62%2C6.87Q277.56-.37%2C297.68-.38q20.6%2C0%2C32.42%2C7.25a41.14%2C41.14%2C0%2C0%2C1%2C17.08%2C20.94q5.26%2C13.69%2C5.27%2C32.88v71.15q0%2C18.94-5.27%2C32.88a42.86%2C42.86%2C0%2C0%2C1-17.08%2C21.53Q318.28%2C193.84%2C297.68%2C193.85Zm0-25.51q8.65%2C0%2C12.76-3.74a18.85%2C18.85%2C0%2C0%2C0%2C5.5-10.3%2C68.45%2C68.45%2C0%2C0%2C0%2C1.4-14.27V52.74a66.58%2C66.58%2C0%2C0%2C0-1.4-14.28%2C18.1%2C18.1%2C0%2C0%2C0-5.5-9.94q-4.1-3.63-12.76-3.63-8.19%2C0-12.4%2C3.63a17.7%2C17.7%2C0%2C0%2C0-5.61%2C9.94%2C65.92%2C65.92%2C0%2C0%2C0-1.41%2C14.28V140a73.84%2C73.84%2C0%2C0%2C0%2C1.29%2C14.27%2C17.84%2C17.84%2C0%2C0%2C0%2C5.5%2C10.3Q289.27%2C168.35%2C297.68%2C168.34Z%22%20transform%3D%22translate(-1.14%200.38)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M420.54%2C193.85q-21.06%2C0-32.76-7.72a39.47%2C39.47%2C0%2C0%2C1-16.15-22q-4.44-14.26-4.44-34.17V1.72h33.7V133.94a112.23%2C112.23%2C0%2C0%2C0%2C1.17%2C16.74%2C23.48%2C23.48%2C0%2C0%2C0%2C5.49%2C12.63q4.33%2C4.8%2C13%2C4.8%2C9.13%2C0%2C13.23-4.8a25.44%2C25.44%2C0%2C0%2C0%2C5.38-12.63%2C104.38%2C104.38%2C0%2C0%2C0%2C1.28-16.74V1.72H473.9V130q0%2C19.9-4.45%2C34.17t-16%2C22Q441.84%2C193.86%2C420.54%2C193.85Z%22%20transform%3D%22translate(-1.14%200.38)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M515.32%2C191.28v-164H485.13V1.72h94.54V27.23H550V191.28Z%22%20transform%3D%22translate(-1.14%200.38)%22%2F%3E%3Crect%20x%3D%22671.3%22%20y%3D%22228.83%22%20width%3D%220.84%22%20height%3D%220.86%22%2F%3E%3C%2Fsvg%3E"),
          s.appendChild(o);
        var s = document.createElement("div");
        (s.className = "about_title_image"), r.appendChild(s);
        var o = new Image();
        (o.className = "about_title_image_svg"),
          (o.src =
            "data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20673.28%20233.9%22%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill%3A%23fff%3B%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ctitle%3Etitle_02%3C%2Ftitle%3E%3Cpath%20class%3D%22a%22%20d%3D%22M0%2C189.58V0H31.83V108.84L66.7%2C54.32h34.64L67.4%2C108.61l33.23%2C81H67.17L42.6%2C122.89l-10.77%2C15v51.72Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M116.86%2C32.79V6.34h31.82V32.79Zm0%2C156.79V54.32h31.82V189.58Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M171%2C189.58V54.32H202.8V75.15q7-11.94%2C14-17.2a25.11%2C25.11%2C0%2C0%2C1%2C15.45-5.27%2C22.23%2C22.23%2C0%2C0%2C1%2C2.46.12c.7.08%2C1.52.19%2C2.45.35v33a41.82%2C41.82%2C0%2C0%2C0-6.2-2%2C29.07%2C29.07%2C0%2C0%2C0-6.9-.82%2C22.11%2C22.11%2C0%2C0%2C0-11.47%2C3q-5.15%2C3-9.83%2C10.06v93.14Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M252.82%2C32.79V6.34h31.82V32.79Zm0%2C156.79V54.32h31.82V189.58Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M315%2C189.58v-113H300.46V54.32H315V45.66a89.31%2C89.31%2C0%2C0%2C1%2C2.22-21.18%2C22.88%2C22.88%2C0%2C0%2C1%2C9.36-13.92q7.14-4.92%2C21.65-4.92%2C4.44%2C0%2C8.42.35t8.9%2C1.06V30.68c-1.25-.31-2.7-.58-4.33-.82a33.05%2C33.05%2C0%2C0%2C0-4.57-.35c-3.74%2C0-6.32%2C1.17-7.72%2C3.51s-2.11%2C5.78-2.11%2C10.3v11h18.73V76.55H346.79v113Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M403%2C191.69q-8%2C0-13.11-4.1a23.14%2C23.14%2C0%2C0%2C1-7.49-11A45.2%2C45.2%2C0%2C0%2C1%2C380.06%2C162V54.32h31.83v101.8c0%2C4.06.66%2C7.21%2C2%2C9.47s3.78%2C3.4%2C7.37%2C3.4a15.47%2C15.47%2C0%2C0%2C0%2C7.14-1.87%2C53.55%2C53.55%2C0%2C0%2C0%2C7.14-4.45V54.32h31.82V189.58H435.53V176.71a62.72%2C62.72%2C0%2C0%2C1-15%2C10.76A37.81%2C37.81%2C0%2C0%2C1%2C403%2C191.69Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M515.67%2C191.69q-16.15%2C0-24.46-11.47t-8.31-36.74V102.06a93.66%2C93.66%2C0%2C0%2C1%2C3.16-25.28q3.17-11.22%2C10.18-17.9t19-6.67a31.13%2C31.13%2C0%2C0%2C1%2C13.45%2C2.93A45.75%2C45.75%2C0%2C0%2C1%2C540%2C62.74V0h31.83V189.58H540V180a46.82%2C46.82%2C0%2C0%2C1-11.46%2C8.54A27.64%2C27.64%2C0%2C0%2C1%2C515.67%2C191.69Zm11.7-22a17.71%2C17.71%2C0%2C0%2C0%2C5.85-1.17%2C38%2C38%2C0%2C0%2C0%2C6.78-3.28V78.42a32.68%2C32.68%2C0%2C0%2C0-6.08-3.16A18.6%2C18.6%2C0%2C0%2C0%2C527.13%2C74a9.58%2C9.58%2C0%2C0%2C0-9.48%2C6.2A37.89%2C37.89%2C0%2C0%2C0%2C515%2C95.27v50.55A70.82%2C70.82%2C0%2C0%2C0%2C515.9%2C158a17.46%2C17.46%2C0%2C0%2C0%2C3.63%2C8.54Q522.22%2C169.7%2C527.37%2C169.69Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M614.28%2C191.69a25.82%2C25.82%2C0%2C0%2C1-15.68-4.8%2C31.74%2C31.74%2C0%2C0%2C1-10.06-12.17A35.23%2C35.23%2C0%2C0%2C1%2C585%2C159.39q0-12.63%2C4.68-21.29a44.54%2C44.54%2C0%2C0%2C1%2C12.4-14.51%2C87.29%2C87.29%2C0%2C0%2C1%2C17.55-10.18q9.84-4.34%2C19.9-7.84V93.87a50.22%2C50.22%2C0%2C0%2C0-.82-9.83%2C11.28%2C11.28%2C0%2C0%2C0-3-6.09q-2.22-2.1-6.9-2.1A9.5%2C9.5%2C0%2C0%2C0%2C618.85%2C83a31.53%2C31.53%2C0%2C0%2C0-1.29%2C7.84L617.09%2C99%2C586.9%2C97.85q.71-23.4%2C11.59-34.52T631.6%2C52.21q20.35%2C0%2C29.6%2C11.23t9.25%2C30.43v62.48q0%2C7.5.35%2C13.57t.93%2C11q.59%2C4.92%2C1.06%2C8.66H644.24q-.71-4.68-1.76-10.65c-.7-4-1.21-6.9-1.52-8.77A34.74%2C34.74%2C0%2C0%2C1%2C632.07%2C185Q625.52%2C191.68%2C614.28%2C191.69ZM626%2C168.05a11.44%2C11.44%2C0%2C0%2C0%2C5.74-1.52%2C21.82%2C21.82%2C0%2C0%2C0%2C4.79-3.63%2C18.83%2C18.83%2C0%2C0%2C0%2C3-3.74V121.48c-3.44%2C2-6.67%2C4.06-9.72%2C6.09a45%2C45%2C0%2C0%2C0-8%2C6.67%2C26.07%2C26.07%2C0%2C0%2C0-5.15%2C7.84A25.36%2C25.36%2C0%2C0%2C0%2C615%2C151.9q0%2C7.5%2C2.93%2C11.82A9.22%2C9.22%2C0%2C0%2C0%2C626%2C168.05Z%22%20transform%3D%22translate(-0.01%20-0.03)%22%2F%3E%3Crect%20x%3D%22672.44%22%20y%3D%22233.04%22%20width%3D%220.84%22%20height%3D%220.86%22%2F%3E%3C%2Fsvg%3E"),
          s.appendChild(o);
        var s = document.createElement("div");
        (s.className = "about_title_image"), r.appendChild(s);
        var o = new Image();
        (o.className = "about_title_image_svg"),
          (o.src =
            "data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20672.58%20185.7%22%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill%3A%23fff%3B%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ctitle%3Etitle_03%3C%2Ftitle%3E%3Cpath%20class%3D%22a%22%20d%3D%22M.71%2C26.45V0H32.53V26.45Zm0%2C156.79V48H32.53V183.24Z%22%20transform%3D%22translate(-0.71%20-0.01)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M49.44%2C183.24V48H81.27V61.55A69.2%2C69.2%2C0%2C0%2C1%2C96.6%2C50.2%2C36.37%2C36.37%2C0%2C0%2C1%2C114%2C45.87q8.43%2C0%2C13.34%2C4.1a24%2C24%2C0%2C0%2C1%2C7.26%2C10.88A45%2C45%2C0%2C0%2C1%2C137%2C75.59V183.24H105.14V81.91q0-6.07-1.87-9.36T96%2C69.28a16.44%2C16.44%2C0%2C0%2C0-7.13%2C1.87%2C46.76%2C46.76%2C0%2C0%2C0-7.61%2C4.68V183.24Z%22%20transform%3D%22translate(-0.71%20-0.01)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M193.73%2C185.35q-15.69%2C0-25.16-6a34.23%2C34.23%2C0%2C0%2C1-13.81-17.08q-4.32-11.12-4.33-26.33V95.25q0-15.68%2C4.33-26.68a33.53%2C33.53%2C0%2C0%2C1%2C13.93-16.85q9.59-5.84%2C25-5.85%2C14.51%2C0%2C23.75%2C4.57a27.92%2C27.92%2C0%2C0%2C1%2C13.46%2C13.8q4.22%2C9.26%2C4.21%2C23.29V98.76h-30V86.83a46.59%2C46.59%2C0%2C0%2C0-1.06-11.12%2C9.64%2C9.64%2C0%2C0%2C0-3.62-5.85%2C11.85%2C11.85%2C0%2C0%2C0-6.79-1.75%2C10%2C10%2C0%2C0%2C0-6.79%2C2.22c-1.72%2C1.48-2.92%2C3.86-3.63%2C7.14A68.24%2C68.24%2C0%2C0%2C0%2C182.26%2C91v49.61q0%2C13.11%2C2.81%2C17.67t8.89%2C4.56q4.68%2C0%2C7.14-2.1a10.62%2C10.62%2C0%2C0%2C0%2C3.28-6.2%2C52.13%2C52.13%2C0%2C0%2C0%2C.82-10V130.12h30V143q0%2C13.57-4.33%2C23.17a29.32%2C29.32%2C0%2C0%2C1-13.57%2C14.39Q208%2C185.35%2C193.73%2C185.35Z%22%20transform%3D%22translate(-0.71%20-0.01)%22%2F%3E%3Cpath%20class%3D%22a%22%20d%3D%22M246.44%2C183.24V151.18h30.89v32.06Z%22%20transform%3D%22translate(-0.71%20-0.01)%22%2F%3E%3Crect%20x%3D%22671.74%22%20y%3D%22184.84%22%20width%3D%220.84%22%20height%3D%220.86%22%2F%3E%3C%2Fsvg%3E"),
          s.appendChild(o);
        var l = document.createElement("p");
        (l.className = "about_title_copy"),
          (l.innerText =
            "We are crafting digital experiences through design and technology."),
          r.appendChild(l);
        var d = document.createElement("div");
        (d.className = "about_title_sns_wrapper"), r.appendChild(d);
        var u = document.createElement("a");
        (u.className = "about_title_sns"),
          (u.href = "https://twitter.com/kirifuda_inc"),
          (u.target = "_blank"),
          d.appendChild(u);
        var c = new Image();
        (c.className = "about_title_sns_image"),
          (c.src = SiteConst.DOCUMENT_ROOT + "assets/images/about/sns_t.png"),
          u.appendChild(c);
        var p = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OVER,
          (p = function () {
            (e.btn_over_flg = !0),
              c.classList.add("about_title_sns_image_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OVER, p]);
        var m = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OUT,
          (m = function () {
            (e.btn_over_flg = !1),
              c.classList.remove("about_title_sns_image_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OUT, m]);
        var u = document.createElement("a");
        (u.className = "about_title_sns"),
          (u.href = "https://www.facebook.com/kirifuda.co.jp"),
          (u.target = "_blank"),
          d.appendChild(u);
        var v = new Image();
        (v.className = "about_title_sns_image"),
          (v.src = SiteConst.DOCUMENT_ROOT + "assets/images/about/sns_f.png"),
          u.appendChild(v);
        var p = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OVER,
          (p = function () {
            (e.btn_over_flg = !0),
              v.classList.add("about_title_sns_image_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OVER, p]);
        var m = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OUT,
          (m = function () {
            (e.btn_over_flg = !1),
              v.classList.remove("about_title_sns_image_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OUT, m]);
        var u = document.createElement("a");
        (u.className = "about_title_sns"),
          (u.href = "https://www.instagram.com/kirifuda_13/"),
          (u.target = "_blank"),
          d.appendChild(u);
        var C = new Image();
        (C.className = "about_title_sns_image"),
          (C.src = SiteConst.DOCUMENT_ROOT + "assets/images/about/sns_i.png"),
          u.appendChild(C);
        var p = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OVER,
          (p = function () {
            (e.btn_over_flg = !0),
              C.classList.add("about_title_sns_image_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OVER, p]);
        var m = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OUT,
          (m = function () {
            (e.btn_over_flg = !1),
              C.classList.remove("about_title_sns_image_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OUT, m]);
        var g = document.createElement("div");
        (g.className = "about_contents"), n.appendChild(g);
        var f = document.createElement("p");
        (f.className = "about_contents_title"),
          (f.innerText = "WHO WE ARE"),
          g.appendChild(f);
        var h = document.createElement("p");
        (h.className = "about_contents_body_jp"),
          (h.innerText =
            "\u682A\u5F0F\u4F1A\u793E\u5207\u672D\u306F\u3001\u30C7\u30B6\u30A4\u30F3\u3068\u30C6\u30AF\u30CE\u30ED\u30B8\u30FC\u3092\u7528\u3044\u305F\u5236\u4F5C\u304A\u3088\u3073\u958B\u767A\u3092\u884C\u3046\u30AF\u30EA\u30A8\u30A4\u30C6\u30A3\u30D6\u96C6\u56E3\u3067\u3059\u3002\nWeb\u30B5\u30A4\u30C8\u30FB\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u30A2\u30D7\u30EA\u30FB\u6620\u50CF\u30FB\u30C7\u30B8\u30BF\u30EB\u30B5\u30A4\u30CD\u30FC\u30B8\u30FB\u30A4\u30F3\u30B9\u30BF\u30EC\u30FC\u30B7\u30E7\u30F3\u30FBXR\u306A\u3069\u3001\u3055\u307E\u3056\u307E\u306A\u30C7\u30B8\u30BF\u30EB\u5E83\u544A\u5236\u4F5C\u696D\u52D9\u3092\u884C\u306A\u3063\u3066\u3044\u307E\u3059\u3002"),
          g.appendChild(h);
        var y = document.createElement("p");
        (y.className = "about_contents_body_en"),
          (y.innerText =
            "We are a creative digital studio that crafts digital experiences through design and technology. We focus on Websites, apps, interactive videos, installations, VR & AR experiences."),
          g.appendChild(y);
        var E = document.createElement("p");
        (E.className = "about_contents_title"),
          (E.innerText = "OUR CREWS"),
          g.appendChild(E);
        var b = document.createElement("p");
        (b.className = "about_contents_crews_position"),
          (b.innerText =
            "Chief Executive Officer / Founder / Technical Director"),
          g.appendChild(b);
        var x = document.createElement("p");
        (x.className = "about_contents_crews_name"),
          (x.innerText = "ARIKATA NOBUAKI"),
          g.appendChild(x);
        var b = document.createElement("p");
        (b.className = "about_contents_crews_position"),
          (b.innerText = "Executive Officer / Founder / Technical Director"),
          g.appendChild(b);
        var x = document.createElement("p");
        (x.className = "about_contents_crews_name"),
          (x.innerText = "NAKASHIMA KENSHIRO"),
          g.appendChild(x);
        var b = document.createElement("p");
        (b.className = "about_contents_crews_position"),
          (b.innerText = "Developer"),
          g.appendChild(b);
        var x = document.createElement("p");
        (x.className = "about_contents_crews_name"),
          (x.innerText = "KISHI SYUNSUKE"),
          g.appendChild(x);
        var b = document.createElement("p");
        (b.className = "about_contents_crews_position"),
          (b.innerText = "Designer / Motion Designer"),
          g.appendChild(b);
        var x = document.createElement("p");
        (x.className = "about_contents_crews_name"),
          (x.innerText = "OTSUKA ERIKA"),
          g.appendChild(x);
        var w = document.createElement("p");
        (w.className = "about_contents_title"),
          (w.innerText = "AWARDS"),
          (w.style.paddingTop = "70px"),
          g.appendChild(w);
        var L = document.createElement("ul");
        (L.className = "about_contents_awards_ul"), g.appendChild(L);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 73),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_oneshow.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 94),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_acc.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 42),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_wommy.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 77),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_fwa.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 139),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_css.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 35),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_adfest.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 94),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_dentsu.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 45),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_cssw.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 78),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_design.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 90),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_jmaf.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 54),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_code.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 77),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT +
            "assets/images/about/awards_awwwards.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 75),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_webby.png"),
          S.appendChild(k);
        var S = document.createElement("li");
        (S.className = "about_contents_awards_li"), L.appendChild(S);
        var k = new Image();
        (k.width = 90),
          (k.className = "about_contents_awards_img"),
          (k.src =
            SiteConst.DOCUMENT_ROOT + "assets/images/about/awards_spikes.png"),
          S.appendChild(k);
        var w = document.createElement("p");
        (w.className = "about_contents_title"),
          (w.innerText = "COMPANY PROFILE"),
          (w.style.paddingTop = "80px"),
          g.appendChild(w);
        var T = document.createElement("p");
        (T.className = "about_contents_profile_label"),
          (T.innerText = "Name"),
          g.appendChild(T);
        var I = document.createElement("p");
        (I.className = "about_contents_profile_value"),
          (I.innerText =
            "\u682A\u5F0F\u4F1A\u793E\u5207\u672D / kirifuda inc."),
          g.appendChild(I);
        var T = document.createElement("p");
        (T.className = "about_contents_profile_label"),
          (T.innerText = "Officer"),
          g.appendChild(T);
        var I = document.createElement("p");
        (I.className = "about_contents_profile_value"),
          (I.innerText =
            "\u6709\u65B9\u4F38\u6643 / Arikata Nobuaki\n\u4E2D\u5CF6\u8CE2\u5FD7\u90CE / Nakashima Kenshiro"),
          g.appendChild(I);
        var T = document.createElement("p");
        (T.className = "about_contents_profile_label"),
          (T.innerText = "Founded"),
          g.appendChild(T);
        var I = document.createElement("p");
        (I.className = "about_contents_profile_value"),
          (I.innerText = "April 2014"),
          g.appendChild(I);
        var T = document.createElement("p");
        (T.className = "about_contents_profile_label"),
          (T.innerText = "Address"),
          g.appendChild(T);
        var I = document.createElement("p");
        (I.className = "about_contents_profile_value"),
          I.classList.add("selectable"),
          (I.innerHTML =
            '\u3012151-0053 \u6771\u4EAC\u90FD\u6E0B\u8C37\u533A\u4EE3\u3005\u67285-37-11 \u5E73\u4E95\u30D3\u30EB101<br />#101 Hirai bldg. 5-37-11, Yoyogi, Shibuya-ku, Tokyo, 151-0053 Japan<br /><span class="about_maps_wrapper"><a href="https://krfd.jp/map" target="_blank" class="about_maps">Google maps</a></span>'),
          g.appendChild(I);
        var A = I.querySelector(".about_maps"),
          p = null;
        A.addEventListener(
          _.MouseEvent.MOUSE_OVER,
          (p = function () {
            (e.btn_over_flg = !0),
              A.classList.add("about_maps_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
          })
        ),
          this.domListeners.push([A, _.MouseEvent.MOUSE_OVER, p]);
        var m = null;
        A.addEventListener(
          _.MouseEvent.MOUSE_OUT,
          (m = function () {
            (e.btn_over_flg = !1),
              A.classList.remove("about_maps_active"),
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
          })
        ),
          this.domListeners.push([A, _.MouseEvent.MOUSE_OUT, m]);
        var T = document.createElement("p");
        (T.className = "about_contents_profile_label"),
          (T.innerText = "Mail"),
          g.appendChild(T);
        var I = document.createElement("p");
        (I.className = "about_contents_profile_value"),
          (I.innerText = "info@kirifuda.co.jp"),
          I.classList.add("selectable"),
          g.appendChild(I);
        var T = document.createElement("p");
        (T.className = "about_contents_profile_label"),
          (T.innerText = "Capital"),
          g.appendChild(T);
        var I = document.createElement("p");
        (I.className = "about_contents_profile_value"),
          (I.innerText = "7,000,000yen"),
          g.appendChild(I);
        var D = document.createElement("div");
        (D.className = "about_office"),
          n.appendChild(D),
          document.body.appendChild(n);
        for (
          var N,
            O = 0.1,
            M = r.querySelectorAll(".about_title_image_svg"),
            G = 0;
          G < M.length;
          G++
        )
          (N = M[G]),
            gsap.from(N, {
              ease: "power4",
              y: "+=140%",
              duration: 2,
              delay: O + 0.1 * G,
            });
        (l.style.animation =
          "about_keyframe_y_scale_color 2.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) " +
          O +
          "s 1 normal backwards running"),
          (d.style.animation =
            "about_keyframe_y_scale_opacity 2.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) " +
            (O + 0.1) +
            "s 1 normal backwards running");
        for (var N, U = g.children, G = 0; G < U.length; G++)
          (N = U[G]),
            (N.style.animation =
              13 == G
                ? "about_keyframe_y_scale_opacity 2.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) " +
                  (O + 0.1 * G) +
                  "s 1 normal backwards running"
                : (0 == G % 2 && 4 <= G && 10 >= G) || (1 == G % 2 && 15 <= G)
                ? "about_keyframe_y_scale_color_g 2.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) " +
                  (O + 0.1 * G) +
                  "s 1 normal backwards running"
                : "about_keyframe_y_scale_color 2.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) " +
                  (O + 0.1 * G) +
                  "s 1 normal backwards running");
        (this.planeAbout.material.uniforms.u_about_y.value = 1.4),
          gsap.killTweensOf(this.planeAbout.material.uniforms.u_about_cover),
          (this.planeAbout.material.uniforms.u_about_cover.value = 0),
          (this.scrollDomContent = document.getElementById("about"));
      }),
      (e.setContactContent = function () {
        this.setMenuOn(),
          this.scene.remove(this.plane),
          this.scene.remove(this.planeMain),
          this.scene.remove(this.planeDetail),
          this.scene.remove(this.planeAbout),
          this.scene.add(this.planeContact),
          (this.planeDetail.material.uniforms.u_detailimage_flow.value = 1),
          (this.plane.material.uniforms.u_flow.value = 0),
          gsap.to(this.plane.material.uniforms.u_scroll_alpha, 0.2, {
            value: 0,
          });
        var e = this,
          t = this.renderer.renderer.domElement.style.width.split("px")[0] >> 0,
          a = document.createElement("div");
        (a.id = "contact"),
          (a.className = "contact"),
          (a.style.width = t + "px"),
          (a.style.left = this.renderer.renderer.domElement.style.left);
        var n = document.createElement("div");
        (n.className = "contact_left"), a.appendChild(n);
        var r = document.createElement("div");
        (r.className = "contact_title_span"), n.appendChild(r);
        var s = document.createElement("p");
        (s.className = "contact_title"),
          (s.innerHTML = 'CON<span class="contact_title_ta">T</span>ACT'),
          r.appendChild(s);
        var o = document.createElement("div");
        (o.className = "contact_left_desc"), n.appendChild(o);
        var l = document.createElement("div");
        (l.className = "contact_common_vmiddle"), o.appendChild(l);
        var i = document.createElement("p");
        (i.className = "contact_left_desc_jp"),
          (i.innerText =
            "\u65B0\u898F\u6848\u4EF6\u306E\u3054\u76F8\u8AC7\u30FB\u305D\u306E\u4ED6\u304A\u554F\u3044\u5408\u308F\u305B\u306F\u3001\u304A\u624B\u6570\u3067\u3059\u304CMail\u306B\u3066\u3054\u9023\u7D61\u304F\u3060\u3055\u3044\u3002\u6298\u308A\u8FD4\u3057\u3054\u9023\u7D61\u3055\u305B\u3066\u3044\u305F\u3060\u304D\u307E\u3059\u3002"),
          l.appendChild(i);
        var d = document.createElement("p");
        (d.className = "contact_left_desc_en"),
          (d.innerText =
            "If you have any questions about new projects or other inquiries, please contact us by email. We will get back to you as soon as possible."),
          l.appendChild(d);
        var r = document.createElement("div");
        (r.className = "contact_left_mail_span"), n.appendChild(r);
        var u = document.createElement("a");
        (u.className = "contact_left_mail"),
          (u.innerText = "info@kirifuda.co.jp"),
          (u.href = "mailto:info@kirifuda.co.jp"),
          r.appendChild(u);
        var c = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OVER,
          (c = function () {
            (e.btn_over_flg = !0),
              _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OVER, c]);
        var p = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OUT,
          (p = function () {
            (e.btn_over_flg = !1),
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OUT, p]);
        var m = document.createElement("div");
        (m.className = "contact_right"), a.appendChild(m);
        var r = document.createElement("div");
        (r.className = "contact_title_span"), m.appendChild(r);
        var v = document.createElement("p");
        (v.className = "contact_right_title_sub"),
          (v.innerText = "WE AWAIT YOUR APPLICATION!"),
          r.appendChild(v);
        var r = document.createElement("div");
        (r.className = "contact_title_span"), m.appendChild(r);
        var s = document.createElement("p");
        (s.className = "contact_right_title"),
          (s.innerText = "JOIN US"),
          r.appendChild(s);
        var o = document.createElement("div");
        (o.className = "contact_right_desc"), m.appendChild(o);
        var l = document.createElement("div");
        (l.className = "contact_common_vmiddle"), o.appendChild(l);
        var C = document.createElement("p");
        (C.className = "contact_right_desc_copy"),
          (C.innerText = "Seeking for following positions,"),
          l.appendChild(C);
        var g = document.createElement("div");
        (g.className = "contact_right_seeking_position"), l.appendChild(g);
        var f = document.createElement("span");
        (f.className = "contact_right_seeking_position_li"),
          (f.innerText = "Web Developers"),
          g.appendChild(f),
          g.appendChild(document.createElement("br"));
        var f = document.createElement("span");
        (f.className = "contact_right_seeking_position_li"),
          (f.innerText = "Programmers"),
          g.appendChild(f),
          g.appendChild(document.createElement("br"));
        var f = document.createElement("span");
        (f.className = "contact_right_seeking_position_li"),
          (f.innerText = "Designers"),
          g.appendChild(f);
        var r = document.createElement("div");
        (r.className = "contact_right_mail_span"), m.appendChild(r);
        var u = document.createElement("a");
        (u.className = "contact_right_mail"),
          (u.innerText = "job@kirifuda.co.jp"),
          (u.href = "mailto:job@kirifuda.co.jp"),
          r.appendChild(u);
        var c = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OVER,
          (c = function () {
            (e.btn_over_flg = !0),
              _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OVER, c]);
        var p = null;
        u.addEventListener(
          _.MouseEvent.MOUSE_OUT,
          (p = function () {
            (e.btn_over_flg = !1),
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
          })
        ),
          this.domListeners.push([u, _.MouseEvent.MOUSE_OUT, p]);
        var h = document.createElement("p");
        (h.className = "contact_right_note_jp"),
          (h.innerText =
            "\u30DD\u30FC\u30C8\u30D5\u30A9\u30EA\u30AA\u3092\u6DFB\u4ED8\u306E\u4E0A\u3001\u4E0A\u8A18\u306E\u30A2\u30C9\u30EC\u30B9\u307E\u3067\u3054\u5FDC\u52DF\u304F\u3060\u3055\u3044\u3002"),
          m.appendChild(h);
        var y = document.createElement("p");
        (y.className = "contact_right_note_en"),
          (y.innerText = "Please submit your portfolio to the address above."),
          m.appendChild(y),
          document.body.appendChild(a);
        var E = 0.2;
        gsap.to(this.planeContact.material.uniforms.u_contact_bg, {
          ease: "power4",
          value: "1",
          duration: 0.8,
          delay: E,
        }),
          this.titleTweens.push(this.plane.material.uniforms.u_contact_bg);
        var E = 0.5,
          b = n.querySelector(".contact_title");
        gsap.from(b, {
          ease: "power4",
          y: "+=140%",
          duration: 2,
          delay: E,
        }),
          (E += 0.1);
        var b = n.querySelector(".contact_left_desc_jp");
        gsap.from(b, {
          ease: "power4",
          y: "+=100px",
          scaleX: "+=0.2",
          scaleY: "+=0.2",
          opacity: 0,
          duration: 2.5,
          delay: E,
        }),
          (E += 0.1);
        var b = n.querySelector(".contact_left_desc_en");
        gsap.from(b, {
          ease: "power4",
          y: "+=100px",
          scaleX: "+=0.2",
          scaleY: "+=0.2",
          opacity: 0,
          duration: 2.5,
          delay: E,
        }),
          (E += 0.1);
        var b = n.querySelector(".contact_left_mail_span");
        gsap.from(b, {
          ease: "power4",
          y: "+=100px",
          scaleX: "+=0.2",
          scaleY: "+=0.2",
          opacity: 0,
          duration: 2.5,
          delay: E,
        }),
          (E += 0.1);
        var E = 0.5,
          b = m.querySelector(".contact_right_title_sub");
        gsap.from(b, {
          ease: "power4",
          y: "+=140%",
          duration: 2,
          delay: E,
        }),
          (E += 0.1);
        var b = m.querySelector(".contact_right_title");
        gsap.from(b, {
          ease: "power4",
          y: "+=140%",
          duration: 2,
          delay: E,
        }),
          (E += 0.1);
        var b = m.querySelector(".contact_right_desc");
        gsap.from(b, {
          ease: "power4",
          y: "+=100px",
          scaleX: "+=0.2",
          scaleY: "+=0.2",
          opacity: 0,
          duration: 2.5,
          delay: E,
        }),
          (E += 0.1);
        var b = m.querySelector(".contact_right_mail_span");
        gsap.from(b, {
          ease: "power4",
          y: "+=100px",
          scaleX: "+=0.2",
          scaleY: "+=0.2",
          opacity: 0,
          duration: 2.5,
          delay: E,
        }),
          (E += 0.1);
        var b = m.querySelector(".contact_right_note_jp");
        gsap.from(b, {
          ease: "power4",
          y: "+=100px",
          scaleX: "+=0.2",
          scaleY: "+=0.2",
          opacity: 0,
          duration: 2.5,
          delay: E,
        }),
          (E += 0.1);
        var b = m.querySelector(".contact_right_note_en");
        gsap.from(b, {
          ease: "power4",
          y: "+=100px",
          scaleX: "+=0.2",
          scaleY: "+=0.2",
          opacity: 0,
          duration: 2.5,
          delay: E,
        }),
          (E += 0.1),
          (this.scrollDomContent = null);
      }),
      (e.scrollDoms = function () {
        if (
          ("detail" == this.currentContent || "about" == this.currentContent) &&
          null != this.scrollDomContent
        ) {
          var e = this.scrollDomContent.clientHeight,
            t =
              this.renderer.renderer.domElement.height / this.renderer.quality,
            a = this.scrollDomContent.style.top.split("px")[0] >> 0,
            n = _.GLWheel.getInstance().delta;
          1 == Math.abs(n) && (n = 0);
          var r = a;
          (a -= n),
            0 < a ? (a = 0) : a < -e + t && (a = -e + t),
            (a >>= 0),
            e < t && (a = 0),
            (this.scrollDomContent.style.top = a + "px"),
            "detail" == this.currentContent &&
              (this.planeDetail.material.uniforms.u_detail_scroll.value = a),
            "about" == this.currentContent &&
              ((this.planeAbout.material.uniforms.u_about_delta.value +=
                0.001 * (r - a)),
              (this.planeAbout.material.uniforms.u_about_delta.value *= 0.85),
              (this.planeAbout.material.uniforms.u_about_y.value =
                (a +
                  this.scrollDomContent.clientHeight -
                  this.renderer.renderer.domElement.height /
                    this.renderer.quality) /
                (this.renderer.renderer.domElement.height /
                  this.renderer.quality)));
        }
      }),
      (e.resetDoms = function (e) {
        var t = this,
          a = function () {
            for (var e = 0, a = t.domListeners.length; e < a; e++)
              t.domListeners[e][0].removeEventListener(
                t.domListeners[e][1],
                t.domListeners[e][2]
              );
            t.domListeners = [];
            for (var e = 0, a = t.titleTweens.length; e < a; e++)
              gsap.killTweensOf(t.titleTweens[e]);
            t.titleTweens = [];
            var n =
              document.getElementById("contents") ||
              document.getElementById("about") ||
              document.getElementById("contact");
            n && document.body.removeChild(n);
            var r = document.getElementById("about_title");
            r && document.body.removeChild(r);
            var s = document.getElementById("detail_title");
            s && document.body.removeChild(s);
          };
        null == e
          ? a()
          : (gsap.to(this.coverDom, 0.18, {
              onComplete: function () {
                a(), e();
              },
            }),
            gsap.fromTo(
              this.coverDom,
              1.5,
              {
                y: "100%",
              },
              {
                y: "-100%",
                ease: "power4",
              }
            ),
            gsap.fromTo(
              this.planeAbout.material.uniforms.u_about_cover,
              0.18,
              {
                value: 0,
              },
              {
                value: 1,
                ease: "power4",
              }
            ));
      }),
      (e.getHoverRect = function () {
        var e = this.renderer.renderer.domElement.width,
          t = this.renderer.renderer.domElement.height,
          a = 2732,
          n = 1564,
          r = 0.377745241581259,
          s = 0.869326500732064,
          o = 0.491581259150805,
          l = 0.214833759590793,
          i = 0.785166240409207,
          d = e / this.renderer.quality,
          u = t / this.renderer.quality;
        if (1 < e / t / 1.746803069053708) {
          var c = ((e - (o * a * t) / n) * (r / (r + 1 - s))) / e;
          return [c * d, (c + (o * a * t) / n / e) * d, l * u, i * u];
        }
        return (
          (l = (0.5 * (t - (0.570332480818414 * n * e) / a)) / t),
          (i = 1 - l),
          [r * d, s * d, l * u, i * u]
        );
      }),
      (e.setMousePosition = function (e, n) {
        var r =
            this.renderer.renderer.domElement.style.left.split("px")[0] >> 0,
          s = this.renderer.renderer.domElement.style.top.split("px")[0] >> 0;
        (e -= r), (n -= s);
        var o = (this.hit = []);
        if ("works" == this.currentContent) {
          var l = this.getHoverRect();
          e > l[0] && e < l[1] && n > l[2] && n < l[3]
            ? ((this.plane.material.uniforms.u_glitch.value =
                this.planeMain.material.uniforms.u_glitch.value =
                  0.003),
              o.push("typo"))
            : (this.plane.material.uniforms.u_glitch.value =
                this.planeMain.material.uniforms.u_glitch.value =
                  0);
        }
        var i = this.renderer.renderer.domElement.width,
          d = this.renderer.renderer.domElement.height;
        if (
          ((e *= this.renderer.quality),
          (n *= this.renderer.quality),
          e > i - 85.5 * this.renderer.quality &&
          e < i - 50.5 * this.renderer.quality &&
          n > 45 * this.renderer.quality &&
          n < 340 * this.renderer.quality
            ? n < 91 * this.renderer.quality ||
              (n > 119.5 * this.renderer.quality &&
              n < 173 * this.renderer.quality
                ? "works" != this.currentContent &&
                  (gsap.to(this.plane.material.uniforms.u_works_alpha, 0.1, {
                    value: a,
                    ease: Linear.easeNone,
                  }),
                  gsap.to(this.planeMain.material.uniforms.u_works_alpha, 0.1, {
                    value: a,
                    ease: Linear.easeNone,
                  }),
                  gsap.to(
                    this.planeDetail.material.uniforms.u_works_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  gsap.to(
                    this.planeAbout.material.uniforms.u_works_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  gsap.to(
                    this.planeContact.material.uniforms.u_works_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  o.push("works"))
                : n > 197.5 * this.renderer.quality &&
                  n < 246 * this.renderer.quality
                ? "about" != this.currentContent &&
                  (gsap.to(this.plane.material.uniforms.u_about_alpha, 0.1, {
                    value: a,
                    ease: Linear.easeNone,
                  }),
                  gsap.to(this.planeMain.material.uniforms.u_about_alpha, 0.1, {
                    value: a,
                    ease: Linear.easeNone,
                  }),
                  gsap.to(
                    this.planeDetail.material.uniforms.u_about_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  gsap.to(
                    this.planeAbout.material.uniforms.u_about_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  gsap.to(
                    this.planeContact.material.uniforms.u_about_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  o.push("about"))
                : n > 271.5 * this.renderer.quality &&
                  n < 336 * this.renderer.quality
                ? "contact" != this.currentContent &&
                  (gsap.to(this.plane.material.uniforms.u_contact_alpha, 0.1, {
                    value: a,
                    ease: Linear.easeNone,
                  }),
                  gsap.to(
                    this.planeMain.material.uniforms.u_contact_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  gsap.to(
                    this.planeDetail.material.uniforms.u_contact_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  gsap.to(
                    this.planeAbout.material.uniforms.u_contact_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  gsap.to(
                    this.planeContact.material.uniforms.u_contact_alpha,
                    0.1,
                    {
                      value: a,
                      ease: Linear.easeNone,
                    }
                  ),
                  o.push("contact"))
                : ("works" != this.currentContent &&
                    (gsap.to(this.plane.material.uniforms.u_works_alpha, 0.1, {
                      value: t,
                      ease: Linear.easeNone,
                    }),
                    gsap.to(
                      this.planeMain.material.uniforms.u_works_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeDetail.material.uniforms.u_works_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeAbout.material.uniforms.u_works_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeContact.material.uniforms.u_works_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    )),
                  "about" != this.currentContent &&
                    (gsap.to(this.plane.material.uniforms.u_about_alpha, 0.1, {
                      value: t,
                      ease: Linear.easeNone,
                    }),
                    gsap.to(
                      this.planeMain.material.uniforms.u_about_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeDetail.material.uniforms.u_about_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeAbout.material.uniforms.u_about_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeContact.material.uniforms.u_about_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    )),
                  "contact" != this.currentContent &&
                    (gsap.to(
                      this.plane.material.uniforms.u_contact_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeMain.material.uniforms.u_contact_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeDetail.material.uniforms.u_contact_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeAbout.material.uniforms.u_contact_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ),
                    gsap.to(
                      this.planeContact.material.uniforms.u_contact_alpha,
                      0.1,
                      {
                        value: t,
                        ease: Linear.easeNone,
                      }
                    ))))
            : ("works" != this.currentContent &&
                (gsap.to(this.plane.material.uniforms.u_works_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(this.planeMain.material.uniforms.u_works_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(this.planeDetail.material.uniforms.u_works_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(this.planeAbout.material.uniforms.u_works_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(
                  this.planeContact.material.uniforms.u_works_alpha,
                  0.1,
                  {
                    value: t,
                    ease: Linear.easeNone,
                  }
                )),
              "about" != this.currentContent &&
                (gsap.to(this.plane.material.uniforms.u_about_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(this.planeMain.material.uniforms.u_about_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(this.planeDetail.material.uniforms.u_about_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(this.planeAbout.material.uniforms.u_about_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(
                  this.planeContact.material.uniforms.u_about_alpha,
                  0.1,
                  {
                    value: t,
                    ease: Linear.easeNone,
                  }
                )),
              "contact" != this.currentContent &&
                (gsap.to(this.plane.material.uniforms.u_contact_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(this.planeMain.material.uniforms.u_contact_alpha, 0.1, {
                  value: t,
                  ease: Linear.easeNone,
                }),
                gsap.to(
                  this.planeDetail.material.uniforms.u_contact_alpha,
                  0.1,
                  {
                    value: t,
                    ease: Linear.easeNone,
                  }
                ),
                gsap.to(
                  this.planeAbout.material.uniforms.u_contact_alpha,
                  0.1,
                  {
                    value: t,
                    ease: Linear.easeNone,
                  }
                ),
                gsap.to(
                  this.planeContact.material.uniforms.u_contact_alpha,
                  0.1,
                  {
                    value: t,
                    ease: Linear.easeNone,
                  }
                ))),
          0 < o.length)
        )
          switch (o[0]) {
            case "typo":
              if ("works" != this.currentContent) return;
              (this.renderer.renderer.domElement.style.cursor = "pointer"),
                _.CVCursor.getInstance().setState(_.CVCursor.HOVER_WITH_VIDEO);
              break;
            case "logo":
            case "works":
            case "about":
            case "contact":
              (this.renderer.renderer.domElement.style.cursor = "pointer"),
                _.CVCursor.getInstance().setState(_.CVCursor.HOVER);
          }
        else
          (this.renderer.renderer.domElement.style.cursor = "auto"),
            this.btn_over_flg ||
              _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
      }),
      (e.setMouseClick = function () {
        if (this.clickEnabled)
          if (0 < this.hit.length) {
            switch (this.hit[0]) {
              case "typo":
                var e = this;
                (this.clickEnabled = !1),
                  (_.GLWheel.getInstance().dispatchLocked = !0),
                  (this.currentContent = "detail"),
                  (this.renderer.renderer.domElement.style.cursor = "auto"),
                  (this.plane.material.uniforms.u_glitch.value =
                    this.planeMain.material.uniforms.u_glitch.value =
                      0),
                  gsap.to(this.plane.material.uniforms.u_flow, 0.8, {
                    value: 1,
                    ease: Sine.easeIn,
                  }),
                  this.titleTweens.push(this.plane.material.uniforms.u_flow),
                  gsap.to(this.planeMain.material.uniforms.u_flow, 0.8, {
                    value: 1,
                    ease: Sine.easeIn,
                    onComplete: function () {
                      _.GLSceneManager.getInstance().setScene(
                        _.GLSceneManager.SCENE_WORKS_DETAIL,
                        !0
                      ),
                        _.CVCursor.getInstance().play(),
                        (e.clickEnabled = !0),
                        (_.GLWheel.getInstance().delta = 0),
                        (_.GLWheel.getInstance().dispatchLocked = !1);
                    },
                  }),
                  this.titleTweens.push(
                    this.planeMain.material.uniforms.u_flow
                  ),
                  _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT);
                break;
              case "works":
                if ("works" == this.currentContent) return;
                var e = this;
                (_.GLWheel.getInstance().dispatchLocked = !0),
                  this.resetDoms(function () {
                    (e.currentContent = "works"),
                      (e.renderer.renderer.domElement.style.cursor = "auto"),
                      (e.plane.material.uniforms.u_glitch.value =
                        e.planeMain.material.uniforms.u_glitch.value =
                          0),
                      (e.plane.material.uniforms.u_flow.value =
                        e.planeMain.material.uniforms.u_flow.value =
                          0),
                      _.GLSceneManager.getInstance().setScene(
                        _.GLSceneManager.SCENE_WORKS_LIST,
                        !0
                      ),
                      _.CVCursor.getInstance().play(),
                      _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT),
                      (_.GLWheel.getInstance().dispatchLocked = !1);
                  });
                break;
              case "about":
                if ("about" == this.currentContent) return;
                var e = this;
                (_.GLWheel.getInstance().dispatchLocked = !0),
                  this.resetDoms(function () {
                    (e.currentContent = "about"),
                      (e.renderer.renderer.domElement.style.cursor = "auto"),
                      (e.plane.material.uniforms.u_glitch.value =
                        e.planeMain.material.uniforms.u_glitch.value =
                          0),
                      _.GLSceneManager.getInstance().setScene(
                        _.GLSceneManager.SCENE_ABOUT,
                        !0
                      ),
                      _.CVCursor.getInstance().pause(),
                      _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT),
                      (_.GLWheel.getInstance().dispatchLocked = !1);
                  });
                break;
              case "contact":
                if ("contact" == this.currentContent) return;
                var e = this;
                (_.GLWheel.getInstance().dispatchLocked = !0),
                  this.resetDoms(function () {
                    (e.currentContent = "contact"),
                      (e.renderer.renderer.domElement.style.cursor = "auto"),
                      (e.plane.material.uniforms.u_glitch.value =
                        e.planeMain.material.uniforms.u_glitch.value =
                          0),
                      _.GLSceneManager.getInstance().setScene(
                        _.GLSceneManager.SCENE_CONTACT,
                        !0
                      ),
                      _.CVCursor.getInstance().pause(),
                      _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT),
                      (_.GLWheel.getInstance().dispatchLocked = !1);
                  });
            }
            this.hit = [];
          } else if ("detail" == this.currentContent && !this.btn_over_flg) {
            if (this.isPageMoving) return;
            this.isPageMoving = !0;
            var e = this;
            (_.GLWheel.getInstance().dispatchLocked = !0),
              this.resetDoms(function () {
                (e.currentContent = "works"),
                  (e.renderer.renderer.domElement.style.cursor = "auto"),
                  (e.plane.material.uniforms.u_glitch.value =
                    e.planeMain.material.uniforms.u_glitch.value =
                      0),
                  (e.plane.material.uniforms.u_flow.value =
                    e.planeMain.material.uniforms.u_flow.value =
                      0),
                  _.GLSceneManager.getInstance().setScene(
                    _.GLSceneManager.SCENE_WORKS_LIST,
                    !0
                  ),
                  _.CVCursor.getInstance().play(),
                  _.CVCursor.getInstance().setState(_.CVCursor.DEFAULT),
                  (e.isPageMoving = !1),
                  (_.GLWheel.getInstance().dispatchLocked = !1);
              });
          }
      }),
      (e.setMenuOn = function () {
        var e = "works" == this.currentContent ? a : t;
        gsap.to(this.plane.material.uniforms.u_works_alpha, 0.1, {
          value: e,
          ease: Linear.easeNone,
        }),
          gsap.to(this.planeMain.material.uniforms.u_works_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeDetail.material.uniforms.u_works_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeAbout.material.uniforms.u_works_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeContact.material.uniforms.u_works_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          });
        var e = "about" == this.currentContent ? a : t;
        gsap.to(this.plane.material.uniforms.u_about_alpha, 0.1, {
          value: e,
          ease: Linear.easeNone,
        }),
          gsap.to(this.planeMain.material.uniforms.u_about_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeDetail.material.uniforms.u_about_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeAbout.material.uniforms.u_about_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeContact.material.uniforms.u_about_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          });
        var e = "contact" == this.currentContent ? a : t;
        gsap.to(this.plane.material.uniforms.u_contact_alpha, 0.1, {
          value: e,
          ease: Linear.easeNone,
        }),
          gsap.to(this.planeMain.material.uniforms.u_contact_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeDetail.material.uniforms.u_contact_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeAbout.material.uniforms.u_contact_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          }),
          gsap.to(this.planeContact.material.uniforms.u_contact_alpha, 0.1, {
            value: e,
            ease: Linear.easeNone,
          });
      }),
      (e.render = function () {
        (this.plane.material.uniforms.map.value.needsUpdate = !0),
          this.locked ||
            ((this.plane.material.uniforms.u_pow.value +=
              0.003 * (Math.abs(_.GLWheel.getInstance().delta) - 1)),
            (this.planeMain.material.uniforms.u_pow.value =
              this.plane.material.uniforms.u_pow.value)),
          (this.plane.material.uniforms.u_pow.value *= 0.92),
          (this.plane.material.uniforms.u_time.value += 0.1),
          (this.planeMain.material.uniforms.u_pow.value =
            this.plane.material.uniforms.u_pow.value),
          (this.planeMain.material.uniforms.u_time.value =
            this.plane.material.uniforms.u_time.value),
          e._super.render.apply(this, arguments),
          this.scrollDoms();
      }),
      (e.resize = function () {
        e._super.resize.apply(this, arguments);
        var t = this.renderer.renderer.domElement.width * this.renderer.quality,
          a = this.renderer.renderer.domElement.height * this.renderer.quality;
        (this.camera = new THREE.OrthographicCamera(0, t, 0, a, 0.001, 1e4)),
          this.camera.updateProjectionMatrix(),
          this.plane.position.set(0.5 * t, 0.5 * a, -0.1),
          this.plane.scale.set(t, -a, 1),
          this.planeMain.position.set(0.5 * t, 0.5 * a, -0.1),
          this.planeMain.scale.set(t, -a, 1),
          this.planeDetail.position.set(0.5 * t, 0.5 * a, -0.1),
          this.planeDetail.scale.set(t, -a, 1),
          this.planeAbout.position.set(0.5 * t, 0.5 * a, -0.1),
          this.planeAbout.scale.set(t, -a, 1),
          this.planeContact.position.set(0.5 * t, 0.5 * a, -0.1),
          this.planeContact.scale.set(t, -a, 1),
          (this.plane.material.uniforms.u_screen.value.x =
            this.renderer.renderer.domElement.width),
          (this.plane.material.uniforms.u_screen.value.y =
            this.renderer.renderer.domElement.height),
          (this.planeMain.material.uniforms.u_screen.value.x =
            this.renderer.renderer.domElement.width),
          (this.planeMain.material.uniforms.u_screen.value.y =
            this.renderer.renderer.domElement.height),
          (this.planeDetail.material.uniforms.u_screen.value.x =
            this.renderer.renderer.domElement.width),
          (this.planeDetail.material.uniforms.u_screen.value.y =
            this.renderer.renderer.domElement.height),
          (this.planeAbout.material.uniforms.u_screen.value.x =
            this.renderer.renderer.domElement.width),
          (this.planeAbout.material.uniforms.u_screen.value.y =
            this.renderer.renderer.domElement.height),
          (this.planeContact.material.uniforms.u_screen.value.x =
            this.renderer.renderer.domElement.width),
          (this.planeContact.material.uniforms.u_screen.value.y =
            this.renderer.renderer.domElement.height);
      }),
      e._self
    );
  })()),
  (_.GLBGPass = (function () {
    var e = _.ClassFactory.create(_.GLAbstractPass);
    (e.quality = 1.5),
      (e.plane = null),
      (e.canvas = null),
      (e.ctx = null),
      (e.rects = []),
      (e.drawing = !1),
      (e.locked = !1),
      (e.clientNameLines = 0);
    var t = !1,
      a = 1;
    e.lineTween = {
      value: 1,
      needsUpdate: !0,
    };
    var n = function () {
      var e = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "[",
        "]",
        "#",
        "&",
        "%",
        "=",
        "-",
      ];
      return (
        (e = e.sort(function () {
          return Math.random() - 0.5;
        })),
        e.join("")
      );
    };
    (e.init = function (n, r) {
      e._super.init.apply(this, arguments),
        (win = _.Window.getInstance()),
        (t = -1 !== navigator.userAgent.toLowerCase().indexOf("windows")),
        t &&
          (-1 === navigator.userAgent.toLowerCase().indexOf("firefox")
            ? (a = 2)
            : (a = 1));
      var s = this.renderer.renderer.domElement.width * n.quality,
        o = this.renderer.renderer.domElement.height * n.quality;
      (this.canvas = document.createElement("canvas")),
        (this.canvas.width = 512 * a),
        (this.canvas.height = 700 * a);
      var l = this.canvas.getContext("2d");
      this.ctx = l;
      var i = 32 * a,
        d = 22 * a;
      (d += 64 * a), (d += 46 * a);
      var u = {
        x: i,
        y: d - 38 * a,
        width: 0,
        height: 44 * a,
      };
      this.rects.push(u), (d += 48 * a);
      var u = {
        x: i,
        y: d - 38 * a,
        width: 0,
        height: 44 * a,
      };
      this.rects.push(u), (d += 48 * a);
      var u = {
        x: i,
        y: d - 38 * a,
        width: 0,
        height: 44 * a,
      };
      this.rects.push(u), (d += 48 * a);
      var u = {
        x: i,
        y: d - 38 * a,
        width: 0,
        height: 44 * a,
      };
      this.rects.push(u), (d += 48 * a);
      var u = {
        x: i,
        y: d - 38 * a,
        width: 0,
        height: 44 * a,
      };
      this.rects.push(u), (d += 48 * a), (d += 16 * a), (d += 28 * a);
      var u = {
        x: i,
        y: d - 20 * a,
        width: 0,
        height: 24 * a,
      };
      this.rects.push(u), (d += 64 * a), (d += 28 * a);
      var u = {
        x: i,
        y: d - 20 * a,
        width: 0,
        height: 24 * a,
      };
      this.rects.push(u), (d += 64 * a), (d += 28 * a);
      var u = {
        x: i,
        y: d - 20 * a,
        width: 0,
        height: 24 * a,
      };
      this.rects.push(u),
        this.resetSentence(),
        (this.plane = new THREE.Sprite(
          new THREE.ShaderMaterial({
            uniforms: {
              u_map: {
                type: "t",
                value: new THREE.Texture(this.canvas),
              },
              u_noise: {
                type: "t",
                value: r[0],
              },
              u_pow: {
                type: "f",
                value: 0,
              },
              u_time: {
                type: "f",
                value: 0,
              },
              u_screen: {
                type: "v2",
                value: new THREE.Vector2(
                  this.renderer.renderer.domElement.width,
                  this.renderer.renderer.domElement.height
                ),
              },
              u_position: {
                type: "f",
                value: 0,
              },
              u_max: {
                type: "f",
                value: 3,
              },
            },
            vertexShader:
              "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
            fragmentShader:
              "uniform sampler2D u_map;uniform sampler2D u_noise;uniform float u_pow;uniform float u_time;varying vec2 vUv;uniform vec2 u_screen;uniform float u_position;uniform float u_max;void main() {float base_width = 2732.;float base_height = 1564.;float base_aspect = 1.746803069053708;float aspect = u_screen.x / u_screen.y;float su = 0.377745241581259;float eu = 0.869326500732064;float eu_su = 0.491581259150805;float sv = 0.214833759590793;float ev = 0.785166240409207;float ev_sv = 0.570332480818414;float su_su_1_eu = 0.742980561555075;vec2 uv = vUv;float rate = 1.0;if (aspect / base_aspect > 1.) {float rate_r = 0.000757142857143;rate = u_screen.y * rate_r;uv -= vec2(0.171669106881406, 0.254);} else {float rate_r = 0.000439453125;rate = u_screen.x * rate_r;float t0 = 0.5 / u_screen.y;sv = u_screen.y * t0 - u_screen.x * 0.326500732064421 * t0;uv -= vec2(0.171669106881406, sv + 0.022 * rate);}uv = ((uv - vec2(.25,.25)) * (u_pow * 0.8 + 1.0)) + vec2(.25,.25);uv.x /= rate * 512.0 / u_screen.x;uv.y /= rate * 700.0 / u_screen.y;vec2 calucUV = uv;float addpos = mod(u_position, 2.0 * u_max);uv.y -= addpos;if ((uv.x < 0.0 || uv.x > 1.0) || (mod(uv.y, 2.0) < 0.0 || mod(uv.y, 2.0) > 1.0 || calucUV.y > 1.5 || calucUV.y < -0.5)) {float noise = texture2D(u_noise, vUv).r;vec2 m = vec2(0.5, -0.5);vec2 p = vec2(vUv.x, vUv.y - 1.0);float t = clamp(clamp(1.0 - length(m - p), 0.0, 1.0) * u_pow * 0.1, 0.0, 1.0);float v = pow(noise * t, 0.3) + t;if (v < 0.2) {uv -= (noise - 0.4 + 0.2) * 0.06;vec4 outcol = texture2D(u_map, uv);gl_FragColor = vec4(outcol.rgb, pow(v * 2.7, 2.0) * 0.9);} else {gl_FragColor = texture2D(u_map, uv);}} else {gl_FragColor = texture2D(u_map, uv);}gl_FragColor.a *= 1.0 - u_pow * 0.2;}",
            transparent: !0,
            alphaTest: 0.01,
          })
        )),
        this.plane.position.set(0.5 * s, 0.5 * o, -0.1),
        this.plane.scale.set(s, -o, 1),
        this.scene.add(this.plane),
        (this.plane.material.uniforms.u_map.value.wrapS = THREE.RepeatWrapping),
        (this.plane.material.uniforms.u_map.value.wrapT = THREE.RepeatWrapping),
        (this.plane.material.uniforms.u_map.value.premultiplyAlpha = !1),
        (this.plane.material.uniforms.u_map.value.needsUpdate = !0);
      var c = this;
      _.GLWheel.getInstance().addEventListener(
        _.GLEvent.LIST_INDEX_CHANGE,
        function (t) {
          if (t.params && t.params.force) {
            var e =
              2 *
              (_.GLWheel.getInstance().position /
                (0.5 * c.renderer.renderer.domElement.height));
            (c.plane.material.uniforms.u_position.value = e),
              c.resetSentence(),
              (c.plane.material.uniforms.u_map.value.needsUpdate = !0);
          }
        }
      );
    }),
      (e.resetSentence = function () {
        var e =
          _.GLWheel.getInstance().index %
          _.GLAssetsLoader.getInstance().works.works.length;
        0 > e && (e += _.GLAssetsLoader.getInstance().works.works.length);
        var n = _.GLAssetsLoader.getInstance().works.works[e],
          r = this.ctx;
        r.clearRect(0, 0, 512 * a, 700 * a);
        var s = 32 * a,
          o = 22 * a;
        (r.fillStyle = "rgb(255, 255, 255)"),
          (r.font = "700 " + 26 * a + "px Padauk"),
          r.fillText(
            "WORKS " +
              (e + 1) +
              " / " +
              _.GLAssetsLoader.getInstance().works.works.length,
            s,
            o
          ),
          (o += 64 * a),
          (r.fillStyle = "rgb(90, 90, 90)"),
          (r.font = "200 " + 23 * a + "px Oswald"),
          r.fillText("CLIENT", s, o),
          t &&
            ((r.strokeStyle = "rgb(90, 90, 90)"),
            (r.lineWidth = 0.2),
            r.strokeText("CLIENT", s, o)),
          (o += 46 * a),
          (r.fillStyle = "rgb(255, 255, 255)"),
          (r.font = "800 " + 50 * a + "px Padauk");
        for (
          var l = n.list_client_name.split("\n"), d = 0, u = l.length;
          d < u;
          d++
        )
          r.fillText(l[d], s, o), (o += 48 * a);
        (o += 16 * a),
          (r.fillStyle = "rgb(90, 90, 90)"),
          (r.font = "200 " + 23 * a + "px Oswald"),
          r.fillText("TYPE", s, o),
          t &&
            ((r.strokeStyle = "rgb(90, 90, 90)"),
            (r.lineWidth = 0.2),
            r.strokeText("TYPE", s, o)),
          (o += 28 * a),
          (r.fillStyle = "rgb(255, 255, 255)"),
          (r.font = "400 " + 24 * a + "px Padauk"),
          r.fillText(n.type, s, o),
          t &&
            ((r.strokeStyle = "rgb(255, 255, 255)"),
            (r.lineWidth = 0.5),
            r.strokeText(n.type, s, o)),
          (o += 64 * a),
          (r.fillStyle = "rgb(90, 90, 90)"),
          (r.font = "200 " + 23 * a + "px Oswald"),
          r.fillText("AGENCY", s, o),
          t &&
            ((r.strokeStyle = "rgb(90, 90, 90)"),
            (r.lineWidth = 0.2),
            r.strokeText("AGENCY", s, o)),
          (o += 28 * a),
          (r.fillStyle = "rgb(255, 255, 255)"),
          (r.font = "400 " + 24 * a + "px Padauk"),
          r.fillText(n.agency, s, o),
          t &&
            ((r.strokeStyle = "rgb(255, 255, 255)"),
            (r.lineWidth = 0.5),
            r.strokeText(n.agency, s, o)),
          (o += 64 * a),
          (r.fillStyle = "rgb(90, 90, 90)"),
          (r.font = "200 " + 23 * a + "px Oswald"),
          r.fillText("RELEASE DATE", s, o),
          t &&
            ((r.strokeStyle = "rgb(90, 90, 90)"),
            (r.lineWidth = 0.2),
            r.strokeText("RELEASE DATE", s, o)),
          (o += 28 * a),
          (r.fillStyle = "rgb(255, 255, 255)"),
          (r.font = "400 " + 24 * a + "px Padauk"),
          r.fillText(n.date, s, o),
          t &&
            ((r.strokeStyle = "rgb(255, 255, 255)"),
            (r.lineWidth = 0.5),
            r.strokeText(n.date, s, o)),
          (o += 76 * a),
          (this.clientNameLines = l.length),
          (this.lineTween.value = 0);
        var c = this;
        gsap.to(this.lineTween, 0.5, {
          value: 1,
          onUpdate: function () {
            r.clearRect(2 * a, o - 20 * a, 512 * a, 700 * a);
            var e = "To see more of this work,",
              n =
                0.5 < c.lineTween.value
                  ? e.length
                  : 2 * (e.length * c.lineTween.value);
            (r.fillStyle = "rgb(150, 150, 150)"),
              (r.font = "200 " + 20 * a + "px Padauk"),
              r.fillText(e.substr(0, n), s, o),
              t &&
                ((r.strokeStyle = "rgb(150, 150, 150)"),
                (r.lineWidth = 0.5),
                r.strokeText(e.substr(0, n), s, o));
            var e = "press the typography to the right.",
              n =
                0.5 > c.lineTween.value
                  ? 0
                  : 2 * (e.length * (c.lineTween.value - 0.5));
            (r.fillStyle = "rgb(150, 150, 150)"),
              (r.font = "200 " + 20 * a + "px Padauk"),
              r.fillText(e.substr(0, n), s, o + 20 * a),
              t &&
                ((r.strokeStyle = "rgb(150, 150, 150)"),
                (r.lineWidth = 0.5),
                r.strokeText(e.substr(0, n), s, o + 20 * a)),
              r.clearRect(0, 0, 2 * a, 700 * a),
              (r.fillStyle = "rgb(65, 65, 65)"),
              r.fillRect(0, 1 * a, 2 * a, (o + 22 * a) * c.lineTween.value),
              (c.lineTween.needsUpdate = !0);
          },
          onComplete: function () {
            c.lineTween.needsUpdate = !0;
          },
        });
      }),
      (e.startRects = function () {
        var e =
          _.GLWheel.getInstance().index %
          _.GLAssetsLoader.getInstance().works.works.length;
        0 > e && (e += _.GLAssetsLoader.getInstance().works.works.length);
        var t = _.GLAssetsLoader.getInstance().works.works[e],
          n = t.list_client_name.split("\n");
        this.drawing = !0;
        for (var r, s = this, o = 0, l = 0; l < n.length; l++)
          (r = this.rects[l]),
            gsap.killTweensOf(r),
            (r.x = 6 * a),
            (r.width = 0),
            gsap.fromTo(
              r,
              0.4,
              {
                width: 0,
              },
              {
                delay: o,
                width: 380 * a,
                ease: Quint.easeIn,
                onComplete: function (e) {
                  gsap.fromTo(
                    e,
                    0.25,
                    {
                      x: 6 * a,
                      width: 380 * a,
                    },
                    {
                      x: 386 * a,
                      width: 0,
                      ease: Quint.easeOut,
                      onComplete: function () {
                        (e.x = 6 * a), (e.width = 0);
                      },
                    }
                  );
                },
                onCompleteParams: [r, l, this.rects.length],
              }
            ),
            (o += 2 == l ? 0.15 : 0.05);
        for (var r, l = 5; l < this.rects.length; l++)
          (r = this.rects[l]),
            gsap.killTweensOf(r),
            (r.x = 6 * a),
            (r.y = 94 * a + 48 * a * n.length + 60 * a + 92 * (l - 5) * a),
            (r.width = 0),
            gsap.fromTo(
              r,
              0.4,
              {
                width: 0,
              },
              {
                delay: o,
                width: 380 * a,
                ease: Quint.easeIn,
                onComplete: function (e, t, n) {
                  gsap.fromTo(
                    e,
                    0.25,
                    {
                      x: 6 * a,
                      width: 380 * a,
                    },
                    {
                      x: 386 * a,
                      width: 0,
                      ease: Quint.easeOut,
                      onComplete: function () {
                        (e.x = 6 * a),
                          (e.width = 0),
                          t == n - 1 && (s.drawing = !1);
                      },
                    }
                  );
                },
                onCompleteParams: [r, l, this.rects.length],
              }
            ),
            (o += 2 == l ? 0.15 : 0.05);
      }),
      (e.drawRects = function () {
        for (var e, t = this.ctx, a = 0; a < this.rects.length; a++)
          (e = this.rects[a]), t.fillRect(e.x, e.y, e.width, e.height);
      });
    var r = 0,
      s = 0,
      o = 0;
    return (
      (e.render = function () {
        var t = !1;
        if (
          (this.locked ||
            (s += 0.003 * (Math.abs(_.GLWheel.getInstance().delta) - 1)),
          (s *= 0.92),
          r++,
          1 == r % 2 && 0.1 < s)
        ) {
          var l =
            _.GLWheel.getInstance().index %
            _.GLAssetsLoader.getInstance().works.works.length;
          0 > l && (l += _.GLAssetsLoader.getInstance().works.works.length);
          var d = _.GLAssetsLoader.getInstance().works.works[l],
            u = this.ctx;
          u.clearRect(0, 0, 512 * a, 700 * a);
          var c = 32 * a,
            p = 22 * a;
          (u.fillStyle = "rgb(255, 255, 255)"),
            (u.font = "700 " + 26 * a + "px Padauk"),
            u.fillText(
              "WORKS " +
                (l + 1) +
                " / " +
                _.GLAssetsLoader.getInstance().works.works.length,
              c,
              p
            ),
            (p += 64 * a),
            (u.fillStyle = "rgb(90, 90, 90)"),
            (u.font = "200 " + 23 * a + "px Oswald"),
            u.fillText("CLIENT", c, p),
            (p += 46 * a),
            (u.fillStyle = "rgb(255, 255, 255)"),
            (u.font = "800 " + 50 * a + "px Padauk");
          var m = d.list_client_name.split("\n");
          this.clientNameLines += 0.2 * (m.length - this.clientNameLines);
          for (var v = 0, C = Math.round(this.clientNameLines); v < C; v++)
            v < m.length
              ? u.fillText(n().substr(0, m[v].length), c, p)
              : u.fillText(n().substr(0, 8), c, p),
              (p += 48 * a);
          (p += 16 * a),
            (u.fillStyle = "rgb(90, 90, 90)"),
            (u.font = "200 " + 23 * a + "px Oswald"),
            u.fillText("TYPE", c, p),
            (p += 28 * a),
            (u.fillStyle = "rgb(255, 255, 255)"),
            (u.font = "400 " + 24 * a + "px Padauk"),
            u.fillText(n().substr(0, d.type.length), c, p),
            (p += 64 * a),
            (u.fillStyle = "rgb(90, 90, 90)"),
            (u.font = "200 " + 23 * a + "px Oswald"),
            u.fillText("AGENCY", c, p),
            (p += 28 * a),
            (u.fillStyle = "rgb(255, 255, 255)"),
            (u.font = "400 " + 24 * a + "px Padauk"),
            u.fillText(n().substr(0, d.agency.length), c, p),
            (p += 64 * a),
            (u.fillStyle = "rgb(90, 90, 90)"),
            (u.font = "200 " + 23 * a + "px Oswald"),
            u.fillText("RELEASE DATE", c, p),
            (p += 28 * a),
            (u.fillStyle = "rgb(255, 255, 255)"),
            (u.font = "400 " + 24 * a + "px Padauk"),
            u.fillText(n().substr(0, d.date.length), c, p),
            (t = !0);
        }
        if (
          (0.1 >= o && 0.1 < s
            ? this.startRects()
            : 0.1 < o && 0.1 >= s && (this.resetSentence(), (t = !0)),
          0.1 < s && (this.drawRects(), (t = !0)),
          (o = s),
          (t || this.lineTween.needsUpdate) &&
            ((this.plane.material.uniforms.u_map.value.needsUpdate = !0),
            (this.lineTween.needsUpdate = !1)),
          !this.locked)
        ) {
          var g =
            2 *
            (_.GLWheel.getInstance().position /
              (0.5 * this.renderer.renderer.domElement.height));
          (this.plane.material.uniforms.u_position.value +=
            0.1 * (g - this.plane.material.uniforms.u_position.value)),
            (this.plane.material.uniforms.u_pow.value +=
              0.003 * (Math.abs(_.GLWheel.getInstance().delta) - 1));
        }
        (this.plane.material.uniforms.u_pow.value *= 0.92),
          (this.plane.material.uniforms.u_pow.value = Math.max(
            this.plane.material.uniforms.u_pow.value,
            0
          )),
          e._super.render.apply(this, arguments);
      }),
      (e.setPow = function (e) {
        this.plane.material.uniforms.u_pow.value = e;
      }),
      (e.resize = function () {
        e._super.resize.apply(this, arguments);
        var t = this.renderer.renderer.domElement.width,
          a = this.renderer.renderer.domElement.height;
        (this.camera = new THREE.OrthographicCamera(0, t, 0, a, 0.001, 1e4)),
          this.camera.updateProjectionMatrix(),
          this.plane.position.set(0.5 * t, 0.5 * a, -0.1),
          this.plane.scale.set(t, -a, 1),
          (this.plane.material.uniforms.u_screen.value.x =
            this.renderer.renderer.domElement.width),
          (this.plane.material.uniforms.u_screen.value.y =
            this.renderer.renderer.domElement.height);
      }),
      e._self
    );
  })()),
  (_.GLNoisePass = (function () {
    var e = _.ClassFactory.create(_.GLAbstractPass);
    return (
      (e.plane = null),
      (e.init = function (t) {
        e._super.init.apply(this, arguments), (win = _.Window.getInstance());
        var a = this.renderer.renderer.domElement.width * t.quality,
          n = this.renderer.renderer.domElement.height * t.quality;
        (this.plane = new THREE.Sprite(
          new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader:
              "varying vec2 vUv;void main() {vUv = uv;vec4 worldPosition = modelMatrix * vec4( position, 1.0 );vec4 mvPosition =  viewMatrix * worldPosition;gl_Position = projectionMatrix * mvPosition;}",
            fragmentShader:
              "varying vec2 vUv;float random (in vec2 _st) {float a = fract(dot(_st.xy, vec2(2.067390879775102, 12.451168662908249))) - 0.5;float s = a * (6.182785114200511 + a*a * (-38.026512460676566 + a*a * 53.392573080032137));return fract(s * 43758.5453);}float noise (in vec2 _st) {vec2 i = floor(_st);vec2 f = fract(_st);float a = random(i);float b = random(i + vec2(1.0, 0.0));float c = random(i + vec2(0.0, 1.0));float d = random(i + vec2(1.0, 1.0));vec2 u = f * f * (3.0 - 2.0 * f);return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;}float fbm (in vec2 _st) {float v = 0.0;float a = 0.5;vec2 shift = vec2(100.0);mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));for (int i = 0; i < 4; ++i) {\tv += a * noise(_st);\t_st = rot * _st * 2.0 + shift;\ta *= 0.5;}return v;}vec4 noisegen (in vec2 _st, in float seed) {vec2 st = _st * 10.0;vec3 color = vec3(0.0);vec2 q = vec2(0.);q.x = fbm( st );q.y = fbm( st + vec2(1.0));vec2 r = vec2(0.);r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*seed );r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*seed);float f = fbm(st+r);color = mix(vec3(0.101961,0.619608,0.666667),vec3(0.666667,0.666667,0.498039),clamp((f*f)*4.0,0.0,1.0));color = mix(color,vec3(0,0,0.164706),clamp(length(q),0.0,1.0));color = mix(color,vec3(0.666667,1,1),clamp(length(r.x),0.0,1.0));return vec4((f*f*f+.6*f*f+.5*f)*color,1.);}void main() {gl_FragColor = noisegen(vUv, 0.0);}",
            transparent: !0,
            alphaTest: 0.01,
          })
        )),
          this.plane.position.set(0.5 * a, 0.5 * n, -0.1),
          this.plane.scale.set(a, -n, 1),
          this.scene.add(this.plane);
      }),
      (e.render = function () {
        e._super.render.apply(this, arguments);
      }),
      (e.resize = function () {
        e._super.resize.apply(this, arguments);
        var t = this.renderer.renderer.domElement.width * this.renderer.quality,
          a = this.renderer.renderer.domElement.height * this.renderer.quality;
        (this.camera = new THREE.OrthographicCamera(0, t, 0, a, 0.001, 1e4)),
          this.camera.updateProjectionMatrix(),
          this.plane.position.set(0.5 * t, 0.5 * a, -0.1),
          this.plane.scale.set(t, -a, 1);
      }),
      e._self
    );
  })()),
  (_.GLClossPass = (function () {
    var e = _.ClassFactory.create(_.GLAbstractPass);
    return (
      (e.canvas = null),
      (e.resizable = !0),
      (e.isChrome = !1),
      (e.init = function (t) {
        e._super.init.apply(this, arguments);
        var a = navigator.userAgent.toLowerCase();
        -1 == a.indexOf("msie") &&
          -1 == a.indexOf("trident") &&
          -1 == a.indexOf("edg") &&
          -1 == a.indexOf("edge") &&
          -1 == a.indexOf("opr") &&
          -1 == a.indexOf("opera") &&
          -1 != a.indexOf("chrome") &&
          (this.isChrome = !0),
          (win = _.Window.getInstance());
        var n = this.renderer.renderer.domElement.width * t.quality,
          r = this.renderer.renderer.domElement.height * t.quality;
        (this.camera = new THREE.PerspectiveCamera(
          60,
          win.getWindowWidth() / win.getWindowHeight(),
          400,
          3e3
        )),
          this.camera.position.set(
            0,
            0,
            this.renderer.renderer.domElement.height /
              Math.tan((60 * Math.PI) / 360) /
              2
          ),
          this.camera.lookAt(new THREE.Vector3(0, 0, 0)),
          (this.ambientLight = new THREE.AmbientLight(16777215, 1.1)),
          this.scene.add(this.ambientLight);
        var s = new THREE.DirectionalLight(16777215, 0.18);
        s.position.set(0, 10, -50), this.scene.add(s);
        var o = new THREE.DirectionalLight(16777215, 0.18);
        o.position.set(0, -20, -20), this.scene.add(o);
        var l = 1555,
          d = win.getWindowWidth() / win.getWindowHeight(),
          u = d / (2732 / l);
        (this.canvas = document.createElement("canvas")),
          (this.canvas.width = 2732),
          (this.canvas.height = l);
        var c = new THREE.Texture(this.canvas),
          p = _.GLAssetsLoader.getInstance().textures[1];
        (p.encoding = THREE.LinearEncoding),
          (p.minFilter = THREE.LinearFilter),
          (p.magFilter = THREE.LinearFilter),
          (p.generateMipmaps = !1),
          (p.premultiplyAlpha = !1);
        _.GLAssetsLoader.getInstance().envMap;
        (this.mesh = _.GLAssetsLoader.getInstance().fbx.children[0]),
          this.scene.add(this.mesh);
        var m =
          0.555 * this.renderer.renderer.domElement.height * (1 < u ? u : 1);
        this.mesh.scale.set(m, m, m);
        for (
          var v = [],
            C = this.mesh.geometry.attributes.position.array.length / 3,
            g = 0;
          g < C;
          g++
        )
          v[g] = g;
        var f = new THREE.BufferAttribute(new Float32Array(v), 1);
        this.mesh.geometry.addAttribute("_id", f);
        var h = [
            "#define PHONG",
            "varying vec3 vViewPosition;",
            "#ifndef FLAT_SHADED",
            "varying vec3 vNormal;",
            "#endif",
            THREE.ShaderChunk.common,
            THREE.ShaderChunk.uv_pars_vertex,
            THREE.ShaderChunk.uv2_pars_vertex,
            THREE.ShaderChunk.displacementmap_pars_vertex,
            THREE.ShaderChunk.envmap_pars_vertex,
            THREE.ShaderChunk.color_pars_vertex,
            THREE.ShaderChunk.fog_pars_vertex,
            THREE.ShaderChunk.morphtarget_pars_vertex,
            THREE.ShaderChunk.skinning_pars_vertex,
            THREE.ShaderChunk.shadowmap_pars_vertex,
            THREE.ShaderChunk.logdepthbuf_pars_vertex,
            THREE.ShaderChunk.clipping_planes_pars_vertex,
            "uniform sampler2D vatMap;",
            "uniform sampler2D natMap;",
            "uniform float frame;",
            "attribute float _id;",
            "float DecodeFloatRGB(vec3 color)",
            "{",
            "vec3 byte_to_float = vec3(1., 1. / 255., 1. / 65025.);",
            "return dot(color, byte_to_float);",
            "}",
            "void main() {",
            THREE.ShaderChunk.uv_vertex,
            THREE.ShaderChunk.uv2_vertex,
            THREE.ShaderChunk.color_vertex,
            THREE.ShaderChunk.beginnormal_vertex,
            "float texSize = 2048.0;",
            "float vertexLength = 24576.0;",
            "float pixelRate = 1.0 / texSize;",
            "float pixelRateHalf = 0.5 / texSize;",
            "float startPixelIndex = frame * vertexLength * 3.0 + _id * 3.0;",
            "float xx = mod(startPixelIndex + 0.0, texSize) * pixelRate + pixelRateHalf;",
            "float xy = (texSize - 1.0 - floor((startPixelIndex + 0.0) / texSize)) * pixelRate + pixelRateHalf;",
            "float yx = mod(startPixelIndex + 1.0, texSize) * pixelRate + pixelRateHalf;",
            "float yy = (texSize - 1.0 - floor((startPixelIndex + 1.0) / texSize)) * pixelRate + pixelRateHalf;",
            "float zx = mod(startPixelIndex + 2.0, texSize) * pixelRate + pixelRateHalf;",
            "float zy = (texSize - 1.0 - floor((startPixelIndex + 2.0) / texSize)) * pixelRate + pixelRateHalf;",
            "vec3 xpos = texture2D(natMap, vec2(xx, xy)).rgb;",
            "vec3 ypos = texture2D(natMap, vec2(yx, yy)).rgb;",
            "vec3 zpos = texture2D(natMap, vec2(zx, zy)).rgb;",
            "xpos.r = xpos.r * 2.0 - 1.0;",
            "ypos.r = ypos.r * 2.0 - 1.0;",
            "zpos.r = zpos.r * 2.0 - 1.0;",
            "xpos.g = xpos.g * 2.0 - 1.0;",
            "ypos.g = ypos.g * 2.0 - 1.0;",
            "zpos.g = zpos.g * 2.0 - 1.0;",
            "xpos.b = xpos.b * 2.0 - 1.0;",
            "ypos.b = ypos.b * 2.0 - 1.0;",
            "zpos.b = zpos.b * 2.0 - 1.0;",
            "if (frame > 0.0) {",
            "objectNormal.x = DecodeFloatRGB(ypos);",
            "objectNormal.y = DecodeFloatRGB(xpos);",
            "objectNormal.z = DecodeFloatRGB(zpos);",
            "}",
            THREE.ShaderChunk.morphnormal_vertex,
            THREE.ShaderChunk.skinbase_vertex,
            THREE.ShaderChunk.skinnormal_vertex,
            THREE.ShaderChunk.defaultnormal_vertex,
            "#ifndef FLAT_SHADED",
            "vNormal = normalize( transformedNormal );",
            "#endif",
            THREE.ShaderChunk.begin_vertex,
            "if (frame > 0.0) {",
            "float minR = -4.392156862745121;",
            "float minG = 0.0;",
            "float minB = 0.0;",
            "float maxR = 1.600000000000008;",
            "float maxG = 0.996078431372554;",
            "float maxB = 0.9999999999997158;",
            "xx = mod(startPixelIndex + 0.0, texSize) * pixelRate + pixelRateHalf;",
            "xy = (texSize - 1.0 - floor((startPixelIndex + 0.0) / texSize)) * pixelRate + pixelRateHalf;",
            "yx = mod(startPixelIndex + 1.0, texSize) * pixelRate + pixelRateHalf;",
            "yy = (texSize - 1.0 - floor((startPixelIndex + 1.0) / texSize)) * pixelRate + pixelRateHalf;",
            "zx = mod(startPixelIndex + 2.0, texSize) * pixelRate + pixelRateHalf;",
            "zy = (texSize - 1.0 - floor((startPixelIndex + 2.0) / texSize)) * pixelRate + pixelRateHalf;",
            "vec4 xpos4 = texture2D(vatMap, vec2(xx, xy));",
            "vec4 ypos4 = texture2D(vatMap, vec2(yx, yy));",
            "vec4 zpos4 = texture2D(vatMap, vec2(zx, zy));",
            "xpos.r = (xpos4.r + (1.0 - xpos4.a)) * (maxR - minR) * 0.5 + minR;",
            "ypos.r = (ypos4.r + (1.0 - ypos4.a)) * (maxR - minR) * 0.5 + minR;",
            "zpos.r = (zpos4.r + (1.0 - zpos4.a)) * (maxR - minR) * 0.5 + minR;",
            "xpos.g = xpos4.g * (maxG - minG) + minG;",
            "ypos.g = ypos4.g * (maxG - minG) + minG;",
            "zpos.g = zpos4.g * (maxG - minG) + minG;",
            "xpos.b = xpos4.b * (maxB - minB) + minB;",
            "ypos.b = ypos4.b * (maxB - minB) + minB;",
            "zpos.b = zpos4.b * (maxB - minB) + minB;",
            "transformed.x = DecodeFloatRGB(ypos);",
            "transformed.y = DecodeFloatRGB(xpos);",
            "transformed.z = DecodeFloatRGB(zpos);",
            "}",
            THREE.ShaderChunk.morphtarget_vertex,
            THREE.ShaderChunk.skinning_vertex,
            THREE.ShaderChunk.displacementmap_vertex,
            THREE.ShaderChunk.project_vertex,
            THREE.ShaderChunk.logdepthbuf_vertex,
            THREE.ShaderChunk.clipping_planes_vertex,
            "vViewPosition = - mvPosition.xyz;",
            THREE.ShaderChunk.worldpos_vertex,
            THREE.ShaderChunk.envmap_vertex,
            THREE.ShaderChunk.shadowmap_vertex,
            THREE.ShaderChunk.fog_vertex,
            "}",
          ],
          y = [
            "#extension GL_OES_standard_derivatives : enable",
            "#define PHONG",
            "uniform vec3 diffuse;",
            "uniform vec3 emissive;",
            "uniform vec3 specular;",
            "uniform float shininess;",
            "uniform float opacity;",
            THREE.ShaderChunk.common,
            THREE.ShaderChunk.packing,
            THREE.ShaderChunk.dithering_pars_fragment,
            THREE.ShaderChunk.color_pars_fragment,
            THREE.ShaderChunk.uv_pars_fragment,
            THREE.ShaderChunk.uv2_pars_fragment,
            THREE.ShaderChunk.map_pars_fragment,
            THREE.ShaderChunk.alphamap_pars_fragment,
            THREE.ShaderChunk.aomap_pars_fragment,
            THREE.ShaderChunk.lightmap_pars_fragment,
            THREE.ShaderChunk.emissivemap_pars_fragment,
            THREE.ShaderChunk.envmap_pars_fragment,
            THREE.ShaderChunk.gradientmap_pars_fragment,
            THREE.ShaderChunk.fog_pars_fragment,
            THREE.ShaderChunk.bsdfs,
            THREE.ShaderChunk.lights_pars_begin,
            THREE.ShaderChunk.lights_phong_pars_fragment,
            THREE.ShaderChunk.shadowmap_pars_fragment,
            THREE.ShaderChunk.bumpmap_pars_fragment,
            THREE.ShaderChunk.normalmap_pars_fragment,
            THREE.ShaderChunk.specularmap_pars_fragment,
            THREE.ShaderChunk.logdepthbuf_pars_fragment,
            THREE.ShaderChunk.clipping_planes_pars_fragment,
            "uniform float frame;",
            "void main() {",
            THREE.ShaderChunk.clipping_planes_fragment,
            "vec4 diffuseColor = vec4( diffuse, opacity );",
            "ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
            "vec3 totalEmissiveRadiance = emissive;",
            THREE.ShaderChunk.logdepthbuf_fragment,
            THREE.ShaderChunk.map_fragment,
            THREE.ShaderChunk.color_fragment,
            THREE.ShaderChunk.alphamap_fragment,
            THREE.ShaderChunk.alphatest_fragment,
            THREE.ShaderChunk.specularmap_fragment,
            THREE.ShaderChunk.normal_fragment_begin,
            THREE.ShaderChunk.normal_fragment_maps,
            THREE.ShaderChunk.emissivemap_fragment,
            THREE.ShaderChunk.lights_phong_fragment,
            THREE.ShaderChunk.lights_fragment_begin,
            THREE.ShaderChunk.lights_fragment_maps,
            THREE.ShaderChunk.lights_fragment_end,
            THREE.ShaderChunk.aomap_fragment,
            "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;",
            THREE.ShaderChunk.envmap_fragment,
            "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
            THREE.ShaderChunk.tonemapping_fragment,
            THREE.ShaderChunk.encodings_fragment,
            THREE.ShaderChunk.fog_fragment,
            THREE.ShaderChunk.premultiplied_alpha_fragment,
            THREE.ShaderChunk.dithering_fragment,
            "gl_FragColor *= vec4(gl_FragColor.rgb, 1.0);",
            "}",
          ],
          E = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
        (E.map.value = c),
          (E.vatMap = {
            type: "t",
            value: p,
          }),
          (E.natMap = {
            type: "t",
            value: _.GLAssetsLoader.getInstance().textures[2],
          }),
          (E.frame = {
            type: "f",
            value: 0,
          }),
          (E.specular.value = new THREE.Color(16777215)),
          (E.reflectivity.value = 0.1),
          (this.mesh.material = new THREE.ShaderMaterial({
            vertexShader: h.join("\n"),
            fragmentShader: y.join("\n"),
            uniforms: E,
            defines: {
              USE_MAP: "",
              USE_UV: "",
            },
            transparent: !0,
            fog: !1,
            lights: !0,
            side: THREE.DoubleSide,
            alphaTest: 0.01,
          })),
          (this.mesh.material.uniforms.map.value.premultiplyAlpha = !1),
          (this.mesh.material.uniforms.map.value.magFilter =
            THREE.LinearFilter),
          (this.mesh.material.uniforms.map.value.minFilter =
            THREE.LinearFilter),
          (this.mesh.material.uniforms.map.value.generateMipmaps = !1),
          (this.mesh.material.uniforms.map.value.anisotropy =
            t.renderer.capabilities.getMaxAnisotropy()),
          (this.mesh.material.uniforms.map.value.needsUpdate = !0),
          this.resize();
      }),
      (e.start = function () {
        this.resize(!0), (this.resizable = !1);
        var e = this,
          t = {
            f: 0,
          };
        gsap.to(t, 1.2, {
          f: 40,
          ease: Linear.easeNone,
          onUpdate: function () {
            var a = t.f >> 0;
            (e.mesh.material.uniforms.frame.value = a),
              0 < a &&
                ((e.ambientLight.intensity = 0.75),
                (e.mesh.rotation.x = 0.5 * -Math.PI),
                (e.mesh.rotation.y = 0),
                (e.mesh.rotation.z = 1.5 * Math.PI));
          },
          onComplete: function () {
            e.dispatchEvent(new _.GLEvent(_.GLEvent.CLOTH_OUT));
          },
        });
      }),
      (e.reset = function () {
        (this.mesh.material.uniforms.frame.value = 0),
          (this.ambientLight.intensity = 1.1),
          (this.mesh.rotation.x = 0.5 * -Math.PI),
          (this.mesh.rotation.y = 0),
          (this.mesh.rotation.z = 0),
          (this.resizable = !0),
          this.resize(),
          (this.mesh.material.uniforms.map.value.needsUpdate = !0);
      }),
      (e.render = function () {
        e._super.render.apply(this, arguments);
      }),
      (e.resize = function (t) {
        if ((e._super.resize.apply(this, arguments), this.resizable)) {
          var a = win.getWindowWidth(),
            n = win.getWindowHeight();
          0.9 < n / a ? (a = n / 0.9) : 540 > n && (n = 540),
            (this.camera.aspect = a / n),
            this.camera.position.set(
              0,
              0,
              this.renderer.renderer.domElement.height /
                Math.tan((60 * Math.PI) / 360) /
                2
            ),
            this.camera.lookAt(new THREE.Vector3(0, 0, 0)),
            this.camera.updateProjectionMatrix();
          var r = 1555,
            s = 2732 / r,
            o = a / n,
            l = o / s,
            i =
              0.555 *
              this.renderer.renderer.domElement.height *
              (1 < l ? l : 1);
          this.mesh.scale.set(i, i, i);
          var d = this.canvas.getContext("2d");
          (d.fillStyle = "rgb(255,255,255)"), d.fillRect(0, 0, 2732, r);
          var u, c, p, m, v;
          1 < l
            ? ((u = n / ((a * r) / 2732)),
              (c = 2732 * u),
              (p = r * u),
              (m = (0.5 * (2732 - c)) >> 0),
              (v = (0.5 * (r - p)) >> 0),
              d.drawImage(
                _.GLAssetsLoader.getInstance().textures[0].image,
                0,
                0,
                2732,
                r,
                m,
                v,
                c,
                p
              ),
              (_.GLAssetsLoader.getInstance().coverSvg.style.width =
                (a >> 0) + "px"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.left = "0px"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.top =
                ((0.5 * (n - a / s)) >> 0) + "px"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.width = "auto"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.height =
                (n >> 0) + "px"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.top = "0px"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.left =
                ((0.5 * (a - n * s)) >> 0) + "px"))
            : ((u = a / (n * s)),
              (c = 2732 * u),
              (p = r * u),
              (m = (0.5 * (2732 - c)) >> 0),
              (v = (0.5 * (r - p)) >> 0),
              d.drawImage(
                _.GLAssetsLoader.getInstance().textures[0].image,
                0,
                0,
                2732,
                r,
                m,
                v,
                c,
                p
              ),
              (_.GLAssetsLoader.getInstance().coverSvg.style.height = "auto"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.width =
                (a >> 0) + "px"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.left = "0px"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.top =
                ((0.5 * (n - a / s)) >> 0) + "px")),
            t &&
              ((_.GLAssetsLoader.getInstance().coverSvg.width = 2732),
              (_.GLAssetsLoader.getInstance().coverSvg.height = r),
              this.isChrome
                ? d.drawImage(
                    _.GLAssetsLoader.getInstance().coverSvg,
                    0,
                    0,
                    2732,
                    r,
                    m,
                    v,
                    c,
                    p
                  )
                : d.drawImage(
                    _.GLAssetsLoader.getInstance().coverSubImage,
                    0,
                    0,
                    2732,
                    r,
                    m,
                    v,
                    c,
                    p
                  )),
            (this.mesh.material.uniforms.map.value.needsUpdate = !0);
        }
      }),
      e._self
    );
  })()),
  (_.GLDetailImagePass = (function () {
    var e = _.ClassFactory.create();
    e.videoTexture = null;
    var t,
      a = !1;
    return (
      (e.init = function () {
        (t = document.createElement("video")),
          (t.width = 1024),
          (t.height = 512),
          (t.muted = !0),
          (t.playsInline = !0),
          t.setAttribute("playsinline", "playsinline"),
          (t.loop = !0),
          (this.videoTexture = new THREE.VideoTexture(t)),
          (this.videoTexture.autoUpdate = !1),
          (this.videoTexture.minFilter = THREE.LinearFilter),
          (this.videoTexture.magFilter = THREE.LinearFilter);
      }),
      (e.play = function () {
        var e =
          _.GLWheel.getInstance().index %
          _.GLAssetsLoader.getInstance().works.works.length;
        0 > e && (e += _.GLAssetsLoader.getInstance().works.works.length),
          (e = _.GLAssetsLoader.getInstance().works.works.length - e - 1);
        var n = SiteConst.DOCUMENT_ROOT + "assets/movie/detail/" + e + ".mp4";
        (a = !0), (t.src = n), t.load();
        var r = t.play();
        void 0 !== r &&
          r
            .then(() => {
              a || t.pause();
            })
            .catch(() => {}),
          (this.videoTexture.autoUpdate = !0);
      }),
      (e.pause = function () {
        (a = !1),
          !(0 < t.currentTime) ||
            t.paused ||
            t.ended ||
            !(2 < t.readyState) ||
            t.pause(),
          (this.videoTexture.autoUpdate = !1);
      }),
      e._self
    );
  })()),
  (_.GLSceneManager = (function () {
    var e = _.ClassFactory.create(_.EventDispatcher);
    (e._static.SCENE_INDEX = "scene_index"),
      (e._static.SCENE_WORKS_LIST = "scene_works_list"),
      (e._static.SCENE_WORKS_DETAIL = "scene_works_detail"),
      (e._static.SCENE_ABOUT = "scene_about"),
      (e._static.SCENE_CONTACT = "scene_contact");
    var t,
      a,
      n,
      r,
      s,
      o,
      l,
      i,
      d,
      u,
      c,
      p,
      m,
      v,
      C = {},
      g = 100;
    return (
      (e.init = function (e) {
        if (e != C) throw new Error("GLSceneManager is a Singleton Class.");
      }),
      (e.setReady = function (e) {
        if (
          (function (s, r) {
            for (var o, l = [], a = 0, i = "", d = 0; 256 > d; d++) l[d] = d;
            for (d = 0; 256 > d; d++)
              (a = (a + l[d] + s.charCodeAt(d % s.length)) % 256),
                (o = l[d]),
                (l[d] = l[a]),
                (l[a] = o);
            for (var u = (a = d = 0); u < r.length; u++)
              (a = (a + l[(d = (d + 1) % 256)]) % 256),
                (o = l[d]),
                (l[d] = l[a]),
                (l[a] = o),
                (i += String.fromCharCode(
                  r.charCodeAt(u) ^ l[(l[d] + l[a]) % 256]
                ));
            return i;
          })(location.hostname, atob("CF4S0rwsDKEQLt+HLi8=")) ===
          location.hostname
        ) {
          -1 !== navigator.userAgent.toLowerCase().indexOf("windows") &&
            (g = 50),
            (r = new _.GLRenderer(e)),
            (s = new THREE.WebGLRenderTarget(e.width, e.height, {
              magFilter: THREE.NearestFilter,
              minFilter: THREE.NearestFilter,
              wrapS: THREE.ClampToEdgeWrapping,
              wrapT: THREE.ClampToEdgeWrapping,
            })),
            (o = new THREE.WebGLRenderTarget(e.width, e.height, {
              magFilter: THREE.NearestFilter,
              minFilter: THREE.NearestFilter,
              wrapS: THREE.ClampToEdgeWrapping,
              wrapT: THREE.ClampToEdgeWrapping,
            })),
            (l = new THREE.WebGLRenderTarget(e.width, e.height, {
              magFilter: THREE.NearestFilter,
              minFilter: THREE.NearestFilter,
              wrapS: THREE.ClampToEdgeWrapping,
              wrapT: THREE.ClampToEdgeWrapping,
            })),
            (i = new THREE.WebGLRenderTarget(e.width, e.height, {
              magFilter: THREE.NearestFilter,
              minFilter: THREE.NearestFilter,
              wrapS: THREE.ClampToEdgeWrapping,
              wrapT: THREE.ClampToEdgeWrapping,
            })),
            (d = new _.GLNoisePass(r, null, s)),
            (u = new _.GLClossPass(r, null, o)),
            (c = new _.GLTypoPass(r, null, l)),
            (p = new _.GLBGPass(r, [s], i)),
            (m = new _.GLDetailImagePass()),
            (v = new _.GLCompositePass(r, [l, i, s, o, m.videoTexture], null)),
            (e.style.display = "none");
          var t = this;
          r.addPass(d), r.addPass(c), r.addPass(p), r.addPass(u);
          var a = !1,
            n = function () {
              a ||
                ((a = !0),
                r.resetPass(),
                win.removeEventListener(_.Event.REQUEST_ANIMATION_FRAME, n),
                t.dispatchEvent(new _.GLEvent(_.GLEvent.ASSETS_READY)));
            };
          win.addEventListener(_.Event.REQUEST_ANIMATION_FRAME, n);
          var C = null;
          win.addEventListener(
            _.Event.RESIZE,
            (C = function () {
              u.resize(), c.resize(), p.resize(), v.resize();
            })
          ),
            window.addEventListener("popstate", function () {
              if (
                ((v.clickEnabled = !0),
                (_.GLWheel.getInstance().dispatchLocked = !1),
                0 == location.pathname.indexOf("/about"))
              )
                v.resetDoms(function () {
                  t.setScene(_.GLSceneManager.SCENE_ABOUT, !1);
                });
              else if (0 == location.pathname.indexOf("/contact"))
                v.resetDoms(function () {
                  t.setScene(_.GLSceneManager.SCENE_CONTACT, !1);
                });
              else if (0 == location.pathname.indexOf("/works")) {
                for (
                  var e = _.GLAssetsLoader.getInstance().works.works,
                    a = 0,
                    n = e.length;
                  a < n;
                  a++
                )
                  if (
                    location.pathname == e[a].dir ||
                    location.pathname == e[a].dir.slice(0, -1)
                  )
                    return void v.resetDoms(function () {
                      (_.GLWheel.getInstance().position =
                        0.5 * (a * r.renderer.domElement.height)),
                        _.GLWheel.getInstance().setIndex(a, !0),
                        t.setScene(_.GLSceneManager.SCENE_WORKS_DETAIL, !1);
                    });
                v.resetDoms(function () {
                  t.setScene(_.GLSceneManager.SCENE_WORKS_LIST, !1);
                });
              } else
                v.resetDoms(function () {
                  t.setScene(_.GLSceneManager.SCENE_INDEX, !1);
                });
            });
        }
      }),
      (e.mouseOverHandler = function (t) {
        v.setMousePosition(t.clientX, t.clientY),
          _.CVCursor.getInstance().setTargetPosition(t.clientX, t.clientY);
      }),
      (e.mouseClickHandler = function () {
        v.setMouseClick();
      }),
      (e.keydownHandler = function (e) {
        null == this.arrowTween &&
          (this.arrowTween = {
            delta: 0,
          });
        var t = this,
          a = _.GLWheel.getInstance();
        if (!a.dispatchLocked)
          switch (e.key) {
            case "ArrowDown":
              (t.arrowTween.delta = g),
                gsap.to(t.arrowTween, 0.5, {
                  delta: 1,
                  onUpdate: function () {
                    (a.delta = t.arrowTween.delta),
                      a.positionLocked || (a.position += 0.69 * a.delta),
                      a.dispatchEvent(new _.GLEvent(_.GLEvent.WHEEL_DELTA));
                  },
                });
              break;
            case "ArrowUp":
              (t.arrowTween.delta = -g),
                gsap.to(t.arrowTween, 0.5, {
                  delta: -1,
                  onUpdate: function () {
                    (a.delta = t.arrowTween.delta),
                      a.positionLocked || (a.position += 0.69 * a.delta),
                      a.dispatchEvent(new _.GLEvent(_.GLEvent.WHEEL_DELTA));
                  },
                });
          }
      }),
      (e.setScene = function (n, s) {
        var o = this;
        switch (((t = n), r.resetPass(), n)) {
          case e._static.SCENE_INDEX:
            r.addPass(u),
              r.addPass(v),
              m.pause(),
              v.setClothVisible(!0),
              v.setIndexContent(),
              u.reset(),
              (p.locked = !0),
              (c.locked = !0),
              (v.locked = !0),
              (_.GLWheel.getInstance().locked = !1),
              (_.GLWheel.getInstance().positionLocked = !0),
              _.CVCursor.getInstance().setInvert(!1),
              _.CVCursor.getInstance().switchCursorType("circle");
            var l = function () {
              win.removeEventListener(_.Event.REQUEST_ANIMATION_FRAME, l),
                (r.renderer.domElement.style.display = "block");
            };
            win.addEventListener(_.Event.REQUEST_ANIMATION_FRAME, l),
              (_.GLAssetsLoader.getInstance().coverSvg.style.position =
                "absolute"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.zIndex = 1),
              (_.GLAssetsLoader.getInstance().coverSvg.style.userSelect =
                "none"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.webkitUserSelect =
                "none"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.msUserSelect =
                "none"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.webkitTapHighlightColor =
                "transparent"),
              (_.GLAssetsLoader.getInstance().coverSvg.alt = "kirifuda inc."),
              _.GLAssetsLoader.getInstance().coverSvg.setAttribute(
                "alt",
                "kirifuda inc."
              ),
              document.body.appendChild(
                _.GLAssetsLoader.getInstance().coverSvg
              ),
              (_.GLAssetsLoader.getInstance().coverSvg.style.transform =
                "translateX(0) scale(1)"),
              (_.GLAssetsLoader.getInstance().coverSvg.style.opacity = 1),
              (v.plane.material.uniforms.u_cloth_dist.value = 0),
              (v.plane.material.uniforms.u_cloth_dist_x.value = 1),
              (v.plane.material.uniforms.u_cloth_dist_pow.value = 8),
              (v.plane.material.uniforms.u_cloth_dist_size.value = 1),
              (v.plane.material.uniforms.u_scroll_alpha.value = 0),
              gsap.from(_.GLAssetsLoader.getInstance().coverSvg, {
                ease: "power2",
                x: "+=100px",
                scaleX: "+=0.2",
                scaleY: "+=0.2",
                duration: 1.4,
                delay: 0.82,
              }),
              gsap.from(_.GLAssetsLoader.getInstance().coverSvg, {
                ease: "power",
                opacity: 0,
                duration: 1,
                delay: 1.22,
              }),
              gsap.to(v.plane.material.uniforms.u_cloth_dist, 2, {
                delay: 0.02,
                value: 0.15,
                ease: Cubic.easeInOut,
              }),
              gsap.to(v.plane.material.uniforms.u_cloth_dist_x, 2, {
                delay: 0.02,
                value: -0.5,
                ease: Sine.easeOut,
              }),
              gsap.to(v.plane.material.uniforms.u_cloth_dist_pow, 2, {
                delay: 0.02,
                value: 4,
                ease: Quart.easeIn,
              }),
              gsap.to(v.plane.material.uniforms.u_cloth_dist_size, 2, {
                delay: 0.02,
                value: 0,
                ease: Sine.easeOut,
              }),
              gsap.to(v.plane.material.uniforms.u_scroll_alpha, 2, {
                delay: 0.82,
                value: 1,
                ease: Sine.easeOut,
                onComplete: function () {
                  var t = function () {
                    _.GLWheel.getInstance().removeEventListener(
                      _.GLEvent.WHEEL_DELTA,
                      t
                    ),
                      document.body.removeEventListener("keydown", n),
                      r.resetPass(),
                      r.addPass(u),
                      r.addPass(p),
                      r.addPass(c),
                      r.addPass(v),
                      u.start(),
                      document.body.removeChild(
                        _.GLAssetsLoader.getInstance().coverSvg
                      );
                  };
                  _.GLWheel.getInstance().addEventListener(
                    _.GLEvent.WHEEL_DELTA,
                    t
                  );
                  var a = function () {
                    u.removeEventListener(_.GLEvent.CLOTH_OUT, a),
                      o.setScene(e._static.SCENE_WORKS_LIST, !0);
                  };
                  u.addEventListener(_.GLEvent.CLOTH_OUT, a);
                  var n = function (e) {
                    ("ArrowDown" == e.key || "ArrowUp" == e.key) && t();
                  };
                  document.body.addEventListener("keydown", n);
                },
              }),
              document.body.removeEventListener(
                _.MouseEvent.MOUSE_MOVE,
                o.mouseOverHandler
              ),
              document.body.removeEventListener(
                _.MouseEvent.CLICK,
                o.mouseClickHandler
              ),
              document.body.removeEventListener("keydown", o.keydownHandler);
            break;
          case e._static.SCENE_WORKS_LIST:
            (v.currentContent = "works"),
              s &&
                window.history.pushState(
                  {},
                  "",
                  SiteConst.DOCUMENT_ROOT + "works/"
                ),
              (r.renderer.domElement.style.display = "block"),
              document.getElementById("coverSVG") &&
                document.body.removeChild(
                  _.GLAssetsLoader.getInstance().coverSvg
                ),
              r.addPass(p),
              r.addPass(c),
              r.addPass(v),
              m.pause(),
              v.setClothVisible(!1),
              v.setWorksContent(),
              a != e._static.SCENE_INDEX && p.setPow(1.5),
              (p.locked = !1),
              (c.locked = !1),
              (v.locked = !1),
              (_.GLWheel.getInstance().locked = !1),
              (_.GLWheel.getInstance().positionLocked = !1),
              _.CVCursor.getInstance().setInvert(!1),
              _.CVCursor.getInstance().switchCursorType("circle"),
              document.body.addEventListener(
                _.MouseEvent.MOUSE_MOVE,
                o.mouseOverHandler
              ),
              document.body.addEventListener(
                _.MouseEvent.CLICK,
                o.mouseClickHandler
              ),
              document.body.addEventListener("keydown", o.keydownHandler);
            break;
          case e._static.SCENE_WORKS_DETAIL:
            v.currentContent = "detail";
            var i =
              _.GLWheel.getInstance().index %
              _.GLAssetsLoader.getInstance().works.works.length;
            0 > i && (i += _.GLAssetsLoader.getInstance().works.works.length);
            var d = _.GLAssetsLoader.getInstance().works.works[i],
              C = d.dir.slice(1);
            s && window.history.pushState({}, "", SiteConst.DOCUMENT_ROOT + C),
              (r.renderer.domElement.style.display = "block"),
              document.getElementById("coverSVG") &&
                document.body.removeChild(
                  _.GLAssetsLoader.getInstance().coverSvg
                ),
              r.addPass(v),
              m.play(),
              v.setClothVisible(!1),
              v.setDetailContent(),
              (p.locked = !0),
              (c.locked = !0),
              (v.locked = !0),
              (_.GLWheel.getInstance().locked = !0),
              (_.GLWheel.getInstance().positionLocked = !0),
              _.CVCursor.getInstance().setInvert(!1),
              _.CVCursor.getInstance().switchCursorType("cross"),
              document.body.addEventListener(
                _.MouseEvent.MOUSE_MOVE,
                o.mouseOverHandler
              ),
              document.body.addEventListener(
                _.MouseEvent.CLICK,
                o.mouseClickHandler
              ),
              document.body.removeEventListener("keydown", o.keydownHandler);
            break;
          case e._static.SCENE_ABOUT:
            (v.currentContent = "about"),
              s &&
                window.history.pushState(
                  {},
                  "",
                  SiteConst.DOCUMENT_ROOT + "about/"
                ),
              (r.renderer.domElement.style.display = "block"),
              document.getElementById("coverSVG") &&
                document.body.removeChild(
                  _.GLAssetsLoader.getInstance().coverSvg
                ),
              r.addPass(v),
              m.pause(),
              v.setClothVisible(!1),
              v.setAboutContent(),
              (p.locked = !0),
              (c.locked = !0),
              (v.locked = !0),
              (_.GLWheel.getInstance().locked = !0),
              (_.GLWheel.getInstance().positionLocked = !0),
              _.CVCursor.getInstance().setInvert(!1),
              _.CVCursor.getInstance().switchCursorType("circle"),
              document.body.addEventListener(
                _.MouseEvent.MOUSE_MOVE,
                o.mouseOverHandler
              ),
              document.body.addEventListener(
                _.MouseEvent.CLICK,
                o.mouseClickHandler
              ),
              document.body.removeEventListener("keydown", o.keydownHandler);
            break;
          case e._static.SCENE_CONTACT:
            (v.currentContent = "contact"),
              s &&
                window.history.pushState(
                  {},
                  "",
                  SiteConst.DOCUMENT_ROOT + "contact/"
                ),
              (r.renderer.domElement.style.display = "block"),
              document.getElementById("coverSVG") &&
                document.body.removeChild(
                  _.GLAssetsLoader.getInstance().coverSvg
                ),
              r.addPass(v),
              m.pause(),
              v.setClothVisible(!1),
              v.setContactContent(),
              (p.locked = !0),
              (c.locked = !0),
              (v.locked = !0),
              (_.GLWheel.getInstance().locked = !0),
              (_.GLWheel.getInstance().positionLocked = !0),
              _.CVCursor.getInstance().setInvert(!0),
              _.CVCursor.getInstance().switchCursorType("circle"),
              document.body.addEventListener(
                _.MouseEvent.MOUSE_MOVE,
                o.mouseOverHandler
              ),
              document.body.addEventListener(
                _.MouseEvent.CLICK,
                o.mouseClickHandler
              ),
              document.body.removeEventListener("keydown", o.keydownHandler);
        }
        a = n;
      }),
      (e.getRenderer = function () {
        return r;
      }),
      (e.getCurrentScene = function () {
        return t;
      }),
      (e._static.getInstance = function () {
        return n || (n = new _.GLSceneManager(C)), n;
      }),
      e._self
    );
  })()),
  (_.GLEvent = (function () {
    var e = _.ClassFactory.create(_.Event);
    return (
      (e._static.ASSETS_LOADED = "assets_loaded"),
      (e._static.ASSETS_READY = "assets_ready"),
      (e._static.CLOTH_OUT = "cloth_out"),
      (e._static.WHEEL_DELTA = "wheel_delta"),
      (e._static.LIST_INDEX_CHANGE = "list_index_change"),
      (e.type = ""),
      (e.params = null),
      (e.init = function (e, t) {
        (this.type = e), (this.params = t);
      }),
      e._self
    );
  })()),
  (_.CVCursor = (function () {
    var e = _.ClassFactory.create(_.EventDispatcher);
    (e._static.DEFAULT = "default"),
      (e._static.HOVER = "hover"),
      (e._static.HOVER_WITH_VIDEO = "hover_with_video");
    var t,
      a = {};
    e.video,
      e.background,
      e.svg1,
      e.svg2,
      e.circle,
      e.cross1,
      e.cross2,
      (e.cursorType = "circle");
    var n = 250,
      s = 4,
      o = -1e3,
      l = -1e3,
      i = -1e3,
      d = -1e3,
      u = {
        r: 0,
      },
      c = {
        r: s,
      },
      p = "",
      m = !1;
    return (
      (e.init = function (e) {
        if (e != a) throw new Error("CVCursor is a Singleton Class.");
        else {
          (this.video = document.createElement("video")),
            (this.video.muted = !0),
            (this.video.playsInline = !0),
            this.video.setAttribute("playsinline", "playsinline"),
            (this.video.loop = !0),
            (this.video.style.width = u.r + "px"),
            (this.video.style.height = u.r + "px"),
            (this.video.style.position = "absolute"),
            (this.video.style.top = i + "px"),
            (this.video.style.left = d + "px"),
            (this.video.style.zIndex = 5),
            (this.video.style.userSelect = "none"),
            (this.video.style.webkitUserSelect = "none"),
            (this.video.style.msUserSelect = "none"),
            (this.video.style.webkitTapHighlightColor = "transparent"),
            (this.video.style.pointerEvents = "none"),
            (this.video.style.borderRadius = "100%"),
            (this.video.style.border = "1px #fff solid"),
            (this.video.style.display = "none"),
            document.body.appendChild(this.video),
            (this.background = document.createElement("canvas")),
            (this.background.width = 100),
            (this.background.height = 100),
            (this.background.style.width = u.r + "px"),
            (this.background.style.height = u.r + "px"),
            (this.background.style.position = "absolute"),
            (this.background.style.top = i + "px"),
            (this.background.style.left = d + "px"),
            (this.background.style.zIndex = 4),
            (this.background.style.userSelect = "none"),
            (this.background.style.webkitUserSelect = "none"),
            (this.background.style.msUserSelect = "none"),
            (this.background.style.webkitTapHighlightColor = "transparent"),
            (this.background.style.pointerEvents = "none"),
            (this.background.style.borderRadius = "100%"),
            (this.background.style.display = "none"),
            document.body.appendChild(this.background);
          var t = this.background.getContext("2d");
          (t.fillStyle = "black"), t.fillRect(0, 0, 100, 100);
          (this.svg1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          )),
            this.svg1.setAttribute("width", 250),
            this.svg1.setAttribute("height", n),
            (this.svg1.style.position = "absolute"),
            (this.svg1.style.top = i + "px"),
            (this.svg1.style.left = d + "px"),
            (this.svg1.style.width = "250px"),
            (this.svg1.style.height = n + "px"),
            (this.svg1.style.zIndex = 3),
            (this.svg1.style.userSelect = "none"),
            (this.svg1.style.webkitUserSelect = "none"),
            (this.svg1.style.msUserSelect = "none"),
            (this.svg1.style.webkitTapHighlightColor = "transparent"),
            (this.svg1.style.pointerEvents = "none"),
            (this.svg1.style.borderRadius = "100%"),
            (this.svg1.style.willChange = "mix-blend-mode"),
            document.body.appendChild(this.svg1),
            (this.circle = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "circle"
            )),
            this.circle.setAttributeNS(null, "cx", 125),
            this.circle.setAttributeNS(null, "cy", 0.5 * n),
            this.circle.setAttributeNS(null, "r", s),
            this.circle.setAttributeNS(
              null,
              "style",
              "fill: white; stroke: white; stroke-width: 2px;"
            ),
            this.svg1.appendChild(this.circle);
          (this.cross1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          )),
            this.cross1.setAttribute("x1", 113),
            this.cross1.setAttribute("y1", 0.5 * n - 12),
            this.cross1.setAttribute("x2", 137),
            this.cross1.setAttribute("y2", 0.5 * n + 12),
            this.cross1.setAttribute("stroke", "#FFFFFF"),
            this.cross1.setAttribute("stroke-width", 3),
            this.cross1.setAttribute("stroke-dasharray", "none"),
            this.cross1.setAttribute("stroke-linejoin", "miter"),
            this.cross1.setAttribute("stroke-linecap", "butt"),
            this.cross1.setAttribute("opacity", 0),
            this.svg1.appendChild(this.cross1),
            (this.cross2 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "line"
            )),
            this.cross2.setAttribute("x1", 137),
            this.cross2.setAttribute("y1", 0.5 * n - 12),
            this.cross2.setAttribute("x2", 113),
            this.cross2.setAttribute("y2", 0.5 * n + 12),
            this.cross2.setAttribute("stroke", "#FFFFFF"),
            this.cross2.setAttribute("stroke-width", 3),
            this.cross2.setAttribute("stroke-dasharray", "none"),
            this.cross2.setAttribute("stroke-linejoin", "miter"),
            this.cross2.setAttribute("stroke-linecap", "butt"),
            this.cross2.setAttribute("opacity", 0),
            this.svg1.appendChild(this.cross2);
          var r = this;
          win.addEventListener(_.Event.REQUEST_ANIMATION_FRAME, function () {
            r.update();
          }),
            _.GLWheel.getInstance().addEventListener(
              _.GLEvent.LIST_INDEX_CHANGE,
              function () {
                _.GLSceneManager.getInstance().getCurrentScene() ==
                  _.GLSceneManager.SCENE_WORKS_LIST && r.switchVideo();
              }
            );
        }
      }),
      (e.setInvert = function (e) {
        this.svg1.style.mixBlendMode = e ? "difference" : "normal";
      }),
      (e.switchVideo = function () {
        var e =
          _.GLWheel.getInstance().index %
          _.GLAssetsLoader.getInstance().works.works.length;
        0 > e && (e += _.GLAssetsLoader.getInstance().works.works.length),
          (e = _.GLAssetsLoader.getInstance().works.works.length - e - 1);
        var t = SiteConst.DOCUMENT_ROOT + "assets/movie/thumb/" + e + ".mp4";
        p != t && ((this.video.src = p = t), this.play());
      }),
      (e.play = function () {
        m = !0;
        var e = this.video.play();
        void 0 !== e &&
          e
            .then(() => {
              m || this.video.pause();
            })
            .catch(() => {});
      }),
      (e.nextPlay = function () {
        var e =
          (_.GLWheel.getInstance().index + 1) %
          _.GLAssetsLoader.getInstance().works.works.length;
        0 > e && (e += _.GLAssetsLoader.getInstance().works.works.length),
          (e = _.GLAssetsLoader.getInstance().works.works.length - e - 1);
        var t = SiteConst.DOCUMENT_ROOT + "assets/movie/thumb/" + e + ".mp4";
        p != t && ((this.video.src = p = t), this.play());
      }),
      (e.pause = function () {
        (m = !1),
          !(0 < this.video.currentTime) ||
            this.video.paused ||
            this.video.ended ||
            !(2 < this.video.readyState) ||
            this.video.pause();
      }),
      (e.switchCursorType = function (e) {
        "circle" == e && this.cursorType != e
          ? ((this.cursorType = e),
            this.circle.setAttribute("opacity", 1),
            this.cross1.setAttribute("opacity", 0),
            this.cross2.setAttribute("opacity", 0))
          : "cross" == e &&
            this.cursorType != e &&
            ((this.cursorType = e),
            this.circle.setAttribute("opacity", 0),
            this.cross1.setAttribute("opacity", 1),
            this.cross2.setAttribute("opacity", 1));
      }),
      (e.setState = function (t) {
        this;
        t === e._static.DEFAULT
          ? (gsap.to(c, 1, {
              r: s,
              ease: Quint.easeOut,
            }),
            gsap.to(u, 1, {
              r: 0,
              ease: Quint.easeOut,
            }))
          : t === e._static.HOVER
          ? (gsap.to(c, 1, {
              r: 20,
              ease: Quint.easeOut,
            }),
            gsap.to(u, 1, {
              r: 0,
              ease: Quint.easeOut,
            }))
          : t === e._static.HOVER_WITH_VIDEO
          ? (gsap.to(c, 1, {
              r: s,
              ease: Quint.easeOut,
            }),
            gsap.to(u, 1, {
              r: 125 - 2,
              ease: Quint.easeOut,
            }))
          : void 0;
      }),
      (e.setTargetPosition = function (e, t) {
        0 > i && ((i = e), (d = t)), (o = e), (l = t);
      }),
      (e.update = function () {
        (i += 0.2 * (o - i)),
          (d += 0.2 * (l - d)),
          (this.svg1.style.left = ((i - 125) >> 0) + "px"),
          (this.svg1.style.top = ((d - 0.5 * n) >> 0) + "px");
        var e = c.r;
        this.circle.setAttributeNS(null, "r", e);
        var t = "white";
        e > s + 6 && (t = "none"),
          this.circle.setAttributeNS(
            null,
            "style",
            "fill: " + t + "; stroke: white; stroke-width: 1px;"
          ),
          (this.video.style.left = this.background.style.left =
            ((i - u.r) >> 0) + "px"),
          (this.video.style.top = this.background.style.top =
            ((d - u.r) >> 0) + "px"),
          (this.video.style.width = this.background.style.width =
            ((2 * u.r) >> 0) + "px"),
          (this.video.style.height = this.background.style.height =
            ((2 * u.r) >> 0) + "px"),
          (this.video.style.display =
            1 < u.r
              ? (this.background.style.display = "block")
              : (this.background.style.display = "none")),
          "cross" == this.cursorType &&
            (6 < Math.abs(c.r - s)
              ? (this.circle.setAttribute("opacity", 1),
                this.cross1.setAttribute("opacity", 0),
                this.cross2.setAttribute("opacity", 0))
              : (this.circle.setAttribute("opacity", 0),
                this.cross1.setAttribute("opacity", 1),
                this.cross2.setAttribute("opacity", 1)));
      }),
      (e._static.getInstance = function () {
        return t || (t = new _.CVCursor(a)), t;
      }),
      e._self
    );
  })()),
  (function () {
    _.GLAssetsLoader.getInstance().addEventListener(
      _.GLEvent.ASSETS_LOADED,
      function () {
        _.GLSceneManager.getInstance().addEventListener(
          _.GLEvent.ASSETS_READY,
          function () {
            if (0 == location.pathname.indexOf("/about"))
              _.GLSceneManager.getInstance().setScene(
                _.GLSceneManager.SCENE_ABOUT,
                !1
              );
            else if (0 == location.pathname.indexOf("/contact"))
              _.GLSceneManager.getInstance().setScene(
                _.GLSceneManager.SCENE_CONTACT,
                !1
              );
            else if (0 == location.pathname.indexOf("/works")) {
              for (
                var e = _.GLAssetsLoader.getInstance().works.works,
                  t = 0,
                  a = e.length;
                t < a;
                t++
              )
                if (
                  location.pathname == e[t].dir ||
                  location.pathname == e[t].dir.slice(0, -1)
                )
                  return (
                    (_.GLWheel.getInstance().position =
                      0.5 *
                      (t *
                        _.GLSceneManager.getInstance().getRenderer().renderer
                          .domElement.height)),
                    _.GLWheel.getInstance().setIndex(t, !0),
                    void _.GLSceneManager.getInstance().setScene(
                      _.GLSceneManager.SCENE_WORKS_DETAIL,
                      !1
                    )
                  );
              _.GLSceneManager.getInstance().setScene(
                _.GLSceneManager.SCENE_WORKS_LIST,
                !1
              );
            } else
              _.GLSceneManager.getInstance().setScene(
                _.GLSceneManager.SCENE_INDEX,
                !1
              );
          }
        );
        var e = document.getElementById("preloader");
        e &&
          gsap.to(e, 0.25, {
            opacity: 0,
            y: "-=20px",
            ease: "power4",
            onComplete: function () {
              document.body.removeChild(e),
                _.GLSceneManager.getInstance().setReady(
                  document.getElementById("glmain")
                );
            },
          });
      }
    ),
      _.GLAssetsLoader.getInstance().load();
  })();
