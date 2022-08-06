var VueReactivity = (() => {
  // packages/shared/src/index.ts
  var isArray = (value) => {
    return Array.isArray(value);
  };

  // packages/reactivity/src/index.ts
  isArray([]);
  isArray({});
})();
//# sourceMappingURL=reactivity.global.js.map
