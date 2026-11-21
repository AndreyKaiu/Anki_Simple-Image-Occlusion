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
			
	if (!editable) {
		console.error('inject: editable is', editable, 'attrs:', attrs, new Error().stack);
		return;
	}
    editable.classList.add(...document.body.classList);
    setAttributes(editable, attrs);
    const root = editable.getRootNode();
    if (!root.querySelector("link[title*='CSS Injector']")) {
      injectStylesheet(root, editable, `/_addons/${addonPackage}/CSS_Injector/user_files/field.css`);	  
    }
  }
  globalThis.StyleInjector = StyleInjector;
})();


(() => {

    window._savedSelectedHTML = "";
	
	
	// Get the path to a node relative to the ShadowRoot
	function getNodePath(root, node) {
		const path = [];

		while (node && node !== root) {
			const parent = node.parentNode;
			if (!parent) return null;

			path.unshift(Array.prototype.indexOf.call(parent.childNodes, node));
			node = parent;
		}

		return node === root ? path : null;
	}

	// Get a node from a saved path
	function getNodeByPath(root, path) {
		let node = root;

		for (const index of path) {
			node = node.childNodes[index];
			if (!node) return null;
		}

		return node;
	}

	// Save cursor position
	window._saveEditorCursor = function() {
		const selection = window.getSelection();
		
		if (typeof selection.getComposedRanges !== "function") {
			console.warn("getComposedRanges is not supported");
			return;
		}
		
		// console.log({
				// getComposedRanges: typeof selection.getComposedRanges,
				// rangeCount: selection.rangeCount,
				// activeElement: document.activeElement,
				// userAgent: navigator.userAgent
			// });

		if (!selection || selection.rangeCount === 0) return;

		const hosts = [...document.querySelectorAll(".rich-text-editable")];

		for (let i = 0; i < hosts.length; i++) {
			const host = hosts[i];
			const shadow = host.shadowRoot;

			if (!shadow) continue;

			const ranges = selection.getComposedRanges({
				shadowRoots: [shadow]
			});

			if (!ranges.length) continue;

			const r = ranges[0];

			// Check that the selection belongs to this field
			const startPath = getNodePath(shadow, r.startContainer);
			const endPath = getNodePath(shadow, r.endContainer);

			if (!startPath || !endPath) continue;

			window._savedEditorCursor = {
				hostIndex: i,
				startPath,
				startOffset: r.startOffset,
				endPath,
				endOffset: r.endOffset
			};

			// console.log("Cursor saved:", window._savedEditorCursor);
			return;
		}
	};

	// Restore cursor position and scroll to it
	window._restoreEditorCursor = function() {
		const saved = window._savedEditorCursor;
		if (!saved) return;

		const hosts = document.querySelectorAll(".rich-text-editable");
		const host = hosts[saved.hostIndex];
		if (!host || !host.shadowRoot) return;

		const shadow = host.shadowRoot;

		const startNode = getNodeByPath(shadow, saved.startPath);
		const endNode = getNodeByPath(shadow, saved.endPath);

		if (!startNode || !endNode) {
			//console.log("Cannot restore cursor: nodes not found");
			return;
		}

		try {
			const range = document.createRange();

			range.setStart(startNode, Math.min(
				saved.startOffset,
				startNode.nodeType === Node.TEXT_NODE
					? startNode.length
					: startNode.childNodes.length
			));

			range.setEnd(endNode, Math.min(
				saved.endOffset,
				endNode.nodeType === Node.TEXT_NODE
					? endNode.length
					: endNode.childNodes.length
			));

			const editable = shadow.querySelector("anki-editable");
			if (editable) editable.focus();

			const selection = window.getSelection();
			
			if (typeof selection.getComposedRanges !== "function") {
				console.warn("getComposedRanges is not supported");
				return;
			}
			
			// console.log({
					// getComposedRanges: typeof selection.getComposedRanges,
					// rangeCount: selection.rangeCount,
					// activeElement: document.activeElement,
					// userAgent: navigator.userAgent
				// });
			
			selection.removeAllRanges();
			selection.addRange(range);

			// We scroll AFTER the browser has recalculated the layout.
			// requestAnimationFrame ensures that selection has already been applied to the DOM.
			requestAnimationFrame(() => {
				scrollRangeIntoView(range);
			});

			// console.log("Cursor restored");
		} catch (e) {
			console.error("Cursor restore error:", e);
		}

		window._savedEditorCursor = null;
	};

	// Scroll the nearest scroll container so that range is visible
	function scrollRangeIntoView(range) {
		//Empty range > getBoundingClientRect may return zeros.
		//Let's collapse the range at the beginning to get the caret position.
		let rect = range.getBoundingClientRect();

		if (rect.width === 0 && rect.height === 0) {
			const collapsed = range.cloneRange();
			collapsed.collapse(true);
			rect = collapsed.getBoundingClientRect();
		}

		//We look for the nearest actually scrolling container.
		//We go through both the regular DOM and the shadow-root.
		const scroller = findScrollParent(range.startContainer);

		if (scroller) {
			const scrollerRect = scroller.getBoundingClientRect();
			const margin = 8; // a small indentation so that the carriage does not stick to the edge

			// If the selection is above the visible area
			if (rect.top < scrollerRect.top + margin) {
				scroller.scrollTop -= (scrollerRect.top + margin) - rect.top;
			}
			// If the selection is below the visible area
			else if (rect.bottom > scrollerRect.bottom - margin) {
				scroller.scrollTop += rect.bottom - (scrollerRect.bottom - margin);
			}

			// Horizontal scrolling (for long lines without wrapping)
			if (rect.left < scrollerRect.left + margin) {
				scroller.scrollLeft -= (scrollerRect.left + margin) - rect.left;
			} else if (rect.right > scrollerRect.right - margin) {
				scroller.scrollLeft += rect.right - (scrollerRect.right - margin);
			}

			// console.log("Scrolled to cursor via scroller:", scroller);
		} else {
			// Fallback -native scrollIntoView
			const el = range.startContainer.nodeType === Node.ELEMENT_NODE
				? range.startContainer
				: range.startContainer.parentElement;
			el?.scrollIntoView({ block: "nearest", inline: "nearest" });
		}
	}

	// Find the closest parent who can actually scroll.
	// Takes into account transition through shadow-root.
	function findScrollParent(node) {
		let el = node.nodeType === Node.ELEMENT_NODE
			? node
			: node.parentElement;

		while (el) {
			const style = getComputedStyle(el);
			const canScrollY = /(auto|scroll)/.test(style.overflowY)
				&& el.scrollHeight > el.clientHeight;
			const canScrollX = /(auto|scroll)/.test(style.overflowX)
				&& el.scrollWidth > el.clientWidth;

			if (canScrollY || canScrollX) return el;

			// Traversing the shadow DOM boundary
			if (el.parentElement) {
				el = el.parentElement;
			} else {
				const root = el.getRootNode();
				el = root instanceof ShadowRoot ? root.host : null;
			}
		}
		return null;
	}
	

    function attachEditor(host) {
        const shadow = host.shadowRoot;
        if (!shadow) return;

        const editable = shadow.querySelector("anki-editable");
        if (!editable || editable.dataset.selectionListener) return;

        editable.dataset.selectionListener = "true";

        window.saveSelectedHTML = function () {
            const selection = window.getSelection();
			
			// console.log({
				// getComposedRanges: typeof selection.getComposedRanges,
				// rangeCount: selection.rangeCount,
				// activeElement: document.activeElement,
				// userAgent: navigator.userAgent
			// });
			
            if (!selection || selection.rangeCount === 0) {
				window._savedSelectedHTML = "";
				return;
			}

            const ranges = selection.getComposedRanges({
                shadowRoots: [shadow]
            });

            if (!ranges.length || ranges[0].collapsed) {
				window._savedSelectedHTML = "";
				return;
			}

            const r = ranges[0];
            const range = document.createRange();

            range.setStart(r.startContainer, r.startOffset);
            range.setEnd(r.endContainer, r.endOffset);

            const container = document.createElement("div");
            container.appendChild(range.cloneContents());

            const html = container.innerHTML;
			
			window._savedSelectedHTML = html;
            //console.log("Saved selected HTML:", html);
        }

        editable.addEventListener("mouseup", window.saveSelectedHTML, true);
        editable.addEventListener("keyup", window.saveSelectedHTML, true);		
		

    }

    function scanEditors() {        
		document.querySelectorAll(".rich-text-editable").forEach(attachEditor);		
    }

    scanEditors();

    const observer = new MutationObserver(scanEditors);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log("Selection script initialized");

})();

