// ==UserScript==
// @name               EH Hyperlink
// @name:zh-TW         EH 語言版本跳轉
// @name:zh-CN         EH 语言版本跳转
// @name:ja            EH 言語版ジャンプ
// @namespace          https://github.com/Tsuyumi25/EhHyperlink
// @version            0.1.0
// @author             tsuyumi
// @description        Jump to other language editions of the current E-Hentai / ExHentai gallery, matched by structured title analysis
// @description:zh-TW  在 E-Hentai / ExHentai 畫廊頁一鍵跳轉到其他語言版本，以標題結構分析比對
// @description:zh-CN  在 E-Hentai / ExHentai 画廊页一键跳转到其他语言版本，以标题结构分析比对
// @description:ja     E-Hentai / ExHentai のギャラリーから他言語版へジャンプ。タイトル構造解析で照合
// @license            MIT
// @icon               https://e-hentai.org/favicon.ico
// @homepageURL        https://github.com/Tsuyumi25/EhHyperlink
// @supportURL         https://github.com/Tsuyumi25/EhHyperlink/issues
// @match              https://exhentai.org/g/*
// @match              https://e-hentai.org/g/*
// @grant              GM.deleteValue
// @grant              GM.getValue
// @grant              GM.listValues
// @grant              GM.setValue
// @grant              GM_addStyle
// @run-at             document-end
// ==/UserScript==

