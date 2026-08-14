(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + x + '" is not supported');
  });
  var __reExport = (target, module, desc) => {
    if (module && typeof module === "object" || typeof module === "function") {
      for (let key of __getOwnPropNames(module))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
    }
    return target;
  };
  var __toModule = (module) => {
    return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/injector.ts
  var import_store = __toModule(__require("svelte/store"));

  // src/utils.ts
  function setAttributes(el, attrs) {
    for (var key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }
  function injectStylesheet(root, editable, url) {
    const link = document.createElement("link");
    link.title = "CSS Injector Field Styles";
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    root.insertBefore(link, editable);
  }

  // src/injector.ts
  var NoteEditor = __toModule(__require("anki/NoteEditor"));
  var addonPackage = document.currentScript.getAttribute("src").match(/_addons\/(.+?)\//)[1];
  var StyleInjector = {
    update: function(_0) {
      return __async(this, arguments, function* ({ fieldNames, attrs }) {
        var _a, _b;
        setAttributes(document.documentElement, __spreadValues({}, attrs));
        if (attrs.pointVersion < 50) {
          [...document.getElementById("fields").children].forEach((field, i) => {
            const editable = field.editingArea.editable;
            inject(editable, __spreadValues({ field: fieldNames[i], ord: i + 1 }, attrs));
          });
        } else {
          while (!((_b = (_a = NoteEditor.instances[0]) == null ? void 0 : _a.fields) == null ? void 0 : _b.length)) {
            yield new Promise(requestAnimationFrame);
          }
          NoteEditor.instances[0].fields.forEach((field, i) => __async(this, null, function* () {
            const richText = (0, import_store.get)(field.editingArea.editingInputs)[0];
            inject(yield richText.element, __spreadValues({
              field: fieldNames[i],
              ord: i + 1
            }, attrs));
          }));
        }
      });
    }
  };
  function inject(editable, attrs) {
    editable.classList.add(...document.body.classList);
    setAttributes(editable, attrs);
    const root = editable.getRootNode();
    if (!root.querySelector("link[title*='CSS Injector']")) {
      injectStylesheet(root, editable, `/_addons/${addonPackage}/CSS_Injector/user_files/field.css`);
    }
  }
  globalThis.StyleInjector = StyleInjector;
})();
