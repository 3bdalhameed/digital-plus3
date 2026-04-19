"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "optionallyAppendMetadata", {
    enumerable: true,
    get: function() {
        return optionallyAppendMetadata;
    }
});
async function optionallyAppendMetadata({ req, sharpFile, withMetadata }) {
    const metadata = await sharpFile.metadata();
    if (withMetadata === true) {
        return sharpFile.withMetadata();
    } else if (typeof withMetadata === 'function') {
        const useMetadata = await withMetadata({
            metadata,
            req
        });
        if (useMetadata) return sharpFile.withMetadata();
    }
    return sharpFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91cGxvYWRzL29wdGlvbmFsbHlBcHBlbmRNZXRhZGF0YS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFNoYXJwLCBNZXRhZGF0YSBhcyBTaGFycE1ldGFkYXRhIH0gZnJvbSAnc2hhcnAnXG5cbmltcG9ydCB0eXBlIHsgUGF5bG9hZFJlcXVlc3QgfSBmcm9tICcuLi90eXBlcy9pbmRleC5qcydcblxuZXhwb3J0IHR5cGUgV2l0aE1ldGFkYXRhID1cbiAgfCAoKG9wdGlvbnM6IHsgbWV0YWRhdGE6IFNoYXJwTWV0YWRhdGE7IHJlcTogUGF5bG9hZFJlcXVlc3QgfSkgPT4gUHJvbWlzZTxib29sZWFuPilcbiAgfCBib29sZWFuXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpb25hbGx5QXBwZW5kTWV0YWRhdGEoe1xuICByZXEsXG4gIHNoYXJwRmlsZSxcbiAgd2l0aE1ldGFkYXRhLFxufToge1xuICByZXE6IFBheWxvYWRSZXF1ZXN0XG4gIHNoYXJwRmlsZTogU2hhcnBcbiAgd2l0aE1ldGFkYXRhOiBXaXRoTWV0YWRhdGFcbn0pOiBQcm9taXNlPFNoYXJwPiB7XG4gIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgc2hhcnBGaWxlLm1ldGFkYXRhKClcbiAgaWYgKHdpdGhNZXRhZGF0YSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBzaGFycEZpbGUud2l0aE1ldGFkYXRhKClcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2l0aE1ldGFkYXRhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdXNlTWV0YWRhdGEgPSBhd2FpdCB3aXRoTWV0YWRhdGEoeyBtZXRhZGF0YSwgcmVxIH0pXG5cbiAgICBpZiAodXNlTWV0YWRhdGEpIHJldHVybiBzaGFycEZpbGUud2l0aE1ldGFkYXRhKClcbiAgfVxuXG4gIHJldHVybiBzaGFycEZpbGVcbn1cbiJdLCJuYW1lcyI6WyJvcHRpb25hbGx5QXBwZW5kTWV0YWRhdGEiLCJyZXEiLCJzaGFycEZpbGUiLCJ3aXRoTWV0YWRhdGEiLCJtZXRhZGF0YSIsInVzZU1ldGFkYXRhIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiI7Ozs7K0JBUXNCQTs7O2VBQUFBOzs7QUFBZixlQUFlQSx5QkFBeUIsRUFDN0NDLEdBQUcsRUFDSEMsU0FBUyxFQUNUQyxZQUFZLEVBS2I7SUFDQyxNQUFNQyxXQUFXLE1BQU1GLFVBQVVFLFFBQVE7SUFDekMsSUFBSUQsaUJBQWlCLE1BQU07UUFDekIsT0FBT0QsVUFBVUMsWUFBWTtJQUMvQixPQUFPLElBQUksT0FBT0EsaUJBQWlCLFlBQVk7UUFDN0MsTUFBTUUsY0FBYyxNQUFNRixhQUFhO1lBQUVDO1lBQVVIO1FBQUk7UUFFdkQsSUFBSUksYUFBYSxPQUFPSCxVQUFVQyxZQUFZO0lBQ2hEO0lBRUEsT0FBT0Q7QUFDVCJ9