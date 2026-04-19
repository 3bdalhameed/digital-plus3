"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "appendVersionToQueryKey", {
    enumerable: true,
    get: function() {
        return appendVersionToQueryKey;
    }
});
const appendVersionToQueryKey = (query = {})=>{
    return Object.entries(query).reduce((res, [key, val])=>{
        if ([
            'AND',
            'OR',
            'and',
            'or'
        ].includes(key) && Array.isArray(val)) {
            return {
                ...res,
                [key.toLowerCase()]: val.map((subQuery)=>appendVersionToQueryKey(subQuery))
            };
        }
        if (key !== 'id') {
            return {
                ...res,
                [`version.${key}`]: val
            };
        }
        return {
            ...res,
            parent: val
        };
    }, {});
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy92ZXJzaW9ucy9kcmFmdHMvYXBwZW5kVmVyc2lvblRvUXVlcnlLZXkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBXaGVyZSB9IGZyb20gJy4uLy4uL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgYXBwZW5kVmVyc2lvblRvUXVlcnlLZXkgPSAocXVlcnk6IFdoZXJlID0ge30pOiBXaGVyZSA9PiB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhxdWVyeSkucmVkdWNlKChyZXMsIFtrZXksIHZhbF0pID0+IHtcbiAgICBpZiAoWydBTkQnLCAnT1InLCAnYW5kJywgJ29yJ10uaW5jbHVkZXMoa2V5KSAmJiBBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnJlcyxcbiAgICAgICAgW2tleS50b0xvd2VyQ2FzZSgpXTogdmFsLm1hcCgoc3ViUXVlcnkpID0+IGFwcGVuZFZlcnNpb25Ub1F1ZXJ5S2V5KHN1YlF1ZXJ5KSksXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGtleSAhPT0gJ2lkJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ucmVzLFxuICAgICAgICBbYHZlcnNpb24uJHtrZXl9YF06IHZhbCxcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4ucmVzLFxuICAgICAgcGFyZW50OiB2YWwsXG4gICAgfVxuICB9LCB7fSlcbn1cbiJdLCJuYW1lcyI6WyJhcHBlbmRWZXJzaW9uVG9RdWVyeUtleSIsInF1ZXJ5IiwiT2JqZWN0IiwiZW50cmllcyIsInJlZHVjZSIsInJlcyIsImtleSIsInZhbCIsImluY2x1ZGVzIiwiQXJyYXkiLCJpc0FycmF5IiwidG9Mb3dlckNhc2UiLCJtYXAiLCJzdWJRdWVyeSIsInBhcmVudCJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsIm1hcHBpbmdzIjoiOzs7OytCQUVhQTs7O2VBQUFBOzs7QUFBTixNQUFNQSwwQkFBMEIsQ0FBQ0MsUUFBZSxDQUFDLENBQUM7SUFDdkQsT0FBT0MsT0FBT0MsT0FBTyxDQUFDRixPQUFPRyxNQUFNLENBQUMsQ0FBQ0MsS0FBSyxDQUFDQyxLQUFLQyxJQUFJO1FBQ2xELElBQUk7WUFBQztZQUFPO1lBQU07WUFBTztTQUFLLENBQUNDLFFBQVEsQ0FBQ0YsUUFBUUcsTUFBTUMsT0FBTyxDQUFDSCxNQUFNO1lBQ2xFLE9BQU87Z0JBQ0wsR0FBR0YsR0FBRztnQkFDTixDQUFDQyxJQUFJSyxXQUFXLEdBQUcsRUFBRUosSUFBSUssR0FBRyxDQUFDLENBQUNDLFdBQWFiLHdCQUF3QmE7WUFDckU7UUFDRjtRQUVBLElBQUlQLFFBQVEsTUFBTTtZQUNoQixPQUFPO2dCQUNMLEdBQUdELEdBQUc7Z0JBQ04sQ0FBQyxDQUFDLFFBQVEsRUFBRUMsSUFBSSxDQUFDLENBQUMsRUFBRUM7WUFDdEI7UUFDRjtRQUVBLE9BQU87WUFDTCxHQUFHRixHQUFHO1lBQ05TLFFBQVFQO1FBQ1Y7SUFDRixHQUFHLENBQUM7QUFDTiJ9