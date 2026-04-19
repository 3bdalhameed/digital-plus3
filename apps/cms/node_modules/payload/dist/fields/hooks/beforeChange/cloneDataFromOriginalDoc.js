"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cloneDataFromOriginalDoc", {
    enumerable: true,
    get: function() {
        return cloneDataFromOriginalDoc;
    }
});
const cloneDataFromOriginalDoc = (originalDocData)=>{
    if (Array.isArray(originalDocData)) {
        return originalDocData.map((row)=>{
            if (typeof row === 'object' && row != null) {
                return {
                    ...row
                };
            }
            return row;
        });
    }
    if (originalDocData instanceof Date) {
        return originalDocData;
    }
    if (typeof originalDocData === 'object' && originalDocData !== null) {
        return {
            ...originalDocData
        };
    }
    return originalDocData;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9maWVsZHMvaG9va3MvYmVmb3JlQ2hhbmdlL2Nsb25lRGF0YUZyb21PcmlnaW5hbERvYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgY2xvbmVEYXRhRnJvbU9yaWdpbmFsRG9jID0gKG9yaWdpbmFsRG9jRGF0YTogdW5rbm93bik6IHVua25vd24gPT4ge1xuICBpZiAoQXJyYXkuaXNBcnJheShvcmlnaW5hbERvY0RhdGEpKSB7XG4gICAgcmV0dXJuIG9yaWdpbmFsRG9jRGF0YS5tYXAoKHJvdykgPT4ge1xuICAgICAgaWYgKHR5cGVvZiByb3cgPT09ICdvYmplY3QnICYmIHJvdyAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucm93LFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByb3dcbiAgICB9KVxuICB9XG5cbiAgaWYgKG9yaWdpbmFsRG9jRGF0YSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gb3JpZ2luYWxEb2NEYXRhXG4gIH1cblxuICBpZiAodHlwZW9mIG9yaWdpbmFsRG9jRGF0YSA9PT0gJ29iamVjdCcgJiYgb3JpZ2luYWxEb2NEYXRhICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIHsgLi4ub3JpZ2luYWxEb2NEYXRhIH1cbiAgfVxuXG4gIHJldHVybiBvcmlnaW5hbERvY0RhdGFcbn1cbiJdLCJuYW1lcyI6WyJjbG9uZURhdGFGcm9tT3JpZ2luYWxEb2MiLCJvcmlnaW5hbERvY0RhdGEiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJyb3ciLCJEYXRlIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJtYXBwaW5ncyI6Ijs7OzsrQkFBYUE7OztlQUFBQTs7O0FBQU4sTUFBTUEsMkJBQTJCLENBQUNDO0lBQ3ZDLElBQUlDLE1BQU1DLE9BQU8sQ0FBQ0Ysa0JBQWtCO1FBQ2xDLE9BQU9BLGdCQUFnQkcsR0FBRyxDQUFDLENBQUNDO1lBQzFCLElBQUksT0FBT0EsUUFBUSxZQUFZQSxPQUFPLE1BQU07Z0JBQzFDLE9BQU87b0JBQ0wsR0FBR0EsR0FBRztnQkFDUjtZQUNGO1lBRUEsT0FBT0E7UUFDVDtJQUNGO0lBRUEsSUFBSUosMkJBQTJCSyxNQUFNO1FBQ25DLE9BQU9MO0lBQ1Q7SUFFQSxJQUFJLE9BQU9BLG9CQUFvQixZQUFZQSxvQkFBb0IsTUFBTTtRQUNuRSxPQUFPO1lBQUUsR0FBR0EsZUFBZTtRQUFDO0lBQzlCO0lBRUEsT0FBT0E7QUFDVCJ9