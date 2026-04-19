"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "defaults", {
    enumerable: true,
    get: function() {
        return defaults;
    }
});
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const defaults = {
    admin: {
        avatar: 'default',
        buildPath: _path.default.resolve(process.cwd(), './build'),
        components: {},
        css: _path.default.resolve(__dirname, '../admin/scss/custom.css'),
        dateFormat: 'MMMM do yyyy, h:mm a',
        disable: false,
        inactivityRoute: '/logout-inactivity',
        indexHTML: _path.default.resolve(__dirname, '../admin/index.html'),
        logoutRoute: '/logout',
        meta: {
            titleSuffix: '- Payload'
        }
    },
    collections: [],
    cookiePrefix: 'payload',
    cors: [],
    csrf: [],
    custom: {},
    defaultDepth: 2,
    defaultMaxTextLength: 40000,
    endpoints: [],
    express: {
        compression: {},
        json: {},
        middleware: [],
        postMiddleware: [],
        preMiddleware: []
    },
    globals: [],
    graphQL: {
        disablePlaygroundInProduction: true,
        maxComplexity: 1000,
        schemaOutputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/schema.graphql`
    },
    hooks: {},
    joiValidation: true,
    localization: false,
    maxDepth: 10,
    rateLimit: {
        max: 500,
        window: 15 * 60 * 1000
    },
    routes: {
        admin: '/admin',
        api: '/api',
        graphQL: '/graphql',
        graphQLPlayground: '/graphql-playground'
    },
    serverURL: '',
    telemetry: true,
    typescript: {
        outputFile: `${typeof process?.cwd === 'function' ? process.cwd() : ''}/payload-types.ts`
    },
    upload: {}
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25maWcvZGVmYXVsdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuaW1wb3J0IHR5cGUgeyBDb25maWcgfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgZGVmYXVsdHM6IE9taXQ8Q29uZmlnLCAnZGInIHwgJ2VkaXRvcic+ID0ge1xuICBhZG1pbjoge1xuICAgIGF2YXRhcjogJ2RlZmF1bHQnLFxuICAgIGJ1aWxkUGF0aDogcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICcuL2J1aWxkJyksXG4gICAgY29tcG9uZW50czoge30sXG4gICAgY3NzOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vYWRtaW4vc2Nzcy9jdXN0b20uY3NzJyksXG4gICAgZGF0ZUZvcm1hdDogJ01NTU0gZG8geXl5eSwgaDptbSBhJyxcbiAgICBkaXNhYmxlOiBmYWxzZSxcbiAgICBpbmFjdGl2aXR5Um91dGU6ICcvbG9nb3V0LWluYWN0aXZpdHknLFxuICAgIGluZGV4SFRNTDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL2FkbWluL2luZGV4Lmh0bWwnKSxcbiAgICBsb2dvdXRSb3V0ZTogJy9sb2dvdXQnLFxuICAgIG1ldGE6IHtcbiAgICAgIHRpdGxlU3VmZml4OiAnLSBQYXlsb2FkJyxcbiAgICB9LFxuICB9LFxuICBjb2xsZWN0aW9uczogW10sXG4gIGNvb2tpZVByZWZpeDogJ3BheWxvYWQnLFxuICBjb3JzOiBbXSxcbiAgY3NyZjogW10sXG4gIGN1c3RvbToge30sXG4gIGRlZmF1bHREZXB0aDogMixcbiAgZGVmYXVsdE1heFRleHRMZW5ndGg6IDQwMDAwLFxuICBlbmRwb2ludHM6IFtdLFxuICBleHByZXNzOiB7XG4gICAgY29tcHJlc3Npb246IHt9LFxuICAgIGpzb246IHt9LFxuICAgIG1pZGRsZXdhcmU6IFtdLFxuICAgIHBvc3RNaWRkbGV3YXJlOiBbXSxcbiAgICBwcmVNaWRkbGV3YXJlOiBbXSxcbiAgfSxcbiAgZ2xvYmFsczogW10sXG4gIGdyYXBoUUw6IHtcbiAgICBkaXNhYmxlUGxheWdyb3VuZEluUHJvZHVjdGlvbjogdHJ1ZSxcbiAgICBtYXhDb21wbGV4aXR5OiAxMDAwLFxuICAgIHNjaGVtYU91dHB1dEZpbGU6IGAke3R5cGVvZiBwcm9jZXNzPy5jd2QgPT09ICdmdW5jdGlvbicgPyBwcm9jZXNzLmN3ZCgpIDogJyd9L3NjaGVtYS5ncmFwaHFsYCxcbiAgfSxcbiAgaG9va3M6IHt9LFxuICBqb2lWYWxpZGF0aW9uOiB0cnVlLFxuICBsb2NhbGl6YXRpb246IGZhbHNlLFxuICBtYXhEZXB0aDogMTAsXG4gIHJhdGVMaW1pdDoge1xuICAgIG1heDogNTAwLFxuICAgIHdpbmRvdzogMTUgKiA2MCAqIDEwMDAsIC8vIDE1bWluIGRlZmF1bHQsXG4gIH0sXG4gIHJvdXRlczoge1xuICAgIGFkbWluOiAnL2FkbWluJyxcbiAgICBhcGk6ICcvYXBpJyxcbiAgICBncmFwaFFMOiAnL2dyYXBocWwnLFxuICAgIGdyYXBoUUxQbGF5Z3JvdW5kOiAnL2dyYXBocWwtcGxheWdyb3VuZCcsXG4gIH0sXG4gIHNlcnZlclVSTDogJycsXG4gIHRlbGVtZXRyeTogdHJ1ZSxcbiAgdHlwZXNjcmlwdDoge1xuICAgIG91dHB1dEZpbGU6IGAke3R5cGVvZiBwcm9jZXNzPy5jd2QgPT09ICdmdW5jdGlvbicgPyBwcm9jZXNzLmN3ZCgpIDogJyd9L3BheWxvYWQtdHlwZXMudHNgLFxuICB9LFxuICB1cGxvYWQ6IHt9LFxufVxuIl0sIm5hbWVzIjpbImRlZmF1bHRzIiwiYWRtaW4iLCJhdmF0YXIiLCJidWlsZFBhdGgiLCJwYXRoIiwicmVzb2x2ZSIsInByb2Nlc3MiLCJjd2QiLCJjb21wb25lbnRzIiwiY3NzIiwiX19kaXJuYW1lIiwiZGF0ZUZvcm1hdCIsImRpc2FibGUiLCJpbmFjdGl2aXR5Um91dGUiLCJpbmRleEhUTUwiLCJsb2dvdXRSb3V0ZSIsIm1ldGEiLCJ0aXRsZVN1ZmZpeCIsImNvbGxlY3Rpb25zIiwiY29va2llUHJlZml4IiwiY29ycyIsImNzcmYiLCJjdXN0b20iLCJkZWZhdWx0RGVwdGgiLCJkZWZhdWx0TWF4VGV4dExlbmd0aCIsImVuZHBvaW50cyIsImV4cHJlc3MiLCJjb21wcmVzc2lvbiIsImpzb24iLCJtaWRkbGV3YXJlIiwicG9zdE1pZGRsZXdhcmUiLCJwcmVNaWRkbGV3YXJlIiwiZ2xvYmFscyIsImdyYXBoUUwiLCJkaXNhYmxlUGxheWdyb3VuZEluUHJvZHVjdGlvbiIsIm1heENvbXBsZXhpdHkiLCJzY2hlbWFPdXRwdXRGaWxlIiwiaG9va3MiLCJqb2lWYWxpZGF0aW9uIiwibG9jYWxpemF0aW9uIiwibWF4RGVwdGgiLCJyYXRlTGltaXQiLCJtYXgiLCJ3aW5kb3ciLCJyb3V0ZXMiLCJhcGkiLCJncmFwaFFMUGxheWdyb3VuZCIsInNlcnZlclVSTCIsInRlbGVtZXRyeSIsInR5cGVzY3JpcHQiLCJvdXRwdXRGaWxlIiwidXBsb2FkIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJtYXBwaW5ncyI6Ijs7OzsrQkFJYUE7OztlQUFBQTs7OzZEQUpJOzs7Ozs7QUFJVixNQUFNQSxXQUEwQztJQUNyREMsT0FBTztRQUNMQyxRQUFRO1FBQ1JDLFdBQVdDLGFBQUksQ0FBQ0MsT0FBTyxDQUFDQyxRQUFRQyxHQUFHLElBQUk7UUFDdkNDLFlBQVksQ0FBQztRQUNiQyxLQUFLTCxhQUFJLENBQUNDLE9BQU8sQ0FBQ0ssV0FBVztRQUM3QkMsWUFBWTtRQUNaQyxTQUFTO1FBQ1RDLGlCQUFpQjtRQUNqQkMsV0FBV1YsYUFBSSxDQUFDQyxPQUFPLENBQUNLLFdBQVc7UUFDbkNLLGFBQWE7UUFDYkMsTUFBTTtZQUNKQyxhQUFhO1FBQ2Y7SUFDRjtJQUNBQyxhQUFhLEVBQUU7SUFDZkMsY0FBYztJQUNkQyxNQUFNLEVBQUU7SUFDUkMsTUFBTSxFQUFFO0lBQ1JDLFFBQVEsQ0FBQztJQUNUQyxjQUFjO0lBQ2RDLHNCQUFzQjtJQUN0QkMsV0FBVyxFQUFFO0lBQ2JDLFNBQVM7UUFDUEMsYUFBYSxDQUFDO1FBQ2RDLE1BQU0sQ0FBQztRQUNQQyxZQUFZLEVBQUU7UUFDZEMsZ0JBQWdCLEVBQUU7UUFDbEJDLGVBQWUsRUFBRTtJQUNuQjtJQUNBQyxTQUFTLEVBQUU7SUFDWEMsU0FBUztRQUNQQywrQkFBK0I7UUFDL0JDLGVBQWU7UUFDZkMsa0JBQWtCLENBQUMsRUFBRSxPQUFPOUIsU0FBU0MsUUFBUSxhQUFhRCxRQUFRQyxHQUFHLEtBQUssR0FBRyxlQUFlLENBQUM7SUFDL0Y7SUFDQThCLE9BQU8sQ0FBQztJQUNSQyxlQUFlO0lBQ2ZDLGNBQWM7SUFDZEMsVUFBVTtJQUNWQyxXQUFXO1FBQ1RDLEtBQUs7UUFDTEMsUUFBUSxLQUFLLEtBQUs7SUFDcEI7SUFDQUMsUUFBUTtRQUNOM0MsT0FBTztRQUNQNEMsS0FBSztRQUNMWixTQUFTO1FBQ1RhLG1CQUFtQjtJQUNyQjtJQUNBQyxXQUFXO0lBQ1hDLFdBQVc7SUFDWEMsWUFBWTtRQUNWQyxZQUFZLENBQUMsRUFBRSxPQUFPNUMsU0FBU0MsUUFBUSxhQUFhRCxRQUFRQyxHQUFHLEtBQUssR0FBRyxpQkFBaUIsQ0FBQztJQUMzRjtJQUNBNEMsUUFBUSxDQUFDO0FBQ1gifQ==