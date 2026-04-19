"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "deepCopyObject", {
    enumerable: true,
    get: function() {
        return deepCopyObject;
    }
});
const _bsonobjectid = /*#__PURE__*/ _interop_require_default(require("bson-objectid"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const deepCopyObject = (inObject)=>{
    if (_bsonobjectid.default.isValid(inObject)) return inObject;
    if (inObject instanceof Date) return inObject;
    if (inObject instanceof Set) return new Set(inObject);
    if (inObject instanceof Map) return new Map(inObject);
    if (typeof inObject !== 'object' || inObject === null) {
        return inObject // Return the value if inObject is not an object
        ;
    }
    // Create an array or object to hold the values
    const outObject = Array.isArray(inObject) ? [] : {};
    Object.keys(inObject).forEach((key)=>{
        const value = inObject[key];
        // Recursively (deep) copy for nested objects, including arrays
        outObject[key] = typeof value === 'object' && value !== null ? deepCopyObject(value) : value;
    });
    return outObject;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsaXRpZXMvZGVlcENvcHlPYmplY3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9iamVjdElEIGZyb20gJ2Jzb24tb2JqZWN0aWQnXG5cbmV4cG9ydCBjb25zdCBkZWVwQ29weU9iamVjdCA9IChpbk9iamVjdCkgPT4ge1xuICBpZiAoT2JqZWN0SUQuaXNWYWxpZChpbk9iamVjdCkpIHJldHVybiBpbk9iamVjdFxuXG4gIGlmIChpbk9iamVjdCBpbnN0YW5jZW9mIERhdGUpIHJldHVybiBpbk9iamVjdFxuXG4gIGlmIChpbk9iamVjdCBpbnN0YW5jZW9mIFNldCkgcmV0dXJuIG5ldyBTZXQoaW5PYmplY3QpXG5cbiAgaWYgKGluT2JqZWN0IGluc3RhbmNlb2YgTWFwKSByZXR1cm4gbmV3IE1hcChpbk9iamVjdClcblxuICBpZiAodHlwZW9mIGluT2JqZWN0ICE9PSAnb2JqZWN0JyB8fCBpbk9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBpbk9iamVjdCAvLyBSZXR1cm4gdGhlIHZhbHVlIGlmIGluT2JqZWN0IGlzIG5vdCBhbiBvYmplY3RcbiAgfVxuXG4gIC8vIENyZWF0ZSBhbiBhcnJheSBvciBvYmplY3QgdG8gaG9sZCB0aGUgdmFsdWVzXG4gIGNvbnN0IG91dE9iamVjdCA9IEFycmF5LmlzQXJyYXkoaW5PYmplY3QpID8gW10gOiB7fVxuXG4gIE9iamVjdC5rZXlzKGluT2JqZWN0KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGluT2JqZWN0W2tleV1cblxuICAgIC8vIFJlY3Vyc2l2ZWx5IChkZWVwKSBjb3B5IGZvciBuZXN0ZWQgb2JqZWN0cywgaW5jbHVkaW5nIGFycmF5c1xuICAgIG91dE9iamVjdFtrZXldID0gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCA/IGRlZXBDb3B5T2JqZWN0KHZhbHVlKSA6IHZhbHVlXG4gIH0pXG5cbiAgcmV0dXJuIG91dE9iamVjdFxufVxuIl0sIm5hbWVzIjpbImRlZXBDb3B5T2JqZWN0IiwiaW5PYmplY3QiLCJPYmplY3RJRCIsImlzVmFsaWQiLCJEYXRlIiwiU2V0IiwiTWFwIiwib3V0T2JqZWN0IiwiQXJyYXkiLCJpc0FycmF5IiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJ2YWx1ZSJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiI7Ozs7K0JBRWFBOzs7ZUFBQUE7OztxRUFGUTs7Ozs7O0FBRWQsTUFBTUEsaUJBQWlCLENBQUNDO0lBQzdCLElBQUlDLHFCQUFRLENBQUNDLE9BQU8sQ0FBQ0YsV0FBVyxPQUFPQTtJQUV2QyxJQUFJQSxvQkFBb0JHLE1BQU0sT0FBT0g7SUFFckMsSUFBSUEsb0JBQW9CSSxLQUFLLE9BQU8sSUFBSUEsSUFBSUo7SUFFNUMsSUFBSUEsb0JBQW9CSyxLQUFLLE9BQU8sSUFBSUEsSUFBSUw7SUFFNUMsSUFBSSxPQUFPQSxhQUFhLFlBQVlBLGFBQWEsTUFBTTtRQUNyRCxPQUFPQSxTQUFTLGdEQUFnRDs7SUFDbEU7SUFFQSwrQ0FBK0M7SUFDL0MsTUFBTU0sWUFBWUMsTUFBTUMsT0FBTyxDQUFDUixZQUFZLEVBQUUsR0FBRyxDQUFDO0lBRWxEUyxPQUFPQyxJQUFJLENBQUNWLFVBQVVXLE9BQU8sQ0FBQyxDQUFDQztRQUM3QixNQUFNQyxRQUFRYixRQUFRLENBQUNZLElBQUk7UUFFM0IsK0RBQStEO1FBQy9ETixTQUFTLENBQUNNLElBQUksR0FBRyxPQUFPQyxVQUFVLFlBQVlBLFVBQVUsT0FBT2QsZUFBZWMsU0FBU0E7SUFDekY7SUFFQSxPQUFPUDtBQUNUIn0=