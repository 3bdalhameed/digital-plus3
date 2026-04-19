/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getQueryDraftsSort", {
    enumerable: true,
    get: function() {
        return getQueryDraftsSort;
    }
});
const getQueryDraftsSort = (sort)=>{
    if (!sort) return sort;
    let direction = '';
    let orderBy = sort;
    if (sort[0] === '-') {
        direction = '-';
        orderBy = sort.substring(1);
    }
    if (orderBy === 'id') {
        return `${direction}parent`;
    }
    return `${direction}version.${orderBy}`;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy92ZXJzaW9ucy9kcmFmdHMvZ2V0UXVlcnlEcmFmdHNTb3J0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGFrZXMgdGhlIGluY29taW5nIHNvcnQgYXJndW1lbnQgYW5kIHByZWZpeGVzIGl0IHdpdGggYHZlcnNpb25zLmAgYW5kIHByZXNlcnZlcyBhbnkgYC1gIHByZWZpeGVzIGZvciBkZXNjZW5kaW5nIG9yZGVyXG4gKiBAcGFyYW0gc29ydFxuICovXG5leHBvcnQgY29uc3QgZ2V0UXVlcnlEcmFmdHNTb3J0ID0gKHNvcnQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIGlmICghc29ydCkgcmV0dXJuIHNvcnRcblxuICBsZXQgZGlyZWN0aW9uID0gJydcbiAgbGV0IG9yZGVyQnkgPSBzb3J0XG5cbiAgaWYgKHNvcnRbMF0gPT09ICctJykge1xuICAgIGRpcmVjdGlvbiA9ICctJ1xuICAgIG9yZGVyQnkgPSBzb3J0LnN1YnN0cmluZygxKVxuICB9XG5cbiAgaWYgKG9yZGVyQnkgPT09ICdpZCcpIHtcbiAgICByZXR1cm4gYCR7ZGlyZWN0aW9ufXBhcmVudGBcbiAgfVxuXG4gIHJldHVybiBgJHtkaXJlY3Rpb259dmVyc2lvbi4ke29yZGVyQnl9YFxufVxuIl0sIm5hbWVzIjpbImdldFF1ZXJ5RHJhZnRzU29ydCIsInNvcnQiLCJkaXJlY3Rpb24iLCJvcmRlckJ5Iiwic3Vic3RyaW5nIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiJBQUFBOzs7Q0FHQzs7OzsrQkFDWUE7OztlQUFBQTs7O0FBQU4sTUFBTUEscUJBQXFCLENBQUNDO0lBQ2pDLElBQUksQ0FBQ0EsTUFBTSxPQUFPQTtJQUVsQixJQUFJQyxZQUFZO0lBQ2hCLElBQUlDLFVBQVVGO0lBRWQsSUFBSUEsSUFBSSxDQUFDLEVBQUUsS0FBSyxLQUFLO1FBQ25CQyxZQUFZO1FBQ1pDLFVBQVVGLEtBQUtHLFNBQVMsQ0FBQztJQUMzQjtJQUVBLElBQUlELFlBQVksTUFBTTtRQUNwQixPQUFPLENBQUMsRUFBRUQsVUFBVSxNQUFNLENBQUM7SUFDN0I7SUFFQSxPQUFPLENBQUMsRUFBRUEsVUFBVSxRQUFRLEVBQUVDLFFBQVEsQ0FBQztBQUN6QyJ9