(async function() {
	"use strict";
	var s = new Set();
	var _css = async (t) => {
		if (s.has(t)) return;
		s.add(t);
		((c) => {
			if (typeof GM_addStyle === "function") GM_addStyle(c);
			else (document.head || document.documentElement).appendChild(document.createElement("style")).append(c);
		})(t);
	};
	_css(" .ehl-settings{text-align:left;white-space:nowrap;background:var(--ehl-bg,#fff);border:1px solid var(--ehl-border,currentColor);z-index:10;border-radius:0 0 9px 9px;width:max-content;margin:0 auto;padding:8px 10px;font-size:12px;font-weight:400;position:absolute;top:100%;left:0;right:0;box-shadow:0 3px 8px #00000040}.ehl-settings__row{align-items:center;gap:8px;display:flex}.ehl-settings__label{font-weight:700}.ehl-settings__option{cursor:pointer;align-items:center;gap:3px;display:inline-flex}.ehl-settings__option input{margin:0}.ehl-settings__perks{border-top:1px solid var(--ehl-border,currentColor);white-space:normal;width:min(320px,100vw - 40px);margin-top:8px;padding-top:8px;line-height:1.5}.ehl-settings__perks p{margin:0 0 4px}.ehl-settings__perks a{text-underline-offset:2px;text-decoration:underline}#ehl-app{box-sizing:border-box;min-width:720px;max-width:1200px;margin:10px auto 0}#ehl-app+.gm{margin-top:0}@media screen and (width<=1230px){#ehl-app{max-width:960px}}@media screen and (width<=990px){#ehl-app{max-width:720px}}.ehl-box{text-align:left;justify-content:center;font-size:12px;font-weight:700;display:flex;position:relative}.ehl-tabs{background:var(--ehl-bg,#fff);border:1px solid var(--ehl-border,currentColor);border-bottom:0;border-radius:9px 9px 0 0;align-items:stretch;display:flex}.ehl-status{opacity:.7;white-space:nowrap;align-items:center;height:22px;padding:0 8px;display:flex}.ehl-unit{display:flex}.ehl-badge,.ehl-icon{height:22px;font:inherit;color:inherit;cursor:pointer;white-space:nowrap;background:0 0;border:0;align-items:center;margin:0;line-height:1;display:flex}.ehl-tabs>:not(:first-child)>.ehl-badge,.ehl-tabs>:not(:first-child)>.ehl-icon,.ehl-tabs>:not(:first-child).ehl-status{border-left:1px solid var(--ehl-border,currentColor)}.ehl-badge{letter-spacing:.04em;gap:4px;padding:0 8px;font-size:11px}.ehl-icon{opacity:.6;padding:0 6px}.ehl-icon:hover,.ehl-icon--active{opacity:1}.ehl-tab--pinned{opacity:1;box-shadow:inset 0 -2px}.ehl-list{--ehl-cover-h:10em;white-space:nowrap;background:var(--ehl-bg,#fff);border:1px solid var(--ehl-border,currentColor);z-index:10;border-radius:0 0 9px 9px;width:max-content;margin:0 auto;padding:4px 10px 8px;display:none;position:absolute;top:100%;left:0;right:0;box-shadow:0 3px 8px #00000040}.ehl-unit--open .ehl-list{display:block}.ehl-asof{border-bottom:1px dashed var(--ehl-border,currentColor);justify-content:space-between;align-items:center;gap:12px;padding-bottom:4px;display:flex}.ehl-refetch{font:inherit;color:inherit;cursor:pointer;opacity:.8;background:0 0;border:1px solid;border-radius:3px;align-items:center;gap:3px;padding:1px 5px;font-size:10px;font-weight:700;display:flex}.ehl-refetch:hover:not(:disabled){opacity:1}.ehl-refetch:disabled{opacity:.35;cursor:default}.ehl-section+.ehl-section{border-top:1px dashed var(--ehl-border,currentColor);margin-top:6px;padding-top:6px}.ehl-head{margin:0 0 2px;font-size:11px;font-weight:700;line-height:18px}.ehl-language{box-sizing:border-box;color:#fff;letter-spacing:0;vertical-align:middle;background:#64748b;border-radius:3px;flex-shrink:0;justify-content:center;align-items:center;min-width:22px;height:18px;padding:0 4px;font-size:11px;font-weight:700;line-height:1;display:inline-flex}.ehl-language[data-language=chinese]{background:#be185d}.ehl-language[data-language=japanese]{background:#7c3aed}.ehl-language[data-language=english]{background:#b45309}.ehl-language[data-language=korean]{background:#2563eb}.ehl-head>.ehl-language{margin-right:4px}.ehl-count{opacity:.7;margin-left:4px;font-weight:400}.ehl-list ul{margin:0;padding:0;list-style:none}.ehl-list li{padding:2px 0;display:block}.ehl-list li.ehl-row{padding:0}.ehl-rowlink{min-height:var(--ehl-cover-h);border-radius:3px;align-items:stretch;gap:6px;padding:2px 3px;display:flex}.ehl-rowlink:hover{background:color-mix(in srgb, currentColor 12%, transparent)}.ehl-thumb{width:calc(var(--ehl-cover-h) * 5 / 7);flex:none;position:relative}.ehl-thumb img,.ehl-cover-art img{box-sizing:border-box;border:1px solid var(--ehl-border,currentColor);border-radius:2px;max-width:100%;max-height:100%;position:absolute;top:0;left:50%;transform:translate(-50%)}.ehl-covers{grid-template-columns:repeat(6, calc(var(--ehl-cover-h) * 5 / 7));gap:4px;display:grid}.ehl-cover{flex-direction:column;gap:2px;display:flex}.ehl-cover-art{height:var(--ehl-cover-h);flex:none;position:relative}.ehl-cover:hover .ehl-cover-art img{box-shadow:0 0 0 2px color-mix(in srgb, currentColor 30%, transparent);border-color:currentColor}.ehl-rowtext{min-width:0;display:block}.ehl-title{white-space:normal;overflow-wrap:anywhere;max-width:520px;display:block}.ehl-facts{flex-wrap:wrap;align-items:baseline;gap:0 2px;display:flex}.ehl-facts>:first-child{margin-left:0}.ehl-preview{box-sizing:border-box;border:1px solid var(--ehl-border,currentColor);background:var(--ehl-bg,#fff);pointer-events:none;z-index:11;border-radius:4px;flex-direction:column;gap:4px;padding:5px;display:flex;position:fixed;box-shadow:0 3px 8px #00000040}.ehl-preview img{object-fit:contain;object-position:top;width:100%;min-height:0}.ehl-preview-text{white-space:normal;overflow-wrap:anywhere;flex:0 auto;min-height:0;overflow:hidden}.ehl-preview-title{font-size:11px;line-height:1.25;display:block}.ehl-tags{grid-template-columns:auto 1fr;align-items:start;column-gap:6px;margin-top:3px;font-size:9pt;display:grid}.ehl-tags__row{display:contents}.ehl-tags__label{text-align:right;white-space:nowrap;opacity:.7;padding-top:3px}.ehl-tags__cells{flex-wrap:wrap;min-width:0;display:flex}.ehl-tags__chip{background:color-mix(in srgb, currentColor 8%, transparent);border:1px solid var(--ehl-border,currentColor);white-space:nowrap;border-radius:5px;margin:0 2px 3px;padding:1px 4px}.ehl-stars{letter-spacing:1px;color:color-mix(in srgb, currentColor 35%, transparent);-webkit-text-stroke:.5px currentColor;paint-order:stroke fill;white-space:nowrap;font-size:11px;line-height:14px;display:inline-block;position:relative}.ehl-stars-on{color:var(--ehl-star);position:absolute;top:0;left:0;overflow:hidden}.ehl-stars--r{--ehl-star:#e23636}.ehl-stars--g{--ehl-star:#34b25e}.ehl-stars--b{--ehl-star:#3c8cdd}.ehl-stars--y{--ehl-star:#f4c025}.ehl-books{display:block}.ehl-book{border:1px solid var(--ehl-book);background:color-mix(in srgb, var(--ehl-book) 14%, transparent);border-left-width:3px;border-radius:3px;margin:4px 0;padding:0 5px 0 0;display:block}.ehl-book ul{padding-left:8px}.ehl-book--0{--ehl-book:#4299d7}.ehl-book--1{--ehl-book:#3db870}.ehl-book--2{--ehl-book:#e29236}.ehl-book--3{--ehl-book:#b66ecf}.ehl-list a{text-decoration:none}.ehl-subtitle{opacity:.7;font-size:11px;display:block}.ehl-url{white-space:normal;overflow-wrap:anywhere;max-width:560px;display:block}.ehl-meta{opacity:.7;margin-left:6px}.ehl-flag{opacity:.85;border:1px solid;border-radius:3px;margin-left:6px;padding:0 4px;font-size:10px;line-height:14px}\n/*$vite$:1*/ ");
	function makeMap(str) {
		const map = Object.create(null);
		for (const key of str.split(",")) map[key] = 1;
		return (val) => val in map;
	}
	var EMPTY_OBJ = {};
	var EMPTY_ARR = [];
	var NOOP = () => {};
	var NO = () => false;
	var isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
	var isModelListener = (key) => key.startsWith("onUpdate:");
	var extend = Object.assign;
	var remove = (arr, el) => {
		const i = arr.indexOf(el);
		if (i > -1) arr.splice(i, 1);
	};
	var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
	var hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
	var isArray = Array.isArray;
	var isMap = (val) => toTypeString(val) === "[object Map]";
	var isSet = (val) => toTypeString(val) === "[object Set]";
	var isDate = (val) => toTypeString(val) === "[object Date]";
	var isFunction = (val) => typeof val === "function";
	var isString = (val) => typeof val === "string";
	var isSymbol = (val) => typeof val === "symbol";
	var isObject = (val) => val !== null && typeof val === "object";
	var isPromise = (val) => {
		return (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
	};
	var objectToString = Object.prototype.toString;
	var toTypeString = (value) => objectToString.call(value);
	var toRawType = (value) => {
		return toTypeString(value).slice(8, -1);
	};
	var isPlainObject = (val) => toTypeString(val) === "[object Object]";
	var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
	var isReservedProp = makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
	var cacheStringFunction = (fn) => {
		const cache = Object.create(null);
		return ((str) => {
			return cache[str] || (cache[str] = fn(str));
		});
	};
	var camelizeRE = /-\w/g;
	var camelize = cacheStringFunction((str) => {
		return str.replace(camelizeRE, (c) => c.slice(1).toUpperCase());
	});
	var hyphenateRE = /\B([A-Z])/g;
	var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
	var capitalize = cacheStringFunction((str) => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	});
	var toHandlerKey = cacheStringFunction((str) => {
		return str ? `on${capitalize(str)}` : ``;
	});
	var hasChanged = (value, oldValue) => !Object.is(value, oldValue);
	var invokeArrayFns = (fns, ...arg) => {
		for (let i = 0; i < fns.length; i++) fns[i](...arg);
	};
	var def = (obj, key, value, writable = false) => {
		Object.defineProperty(obj, key, {
			configurable: true,
			enumerable: false,
			writable,
			value
		});
	};
	var looseToNumber = (val) => {
		const n = parseFloat(val);
		return isNaN(n) ? val : n;
	};
	var _globalThis;
	var getGlobalThis = () => {
		return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
	};
	function normalizeStyle(value) {
		if (isArray(value)) {
			const res = {};
			for (let i = 0; i < value.length; i++) {
				const item = value[i];
				const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
				if (normalized) for (const key in normalized) res[key] = normalized[key];
			}
			return res;
		} else if (isString(value) || isObject(value)) return value;
	}
	var listDelimiterRE = /;(?![^(]*\))/g;
	var propertyDelimiterRE = /:([^]+)/;
	var styleCommentRE = /\/\*[^]*?\*\//g;
	function parseStringStyle(cssText) {
		const ret = {};
		cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
			if (item) {
				const tmp = item.split(propertyDelimiterRE);
				tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
			}
		});
		return ret;
	}
	function normalizeClass(value) {
		let res = "";
		if (isString(value)) res = value;
		else if (isArray(value)) for (let i = 0; i < value.length; i++) {
			const normalized = normalizeClass(value[i]);
			if (normalized) res += normalized + " ";
		}
		else if (isObject(value)) {
			for (const name in value) if (value[name]) res += name + " ";
		}
		return res.trim();
	}
	var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
	var isSpecialBooleanAttr = makeMap(specialBooleanAttrs);
	specialBooleanAttrs + "";
	function includeBooleanAttr(value) {
		return !!value || value === "";
	}
	function looseCompareArrays(a, b) {
		if (a.length !== b.length) return false;
		let equal = true;
		for (let i = 0; equal && i < a.length; i++) equal = looseEqual(a[i], b[i]);
		return equal;
	}
	function looseCompareCollections(a, b) {
		if (a.size !== b.size) return false;
		const candidates = Array.from(b);
		const matched = new Uint8Array(candidates.length);
		for (const item of a) {
			let index = -1;
			for (let i = 0; i < candidates.length; i++) if (!matched[i] && looseEqual(item, candidates[i])) {
				index = i;
				break;
			}
			if (index < 0) return false;
			matched[index] = 1;
		}
		return true;
	}
	function looseEqual(a, b) {
		if (a === b) return true;
		let aValidType = isDate(a);
		let bValidType = isDate(b);
		if (aValidType || bValidType) return aValidType && bValidType ? a.getTime() === b.getTime() : false;
		aValidType = isSymbol(a);
		bValidType = isSymbol(b);
		if (aValidType || bValidType) return a === b;
		aValidType = isArray(a);
		bValidType = isArray(b);
		if (aValidType || bValidType) return aValidType && bValidType ? looseCompareArrays(a, b) : false;
		aValidType = isObject(a);
		bValidType = isObject(b);
		if (aValidType || bValidType) {
			if (!aValidType || !bValidType) return false;
			aValidType = isMap(a);
			bValidType = isMap(b);
			if (aValidType || bValidType) return aValidType && bValidType ? looseCompareCollections(a, b) : false;
			aValidType = isSet(a);
			bValidType = isSet(b);
			if (aValidType || bValidType) return aValidType && bValidType ? looseCompareCollections(a, b) : false;
			if (Object.keys(a).length !== Object.keys(b).length) return false;
			for (const key in a) {
				const aHasKey = a.hasOwnProperty(key);
				const bHasKey = b.hasOwnProperty(key);
				if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) return false;
			}
		}
		return String(a) === String(b);
	}
	function looseIndexOf(arr, val) {
		return arr.findIndex((item) => looseEqual(item, val));
	}
	var isRef$1 = (val) => {
		return !!(val && val["__v_isRef"] === true);
	};
	var toDisplayString = (val) => {
		return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef$1(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
	};
	var replacer = (_key, val) => {
		if (isRef$1(val)) return replacer(_key, val.value);
		else if (isMap(val)) return { [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2], i) => {
			entries[stringifySymbol(key, i) + " =>"] = val2;
			return entries;
		}, {}) };
		else if (isSet(val)) return { [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v)) };
		else if (isSymbol(val)) return stringifySymbol(val);
		else if (isObject(val) && !isArray(val) && !isPlainObject(val)) return String(val);
		return val;
	};
	var stringifySymbol = (v, i = "") => {
		var _a;
		return isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v;
	};
	var activeEffectScope;
	var EffectScope = class {
		constructor(detached = false) {
			this.detached = detached;
			this._active = true;
			this._on = 0;
			this.effects = [];
			this.cleanups = [];
			this._isPaused = false;
			this._warnOnRun = true;
			this.__v_skip = true;
			if (!detached && activeEffectScope) {
				if (activeEffectScope.active) {
					this.parent = activeEffectScope;
					this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
				} else {
					this._active = false;
					this._warnOnRun = false;
				}
			}
		}
		get active() {
			return this._active;
		}
		pause() {
			if (this._active) {
				this._isPaused = true;
				let i, l;
				if (this.scopes) {
					const scopes = this.scopes.slice();
					for (i = 0, l = scopes.length; i < l; i++) scopes[i].pause();
				}
				for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].pause();
			}
		}
		resume() {
			if (this._active) {
				if (this._isPaused) {
					this._isPaused = false;
					let i, l;
					if (this.scopes) {
						const scopes = this.scopes.slice();
						for (i = 0, l = scopes.length; i < l; i++) scopes[i].resume();
					}
					const effects = this.effects.slice();
					for (i = 0, l = effects.length; i < l; i++) effects[i].resume();
				}
			}
		}
		run(fn) {
			if (this._active) {
				const currentEffectScope = activeEffectScope;
				try {
					activeEffectScope = this;
					return fn();
				} finally {
					activeEffectScope = currentEffectScope;
				}
			}
		}
		on() {
			if (++this._on === 1) {
				this.prevScope = activeEffectScope;
				activeEffectScope = this;
			}
		}
		off() {
			if (this._on > 0 && --this._on === 0) {
				if (activeEffectScope === this) activeEffectScope = this.prevScope;
				else {
					let current = activeEffectScope;
					while (current) {
						if (current.prevScope === this) {
							current.prevScope = this.prevScope;
							break;
						}
						current = current.prevScope;
					}
				}
				this.prevScope = void 0;
			}
		}
		stop(fromParent) {
			if (this._active) {
				this._active = false;
				let i, l;
				for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].stop();
				this.effects.length = 0;
				for (i = 0, l = this.cleanups.length; i < l; i++) this.cleanups[i]();
				this.cleanups.length = 0;
				if (this.scopes) {
					const scopes = this.scopes.slice();
					for (i = 0, l = scopes.length; i < l; i++) scopes[i].stop(true);
					this.scopes.length = 0;
				}
				if (!this.detached && this.parent && !fromParent) {
					const last = this.parent.scopes.pop();
					if (last && last !== this) {
						this.parent.scopes[this.index] = last;
						last.index = this.index;
					}
				}
				this.parent = void 0;
			}
		}
	};
	function getCurrentScope() {
		return activeEffectScope;
	}
	var activeSub;
	var pausedQueueEffects = new WeakSet();
	var ReactiveEffect = class {
		constructor(fn) {
			this.fn = fn;
			this.deps = void 0;
			this.depsTail = void 0;
			this.flags = 5;
			this.next = void 0;
			this.cleanup = void 0;
			this.scheduler = void 0;
			if (activeEffectScope) {
				if (activeEffectScope.active) activeEffectScope.effects.push(this);
				else this.flags &= -2;
			}
		}
		pause() {
			this.flags |= 64;
		}
		resume() {
			if (this.flags & 64) {
				this.flags &= -65;
				if (pausedQueueEffects.has(this)) {
					pausedQueueEffects.delete(this);
					this.trigger();
				}
			}
		}
		notify() {
			if (this.flags & 2 && !(this.flags & 32)) return;
			if (!(this.flags & 8)) batch(this);
		}
		run() {
			if (!(this.flags & 1)) return this.fn();
			this.flags |= 2;
			cleanupEffect(this);
			prepareDeps(this);
			const prevEffect = activeSub;
			const prevShouldTrack = shouldTrack;
			activeSub = this;
			shouldTrack = true;
			try {
				return this.fn();
			} finally {
				cleanupDeps(this);
				activeSub = prevEffect;
				shouldTrack = prevShouldTrack;
				this.flags &= -3;
			}
		}
		stop() {
			if (this.flags & 1) {
				for (let link = this.deps; link; link = link.nextDep) removeSub(link);
				this.deps = this.depsTail = void 0;
				cleanupEffect(this);
				this.onStop && this.onStop();
				this.flags &= -2;
			}
		}
		trigger() {
			if (this.flags & 64) pausedQueueEffects.add(this);
			else if (this.scheduler) this.scheduler();
			else this.runIfDirty();
		}
		runIfDirty() {
			if (isDirty(this)) this.run();
		}
		get dirty() {
			return isDirty(this);
		}
	};
	var batchDepth = 0;
	var batchedSub;
	var batchedComputed;
	function batch(sub, isComputed = false) {
		sub.flags |= 8;
		if (isComputed) {
			sub.next = batchedComputed;
			batchedComputed = sub;
			return;
		}
		sub.next = batchedSub;
		batchedSub = sub;
	}
	function startBatch() {
		batchDepth++;
	}
	function endBatch() {
		if (--batchDepth > 0) return;
		if (batchedComputed) {
			let e = batchedComputed;
			batchedComputed = void 0;
			while (e) {
				const next = e.next;
				e.next = void 0;
				e.flags &= -9;
				e = next;
			}
		}
		let error;
		while (batchedSub) {
			let e = batchedSub;
			batchedSub = void 0;
			while (e) {
				const next = e.next;
				e.next = void 0;
				e.flags &= -9;
				if (e.flags & 1) try {
					e.trigger();
				} catch (err) {
					if (!error) error = err;
				}
				e = next;
			}
		}
		if (error) throw error;
	}
	function prepareDeps(sub) {
		for (let link = sub.deps; link; link = link.nextDep) {
			link.version = -1;
			link.prevActiveLink = link.dep.activeLink;
			link.dep.activeLink = link;
		}
	}
	function cleanupDeps(sub) {
		let head;
		let tail = sub.depsTail;
		let link = tail;
		while (link) {
			const prev = link.prevDep;
			if (link.version === -1) {
				if (link === tail) tail = prev;
				removeSub(link);
				removeDep(link);
			} else head = link;
			link.dep.activeLink = link.prevActiveLink;
			link.prevActiveLink = void 0;
			link = prev;
		}
		sub.deps = head;
		sub.depsTail = tail;
	}
	function isDirty(sub) {
		for (let link = sub.deps; link; link = link.nextDep) if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) return true;
		if (sub._dirty) return true;
		return false;
	}
	function refreshComputed(computed) {
		if (computed.flags & 4 && !(computed.flags & 16)) return;
		computed.flags &= -17;
		if (computed.globalVersion === globalVersion) return;
		computed.globalVersion = globalVersion;
		if (!computed.isSSR && computed.flags & 128 && (!computed.deps && !computed._dirty || !isDirty(computed))) return;
		computed.flags |= 2;
		const dep = computed.dep;
		const prevSub = activeSub;
		const prevShouldTrack = shouldTrack;
		activeSub = computed;
		shouldTrack = true;
		try {
			prepareDeps(computed);
			const value = computed.fn(computed._value);
			if (dep.version === 0 || hasChanged(value, computed._value)) {
				computed.flags |= 128;
				computed._value = value;
				dep.version++;
			}
		} catch (err) {
			dep.version++;
			throw err;
		} finally {
			activeSub = prevSub;
			shouldTrack = prevShouldTrack;
			cleanupDeps(computed);
			computed.flags &= -3;
		}
	}
	function removeSub(link, soft = false) {
		const { dep, prevSub, nextSub } = link;
		if (prevSub) {
			prevSub.nextSub = nextSub;
			link.prevSub = void 0;
		}
		if (nextSub) {
			nextSub.prevSub = prevSub;
			link.nextSub = void 0;
		}
		if (dep.subs === link) {
			dep.subs = prevSub;
			if (!prevSub && dep.computed) {
				dep.computed.flags &= -5;
				for (let l = dep.computed.deps; l; l = l.nextDep) removeSub(l, true);
			}
		}
		if (!soft && !--dep.sc && dep.map) dep.map.delete(dep.key);
	}
	function removeDep(link) {
		const { prevDep, nextDep } = link;
		if (prevDep) {
			prevDep.nextDep = nextDep;
			link.prevDep = void 0;
		}
		if (nextDep) {
			nextDep.prevDep = prevDep;
			link.nextDep = void 0;
		}
	}
	var shouldTrack = true;
	var trackStack = [];
	function pauseTracking() {
		trackStack.push(shouldTrack);
		shouldTrack = false;
	}
	function resetTracking() {
		const last = trackStack.pop();
		shouldTrack = last === void 0 ? true : last;
	}
	function cleanupEffect(e) {
		const { cleanup } = e;
		e.cleanup = void 0;
		if (cleanup) {
			const prevSub = activeSub;
			activeSub = void 0;
			try {
				cleanup();
			} finally {
				activeSub = prevSub;
			}
		}
	}
	var globalVersion = 0;
	var Link = class {
		constructor(sub, dep) {
			this.sub = sub;
			this.dep = dep;
			this.version = dep.version;
			this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
		}
	};
	var Dep = class {
		constructor(computed) {
			this.computed = computed;
			this.version = 0;
			this.activeLink = void 0;
			this.subs = void 0;
			this.map = void 0;
			this.key = void 0;
			this.sc = 0;
			this.__v_skip = true;
		}
		track(debugInfo) {
			if (!activeSub || !shouldTrack || activeSub === this.computed) return;
			let link = this.activeLink;
			if (link === void 0 || link.sub !== activeSub) {
				link = this.activeLink = new Link(activeSub, this);
				if (!activeSub.deps) activeSub.deps = activeSub.depsTail = link;
				else {
					link.prevDep = activeSub.depsTail;
					activeSub.depsTail.nextDep = link;
					activeSub.depsTail = link;
				}
				addSub(link);
			} else if (link.version === -1) {
				link.version = this.version;
				if (link.nextDep) {
					const next = link.nextDep;
					next.prevDep = link.prevDep;
					if (link.prevDep) link.prevDep.nextDep = next;
					link.prevDep = activeSub.depsTail;
					link.nextDep = void 0;
					activeSub.depsTail.nextDep = link;
					activeSub.depsTail = link;
					if (activeSub.deps === link) activeSub.deps = next;
				}
			}
			return link;
		}
		trigger(debugInfo) {
			this.version++;
			globalVersion++;
			this.notify(debugInfo);
		}
		notify(debugInfo) {
			startBatch();
			try {
				for (let link = this.subs; link; link = link.prevSub) if (link.sub.notify()) link.sub.dep.notify();
			} finally {
				endBatch();
			}
		}
	};
	function addSub(link) {
		link.dep.sc++;
		if (link.sub.flags & 4) {
			const computed = link.dep.computed;
			if (computed && !link.dep.subs) {
				computed.flags |= 20;
				for (let l = computed.deps; l; l = l.nextDep) addSub(l);
			}
			const currentTail = link.dep.subs;
			if (currentTail !== link) {
				link.prevSub = currentTail;
				if (currentTail) currentTail.nextSub = link;
			}
			link.dep.subs = link;
		}
	}
	var targetMap = new WeakMap();
	var ITERATE_KEY = Symbol("");
	var MAP_KEY_ITERATE_KEY = Symbol("");
	var ARRAY_ITERATE_KEY = Symbol("");
	function track(target, type, key) {
		if (shouldTrack && activeSub) {
			let depsMap = targetMap.get(target);
			if (!depsMap) targetMap.set(target, depsMap = new Map());
			let dep = depsMap.get(key);
			if (!dep) {
				depsMap.set(key, dep = new Dep());
				dep.map = depsMap;
				dep.key = key;
			}
			dep.track();
		}
	}
	function trigger(target, type, key, newValue, oldValue, oldTarget) {
		const depsMap = targetMap.get(target);
		if (!depsMap) {
			globalVersion++;
			return;
		}
		const run = (dep) => {
			if (dep) dep.trigger();
		};
		startBatch();
		if (type === "clear") depsMap.forEach(run);
		else {
			const targetIsArray = isArray(target);
			const isArrayIndex = targetIsArray && isIntegerKey(key);
			if (targetIsArray && key === "length") {
				const newLength = Number(newValue);
				depsMap.forEach((dep, key2) => {
					if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) run(dep);
				});
			} else {
				if (key !== void 0 || depsMap.has(void 0)) run(depsMap.get(key));
				if (isArrayIndex) run(depsMap.get(ARRAY_ITERATE_KEY));
				switch (type) {
					case "add":
						if (!targetIsArray) {
							run(depsMap.get(ITERATE_KEY));
							if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
						} else if (isArrayIndex) run(depsMap.get("length"));
						break;
					case "delete":
						if (!targetIsArray) {
							run(depsMap.get(ITERATE_KEY));
							if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
						}
						break;
					case "set": if (isMap(target)) run(depsMap.get(ITERATE_KEY));
				}
			}
		}
		endBatch();
	}
	function reactiveReadArray(array) {
		const raw = toRaw(array);
		if (raw === array) return raw;
		track(raw, "iterate", ARRAY_ITERATE_KEY);
		return isShallow(array) ? raw : raw.map(toReactive);
	}
	function shallowReadArray(arr) {
		track(arr = toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
		return arr;
	}
	function toWrapped(target, item) {
		if (isReadonly(target)) return isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
		return toReactive(item);
	}
	var arrayInstrumentations = {
		__proto__: null,
		[Symbol.iterator]() {
			return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
		},
		concat(...args) {
			return reactiveReadArray(this).concat(...args.map((x) => isArray(x) ? reactiveReadArray(x) : x));
		},
		entries() {
			return iterator(this, "entries", (value) => {
				value[1] = toWrapped(this, value[1]);
				return value;
			});
		},
		every(fn, thisArg) {
			return apply(this, "every", fn, thisArg, void 0, arguments);
		},
		filter(fn, thisArg) {
			return apply(this, "filter", fn, thisArg, (v) => v.map((item) => toWrapped(this, item)), arguments);
		},
		find(fn, thisArg) {
			return apply(this, "find", fn, thisArg, (item) => toWrapped(this, item), arguments);
		},
		findIndex(fn, thisArg) {
			return apply(this, "findIndex", fn, thisArg, void 0, arguments);
		},
		findLast(fn, thisArg) {
			return apply(this, "findLast", fn, thisArg, (item) => toWrapped(this, item), arguments);
		},
		findLastIndex(fn, thisArg) {
			return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
		},
		forEach(fn, thisArg) {
			return apply(this, "forEach", fn, thisArg, void 0, arguments);
		},
		includes(...args) {
			return searchProxy(this, "includes", args);
		},
		indexOf(...args) {
			return searchProxy(this, "indexOf", args);
		},
		join(separator) {
			return reactiveReadArray(this).join(separator);
		},
		lastIndexOf(...args) {
			return searchProxy(this, "lastIndexOf", args);
		},
		map(fn, thisArg) {
			return apply(this, "map", fn, thisArg, void 0, arguments);
		},
		pop() {
			return noTracking(this, "pop");
		},
		push(...args) {
			return noTracking(this, "push", args);
		},
		reduce(fn, ...args) {
			return reduce(this, "reduce", fn, args);
		},
		reduceRight(fn, ...args) {
			return reduce(this, "reduceRight", fn, args);
		},
		shift() {
			return noTracking(this, "shift");
		},
		some(fn, thisArg) {
			return apply(this, "some", fn, thisArg, void 0, arguments);
		},
		splice(...args) {
			return noTracking(this, "splice", args);
		},
		toReversed() {
			return reactiveReadArray(this).toReversed();
		},
		toSorted(comparer) {
			return reactiveReadArray(this).toSorted(comparer);
		},
		toSpliced(...args) {
			return reactiveReadArray(this).toSpliced(...args);
		},
		unshift(...args) {
			return noTracking(this, "unshift", args);
		},
		values() {
			return iterator(this, "values", (item) => toWrapped(this, item));
		}
	};
	function iterator(self, method, wrapValue) {
		const arr = shallowReadArray(self);
		const iter = arr[method]();
		if (arr !== self && !isShallow(self)) {
			iter._next = iter.next;
			iter.next = () => {
				const result = iter._next();
				if (!result.done) result.value = wrapValue(result.value);
				return result;
			};
		}
		return iter;
	}
	var arrayProto = Array.prototype;
	function apply(self, method, fn, thisArg, wrappedRetFn, args) {
		const arr = shallowReadArray(self);
		const needsWrap = arr !== self && !isShallow(self);
		const methodFn = arr[method];
		if (methodFn !== arrayProto[method]) {
			const result2 = methodFn.apply(self, args);
			return needsWrap ? toReactive(result2) : result2;
		}
		let wrappedFn = fn;
		if (arr !== self) {
			if (needsWrap) wrappedFn = function(item, index) {
				return fn.call(this, toWrapped(self, item), index, self);
			};
			else if (fn.length > 2) wrappedFn = function(item, index) {
				return fn.call(this, item, index, self);
			};
		}
		const result = methodFn.call(arr, wrappedFn, thisArg);
		return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
	}
	function reduce(self, method, fn, args) {
		const arr = shallowReadArray(self);
		const needsWrap = arr !== self && !isShallow(self);
		let wrappedFn = fn;
		let wrapInitialAccumulator = false;
		if (arr !== self) {
			if (needsWrap) {
				wrapInitialAccumulator = args.length === 0;
				wrappedFn = function(acc, item, index) {
					if (wrapInitialAccumulator) {
						wrapInitialAccumulator = false;
						acc = toWrapped(self, acc);
					}
					return fn.call(this, acc, toWrapped(self, item), index, self);
				};
			} else if (fn.length > 3) wrappedFn = function(acc, item, index) {
				return fn.call(this, acc, item, index, self);
			};
		}
		const result = arr[method](wrappedFn, ...args);
		return wrapInitialAccumulator ? toWrapped(self, result) : result;
	}
	function searchProxy(self, method, args) {
		const arr = toRaw(self);
		track(arr, "iterate", ARRAY_ITERATE_KEY);
		const res = arr[method](...args);
		if ((res === -1 || res === false) && isProxy(args[0])) {
			args[0] = toRaw(args[0]);
			return arr[method](...args);
		}
		return res;
	}
	function noTracking(self, method, args = []) {
		pauseTracking();
		startBatch();
		const res = toRaw(self)[method].apply(self, args);
		endBatch();
		resetTracking();
		return res;
	}
	var isNonTrackableKeys = makeMap(`__proto__,__v_isRef,__isVue`);
	var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol));
	function hasOwnProperty(key) {
		if (!isSymbol(key)) key = String(key);
		const obj = toRaw(this);
		track(obj, "has", key);
		return obj.hasOwnProperty(key);
	}
	var BaseReactiveHandler = class {
		constructor(_isReadonly = false, _isShallow = false) {
			this._isReadonly = _isReadonly;
			this._isShallow = _isShallow;
		}
		get(target, key, receiver) {
			if (key === "__v_skip") return target["__v_skip"];
			const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
			if (key === "__v_isReactive") return !isReadonly2;
			else if (key === "__v_isReadonly") return isReadonly2;
			else if (key === "__v_isShallow") return isShallow2;
			else if (key === "__v_raw") {
				if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) return target;
				return;
			}
			const targetIsArray = isArray(target);
			if (!isReadonly2) {
				let fn;
				if (targetIsArray && (fn = arrayInstrumentations[key])) return fn;
				if (key === "hasOwnProperty") return hasOwnProperty;
			}
			const res = Reflect.get(target, key, isRef(target) ? target : receiver);
			if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) return res;
			if (!isReadonly2) track(target, "get", key);
			if (isShallow2) return res;
			if (isRef(res)) {
				const value = targetIsArray && isIntegerKey(key) ? res : res.value;
				return isReadonly2 && isObject(value) ? readonly(value) : value;
			}
			if (isObject(res)) return isReadonly2 ? readonly(res) : reactive(res);
			return res;
		}
	};
	var MutableReactiveHandler = class extends BaseReactiveHandler {
		constructor(isShallow2 = false) {
			super(false, isShallow2);
		}
		set(target, key, value, receiver) {
			let oldValue = target[key];
			const isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
			if (!this._isShallow) {
				const isOldValueReadonly = isReadonly(oldValue);
				if (!isShallow(value) && !isReadonly(value)) {
					oldValue = toRaw(oldValue);
					value = toRaw(value);
				}
				if (!isArrayWithIntegerKey && isRef(oldValue) && !isRef(value)) {
					if (isOldValueReadonly) return true;
					else {
						oldValue.value = value;
						return true;
					}
				}
			}
			const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
			const result = Reflect.set(target, key, value, isRef(target) ? target : receiver);
			if (target === toRaw(receiver) && result) {
				if (!hadKey) trigger(target, "add", key, value);
				else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
			}
			return result;
		}
		deleteProperty(target, key) {
			const hadKey = hasOwn(target, key);
			const oldValue = target[key];
			const result = Reflect.deleteProperty(target, key);
			if (result && hadKey) trigger(target, "delete", key, void 0, oldValue);
			return result;
		}
		has(target, key) {
			const result = Reflect.has(target, key);
			if (!isSymbol(key) || !builtInSymbols.has(key)) track(target, "has", key);
			return result;
		}
		ownKeys(target) {
			track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
			return Reflect.ownKeys(target);
		}
	};
	var ReadonlyReactiveHandler = class extends BaseReactiveHandler {
		constructor(isShallow2 = false) {
			super(true, isShallow2);
		}
		set(target, key) {
			return true;
		}
		deleteProperty(target, key) {
			return true;
		}
	};
	var mutableHandlers = new MutableReactiveHandler();
	var readonlyHandlers = new ReadonlyReactiveHandler();
	var shallowReactiveHandlers = new MutableReactiveHandler(true);
	var toShallow = (value) => value;
	var getProto = (v) => Reflect.getPrototypeOf(v);
	function createIterableMethod(method, isReadonly2, isShallow2) {
		return function(...args) {
			const target = this["__v_raw"];
			const rawTarget = toRaw(target);
			const targetIsMap = isMap(rawTarget);
			const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
			const isKeyOnly = method === "keys" && targetIsMap;
			const innerIterator = target[method](...args);
			const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
			!isReadonly2 && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
			return extend(Object.create(innerIterator), { next() {
				const { value, done } = innerIterator.next();
				return done ? {
					value,
					done
				} : {
					value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
					done
				};
			} });
		};
	}
	function createReadonlyMethod(type) {
		return function(...args) {
			return type === "delete" ? false : type === "clear" ? void 0 : this;
		};
	}
	function createInstrumentations(readonly, shallow) {
		const instrumentations = {
			get(key) {
				const target = this["__v_raw"];
				const rawTarget = toRaw(target);
				const rawKey = toRaw(key);
				if (!readonly) {
					if (hasChanged(key, rawKey)) track(rawTarget, "get", key);
					track(rawTarget, "get", rawKey);
				}
				const { has } = getProto(rawTarget);
				const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
				if (has.call(rawTarget, key)) return wrap(target.get(key));
				else if (has.call(rawTarget, rawKey)) return wrap(target.get(rawKey));
				else if (target !== rawTarget) target.get(key);
			},
			get size() {
				const target = this["__v_raw"];
				!readonly && track(toRaw(target), "iterate", ITERATE_KEY);
				return target.size;
			},
			has(key) {
				const target = this["__v_raw"];
				const rawTarget = toRaw(target);
				const rawKey = toRaw(key);
				if (!readonly) {
					if (hasChanged(key, rawKey)) track(rawTarget, "has", key);
					track(rawTarget, "has", rawKey);
				}
				return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
			},
			forEach(callback, thisArg) {
				const observed = this;
				const target = observed["__v_raw"];
				const rawTarget = toRaw(target);
				const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
				!readonly && track(rawTarget, "iterate", ITERATE_KEY);
				return target.forEach((value, key) => {
					return callback.call(thisArg, wrap(value), wrap(key), observed);
				});
			}
		};
		extend(instrumentations, readonly ? {
			add: createReadonlyMethod("add"),
			set: createReadonlyMethod("set"),
			delete: createReadonlyMethod("delete"),
			clear: createReadonlyMethod("clear")
		} : {
			add(value) {
				const target = toRaw(this);
				const proto = getProto(target);
				const rawValue = toRaw(value);
				const valueToAdd = !shallow && !isShallow(value) && !isReadonly(value) ? rawValue : value;
				if (!(proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue))) {
					target.add(valueToAdd);
					trigger(target, "add", valueToAdd, valueToAdd);
				}
				return this;
			},
			set(key, value) {
				if (!shallow && !isShallow(value) && !isReadonly(value)) value = toRaw(value);
				const target = toRaw(this);
				const { has, get } = getProto(target);
				let hadKey = has.call(target, key);
				if (!hadKey) {
					key = toRaw(key);
					hadKey = has.call(target, key);
				}
				const oldValue = get.call(target, key);
				target.set(key, value);
				if (!hadKey) trigger(target, "add", key, value);
				else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
				return this;
			},
			delete(key) {
				const target = toRaw(this);
				const { has, get } = getProto(target);
				let hadKey = has.call(target, key);
				if (!hadKey) {
					key = toRaw(key);
					hadKey = has.call(target, key);
				}
				const oldValue = get ? get.call(target, key) : void 0;
				const result = target.delete(key);
				if (hadKey) trigger(target, "delete", key, void 0, oldValue);
				return result;
			},
			clear() {
				const target = toRaw(this);
				const hadItems = target.size !== 0;
				const oldTarget = void 0;
				const result = target.clear();
				if (hadItems) trigger(target, "clear", void 0, void 0, oldTarget);
				return result;
			}
		});
		[
			"keys",
			"values",
			"entries",
			Symbol.iterator
		].forEach((method) => {
			instrumentations[method] = createIterableMethod(method, readonly, shallow);
		});
		return instrumentations;
	}
	function createInstrumentationGetter(isReadonly2, shallow) {
		const instrumentations = createInstrumentations(isReadonly2, shallow);
		return (target, key, receiver) => {
			if (key === "__v_isReactive") return !isReadonly2;
			else if (key === "__v_isReadonly") return isReadonly2;
			else if (key === "__v_raw") return target;
			return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
		};
	}
	var mutableCollectionHandlers = { get: createInstrumentationGetter(false, false) };
	var shallowCollectionHandlers = { get: createInstrumentationGetter(false, true) };
	var readonlyCollectionHandlers = { get: createInstrumentationGetter(true, false) };
	var reactiveMap = new WeakMap();
	var shallowReactiveMap = new WeakMap();
	var readonlyMap = new WeakMap();
	var shallowReadonlyMap = new WeakMap();
	function targetTypeMap(rawType) {
		switch (rawType) {
			case "Object":
			case "Array": return 1;
			case "Map":
			case "Set":
			case "WeakMap":
			case "WeakSet": return 2;
			default: return 0;
		}
	}
	function reactive(target) {
		if (isReadonly(target)) return target;
		return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
	}
	function shallowReactive(target) {
		return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
	}
	function readonly(target) {
		return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
	}
	function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
		if (!isObject(target)) return target;
		if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) return target;
		if (target["__v_skip"] || !Object.isExtensible(target)) return target;
		const existingProxy = proxyMap.get(target);
		if (existingProxy) return existingProxy;
		const targetType = targetTypeMap(toRawType(target));
		if (targetType === 0) return target;
		const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
		proxyMap.set(target, proxy);
		return proxy;
	}
	function isReactive(value) {
		if (isReadonly(value)) return isReactive(value["__v_raw"]);
		return !!(value && value["__v_isReactive"]);
	}
	function isReadonly(value) {
		return !!(value && value["__v_isReadonly"]);
	}
	function isShallow(value) {
		return !!(value && value["__v_isShallow"]);
	}
	function isProxy(value) {
		return value ? !!value["__v_raw"] : false;
	}
	function toRaw(observed) {
		const raw = observed && observed["__v_raw"];
		return raw ? toRaw(raw) : observed;
	}
	function markRaw(value) {
		if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) def(value, "__v_skip", true);
		return value;
	}
	var toReactive = (value) => isObject(value) ? reactive(value) : value;
	var toReadonly = (value) => isObject(value) ? readonly(value) : value;
	function isRef(r) {
		return r ? r["__v_isRef"] === true : false;
	}
	function ref(value) {
		return createRef(value, false);
	}
	function createRef(rawValue, shallow) {
		if (isRef(rawValue)) return rawValue;
		return new RefImpl(rawValue, shallow);
	}
	var RefImpl = class {
		constructor(value, isShallow2) {
			this.dep = new Dep();
			this["__v_isRef"] = true;
			this["__v_isShallow"] = false;
			this._rawValue = isShallow2 ? value : toRaw(value);
			this._value = isShallow2 ? value : toReactive(value);
			this["__v_isShallow"] = isShallow2;
		}
		get value() {
			this.dep.track();
			return this._value;
		}
		set value(newValue) {
			const oldValue = this._rawValue;
			const useDirectValue = this["__v_isShallow"] || isShallow(newValue) || isReadonly(newValue);
			newValue = useDirectValue ? newValue : toRaw(newValue);
			if (hasChanged(newValue, oldValue)) {
				this._rawValue = newValue;
				this._value = useDirectValue ? newValue : toReactive(newValue);
				this.dep.trigger();
			}
		}
	};
	function unref(ref2) {
		return isRef(ref2) ? ref2.value : ref2;
	}
	var shallowUnwrapHandlers = {
		get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
		set: (target, key, value, receiver) => {
			const oldValue = target[key];
			if (isRef(oldValue) && !isRef(value)) {
				oldValue.value = value;
				return true;
			} else return Reflect.set(target, key, value, receiver);
		}
	};
	function proxyRefs(objectWithRefs) {
		return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
	}
	var ComputedRefImpl = class {
		constructor(fn, setter, isSSR) {
			this.fn = fn;
			this.setter = setter;
			this._value = void 0;
			this.dep = new Dep(this);
			this.__v_isRef = true;
			this.deps = void 0;
			this.depsTail = void 0;
			this.flags = 16;
			this.globalVersion = globalVersion - 1;
			this.next = void 0;
			this.effect = this;
			this["__v_isReadonly"] = !setter;
			this.isSSR = isSSR;
		}
		notify() {
			this.flags |= 16;
			if (!(this.flags & 8) && activeSub !== this) {
				batch(this, true);
				return true;
			}
		}
		get value() {
			const link = this.dep.track();
			refreshComputed(this);
			if (link) link.version = this.dep.version;
			return this._value;
		}
		set value(newValue) {
			if (this.setter) this.setter(newValue);
		}
	};
	function computed$1(getterOrOptions, debugOptions, isSSR = false) {
		let getter;
		let setter;
		if (isFunction(getterOrOptions)) getter = getterOrOptions;
		else {
			getter = getterOrOptions.get;
			setter = getterOrOptions.set;
		}
		return new ComputedRefImpl(getter, setter, isSSR);
	}
	var INITIAL_WATCHER_VALUE = {};
	var cleanupMap = new WeakMap();
	var activeWatcher = void 0;
	function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
		if (owner) {
			let cleanups = cleanupMap.get(owner);
			if (!cleanups) cleanupMap.set(owner, cleanups = []);
			cleanups.push(cleanupFn);
		}
	}
	function watch$1(source, cb, options = EMPTY_OBJ) {
		const { immediate, deep, once, scheduler, augmentJob, call } = options;
		const reactiveGetter = (source2) => {
			if (deep) return source2;
			if (isShallow(source2) || deep === false || deep === 0) return traverse(source2, 1);
			return traverse(source2);
		};
		let effect;
		let getter;
		let cleanup;
		let boundCleanup;
		let forceTrigger = false;
		let isMultiSource = false;
		if (isRef(source)) {
			getter = () => source.value;
			forceTrigger = isShallow(source);
		} else if (isReactive(source)) {
			getter = () => reactiveGetter(source);
			forceTrigger = true;
		} else if (isArray(source)) {
			isMultiSource = true;
			forceTrigger = source.some((s) => isReactive(s) || isShallow(s));
			getter = () => source.map((s) => {
				if (isRef(s)) return s.value;
				else if (isReactive(s)) return reactiveGetter(s);
				else if (isFunction(s)) return call ? call(s, 2) : s();
			});
		} else if (isFunction(source)) {
			if (cb) getter = call ? () => call(source, 2) : source;
			else getter = () => {
				if (cleanup) {
					pauseTracking();
					try {
						cleanup();
					} finally {
						resetTracking();
					}
				}
				const currentEffect = activeWatcher;
				activeWatcher = effect;
				try {
					return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
				} finally {
					activeWatcher = currentEffect;
				}
			};
		} else getter = NOOP;
		if (cb && deep) {
			const baseGetter = getter;
			const depth = deep === true ? Infinity : deep;
			getter = () => traverse(baseGetter(), depth);
		}
		const scope = getCurrentScope();
		const watchHandle = () => {
			effect.stop();
			if (scope && scope.active) remove(scope.effects, effect);
		};
		if (once && cb) {
			const _cb = cb;
			cb = (...args) => {
				const res = _cb(...args);
				watchHandle();
				return res;
			};
		}
		let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
		const job = (immediateFirstRun) => {
			if (!(effect.flags & 1) || !effect.dirty && !immediateFirstRun) return;
			if (cb) {
				const newValue = effect.run();
				if (immediateFirstRun || deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
					if (cleanup) cleanup();
					const currentWatcher = activeWatcher;
					activeWatcher = effect;
					try {
						const args = [
							newValue,
							oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
							boundCleanup
						];
						oldValue = newValue;
						call ? call(cb, 3, args) : cb(...args);
					} finally {
						activeWatcher = currentWatcher;
					}
				}
			} else effect.run();
		};
		if (augmentJob) augmentJob(job);
		effect = new ReactiveEffect(getter);
		effect.scheduler = scheduler ? () => scheduler(job, false) : job;
		boundCleanup = (fn) => onWatcherCleanup(fn, false, effect);
		cleanup = effect.onStop = () => {
			const cleanups = cleanupMap.get(effect);
			if (cleanups) {
				if (call) call(cleanups, 4);
				else for (const cleanup2 of cleanups) cleanup2();
				cleanupMap.delete(effect);
			}
		};
		if (cb) {
			if (immediate) job(true);
			else oldValue = effect.run();
		} else if (scheduler) scheduler(job.bind(null, true), true);
		else effect.run();
		watchHandle.pause = effect.pause.bind(effect);
		watchHandle.resume = effect.resume.bind(effect);
		watchHandle.stop = watchHandle;
		return watchHandle;
	}
	function traverse(value, depth = Infinity, seen) {
		if (depth <= 0 || !isObject(value) || value["__v_skip"]) return value;
		seen = seen || new Map();
		if ((seen.get(value) || 0) >= depth) return value;
		seen.set(value, depth);
		depth--;
		if (isRef(value)) traverse(value.value, depth, seen);
		else if (isArray(value)) for (let i = 0; i < value.length; i++) traverse(value[i], depth, seen);
		else if (isSet(value) || isMap(value)) value.forEach((v) => {
			traverse(v, depth, seen);
		});
		else if (isPlainObject(value)) {
			for (const key in value) traverse(value[key], depth, seen);
			for (const key of Object.getOwnPropertySymbols(value)) if (Object.prototype.propertyIsEnumerable.call(value, key)) traverse(value[key], depth, seen);
		}
		return value;
	}
	function callWithErrorHandling(fn, instance, type, args) {
		try {
			return args ? fn(...args) : fn();
		} catch (err) {
			handleError(err, instance, type);
		}
	}
	function callWithAsyncErrorHandling(fn, instance, type, args) {
		if (isFunction(fn)) {
			const res = callWithErrorHandling(fn, instance, type, args);
			if (res && isPromise(res)) res.catch((err) => {
				handleError(err, instance, type);
			});
			return res;
		}
		if (isArray(fn)) {
			const values = [];
			for (let i = 0; i < fn.length; i++) values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
			return values;
		}
	}
	function handleError(err, instance, type, throwInDev = true) {
		const contextVNode = instance ? instance.vnode : null;
		const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
		if (instance) {
			let cur = instance.parent;
			const exposedInstance = instance.proxy;
			const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
			while (cur) {
				const errorCapturedHooks = cur.ec;
				if (errorCapturedHooks) {
					for (let i = 0; i < errorCapturedHooks.length; i++) if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) return;
				}
				cur = cur.parent;
			}
			if (errorHandler) {
				pauseTracking();
				callWithErrorHandling(errorHandler, null, 10, [
					err,
					exposedInstance,
					errorInfo
				]);
				resetTracking();
				return;
			}
		}
		logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
	}
	function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
		if (throwInProd) throw err;
		else console.error(err);
	}
	var queue = [];
	var flushIndex = -1;
	var pendingPostFlushCbs = [];
	var activePostFlushCbs = null;
	var postFlushIndex = 0;
	var resolvedPromise = Promise.resolve();
	var currentFlushPromise = null;
	function nextTick(fn) {
		const p = currentFlushPromise || resolvedPromise;
		return fn ? p.then(this ? fn.bind(this) : fn) : p;
	}
	function findInsertionIndex(id) {
		let start = flushIndex + 1;
		let end = queue.length;
		while (start < end) {
			const middle = start + end >>> 1;
			const middleJob = queue[middle];
			const middleJobId = getId(middleJob);
			if (middleJobId < id || middleJobId === id && middleJob.flags & 2) start = middle + 1;
			else end = middle;
		}
		return start;
	}
	function queueJob(job) {
		if (!(job.flags & 1)) {
			const jobId = getId(job);
			const lastJob = queue[queue.length - 1];
			if (!lastJob || !(job.flags & 2) && jobId >= getId(lastJob)) queue.push(job);
			else queue.splice(findInsertionIndex(jobId), 0, job);
			job.flags |= 1;
			queueFlush();
		}
	}
	function queueFlush() {
		if (!currentFlushPromise) currentFlushPromise = resolvedPromise.then(flushJobs);
	}
	function queuePostFlushCb(cb) {
		if (!isArray(cb)) {
			if (activePostFlushCbs && cb.id === -1) activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
			else if (!(cb.flags & 1)) {
				pendingPostFlushCbs.push(cb);
				cb.flags |= 1;
			}
		} else for (let i = 0; i < cb.length; i++) pendingPostFlushCbs.push(cb[i]);
		queueFlush();
	}
	function flushPreFlushCbs(instance, seen, i = flushIndex + 1) {
		for (; i < queue.length; i++) {
			const cb = queue[i];
			if (cb && cb.flags & 2) {
				if (instance && cb.id !== instance.uid) continue;
				queue.splice(i, 1);
				i--;
				if (cb.flags & 4) cb.flags &= -2;
				cb();
				if (!(cb.flags & 4)) cb.flags &= -2;
			}
		}
	}
	function flushPostFlushCbs(seen) {
		if (pendingPostFlushCbs.length) {
			const deduped = [...new Set(pendingPostFlushCbs)].sort((a, b) => getId(a) - getId(b));
			pendingPostFlushCbs.length = 0;
			if (activePostFlushCbs) {
				for (let i = 0; i < deduped.length; i++) activePostFlushCbs.push(deduped[i]);
				return;
			}
			activePostFlushCbs = deduped;
			for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
				const cb = activePostFlushCbs[postFlushIndex];
				if (cb.flags & 4) cb.flags &= -2;
				if (!(cb.flags & 8)) cb();
				cb.flags &= -2;
			}
			activePostFlushCbs = null;
			postFlushIndex = 0;
		}
	}
	var getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
	function flushJobs(seen) {
		try {
			for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
				const job = queue[flushIndex];
				if (job && !(job.flags & 8)) {
					if (job.flags & 4) job.flags &= -2;
					callWithErrorHandling(job, job.i, job.i ? 15 : 14);
					if (!(job.flags & 4)) job.flags &= -2;
				}
			}
		} finally {
			for (; flushIndex < queue.length; flushIndex++) {
				const job = queue[flushIndex];
				if (job) job.flags &= -2;
			}
			flushIndex = -1;
			queue.length = 0;
			flushPostFlushCbs(seen);
			currentFlushPromise = null;
			if (queue.length || pendingPostFlushCbs.length) flushJobs(seen);
		}
	}
	var currentRenderingInstance = null;
	var currentScopeId = null;
	function setCurrentRenderingInstance(instance) {
		const prev = currentRenderingInstance;
		currentRenderingInstance = instance;
		currentScopeId = instance && instance.type.__scopeId || null;
		return prev;
	}
	function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
		if (!ctx) return fn;
		if (fn._n) return fn;
		const renderFnWithContext = (...args) => {
			if (renderFnWithContext._d) setBlockTracking(-1);
			const prevInstance = setCurrentRenderingInstance(ctx);
			const prevStackSize = blockStack.length;
			let res;
			try {
				res = fn(...args);
			} finally {
				for (let i = blockStack.length; i > prevStackSize; i--) closeBlock();
				setCurrentRenderingInstance(prevInstance);
				if (renderFnWithContext._d) setBlockTracking(1);
			}
			return res;
		};
		renderFnWithContext._n = true;
		renderFnWithContext._c = true;
		renderFnWithContext._d = true;
		return renderFnWithContext;
	}
	function withDirectives(vnode, directives) {
		if (currentRenderingInstance === null) return vnode;
		const instance = getComponentPublicInstance(currentRenderingInstance);
		const bindings = vnode.dirs || (vnode.dirs = []);
		for (let i = 0; i < directives.length; i++) {
			let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
			if (dir) {
				if (isFunction(dir)) dir = {
					mounted: dir,
					updated: dir
				};
				if (dir.deep) traverse(value);
				bindings.push({
					dir,
					instance,
					value,
					oldValue: void 0,
					arg,
					modifiers
				});
			}
		}
		return vnode;
	}
	function invokeDirectiveHook(vnode, prevVNode, instance, name) {
		const bindings = vnode.dirs;
		const oldBindings = prevVNode && prevVNode.dirs;
		for (let i = 0; i < bindings.length; i++) {
			const binding = bindings[i];
			if (oldBindings) binding.oldValue = oldBindings[i].value;
			let hook = binding.dir[name];
			if (hook) {
				pauseTracking();
				callWithAsyncErrorHandling(hook, instance, 8, [
					vnode.el,
					binding,
					vnode,
					prevVNode
				]);
				resetTracking();
			}
		}
	}
	function provide(key, value) {
		if (currentInstance) {
			let provides = currentInstance.provides;
			const parentProvides = currentInstance.parent && currentInstance.parent.provides;
			if (parentProvides === provides) provides = currentInstance.provides = Object.create(parentProvides);
			provides[key] = value;
		}
	}
	function inject(key, defaultValue, treatDefaultAsFactory = false) {
		const instance = getCurrentInstance();
		if (instance || currentApp) {
			let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
			if (provides && key in provides) return provides[key];
			else if (arguments.length > 1) return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
		}
	}
	var ssrContextKey = Symbol.for("v-scx");
	var useSSRContext = () => {
		{
			const ctx = inject(ssrContextKey);
			if (!ctx) {}
			return ctx;
		}
	};
	function watch(source, cb, options) {
		return doWatch(source, cb, options);
	}
	function doWatch(source, cb, options = EMPTY_OBJ) {
		const { immediate, deep, flush, once } = options;
		const baseWatchOptions = extend({}, options);
		const runsImmediately = cb && immediate || !cb && flush !== "post";
		let ssrCleanup;
		if (isInSSRComponentSetup) {
			if (flush === "sync") {
				const ctx = useSSRContext();
				ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
			} else if (!runsImmediately) {
				const watchStopHandle = () => {};
				watchStopHandle.stop = NOOP;
				watchStopHandle.resume = NOOP;
				watchStopHandle.pause = NOOP;
				return watchStopHandle;
			}
		}
		const instance = currentInstance;
		baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
		let isPre = false;
		if (flush === "post") baseWatchOptions.scheduler = (job) => {
			queuePostRenderEffect(job, instance && instance.suspense);
		};
		else if (flush !== "sync") {
			isPre = true;
			baseWatchOptions.scheduler = (job, isFirstRun) => {
				if (isFirstRun) job();
				else queueJob(job);
			};
		}
		baseWatchOptions.augmentJob = (job) => {
			if (cb) job.flags |= 4;
			if (isPre) {
				job.flags |= 2;
				if (instance) {
					job.id = instance.uid;
					job.i = instance;
				}
			}
		};
		const watchHandle = watch$1(source, cb, baseWatchOptions);
		if (isInSSRComponentSetup) {
			if (ssrCleanup) ssrCleanup.push(watchHandle);
			else if (runsImmediately) watchHandle();
		}
		return watchHandle;
	}
	function instanceWatch(source, value, options) {
		const publicThis = this.proxy;
		const getter = isString(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
		let cb;
		if (isFunction(value)) cb = value;
		else {
			cb = value.handler;
			options = value;
		}
		const reset = setCurrentInstance(this);
		const res = doWatch(getter, cb.bind(publicThis), options);
		reset();
		return res;
	}
	function createPathGetter(ctx, path) {
		const segments = path.split(".");
		return () => {
			let cur = ctx;
			for (let i = 0; i < segments.length && cur; i++) cur = cur[segments[i]];
			return cur;
		};
	}
	var TeleportEndKey = Symbol("_vte");
	var isTeleport = (type) => type.__isTeleport;
	var leaveCbKey = Symbol("_leaveCb");
	function findNonCommentChild(children) {
		let child = children[0];
		if (children.length > 1) {
			for (const c of children) if (c.type !== Comment) {
				child = c;
				break;
			}
		}
		return child;
	}
	function getInnerChild$1(vnode) {
		if (!isKeepAlive(vnode)) {
			if (isTeleport(vnode.type) && vnode.children) return findNonCommentChild(vnode.children);
			return vnode;
		}
		if (vnode.component) return vnode.component.subTree;
		const { shapeFlag, children } = vnode;
		if (children) {
			if (shapeFlag & 16) return children[0];
			if (shapeFlag & 32 && isFunction(children.default)) return children.default();
		}
	}
	function setTransitionHooks(vnode, hooks) {
		if (vnode.shapeFlag & 6 && vnode.component) {
			vnode.transition = hooks;
			const subTree = vnode.component.subTree;
			setTransitionHooks(isTeleport(subTree.type) ? getInnerChild$1(subTree) || subTree : subTree, hooks);
		} else if (vnode.shapeFlag & 128) {
			vnode.ssContent.transition = hooks.clone(vnode.ssContent);
			vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
		} else vnode.transition = hooks;
	}
	function defineComponent(options, extraOptions) {
		return isFunction(options) ? (() => extend({ name: options.name }, extraOptions, { setup: options }))() : options;
	}
	function markAsyncBoundary(instance) {
		instance.ids = [
			instance.ids[0] + instance.ids[2]++ + "-",
			0,
			0
		];
	}
	function isTemplateRefKey(refs, key) {
		let desc;
		return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
	}
	var pendingSetRefMap = new WeakMap();
	function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
		if (isArray(rawRef)) {
			rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
			return;
		}
		if (isAsyncWrapper(vnode) && !isUnmount) {
			if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
			return;
		}
		const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
		const value = isUnmount ? null : refValue;
		const { i: owner, r: ref } = rawRef;
		const oldRef = oldRawRef && oldRawRef.r;
		const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
		const setupState = owner.setupState;
		const rawSetupState = toRaw(setupState);
		const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
			if (isTemplateRefKey(refs, key)) return false;
			return hasOwn(rawSetupState, key);
		};
		const canSetRef = (ref2, key) => {
			if (key && isTemplateRefKey(refs, key)) return false;
			return true;
		};
		if (oldRef != null && oldRef !== ref) {
			invalidatePendingSetRef(oldRawRef);
			if (isString(oldRef)) {
				refs[oldRef] = null;
				if (canSetSetupRef(oldRef)) setupState[oldRef] = null;
			} else if (isRef(oldRef)) {
				const oldRawRefAtom = oldRawRef;
				if (canSetRef(oldRef, oldRawRefAtom.k)) oldRef.value = null;
				if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
			}
		}
		if (isFunction(ref)) callWithErrorHandling(ref, owner, 12, [value, refs]);
		else {
			const _isString = isString(ref);
			const _isRef = isRef(ref);
			if (_isString || _isRef) {
				const doSet = () => {
					if (rawRef.f) {
						const existing = _isString ? canSetSetupRef(ref) ? setupState[ref] : refs[ref] : canSetRef(ref) || !rawRef.k ? ref.value : refs[rawRef.k];
						if (isUnmount) isArray(existing) && remove(existing, refValue);
						else if (!isArray(existing)) {
							if (_isString) {
								refs[ref] = [refValue];
								if (canSetSetupRef(ref)) setupState[ref] = refs[ref];
							} else {
								const newVal = [refValue];
								if (canSetRef(ref, rawRef.k)) ref.value = newVal;
								if (rawRef.k) refs[rawRef.k] = newVal;
							}
						} else if (!existing.includes(refValue)) existing.push(refValue);
					} else if (_isString) {
						refs[ref] = value;
						if (canSetSetupRef(ref)) setupState[ref] = value;
					} else if (_isRef) {
						if (canSetRef(ref, rawRef.k)) ref.value = value;
						if (rawRef.k) refs[rawRef.k] = value;
					}
				};
				if (value) {
					const job = () => {
						doSet();
						pendingSetRefMap.delete(rawRef);
					};
					job.id = -1;
					pendingSetRefMap.set(rawRef, job);
					queuePostRenderEffect(job, parentSuspense);
				} else {
					invalidatePendingSetRef(rawRef);
					doSet();
				}
			}
		}
	}
	function invalidatePendingSetRef(rawRef) {
		const pendingSetRef = pendingSetRefMap.get(rawRef);
		if (pendingSetRef) {
			pendingSetRef.flags |= 8;
			pendingSetRefMap.delete(rawRef);
		}
	}
	getGlobalThis().requestIdleCallback;
	getGlobalThis().cancelIdleCallback;
	var isAsyncWrapper = (i) => !!i.type.__asyncLoader;
	var isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
	function onActivated(hook, target) {
		registerKeepAliveHook(hook, "a", target);
	}
	function onDeactivated(hook, target) {
		registerKeepAliveHook(hook, "da", target);
	}
	function registerKeepAliveHook(hook, type, target = currentInstance) {
		const wrappedHook = hook.__wdc || (hook.__wdc = () => {
			let current = target;
			while (current) {
				if (current.isDeactivated) return;
				current = current.parent;
			}
			return hook();
		});
		injectHook(type, wrappedHook, target);
		if (target) {
			let current = target.parent;
			while (current && current.parent) {
				if (isKeepAlive(current.parent.vnode)) injectToKeepAliveRoot(wrappedHook, type, target, current);
				current = current.parent;
			}
		}
	}
	function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
		const injected = injectHook(type, hook, keepAliveRoot, true);
		onUnmounted(() => {
			remove(keepAliveRoot[type], injected);
		}, target);
	}
	function injectHook(type, hook, target = currentInstance, prepend = false) {
		if (target) {
			const hooks = target[type] || (target[type] = []);
			const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
				pauseTracking();
				const reset = setCurrentInstance(target);
				const res = callWithAsyncErrorHandling(hook, target, type, args);
				reset();
				resetTracking();
				return res;
			});
			if (prepend) hooks.unshift(wrappedHook);
			else hooks.push(wrappedHook);
			return wrappedHook;
		}
	}
	var createHook = (lifecycle) => (hook, target = currentInstance) => {
		if (!isInSSRComponentSetup || lifecycle === "sp") injectHook(lifecycle, (...args) => hook(...args), target);
	};
	var onBeforeMount = createHook("bm");
	var onMounted = createHook("m");
	var onBeforeUpdate = createHook("bu");
	var onUpdated = createHook("u");
	var onBeforeUnmount = createHook("bum");
	var onUnmounted = createHook("um");
	var onServerPrefetch = createHook("sp");
	var onRenderTriggered = createHook("rtg");
	var onRenderTracked = createHook("rtc");
	function onErrorCaptured(hook, target = currentInstance) {
		injectHook("ec", hook, target);
	}
	var NULL_DYNAMIC_COMPONENT = Symbol.for("v-ndc");
	function renderList(source, renderItem, cache, index) {
		let ret;
		const cached = cache && cache[index];
		const sourceIsArray = isArray(source);
		if (sourceIsArray || isString(source)) {
			const sourceIsReactiveArray = sourceIsArray && isReactive(source);
			let needsWrap = false;
			let isReadonlySource = false;
			if (sourceIsReactiveArray) {
				needsWrap = !isShallow(source);
				isReadonlySource = isReadonly(source);
				source = shallowReadArray(source);
			}
			ret = new Array(source.length);
			for (let i = 0, l = source.length; i < l; i++) ret[i] = renderItem(needsWrap ? isReadonlySource ? toReadonly(toReactive(source[i])) : toReactive(source[i]) : source[i], i, void 0, cached && cached[i]);
		} else if (typeof source === "number") {
			ret = new Array(source);
			for (let i = 0; i < source; i++) ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
		} else if (isObject(source)) {
			if (source[Symbol.iterator]) ret = Array.from(source, (item, i) => renderItem(item, i, void 0, cached && cached[i]));
			else {
				const keys = Object.keys(source);
				ret = new Array(keys.length);
				for (let i = 0, l = keys.length; i < l; i++) {
					const key = keys[i];
					ret[i] = renderItem(source[key], key, i, cached && cached[i]);
				}
			}
		} else ret = [];
		if (cache) cache[index] = ret;
		return ret;
	}
	var getPublicInstance = (i) => {
		if (!i) return null;
		if (isStatefulComponent(i)) return getComponentPublicInstance(i);
		return getPublicInstance(i.parent);
	};
	var publicPropertiesMap = extend(Object.create(null), {
		$: (i) => i,
		$el: (i) => i.vnode.el,
		$data: (i) => i.data,
		$props: (i) => i.props,
		$attrs: (i) => i.attrs,
		$slots: (i) => i.slots,
		$refs: (i) => i.refs,
		$parent: (i) => getPublicInstance(i.parent),
		$root: (i) => getPublicInstance(i.root),
		$host: (i) => i.ce,
		$emit: (i) => i.emit,
		$options: (i) => resolveMergedOptions(i),
		$forceUpdate: (i) => i.f || (i.f = () => {
			queueJob(i.update);
		}),
		$nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
		$watch: (i) => instanceWatch.bind(i)
	});
	var hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
	var PublicInstanceProxyHandlers = {
		get({ _: instance }, key) {
			if (key === "__v_skip") return true;
			const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
			if (key[0] !== "$") {
				const n = accessCache[key];
				if (n !== void 0) switch (n) {
					case 1: return setupState[key];
					case 2: return data[key];
					case 4: return ctx[key];
					case 3: return props[key];
				}
				else if (hasSetupBinding(setupState, key)) {
					accessCache[key] = 1;
					return setupState[key];
				} else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
					accessCache[key] = 2;
					return data[key];
				} else if (hasOwn(props, key)) {
					accessCache[key] = 3;
					return props[key];
				} else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
					accessCache[key] = 4;
					return ctx[key];
				} else if (shouldCacheAccess) accessCache[key] = 0;
			}
			const publicGetter = publicPropertiesMap[key];
			let cssModule, globalProperties;
			if (publicGetter) {
				if (key === "$attrs") track(instance.attrs, "get", "");
				return publicGetter(instance);
			} else if ((cssModule = type.__cssModules) && (cssModule = cssModule[key])) return cssModule;
			else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
				accessCache[key] = 4;
				return ctx[key];
			} else if (globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)) return globalProperties[key];
		},
		set({ _: instance }, key, value) {
			const { data, setupState, ctx } = instance;
			if (hasSetupBinding(setupState, key)) {
				setupState[key] = value;
				return true;
			} else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
				data[key] = value;
				return true;
			} else if (hasOwn(instance.props, key)) return false;
			if (key[0] === "$" && key.slice(1) in instance) return false;
			else ctx[key] = value;
			return true;
		},
		has({ _: { data, setupState, accessCache, ctx, appContext, props, type } }, key) {
			let cssModules;
			return !!(accessCache[key] || data !== EMPTY_OBJ && key[0] !== "$" && hasOwn(data, key) || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
		},
		defineProperty(target, key, descriptor) {
			if (descriptor.get != null) target._.accessCache[key] = 0;
			else if (hasOwn(descriptor, "value")) this.set(target, key, descriptor.value, null);
			return Reflect.defineProperty(target, key, descriptor);
		}
	};
	function normalizePropsOrEmits(props) {
		return isArray(props) ? props.reduce((normalized, p) => (normalized[p] = null, normalized), {}) : props;
	}
	var shouldCacheAccess = true;
	function applyOptions(instance) {
		const options = resolveMergedOptions(instance);
		const publicThis = instance.proxy;
		const ctx = instance.ctx;
		shouldCacheAccess = false;
		if (options.beforeCreate) callHook(options.beforeCreate, instance, "bc");
		const { data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch, expose, inheritAttrs, components, directives, filters } = options;
		const checkDuplicateProperties = null;
		if (injectOptions) resolveInjections(injectOptions, ctx, checkDuplicateProperties);
		if (methods) for (const key in methods) {
			const methodHandler = methods[key];
			if (isFunction(methodHandler)) ctx[key] = methodHandler.bind(publicThis);
		}
		if (dataOptions) {
			const data = dataOptions.call(publicThis, publicThis);
			if (!isObject(data)) {} else instance.data = reactive(data);
		}
		shouldCacheAccess = true;
		if (computedOptions) for (const key in computedOptions) {
			const opt = computedOptions[key];
			const c = computed({
				get: isFunction(opt) ? opt.bind(publicThis, publicThis) : isFunction(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP,
				set: !isFunction(opt) && isFunction(opt.set) ? opt.set.bind(publicThis) : NOOP
			});
			Object.defineProperty(ctx, key, {
				enumerable: true,
				configurable: true,
				get: () => c.value,
				set: (v) => c.value = v
			});
		}
		if (watchOptions) for (const key in watchOptions) createWatcher(watchOptions[key], ctx, publicThis, key);
		if (provideOptions) {
			const provides = isFunction(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
			Reflect.ownKeys(provides).forEach((key) => {
				provide(key, provides[key]);
			});
		}
		if (created) callHook(created, instance, "c");
		function registerLifecycleHook(register, hook) {
			if (isArray(hook)) hook.forEach((_hook) => register(_hook.bind(publicThis)));
			else if (hook) register(hook.bind(publicThis));
		}
		registerLifecycleHook(onBeforeMount, beforeMount);
		registerLifecycleHook(onMounted, mounted);
		registerLifecycleHook(onBeforeUpdate, beforeUpdate);
		registerLifecycleHook(onUpdated, updated);
		registerLifecycleHook(onActivated, activated);
		registerLifecycleHook(onDeactivated, deactivated);
		registerLifecycleHook(onErrorCaptured, errorCaptured);
		registerLifecycleHook(onRenderTracked, renderTracked);
		registerLifecycleHook(onRenderTriggered, renderTriggered);
		registerLifecycleHook(onBeforeUnmount, beforeUnmount);
		registerLifecycleHook(onUnmounted, unmounted);
		registerLifecycleHook(onServerPrefetch, serverPrefetch);
		if (isArray(expose)) {
			if (expose.length) {
				const exposed = instance.exposed || (instance.exposed = {});
				expose.forEach((key) => {
					Object.defineProperty(exposed, key, {
						get: () => publicThis[key],
						set: (val) => publicThis[key] = val,
						enumerable: true
					});
				});
			} else if (!instance.exposed) instance.exposed = {};
		}
		if (render && instance.render === NOOP) instance.render = render;
		if (inheritAttrs != null) instance.inheritAttrs = inheritAttrs;
		if (components) instance.components = components;
		if (directives) instance.directives = directives;
		if (serverPrefetch) markAsyncBoundary(instance);
	}
	function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
		if (isArray(injectOptions)) injectOptions = normalizeInject(injectOptions);
		for (const key in injectOptions) {
			const opt = injectOptions[key];
			let injected;
			if (isObject(opt)) {
				if ("default" in opt) injected = inject(opt.from || key, opt.default, true);
				else injected = inject(opt.from || key);
			} else injected = inject(opt);
			if (isRef(injected)) Object.defineProperty(ctx, key, {
				enumerable: true,
				configurable: true,
				get: () => injected.value,
				set: (v) => injected.value = v
			});
			else ctx[key] = injected;
		}
	}
	function callHook(hook, instance, type) {
		callWithAsyncErrorHandling(isArray(hook) ? hook.map((h) => h.bind(instance.proxy)) : hook.bind(instance.proxy), instance, type);
	}
	function createWatcher(raw, ctx, publicThis, key) {
		let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
		if (isString(raw)) {
			const handler = ctx[raw];
			if (isFunction(handler)) watch(getter, handler);
		} else if (isFunction(raw)) watch(getter, raw.bind(publicThis));
		else if (isObject(raw)) {
			if (isArray(raw)) raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
			else {
				const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
				if (isFunction(handler)) watch(getter, handler, raw);
			}
		}
	}
	function resolveMergedOptions(instance) {
		const base = instance.type;
		const { mixins, extends: extendsOptions } = base;
		const { mixins: globalMixins, optionsCache: cache, config: { optionMergeStrategies } } = instance.appContext;
		const cached = cache.get(base);
		let resolved;
		if (cached) resolved = cached;
		else if (!globalMixins.length && !mixins && !extendsOptions) resolved = base;
		else {
			resolved = {};
			if (globalMixins.length) globalMixins.forEach((m) => mergeOptions(resolved, m, optionMergeStrategies, true));
			mergeOptions(resolved, base, optionMergeStrategies);
		}
		if (isObject(base)) cache.set(base, resolved);
		return resolved;
	}
	function mergeOptions(to, from, strats, asMixin = false) {
		const { mixins, extends: extendsOptions } = from;
		if (extendsOptions) mergeOptions(to, extendsOptions, strats, true);
		if (mixins) mixins.forEach((m) => mergeOptions(to, m, strats, true));
		for (const key in from) if (asMixin && key === "expose") {} else {
			const strat = internalOptionMergeStrats[key] || strats && strats[key];
			to[key] = strat ? strat(to[key], from[key]) : from[key];
		}
		return to;
	}
	var internalOptionMergeStrats = {
		data: mergeDataFn,
		props: mergeEmitsOrPropsOptions,
		emits: mergeEmitsOrPropsOptions,
		methods: mergeObjectOptions,
		computed: mergeObjectOptions,
		beforeCreate: mergeAsArray,
		created: mergeAsArray,
		beforeMount: mergeAsArray,
		mounted: mergeAsArray,
		beforeUpdate: mergeAsArray,
		updated: mergeAsArray,
		beforeDestroy: mergeAsArray,
		beforeUnmount: mergeAsArray,
		destroyed: mergeAsArray,
		unmounted: mergeAsArray,
		activated: mergeAsArray,
		deactivated: mergeAsArray,
		errorCaptured: mergeAsArray,
		serverPrefetch: mergeAsArray,
		components: mergeObjectOptions,
		directives: mergeObjectOptions,
		watch: mergeWatchOptions,
		provide: mergeDataFn,
		inject: mergeInject
	};
	function mergeDataFn(to, from) {
		if (!from) return to;
		if (!to) return from;
		return function mergedDataFn() {
			return extend(isFunction(to) ? to.call(this, this) : to, isFunction(from) ? from.call(this, this) : from);
		};
	}
	function mergeInject(to, from) {
		return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
	}
	function normalizeInject(raw) {
		if (isArray(raw)) {
			const res = {};
			for (let i = 0; i < raw.length; i++) res[raw[i]] = raw[i];
			return res;
		}
		return raw;
	}
	function mergeAsArray(to, from) {
		return to ? [...new Set([].concat(to, from))] : from;
	}
	function mergeObjectOptions(to, from) {
		return to ? extend(Object.create(null), to, from) : from;
	}
	function mergeEmitsOrPropsOptions(to, from) {
		if (to) {
			if (isArray(to) && isArray(from)) return [...new Set([...to, ...from])];
			return extend(Object.create(null), normalizePropsOrEmits(to), normalizePropsOrEmits(from != null ? from : {}));
		} else return from;
	}
	function mergeWatchOptions(to, from) {
		if (!to) return from;
		if (!from) return to;
		const merged = extend(Object.create(null), to);
		for (const key in from) merged[key] = mergeAsArray(to[key], from[key]);
		return merged;
	}
	function createAppContext() {
		return {
			app: null,
			config: {
				isNativeTag: NO,
				performance: false,
				globalProperties: {},
				optionMergeStrategies: {},
				errorHandler: void 0,
				warnHandler: void 0,
				compilerOptions: {}
			},
			mixins: [],
			components: {},
			directives: {},
			provides: Object.create(null),
			optionsCache: new WeakMap(),
			propsCache: new WeakMap(),
			emitsCache: new WeakMap()
		};
	}
	var uid$1 = 0;
	function createAppAPI(render, hydrate) {
		return function createApp(rootComponent, rootProps = null) {
			if (!isFunction(rootComponent)) rootComponent = extend({}, rootComponent);
			if (rootProps != null && !isObject(rootProps)) rootProps = null;
			const context = createAppContext();
			const installedPlugins = new WeakSet();
			const pluginCleanupFns = [];
			let isMounted = false;
			const app = context.app = {
				_uid: uid$1++,
				_component: rootComponent,
				_props: rootProps,
				_container: null,
				_context: context,
				_instance: null,
				version: version$1,
				get config() {
					return context.config;
				},
				set config(v) {},
				use(plugin, ...options) {
					if (installedPlugins.has(plugin)) {} else if (plugin && isFunction(plugin.install)) {
						installedPlugins.add(plugin);
						plugin.install(app, ...options);
					} else if (isFunction(plugin)) {
						installedPlugins.add(plugin);
						plugin(app, ...options);
					}
					return app;
				},
				mixin(mixin) {
					if (!context.mixins.includes(mixin)) context.mixins.push(mixin);
					return app;
				},
				component(name, component) {
					if (!component) return context.components[name];
					context.components[name] = component;
					return app;
				},
				directive(name, directive) {
					if (!directive) return context.directives[name];
					context.directives[name] = directive;
					return app;
				},
				mount(rootContainer, isHydrate, namespace) {
					if (!isMounted) {
						const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
						vnode.appContext = context;
						if (namespace === true) namespace = "svg";
						else if (namespace === false) namespace = void 0;
						if (isHydrate && hydrate) hydrate(vnode, rootContainer);
						else render(vnode, rootContainer, namespace);
						isMounted = true;
						app._container = rootContainer;
						rootContainer.__vue_app__ = app;
						return getComponentPublicInstance(vnode.component);
					}
				},
				onUnmount(cleanupFn) {
					pluginCleanupFns.push(cleanupFn);
				},
				unmount() {
					if (isMounted) {
						callWithAsyncErrorHandling(pluginCleanupFns, app._instance, 16);
						render(null, app._container);
						delete app._container.__vue_app__;
					}
				},
				provide(key, value) {
					context.provides[key] = value;
					return app;
				},
				runWithContext(fn) {
					const lastApp = currentApp;
					currentApp = app;
					try {
						return fn();
					} finally {
						currentApp = lastApp;
					}
				}
			};
			return app;
		};
	}
	var currentApp = null;
	var getModelModifiers = (props, modelName) => {
		return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
	};
	function emit(instance, event, ...rawArgs) {
		if (instance.isUnmounted) return;
		const props = instance.vnode.props || EMPTY_OBJ;
		let args = rawArgs;
		const isModelListener = event.startsWith("update:");
		const modifiers = isModelListener && getModelModifiers(props, event.slice(7));
		if (modifiers) {
			if (modifiers.trim) args = rawArgs.map((a) => isString(a) ? a.trim() : a);
			if (modifiers.number) args = args.map(looseToNumber);
		}
		let handlerName;
		let handler = props[handlerName = toHandlerKey(event)] || props[handlerName = toHandlerKey(camelize(event))];
		if (!handler && isModelListener) handler = props[handlerName = toHandlerKey(hyphenate(event))];
		if (handler) callWithAsyncErrorHandling(handler, instance, 6, args);
		const onceHandler = props[handlerName + `Once`];
		if (onceHandler) {
			if (!instance.emitted) instance.emitted = {};
			else if (instance.emitted[handlerName]) return;
			instance.emitted[handlerName] = true;
			callWithAsyncErrorHandling(onceHandler, instance, 6, args);
		}
	}
	var mixinEmitsCache = new WeakMap();
	function normalizeEmitsOptions(comp, appContext, asMixin = false) {
		const cache = asMixin ? mixinEmitsCache : appContext.emitsCache;
		const cached = cache.get(comp);
		if (cached !== void 0) return cached;
		const raw = comp.emits;
		let normalized = {};
		let hasExtends = false;
		if (!isFunction(comp)) {
			const extendEmits = (raw2) => {
				const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
				if (normalizedFromExtend) {
					hasExtends = true;
					extend(normalized, normalizedFromExtend);
				}
			};
			if (!asMixin && appContext.mixins.length) appContext.mixins.forEach(extendEmits);
			if (comp.extends) extendEmits(comp.extends);
			if (comp.mixins) comp.mixins.forEach(extendEmits);
		}
		if (!raw && !hasExtends) {
			if (isObject(comp)) cache.set(comp, null);
			return null;
		}
		if (isArray(raw)) raw.forEach((key) => normalized[key] = null);
		else extend(normalized, raw);
		if (isObject(comp)) cache.set(comp, normalized);
		return normalized;
	}
	function isEmitListener(options, key) {
		if (!options || !isOn(key)) return false;
		key = key.slice(2);
		key = key === "Once" ? key : key.replace(/Once$/, "");
		return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
	}
	function renderComponentRoot(instance) {
		const { type: Component, vnode, proxy, withProxy, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, props, data, setupState, ctx, inheritAttrs } = instance;
		const prev = setCurrentRenderingInstance(instance);
		let result;
		let fallthroughAttrs;
		try {
			if (vnode.shapeFlag & 4) {
				const proxyToUse = withProxy || proxy;
				const thisProxy = proxyToUse;
				result = normalizeVNode(render.call(thisProxy, proxyToUse, renderCache, props, setupState, data, ctx));
				fallthroughAttrs = attrs;
			} else {
				const render2 = Component;
				result = normalizeVNode(render2.length > 1 ? render2(props, {
					attrs,
					slots,
					emit
				}) : render2(props, null));
				fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
			}
		} catch (err) {
			blockStack.length = 0;
			handleError(err, instance, 1);
			result = createVNode(Comment);
		}
		let root = result;
		if (fallthroughAttrs && inheritAttrs !== false) {
			const keys = Object.keys(fallthroughAttrs);
			const { shapeFlag } = root;
			if (keys.length) {
				if (shapeFlag & 7) {
					if (propsOptions && keys.some(isModelListener)) fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
					root = cloneVNode(root, fallthroughAttrs, false, true);
				}
			}
		}
		if (vnode.dirs) {
			root = cloneVNode(root, null, false, true);
			root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
		}
		if (vnode.transition) setTransitionHooks(isTeleport(root.type) ? getInnerChild$1(root) || root : root, vnode.transition);
		result = root;
		setCurrentRenderingInstance(prev);
		return result;
	}
	var getFunctionalFallthrough = (attrs) => {
		let res;
		for (const key in attrs) if (key === "class" || key === "style" || isOn(key)) (res || (res = {}))[key] = attrs[key];
		return res;
	};
	var filterModelListeners = (attrs, props) => {
		const res = {};
		for (const key in attrs) if (!isModelListener(key) || !(key.slice(9) in props)) res[key] = attrs[key];
		return res;
	};
	function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
		const { props: prevProps, children: prevChildren, component } = prevVNode;
		const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
		const emits = component.emitsOptions;
		if (nextVNode.dirs || nextVNode.transition) return true;
		if (optimized && patchFlag >= 0) {
			if (patchFlag & 1024) return true;
			if (patchFlag & 16) {
				if (!prevProps) return !!nextProps;
				return hasPropsChanged(prevProps, nextProps, emits);
			} else if (patchFlag & 8) {
				const dynamicProps = nextVNode.dynamicProps;
				for (let i = 0; i < dynamicProps.length; i++) {
					const key = dynamicProps[i];
					if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) return true;
				}
			}
		} else {
			if (prevChildren || nextChildren) {
				if (!nextChildren || !nextChildren.$stable) return true;
			}
			if (prevProps === nextProps) return false;
			if (!prevProps) return !!nextProps;
			if (!nextProps) return true;
			return hasPropsChanged(prevProps, nextProps, emits);
		}
		return false;
	}
	function hasPropsChanged(prevProps, nextProps, emitsOptions) {
		const nextKeys = Object.keys(nextProps);
		if (nextKeys.length !== Object.keys(prevProps).length) return true;
		for (let i = 0; i < nextKeys.length; i++) {
			const key = nextKeys[i];
			if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) return true;
		}
		return false;
	}
	function hasPropValueChanged(nextProps, prevProps, key) {
		const nextProp = nextProps[key];
		const prevProp = prevProps[key];
		if (key === "style" && isObject(nextProp) && isObject(prevProp)) return !looseEqual(nextProp, prevProp);
		return nextProp !== prevProp;
	}
	function updateHOCHostEl({ vnode, parent, suspense }, el) {
		while (parent) {
			const root = parent.subTree;
			if (root.suspense && root.suspense.activeBranch === vnode) {
				root.suspense.vnode.el = root.el = el;
				vnode = root;
			}
			if (root === vnode) {
				(vnode = parent.vnode).el = el;
				parent = parent.parent;
			} else break;
		}
		if (suspense && suspense.activeBranch === vnode) suspense.vnode.el = el;
	}
	var internalObjectProto = {};
	var createInternalObject = () => Object.create(internalObjectProto);
	var isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
	function initProps(instance, rawProps, isStateful, isSSR = false) {
		const props = {};
		const attrs = createInternalObject();
		instance.propsDefaults = Object.create(null);
		setFullProps(instance, rawProps, props, attrs);
		for (const key in instance.propsOptions[0]) if (!(key in props)) props[key] = void 0;
		if (isStateful) instance.props = isSSR ? props : shallowReactive(props);
		else if (!instance.type.props) instance.props = attrs;
		else instance.props = props;
		instance.attrs = attrs;
	}
	function updateProps(instance, rawProps, rawPrevProps, optimized) {
		const { props, attrs, vnode: { patchFlag } } = instance;
		const rawCurrentProps = toRaw(props);
		const [options] = instance.propsOptions;
		let hasAttrsChanged = false;
		if ((optimized || patchFlag > 0) && !(patchFlag & 16)) {
			if (patchFlag & 8) {
				const propsToUpdate = instance.vnode.dynamicProps;
				for (let i = 0; i < propsToUpdate.length; i++) {
					let key = propsToUpdate[i];
					if (isEmitListener(instance.emitsOptions, key)) continue;
					const value = rawProps[key];
					if (options) {
						if (hasOwn(attrs, key)) {
							if (value !== attrs[key]) {
								attrs[key] = value;
								hasAttrsChanged = true;
							}
						} else {
							const camelizedKey = camelize(key);
							props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false);
						}
					} else if (value !== attrs[key]) {
						attrs[key] = value;
						hasAttrsChanged = true;
					}
				}
			}
		} else {
			if (setFullProps(instance, rawProps, props, attrs)) hasAttrsChanged = true;
			let kebabKey;
			for (const key in rawCurrentProps) if (!rawProps || !hasOwn(rawProps, key) && ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
				if (options) {
					if (rawPrevProps && (rawPrevProps[key] !== void 0 || rawPrevProps[kebabKey] !== void 0)) props[key] = resolvePropValue(options, rawCurrentProps, key, void 0, instance, true);
				} else delete props[key];
			}
			if (attrs !== rawCurrentProps) {
				for (const key in attrs) if (!rawProps || !hasOwn(rawProps, key) && true) {
					delete attrs[key];
					hasAttrsChanged = true;
				}
			}
		}
		if (hasAttrsChanged) trigger(instance.attrs, "set", "");
	}
	function setFullProps(instance, rawProps, props, attrs) {
		const [options, needCastKeys] = instance.propsOptions;
		let hasAttrsChanged = false;
		let rawCastValues;
		if (rawProps) for (let key in rawProps) {
			if (isReservedProp(key)) continue;
			const value = rawProps[key];
			let camelKey;
			if (options && hasOwn(options, camelKey = camelize(key))) {
				if (!needCastKeys || !needCastKeys.includes(camelKey)) props[camelKey] = value;
				else (rawCastValues || (rawCastValues = {}))[camelKey] = value;
			} else if (!isEmitListener(instance.emitsOptions, key)) {
				if (!(key in attrs) || value !== attrs[key]) {
					attrs[key] = value;
					hasAttrsChanged = true;
				}
			}
		}
		if (needCastKeys) {
			const rawCurrentProps = toRaw(props);
			const castValues = rawCastValues || EMPTY_OBJ;
			for (let i = 0; i < needCastKeys.length; i++) {
				const key = needCastKeys[i];
				props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
			}
		}
		return hasAttrsChanged;
	}
	function resolvePropValue(options, props, key, value, instance, isAbsent) {
		const opt = options[key];
		if (opt != null) {
			const hasDefault = hasOwn(opt, "default");
			if (hasDefault && value === void 0) {
				const defaultValue = opt.default;
				if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
					const { propsDefaults } = instance;
					if (key in propsDefaults) value = propsDefaults[key];
					else {
						const reset = setCurrentInstance(instance);
						value = propsDefaults[key] = defaultValue.call(null, props);
						reset();
					}
				} else value = defaultValue;
				if (instance.ce) instance.ce._setProp(key, value);
			}
			if (opt[0]) {
				if (isAbsent && !hasDefault) value = false;
				else if (opt[1] && (value === "" || value === hyphenate(key))) value = true;
			}
		}
		return value;
	}
	var mixinPropsCache = new WeakMap();
	function normalizePropsOptions(comp, appContext, asMixin = false) {
		const cache = asMixin ? mixinPropsCache : appContext.propsCache;
		const cached = cache.get(comp);
		if (cached) return cached;
		const raw = comp.props;
		const normalized = {};
		const needCastKeys = [];
		let hasExtends = false;
		if (!isFunction(comp)) {
			const extendProps = (raw2) => {
				hasExtends = true;
				const [props, keys] = normalizePropsOptions(raw2, appContext, true);
				extend(normalized, props);
				if (keys) needCastKeys.push(...keys);
			};
			if (!asMixin && appContext.mixins.length) appContext.mixins.forEach(extendProps);
			if (comp.extends) extendProps(comp.extends);
			if (comp.mixins) comp.mixins.forEach(extendProps);
		}
		if (!raw && !hasExtends) {
			if (isObject(comp)) cache.set(comp, EMPTY_ARR);
			return EMPTY_ARR;
		}
		if (isArray(raw)) for (let i = 0; i < raw.length; i++) {
			const normalizedKey = camelize(raw[i]);
			if (validatePropName(normalizedKey)) normalized[normalizedKey] = EMPTY_OBJ;
		}
		else if (raw) for (const key in raw) {
			const normalizedKey = camelize(key);
			if (validatePropName(normalizedKey)) {
				const opt = raw[key];
				const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
				const propType = prop.type;
				let shouldCast = false;
				let shouldCastTrue = true;
				if (isArray(propType)) for (let index = 0; index < propType.length; ++index) {
					const type = propType[index];
					const typeName = isFunction(type) && type.name;
					if (typeName === "Boolean") {
						shouldCast = true;
						break;
					} else if (typeName === "String") shouldCastTrue = false;
				}
				else shouldCast = isFunction(propType) && propType.name === "Boolean";
				prop[0] = shouldCast;
				prop[1] = shouldCastTrue;
				if (shouldCast || hasOwn(prop, "default")) needCastKeys.push(normalizedKey);
			}
		}
		const res = [normalized, needCastKeys];
		if (isObject(comp)) cache.set(comp, res);
		return res;
	}
	function validatePropName(key) {
		if (key[0] !== "$" && !isReservedProp(key)) return true;
		return false;
	}
	var isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
	var normalizeSlotValue = (value) => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
	var normalizeSlot = (key, rawSlot, ctx) => {
		if (rawSlot._n) return rawSlot;
		const normalized = withCtx((...args) => {
			return normalizeSlotValue(rawSlot(...args));
		}, ctx);
		normalized._c = false;
		return normalized;
	};
	var normalizeObjectSlots = (rawSlots, slots, instance) => {
		const ctx = rawSlots._ctx;
		for (const key in rawSlots) {
			if (isInternalKey(key)) continue;
			const value = rawSlots[key];
			if (isFunction(value)) slots[key] = normalizeSlot(key, value, ctx);
			else if (value != null) {
				const normalized = normalizeSlotValue(value);
				slots[key] = () => normalized;
			}
		}
	};
	var normalizeVNodeSlots = (instance, children) => {
		const normalized = normalizeSlotValue(children);
		instance.slots.default = () => normalized;
	};
	var assignSlots = (slots, children, optimized) => {
		for (const key in children) if (optimized || !isInternalKey(key)) slots[key] = children[key];
	};
	var initSlots = (instance, children, optimized) => {
		const slots = instance.slots = createInternalObject();
		if (instance.vnode.shapeFlag & 32) {
			const type = children._;
			if (type) {
				assignSlots(slots, children, optimized);
				if (optimized) def(slots, "_", type, true);
			} else normalizeObjectSlots(children, slots);
		} else if (children) normalizeVNodeSlots(instance, children);
	};
	var updateSlots = (instance, children, optimized) => {
		const { vnode, slots } = instance;
		let needDeletionCheck = true;
		let deletionComparisonTarget = EMPTY_OBJ;
		if (vnode.shapeFlag & 32) {
			const type = children._;
			if (type) {
				if (optimized && type === 1) needDeletionCheck = false;
				else assignSlots(slots, children, optimized);
			} else {
				needDeletionCheck = !children.$stable;
				normalizeObjectSlots(children, slots);
			}
			deletionComparisonTarget = children;
		} else if (children) {
			normalizeVNodeSlots(instance, children);
			deletionComparisonTarget = { default: 1 };
		}
		if (needDeletionCheck) {
			for (const key in slots) if (!isInternalKey(key) && deletionComparisonTarget[key] == null) delete slots[key];
		}
	};
	var queuePostRenderEffect = queueEffectWithSuspense;
	function createRenderer(options) {
		return baseCreateRenderer(options);
	}
	function baseCreateRenderer(options, createHydrationFns) {
		const target = getGlobalThis();
		target.__VUE__ = true;
		const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, insertStaticContent: hostInsertStaticContent } = options;
		const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
			if (n1 === n2) return;
			if (n1 && !isSameVNodeType(n1, n2)) {
				anchor = getNextHostNode(n1);
				unmount(n1, parentComponent, parentSuspense, true);
				n1 = null;
			}
			if (n2.patchFlag === -2) {
				optimized = false;
				n2.dynamicChildren = null;
			}
			const { type, ref, shapeFlag } = n2;
			switch (type) {
				case Text:
					processText(n1, n2, container, anchor);
					break;
				case Comment:
					processCommentNode(n1, n2, container, anchor);
					break;
				case Static:
					if (n1 == null) mountStaticNode(n2, container, anchor, namespace);
					break;
				case Fragment:
					processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					break;
				default: if (shapeFlag & 1) processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else if (shapeFlag & 6) processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else if (shapeFlag & 64) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
				else if (shapeFlag & 128) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
			}
			if (ref != null && parentComponent) setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
			else if (ref == null && n1 && n1.ref != null) setRef(n1.ref, null, parentSuspense, n1, true);
		};
		const processText = (n1, n2, container, anchor) => {
			if (n1 == null) hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
			else {
				const el = n2.el = n1.el;
				if (n2.children !== n1.children) hostSetText(el, n2.children);
			}
		};
		const processCommentNode = (n1, n2, container, anchor) => {
			if (n1 == null) hostInsert(n2.el = hostCreateComment(n2.children || ""), container, anchor);
			else n2.el = n1.el;
		};
		const mountStaticNode = (n2, container, anchor, namespace) => {
			[n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, namespace, n2.el, n2.anchor);
		};
		const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
			let next;
			while (el && el !== anchor) {
				next = hostNextSibling(el);
				hostInsert(el, container, nextSibling);
				el = next;
			}
			hostInsert(anchor, container, nextSibling);
		};
		const removeStaticNode = ({ el, anchor }) => {
			let next;
			while (el && el !== anchor) {
				next = hostNextSibling(el);
				hostRemove(el);
				el = next;
			}
			hostRemove(anchor);
		};
		const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
			if (n2.type === "svg") namespace = "svg";
			else if (n2.type === "math") namespace = "mathml";
			if (n1 == null) mountElement(n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else {
				const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
				try {
					if (customElement) customElement._beginPatch();
					patchElement(n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				} finally {
					if (customElement) customElement._endPatch();
				}
			}
		};
		const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
			let el;
			let vnodeHook;
			const { props, shapeFlag, transition, dirs } = vnode;
			el = vnode.el = hostCreateElement(vnode.type, namespace, props && props.is, props);
			if (shapeFlag & 8) hostSetElementText(el, vnode.children);
			else if (shapeFlag & 16) mountChildren(vnode.children, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(vnode, namespace), slotScopeIds, optimized);
			if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "created");
			setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
			if (props) {
				for (const key in props) if (key !== "value" && !isReservedProp(key)) hostPatchProp(el, key, null, props[key], namespace, parentComponent);
				if ("value" in props) hostPatchProp(el, "value", null, props.value, namespace);
				if (vnodeHook = props.onVnodeBeforeMount) invokeVNodeHook(vnodeHook, parentComponent, vnode);
			}
			if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
			const needCallTransitionHooks = needTransition(parentSuspense, transition);
			if (needCallTransitionHooks) transition.beforeEnter(el);
			hostInsert(el, container, anchor);
			if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) queuePostRenderEffect(() => {
				try {
					vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
					needCallTransitionHooks && transition.enter(el);
					dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
				} finally {}
			}, parentSuspense);
		};
		const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
			if (scopeId) hostSetScopeId(el, scopeId);
			if (slotScopeIds) for (let i = 0; i < slotScopeIds.length; i++) hostSetScopeId(el, slotScopeIds[i]);
			if (parentComponent) {
				let subTree = parentComponent.subTree;
				if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
					const parentVNode = parentComponent.vnode;
					setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
				}
			}
		};
		const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
			for (let i = start; i < children.length; i++) {
				const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
				patch(null, child, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			}
		};
		const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
			const el = n2.el = n1.el;
			let { patchFlag, dynamicChildren, dirs } = n2;
			patchFlag |= n1.patchFlag & 16;
			const oldProps = n1.props || EMPTY_OBJ;
			const newProps = n2.props || EMPTY_OBJ;
			let vnodeHook;
			parentComponent && toggleRecurse(parentComponent, false);
			if (vnodeHook = newProps.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
			if (dirs) invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
			parentComponent && toggleRecurse(parentComponent, true);
			if (dynamicChildren && (!n1.dynamicChildren || n1.dynamicChildren.length !== dynamicChildren.length)) {
				patchFlag = 0;
				optimized = false;
				dynamicChildren = null;
			}
			if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) hostSetElementText(el, "");
			if (dynamicChildren) patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds);
			else if (!optimized) patchChildren(n1, n2, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds, false);
			if (patchFlag > 0) {
				if (patchFlag & 16) patchProps(el, oldProps, newProps, parentComponent, namespace);
				else {
					if (patchFlag & 2) {
						if (oldProps.class !== newProps.class) hostPatchProp(el, "class", null, newProps.class, namespace);
					}
					if (patchFlag & 4) hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
					if (patchFlag & 8) {
						const propsToUpdate = n2.dynamicProps;
						for (let i = 0; i < propsToUpdate.length; i++) {
							const key = propsToUpdate[i];
							const prev = oldProps[key];
							const next = newProps[key];
							if (next !== prev || key === "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
						}
					}
				}
				if (patchFlag & 1) {
					if (n1.children !== n2.children) hostSetElementText(el, n2.children);
				}
			} else if (!optimized && dynamicChildren == null) patchProps(el, oldProps, newProps, parentComponent, namespace);
			if ((vnodeHook = newProps.onVnodeUpdated) || dirs) queuePostRenderEffect(() => {
				vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
				dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
			}, parentSuspense);
		};
		const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
			for (let i = 0; i < newChildren.length; i++) {
				const oldVNode = oldChildren[i];
				const newVNode = newChildren[i];
				const container = oldVNode.el && (oldVNode.type === Fragment || !isSameVNodeType(oldVNode, newVNode) || oldVNode.shapeFlag & 198) ? hostParentNode(oldVNode.el) : fallbackContainer;
				patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, true);
			}
		};
		const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
			if (oldProps !== newProps) {
				if (oldProps !== EMPTY_OBJ) {
					for (const key in oldProps) if (!isReservedProp(key) && !(key in newProps)) hostPatchProp(el, key, oldProps[key], null, namespace, parentComponent);
				}
				for (const key in newProps) {
					if (isReservedProp(key)) continue;
					const next = newProps[key];
					const prev = oldProps[key];
					if (next !== prev && key !== "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
				}
				if ("value" in newProps) hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
			}
		};
		const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
			const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
			const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
			let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
			if (fragmentSlotScopeIds) slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
			if (n1 == null) {
				hostInsert(fragmentStartAnchor, container, anchor);
				hostInsert(fragmentEndAnchor, container, anchor);
				mountChildren(n2.children || [], container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			} else if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
				patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, namespace, slotScopeIds);
				if (n2.key != null || parentComponent && n2 === parentComponent.subTree) traverseStaticChildren(n1, n2, true);
			} else patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		};
		const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
			n2.slotScopeIds = slotScopeIds;
			if (n1 == null) {
				if (n2.shapeFlag & 512) parentComponent.ctx.activate(n2, container, anchor, namespace, optimized);
				else mountComponent(n2, container, anchor, parentComponent, parentSuspense, namespace, optimized);
			} else updateComponent(n1, n2, optimized);
		};
		const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
			const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense);
			if (isKeepAlive(initialVNode)) instance.ctx.renderer = internals;
			setupComponent(instance, false, optimized);
			if (instance.asyncDep) {
				parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized);
				if (!initialVNode.el) {
					const placeholder = instance.subTree = createVNode(Comment);
					processCommentNode(null, placeholder, container, anchor);
					initialVNode.placeholder = placeholder.el;
				}
			} else setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, namespace, optimized);
		};
		const updateComponent = (n1, n2, optimized) => {
			const instance = n2.component = n1.component;
			if (shouldUpdateComponent(n1, n2, optimized)) {
				if (instance.asyncDep && !instance.asyncResolved) {
					updateComponentPreRender(instance, n2, optimized);
					return;
				} else {
					instance.next = n2;
					instance.update();
				}
			} else {
				n2.el = n1.el;
				instance.vnode = n2;
			}
		};
		const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
			const componentUpdateFn = () => {
				if (!instance.isMounted) {
					let vnodeHook;
					const { el, props } = initialVNode;
					const { bm, m, parent, root, type } = instance;
					const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
					toggleRecurse(instance, false);
					if (bm) invokeArrayFns(bm);
					if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) invokeVNodeHook(vnodeHook, parent, initialVNode);
					toggleRecurse(instance, true);
					if (el && hydrateNode) {
						const hydrateSubTree = () => {
							instance.subTree = renderComponentRoot(instance);
							hydrateNode(el, instance.subTree, instance, parentSuspense, null);
						};
						if (isAsyncWrapperVNode && type.__asyncHydrate) type.__asyncHydrate(el, instance, hydrateSubTree);
						else hydrateSubTree();
					} else {
						if (root.ce && root.ce._hasShadowRoot()) root.ce._injectChildStyle(type, instance.parent ? instance.parent.type : void 0);
						const subTree = instance.subTree = renderComponentRoot(instance);
						patch(null, subTree, container, anchor, instance, parentSuspense, namespace);
						initialVNode.el = subTree.el;
					}
					if (m) queuePostRenderEffect(m, parentSuspense);
					if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
						const scopedInitialVNode = initialVNode;
						queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
					}
					if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) instance.a && queuePostRenderEffect(instance.a, parentSuspense);
					instance.isMounted = true;
					initialVNode = container = anchor = null;
				} else {
					let { next, bu, u, parent, vnode } = instance;
					{
						const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
						if (nonHydratedAsyncRoot) {
							if (next) {
								next.el = vnode.el;
								updateComponentPreRender(instance, next, optimized);
							}
							nonHydratedAsyncRoot.asyncDep.then(() => {
								queuePostRenderEffect(() => {
									if (!instance.isUnmounted) update();
								}, parentSuspense);
							});
							return;
						}
					}
					let originNext = next;
					let vnodeHook;
					toggleRecurse(instance, false);
					if (next) {
						next.el = vnode.el;
						updateComponentPreRender(instance, next, optimized);
					} else next = vnode;
					if (bu) invokeArrayFns(bu);
					if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parent, next, vnode);
					toggleRecurse(instance, true);
					const nextTree = renderComponentRoot(instance);
					const prevTree = instance.subTree;
					instance.subTree = nextTree;
					patch(prevTree, nextTree, hostParentNode(prevTree.el), getNextHostNode(prevTree), instance, parentSuspense, namespace);
					next.el = nextTree.el;
					if (originNext === null) updateHOCHostEl(instance, nextTree.el);
					if (u) queuePostRenderEffect(u, parentSuspense);
					if (vnodeHook = next.props && next.props.onVnodeUpdated) queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
				}
			};
			instance.scope.on();
			const effect = instance.effect = new ReactiveEffect(componentUpdateFn);
			instance.scope.off();
			const update = instance.update = effect.run.bind(effect);
			const job = instance.job = effect.runIfDirty.bind(effect);
			job.i = instance;
			job.id = instance.uid;
			effect.scheduler = () => queueJob(job);
			toggleRecurse(instance, true);
			update();
		};
		const updateComponentPreRender = (instance, nextVNode, optimized) => {
			nextVNode.component = instance;
			const prevProps = instance.vnode.props;
			instance.vnode = nextVNode;
			instance.next = null;
			updateProps(instance, nextVNode.props, prevProps, optimized);
			updateSlots(instance, nextVNode.children, optimized);
			pauseTracking();
			flushPreFlushCbs(instance);
			resetTracking();
		};
		const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
			const c1 = n1 && n1.children;
			const prevShapeFlag = n1 ? n1.shapeFlag : 0;
			const c2 = n2.children;
			const { patchFlag, shapeFlag } = n2;
			if (patchFlag > 0) {
				if (patchFlag & 128) {
					patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					return;
				} else if (patchFlag & 256) {
					patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					return;
				}
			}
			if (shapeFlag & 8) {
				if (prevShapeFlag & 16) unmountChildren(c1, parentComponent, parentSuspense);
				if (c2 !== c1) hostSetElementText(container, c2);
			} else if (prevShapeFlag & 16) {
				if (shapeFlag & 16) patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else unmountChildren(c1, parentComponent, parentSuspense, true);
			} else {
				if (prevShapeFlag & 8) hostSetElementText(container, "");
				if (shapeFlag & 16) mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			}
		};
		const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
			c1 = c1 || EMPTY_ARR;
			c2 = c2 || EMPTY_ARR;
			const oldLength = c1.length;
			const newLength = c2.length;
			const commonLength = Math.min(oldLength, newLength);
			let i = 0;
			for (; i < commonLength; i++) {
				const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
				patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			}
			if (oldLength > newLength) unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
			else mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, commonLength);
		};
		const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
			let i = 0;
			const l2 = c2.length;
			let e1 = c1.length - 1;
			let e2 = l2 - 1;
			while (i <= e1 && i <= e2) {
				const n1 = c1[i];
				const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
				if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else break;
				i++;
			}
			while (i <= e1 && i <= e2) {
				const n1 = c1[e1];
				const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
				if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else break;
				e1--;
				e2--;
			}
			if (i > e1) {
				if (i <= e2) {
					const nextPos = e2 + 1;
					const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
					while (i <= e2) {
						patch(null, c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]), container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
						i++;
					}
				}
			} else if (i > e2) while (i <= e1) {
				unmount(c1[i], parentComponent, parentSuspense, true);
				i++;
			}
			else {
				const s1 = i;
				const s2 = i;
				const keyToNewIndexMap = new Map();
				for (i = s2; i <= e2; i++) {
					const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
					if (nextChild.key != null) keyToNewIndexMap.set(nextChild.key, i);
				}
				let j;
				let patched = 0;
				const toBePatched = e2 - s2 + 1;
				let moved = false;
				let maxNewIndexSoFar = 0;
				const newIndexToOldIndexMap = new Array(toBePatched);
				for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
				for (i = s1; i <= e1; i++) {
					const prevChild = c1[i];
					if (patched >= toBePatched) {
						unmount(prevChild, parentComponent, parentSuspense, true);
						continue;
					}
					let newIndex;
					if (prevChild.key != null) newIndex = keyToNewIndexMap.get(prevChild.key);
					else for (j = s2; j <= e2; j++) if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
						newIndex = j;
						break;
					}
					if (newIndex === void 0) unmount(prevChild, parentComponent, parentSuspense, true);
					else {
						newIndexToOldIndexMap[newIndex - s2] = i + 1;
						if (newIndex >= maxNewIndexSoFar) maxNewIndexSoFar = newIndex;
						else moved = true;
						patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
						patched++;
					}
				}
				const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
				j = increasingNewIndexSequence.length - 1;
				for (i = toBePatched - 1; i >= 0; i--) {
					const nextIndex = s2 + i;
					const nextChild = c2[nextIndex];
					const anchorVNode = c2[nextIndex + 1];
					const anchor = nextIndex + 1 < l2 ? anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode) : parentAnchor;
					if (newIndexToOldIndexMap[i] === 0) patch(null, nextChild, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					else if (moved) {
						if (j < 0 || i !== increasingNewIndexSequence[j]) move(nextChild, container, anchor, 2);
						else j--;
					}
				}
			}
		};
		const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
			const { el, type, transition, children, shapeFlag } = vnode;
			if (shapeFlag & 6) {
				move(vnode.component.subTree, container, anchor, moveType);
				return;
			}
			if (shapeFlag & 128) {
				vnode.suspense.move(container, anchor, moveType);
				return;
			}
			if (shapeFlag & 64) {
				type.move(vnode, container, anchor, internals);
				return;
			}
			if (type === Fragment) {
				hostInsert(el, container, anchor);
				for (let i = 0; i < children.length; i++) move(children[i], container, anchor, moveType);
				hostInsert(vnode.anchor, container, anchor);
				return;
			}
			if (type === Static) {
				moveStaticNode(vnode, container, anchor);
				return;
			}
			if (moveType !== 2 && shapeFlag & 1 && transition) {
				if (moveType === 0) {
					if (transition.persisted && !el[leaveCbKey]) hostInsert(el, container, anchor);
					else {
						transition.beforeEnter(el);
						hostInsert(el, container, anchor);
						queuePostRenderEffect(() => transition.enter(el), parentSuspense);
					}
				} else {
					const { leave, delayLeave, afterLeave } = transition;
					const remove2 = () => {
						if (vnode.ctx.isUnmounted) hostRemove(el);
						else hostInsert(el, container, anchor);
					};
					const performLeave = () => {
						const wasLeaving = el._isLeaving || !!el[leaveCbKey];
						if (el._isLeaving) el[leaveCbKey](true);
						if (transition.persisted && !wasLeaving) remove2();
						else leave(el, () => {
							remove2();
							afterLeave && afterLeave();
						});
					};
					if (delayLeave) delayLeave(el, remove2, performLeave);
					else performLeave();
				}
			} else hostInsert(el, container, anchor);
		};
		const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
			const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs, cacheIndex, memo } = vnode;
			if (patchFlag === -2) optimized = false;
			if (ref != null) {
				pauseTracking();
				setRef(ref, null, parentSuspense, vnode, true);
				resetTracking();
			}
			if (cacheIndex != null) parentComponent.renderCache[cacheIndex] = void 0;
			if (shapeFlag & 256) {
				parentComponent.ctx.deactivate(vnode);
				return;
			}
			const shouldInvokeDirs = shapeFlag & 1 && dirs;
			const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
			let vnodeHook;
			if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) invokeVNodeHook(vnodeHook, parentComponent, vnode);
			if (shapeFlag & 6) unmountComponent(vnode.component, parentSuspense, doRemove);
			else {
				if (shapeFlag & 128) {
					vnode.suspense.unmount(parentSuspense, doRemove);
					return;
				}
				if (shouldInvokeDirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
				if (shapeFlag & 64) vnode.type.remove(vnode, parentComponent, parentSuspense, internals, doRemove);
				else if (dynamicChildren && !dynamicChildren.hasOnce && (type !== Fragment || patchFlag > 0 && patchFlag & 64)) unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
				else if (type === Fragment && patchFlag & 384 || !optimized && shapeFlag & 16) unmountChildren(children, parentComponent, parentSuspense);
				if (doRemove) remove(vnode);
			}
			const shouldInvalidateMemo = memo != null && cacheIndex == null;
			if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) queuePostRenderEffect(() => {
				vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
				shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
				if (shouldInvalidateMemo) vnode.el = null;
			}, parentSuspense);
		};
		const remove = (vnode) => {
			const { type, el, anchor, transition } = vnode;
			if (type === Fragment) {
				removeFragment(el, anchor);
				return;
			}
			if (type === Static) {
				removeStaticNode(vnode);
				return;
			}
			const performRemove = () => {
				hostRemove(el);
				if (transition && !transition.persisted && transition.afterLeave) transition.afterLeave();
			};
			if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
				const { leave, delayLeave } = transition;
				const performLeave = () => leave(el, performRemove);
				if (delayLeave) delayLeave(vnode.el, performRemove, performLeave);
				else performLeave();
			} else performRemove();
		};
		const removeFragment = (cur, end) => {
			let next;
			while (cur !== end) {
				next = hostNextSibling(cur);
				hostRemove(cur);
				cur = next;
			}
			hostRemove(end);
		};
		const unmountComponent = (instance, parentSuspense, doRemove) => {
			const { bum, scope, job, subTree, um, m, a } = instance;
			invalidateMount(m);
			invalidateMount(a);
			if (bum) invokeArrayFns(bum);
			scope.stop();
			if (job) {
				job.flags |= 8;
				unmount(subTree, instance, parentSuspense, doRemove);
			}
			if (um) queuePostRenderEffect(um, parentSuspense);
			queuePostRenderEffect(() => {
				instance.isUnmounted = true;
			}, parentSuspense);
		};
		const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
			for (let i = start; i < children.length; i++) unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
		};
		const getNextHostNode = (vnode) => {
			if (vnode.shapeFlag & 6) return getNextHostNode(vnode.component.subTree);
			if (vnode.shapeFlag & 128) return vnode.suspense.next();
			const el = hostNextSibling(vnode.anchor || vnode.el);
			const teleportEnd = el && el[TeleportEndKey];
			return teleportEnd ? hostNextSibling(teleportEnd) : el;
		};
		let isFlushing = false;
		const render = (vnode, container, namespace) => {
			let instance;
			if (vnode == null) {
				if (container._vnode) {
					unmount(container._vnode, null, null, true);
					instance = container._vnode.component;
				}
			} else patch(container._vnode || null, vnode, container, null, null, null, namespace);
			container._vnode = vnode;
			if (!isFlushing) {
				isFlushing = true;
				flushPreFlushCbs(instance);
				flushPostFlushCbs();
				isFlushing = false;
			}
		};
		const internals = {
			p: patch,
			um: unmount,
			m: move,
			r: remove,
			mt: mountComponent,
			mc: mountChildren,
			pc: patchChildren,
			pbc: patchBlockChildren,
			n: getNextHostNode,
			o: options
		};
		let hydrate;
		let hydrateNode;
		if (createHydrationFns) [hydrate, hydrateNode] = createHydrationFns(internals);
		return {
			render,
			hydrate,
			createApp: createAppAPI(render, hydrate)
		};
	}
	function resolveChildrenNamespace({ type, props }, currentNamespace) {
		return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
	}
	function toggleRecurse({ effect, job }, allowed) {
		if (allowed) {
			effect.flags |= 32;
			job.flags |= 4;
		} else {
			effect.flags &= -33;
			job.flags &= -5;
		}
	}
	function needTransition(parentSuspense, transition) {
		return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
	}
	function traverseStaticChildren(n1, n2, shallow = false) {
		const ch1 = n1.children;
		const ch2 = n2.children;
		if (isArray(ch1) && isArray(ch2)) for (let i = 0; i < ch1.length; i++) {
			const c1 = ch1[i];
			let c2 = ch2[i];
			if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
				if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
					c2 = ch2[i] = cloneIfMounted(ch2[i]);
					c2.el = c1.el;
				}
				if (!shallow && c2.patchFlag !== -2) traverseStaticChildren(c1, c2);
			}
			if (c2.type === Text) {
				if (c2.patchFlag === -1) c2 = ch2[i] = cloneIfMounted(c2);
				c2.el = c1.el;
			}
			if (c2.type === Comment && !c2.el) c2.el = c1.el;
		}
	}
	function getSequence(arr) {
		const p = arr.slice();
		const result = [0];
		let i, j, u, v, c;
		const len = arr.length;
		for (i = 0; i < len; i++) {
			const arrI = arr[i];
			if (arrI !== 0) {
				j = result[result.length - 1];
				if (arr[j] < arrI) {
					p[i] = j;
					result.push(i);
					continue;
				}
				u = 0;
				v = result.length - 1;
				while (u < v) {
					c = u + v >> 1;
					if (arr[result[c]] < arrI) u = c + 1;
					else v = c;
				}
				if (arrI < arr[result[u]]) {
					if (u > 0) p[i] = result[u - 1];
					result[u] = i;
				}
			}
		}
		u = result.length;
		v = result[u - 1];
		while (u-- > 0) {
			result[u] = v;
			v = p[v];
		}
		return result;
	}
	function locateNonHydratedAsyncRoot(instance) {
		const subComponent = instance.subTree.component;
		if (subComponent) {
			if (subComponent.asyncDep && !subComponent.asyncResolved) return subComponent;
			else return locateNonHydratedAsyncRoot(subComponent);
		}
	}
	function invalidateMount(hooks) {
		if (hooks) for (let i = 0; i < hooks.length; i++) hooks[i].flags |= 8;
	}
	function resolveAsyncComponentPlaceholder(anchorVnode) {
		if (anchorVnode.placeholder) return anchorVnode.placeholder;
		const instance = anchorVnode.component;
		if (instance) return resolveAsyncComponentPlaceholder(instance.subTree);
		return null;
	}
	var isSuspense = (type) => type.__isSuspense;
	function queueEffectWithSuspense(fn, suspense) {
		if (suspense && suspense.pendingBranch) {
			if (isArray(fn)) suspense.effects.push(...fn);
			else suspense.effects.push(fn);
		} else queuePostFlushCb(fn);
	}
	var Fragment = Symbol.for("v-fgt");
	var Text = Symbol.for("v-txt");
	var Comment = Symbol.for("v-cmt");
	var Static = Symbol.for("v-stc");
	var blockStack = [];
	var currentBlock = null;
	function openBlock(disableTracking = false) {
		blockStack.push(currentBlock = disableTracking ? null : []);
	}
	function closeBlock() {
		blockStack.pop();
		currentBlock = blockStack[blockStack.length - 1] || null;
	}
	var isBlockTreeEnabled = 1;
	function setBlockTracking(value, inVOnce = false) {
		isBlockTreeEnabled += value;
		if (value < 0 && currentBlock && inVOnce) currentBlock.hasOnce = true;
	}
	function setupBlock(vnode) {
		vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
		closeBlock();
		if (isBlockTreeEnabled > 0 && currentBlock) currentBlock.push(vnode);
		return vnode;
	}
	function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
		return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true));
	}
	function createBlock(type, props, children, patchFlag, dynamicProps) {
		return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
	}
	function isVNode(value) {
		return value ? value.__v_isVNode === true : false;
	}
	function isSameVNodeType(n1, n2) {
		return n1.type === n2.type && n1.key === n2.key;
	}
	var normalizeKey = ({ key }) => key != null ? key : null;
	var normalizeRef = ({ ref, ref_key, ref_for }) => {
		if (typeof ref === "number") ref = "" + ref;
		return ref != null ? isString(ref) || isRef(ref) || isFunction(ref) ? {
			i: currentRenderingInstance,
			r: ref,
			k: ref_key,
			f: !!ref_for
		} : ref : null;
	};
	function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
		const vnode = {
			__v_isVNode: true,
			__v_skip: true,
			type,
			props,
			key: props && normalizeKey(props),
			ref: props && normalizeRef(props),
			scopeId: currentScopeId,
			slotScopeIds: null,
			children,
			component: null,
			suspense: null,
			ssContent: null,
			ssFallback: null,
			dirs: null,
			transition: null,
			el: null,
			anchor: null,
			target: null,
			targetStart: null,
			targetAnchor: null,
			staticCount: 0,
			shapeFlag,
			patchFlag,
			dynamicProps,
			dynamicChildren: null,
			appContext: null,
			ctx: currentRenderingInstance
		};
		if (needFullChildrenNormalization) {
			normalizeChildren(vnode, children);
			if (shapeFlag & 128) type.normalize(vnode);
		} else if (children) vnode.shapeFlag |= isString(children) ? 8 : 16;
		if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock && (vnode.patchFlag > 0 || shapeFlag & 6) && vnode.patchFlag !== 32) currentBlock.push(vnode);
		return vnode;
	}
	var createVNode = _createVNode;
	function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
		if (!type || type === NULL_DYNAMIC_COMPONENT) type = Comment;
		if (isVNode(type)) {
			const cloned = cloneVNode(type, props, true);
			if (children) normalizeChildren(cloned, children);
			if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
				if (cloned.shapeFlag & 6) currentBlock[currentBlock.indexOf(type)] = cloned;
				else currentBlock.push(cloned);
			}
			cloned.patchFlag = -2;
			return cloned;
		}
		if (isClassComponent(type)) type = type.__vccOpts;
		if (props) {
			props = guardReactiveProps(props);
			let { class: klass, style } = props;
			if (klass && !isString(klass)) props.class = normalizeClass(klass);
			if (isObject(style)) {
				if (isProxy(style) && !isArray(style)) style = extend({}, style);
				props.style = normalizeStyle(style);
			}
		}
		const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
		return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
	}
	function guardReactiveProps(props) {
		if (!props) return null;
		return isProxy(props) || isInternalObject(props) ? extend({}, props) : props;
	}
	function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
		const { props, ref, patchFlag, children, transition } = vnode;
		const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
		const cloned = {
			__v_isVNode: true,
			__v_skip: true,
			type: vnode.type,
			props: mergedProps,
			key: mergedProps && normalizeKey(mergedProps),
			ref: extraProps && extraProps.ref ? mergeRef && ref ? isArray(ref) ? ref.concat(normalizeRef(extraProps)) : [ref, normalizeRef(extraProps)] : normalizeRef(extraProps) : ref,
			scopeId: vnode.scopeId,
			slotScopeIds: vnode.slotScopeIds,
			children,
			target: vnode.target,
			targetStart: vnode.targetStart,
			targetAnchor: vnode.targetAnchor,
			staticCount: vnode.staticCount,
			shapeFlag: vnode.shapeFlag,
			patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
			dynamicProps: vnode.dynamicProps,
			dynamicChildren: vnode.dynamicChildren,
			appContext: vnode.appContext,
			dirs: vnode.dirs,
			transition,
			component: vnode.component,
			suspense: vnode.suspense,
			ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
			ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
			placeholder: vnode.placeholder,
			el: vnode.el,
			anchor: vnode.anchor,
			ctx: vnode.ctx,
			ce: vnode.ce
		};
		if (transition && cloneTransition) setTransitionHooks(cloned, transition.clone(cloned));
		return cloned;
	}
	function createTextVNode(text = " ", flag = 0) {
		return createVNode(Text, null, text, flag);
	}
	function createCommentVNode(text = "", asBlock = false) {
		return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
	}
	function normalizeVNode(child) {
		if (child == null || typeof child === "boolean") return createVNode(Comment);
		else if (isArray(child)) return createVNode(Fragment, null, child.slice());
		else if (isVNode(child)) return cloneIfMounted(child);
		else return createVNode(Text, null, String(child));
	}
	function cloneIfMounted(child) {
		return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
	}
	function normalizeChildren(vnode, children) {
		let type = 0;
		const { shapeFlag } = vnode;
		if (children == null) children = null;
		else if (isArray(children)) type = 16;
		else if (typeof children === "object") {
			if (shapeFlag & 65) {
				const slot = children.default;
				if (slot) {
					slot._c && (slot._d = false);
					normalizeChildren(vnode, slot());
					slot._c && (slot._d = true);
				}
				return;
			} else {
				type = 32;
				const slotFlag = children._;
				if (!slotFlag && !isInternalObject(children)) children._ctx = currentRenderingInstance;
				else if (slotFlag === 3 && currentRenderingInstance) {
					if (currentRenderingInstance.slots._ === 1) children._ = 1;
					else {
						children._ = 2;
						vnode.patchFlag |= 1024;
					}
				}
			}
		} else if (isFunction(children)) {
			if (shapeFlag & 65) {
				normalizeChildren(vnode, { default: children });
				return;
			}
			children = {
				default: children,
				_ctx: currentRenderingInstance
			};
			type = 32;
		} else {
			children = String(children);
			if (shapeFlag & 64) {
				type = 16;
				children = [createTextVNode(children)];
			} else type = 8;
		}
		vnode.children = children;
		vnode.shapeFlag |= type;
	}
	function mergeProps(...args) {
		const ret = {};
		for (let i = 0; i < args.length; i++) {
			const toMerge = args[i];
			for (const key in toMerge) if (key === "class") {
				if (ret.class !== toMerge.class) ret.class = normalizeClass([ret.class, toMerge.class]);
			} else if (key === "style") ret.style = normalizeStyle([ret.style, toMerge.style]);
			else if (isOn(key)) {
				const existing = ret[key];
				const incoming = toMerge[key];
				if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) ret[key] = existing ? [].concat(existing, incoming) : incoming;
				else if (incoming == null && existing == null && !isModelListener(key)) ret[key] = incoming;
			} else if (key !== "") ret[key] = toMerge[key];
		}
		return ret;
	}
	function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
		callWithAsyncErrorHandling(hook, instance, 7, [vnode, prevVNode]);
	}
	var emptyAppContext = createAppContext();
	var uid = 0;
	function createComponentInstance(vnode, parent, suspense) {
		const type = vnode.type;
		const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
		const instance = {
			uid: uid++,
			vnode,
			type,
			parent,
			appContext,
			root: null,
			next: null,
			subTree: null,
			effect: null,
			update: null,
			job: null,
			scope: new EffectScope(true),
			render: null,
			proxy: null,
			exposed: null,
			exposeProxy: null,
			withProxy: null,
			provides: parent ? parent.provides : Object.create(appContext.provides),
			ids: parent ? parent.ids : [
				"",
				0,
				0
			],
			accessCache: null,
			renderCache: [],
			components: null,
			directives: null,
			propsOptions: normalizePropsOptions(type, appContext),
			emitsOptions: normalizeEmitsOptions(type, appContext),
			emit: null,
			emitted: null,
			propsDefaults: EMPTY_OBJ,
			inheritAttrs: type.inheritAttrs,
			ctx: EMPTY_OBJ,
			data: EMPTY_OBJ,
			props: EMPTY_OBJ,
			attrs: EMPTY_OBJ,
			slots: EMPTY_OBJ,
			refs: EMPTY_OBJ,
			setupState: EMPTY_OBJ,
			setupContext: null,
			suspense,
			suspenseId: suspense ? suspense.pendingId : 0,
			asyncDep: null,
			asyncResolved: false,
			isMounted: false,
			isUnmounted: false,
			isDeactivated: false,
			bc: null,
			c: null,
			bm: null,
			m: null,
			bu: null,
			u: null,
			um: null,
			bum: null,
			da: null,
			a: null,
			rtg: null,
			rtc: null,
			ec: null,
			sp: null
		};
		instance.ctx = { _: instance };
		instance.root = parent ? parent.root : instance;
		instance.emit = emit.bind(null, instance);
		if (vnode.ce) vnode.ce(instance);
		return instance;
	}
	var currentInstance = null;
	var getCurrentInstance = () => currentInstance || currentRenderingInstance;
	var internalSetCurrentInstance;
	var setInSSRSetupState;
	{
		const g = getGlobalThis();
		const registerGlobalSetter = (key, setter) => {
			let setters;
			if (!(setters = g[key])) setters = g[key] = [];
			setters.push(setter);
			return (v) => {
				if (setters.length > 1) setters.forEach((set) => set(v));
				else setters[0](v);
			};
		};
		internalSetCurrentInstance = registerGlobalSetter(`__VUE_INSTANCE_SETTERS__`, (v) => currentInstance = v);
		setInSSRSetupState = registerGlobalSetter(`__VUE_SSR_SETTERS__`, (v) => isInSSRComponentSetup = v);
	}
	var setCurrentInstance = (instance) => {
		const prev = currentInstance;
		internalSetCurrentInstance(instance);
		instance.scope.on();
		return () => {
			instance.scope.off();
			internalSetCurrentInstance(prev);
		};
	};
	var unsetCurrentInstance = () => {
		currentInstance && currentInstance.scope.off();
		internalSetCurrentInstance(null);
	};
	function isStatefulComponent(instance) {
		return instance.vnode.shapeFlag & 4;
	}
	var isInSSRComponentSetup = false;
	function setupComponent(instance, isSSR = false, optimized = false) {
		isSSR && setInSSRSetupState(isSSR);
		const { props, children } = instance.vnode;
		const isStateful = isStatefulComponent(instance);
		initProps(instance, props, isStateful, isSSR);
		initSlots(instance, children, optimized || isSSR);
		const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
		isSSR && setInSSRSetupState(false);
		return setupResult;
	}
	function setupStatefulComponent(instance, isSSR) {
		const Component = instance.type;
		instance.accessCache = Object.create(null);
		instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
		const { setup } = Component;
		if (setup) {
			pauseTracking();
			const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
			const reset = setCurrentInstance(instance);
			const setupResult = callWithErrorHandling(setup, instance, 0, [instance.props, setupContext]);
			const isAsyncSetup = isPromise(setupResult);
			resetTracking();
			reset();
			if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) markAsyncBoundary(instance);
			if (isAsyncSetup) {
				setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
				if (isSSR) return setupResult.then((resolvedResult) => {
					setInSSRSetupState(true);
					try {
						handleSetupResult(instance, resolvedResult, isSSR);
					} finally {
						setInSSRSetupState(false);
					}
				}).catch((e) => {
					handleError(e, instance, 0);
				});
				else instance.asyncDep = setupResult;
			} else handleSetupResult(instance, setupResult, isSSR);
		} else finishComponentSetup(instance, isSSR);
	}
	function handleSetupResult(instance, setupResult, isSSR) {
		if (isFunction(setupResult)) {
			if (instance.type.__ssrInlineRender) instance.ssrRender = setupResult;
			else instance.render = setupResult;
		} else if (isObject(setupResult)) instance.setupState = proxyRefs(setupResult);
		finishComponentSetup(instance, isSSR);
	}
	function finishComponentSetup(instance, isSSR, skipOptions) {
		const Component = instance.type;
		if (!instance.render) instance.render = Component.render || NOOP;
		{
			const reset = setCurrentInstance(instance);
			pauseTracking();
			try {
				applyOptions(instance);
			} finally {
				resetTracking();
				reset();
			}
		}
	}
	var attrsProxyHandlers = { get(target, key) {
		track(target, "get", "");
		return target[key];
	} };
	function createSetupContext(instance) {
		const expose = (exposed) => {
			instance.exposed = exposed || {};
		};
		return {
			attrs: new Proxy(instance.attrs, attrsProxyHandlers),
			slots: instance.slots,
			emit: instance.emit,
			expose
		};
	}
	function getComponentPublicInstance(instance) {
		if (instance.exposed) return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
			get(target, key) {
				if (key in target) return target[key];
				else if (key in publicPropertiesMap) return publicPropertiesMap[key](instance);
			},
			has(target, key) {
				return key in target || key in publicPropertiesMap;
			}
		}));
		else return instance.proxy;
	}
	function isClassComponent(value) {
		return isFunction(value) && "__vccOpts" in value;
	}
	var computed = (getterOrOptions, debugOptions) => {
		return computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
	};
	function h(type, propsOrChildren, children) {
		try {
			setBlockTracking(-1);
			const l = arguments.length;
			if (l === 2) {
				if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
					if (isVNode(propsOrChildren)) return createVNode(type, null, [propsOrChildren]);
					return createVNode(type, propsOrChildren);
				} else return createVNode(type, null, propsOrChildren);
			} else {
				if (l > 3) children = Array.prototype.slice.call(arguments, 2);
				else if (l === 3 && isVNode(children)) children = [children];
				return createVNode(type, propsOrChildren, children);
			}
		} finally {
			setBlockTracking(1);
		}
	}
	var version$1 = "3.5.42";
	var policy = void 0;
	var tt = typeof window !== "undefined" && window.trustedTypes;
	if (tt) try {
		policy = tt.createPolicy("vue", { createHTML: (val) => val });
	} catch (e) {}
	var unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
	var svgNS = "http://www.w3.org/2000/svg";
	var mathmlNS = "http://www.w3.org/1998/Math/MathML";
	var doc = typeof document !== "undefined" ? document : null;
	var templateContainer = doc && doc.createElement("template");
	var nodeOps = {
		insert: (child, parent, anchor) => {
			parent.insertBefore(child, anchor || null);
		},
		remove: (child) => {
			const parent = child.parentNode;
			if (parent) parent.removeChild(child);
		},
		createElement: (tag, namespace, is, props) => {
			const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, { is }) : doc.createElement(tag);
			if (tag === "select" && props && props.multiple != null) el.setAttribute("multiple", props.multiple);
			return el;
		},
		createText: (text) => doc.createTextNode(text),
		createComment: (text) => doc.createComment(text),
		setText: (node, text) => {
			node.nodeValue = text;
		},
		setElementText: (el, text) => {
			el.textContent = text;
		},
		parentNode: (node) => node.parentNode,
		nextSibling: (node) => node.nextSibling,
		querySelector: (selector) => doc.querySelector(selector),
		setScopeId(el, id) {
			el.setAttribute(id, "");
		},
		insertStaticContent(content, parent, anchor, namespace, start, end) {
			const before = anchor ? anchor.previousSibling : parent.lastChild;
			if (start && (start === end || start.nextSibling)) while (true) {
				parent.insertBefore(start.cloneNode(true), anchor);
				if (start === end || !(start = start.nextSibling)) break;
			}
			else {
				templateContainer.innerHTML = unsafeToTrustedHTML(namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content);
				const template = templateContainer.content;
				if (namespace === "svg" || namespace === "mathml") {
					const wrapper = template.firstChild;
					while (wrapper.firstChild) template.appendChild(wrapper.firstChild);
					template.removeChild(wrapper);
				}
				parent.insertBefore(template, anchor);
			}
			return [before ? before.nextSibling : parent.firstChild, anchor ? anchor.previousSibling : parent.lastChild];
		}
	};
	var vtcKey = Symbol("_vtc");
	function patchClass(el, value, isSVG) {
		const transitionClasses = el[vtcKey];
		if (transitionClasses) value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
		if (value == null) el.removeAttribute("class");
		else if (isSVG) el.setAttribute("class", value);
		else el.className = value;
	}
	var vShowOriginalDisplay = Symbol("_vod");
	var vShowHidden = Symbol("_vsh");
	var CSS_VAR_TEXT = Symbol("");
	var displayRE = /(?:^|;)\s*display\s*:/;
	function patchStyle(el, prev, next) {
		const style = el.style;
		const isCssString = isString(next);
		let hasControlledDisplay = false;
		if (next && !isCssString) {
			if (prev) {
				if (!isString(prev)) {
					for (const key in prev) if (next[key] == null) setStyle(style, key, "");
				} else for (const prevStyle of prev.split(";")) {
					const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
					if (next[key] == null) setStyle(style, key, "");
				}
			}
			for (const key in next) {
				if (key === "display") hasControlledDisplay = true;
				const value = next[key];
				if (value != null) {
					if (!shouldPreserveTextareaResizeStyle(el, key, !isString(prev) && prev ? prev[key] : void 0, value)) setStyle(style, key, value);
				} else setStyle(style, key, "");
			}
		} else if (isCssString) {
			if (prev !== next) {
				const cssVarText = style[CSS_VAR_TEXT];
				if (cssVarText) next += ";" + cssVarText;
				style.cssText = next;
				hasControlledDisplay = displayRE.test(next);
			}
		} else if (prev) el.removeAttribute("style");
		if (vShowOriginalDisplay in el) {
			el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
			if (el[vShowHidden]) style.display = "none";
		}
	}
	var importantRE = /\s*!important$/;
	function setStyle(style, name, val) {
		if (isArray(val)) val.forEach((v) => setStyle(style, name, v));
		else {
			if (val == null) val = "";
			if (name.startsWith("--")) {
				if (importantRE.test(val)) style.setProperty(name, val.replace(importantRE, ""), "important");
				else style.setProperty(name, val);
			} else {
				const prefixed = autoPrefix(style, name);
				if (importantRE.test(val)) style.setProperty(hyphenate(prefixed), val.replace(importantRE, ""), "important");
				else style[prefixed] = val;
			}
		}
	}
	var prefixes$1 = [
		"Webkit",
		"Moz",
		"ms"
	];
	var prefixCache = {};
	function autoPrefix(style, rawName) {
		const cached = prefixCache[rawName];
		if (cached) return cached;
		let name = camelize(rawName);
		if (name !== "filter" && name in style) return prefixCache[rawName] = name;
		name = capitalize(name);
		for (let i = 0; i < prefixes$1.length; i++) {
			const prefixed = prefixes$1[i] + name;
			if (prefixed in style) return prefixCache[rawName] = prefixed;
		}
		return rawName;
	}
	function shouldPreserveTextareaResizeStyle(el, key, prev, next) {
		return el.tagName === "TEXTAREA" && (key === "width" || key === "height") && isString(next) && prev === next;
	}
	var xlinkNS = "http://www.w3.org/1999/xlink";
	function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
		if (isSVG && key.startsWith("xlink:")) {
			if (value == null) el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
			else el.setAttributeNS(xlinkNS, key, value);
		} else if (value == null || isBoolean && !includeBooleanAttr(value)) el.removeAttribute(key);
		else el.setAttribute(key, isBoolean ? "" : isSymbol(value) ? String(value) : value);
	}
	function patchDOMProp(el, key, value, parentComponent, attrName) {
		if (key === "innerHTML" || key === "textContent") {
			if (value != null) el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
			return;
		}
		const tag = el.tagName;
		if (key === "value" && tag !== "PROGRESS" && !tag.includes("-")) {
			const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
			const newValue = value == null ? el.type === "checkbox" ? "on" : "" : String(value);
			if (oldValue !== newValue || !("_value" in el)) el.value = newValue;
			if (value == null) el.removeAttribute(key);
			el._value = value;
			return;
		}
		let needRemove = false;
		if (value === "" || value == null) {
			const type = typeof el[key];
			if (type === "boolean") value = includeBooleanAttr(value);
			else if (value == null && type === "string") {
				value = "";
				needRemove = true;
			} else if (type === "number") {
				value = 0;
				needRemove = true;
			}
		}
		try {
			el[key] = value;
		} catch (e) {}
		needRemove && el.removeAttribute(attrName || key);
	}
	function addEventListener(el, event, handler, options) {
		el.addEventListener(event, handler, options);
	}
	function removeEventListener(el, event, handler, options) {
		el.removeEventListener(event, handler, options);
	}
	var veiKey = Symbol("_vei");
	function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
		const invokers = el[veiKey] || (el[veiKey] = {});
		const existingInvoker = invokers[rawName];
		if (nextValue && existingInvoker) existingInvoker.value = nextValue;
		else {
			const [name, options] = parseName(rawName);
			if (nextValue) addEventListener(el, name, invokers[rawName] = createInvoker(nextValue, instance), options);
			else if (existingInvoker) {
				removeEventListener(el, name, existingInvoker, options);
				invokers[rawName] = void 0;
			}
		}
	}
	var optionsModifierRE = /(Once|Passive|Capture)$/;
	var optionsModifierEventRE = /^on:?(?:Once|Passive|Capture)$/;
	function parseName(name) {
		let options;
		let m;
		while ((m = name.match(optionsModifierRE)) && !optionsModifierEventRE.test(name)) {
			if (!options) options = {};
			name = name.slice(0, name.length - m[1].length);
			options[m[1].toLowerCase()] = true;
		}
		return [name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2)), options];
	}
	var cachedNow = 0;
	var p = Promise.resolve();
	var getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
	function createInvoker(initialValue, instance) {
		const invoker = (e) => {
			if (!e._vts) e._vts = Date.now();
			else if (e._vts <= invoker.attached) return;
			const value = invoker.value;
			if (isArray(value)) {
				const originalStop = e.stopImmediatePropagation;
				e.stopImmediatePropagation = () => {
					originalStop.call(e);
					e._stopped = true;
				};
				const handlers = value.slice();
				const args = [e];
				for (let i = 0; i < handlers.length; i++) {
					if (e._stopped) break;
					const handler = handlers[i];
					if (handler) callWithAsyncErrorHandling(handler, instance, 5, args);
				}
			} else callWithAsyncErrorHandling(value, instance, 5, [e]);
		};
		invoker.value = initialValue;
		invoker.attached = getNow();
		return invoker;
	}
	var isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
	var patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
		const isSVG = namespace === "svg";
		if (key === "class") patchClass(el, nextValue, isSVG);
		else if (key === "style") patchStyle(el, prevValue, nextValue);
		else if (isOn(key)) {
			if (!isModelListener(key)) patchEvent(el, key, prevValue, nextValue, parentComponent);
		} else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
			patchDOMProp(el, key, nextValue);
			if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
		} else if (el._isVueCE && (shouldSetAsPropForVueCE(el, key) || el._def.__asyncLoader && (/[A-Z]/.test(key) || !isString(nextValue)))) patchDOMProp(el, camelize(key), nextValue, parentComponent, key);
		else {
			if (key === "true-value") el._trueValue = nextValue;
			else if (key === "false-value") el._falseValue = nextValue;
			patchAttr(el, key, nextValue, isSVG);
		}
	};
	function shouldSetAsProp(el, key, value, isSVG) {
		if (isSVG) {
			if (key === "innerHTML" || key === "textContent") return true;
			if (key in el && isNativeOn(key) && isFunction(value)) return true;
			return false;
		}
		if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") return false;
		if (key === "sandbox" && el.tagName === "IFRAME") return false;
		if (key === "form") return false;
		if (key === "list" && el.tagName === "INPUT") return false;
		if (key === "type" && el.tagName === "TEXTAREA") return false;
		if (key === "width" || key === "height") {
			const tag = el.tagName;
			if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") return false;
		}
		if (isNativeOn(key) && isString(value)) return false;
		return key in el;
	}
	function shouldSetAsPropForVueCE(el, key) {
		const props = el._def.props;
		if (!props) return false;
		const camelKey = camelize(key);
		return Array.isArray(props) ? props.some((prop) => camelize(prop) === camelKey) : Object.keys(props).some((prop) => camelize(prop) === camelKey);
	}
	var getModelAssigner = (vnode) => {
		const fn = vnode.props["onUpdate:modelValue"] || false;
		return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
	};
	var assignKey = Symbol("_assign");
	var vModelCheckbox = {
		deep: true,
		created(el, _, vnode) {
			el[assignKey] = getModelAssigner(vnode);
			addEventListener(el, "change", () => {
				const modelValue = el._modelValue;
				const elementValue = getValue(el);
				const checked = el.checked;
				const assign = el[assignKey];
				if (isArray(modelValue)) {
					const index = looseIndexOf(modelValue, elementValue);
					const found = index !== -1;
					if (checked && !found) assign(modelValue.concat(elementValue));
					else if (!checked && found) {
						const filtered = [...modelValue];
						filtered.splice(index, 1);
						assign(filtered);
					}
				} else if (isSet(modelValue)) {
					const cloned = new Set(modelValue);
					if (checked) cloned.add(elementValue);
					else cloned.delete(elementValue);
					assign(cloned);
				} else assign(getCheckboxValue(el, checked));
			});
		},
		mounted: setChecked,
		beforeUpdate(el, binding, vnode) {
			el[assignKey] = getModelAssigner(vnode);
			setChecked(el, binding, vnode);
		}
	};
	function setChecked(el, { value, oldValue }, vnode) {
		el._modelValue = value;
		let checked;
		if (isArray(value)) checked = looseIndexOf(value, vnode.props.value) > -1;
		else if (isSet(value)) checked = value.has(vnode.props.value);
		else {
			if (value === oldValue) return;
			checked = looseEqual(value, getCheckboxValue(el, true));
		}
		if (el.checked !== checked) el.checked = checked;
	}
	var vModelRadio = {
		created(el, { value }, vnode) {
			el.checked = looseEqual(value, vnode.props.value);
			el[assignKey] = getModelAssigner(vnode);
			addEventListener(el, "change", () => {
				el[assignKey](getValue(el));
			});
		},
		beforeUpdate(el, { value, oldValue }, vnode) {
			el[assignKey] = getModelAssigner(vnode);
			if (value !== oldValue) el.checked = looseEqual(value, vnode.props.value);
		}
	};
	function getValue(el) {
		return "_value" in el ? el._value : el.value;
	}
	function getCheckboxValue(el, checked) {
		const key = checked ? "_trueValue" : "_falseValue";
		return key in el ? el[key] : checked;
	}
	var rendererOptions = extend({ patchProp }, nodeOps);
	var renderer;
	function ensureRenderer() {
		return renderer || (renderer = createRenderer(rendererOptions));
	}
	var createApp = ((...args) => {
		const app = ensureRenderer().createApp(...args);
		const { mount } = app;
		app.mount = (containerOrSelector) => {
			const container = normalizeContainer(containerOrSelector);
			if (!container) return;
			const component = app._component;
			if (!isFunction(component) && !component.render && !component.template) component.template = container.innerHTML;
			if (container.nodeType === 1) container.textContent = "";
			const proxy = mount(container, false, resolveRootNamespace(container));
			if (container instanceof Element) {
				container.removeAttribute("v-cloak");
				container.setAttribute("data-v-app", "");
			}
			return proxy;
		};
		return app;
	});
	function resolveRootNamespace(container) {
		if (container instanceof SVGElement) return "svg";
		if (typeof MathMLElement === "function" && container instanceof MathMLElement) return "mathml";
	}
	function normalizeContainer(container) {
		if (isString(container)) return document.querySelector(container);
		return container;
	}
	var _GM = (() => typeof GM != "undefined" ? GM : void 0)();
	var hasGM = typeof _GM?.getValue === "function";
	var canList = hasGM && typeof _GM.listValues === "function";
	var canDelete = hasGM && typeof _GM.deleteValue === "function";
	async function degrade(operation, run, fallback) {
		try {
			return await run();
		} catch (error) {
			console.warn(`[EhHyperlink] storage ${operation} failed`, error);
			return fallback;
		}
	}
	async function storageGet(key) {
		return degrade("read", async () => {
			if (hasGM) return await _GM.getValue(key, "") || null;
			return localStorage.getItem(key);
		}, null);
	}
	async function storageSet(key, value) {
		await degrade("write", async () => {
			if (hasGM) {
				await _GM.setValue(key, value);
				return;
			}
			localStorage.setItem(key, value);
		}, void 0);
	}
	async function storageKeys() {
		return degrade("list", async () => {
			if (canList) return await _GM.listValues();
			return Object.keys(localStorage);
		}, []);
	}
	async function storageRemove(key) {
		await degrade("delete", async () => {
			if (canDelete) {
				await _GM.deleteValue(key);
				return;
			}
			localStorage.removeItem(key);
		}, void 0);
	}
	var STORAGE_KEY = "ehl_settings_v1";
	var TITLE_LANGUAGES = ["romanized", "japanese"];
	var VIEWS = ["list", "covers"];
	var settings = reactive({
		titleLanguage: "romanized",
		showSubtitle: true,
		view: "list"
	});
	function isTitleLanguage(value) {
		return typeof value === "string" && TITLE_LANGUAGES.includes(value);
	}
	function isView(value) {
		return typeof value === "string" && VIEWS.includes(value);
	}
	async function loadSettings() {
		const raw = await storageGet(STORAGE_KEY);
		if (raw) try {
			const parsed = JSON.parse(raw);
			if (typeof parsed === "object" && parsed !== null) {
				if ("titleLanguage" in parsed && isTitleLanguage(parsed.titleLanguage)) settings.titleLanguage = parsed.titleLanguage;
				if ("showSubtitle" in parsed && typeof parsed.showSubtitle === "boolean") settings.showSubtitle = parsed.showSubtitle;
				if ("view" in parsed && isView(parsed.view)) settings.view = parsed.view;
			}
		} catch {}
		watch(settings, (current) => void storageSet(STORAGE_KEY, JSON.stringify(current)), { deep: true });
	}
	function displayTitle(gallery) {
		if (settings.titleLanguage === "japanese") return gallery.titleJpn || gallery.title;
		return gallery.title || gallery.titleJpn;
	}
	function otherTitle(gallery) {
		const main = displayTitle(gallery);
		const other = main === gallery.title ? gallery.titleJpn : gallery.title;
		return other === main ? "" : other;
	}
	function subtitle(gallery) {
		return settings.showSubtitle ? otherTitle(gallery) : "";
	}
	var locale = (() => {
		const language = navigator.language.toLowerCase();
		if (language.startsWith("zh")) return "zh";
		if (language.startsWith("ja")) return "ja";
		return "en";
	})();
	var MESSAGES = {
		searching: {
			en: "Searching…",
			zh: "搜尋中…",
			ja: "検索中…"
		},
		notFound: {
			en: "No results",
			zh: "未找到",
			ja: "見つかりません"
		},
		noTitle: {
			en: "No searchable title",
			zh: "沒有可搜尋的標題",
			ja: "検索できるタイトルなし"
		},
		failed: {
			en: "Search failed",
			zh: "搜尋失敗",
			ja: "検索失敗"
		},
		partial: {
			en: "Some requests failed; results are incomplete",
			zh: "部分請求失敗，結果不完整",
			ja: "一部のリクエストに失敗しました。結果は不完全です"
		},
		networkFailed: {
			en: "Network error",
			zh: "網路錯誤",
			ja: "ネットワークエラー"
		},
		requestTimedOut: {
			en: "Request timed out",
			zh: "請求逾時",
			ja: "リクエストがタイムアウトしました"
		},
		httpFailed: {
			en: "HTTP error",
			zh: "HTTP 錯誤",
			ja: "HTTP エラー"
		},
		invalidResponse: {
			en: "Invalid response",
			zh: "回應格式異常",
			ja: "応答の形式が不正です"
		},
		requestAttempts: {
			en: "Attempts",
			zh: "嘗試次數",
			ja: "試行回数"
		},
		missingMetadata: {
			en: "Missing metadata",
			zh: "缺少 metadata",
			ja: "メタデータ未取得"
		},
		container: {
			en: "Source",
			zh: "原刊",
			ja: "掲載元"
		},
		containerTitle: {
			en: "Magazine or tankoubon this chapter came from",
			zh: "這一章來自的雜誌或單行本",
			ja: "この話の掲載誌・単行本"
		},
		editionsTitle: {
			en: "This book in other languages and releases",
			zh: "同一本的其他語言／版本",
			ja: "同じ本の他言語版・別版"
		},
		series: {
			en: "Series",
			zh: "系列",
			ja: "シリーズ"
		},
		seriesTitle: {
			en: "Other books of the same series",
			zh: "同系列的其他集",
			ja: "同シリーズの他の巻・話"
		},
		related: {
			en: "Related",
			zh: "相關作品",
			ja: "関連作品"
		},
		relatedTitle: {
			en: "Same creator and wording, relation unproven",
			zh: "同作者、用詞相同，關係未經確認",
			ja: "同じ作者・同じ語句だが関係は未確認"
		},
		cosplayerRelatedTitle: {
			en: "Other works by the same cosplayer",
			zh: "同一位 cosplayer 的其他作品",
			ja: "同じコスプレイヤーの他の作品"
		},
		directRelatedTitle: {
			en: "Results matching the search, without title similarity filtering",
			zh: "符合搜尋條件的結果，不以標題相似度篩選",
			ja: "検索条件に一致した結果、タイトル類似度による絞り込みなし"
		},
		chapters: {
			en: "Chapters",
			zh: "收錄作品",
			ja: "収録作品"
		},
		chaptersTitle: {
			en: "Chapters cut from this magazine or tankoubon",
			zh: "從這本雜誌或單行本切出來的作品",
			ja: "この掲載誌・単行本から切り出された作品"
		},
		requestsTitle: {
			en: "URLs this script requested for this gallery",
			zh: "這個腳本為這本畫廊發出的請求",
			ja: "このギャラリーのために送ったリクエスト"
		},
		searchRequests: {
			en: "Search pages",
			zh: "搜尋頁",
			ja: "検索ページ"
		},
		searchHits: {
			en: "Hits",
			zh: "Hits",
			ja: "Hits"
		},
		searchHitsTitle: {
			en: "Galleries returned on this search page, before filtering",
			zh: "此搜尋頁回傳的圖庫數，篩選前",
			ja: "この検索ページで取得したギャラリー数（絞り込み前）"
		},
		metadataRequests: {
			en: "Metadata API",
			zh: "Metadata API",
			ja: "メタデータ API"
		},
		galleriesUnit: {
			en: "galleries",
			zh: "本",
			ja: "件"
		},
		noRequests: {
			en: "Nothing was requested",
			zh: "一次請求都沒有發出",
			ja: "リクエストは送っていません"
		},
		nothingSent: {
			en: "Nothing left the browser; every response came from the cache",
			zh: "沒有發出任何請求，全部來自快取",
			ja: "リクエストは送らず、すべてキャッシュから"
		},
		fromCache: {
			en: "from cache",
			zh: "來自快取",
			ja: "キャッシュから"
		},
		dataAsOf: {
			en: "As of",
			zh: "資料時間",
			ja: "データ時点"
		},
		refetch: {
			en: "Refetch",
			zh: "重新抓取",
			ja: "再取得"
		},
		refetchTitle: {
			en: "Discard the cached responses for this gallery and ask the host again",
			zh: "丟掉這本的快取，重新向站方請求",
			ja: "このギャラリーのキャッシュを破棄して再取得"
		},
		pages: {
			en: "p",
			zh: "頁",
			ja: "ページ"
		},
		rewrite: {
			en: "rewrite",
			zh: "重寫",
			ja: "リライト"
		},
		roughTranslation: {
			en: "rough translation",
			zh: "粗譯",
			ja: "粗訳"
		},
		extraneousAds: {
			en: "extraneous ads",
			zh: "外部廣告",
			ja: "広告混入"
		},
		settings: {
			en: "Settings",
			zh: "設定",
			ja: "設定"
		},
		settingTitleLanguage: {
			en: "Titles",
			zh: "標題顯示",
			ja: "タイトル表示"
		},
		titleRomanized: {
			en: "Romanized",
			zh: "英文／羅馬字",
			ja: "ローマ字"
		},
		titleJapanese: {
			en: "Japanese",
			zh: "日文",
			ja: "日本語"
		},
		settingSubtitle: {
			en: "Show subtitle",
			zh: "顯示副標題",
			ja: "副題を表示"
		},
		settingView: {
			en: "View",
			zh: "檢視",
			ja: "表示"
		},
		viewList: {
			en: "List",
			zh: "清單",
			ja: "リスト"
		},
		viewCovers: {
			en: "Covers",
			zh: "封面",
			ja: "表紙"
		},
		pagingPerksTitle: {
			en: "Paging Enlargement",
			zh: "Paging Enlargement",
			ja: "Paging Enlargement"
		},
		pagingPerksDescription: {
			en: "Purchase this perk to reduce the number of requests.",
			zh: "可購買此 perk 以減少請求次數。",
			ja: "この特典を購入すると、リクエスト回数を減らせます。"
		},
		pagingPerkI: {
			en: "I: 50/page · 500 Hath",
			zh: "I：50 筆／頁 · 500 Hath",
			ja: "I：50件/ページ · 500 Hath"
		},
		pagingPerkII: {
			en: "II: 100/page · +1,000 Hath",
			zh: "II：100 筆／頁 · +1,000 Hath",
			ja: "II：100件/ページ · +1,000 Hath"
		},
		hathPerks: {
			en: "Hath Perks",
			zh: "Hath Perks",
			ja: "Hath Perks"
		},
		pagingPerksDetails: {
			en: "Details",
			zh: "說明",
			ja: "詳細"
		}
	};
	function t(key) {
		return MESSAGES[key][locale];
	}
	var LANGUAGE_PRIORITY = {
		zh: [
			"chinese",
			"japanese",
			"english"
		],
		ja: [
			"japanese",
			"english",
			"chinese"
		],
		en: [
			"english",
			"japanese",
			"chinese"
		]
	};
	var _hoisted_1$5 = ["title"];
	var STAR_COLOURS = "RRBYY";
	var StarRating_default = defineComponent({
		__name: "StarRating",
		props: { rating: {} },
		setup(__props) {
			const props = __props;
			const colour = computed(() => `ehl-stars--${STAR_COLOURS[Math.ceil(props.rating) - 1].toLowerCase()}`);
			return (_ctx, _cache) => {
				return openBlock(), createElementBlock("span", {
					class: normalizeClass(["ehl-stars", colour.value]),
					title: `${__props.rating.toFixed(2)} / 5`
				}, [createBaseVNode("span", {
					class: "ehl-stars-on",
					style: normalizeStyle({ width: `${__props.rating / 5 * 100}%` })
				}, "★★★★★", 4), _cache[0] || (_cache[0] = createTextVNode(" ★★★★★ ", -1))], 10, _hoisted_1$5);
			};
		}
	});
	var _hoisted_1$4 = { class: "ehl-tags" };
	var _hoisted_2$3 = { class: "ehl-tags__label" };
	var _hoisted_3$3 = { class: "ehl-tags__cells" };
	var TagList_default = defineComponent({
		__name: "TagList",
		props: { tags: {} },
		setup(__props) {
			const props = __props;
			const groups = computed(() => {
				const byNamespace = new Map();
				for (const tag of props.tags) {
					const colon = tag.indexOf(":");
					const namespace = colon === -1 ? "" : tag.slice(0, colon);
					const value = colon === -1 ? tag : tag.slice(colon + 1);
					const bucket = byNamespace.get(namespace);
					if (bucket) bucket.push(value);
					else byNamespace.set(namespace, [value]);
				}
				return [...byNamespace].map(([namespace, values]) => ({
					namespace,
					values
				}));
			});
			return (_ctx, _cache) => {
				return openBlock(), createElementBlock("div", _hoisted_1$4, [(openBlock(true), createElementBlock(Fragment, null, renderList(groups.value, (group) => {
					return openBlock(), createElementBlock("div", {
						key: group.namespace,
						class: "ehl-tags__row"
					}, [createBaseVNode("span", _hoisted_2$3, toDisplayString(group.namespace) + ":", 1), createBaseVNode("span", _hoisted_3$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(group.values, (value) => {
						return openBlock(), createElementBlock("span", {
							key: value,
							class: "ehl-tags__chip"
						}, toDisplayString(value), 1);
					}), 128))])]);
				}), 128))]);
			};
		}
	});
	var _hoisted_1$3 = [
		"data-language",
		"title",
		"aria-label"
	];
	var LanguageBadge_default = defineComponent({
		__name: "LanguageBadge",
		props: { language: {} },
		setup(__props) {
			return (_ctx, _cache) => {
				return openBlock(), createElementBlock("span", {
					class: "ehl-language",
					"data-language": __props.language.value,
					title: __props.language.name[unref(locale)],
					"aria-label": __props.language.name[unref(locale)]
				}, toDisplayString(__props.language.code), 9, _hoisted_1$3);
			};
		}
	});
	var _hoisted_1$2 = { class: "ehl-head" };
	var _hoisted_2$2 = { class: "ehl-count" };
	var _hoisted_3$2 = {
		key: 0,
		class: "ehl-covers"
	};
	var _hoisted_4$2 = ["href", "onMouseenter"];
	var _hoisted_5$2 = { class: "ehl-cover-art" };
	var _hoisted_6$2 = ["src"];
	var _hoisted_7$2 = { class: "ehl-facts" };
	var _hoisted_8$2 = {
		key: 1,
		class: "ehl-meta"
	};
	var _hoisted_9$2 = {
		key: 2,
		class: "ehl-meta"
	};
	var _hoisted_10$2 = { key: 1 };
	var _hoisted_11$2 = ["onMouseenter"];
	var _hoisted_12$2 = ["href"];
	var _hoisted_13$2 = { class: "ehl-thumb" };
	var _hoisted_14$1 = ["src"];
	var _hoisted_15$1 = { class: "ehl-rowtext" };
	var _hoisted_16$1 = { class: "ehl-title" };
	var _hoisted_17$1 = {
		key: 0,
		class: "ehl-subtitle"
	};
	var _hoisted_18$1 = { class: "ehl-facts" };
	var _hoisted_19$1 = {
		key: 1,
		class: "ehl-meta"
	};
	var _hoisted_20$1 = {
		key: 2,
		class: "ehl-meta"
	};
	var _hoisted_21$1 = ["src"];
	var _hoisted_22$1 = { class: "ehl-preview-text" };
	var _hoisted_23$1 = { class: "ehl-preview-title" };
	var _hoisted_24$1 = {
		key: 0,
		class: "ehl-subtitle"
	};
	var _hoisted_25$1 = { class: "ehl-facts" };
	var BOOK_COLOURS = 4;
	var PREVIEW_MAX_WIDTH = 340;
	var PREVIEW_MIN_WIDTH = 160;
	var COVER_HEIGHT_OVER_WIDTH = 7 / 5;
	var GAP = 8;
	var GroupList_default = defineComponent({
		__name: "GroupList",
		props: { groups: {} },
		setup(__props) {
			const FLAG_LABELS = {
				rewrite: "rewrite",
				"rough translation": "roughTranslation",
				"extraneous ads": "extraneousAds"
			};
			function percent(score) {
				return `${Math.round(score * 100)}%`;
			}
			function framed(book) {
				return book.releases.length > 1;
			}
			const listEl = ref(null);
			const preview = ref(null);
			const previewStyle = ref({});
			function showPreview(release) {
				preview.value = release;
				const box = listEl.value?.getBoundingClientRect();
				if (!release || !box) return;
				const height = window.innerHeight - 16;
				const beside = box.right + GAP;
				const room = window.innerWidth - beside - GAP;
				const width = Math.min(PREVIEW_MAX_WIDTH, Math.round(height / COVER_HEIGHT_OVER_WIDTH), Math.max(room, PREVIEW_MIN_WIDTH));
				previewStyle.value = {
					left: `${Math.round(room >= width ? beside : Math.max(GAP, window.innerWidth - width - GAP))}px`,
					top: `${GAP}px`,
					width: `${width}px`,
					maxHeight: `${Math.round(height)}px`
				};
			}
			return (_ctx, _cache) => {
				return openBlock(), createElementBlock("div", {
					ref_key: "listEl",
					ref: listEl,
					class: "ehl-list"
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.groups, (group) => {
					return openBlock(), createElementBlock("section", {
						key: group.language.value,
						class: "ehl-section"
					}, [createBaseVNode("h4", _hoisted_1$2, [
						createVNode(LanguageBadge_default, { language: group.language }, null, 8, ["language"]),
						createTextVNode(" " + toDisplayString(group.language.name[unref(locale)]) + " ", 1),
						createBaseVNode("span", _hoisted_2$2, toDisplayString(group.books.length), 1)
					]), unref(settings).view === "covers" ? (openBlock(), createElementBlock("div", _hoisted_3$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(group.books.flatMap((book) => book.releases), (release) => {
						return openBlock(), createElementBlock("a", {
							key: release.hit.gid,
							class: "ehl-cover",
							href: release.hit.href,
							target: "_blank",
							rel: "noopener",
							onMouseenter: ($event) => showPreview(release),
							onMouseleave: _cache[0] || (_cache[0] = ($event) => showPreview(null))
						}, [createBaseVNode("span", _hoisted_5$2, [release.hit.thumb ? (openBlock(), createElementBlock("img", {
							key: 0,
							src: release.hit.thumb,
							loading: "lazy",
							decoding: "async",
							fetchpriority: "low",
							referrerpolicy: "no-referrer",
							alt: ""
						}, null, 8, _hoisted_6$2)) : createCommentVNode("", true)]), createBaseVNode("span", _hoisted_7$2, [
							release.hit.rating !== null ? (openBlock(), createBlock(StarRating_default, {
								key: 0,
								rating: release.hit.rating
							}, null, 8, ["rating"])) : createCommentVNode("", true),
							release.score !== null ? (openBlock(), createElementBlock("span", _hoisted_8$2, toDisplayString(percent(release.score)), 1)) : createCommentVNode("", true),
							release.hit.pages !== null ? (openBlock(), createElementBlock("span", _hoisted_9$2, toDisplayString(release.hit.pages) + toDisplayString(unref(t)("pages")), 1)) : createCommentVNode("", true),
							(openBlock(true), createElementBlock(Fragment, null, renderList(release.flags, (flag) => {
								return openBlock(), createElementBlock("span", {
									key: flag,
									class: "ehl-flag"
								}, toDisplayString(unref(t)(FLAG_LABELS[flag])), 1);
							}), 128))
						])], 40, _hoisted_4$2);
					}), 128))])) : (openBlock(), createElementBlock("ul", _hoisted_10$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(group.books, (book, index) => {
						return openBlock(), createElementBlock("li", {
							key: book.releases[0].hit.gid,
							class: normalizeClass(framed(book) ? `ehl-book ehl-book--${index % BOOK_COLOURS}` : "ehl-books")
						}, [createBaseVNode("ul", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(book.releases, (release) => {
							return openBlock(), createElementBlock("li", {
								key: release.hit.gid,
								class: "ehl-row",
								onMouseenter: ($event) => showPreview(release),
								onMouseleave: _cache[1] || (_cache[1] = ($event) => showPreview(null))
							}, [createBaseVNode("a", {
								class: "ehl-rowlink",
								href: release.hit.href,
								target: "_blank",
								rel: "noopener"
							}, [createBaseVNode("span", _hoisted_13$2, [release.hit.thumb ? (openBlock(), createElementBlock("img", {
								key: 0,
								src: release.hit.thumb,
								loading: "lazy",
								decoding: "async",
								fetchpriority: "low",
								referrerpolicy: "no-referrer",
								alt: ""
							}, null, 8, _hoisted_14$1)) : createCommentVNode("", true)]), createBaseVNode("span", _hoisted_15$1, [createBaseVNode("span", _hoisted_16$1, [createTextVNode(toDisplayString(unref(displayTitle)(release.hit)) + " ", 1), unref(subtitle)(release.hit) ? (openBlock(), createElementBlock("span", _hoisted_17$1, toDisplayString(unref(subtitle)(release.hit)), 1)) : createCommentVNode("", true)]), createBaseVNode("span", _hoisted_18$1, [
								release.hit.rating !== null ? (openBlock(), createBlock(StarRating_default, {
									key: 0,
									rating: release.hit.rating
								}, null, 8, ["rating"])) : createCommentVNode("", true),
								release.score !== null ? (openBlock(), createElementBlock("span", _hoisted_19$1, toDisplayString(percent(release.score)), 1)) : createCommentVNode("", true),
								release.hit.pages !== null ? (openBlock(), createElementBlock("span", _hoisted_20$1, toDisplayString(release.hit.pages) + toDisplayString(unref(t)("pages")), 1)) : createCommentVNode("", true),
								(openBlock(true), createElementBlock(Fragment, null, renderList(release.flags, (flag) => {
									return openBlock(), createElementBlock("span", {
										key: flag,
										class: "ehl-flag"
									}, toDisplayString(unref(t)(FLAG_LABELS[flag])), 1);
								}), 128))
							])])], 8, _hoisted_12$2)], 40, _hoisted_11$2);
						}), 128))])], 2);
					}), 128))]))]);
				}), 128)), preview.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "ehl-preview",
					style: normalizeStyle(previewStyle.value)
				}, [preview.value.hit.thumb ? (openBlock(), createElementBlock("img", {
					key: 0,
					src: preview.value.hit.thumb,
					alt: "",
					referrerpolicy: "no-referrer"
				}, null, 8, _hoisted_21$1)) : createCommentVNode("", true), createBaseVNode("div", _hoisted_22$1, [
					createBaseVNode("span", _hoisted_23$1, toDisplayString(unref(displayTitle)(preview.value.hit)), 1),
					unref(otherTitle)(preview.value.hit) ? (openBlock(), createElementBlock("span", _hoisted_24$1, toDisplayString(unref(otherTitle)(preview.value.hit)), 1)) : createCommentVNode("", true),
					createBaseVNode("span", _hoisted_25$1, [preview.value.hit.rating !== null ? (openBlock(), createBlock(StarRating_default, {
						key: 0,
						rating: preview.value.hit.rating
					}, null, 8, ["rating"])) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(preview.value.flags, (flag) => {
						return openBlock(), createElementBlock("span", {
							key: flag,
							class: "ehl-flag"
						}, toDisplayString(unref(t)(FLAG_LABELS[flag])), 1);
					}), 128))]),
					preview.value.hit.tags.length > 0 ? (openBlock(), createBlock(TagList_default, {
						key: 1,
						tags: preview.value.hit.tags
					}, null, 8, ["tags"])) : createCommentVNode("", true)
				])], 4)) : createCommentVNode("", true)], 512);
			};
		}
	});
	var _hoisted_1$1 = {
		class: "ehl-settings",
		translate: "no"
	};
	var _hoisted_2$1 = { class: "ehl-settings__row" };
	var _hoisted_3$1 = { class: "ehl-settings__label" };
	var _hoisted_4$1 = ["value"];
	var _hoisted_5$1 = { class: "ehl-settings__row" };
	var _hoisted_6$1 = { class: "ehl-settings__label" };
	var _hoisted_7$1 = ["onUpdate:modelValue", "value"];
	var _hoisted_8$1 = { class: "ehl-settings__row ehl-settings__option" };
	var _hoisted_9$1 = { class: "ehl-settings__perks" };
	var _hoisted_10$1 = { class: "ehl-settings__label" };
	var _hoisted_11$1 = { class: "ehl-settings__row" };
	var _hoisted_12$1 = {
		href: "https://e-hentai.org/hathperks.php",
		target: "_blank",
		rel: "noopener"
	};
	var _hoisted_13$1 = {
		href: "https://ehwiki.org/wiki/Hath_Perks",
		target: "_blank",
		rel: "noopener"
	};
	var SettingsPopup_default = defineComponent({
		__name: "SettingsPopup",
		setup(__props) {
			const LABEL_KEY = {
				romanized: "titleRomanized",
				japanese: "titleJapanese"
			};
			const VIEW_KEY = {
				list: "viewList",
				covers: "viewCovers"
			};
			return (_ctx, _cache) => {
				return openBlock(), createElementBlock("div", _hoisted_1$1, [
					createBaseVNode("div", _hoisted_2$1, [createBaseVNode("span", _hoisted_3$1, toDisplayString(unref(t)("settingTitleLanguage")), 1), (openBlock(true), createElementBlock(Fragment, null, renderList(unref(TITLE_LANGUAGES), (language) => {
						return openBlock(), createElementBlock("label", {
							key: language,
							class: "ehl-settings__option"
						}, [withDirectives(createBaseVNode("input", {
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => unref(settings).titleLanguage = $event),
							type: "radio",
							name: "ehl-title-language",
							value: language
						}, null, 8, _hoisted_4$1), [[vModelRadio, unref(settings).titleLanguage]]), createTextVNode(" " + toDisplayString(unref(t)(LABEL_KEY[language])), 1)]);
					}), 128))]),
					createBaseVNode("div", _hoisted_5$1, [createBaseVNode("span", _hoisted_6$1, toDisplayString(unref(t)("settingView")), 1), (openBlock(true), createElementBlock(Fragment, null, renderList(unref(VIEWS), (view) => {
						return openBlock(), createElementBlock("label", {
							key: view,
							class: "ehl-settings__option"
						}, [withDirectives(createBaseVNode("input", {
							"onUpdate:modelValue": ($event) => unref(settings).view = $event,
							type: "radio",
							name: "ehl-view",
							value: view
						}, null, 8, _hoisted_7$1), [[vModelRadio, unref(settings).view]]), createTextVNode(" " + toDisplayString(unref(t)(VIEW_KEY[view])), 1)]);
					}), 128))]),
					createBaseVNode("label", _hoisted_8$1, [withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => unref(settings).showSubtitle = $event),
						type: "checkbox"
					}, null, 512), [[vModelCheckbox, unref(settings).showSubtitle]]), createTextVNode(" " + toDisplayString(unref(t)("settingSubtitle")), 1)]),
					createBaseVNode("section", _hoisted_9$1, [
						createBaseVNode("p", _hoisted_10$1, toDisplayString(unref(t)("pagingPerksTitle")), 1),
						createBaseVNode("p", null, toDisplayString(unref(t)("pagingPerksDescription")), 1),
						createBaseVNode("p", null, toDisplayString(unref(t)("pagingPerkI")), 1),
						createBaseVNode("p", null, toDisplayString(unref(t)("pagingPerkII")), 1),
						createBaseVNode("div", _hoisted_11$1, [createBaseVNode("a", _hoisted_12$1, toDisplayString(unref(t)("hathPerks")), 1), createBaseVNode("a", _hoisted_13$1, toDisplayString(unref(t)("pagingPerksDetails")), 1)])
					])
				]);
			};
		}
	});
	var defaultAttributes = {
		xmlns: "http://www.w3.org/2000/svg",
		width: 24,
		height: 24,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": 2,
		"stroke-linecap": "round",
		"stroke-linejoin": "round"
	};
	var mergeClasses = (...classes) => classes.filter((className, index, array) => {
		return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
	}).join(" ").trim();
	function isDefined(value) {
		return value !== null && value !== void 0;
	}
	function buildLucideIconNode(icon, params = {}) {
		const attributeNames = params.attributeNames ?? {};
		const getAttributeName = (attributeName) => attributeNames[attributeName] ?? attributeName;
		const viewBoxWidth = icon.size ?? icon.width ?? defaultAttributes["width"];
		const viewBoxHeight = icon.size ?? icon.height ?? defaultAttributes["height"];
		const aliasClassNames = icon.aliases?.filter((alias) => typeof alias === "string" && alias.trim() !== "").map((alias) => `lucide-${alias}`) ?? [];
		const iconClassNames = [...icon.name ? [`lucide-${icon.name}`] : [], ...aliasClassNames];
		const classNamesFromClassName = params.className?.split(" ").filter(Boolean) ?? [];
		const className = params.includeDefaultClasses === false ? mergeClasses(...classNamesFromClassName) : mergeClasses("lucide", ...iconClassNames, ...classNamesFromClassName);
		const calculatedStrokeWidth = params.absoluteStrokeWidth ? Number(params.strokeWidth ?? defaultAttributes["stroke-width"]) * Number(icon.size ?? icon.width ?? defaultAttributes["width"]) / Number(params.size ?? params.width ?? defaultAttributes["width"]) : params.strokeWidth ?? defaultAttributes["stroke-width"];
		return [
			"svg",
			{
				...Object.entries(defaultAttributes).reduce((attrs, [attrName, value]) => {
					attrs[getAttributeName(attrName)] = value;
					return attrs;
				}, {}),
				..."color" in params && params.color && { [getAttributeName("stroke")]: params.color },
				..."size" in params && isDefined(params.size) && {
					[getAttributeName("width")]: params.size,
					[getAttributeName("height")]: params.size
				},
				..."width" in params && isDefined(params.width) && { [getAttributeName("width")]: params.width },
				..."height" in params && isDefined(params.height) && { [getAttributeName("height")]: params.height },
				[getAttributeName("stroke-width")]: calculatedStrokeWidth,
				...className && { [getAttributeName("class")]: className },
				[getAttributeName("viewBox")]: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
				...params.hasA11yProp === false ? { [getAttributeName("aria-hidden")]: "true" } : {},
				..."attributes" in params && params.attributes
			},
			icon.node.map((child) => {
				const [name, attrs, children] = child;
				const nextAttrs = params.nonScalingStroke ? {
					[getAttributeName("vector-effect")]: "non-scaling-stroke",
					...attrs
				} : attrs;
				return children ? [
					name,
					nextAttrs,
					children
				] : [name, nextAttrs];
			})
		];
	}
	var hasA11yProp = (props) => {
		for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
		return false;
	};
	var isEmptyString = (value) => value === "";
	var toKebabCase = (string) => string?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
	var LUCIDE_CONTEXT = Symbol("lucide-icons");
	function useLucideProps() {
		return inject(LUCIDE_CONTEXT, {});
	}
	var Icon = ({ name, iconNode, "icon-node": iconNodeKebabCase, icon = {
		name: toKebabCase(name),
		node: iconNode ?? iconNodeKebabCase,
		size: 24,
		aliases: []
	}, absoluteStrokeWidth, "absolute-stroke-width": absoluteStrokeWidthKebabCase, nonScalingStroke, "non-scaling-stroke": nonScalingStrokeKebabCase, strokeWidth, "stroke-width": strokeWidthKebabCase, size, width = size, height = size, color, ...props }, { slots }) => {
		const { size: contextSize, color: contextColor, strokeWidth: contextStrokeWidth = 2, absoluteStrokeWidth: contextAbsoluteStrokeWidth = false, nonScalingStroke: contextNonScalingStroke = false, class: contextClass = "" } = useLucideProps();
		const isAbsoluteStrokeWidth = isEmptyString(absoluteStrokeWidth) || isEmptyString(absoluteStrokeWidthKebabCase) || absoluteStrokeWidth === true || absoluteStrokeWidthKebabCase === true || contextAbsoluteStrokeWidth === true;
		const isNonScalingStroke = isEmptyString(nonScalingStroke) || isEmptyString(nonScalingStrokeKebabCase) || nonScalingStroke === true || nonScalingStrokeKebabCase === true || contextNonScalingStroke === true;
		delete props.class;
		const defaultSlot = slots.default?.();
		const [, svgAttributes, builtIconNode = []] = buildLucideIconNode(icon, {
			color: color ?? contextColor,
			width: width ?? size ?? contextSize,
			height: height ?? size ?? contextSize,
			strokeWidth: strokeWidth ?? strokeWidthKebabCase ?? contextStrokeWidth,
			absoluteStrokeWidth: isAbsoluteStrokeWidth,
			nonScalingStroke: isNonScalingStroke,
			className: contextClass,
			hasA11yProp: defaultSlot != null && defaultSlot.length > 0 || hasA11yProp(props),
			attributes: props
		});
		return h("svg", svgAttributes, [...builtIconNode.map((child) => h(...child)), ...defaultSlot ?? []]);
	};
	function createLucideIcon(iconDataOrName, iconNode = []) {
		const icon = typeof iconDataOrName === "string" ? {
			name: iconDataOrName,
			node: iconNode
		} : iconDataOrName;
		return (props, { slots }) => h(Icon, {
			...props,
			icon
		}, slots.default ? { default: slots.default } : void 0);
	}
	var Activity = createLucideIcon({
		name: "activity",
		size: 24,
		node: [["path", {
			d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
			key: "169zse"
		}]]
	});
	var CircleSlash2 = createLucideIcon({
		name: "circle-slash-2",
		size: 24,
		node: [["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}], ["path", {
			d: "M22 2 2 22",
			key: "y4kqgn"
		}]],
		aliases: ["circle-slashed"]
	});
	var RefreshCw = createLucideIcon({
		name: "refresh-cw",
		size: 24,
		node: [
			["path", {
				d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
				key: "v9h5vc"
			}],
			["path", {
				d: "M21 3v5h-5",
				key: "1q7to0"
			}],
			["path", {
				d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
				key: "3uifl3"
			}],
			["path", {
				d: "M8 16H3v5",
				key: "1cv678"
			}]
		]
	});
	var Settings = createLucideIcon({
		name: "settings",
		size: 24,
		node: [["path", {
			d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
			key: "1i5ecw"
		}], ["circle", {
			cx: "12",
			cy: "12",
			r: "3",
			key: "1v7zrd"
		}]]
	});
	var CATEGORY_BY_PATH = {
		doujinshi: "Doujinshi",
		manga: "Manga",
		artistcg: "Artist CG",
		gamecg: "Game CG",
		western: "Western",
		"non-h": "Non-H",
		imageset: "Image Set",
		cosplay: "Cosplay",
		asianporn: "Asian Porn",
		misc: "Misc"
	};
	var CATEGORY_BY_CLASS = {
		ct1: "Misc",
		ct2: "Doujinshi",
		ct3: "Manga",
		ct4: "Artist CG",
		ct5: "Game CG",
		ct6: "Image Set",
		ct7: "Cosplay",
		ct8: "Asian Porn",
		ct9: "Non-H",
		cta: "Western"
	};
	function fromOnclick(onclick) {
		const start = onclick.indexOf("document.location='");
		if (start === -1) return null;
		const rest = onclick.slice(start + 19);
		return CATEGORY_BY_PATH[(rest.slice(0, rest.indexOf("'")).split("/").filter(Boolean).pop() ?? "").toLowerCase()] ?? null;
	}
	function readCategory(element) {
		if (!element) return "";
		const byClick = fromOnclick(element.getAttribute("onclick") ?? "");
		if (byClick) return byClick;
		for (const name of element.classList) {
			const byClass = CATEGORY_BY_CLASS[name];
			if (byClass) return byClass;
		}
		return element.textContent?.trim() ?? "";
	}
	var NO_WRAP_RE = /^(?:\(.*\)|\\?.)$/;
	function wrap(s) {
		const v = s.toString();
		return NO_WRAP_RE.test(v) ? v : `(?:${v})`;
	}
	var GROUPED_AS_REPLACE_RE = /^(?:\(\?:(.+)\)|(.+))$/;
	var GROUPED_REPLACE_RE = /^(?:\(\?:(.+)\)([?+*]|\{[\d,]+\})?|(.+))$/;
	function createInput(s) {
		const groupedAsFn = (key) => createInput(`(?<${key}>${`${s}`.replace(GROUPED_AS_REPLACE_RE, "$1$2")})`);
		return {
			toString: () => s.toString(),
			and: Object.assign((...inputs) => createInput(`${s}${exactly(...inputs)}`), { referenceTo: (groupName) => createInput(`${s}\\k<${groupName}>`) }),
			or: (...inputs) => createInput(`(?:${s}|${inputs.map((v) => exactly(v)).join("|")})`),
			after: (...input) => createInput(`(?<=${exactly(...input)})${s}`),
			before: (...input) => createInput(`${s}(?=${exactly(...input)})`),
			notAfter: (...input) => createInput(`(?<!${exactly(...input)})${s}`),
			notBefore: (...input) => createInput(`${s}(?!${exactly(...input)})`),
			times: Object.assign((number) => createInput(`${wrap(s)}{${number}}`), {
				any: () => createInput(`${wrap(s)}*`),
				atLeast: (min) => createInput(`${wrap(s)}{${min},}`),
				atMost: (max) => createInput(`${wrap(s)}{0,${max}}`),
				between: (min, max) => createInput(`${wrap(s)}{${min},${max}}`)
			}),
			optionally: () => createInput(`${wrap(s)}?`),
			as: groupedAsFn,
			groupedAs: groupedAsFn,
			grouped: () => createInput(`${s}`.replace(GROUPED_REPLACE_RE, "($1$3)$2")),
			at: {
				lineStart: () => createInput(`^${s}`),
				lineEnd: () => createInput(`${s}$`)
			}
		};
	}
	var ESCAPE_REPLACE_RE = /[.*+?^${}()|[\]\\/]/g;
	function createCharInput(raw) {
		const input = createInput(`[${raw}]`);
		const from = (charFrom, charTo) => createCharInput(`${raw}${escapeCharInput(charFrom)}-${escapeCharInput(charTo)}`);
		const orChar = Object.assign((chars) => createCharInput(`${raw}${escapeCharInput(chars)}`), { from });
		return Object.assign(input, {
			orChar,
			from
		});
	}
	function escapeCharInput(raw) {
		return raw.replace(/[-\\^\]]/g, "\\$&");
	}
	var charIn = Object.assign((chars) => {
		return createCharInput(escapeCharInput(chars));
	}, createCharInput(""));
	Object.assign((chars) => {
		return createCharInput(`^${escapeCharInput(chars)}`);
	}, createCharInput("^"));
	function anyOf(...inputs) {
		return createInput(`(?:${inputs.map((a) => exactly(a)).join("|")})`);
	}
	createInput(".");
	createInput("\\b\\w+\\b");
	createInput("\\w");
	createInput("\\b");
	createInput("\\d");
	createInput("\\s");
	Object.assign(createInput("[a-zA-Z]"), {
		lowercase: createInput("[a-z]"),
		uppercase: createInput("[A-Z]")
	});
	createInput("\\t");
	createInput("\\n");
	createInput("\\r");
	createInput("\\W+"), createInput("\\W"), createInput("\\B"), createInput("\\D"), createInput("\\S"), Object.assign(createInput("[^a-zA-Z]"), {
		lowercase: createInput("[^a-z]"),
		uppercase: createInput("[^A-Z]")
	}), createInput("[^\\t]"), createInput("[^\\n]"), createInput("[^\\r]");
	function maybe(...inputs) {
		return createInput(`${wrap(exactly(...inputs))}?`);
	}
	function exactly(...inputs) {
		return createInput(inputs.map((input) => typeof input === "string" ? input.replace(ESCAPE_REPLACE_RE, "\\$&") : input).join(""));
	}
	function oneOrMore(...inputs) {
		return createInput(`${wrap(exactly(...inputs))}+`);
	}
	var createRegExp = (...inputs) => {
		const flags = inputs.length > 1 && (Array.isArray(inputs[inputs.length - 1]) || inputs[inputs.length - 1] instanceof Set) ? inputs.pop() : void 0;
		return new RegExp(exactly(...inputs).toString(), [...flags || ""].join(""));
	};
	function raw(source) {
		return exactly({ toString: () => source });
	}
	function unicode(category) {
		return raw(`\\p{${category}}`);
	}
	function notUnicode(category) {
		return raw(`\\P{${category}}`);
	}
	var letter = unicode("L");
	var digit = unicode("Nd");
	var whitespace = unicode("White_Space");
	var cjkLetter = raw("[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}ー]");
	var han = raw("[\\p{Script=Han}]");
	raw("[\\p{Script=Hiragana}\\p{Script=Katakana}ー]");
	var start = raw("^");
	var end = raw("$");
	var punctuation = raw("[\\p{P}\\p{S}]");
	var optionalSpace = whitespace.times.any();
	function standalone(input) {
		return input.notAfter(letter).notBefore(anyOf(letter, digit));
	}
	function compile(input, flags = []) {
		return createRegExp(input, [...flags, "u"]);
	}
	var whitespaceRun = compile(oneOrMore(whitespace), ["g"]);
	function galleryRef(hrefOrPath) {
		let pathname = hrefOrPath;
		if (hrefOrPath.includes("://")) try {
			pathname = new URL(hrefOrPath).pathname;
		} catch {
			return null;
		}
		const [, section, gid, token] = pathname.split("/");
		if (section !== "g" || !gid || !token) return null;
		if (![...gid].every((character) => character >= "0" && character <= "9")) return null;
		return {
			gid: Number(gid),
			token
		};
	}
	function pageCount(text) {
		const [count, unit, ...rest] = text.trim().split(whitespaceRun);
		if (rest.length > 0 || !count || unit !== "pages" && unit !== "page") return null;
		if (![...count].every((character) => character >= "0" && character <= "9")) return null;
		return Number(count);
	}
	function readSourceGallery(root = document, pathname = location.pathname) {
		const ref = galleryRef(pathname);
		const title = root.querySelector("#gn")?.textContent?.trim() ?? "";
		if (ref === null || !title) return null;
		return {
			gid: ref.gid,
			title,
			titleJpn: root.querySelector("#gj")?.textContent?.trim() ?? "",
			category: readCategory(root.querySelector("#gdc .cs, #gdc .cn")),
			tags: [...root.querySelectorAll("#taglist [id^=\"td_\"]")].map((element) => element.id.slice(3))
		};
	}
	var title_markers_default = {
		version: 1,
		description: "Bracket-content markers that carry no work identity. Values are compared after NFKC + casefold + whitespace collapse. kind=exact: whole segment equals value. kind=prefix_number: segment starts with value, then optional separators (space ☆ ★ ・ - / ,), then digits, then an optional st/nd/rd/th, then end or a separator. kind=suffix: segment ends with value. Language entries carry lang: the ehwiki language tag name they indicate.",
		sources: [
			"https://ehwiki.org/wiki/Renaming (Special Indicators, Language Indicators, Conventions tables; GFDL 1.2+)",
			"https://ehwiki.org/wiki/Languages (83 language tags)",
			"EhViewer GalleryInfo.kt S_LANG_PATTERNS (Apache-2.0) for R/J language pairs",
			"ShiguReader packages/name-parser (MIT) for convention stems",
			"URenko/e-hentai-db full-corpus bracket-content ranking, 2026-09-17 snapshot"
		],
		roles: {
			"event": "convention or release event, e.g. (C81)",
			"language": "language indicator, e.g. [English] [英訳]",
			"translator": "translation group or translator credit, matched by suffix only, e.g. [○○汉化组] [○○個人翻譯] [○○ Translations]",
			"release": "special indicator or medium marker, e.g. [Decensored] [DL版] [3D]",
			"platform": "website or distribution platform, e.g. [Pixiv] [Patreon]",
			"placeholder": "non-identity stand-in, e.g. [Anthology] [Various] [Artist]",
			"ai": "AI-generated marker, e.g. [AI Generated] [AI生成]"
		},
		entries: [
			{
				"value": "c",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comic market",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comiket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "コミックマーケット",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "コミケ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "エアコミケ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "air comiket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ac",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comic1",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comic1",
				"role": "event",
				"kind": "exact"
			},
			{
				"value": "reitaisai",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "例大祭",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "shuuki reitaisai",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "秋季例大祭",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "air reitaisai",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "エア例大祭",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "sunshine creation",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "sc",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "サンクリ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "sankuri",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comitia",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "コミティア",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "csp",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "spark",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "super",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "superkansai",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "super関西",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "harucc",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ff",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "fancy frontier",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ct",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comic treasure",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "こみトレ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ccosaka",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "cc大阪",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comic city",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "cr",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "cレヴォ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comic revolution",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "futaket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ふたけっと",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comicomi",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "コミコミ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "puniket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ぷにケット",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "kouroumu",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "紅楼夢",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "shotaket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ショタケット",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "shota scratch",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ショタスクラッチ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "mimiket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "みみけっと",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "kemoket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "けもケット",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "mofuket",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "もふけっと",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "tora matsuri",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "とら祭り",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "fetishism",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "フェティシズム",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "fur-st",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ふぁーすと",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "koimari",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "こいまり",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "koharu komichi",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "小春小径",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "kyonyuukko",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "巨乳っ娘",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "lyrical magical",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "リリカルマジカル",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "makimaki",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "まきまき",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "mencomi",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "メンコミ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "coscafe",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "コスカ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "reisensai",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "鈴仙祭",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "sht",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "tengu-sama no oshigoto",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "天狗様のお仕事",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "tokipa",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ときパ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "komachi",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "東方不敗小町",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "ruuchakai",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "螺茶会",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "yarinsai",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "東方椰麟祭",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "akatsuki no utage",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "紅月ノ宴",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comichara",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "コミキャラ",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "abc",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "アブノーマル・カーニバル",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "bokura no love live!",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "僕らのラブライブ!",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "bang dreamer's party!",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "comic castle",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "idol survival",
				"role": "event",
				"kind": "prefix_number"
			},
			{
				"value": "japariket",
				"role": "event",
				"kind": "exact"
			},
			{
				"value": "ジャパリケット",
				"role": "event",
				"kind": "exact"
			},
			{
				"value": "rfosaka",
				"role": "event",
				"kind": "exact"
			},
			{
				"value": "レイフレ大阪",
				"role": "event",
				"kind": "exact"
			},
			{
				"value": "秋葉原超同人祭",
				"role": "event",
				"kind": "exact"
			},
			{
				"value": "akihabara chou doujinsai",
				"role": "event",
				"kind": "exact"
			},
			{
				"value": "afrikaans",
				"role": "language",
				"kind": "exact",
				"lang": "afrikaans"
			},
			{
				"value": "albanian",
				"role": "language",
				"kind": "exact",
				"lang": "albanian"
			},
			{
				"value": "arabic",
				"role": "language",
				"kind": "exact",
				"lang": "arabic"
			},
			{
				"value": "aramaic",
				"role": "language",
				"kind": "exact",
				"lang": "aramaic"
			},
			{
				"value": "armenian",
				"role": "language",
				"kind": "exact",
				"lang": "armenian"
			},
			{
				"value": "bengali",
				"role": "language",
				"kind": "exact",
				"lang": "bengali"
			},
			{
				"value": "bosnian",
				"role": "language",
				"kind": "exact",
				"lang": "bosnian"
			},
			{
				"value": "bulgarian",
				"role": "language",
				"kind": "exact",
				"lang": "bulgarian"
			},
			{
				"value": "burmese",
				"role": "language",
				"kind": "exact",
				"lang": "burmese"
			},
			{
				"value": "catalan",
				"role": "language",
				"kind": "exact",
				"lang": "catalan"
			},
			{
				"value": "cebuano",
				"role": "language",
				"kind": "exact",
				"lang": "cebuano"
			},
			{
				"value": "chinese",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "cree",
				"role": "language",
				"kind": "exact",
				"lang": "cree"
			},
			{
				"value": "creole",
				"role": "language",
				"kind": "exact",
				"lang": "creole"
			},
			{
				"value": "croatian",
				"role": "language",
				"kind": "exact",
				"lang": "croatian"
			},
			{
				"value": "czech",
				"role": "language",
				"kind": "exact",
				"lang": "czech"
			},
			{
				"value": "danish",
				"role": "language",
				"kind": "exact",
				"lang": "danish"
			},
			{
				"value": "dutch",
				"role": "language",
				"kind": "exact",
				"lang": "dutch"
			},
			{
				"value": "english",
				"role": "language",
				"kind": "exact",
				"lang": "english"
			},
			{
				"value": "esperanto",
				"role": "language",
				"kind": "exact",
				"lang": "esperanto"
			},
			{
				"value": "estonian",
				"role": "language",
				"kind": "exact",
				"lang": "estonian"
			},
			{
				"value": "finnish",
				"role": "language",
				"kind": "exact",
				"lang": "finnish"
			},
			{
				"value": "french",
				"role": "language",
				"kind": "exact",
				"lang": "french"
			},
			{
				"value": "georgian",
				"role": "language",
				"kind": "exact",
				"lang": "georgian"
			},
			{
				"value": "german",
				"role": "language",
				"kind": "exact",
				"lang": "german"
			},
			{
				"value": "greek",
				"role": "language",
				"kind": "exact",
				"lang": "greek"
			},
			{
				"value": "gujarati",
				"role": "language",
				"kind": "exact",
				"lang": "gujarati"
			},
			{
				"value": "hebrew",
				"role": "language",
				"kind": "exact",
				"lang": "hebrew"
			},
			{
				"value": "hindi",
				"role": "language",
				"kind": "exact",
				"lang": "hindi"
			},
			{
				"value": "hmong",
				"role": "language",
				"kind": "exact",
				"lang": "hmong"
			},
			{
				"value": "hungarian",
				"role": "language",
				"kind": "exact",
				"lang": "hungarian"
			},
			{
				"value": "icelandic",
				"role": "language",
				"kind": "exact",
				"lang": "icelandic"
			},
			{
				"value": "indonesian",
				"role": "language",
				"kind": "exact",
				"lang": "indonesian"
			},
			{
				"value": "irish",
				"role": "language",
				"kind": "exact",
				"lang": "irish"
			},
			{
				"value": "italian",
				"role": "language",
				"kind": "exact",
				"lang": "italian"
			},
			{
				"value": "japanese",
				"role": "language",
				"kind": "exact",
				"lang": "japanese"
			},
			{
				"value": "javanese",
				"role": "language",
				"kind": "exact",
				"lang": "javanese"
			},
			{
				"value": "kannada",
				"role": "language",
				"kind": "exact",
				"lang": "kannada"
			},
			{
				"value": "kazakh",
				"role": "language",
				"kind": "exact",
				"lang": "kazakh"
			},
			{
				"value": "khmer",
				"role": "language",
				"kind": "exact",
				"lang": "khmer"
			},
			{
				"value": "korean",
				"role": "language",
				"kind": "exact",
				"lang": "korean"
			},
			{
				"value": "kurdish",
				"role": "language",
				"kind": "exact",
				"lang": "kurdish"
			},
			{
				"value": "ladino",
				"role": "language",
				"kind": "exact",
				"lang": "ladino"
			},
			{
				"value": "lao",
				"role": "language",
				"kind": "exact",
				"lang": "lao"
			},
			{
				"value": "latin",
				"role": "language",
				"kind": "exact",
				"lang": "latin"
			},
			{
				"value": "latvian",
				"role": "language",
				"kind": "exact",
				"lang": "latvian"
			},
			{
				"value": "marathi",
				"role": "language",
				"kind": "exact",
				"lang": "marathi"
			},
			{
				"value": "mongolian",
				"role": "language",
				"kind": "exact",
				"lang": "mongolian"
			},
			{
				"value": "ndebele",
				"role": "language",
				"kind": "exact",
				"lang": "ndebele"
			},
			{
				"value": "nepali",
				"role": "language",
				"kind": "exact",
				"lang": "nepali"
			},
			{
				"value": "norwegian",
				"role": "language",
				"kind": "exact",
				"lang": "norwegian"
			},
			{
				"value": "oromo",
				"role": "language",
				"kind": "exact",
				"lang": "oromo"
			},
			{
				"value": "papiamento",
				"role": "language",
				"kind": "exact",
				"lang": "papiamento"
			},
			{
				"value": "pashto",
				"role": "language",
				"kind": "exact",
				"lang": "pashto"
			},
			{
				"value": "persian",
				"role": "language",
				"kind": "exact",
				"lang": "persian"
			},
			{
				"value": "polish",
				"role": "language",
				"kind": "exact",
				"lang": "polish"
			},
			{
				"value": "portuguese",
				"role": "language",
				"kind": "exact",
				"lang": "portuguese"
			},
			{
				"value": "punjabi",
				"role": "language",
				"kind": "exact",
				"lang": "punjabi"
			},
			{
				"value": "romanian",
				"role": "language",
				"kind": "exact",
				"lang": "romanian"
			},
			{
				"value": "russian",
				"role": "language",
				"kind": "exact",
				"lang": "russian"
			},
			{
				"value": "sango",
				"role": "language",
				"kind": "exact",
				"lang": "sango"
			},
			{
				"value": "sanskrit",
				"role": "language",
				"kind": "exact",
				"lang": "sanskrit"
			},
			{
				"value": "serbian",
				"role": "language",
				"kind": "exact",
				"lang": "serbian"
			},
			{
				"value": "shona",
				"role": "language",
				"kind": "exact",
				"lang": "shona"
			},
			{
				"value": "slovak",
				"role": "language",
				"kind": "exact",
				"lang": "slovak"
			},
			{
				"value": "slovenian",
				"role": "language",
				"kind": "exact",
				"lang": "slovenian"
			},
			{
				"value": "somali",
				"role": "language",
				"kind": "exact",
				"lang": "somali"
			},
			{
				"value": "spanish",
				"role": "language",
				"kind": "exact",
				"lang": "spanish"
			},
			{
				"value": "swahili",
				"role": "language",
				"kind": "exact",
				"lang": "swahili"
			},
			{
				"value": "swedish",
				"role": "language",
				"kind": "exact",
				"lang": "swedish"
			},
			{
				"value": "tagalog",
				"role": "language",
				"kind": "exact",
				"lang": "tagalog"
			},
			{
				"value": "tamil",
				"role": "language",
				"kind": "exact",
				"lang": "tamil"
			},
			{
				"value": "telugu",
				"role": "language",
				"kind": "exact",
				"lang": "telugu"
			},
			{
				"value": "thai",
				"role": "language",
				"kind": "exact",
				"lang": "thai"
			},
			{
				"value": "tibetan",
				"role": "language",
				"kind": "exact",
				"lang": "tibetan"
			},
			{
				"value": "tigrinya",
				"role": "language",
				"kind": "exact",
				"lang": "tigrinya"
			},
			{
				"value": "turkish",
				"role": "language",
				"kind": "exact",
				"lang": "turkish"
			},
			{
				"value": "ukrainian",
				"role": "language",
				"kind": "exact",
				"lang": "ukrainian"
			},
			{
				"value": "urdu",
				"role": "language",
				"kind": "exact",
				"lang": "urdu"
			},
			{
				"value": "vietnamese",
				"role": "language",
				"kind": "exact",
				"lang": "vietnamese"
			},
			{
				"value": "welsh",
				"role": "language",
				"kind": "exact",
				"lang": "welsh"
			},
			{
				"value": "yiddish",
				"role": "language",
				"kind": "exact",
				"lang": "yiddish"
			},
			{
				"value": "zulu",
				"role": "language",
				"kind": "exact",
				"lang": "zulu"
			},
			{
				"value": "eng",
				"role": "language",
				"kind": "exact",
				"lang": "english"
			},
			{
				"value": "rus",
				"role": "language",
				"kind": "exact",
				"lang": "russian"
			},
			{
				"value": "esp",
				"role": "language",
				"kind": "exact",
				"lang": "spanish"
			},
			{
				"value": "español",
				"role": "language",
				"kind": "exact",
				"lang": "spanish"
			},
			{
				"value": "espanol",
				"role": "language",
				"kind": "exact",
				"lang": "spanish"
			},
			{
				"value": "portuguese-br",
				"role": "language",
				"kind": "exact",
				"lang": "portuguese"
			},
			{
				"value": "português",
				"role": "language",
				"kind": "exact",
				"lang": "portuguese"
			},
			{
				"value": "thai ภาษาไทย",
				"role": "language",
				"kind": "exact",
				"lang": "thai"
			},
			{
				"value": "ภาษาไทย",
				"role": "language",
				"kind": "exact",
				"lang": "thai"
			},
			{
				"value": "แปลไทย",
				"role": "language",
				"kind": "exact",
				"lang": "thai"
			},
			{
				"value": "vietnamese tiếng việt",
				"role": "language",
				"kind": "exact",
				"lang": "vietnamese"
			},
			{
				"value": "tiếng việt",
				"role": "language",
				"kind": "exact",
				"lang": "vietnamese"
			},
			{
				"value": "japanese, english",
				"role": "language",
				"kind": "exact",
				"lang": "english"
			},
			{
				"value": "japanese, chinese",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "english, japanese",
				"role": "language",
				"kind": "exact",
				"lang": "english"
			},
			{
				"value": "chs",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "cht",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "fr",
				"role": "language",
				"kind": "exact",
				"lang": "french"
			},
			{
				"value": "br",
				"role": "language",
				"kind": "exact",
				"lang": "portuguese"
			},
			{
				"value": "de",
				"role": "language",
				"kind": "exact",
				"lang": "german"
			},
			{
				"value": "german/deutsch",
				"role": "language",
				"kind": "exact",
				"lang": "german"
			},
			{
				"value": "español/spanish",
				"role": "language",
				"kind": "exact",
				"lang": "spanish"
			},
			{
				"value": "spanish/español",
				"role": "language",
				"kind": "exact",
				"lang": "spanish"
			},
			{
				"value": "英訳",
				"role": "language",
				"kind": "exact",
				"lang": "english"
			},
			{
				"value": "英語",
				"role": "language",
				"kind": "exact",
				"lang": "english"
			},
			{
				"value": "中国翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中国翻译",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中國翻譯",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中国語",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中国语",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中國語",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中文",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中文翻译",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "中文翻譯",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "简体中文",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "繁體中文",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "韓国翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "korean"
			},
			{
				"value": "韓国語",
				"role": "language",
				"kind": "exact",
				"lang": "korean"
			},
			{
				"value": "한국어",
				"role": "language",
				"kind": "exact",
				"lang": "korean"
			},
			{
				"value": "日本語",
				"role": "language",
				"kind": "exact",
				"lang": "japanese"
			},
			{
				"value": "日本語、英語",
				"role": "language",
				"kind": "exact",
				"lang": "english"
			},
			{
				"value": "日本語、中国語",
				"role": "language",
				"kind": "exact",
				"lang": "chinese"
			},
			{
				"value": "フランス翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "french"
			},
			{
				"value": "ドイツ翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "german"
			},
			{
				"value": "イタリア翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "italian"
			},
			{
				"value": "ポルトガル翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "portuguese"
			},
			{
				"value": "ロシア翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "russian"
			},
			{
				"value": "スペイン翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "spanish"
			},
			{
				"value": "タイ翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "thai"
			},
			{
				"value": "ベトナム翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "vietnamese"
			},
			{
				"value": "ポーランド翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "polish"
			},
			{
				"value": "ハンガリー翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "hungarian"
			},
			{
				"value": "オランダ翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "dutch"
			},
			{
				"value": "ウクライナ翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "ukrainian"
			},
			{
				"value": "インドネシア翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "indonesian"
			},
			{
				"value": "トルコ翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "turkish"
			},
			{
				"value": "アラビア翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "arabic"
			},
			{
				"value": "チェコ翻訳",
				"role": "language",
				"kind": "exact",
				"lang": "czech"
			},
			{
				"value": "翻訳",
				"role": "language",
				"kind": "suffix"
			},
			{
				"value": "汉化",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "漢化",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "汉化组",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "漢化組",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "翻译",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "翻譯",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "翻译组",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "翻譯組",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "翻訳組",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "机翻",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "機翻",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "字幕组",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "字幕組",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "嵌字",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "润色",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "漫画组",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "漫畫組",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "日语社",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "translations",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "translation",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "translates",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "scans",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "scanlations",
				"role": "translator",
				"kind": "suffix"
			},
			{
				"value": "digital",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "mtl",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "dl版",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "dl",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "decensored",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "無修正",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "无修正",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "uncensored",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "去码",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "修正",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "修正版",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "ongoing",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "on going",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "on-going",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "進行中",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "in progress",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "wip",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "work in progress",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "unfinished",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "incomplete",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "ページ欠落",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "complete",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "完結",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "sample",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "見本",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "textless",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "無字",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "colorized",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "カラー化",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "rewrite",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "full color",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "fullcolor",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "フルカラー",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "フルカラー版",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "フルカラー成人版",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "全彩",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "完全版",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "別スキャン",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "別版",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "ページ補足",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "web再録",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "web sairoku",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "再録",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "総集編",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "request",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "oc",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "animated",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "3d",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "no gore",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "同人誌",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "同人cg集",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "同人cg",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "同人ソフト",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "同人ゲーム",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "同人音声",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "成年コミック",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "アダルトコミック",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "フルカラーコミック",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "一般コミック",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "コスプレ",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "cosplay",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "非エロ",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "エロ",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "hi-res",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "high quality",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "cg集",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "cg",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "画集",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "イラスト集",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "imageset",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "image set",
				"role": "release",
				"kind": "exact"
			},
			{
				"value": "pixiv",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "fanbox",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "pixiv fanbox",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "pixiv | twitter",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "patreon",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "twitter",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "twitter/e621",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "x",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "fantia",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "dmm.com",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "dmm",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "e621",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "hentai-foundry",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "hentai foundry",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "gumroad",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "skeb",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "booth",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "dlsite",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "nijie",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "deviantart",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "subscribestar",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "kemono",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "fakku",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "nhentai",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "ci-en",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "poipiku",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "tumblr",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "furaffinity",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "newgrounds",
				"role": "platform",
				"kind": "exact"
			},
			{
				"value": "artist",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "アーティスト",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "anthology",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "アンソロジー",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "various",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "various artists",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "よろず",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "tba",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "unknown",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "作者不詳",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "collection",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "original",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "オリジナル",
				"role": "placeholder",
				"kind": "exact"
			},
			{
				"value": "ai generated",
				"role": "ai",
				"kind": "exact"
			},
			{
				"value": "ai-generated",
				"role": "ai",
				"kind": "exact"
			},
			{
				"value": "ai_generated",
				"role": "ai",
				"kind": "exact"
			},
			{
				"value": "aigenerated",
				"role": "ai",
				"kind": "exact"
			},
			{
				"value": "ai生成",
				"role": "ai",
				"kind": "exact"
			},
			{
				"value": "ai",
				"role": "ai",
				"kind": "exact"
			}
		]
	};
	var PREFIX_SEPARATORS = " ☆★・-/,";
	var ORDINAL_SUFFIXES = [
		"st",
		"nd",
		"rd",
		"th"
	];
	var DIGIT_RE = compile(start.and(digit));
	function normalizeMarkerText(value) {
		return value.normalize("NFKC").toLowerCase().split(whitespaceRun).filter(Boolean).join(" ");
	}
	var exact = new Map();
	var prefixes = [];
	var suffixes = [];
	for (const entry of title_markers_default.entries) {
		const value = normalizeMarkerText(entry.value);
		const marker = entry.lang ? {
			role: entry.role,
			lang: entry.lang
		} : { role: entry.role };
		if (entry.kind === "exact") exact.set(value, marker);
		else if (entry.kind === "prefix_number") prefixes.push([value, marker]);
		else if (entry.kind === "suffix") suffixes.push([value, marker]);
		else throw new Error(`unknown marker kind ${entry.kind} for ${entry.value}`);
	}
	prefixes.sort((a, b) => b[0].length - a[0].length);
	suffixes.sort((a, b) => b[0].length - a[0].length);
	function isNumberedRemainder(remainder) {
		let start = 0;
		while (start < remainder.length && PREFIX_SEPARATORS.includes(remainder[start])) start += 1;
		let digits = start;
		while (digits < remainder.length && DIGIT_RE.test(remainder[digits])) digits += 1;
		if (digits === start) return false;
		let rest = remainder.slice(digits);
		for (const suffix of ORDINAL_SUFFIXES) if (rest.startsWith(suffix)) {
			rest = rest.slice(suffix.length);
			break;
		}
		return rest === "" || PREFIX_SEPARATORS.includes(rest[0]);
	}
	function markerOf(segment) {
		const text = normalizeMarkerText(segment);
		if (!text) return null;
		const direct = exact.get(text);
		if (direct) return direct;
		for (const [stem, marker] of prefixes) if (text.startsWith(stem) && isNumberedRemainder(text.slice(stem.length))) return marker;
		for (const [suffix, marker] of suffixes) if (text.endsWith(suffix)) return marker;
		return null;
	}
	var DIGIT_VALUES = {
		"〇": 0,
		"零": 0,
		"一": 1,
		"壱": 1,
		"壹": 1,
		"二": 2,
		"弐": 2,
		"貳": 2,
		"贰": 2,
		"两": 2,
		"兩": 2,
		"三": 3,
		"参": 3,
		"參": 3,
		"叁": 3,
		"四": 4,
		"肆": 4,
		"五": 5,
		"伍": 5,
		"六": 6,
		"陸": 6,
		"陆": 6,
		"七": 7,
		"柒": 7,
		"八": 8,
		"捌": 8,
		"九": 9,
		"玖": 9
	};
	var UNIT_VALUES = {
		"十": 10,
		"拾": 10,
		"百": 100,
		"佰": 100
	};
	var FIXED_TENS = {
		"廿": 20,
		"卅": 30
	};
	var CJK_NUMERAL_CHARACTERS = [
		...Object.keys(DIGIT_VALUES),
		...Object.keys(UNIT_VALUES),
		...Object.keys(FIXED_TENS)
	].join("");
	function positionalValue(characters) {
		if (characters.length > 3) return null;
		let value = 0;
		for (const character of characters) value = value * 10 + DIGIT_VALUES[character];
		return value;
	}
	function parseCjkNumeral(text) {
		const characters = [...text];
		if (characters.length === 0) return null;
		if (characters.every((character) => character in DIGIT_VALUES)) return positionalValue(characters);
		let value = 0;
		let pendingDigit = null;
		let lastUnit = Infinity;
		for (const character of characters) {
			if (character in DIGIT_VALUES) {
				if (pendingDigit !== null && pendingDigit !== 0) return null;
				pendingDigit = DIGIT_VALUES[character];
				continue;
			}
			const fixedTen = FIXED_TENS[character];
			if (fixedTen !== void 0) {
				if (pendingDigit !== null || lastUnit <= 10) return null;
				value += fixedTen;
				lastUnit = 10;
				continue;
			}
			const unit = UNIT_VALUES[character];
			if (unit === void 0 || unit >= lastUnit) return null;
			value += (pendingDigit === null || pendingDigit === 0 ? 1 : pendingDigit) * unit;
			pendingDigit = null;
			lastUnit = unit;
		}
		if (pendingDigit !== null) value += pendingDigit;
		return value;
	}
	var number = digit.times.between(1, 3).and(maybe(exactly(".").and(digit.times.between(1, 2))));
	var RANGE_SEPARATOR = charIn("-~–—－");
	var counter = number.and(maybe(RANGE_SEPARATOR.and(number)));
	var cjkCounter = charIn(CJK_NUMERAL_CHARACTERS).times.between(1, 5).as("cjkNumeral");
	var romanCounter = anyOf("ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "xi", "xii", "xiii");
	var latinChapter = standalone(anyOf(...[
		"chapter",
		"episode",
		"volume",
		"part",
		"sono",
		"vol",
		"set",
		"ch",
		"ep",
		"pt"
	]).and(maybe(".")).and(optionalSpace).and(counter));
	var cjkChapter = exactly("第").and(anyOf(counter, cjkCounter)).and(charIn("話话巻卷"));
	var seriesWord = anyOf(anyOf("最終話", "番外編", "番外篇", "完結編", "完结篇", "総集編", "總集篇", "总集篇", "特別編", "特別篇", "特别篇", "完全版", "新装版", "続編", "前編", "後編", "中編", "前篇", "後篇", "后篇", "上篇", "中篇", "下篇", "上巻", "中巻", "下巻", "序章", "本編", "全編"), anyOf("soushuuhen", "bangaihen", "saishuuwa", "chuuhen", "zenpen", "kouhen", "joukan", "gekan").notAfter(letter).notBefore(letter));
	compile(optionalSpace.and(anyOf(latinChapter, cjkChapter)), ["g", "i"]);
	var CUT_POINT = compile(optionalSpace.and(anyOf(latinChapter, cjkChapter, seriesWord)), ["g", "i"]);
	var MID_COUNTER = compile(anyOf(counter, cjkCounter, romanCounter).after(whitespace).before(whitespace), ["g", "i"]);
	var positionOnlyWord = anyOf("続", "改", "上", "中", "下");
	var subjectPart = notUnicode("White_Space").times.between(1, 9).and(charIn("編篇"));
	var ellipsis = anyOf(exactly(".."), charIn("…"));
	var TRAILING_NUMBER = compile(anyOf(anyOf(counter, cjkCounter, romanCounter, seriesWord, positionOnlyWord, subjectPart).after(anyOf(whitespace, start, ellipsis)), counter.after(cjkLetter)).and(end), ["i"]);
	var GROUP_SEPARATOR = compile(charIn("。、！？〜～・").as("separator"));
	function unlessNotNumeral(replacement) {
		return (match, ...rest) => {
			const groups = rest[rest.length - 1];
			if (groups?.cjkNumeral !== void 0 && parseCjkNumeral(groups.cjkNumeral) === null) return match;
			return replacement;
		};
	}
	function stripGroupTails(text, alreadyStripped = false) {
		const parts = text.split(GROUP_SEPARATOR);
		const kept = [];
		let removed = "";
		for (let index = 0; index < parts.length; index += 2) {
			const group = parts[index].trim();
			let shorter = group;
			let found = false;
			for (;;) {
				const stripped = shorter.replace(TRAILING_NUMBER, unlessNotNumeral(""));
				if (stripped !== shorter) found = true;
				const next = trimTail(stripped).trim();
				if (next === shorter) break;
				shorter = next;
			}
			if (found) removed = group.slice(shorter.length).trim();
			if (!shorter) continue;
			if (kept.length > 0) kept.push(parts[index - 1]);
			kept.push(shorter);
		}
		if (!removed && !alreadyStripped) return {
			text,
			removed: ""
		};
		const stripped = kept.join("");
		return stripped ? {
			text: stripped,
			removed
		} : {
			text,
			removed: ""
		};
	}
	var MIN_PHRASE_LENGTH = 2;
	function firstCutPoint(text) {
		let best = null;
		for (const pattern of [CUT_POINT, MID_COUNTER]) {
			pattern.lastIndex = 0;
			for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
				const numeral = match.groups?.cjkNumeral;
				if (numeral !== void 0 && parseCjkNumeral(numeral) === null) continue;
				const found = {
					index: match.index,
					length: match[0].length
				};
				if (best === null || found.index < best.index) best = found;
				break;
			}
		}
		return best;
	}
	var HAS_LETTER$1 = compile(letter);
	var COUNTER_IN_MARKER = compile(anyOf(counter, cjkCounter, standalone(romanCounter)), ["i"]);
	function counterIn(marker) {
		const found = COUNTER_IN_MARKER.exec(marker.trim());
		return found ? found[0] : marker.trim();
	}
	var edgeMark = anyOf(punctuation, whitespace, charIn("️︎ー"));
	var EDGE_NOISE = compile(anyOf(oneOrMore(edgeMark).after(start), oneOrMore(edgeMark).and(end)), ["g"]);
	var TRAILING_NOISE = compile(oneOrMore(edgeMark).and(end));
	var trimTail = (text) => text.replace(TRAILING_NOISE, "");
	var trimEdges = (text) => text.replace(EDGE_NOISE, "");
	function readWorkText(text) {
		const marker = firstCutPoint(text);
		if (marker === null) {
			const { text: phrase, removed } = stripGroupTails(text);
			return {
				phrase: trimEdges(phrase),
				counter: removed ? counterIn(removed) : ""
			};
		}
		const left = text.slice(0, marker.index).trim();
		const right = text.slice(marker.index + marker.length).trim();
		return {
			phrase: trimEdges(stripGroupTails(HAS_LETTER$1.test(left) && left.length >= MIN_PHRASE_LENGTH ? left : right, true).text),
			counter: counterIn(text.slice(marker.index, marker.index + marker.length))
		};
	}
	var DELIMITER_PAIRS = {
		"[": "]",
		"［": "］",
		"(": ")",
		"（": "）",
		"{": "}",
		"｛": "｝",
		"【": "】",
		"「": "」",
		"『": "』",
		"《": "》",
		"〈": "〉",
		"<": ">",
		"〔": "〕",
		"｢": "｣",
		"〖": "〗",
		"〝": "〟",
		"︵": "︶",
		"༼": "༽",
		"༺": "༻",
		"⟮": "⟯",
		"₍": "₎",
		"❲": "❳",
		"❬": "❭",
		"❰": "❱",
		"⟨": "⟩",
		"⟪": "⟫",
		"﹙": "﹚",
		"〘": "〙",
		"﴿": "﴾",
		"⁽": "⁾",
		"﹃": "﹄"
	};
	var OPEN_BY_CLOSE = Object.fromEntries(Object.entries(DELIMITER_PAIRS).map(([opening, closing]) => [closing, opening]));
	var IDENTITY_PAIRS = {
		"[]": true,
		"【】": true,
		"〔〕": true,
		"〖〗": true,
		"〘〙": true,
		"❲❳": true
	};
	var CONTEXT_PAIRS = {
		"()": true,
		"<>": true,
		"〈〉": true,
		"︵︶": true,
		"⟮⟯": true,
		"₍₎": true,
		"﹙﹚": true,
		"﴿﴾": true
	};
	var TITLE_QUOTE_PAIRS = {
		"「」": true,
		"『』": true,
		"《》": true,
		"〝〟": true,
		"❬❭": true,
		"❰❱": true,
		"⟨⟩": true,
		"⟪⟫": true,
		"༺༻": true
	};
	var ALNUM_RE = compile(anyOf(letter, unicode("N")));
	var MIRRORED_MARKS = "-~～〜―－●★◆=*❤♥";
	function stripMirroredBlocks(text, wrapped) {
		let out = text;
		for (const mark of MIRRORED_MARKS) {
			const first = out.indexOf(mark);
			const last = out.lastIndexOf(mark);
			if (first === -1 || first === last || out.indexOf(mark, first + 1) !== last) continue;
			if (first > 0 && ALNUM_RE.test(out.slice(first - 1, first))) continue;
			const afterLast = out.slice(last + 1, last + 2);
			if (afterLast && ALNUM_RE.test(afterLast)) continue;
			const inner = out.slice(first + 1, last);
			if (!ALNUM_RE.test(inner) || inner !== inner.trim()) continue;
			const before = out.slice(0, first).trim();
			const after = out.slice(last + 1).trim();
			if (!ALNUM_RE.test(before + after)) continue;
			const bar = out.indexOf(" | ");
			if (bar === -1 || first < bar) wrapped.push(inner);
			if (before && after) continue;
			out = before || after;
		}
		return out;
	}
	function normalizeTitleText(value) {
		const lowered = value.normalize("NFKC").toLowerCase();
		let out = "";
		for (const character of lowered) out += ALNUM_RE.test(character) ? character : " ";
		return out.split(whitespaceRun).filter(Boolean).join(" ");
	}
	function parseTitleSegments(value) {
		const normalized = value.normalize("NFKC");
		const segments = [];
		const stack = [];
		let textStart = 0;
		let blockStart = 0;
		const characters = [...normalized];
		for (let index = 0; index < characters.length; index += 1) {
			const character = characters[index];
			if (character in DELIMITER_PAIRS) {
				if (stack.length === 0) {
					if (index > textStart) segments.push({
						kind: "text",
						text: characters.slice(textStart, index).join(""),
						pair: ""
					});
					blockStart = index;
				}
				stack.push(character);
				continue;
			}
			const opening = OPEN_BY_CLOSE[character];
			if (!opening) continue;
			if (stack.length === 0 || stack[stack.length - 1] !== opening) return null;
			stack.pop();
			if (stack.length === 0) {
				segments.push({
					kind: "block",
					text: characters.slice(blockStart + 1, index).join(""),
					pair: opening + character
				});
				textStart = index + 1;
			}
		}
		if (stack.length > 0) return null;
		if (textStart < characters.length) segments.push({
			kind: "text",
			text: characters.slice(textStart).join(""),
			pair: ""
		});
		return segments;
	}
	function isClaimedMarker(segment) {
		if (segment.kind !== "block" || segment.pair in TITLE_QUOTE_PAIRS) return false;
		return markerOf(segment.text) !== null;
	}
	function analyzeTitle(value) {
		const parsed = parseTitleSegments(value);
		if (parsed === null) {
			const text = value.normalize("NFKC").trim();
			return {
				core: normalizeTitleText(value),
				identity: "",
				context: "",
				identityBlocks: [],
				coreSegments: text ? [text] : [],
				wrapped: [],
				contextBlocks: [],
				contextText: "",
				balanced: false
			};
		}
		const unclaimed = parsed.filter((segment) => ALNUM_RE.test(segment.text) && !isClaimedMarker(segment));
		const core = [];
		const identity = [];
		const context = [];
		let seenCore = false;
		for (const segment of unclaimed) if (segment.kind === "text" || segment.pair in TITLE_QUOTE_PAIRS) {
			core.push(segment.text);
			seenCore = true;
		} else if (segment.pair in IDENTITY_PAIRS && !seenCore) identity.push(segment.text);
		else if (segment.pair in CONTEXT_PAIRS && seenCore) context.push(segment.text);
		if (core.length === 0) {
			identity.length = 0;
			context.length = 0;
			if (unclaimed.length === 1) core.push(unclaimed[0].text);
			else {
				const firstIdentity = unclaimed.find((segment) => segment.pair in IDENTITY_PAIRS);
				if (firstIdentity) identity.push(firstIdentity.text);
			}
		}
		const written = core.map((text) => text.split(whitespaceRun).filter(Boolean).join(" ")).filter(Boolean);
		const wrapped = [];
		const coreSegments = written.map((text) => stripMirroredBlocks(text, wrapped)).filter(Boolean);
		const contextBlocks = context.map((text) => text.split(whitespaceRun).filter(Boolean).join(" ")).filter(Boolean);
		const identityBlocks = identity.map((text) => text.split(whitespaceRun).filter(Boolean).join(" ")).filter(Boolean);
		return {
			core: normalizeTitleText(written.join(" ")),
			identity: normalizeTitleText(identity.join(" ")),
			context: normalizeTitleText(contextBlocks.join(" ")),
			identityBlocks,
			coreSegments,
			wrapped,
			contextBlocks,
			contextText: contextBlocks.join(" "),
			balanced: true
		};
	}
	var SIMILARITY_THRESHOLD = .5;
	var IDENTITY_MISMATCH_FLOOR = .45;
	var CONTEXT_MISMATCH_FLOOR = .8;
	function hasAiGeneratedMarker(value) {
		const segments = parseTitleSegments(value);
		if (segments === null) return false;
		return segments.some((segment) => segment.kind === "block" && markerOf(segment.text)?.role === "ai");
	}
	function trigramCounts(value) {
		const counts = new Map();
		const characters = [...value.replaceAll(" ", "")];
		if (characters.length === 0) return counts;
		if (characters.length < 3) {
			counts.set(characters.join(""), 1);
			return counts;
		}
		for (let index = 0; index + 3 <= characters.length; index += 1) {
			const trigram = characters.slice(index, index + 3).join("");
			counts.set(trigram, (counts.get(trigram) ?? 0) + 1);
		}
		return counts;
	}
	function trigramDice(left, right) {
		const leftCounts = trigramCounts(left);
		const rightCounts = trigramCounts(right);
		let leftTotal = 0;
		let rightTotal = 0;
		let overlap = 0;
		for (const count of leftCounts.values()) leftTotal += count;
		for (const count of rightCounts.values()) rightTotal += count;
		const total = leftTotal + rightTotal;
		if (total === 0) return 0;
		for (const [trigram, count] of leftCounts) overlap += Math.min(count, rightCounts.get(trigram) ?? 0);
		return 2 * overlap / total;
	}
	function identitiesOf(title, titleJpn) {
		const identities = [];
		for (const value of [title, titleJpn]) {
			if (!value) continue;
			const identity = analyzeTitle(value).identity;
			if (identity) identities.push(identity);
		}
		return identities;
	}
	var CREATOR_NAMESPACES = ["artist:", "group:"];
	function creatorTags(tags) {
		return tags.filter((tag) => CREATOR_NAMESPACES.some((namespace) => tag.startsWith(namespace))).map((tag) => tag.replaceAll("_", " "));
	}
	function creatorVerdict(sourceTags, candidateTags) {
		const source = creatorTags(sourceTags);
		const candidate = creatorTags(candidateTags);
		if (source.length === 0 || candidate.length === 0) return "unknown";
		return source.some((tag) => candidate.includes(tag)) ? "same" : "different";
	}
	function hasAiGeneratedTag(tags) {
		return tags.some((tag) => tag.replaceAll("_", " ") === "other:ai generated");
	}
	function identityAgreement(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn) {
		const sourceIdentities = identitiesOf(sourceTitle, sourceTitleJpn);
		const candidateIdentities = identitiesOf(candidateTitle, candidateTitleJpn);
		if (sourceIdentities.length === 0 || candidateIdentities.length === 0) return null;
		let best = 0;
		for (const source of sourceIdentities) for (const candidate of candidateIdentities) best = Math.max(best, trigramDice(source, candidate));
		return best;
	}
	function relationshipIsBlocked(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn, creators = "unknown") {
		for (const value of [
			sourceTitle,
			sourceTitleJpn,
			candidateTitle,
			candidateTitleJpn
		]) if (value && hasAiGeneratedMarker(value)) return true;
		if (creators === "different") return true;
		if (creators === "same") return false;
		if (identitiesOf(sourceTitle, sourceTitleJpn).length === 0) return false;
		const agreement = identityAgreement(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn);
		return agreement === null || agreement < .5;
	}
	function creatorsAgree(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn, creators = "unknown") {
		if (creators !== "unknown") return creators === "same";
		const agreement = identityAgreement(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn);
		return agreement !== null && agreement >= .5;
	}
	function workTexts(title, titleJpn) {
		const texts = [];
		for (const value of [title, titleJpn]) {
			if (!value) continue;
			const parts = analyzeTitle(value);
			const core = parts.core.replaceAll(" ", "");
			if (core) texts.push({
				core,
				all: core + parts.context.replaceAll(" ", "")
			});
		}
		return texts;
	}
	var MENTION_MIN_LENGTH = 3;
	function mentionsWork(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn) {
		const sources = workTexts(sourceTitle, sourceTitleJpn);
		const candidates = workTexts(candidateTitle, candidateTitleJpn);
		for (const source of sources) for (const candidate of candidates) {
			if (source.core.length >= MENTION_MIN_LENGTH && candidate.all.includes(source.core)) return true;
			if (candidate.core.length >= MENTION_MIN_LENGTH && source.all.includes(candidate.core)) return true;
		}
		return false;
	}
	function workPhrases(title, titleJpn) {
		const phrases = [];
		for (const value of [title, titleJpn]) {
			if (!value) continue;
			for (const segment of analyzeTitle(value).coreSegments) for (const half of segment.split(" | ")) {
				const phrase = normalizeTitleText(readWorkText(half).phrase).replaceAll(" ", "");
				if (phrase.length >= MENTION_MIN_LENGTH) phrases.push(phrase);
			}
		}
		return phrases;
	}
	function sharesWorkPhrase(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn) {
		const sourceCores = workTexts(sourceTitle, sourceTitleJpn).map((text) => text.core);
		const candidateCores = workTexts(candidateTitle, candidateTitleJpn).map((text) => text.core);
		for (const phrase of workPhrases(sourceTitle, sourceTitleJpn)) if (candidateCores.some((core) => core.includes(phrase))) return true;
		for (const phrase of workPhrases(candidateTitle, candidateTitleJpn)) if (sourceCores.some((core) => core.includes(phrase))) return true;
		return false;
	}
	function titleSimilarity(left, right, creators = "unknown") {
		const leftParts = analyzeTitle(left);
		const rightParts = analyzeTitle(right);
		let score = trigramDice(leftParts.core, rightParts.core);
		if (creators !== "same" && leftParts.identity && rightParts.identity) score *= IDENTITY_MISMATCH_FLOOR + .55 * trigramDice(leftParts.identity, rightParts.identity);
		if (leftParts.context && rightParts.context) score *= CONTEXT_MISMATCH_FLOOR + .19999999999999996 * trigramDice(leftParts.context, rightParts.context);
		return score;
	}
	function galleryTitleSimilarity(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn, creators = "unknown") {
		if (relationshipIsBlocked(sourceTitle, sourceTitleJpn, candidateTitle, candidateTitleJpn, creators)) return 0;
		const score = (left, right) => titleSimilarity(left, right, creators);
		const sources = [sourceTitle, sourceTitleJpn].filter(Boolean);
		const candidates = [candidateTitle, candidateTitleJpn].filter(Boolean);
		if (sources.length === 0 || candidates.length === 0) return 0;
		if (sources.length < 2 || candidates.length < 2) {
			let best = 0;
			for (const source of sources) for (const candidate of candidates) best = Math.max(best, score(source, candidate));
			return best;
		}
		const primary = score(sources[0], candidates[0]);
		const direct = [primary, score(sources[1], candidates[1])];
		const cross = [score(sources[0], candidates[1]), score(sources[1], candidates[0])];
		let best = primary;
		for (const pair of [direct, cross]) if (Math.min(...pair) >= .15) best = Math.max(best, (pair[0] + pair[1]) / 2);
		return best;
	}
	var ANTHOLOGY_TAG = "other:anthology";
	var CONTAINER_REQUIRED_SIMILARITY = .85;
	var EMPTY_PLAN = {
		containerTerms: [],
		containerNames: [],
		isContainerCandidate: false,
		chapterTerms: []
	};
	function tagValues(tags, namespace) {
		return tags.filter((tag) => tag.startsWith(`${namespace}:`)).map((tag) => normalizeTitleText(tag.slice(namespace.length + 1).replaceAll("_", " ")));
	}
	function fieldsOf(gallery) {
		return [gallery.title, gallery.titleJpn].filter(Boolean);
	}
	function inContainerChain(source) {
		return source.category === "Manga" || source.tags.includes("other:anthology");
	}
	function planContainerSearch(source, hasLetters, editionTerms) {
		if (!inContainerChain(source)) return EMPTY_PLAN;
		const containerTerms = [];
		const containerNames = [];
		let hasContext = false;
		const parodies = tagValues(source.tags, "parody");
		for (const value of fieldsOf(source)) {
			const { contextBlocks } = analyzeTitle(value);
			if (contextBlocks.length === 0) continue;
			hasContext = true;
			for (const block of contextBlocks) {
				const name = normalizeTitleText(block);
				if (!name || !hasLetters(block) || parodies.includes(name) || containerNames.includes(name)) continue;
				containerTerms.push(block);
				containerNames.push(name);
			}
		}
		const isContainerCandidate = !hasContext;
		const chapterTerms = [];
		if (isContainerCandidate) {
			for (const value of fieldsOf(source)) for (const segment of analyzeTitle(value).coreSegments) if (hasLetters(segment) && !editionTerms.includes(segment) && !chapterTerms.includes(segment)) chapterTerms.push(segment);
		}
		return {
			containerTerms,
			containerNames,
			isContainerCandidate,
			chapterTerms
		};
	}
	function matchContainers(containerNames, hits) {
		return hits.filter((hit) => fieldsOf(hit).some((value) => containerNames.some((wanted) => trigramDice(analyzeTitle(value).core, wanted) >= CONTAINER_REQUIRED_SIMILARITY)));
	}
	function matchExtractedChapters(source, hits) {
		const names = fieldsOf(source).map((value) => analyzeTitle(value).core).filter(Boolean);
		if (names.length === 0) return [];
		return hits.filter((hit) => fieldsOf(hit).some((value) => analyzeTitle(value).contextBlocks.some((block) => names.includes(normalizeTitleText(block)))));
	}
	var NON_LANGUAGE_TAGS = {
		translated: true,
		rewrite: true,
		speechless: true,
		"text cleaned": true
	};
	function languagesFromTags(tags) {
		const languages = [];
		for (const tag of tags) {
			if (!tag.startsWith("language:")) continue;
			const value = tag.slice(9).replaceAll("_", " ");
			if (!(value in NON_LANGUAGE_TAGS)) languages.push(value);
		}
		return languages;
	}
	function languageFromTitle(title) {
		const segments = parseTitleSegments(title);
		if (segments === null) return null;
		for (const segment of segments) {
			if (segment.kind !== "block") continue;
			const marker = markerOf(segment.text);
			if (marker?.lang) return marker.lang;
		}
		return null;
	}
	function detectLanguage(title, tags) {
		const [tagged] = languagesFromTags(tags);
		if (tagged) return tagged;
		const marked = languageFromTitle(title);
		if (marked) return marked;
		if (tags.length > 0 && !tags.includes("language:translated") && !tags.includes("language:rewrite")) return "japanese";
		return "unknown";
	}
	var BY_VALUE = Object.fromEntries([
		{
			value: "chinese",
			code: "中",
			name: {
				en: "Chinese",
				zh: "中文",
				ja: "中国語"
			}
		},
		{
			value: "japanese",
			code: "あ",
			name: {
				en: "Japanese",
				zh: "日文",
				ja: "日本語"
			}
		},
		{
			value: "english",
			code: "EN",
			name: {
				en: "English",
				zh: "英文",
				ja: "英語"
			}
		},
		{
			value: "korean",
			code: "한",
			name: {
				en: "Korean",
				zh: "韓文",
				ja: "韓国語"
			}
		},
		{
			value: "spanish",
			code: "ES",
			name: {
				en: "Spanish",
				zh: "西班牙文",
				ja: "スペイン語"
			}
		},
		{
			value: "russian",
			code: "RU",
			name: {
				en: "Russian",
				zh: "俄文",
				ja: "ロシア語"
			}
		},
		{
			value: "french",
			code: "FR",
			name: {
				en: "French",
				zh: "法文",
				ja: "フランス語"
			}
		},
		{
			value: "german",
			code: "DE",
			name: {
				en: "German",
				zh: "德文",
				ja: "ドイツ語"
			}
		},
		{
			value: "italian",
			code: "IT",
			name: {
				en: "Italian",
				zh: "義大利文",
				ja: "イタリア語"
			}
		},
		{
			value: "portuguese",
			code: "PT",
			name: {
				en: "Portuguese",
				zh: "葡萄牙文",
				ja: "ポルトガル語"
			}
		},
		{
			value: "thai",
			code: "TH",
			name: {
				en: "Thai",
				zh: "泰文",
				ja: "タイ語"
			}
		},
		{
			value: "vietnamese",
			code: "VI",
			name: {
				en: "Vietnamese",
				zh: "越南文",
				ja: "ベトナム語"
			}
		},
		{
			value: "polish",
			code: "PL",
			name: {
				en: "Polish",
				zh: "波蘭文",
				ja: "ポーランド語"
			}
		},
		{
			value: "hungarian",
			code: "HU",
			name: {
				en: "Hungarian",
				zh: "匈牙利文",
				ja: "ハンガリー語"
			}
		},
		{
			value: "dutch",
			code: "NL",
			name: {
				en: "Dutch",
				zh: "荷蘭文",
				ja: "オランダ語"
			}
		},
		{
			value: "indonesian",
			code: "ID",
			name: {
				en: "Indonesian",
				zh: "印尼文",
				ja: "インドネシア語"
			}
		},
		{
			value: "ukrainian",
			code: "UK",
			name: {
				en: "Ukrainian",
				zh: "烏克蘭文",
				ja: "ウクライナ語"
			}
		},
		{
			value: "turkish",
			code: "TR",
			name: {
				en: "Turkish",
				zh: "土耳其文",
				ja: "トルコ語"
			}
		},
		{
			value: "arabic",
			code: "AR",
			name: {
				en: "Arabic",
				zh: "阿拉伯文",
				ja: "アラビア語"
			}
		},
		{
			value: "czech",
			code: "CS",
			name: {
				en: "Czech",
				zh: "捷克文",
				ja: "チェコ語"
			}
		},
		{
			value: "greek",
			code: "EL",
			name: {
				en: "Greek",
				zh: "希臘文",
				ja: "ギリシャ語"
			}
		},
		{
			value: "finnish",
			code: "FI",
			name: {
				en: "Finnish",
				zh: "芬蘭文",
				ja: "フィンランド語"
			}
		},
		{
			value: "swedish",
			code: "SV",
			name: {
				en: "Swedish",
				zh: "瑞典文",
				ja: "スウェーデン語"
			}
		},
		{
			value: "norwegian",
			code: "NO",
			name: {
				en: "Norwegian",
				zh: "挪威文",
				ja: "ノルウェー語"
			}
		},
		{
			value: "danish",
			code: "DA",
			name: {
				en: "Danish",
				zh: "丹麥文",
				ja: "デンマーク語"
			}
		},
		{
			value: "romanian",
			code: "RO",
			name: {
				en: "Romanian",
				zh: "羅馬尼亞文",
				ja: "ルーマニア語"
			}
		},
		{
			value: "hebrew",
			code: "HE",
			name: {
				en: "Hebrew",
				zh: "希伯來文",
				ja: "ヘブライ語"
			}
		},
		{
			value: "hindi",
			code: "HI",
			name: {
				en: "Hindi",
				zh: "印地文",
				ja: "ヒンディー語"
			}
		},
		{
			value: "tagalog",
			code: "TL",
			name: {
				en: "Tagalog",
				zh: "他加祿文",
				ja: "タガログ語"
			}
		},
		{
			value: "mongolian",
			code: "MN",
			name: {
				en: "Mongolian",
				zh: "蒙古文",
				ja: "モンゴル語"
			}
		},
		{
			value: "esperanto",
			code: "EO",
			name: {
				en: "Esperanto",
				zh: "世界語",
				ja: "エスペラント"
			}
		},
		{
			value: "speechless",
			code: "…",
			name: {
				en: "Speechless",
				zh: "無言",
				ja: "無言"
			}
		},
		{
			value: "text cleaned",
			code: "□",
			name: {
				en: "Text cleaned",
				zh: "文字清除",
				ja: "文字消去"
			}
		},
		{
			value: "rewrite",
			code: "RW",
			name: {
				en: "Rewrite",
				zh: "重寫",
				ja: "リライト"
			}
		},
		{
			value: "unknown",
			code: "?",
			name: {
				en: "Unknown",
				zh: "未知",
				ja: "不明"
			}
		}
	].map((language) => [language.value, language]));
	function languageOf(value) {
		return BY_VALUE[value] ?? {
			value,
			code: value.slice(0, 3).toUpperCase(),
			name: {
				en: value,
				zh: value,
				ja: value
			}
		};
	}
	function workKeysOf(gallery) {
		const keys = [];
		for (const value of [gallery.title, gallery.titleJpn]) {
			if (!value) continue;
			for (const segment of analyzeTitle(value).coreSegments) for (const part of segment.split(" | ")) {
				const { phrase, counter } = readWorkText(normalizeTitleText(part));
				if (!phrase) continue;
				keys.push({
					phrase,
					counter
				});
			}
		}
		return keys;
	}
	function relationOf(source, hit) {
		const hitKeys = workKeysOf(hit);
		for (const left of workKeysOf(source)) if (hitKeys.some((right) => right.phrase === left.phrase && right.counter === left.counter)) return "edition";
		return "series";
	}
	var FLAG_TAGS = {
		"language:rewrite": "rewrite",
		"other:rough translation": "rough translation",
		"other:extraneous ads": "extraneous ads"
	};
	function editionFlags(tags) {
		const flags = [];
		for (const tag of tags) {
			const flag = FLAG_TAGS[tag.replaceAll("_", " ")];
			if (flag && !flags.includes(flag)) flags.push(flag);
		}
		return flags;
	}
	function dedupe(hits, excludeGid) {
		const seen = new Set([excludeGid]);
		const unique = [];
		for (const hit of hits) {
			if (seen.has(hit.gid)) continue;
			seen.add(hit.gid);
			unique.push(hit);
		}
		return unique;
	}
	function enrichHits(hits, metadata) {
		return hits.map((hit) => {
			const meta = metadata.get(hit.gid);
			if (!meta) return hit;
			return {
				...hit,
				title: meta.title || hit.title,
				titleJpn: meta.titleJpn,
				tags: meta.tags.length > 0 ? meta.tags : hit.tags,
				posted: meta.posted ?? hit.posted,
				thumb: meta.thumb || hit.thumb,
				rating: meta.rating ?? hit.rating
			};
		});
	}
	function counterNumber(counter) {
		let digits = "";
		for (const character of counter) if (character >= "0" && character <= "9") digits += character;
		else if (digits) break;
		if (digits) return Number(digits);
		return parseCjkNumeral(counter);
	}
	function orderOf(edition) {
		const halves = analyzeTitle(edition.hit.title || edition.hit.titleJpn).coreSegments.join(" ").split(" | ");
		let counter = readWorkText(halves[0]).counter;
		for (const half of halves.slice(1)) {
			if (counter) break;
			counter = readWorkText(half).counter;
		}
		return {
			number: counterNumber(counter),
			posted: edition.hit.posted ?? Number.MAX_SAFE_INTEGER
		};
	}
	function compareEditions(left, right) {
		const a = orderOf(left);
		const b = orderOf(right);
		if (a.number !== null && b.number !== null && a.number !== b.number) return a.number - b.number;
		return a.posted - b.posted;
	}
	function toEdition(hit, score) {
		return {
			hit,
			score,
			language: detectLanguage(hit.title, hit.tags),
			flags: editionFlags(hit.tags)
		};
	}
	function scoreEditions(source, hits, fixedRange = false) {
		const editions = [];
		const series = [];
		const related = [];
		for (const hit of hits) {
			if (hasAiGeneratedTag(hit.tags)) continue;
			const creators = creatorVerdict(source.tags, hit.tags);
			const titles = [
				source.title,
				source.titleJpn,
				hit.title,
				hit.titleJpn
			];
			const score = galleryTitleSimilarity(...titles, creators);
			const blocked = relationshipIsBlocked(...titles, creators);
			if (creators === "same" ? !blocked && sharesWorkPhrase(...titles) : score >= .5) (relationOf(source, hit) === "edition" ? editions : series).push(toEdition(hit, score));
			else if (!blocked && creatorsAgree(...titles, creators) && mentionsWork(...titles)) series.push(toEdition(hit, SIMILARITY_THRESHOLD));
			else if (fixedRange && creators === "same" && !blocked) related.push(toEdition(hit, score));
		}
		return {
			editions,
			series,
			related
		};
	}
	function numbersOf(text) {
		const numbers = [];
		let run = "";
		for (const character of text) if (character >= "0" && character <= "9") run += character;
		else if (run) {
			numbers.push(run);
			run = "";
		}
		if (run) numbers.push(run);
		return numbers;
	}
	function bookKeyOf(hit) {
		const parts = analyzeTitle(hit.title || hit.titleJpn);
		const halves = parts.coreSegments.join(" ").split(" | ");
		const head = readWorkText(halves[0]);
		let counter = head.counter;
		for (const half of halves.slice(1)) {
			if (counter) break;
			counter = readWorkText(half).counter;
		}
		return [
			parts.identity,
			normalizeMarkerText(head.phrase),
			counter,
			numbersOf(halves[0]).join("."),
			parts.wrapped.map(normalizeMarkerText).sort().join(".")
		].join("\0");
	}
	function groupReleases(editions) {
		const byBook = new Map();
		for (const edition of editions) {
			const key = bookKeyOf(edition.hit);
			const bucket = byBook.get(key) ?? [];
			bucket.push(edition);
			byBook.set(key, bucket);
		}
		return [...byBook.values()].map((releases) => ({ releases: [...releases].sort(compareEditions) })).sort((left, right) => compareEditions(left.releases[0], right.releases[0]));
	}
	function groupByLanguage(editions, priority) {
		const byLanguage = new Map();
		for (const edition of editions) {
			const bucket = byLanguage.get(edition.language) ?? [];
			bucket.push(edition);
			byLanguage.set(edition.language, bucket);
		}
		const rank = (language) => {
			const index = priority.indexOf(language);
			return index === -1 ? priority.length : index;
		};
		return [...byLanguage.entries()].map(([language, items]) => ({
			language: languageOf(language),
			books: groupReleases(items)
		})).sort((a, b) => rank(a.language.value) - rank(b.language.value) || b.books.length - a.books.length);
	}
	var TTL_MS = 864e5;
	var FAMILY = "ehl_cache_";
	var PREFIX = `${FAMILY}d6ed0c2b658c_`;
	var REVISION_MARK = "#";
	var MISSING = { state: "missing" };
	var UNUSABLE = { state: "unusable" };
	var snapshot = null;
	var writeSequence = 0;
	function newestFirst(left, right) {
		if (left.at !== right.at) return right.at - left.at;
		if (left.key === right.key) return 0;
		return left.key > right.key ? -1 : 1;
	}
	function store() {
		snapshot ??= scan();
		return snapshot;
	}
	async function scan() {
		const revisions = new Map();
		const foreign = [];
		for (const key of await storageKeys()) {
			if (!key.startsWith(FAMILY)) continue;
			const parsed = readKey(key);
			if (!parsed) {
				foreign.push(key);
				continue;
			}
			const known = revisions.get(parsed.logical);
			if (known) known.push({
				key,
				at: parsed.at
			});
			else revisions.set(parsed.logical, [{
				key,
				at: parsed.at
			}]);
		}
		for (const list of revisions.values()) list.sort(newestFirst);
		return {
			revisions,
			foreign
		};
	}
	function readKey(key) {
		if (!key.startsWith(PREFIX)) return null;
		const mark = key.lastIndexOf(REVISION_MARK);
		if (mark <= PREFIX.length) return null;
		const at = Number.parseInt(key.slice(mark + 1), 10);
		if (!Number.isFinite(at)) return null;
		return {
			logical: key.slice(PREFIX.length, mark),
			at
		};
	}
	function isEnvelope(value) {
		return typeof value === "object" && value !== null && "at" in value && typeof value.at === "number" && Number.isFinite(value.at) && "data" in value;
	}
	function isFresh(at) {
		const age = Date.now() - at;
		return age >= 0 && age <= TTL_MS;
	}
	async function readRevision(key) {
		const raw = await storageGet(key);
		if (!raw) return MISSING;
		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return UNUSABLE;
		}
		if (!isEnvelope(parsed)) return UNUSABLE;
		if (!isFresh(parsed.at)) return UNUSABLE;
		return {
			state: "usable",
			at: parsed.at,
			data: parsed.data
		};
	}
	async function discard$1(current, logical, key) {
		await storageRemove(key);
		const alive = (current.revisions.get(logical) ?? []).filter((revision) => revision.key !== key);
		if (alive.length === 0) current.revisions.delete(logical);
		else current.revisions.set(logical, alive);
	}
	async function cacheGet(key, validate) {
		const current = await store();
		for (const revision of current.revisions.get(key) ?? []) {
			const record = await readRevision(revision.key);
			if (record.state === "missing") continue;
			if (record.state === "usable") {
				const value = record.data;
				if (validate(value)) return {
					data: value,
					at: record.at
				};
			}
			await discard$1(current, key, revision.key);
		}
		return null;
	}
	async function cacheSet(key, data) {
		const at = Date.now();
		const physical = `${PREFIX}${key}${REVISION_MARK}${at}-${(++writeSequence).toString(36).padStart(11, "0")}-${crypto.randomUUID()}`;
		const current = await store();
		let payload;
		try {
			payload = JSON.stringify({
				at,
				data
			});
		} catch (error) {
			console.warn("[EhHyperlink] cache write skipped", error);
			return;
		}
		await storageSet(physical, payload);
		const previous = current.revisions.get(key) ?? [];
		const next = {
			key: physical,
			at
		};
		const newer = previous.filter((revision) => newestFirst(revision, next) < 0);
		current.revisions.set(key, [...newer, next]);
		for (const revision of previous) {
			if (newestFirst(revision, next) < 0) continue;
			await discard$1(current, key, revision.key);
		}
	}
	async function sweepCache() {
		const current = await store();
		for (const key of current.foreign.splice(0)) if ((await readRevision(key)).state === "unusable") await storageRemove(key);
		for (const [logical, revisions] of [...current.revisions]) {
			let kept = false;
			for (const revision of revisions) {
				if (kept) {
					await discard$1(current, logical, revision.key);
					continue;
				}
				const record = await readRevision(revision.key);
				if (record.state === "usable") {
					kept = true;
					continue;
				}
				if (record.state === "unusable") await discard$1(current, logical, revision.key);
			}
		}
	}
	var SEARCH_INTERVAL_MS = 1e3;
	var METADATA_INTERVAL_MS = 1e3;
	var METADATA_PAUSE_MS = 5e3;
	function pause$1(ms) {
		const { promise, resolve } = Promise.withResolvers();
		setTimeout(resolve, ms);
		return promise;
	}
	function createThrottle({ intervalMs, pauseEvery, pauseMs }) {
		let lastAt = 0;
		let sent = 0;
		return { async next() {
			const wait = (pauseEvery !== void 0 && pauseMs !== void 0 && sent > 0 && sent % pauseEvery === 0 ? pauseMs : intervalMs) - (Date.now() - lastAt);
			if (wait > 0) await pause$1(wait);
			lastAt = Date.now();
			sent += 1;
		} };
	}
	var searchThrottle = createThrottle({ intervalMs: SEARCH_INTERVAL_MS });
	var metadataThrottle = createThrottle({
		intervalMs: METADATA_INTERVAL_MS,
		pauseEvery: 4,
		pauseMs: METADATA_PAUSE_MS
	});
	function isRecord(value) {
		return typeof value === "object" && value !== null;
	}
	function isStrings(value) {
		return Array.isArray(value) && value.every((entry) => typeof entry === "string");
	}
	function isOptionalString(value) {
		return value === void 0 || typeof value === "string";
	}
	function isGalleryId(value) {
		return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
	}
	function isNullableNumber(value) {
		return value === null || typeof value === "number" && Number.isFinite(value);
	}
	function isRating(value) {
		return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 5;
	}
	function isNullableRating(value) {
		return value === null || isRating(value);
	}
	function isNullableString(value) {
		return value === null || typeof value === "string";
	}
	function isOptionalStrings(value) {
		return value === void 0 || isStrings(value);
	}
	var MAX_ATTEMPTS = 3;
	var DEADLINE_MS = 3e4;
	var FIRST_BACKOFF_MS = 1e3;
	var TRANSIENT_STATUS = [
		408,
		500,
		502,
		503,
		504
	];
	var RESTRICTED_STATUS = [
		401,
		403,
		429
	];
	var BODY_READERS = [
		"text",
		"json",
		"arrayBuffer",
		"blob",
		"formData"
	];
	var RequestError = class extends Error {
		kind;
		status;
		attempts = 1;
		retryAt;
		constructor(kind, message, status) {
			super(message);
			this.kind = kind;
			this.status = status;
			this.name = "RequestError";
		}
	};
	function stopsRequests(error) {
		if (error.kind === "invalid-response") return true;
		if (error.kind !== "http") return false;
		if (RESTRICTED_STATUS.includes(error.status ?? 0)) return true;
		return (error.retryAt ?? 0) > Date.now();
	}
	function worthRepeating(error) {
		if (error.kind === "network") return true;
		if (error.kind === "timeout") return true;
		if (error.kind === "http") return TRANSIENT_STATUS.includes(error.status ?? 0);
		return false;
	}
	var cooldown = new Map();
	function pause(ms) {
		const { promise, resolve } = Promise.withResolvers();
		setTimeout(resolve, ms);
		return promise;
	}
	function transportError(error) {
		if (error instanceof RequestError) return error;
		const name = isRecord(error) ? error.name : void 0;
		const detail = error instanceof Error ? error.message : String(error);
		if (name === "AbortError") return new RequestError("timeout", `no answer within ${DEADLINE_MS}ms`);
		if (name === "TypeError") return new RequestError("network", `request failed: ${detail}`);
		return new RequestError("invalid-response", `request failed: ${detail}`);
	}
	function isAbortError(error) {
		return isRecord(error) && error.name === "AbortError";
	}
	function watchBody(response) {
		return new Proxy(response, { get(target, key) {
			const value = Reflect.get(target, key, target);
			if (typeof value !== "function") return value;
			const call = value;
			if (typeof key !== "string") return call.bind(target);
			if (!BODY_READERS.includes(key)) return call.bind(target);
			return async (...args) => {
				try {
					return await call.apply(target, args);
				} catch (error) {
					throw transportError(error);
				}
			};
		} });
	}
	function retryAfterMs(response) {
		const header = response.headers.get("Retry-After");
		if (header === null) return null;
		const text = header.trim();
		if (text === "") return null;
		const seconds = Number(text);
		if (Number.isFinite(seconds)) {
			if (seconds < 0) return null;
			return seconds * 1e3;
		}
		const at = Date.parse(text);
		if (Number.isNaN(at)) return null;
		return Math.max(0, at - Date.now());
	}
	function retryDelay(asked, backoffMs) {
		if (asked === null) return backoffMs;
		if (asked > DEADLINE_MS) return null;
		return Math.max(asked, backoffMs);
	}
	function discard(response) {
		try {
			response.body?.cancel().catch(() => {});
		} catch {}
	}
	async function exchange(url, init, read) {
		let response;
		try {
			response = await fetch(url, init);
		} catch (error) {
			throw transportError(error);
		}
		if (!response.ok) {
			discard(response);
			const asked = retryAfterMs(response);
			const error = new RequestError("http", `HTTP ${response.status}`, response.status);
			if (asked !== null) error.retryAt = Date.now() + asked;
			return {
				kind: "failed",
				error,
				retryAfterMs: asked
			};
		}
		try {
			return {
				kind: "answered",
				data: await read(watchBody(response))
			};
		} catch (error) {
			if (error instanceof RequestError) throw error;
			if (isAbortError(error)) throw new RequestError("timeout", `body unfinished within ${DEADLINE_MS}ms`);
			throw error;
		}
	}
	async function attempt(url, init, read) {
		const controller = new AbortController();
		const expiry = Promise.withResolvers();
		const timer = setTimeout(() => {
			controller.abort();
			expiry.reject(new RequestError("timeout", `no answer within ${DEADLINE_MS}ms`));
		}, DEADLINE_MS);
		try {
			return await Promise.race([exchange(url, {
				...init,
				signal: controller.signal
			}, read), expiry.promise]);
		} catch (error) {
			if (error instanceof RequestError) return {
				kind: "failed",
				error,
				retryAfterMs: null
			};
			throw error;
		} finally {
			clearTimeout(timer);
			controller.abort();
		}
	}
	async function request(url, init, throttle, read) {
		let origin = url;
		try {
			origin = new URL(url).origin;
		} catch {}
		let attempts = 0;
		let backoffMs = FIRST_BACKOFF_MS;
		for (;;) {
			const holding = cooldown.get(origin);
			if (holding !== void 0) {
				const remainingMs = holding.until - Date.now();
				if (remainingMs > DEADLINE_MS) {
					const error = new RequestError("http", `host asked to wait ${remainingMs}ms`, holding.status);
					error.attempts = attempts;
					error.retryAt = holding.until;
					throw error;
				}
				if (remainingMs > 0) await pause(remainingMs);
				cooldown.delete(origin);
			}
			attempts += 1;
			await throttle.next();
			const outcome = await attempt(url, init, read);
			if (outcome.kind === "answered") return {
				data: outcome.data,
				attempts
			};
			const error = outcome.error;
			error.attempts = attempts;
			if (error.retryAt !== void 0) cooldown.set(origin, {
				until: error.retryAt,
				status: error.status ?? 0
			});
			if (!worthRepeating(error)) throw error;
			if (attempts >= MAX_ATTEMPTS) throw error;
			const waitMs = retryDelay(outcome.retryAfterMs, backoffMs);
			if (waitMs === null) throw error;
			await pause(waitMs);
			backoffMs *= 2;
		}
	}
	var API_URL = "https://api.e-hentai.org/api.php";
	function isApiEntry(value) {
		return isRecord(value) && isGalleryId(value.gid) && typeof value.title === "string" && value.error === void 0 && isOptionalString(value.title_jpn) && isOptionalString(value.category) && isOptionalStrings(value.tags);
	}
	function isMetadataBody(value) {
		return isRecord(value) && Array.isArray(value.gmetadata) && !("error" in value);
	}
	function isGalleryMetadata(value) {
		if (!isRecord(value)) return false;
		if (!isGalleryId(value.gid)) return false;
		for (const field of [
			"title",
			"titleJpn",
			"category",
			"thumb"
		]) if (typeof value[field] !== "string") return false;
		if (!isStrings(value.tags)) return false;
		if (!isNullableNumber(value.posted)) return false;
		return isNullableRating(value.rating);
	}
	var decoder = null;
	function decodeEntities(value) {
		if (!value.includes("&")) return value;
		decoder ??= document.createElement("textarea");
		decoder.innerHTML = value;
		return decoder.value;
	}
	function readPosted(value) {
		const seconds = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
		return Number.isFinite(seconds) ? seconds : null;
	}
	function readRating(value) {
		const rating = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
		return isRating(rating) ? rating : null;
	}
	function parseMetadataResponse(body) {
		if (!isMetadataBody(body)) throw new RequestError("invalid-response", "Expected gallery metadata");
		const entries = [];
		for (const raw of body.gmetadata) {
			if (!isApiEntry(raw)) continue;
			entries.push({
				gid: raw.gid,
				title: decodeEntities(raw.title),
				titleJpn: decodeEntities(raw.title_jpn ?? ""),
				category: raw.category ?? "",
				posted: readPosted(raw.posted),
				thumb: typeof raw.thumb === "string" ? raw.thumb : "",
				rating: readRating(raw.rating),
				tags: raw.tags ?? []
			});
		}
		return entries;
	}
	async function requestChunk(refs) {
		return request(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				method: "gdata",
				gidlist: refs.map((ref) => [ref.gid, ref.token]),
				namespace: 1
			})
		}, metadataThrottle, async (response) => {
			let body;
			try {
				body = await response.json();
			} catch (error) {
				if (error instanceof SyntaxError) throw new RequestError("invalid-response", "Invalid metadata JSON");
				throw error;
			}
			return parseMetadataResponse(body);
		});
	}
	async function fetchGalleryMetadata(refs, force = false) {
		const metadata = new Map();
		const requests = [];
		const missing = [];
		let oldest = Number.POSITIVE_INFINITY;
		for (const ref of refs) {
			const cached = force ? null : await cacheGet(`gid:${ref.gid}`, isGalleryMetadata);
			if (cached) {
				metadata.set(ref.gid, cached.data);
				oldest = Math.min(oldest, cached.at);
			} else missing.push(ref);
		}
		for (let index = 0; index < missing.length; index += 25) {
			const chunk = missing.slice(index, index + 25);
			const entry = {
				kind: "metadata",
				url: API_URL,
				galleries: chunk.length,
				attempts: 0,
				failedGalleries: chunk.length
			};
			requests.push(entry);
			try {
				const response = await requestChunk(chunk);
				entry.attempts = response.attempts;
				const expected = new Set(chunk.map((ref) => ref.gid));
				const accepted = response.data.filter((item) => expected.has(item.gid));
				for (const item of accepted) metadata.set(item.gid, item);
				entry.failedGalleries = chunk.filter((ref) => !metadata.has(ref.gid)).length;
				for (const item of accepted) await cacheSet(`gid:${item.gid}`, item);
				oldest = Math.min(oldest, Date.now());
			} catch (error) {
				if (!(error instanceof RequestError)) throw error;
				entry.error = error;
				entry.attempts = error.attempts;
				if (stopsRequests(error)) break;
			}
		}
		return {
			metadata,
			requests,
			fromCache: refs.length - missing.length,
			oldestAt: Number.isFinite(oldest) ? oldest : Date.now()
		};
	}
	function searchUrl(origin, query, visibility = "published") {
		return `${origin}/?f_cats=0${visibility === "expunged" ? "&f_sh=on" : ""}&f_search=${encodeURIComponent(query)}`;
	}
	function postedSeconds(cell) {
		const text = cell?.textContent?.trim();
		if (!text) return null;
		const parsed = Date.parse(`${text.replace(" ", "T")}Z`);
		return Number.isFinite(parsed) ? Math.round(parsed / 1e3) : null;
	}
	function isEmptySearch(root) {
		return root.querySelector("#searchbox input[name=\"f_search\"]") !== null && root.querySelector("#toppane + div > p")?.textContent?.trim() === "No hits found";
	}
	function isSearchPage(root) {
		return root.querySelector(".itg") !== null || isEmptySearch(root);
	}
	function isSearchHit(value) {
		if (!isRecord(value)) return false;
		if (!isGalleryId(value.gid)) return false;
		for (const field of [
			"token",
			"href",
			"title",
			"titleJpn",
			"category",
			"thumb"
		]) if (typeof value[field] !== "string") return false;
		if (!isStrings(value.tags)) return false;
		if (!isNullableNumber(value.pages)) return false;
		if (!isNullableNumber(value.posted)) return false;
		if (!isNullableRating(value.rating)) return false;
		return isNullableString(value.torrentHref);
	}
	function isSearchHits(value) {
		return Array.isArray(value) && value.every(isSearchHit);
	}
	function parseSearchResults(html) {
		const root = new DOMParser().parseFromString(html, "text/html");
		if (!isSearchPage(root)) throw new RequestError("invalid-response", "Expected a search results page");
		const rows = root.querySelectorAll(".itg > tbody > tr, .itg > tr, .itg .gl1t");
		const hits = [];
		for (const row of rows) {
			const titleElement = row.querySelector(".glink");
			if (!titleElement) continue;
			const href = row.querySelector(".glname a, .gl1e a, .gl2e a, .gl1t > a, a[href*=\"/g/\"]")?.getAttribute("href") ?? "";
			const ref = galleryRef(href);
			if (ref === null) continue;
			const pages = [...row.querySelectorAll("div")].filter((element) => element.children.length === 0).map((element) => pageCount(element.textContent ?? "")).find((count) => count !== null) ?? null;
			const torrent = row.querySelector(".gldown a");
			hits.push({
				gid: ref.gid,
				token: ref.token,
				href,
				title: titleElement.textContent?.trim() ?? "",
				titleJpn: "",
				category: readCategory(row.querySelector(".cn, .cs")),
				tags: [...row.querySelectorAll(".gt, .gtl")].map((element) => element.getAttribute("title") ?? "").filter(Boolean),
				pages,
				posted: postedSeconds(row.querySelector(`#posted_${ref.gid}, #postedpop_${ref.gid}`)),
				thumb: "",
				rating: null,
				torrentHref: torrent?.getAttribute("href") ?? null
			});
		}
		return hits;
	}
	async function fetchSearch(origin, query, visibility = "published", force = false) {
		const url = searchUrl(origin, query, visibility);
		const cached = force ? null : await cacheGet(url, isSearchHits);
		if (cached) return {
			request: {
				kind: "search",
				url,
				term: query,
				hitCount: cached.data.length,
				cached: true,
				attempts: 0
			},
			hits: cached.data,
			at: cached.at
		};
		try {
			const response = await request(url, { credentials: "same-origin" }, searchThrottle, async (response) => parseSearchResults(await response.text()));
			await cacheSet(url, response.data);
			return {
				request: {
					kind: "search",
					url,
					term: query,
					hitCount: response.data.length,
					attempts: response.attempts
				},
				hits: response.data,
				at: Date.now()
			};
		} catch (error) {
			if (!(error instanceof RequestError)) throw error;
			return {
				request: {
					kind: "search",
					url,
					term: query,
					hitCount: null,
					attempts: error.attempts,
					error
				},
				hits: [],
				at: Date.now()
			};
		}
	}
	function requestFailed(entry) {
		if (entry.error) return true;
		return entry.kind === "metadata" ? entry.failedGalleries > 0 : false;
	}
	function requestStopsRun(entry) {
		return entry.error ? stopsRequests(entry.error) : false;
	}
	function completedSearch(entry) {
		return entry.kind === "search" && !entry.error;
	}
	function resultStatus(requests) {
		if (!requests.some(requestFailed)) return "complete";
		return requests.some(completedSearch) ? "partial" : "failed";
	}
	var HAN_PAIR = compile(han.times(2));
	var CJK = compile(cjkLetter);
	var HAS_LETTER = compile(letter);
	var SLICE = 2;
	function fragmentsOf(phrase) {
		const text = phrase.trim();
		if (!text || !HAS_LETTER.test(text)) return [];
		if (CJK.test(text)) return text.length < 4 ? [text] : unique(cjkSlices(text));
		const tokens = text.split(whitespaceRun).filter(Boolean);
		return tokens.length < 2 ? [text] : unique(tokenSlices(tokens));
	}
	function unique(slices) {
		return [...new Set(slices.filter(Boolean))];
	}
	var UNINDEXED = new Set([
		"a",
		"an",
		"ai",
		"to",
		"the",
		"and",
		"so",
		"on",
		"of",
		"in",
		"small",
		"big",
		"huge",
		"gigantic"
	]);
	function indexable(token) {
		return !UNINDEXED.has(token.toLowerCase());
	}
	function tokenSlices(tokens) {
		const usable = tokens.filter((token) => indexable(token) && token.length >= SLICE);
		if (usable.length === 0) return [tokens.join(" ")];
		const half = Math.ceil(usable.length / 2);
		return [longest(usable.slice(0, half)), longest(usable.slice(half))];
	}
	function longest(tokens) {
		return tokens.reduce((best, token) => token.length > best.length ? token : best, "");
	}
	function cjkSlices(text) {
		const half = Math.max(SLICE, Math.floor(text.length / 2));
		const lead = text.slice(0, half);
		const trail = text.slice(-half);
		return [firstHanPair(lead) ?? lead.slice(0, SLICE), lastHanPair(trail) ?? trail.slice(-2)];
	}
	function firstHanPair(text) {
		for (let index = 0; index + SLICE <= text.length; index += 1) {
			const pair = text.slice(index, index + SLICE);
			if (HAN_PAIR.test(pair)) return pair;
		}
		return null;
	}
	function lastHanPair(text) {
		for (let index = text.length - SLICE; index >= 0; index -= 1) {
			const pair = text.slice(index, index + SLICE);
			if (HAN_PAIR.test(pair)) return pair;
		}
		return null;
	}
	var CREATOR_SCOPES = {
		artist: "a",
		group: "g"
	};
	function clauseOf(tag) {
		const colon = tag.indexOf(":");
		const prefix = CREATOR_SCOPES[tag.slice(0, colon)];
		return prefix ? `${prefix}:"${tag.slice(colon + 1).replaceAll("_", " ")}$"` : null;
	}
	function soleCreatorScope(tags) {
		const artists = tags.filter((tag) => tag.startsWith("artist:"));
		const groups = tags.filter((tag) => tag.startsWith("group:"));
		if (artists.length === 1) return clauseOf(artists[0]);
		if (artists.length === 0 && groups.length === 1) return clauseOf(groups[0]);
		return null;
	}
	function creatorScope(tags) {
		const clauses = tags.map(clauseOf).filter((clause) => clause !== null);
		if (clauses.length <= 1) return clauses.join("");
		return clauses.map((clause) => `~${clause}`).join(" ");
	}
	var COSPLAYER_PREFIX = "cosplayer:";
	function cosplayerTags(tags) {
		const names = [];
		for (const tag of tags) {
			if (!tag.startsWith(COSPLAYER_PREFIX)) continue;
			const name = tag.slice(10).replaceAll("_", " ");
			if (!name) continue;
			if (!names.includes(name)) names.push(name);
		}
		return names;
	}
	var REALPORN_TAG = "other:realporn";
	var REALPORN_CLAUSE = "other:\"realporn$\"";
	var LETTER_RE = compile(letter);
	function editionTermsOf(coreSegment, keepCounter = false) {
		return coreSegment.split(" | ").map((part) => keepCounter ? part.trim() : readWorkText(part).phrase).filter((part) => LETTER_RE.test(part));
	}
	function fieldTerms(value, keepCounter) {
		const parts = analyzeTitle(value);
		const terms = [];
		for (const segment of parts.coreSegments) for (const term of editionTermsOf(segment, keepCounter)) if (!terms.includes(term)) terms.push(term);
		return {
			terms,
			identityBlocks: parts.identityBlocks,
			balanced: parts.balanced
		};
	}
	function planSearch(source) {
		const visibility = source.tags.includes(REALPORN_TAG) ? "expunged" : "published";
		const cosplayers = cosplayerTags(source.tags);
		if (cosplayers.length > 0) return directPlan("cosplayer", cosplayers.map((name) => `${COSPLAYER_PREFIX}"${name}$"`), visibility);
		const anthology = source.tags.includes(ANTHOLOGY_TAG);
		const roman = source.title ? fieldTerms(source.title, anthology) : {
			terms: [],
			identityBlocks: [],
			balanced: true
		};
		const japanese = source.titleJpn ? fieldTerms(source.titleJpn, anthology) : {
			terms: [],
			identityBlocks: [],
			balanced: true
		};
		if (visibility === "expunged") {
			const identities = [...new Set([...roman.identityBlocks, ...japanese.identityBlocks])];
			return directPlan("realporn", identities.length > 0 ? identities : sliceTerms(japanese, roman), visibility);
		}
		const phrases = [];
		for (const term of [...roman.terms, ...japanese.terms]) if (!phrases.includes(term)) phrases.push(term);
		const sole = anthology ? null : soleCreatorScope(source.tags);
		const slices = sole ? sliceTerms(japanese, roman) : [];
		return {
			mode: "work",
			visibility: "published",
			editionTerms: slices.length > 0 ? slices : phrases,
			scope: anthology ? "" : sole ?? creatorScope(source.tags),
			fixedRange: sole !== null && slices.length > 0,
			...planContainerSearch(source, (text) => LETTER_RE.test(text), phrases)
		};
	}
	function directPlan(mode, editionTerms, visibility) {
		return {
			mode,
			visibility,
			editionTerms,
			scope: "",
			fixedRange: false,
			containerTerms: [],
			containerNames: [],
			chapterTerms: [],
			isContainerCandidate: false
		};
	}
	function queryOf(plan, term) {
		const clauses = [plan.mode === "cosplayer" ? term : `title:"${term}"`];
		if (plan.scope) clauses.push(plan.scope);
		if (plan.visibility === "expunged") clauses.push(REALPORN_CLAUSE);
		return clauses.join(" ");
	}
	function sliceTerms(japanese, roman) {
		const fromJpn = japanese.balanced ? fragmentsOf(japanese.terms[0] ?? "") : [];
		const fromRoman = roman.balanced ? fragmentsOf(roman.terms[0] ?? "") : [];
		const left = fromJpn[0];
		const right = fromRoman.at(-1);
		if (left === void 0) return fromRoman;
		if (right === void 0) return fromJpn;
		return [...new Set([left, right])];
	}
	function fullTitles(gallery) {
		return [gallery.title, gallery.titleJpn].map(normalizeMarkerText).filter(Boolean);
	}
	function selectDiscoveries(source, hits) {
		const isCosplayerSource = cosplayerTags(source.tags).length > 0;
		const sourceTitles = new Set(isCosplayerSource ? fullTitles(source) : []);
		const seen = new Set([source.gid]);
		const selected = [];
		for (const hit of hits) {
			if (seen.has(hit.gid)) continue;
			seen.add(hit.gid);
			if (isCosplayerSource) {
				if (fullTitles(hit).some((title) => sourceTitles.has(title))) continue;
			}
			selected.push(hit);
		}
		return selected;
	}
	async function findEditions(source, origin, priority, { force = false, onProgress, onResult } = {}) {
		const plan = planSearch(source);
		sweepCache().catch(() => {});
		if (hasAiGeneratedTag(source.tags)) return {
			plan,
			status: "complete",
			requests: [],
			metadataFromCache: 0,
			dataAt: Date.now(),
			editions: [],
			series: [],
			related: [],
			chapters: [],
			containers: []
		};
		let done = 0;
		let total = plan.editionTerms.length + plan.containerTerms.length;
		const requests = [];
		const search = async (terms) => {
			const pages = [];
			for (const term of terms) {
				if (requests.some(requestStopsRun)) break;
				const page = await fetchSearch(origin, queryOf(plan, term), plan.visibility, force);
				pages.push(page);
				requests.push(page.request);
				done += 1;
				onProgress?.({
					done,
					total
				});
			}
			return pages;
		};
		const loadMetadata = async (hits) => {
			if (requests.some(requestStopsRun)) return {
				metadata: new Map(),
				requests: [],
				fromCache: 0,
				oldestAt: Date.now()
			};
			return fetchGalleryMetadata(hits.map(({ gid, token }) => ({
				gid,
				token
			})), force);
		};
		onProgress?.({
			done,
			total
		});
		const containerPages = await search(plan.containerTerms);
		const containerHits = dedupe(containerPages.flatMap((page) => page.hits), source.gid);
		const containerMeta = await loadMetadata(containerHits);
		const metadata = containerMeta.metadata;
		requests.push(...containerMeta.requests);
		const containers = matchContainers(plan.containerNames, enrichHits(containerHits, metadata));
		if (plan.containerTerms.length > 0) onResult?.({
			plan,
			status: resultStatus(requests),
			requests: [...requests],
			metadataFromCache: containerMeta.fromCache,
			dataAt: Math.min(containerMeta.oldestAt, ...containerPages.map((page) => page.at)),
			editions: [],
			series: [],
			related: [],
			chapters: [],
			containers
		});
		const editionPages = await search(plan.editionTerms);
		const sourceOnEveryFirstPage = editionPages.length > 0 && editionPages.every((page) => page.hits.some((hit) => hit.gid === source.gid));
		let chapterPages = [];
		if (!sourceOnEveryFirstPage) {
			total += plan.chapterTerms.length;
			onProgress?.({
				done,
				total
			});
			chapterPages = await search(plan.chapterTerms);
		}
		const candidates = dedupe([...editionPages, ...chapterPages].flatMap((page) => page.hits), source.gid);
		const meta = await loadMetadata(candidates.filter((candidate) => !metadata.has(candidate.gid)));
		for (const [gid, entry] of meta.metadata) metadata.set(gid, entry);
		requests.push(...meta.requests);
		const metadataFromCache = containerMeta.fromCache + meta.fromCache;
		const searchPages = [
			...containerPages,
			...editionPages,
			...chapterPages
		];
		const enriched = enrichHits(candidates, metadata);
		const chapters = plan.isContainerCandidate ? matchExtractedChapters(source, enriched) : [];
		const chapterGids = new Set(chapters.map((hit) => hit.gid));
		const { editions, series, related } = plan.mode === "work" ? scoreEditions(source, enriched.filter((hit) => !chapterGids.has(hit.gid)), plan.fixedRange) : {
			editions: [],
			series: [],
			related: selectDiscoveries(source, enriched).map((hit) => toEdition(hit, null))
		};
		const dataAt = Math.min(containerMeta.oldestAt, meta.oldestAt, ...searchPages.map((page) => page.at));
		return {
			plan,
			status: resultStatus(requests),
			requests,
			metadataFromCache,
			dataAt: Number.isFinite(dataAt) ? dataAt : Date.now(),
			editions: groupByLanguage(editions, priority),
			series: groupByLanguage(series, priority),
			related: groupByLanguage(related, priority),
			chapters: groupByLanguage(chapters.map((hit) => toEdition(hit, null)), priority),
			containers
		};
	}
	var _hoisted_1 = {
		class: "ehl-box",
		translate: "no"
	};
	var _hoisted_2 = { class: "ehl-tabs" };
	var _hoisted_3 = ["title"];
	var _hoisted_4 = { class: "ehl-list" };
	var _hoisted_5 = { class: "ehl-head ehl-asof" };
	var _hoisted_6 = { key: 0 };
	var _hoisted_7 = { key: 1 };
	var _hoisted_8 = ["disabled", "title"];
	var _hoisted_9 = {
		key: 0,
		class: "ehl-section"
	};
	var _hoisted_10 = { class: "ehl-head" };
	var _hoisted_11 = { class: "ehl-count" };
	var _hoisted_12 = ["href"];
	var _hoisted_13 = { class: "ehl-subtitle" };
	var _hoisted_14 = { class: "ehl-facts" };
	var _hoisted_15 = ["title"];
	var _hoisted_16 = {
		key: 1,
		class: "ehl-meta"
	};
	var _hoisted_17 = {
		key: 2,
		class: "ehl-meta"
	};
	var _hoisted_18 = {
		key: 3,
		class: "ehl-meta"
	};
	var _hoisted_19 = {
		key: 1,
		class: "ehl-section"
	};
	var _hoisted_20 = { class: "ehl-head" };
	var _hoisted_21 = { class: "ehl-count" };
	var _hoisted_22 = { class: "ehl-url" };
	var _hoisted_23 = { class: "ehl-subtitle" };
	var _hoisted_24 = {
		key: 0,
		class: "ehl-subtitle"
	};
	var _hoisted_25 = {
		key: 1,
		class: "ehl-subtitle"
	};
	var _hoisted_26 = {
		key: 2,
		class: "ehl-subtitle"
	};
	var _hoisted_27 = {
		key: 2,
		class: "ehl-head"
	};
	var _hoisted_28 = {
		key: 3,
		class: "ehl-head"
	};
	var _hoisted_29 = {
		key: 4,
		class: "ehl-head"
	};
	var _hoisted_30 = {
		key: 1,
		class: "ehl-status"
	};
	var _hoisted_31 = ["onMouseenter"];
	var _hoisted_32 = [
		"title",
		"aria-label",
		"onClick"
	];
	var _hoisted_33 = ["title"];
	var _hoisted_34 = { class: "ehl-list" };
	var _hoisted_35 = ["href"];
	var _hoisted_36 = {
		key: 0,
		class: "ehl-subtitle"
	};
	var _hoisted_37 = {
		key: 0,
		class: "ehl-facts"
	};
	var _hoisted_38 = { class: "ehl-meta" };
	var _hoisted_39 = { class: "ehl-unit" };
	var _hoisted_40 = ["title"];
	var App_default = defineComponent({
		__name: "App",
		setup(__props) {
			const state = ref("searching");
			const result = ref(null);
			const progress = ref(null);
			const pinned = ref(null);
			const hovered = ref(null);
			const open = computed(() => pinned.value ?? hovered.value);
			const source = ref(null);
			async function run(force) {
				const gallery = source.value;
				if (!gallery) return;
				state.value = "searching";
				progress.value = null;
				try {
					const found = await findEditions(gallery, location.origin, LANGUAGE_PRIORITY[locale], {
						force,
						onProgress: (next) => progress.value = next,
						onResult: (next) => result.value = next
					});
					result.value = found;
					state.value = found.status === "failed" ? "failed" : hasNoSearchTerms(found) ? "noTitle" : "done";
				} catch (error) {
					console.error("[EhHyperlink]", error);
					state.value = "failed";
				} finally {
					progress.value = null;
				}
			}
			function hasNoSearchTerms(found) {
				return found.plan.editionTerms.length === 0 && found.plan.containerTerms.length === 0;
			}
			const FAILURE_MESSAGES = {
				network: "networkFailed",
				timeout: "requestTimedOut",
				http: "httpFailed",
				"invalid-response": "invalidResponse"
			};
			const hasActivity = computed(() => {
				if (result.value !== null) return true;
				return state.value === "failed";
			});
			onMounted(async () => {
				source.value = readSourceGallery();
				if (!source.value) {
					state.value = "noTitle";
					return;
				}
				await run(false);
			});
			const RELATED_TITLES = {
				work: "relatedTitle",
				cosplayer: "cosplayerRelatedTitle",
				realporn: "directRelatedTitle"
			};
			const badges = computed(() => {
				if (!result.value) return [];
				const list = [];
				if (result.value.editions.length > 0) list.push({
					id: "editions",
					label: result.value.editions.map((group) => group.language.name[locale]).join(" · "),
					title: t("editionsTitle"),
					groups: result.value.editions
				});
				if (result.value.series.length > 0) list.push({
					id: "series",
					label: t("series"),
					title: t("seriesTitle"),
					groups: result.value.series
				});
				if (result.value.related.length > 0) list.push({
					id: "related",
					label: t("related"),
					title: t(RELATED_TITLES[result.value.plan.mode]),
					groups: result.value.related
				});
				if (result.value.chapters.length > 0) list.push({
					id: "chapters",
					label: t("chapters"),
					title: t("chaptersTitle"),
					groups: result.value.chapters
				});
				return list;
			});
			const requests = computed(() => result.value?.requests ?? []);
			const searchRequests = computed(() => requests.value.filter((request) => request.kind === "search"));
			const metadataRequests = computed(() => requests.value.filter((request) => request.kind === "metadata"));
			const metadataFromCache = computed(() => result.value?.metadataFromCache ?? 0);
			const sentCount = computed(() => requests.value.reduce((count, request) => count + request.attempts, 0));
			const allFromCache = computed(() => {
				if (sentCount.value > 0) return false;
				return !requests.value.some(requestFailed);
			});
			const hasResults = computed(() => badges.value.length > 0 || (result.value?.containers.length ?? 0) > 0);
			const status = computed(() => {
				if (state.value === "searching") {
					const seen = progress.value;
					return seen && seen.total > 0 ? `${t("searching")} ${seen.done}/${seen.total}` : t("searching");
				}
				if (state.value === "noTitle") return t("noTitle");
				if (state.value === "failed") return t("failed");
				if (result.value?.status === "partial") return t("partial");
				return hasResults.value ? null : t("notFound");
			});
			const dataAge = computed(() => {
				const at = result.value?.dataAt;
				if (at === void 0) return "";
				return new Date(at).toLocaleString(locale === "zh" ? "zh-TW" : locale === "ja" ? "ja-JP" : "en-GB", {
					month: "short",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit"
				});
			});
			function toggle(id) {
				pinned.value = pinned.value === id ? null : id;
			}
			return (_ctx, _cache) => {
				return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [
					hasActivity.value ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass(["ehl-unit", { "ehl-unit--open": open.value === "requests" }]),
						onMouseenter: _cache[2] || (_cache[2] = ($event) => hovered.value = "requests"),
						onMouseleave: _cache[3] || (_cache[3] = ($event) => hovered.value = null)
					}, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["ehl-icon", {
							"ehl-icon--active": open.value === "requests",
							"ehl-tab--pinned": pinned.value === "requests"
						}]),
						title: unref(t)("requestsTitle"),
						onClick: _cache[0] || (_cache[0] = ($event) => toggle("requests"))
					}, [requests.value.length === 0 ? (openBlock(), createBlock(unref(CircleSlash2), {
						key: 0,
						size: 14,
						"aria-hidden": "true"
					})) : (openBlock(), createBlock(unref(Activity), {
						key: 1,
						size: 14,
						"aria-hidden": "true"
					}))], 10, _hoisted_3), createBaseVNode("div", _hoisted_4, [
						createBaseVNode("h4", _hoisted_5, [result.value ? (openBlock(), createElementBlock("span", _hoisted_6, toDisplayString(unref(t)("dataAsOf")) + " " + toDisplayString(dataAge.value), 1)) : (openBlock(), createElementBlock("span", _hoisted_7, toDisplayString(unref(t)("failed")), 1)), createBaseVNode("button", {
							type: "button",
							class: "ehl-refetch",
							disabled: state.value === "searching",
							title: unref(t)("refetchTitle"),
							onClick: _cache[1] || (_cache[1] = ($event) => run(true))
						}, [createVNode(unref(RefreshCw), {
							size: 11,
							"aria-hidden": "true"
						}), createTextVNode(" " + toDisplayString(unref(t)("refetch")), 1)], 8, _hoisted_8)]),
						searchRequests.value.length > 0 ? (openBlock(), createElementBlock("section", _hoisted_9, [createBaseVNode("h4", _hoisted_10, [createTextVNode(toDisplayString(unref(t)("searchRequests")), 1), createBaseVNode("span", _hoisted_11, toDisplayString(searchRequests.value.length), 1)]), createBaseVNode("ul", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(searchRequests.value, (request) => {
							return openBlock(), createElementBlock("li", { key: request.url }, [createBaseVNode("a", {
								class: "ehl-url",
								href: request.url,
								target: "_blank",
								rel: "noopener"
							}, [createTextVNode(toDisplayString(request.term) + " ", 1), createBaseVNode("span", _hoisted_13, toDisplayString(request.url), 1)], 8, _hoisted_12), createBaseVNode("span", _hoisted_14, [
								request.hitCount !== null ? (openBlock(), createElementBlock("span", {
									key: 0,
									class: "ehl-meta",
									title: unref(t)("searchHitsTitle")
								}, toDisplayString(unref(t)("searchHits")) + ": " + toDisplayString(request.hitCount), 9, _hoisted_15)) : createCommentVNode("", true),
								request.error ? (openBlock(), createElementBlock("span", _hoisted_16, toDisplayString(unref(t)(FAILURE_MESSAGES[request.error.kind])) + " " + toDisplayString(request.error.status ?? ""), 1)) : createCommentVNode("", true),
								request.attempts > 1 ? (openBlock(), createElementBlock("span", _hoisted_17, toDisplayString(unref(t)("requestAttempts")) + ": " + toDisplayString(request.attempts), 1)) : createCommentVNode("", true),
								request.cached ? (openBlock(), createElementBlock("span", _hoisted_18, toDisplayString(unref(t)("fromCache")), 1)) : createCommentVNode("", true)
							])]);
						}), 128))])])) : createCommentVNode("", true),
						metadataRequests.value.length > 0 ? (openBlock(), createElementBlock("section", _hoisted_19, [createBaseVNode("h4", _hoisted_20, [createTextVNode(toDisplayString(unref(t)("metadataRequests")), 1), createBaseVNode("span", _hoisted_21, toDisplayString(metadataRequests.value.length), 1)]), createBaseVNode("ul", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(metadataRequests.value, (request, index) => {
							return openBlock(), createElementBlock("li", { key: index }, [createBaseVNode("span", _hoisted_22, [
								createTextVNode(toDisplayString(request.galleries) + " " + toDisplayString(unref(t)("galleriesUnit")) + " ", 1),
								createBaseVNode("span", _hoisted_23, toDisplayString(request.url), 1),
								request.error ? (openBlock(), createElementBlock("span", _hoisted_24, toDisplayString(unref(t)(FAILURE_MESSAGES[request.error.kind])) + " " + toDisplayString(request.error.status ?? ""), 1)) : createCommentVNode("", true),
								request.failedGalleries > 0 ? (openBlock(), createElementBlock("span", _hoisted_25, toDisplayString(unref(t)("missingMetadata")) + ": " + toDisplayString(request.failedGalleries), 1)) : createCommentVNode("", true),
								request.attempts > 1 ? (openBlock(), createElementBlock("span", _hoisted_26, toDisplayString(unref(t)("requestAttempts")) + ": " + toDisplayString(request.attempts), 1)) : createCommentVNode("", true)
							])]);
						}), 128))])])) : createCommentVNode("", true),
						metadataFromCache.value > 0 ? (openBlock(), createElementBlock("p", _hoisted_27, toDisplayString(metadataFromCache.value) + " " + toDisplayString(unref(t)("galleriesUnit")) + " · " + toDisplayString(unref(t)("fromCache")), 1)) : createCommentVNode("", true),
						requests.value.length === 0 ? (openBlock(), createElementBlock("p", _hoisted_28, toDisplayString(unref(t)("noRequests")), 1)) : allFromCache.value ? (openBlock(), createElementBlock("p", _hoisted_29, toDisplayString(unref(t)("nothingSent")), 1)) : createCommentVNode("", true)
					])], 34)) : createCommentVNode("", true),
					status.value ? (openBlock(), createElementBlock("span", _hoisted_30, toDisplayString(status.value), 1)) : createCommentVNode("", true),
					result.value ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [(openBlock(true), createElementBlock(Fragment, null, renderList(badges.value, (badge) => {
						return openBlock(), createElementBlock("div", {
							key: badge.id,
							class: normalizeClass(["ehl-unit", { "ehl-unit--open": open.value === badge.id }]),
							onMouseenter: ($event) => hovered.value = badge.id,
							onMouseleave: _cache[4] || (_cache[4] = ($event) => hovered.value = null)
						}, [createBaseVNode("button", {
							type: "button",
							class: normalizeClass(["ehl-badge", { "ehl-tab--pinned": pinned.value === badge.id }]),
							title: badge.title,
							"aria-label": badge.label,
							onClick: ($event) => toggle(badge.id)
						}, [badge.id === "editions" ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(badge.groups, (group) => {
							return openBlock(), createBlock(LanguageBadge_default, {
								key: group.language.value,
								language: group.language
							}, null, 8, ["language"]);
						}), 128)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(badge.label), 1)], 64))], 10, _hoisted_32), createVNode(GroupList_default, { groups: badge.groups }, null, 8, ["groups"])], 42, _hoisted_31);
					}), 128)), result.value.containers.length > 0 ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass(["ehl-unit", { "ehl-unit--open": open.value === "containers" }]),
						onMouseenter: _cache[6] || (_cache[6] = ($event) => hovered.value = "containers"),
						onMouseleave: _cache[7] || (_cache[7] = ($event) => hovered.value = null)
					}, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["ehl-badge ehl-badge--container", { "ehl-tab--pinned": pinned.value === "containers" }]),
						title: unref(t)("containerTitle"),
						onClick: _cache[5] || (_cache[5] = ($event) => toggle("containers"))
					}, toDisplayString(unref(t)("container")), 11, _hoisted_33), createBaseVNode("div", _hoisted_34, [createBaseVNode("ul", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(result.value.containers, (hit) => {
						return openBlock(), createElementBlock("li", { key: hit.gid }, [createBaseVNode("a", {
							class: "ehl-title",
							href: hit.href,
							target: "_blank",
							rel: "noopener"
						}, [createTextVNode(toDisplayString(unref(displayTitle)(hit)) + " ", 1), unref(subtitle)(hit) ? (openBlock(), createElementBlock("span", _hoisted_36, toDisplayString(unref(subtitle)(hit)), 1)) : createCommentVNode("", true)], 8, _hoisted_35), hit.pages !== null ? (openBlock(), createElementBlock("span", _hoisted_37, [createBaseVNode("span", _hoisted_38, toDisplayString(hit.pages) + toDisplayString(unref(t)("pages")), 1)])) : createCommentVNode("", true)]);
					}), 128))])])], 34)) : createCommentVNode("", true)], 64)) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_39, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["ehl-icon", {
							"ehl-icon--active": open.value === "settings",
							"ehl-tab--pinned": pinned.value === "settings"
						}]),
						title: unref(t)("settings"),
						onClick: _cache[8] || (_cache[8] = ($event) => toggle("settings"))
					}, [createVNode(unref(Settings), {
						size: 14,
						"aria-hidden": "true"
					})], 10, _hoisted_40), open.value === "settings" ? (openBlock(), createBlock(SettingsPopup_default, { key: 0 })) : createCommentVNode("", true)])
				])]);
			};
		}
	});
	function isTransparent(color) {
		if (color === "transparent") return true;
		return color.startsWith("rgba(") && color.replaceAll(" ", "").endsWith(",0)");
	}
	function opaqueBackground(element) {
		for (let current = element; current; current = current.parentElement) {
			const color = getComputedStyle(current).backgroundColor;
			if (!isTransparent(color)) return color;
		}
		return "#fff";
	}
	var host = document.querySelector(".gm");
	if (host) {
		await(loadSettings());
		const container = document.createElement("div");
		container.id = "ehl-app";
		container.style.setProperty("--ehl-bg", opaqueBackground(host));
		container.style.setProperty("--ehl-border", getComputedStyle(host).borderTopColor);
		host.before(container);
		createApp(App_default).mount(container);
	}
})();
