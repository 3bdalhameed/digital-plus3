"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    cropImage: function() {
        return cropImage;
    },
    percentToPixel: function() {
        return percentToPixel;
    }
});
const _sharp = /*#__PURE__*/ _interop_require_default(require("sharp"));
const _optionallyAppendMetadata = require("./optionallyAppendMetadata");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const percentToPixel = (value, dimension)=>{
    if (!value) return 0;
    return Math.floor(parseFloat(value) / 100 * dimension);
};
async function cropImage({ cropData, dimensions, file, heightInPixels, req, widthInPixels, withMetadata }) {
    try {
        const { x, y } = cropData;
        const fileIsAnimatedType = [
            'image/avif',
            'image/gif',
            'image/webp'
        ].includes(file.mimetype);
        const sharpOptions = {};
        if (fileIsAnimatedType) sharpOptions.animated = true;
        const formattedCropData = {
            height: Number(heightInPixels),
            left: percentToPixel(x, dimensions.width),
            top: percentToPixel(y, dimensions.height),
            width: Number(widthInPixels)
        };
        let cropped = (0, _sharp.default)(file.tempFilePath || file.data, sharpOptions).extract(formattedCropData);
        cropped = await (0, _optionallyAppendMetadata.optionallyAppendMetadata)({
            req,
            sharpFile: cropped,
            withMetadata
        });
        return await cropped.withMetadata().toBuffer({
            resolveWithObject: true
        });
    } catch (error) {
        console.error(`Error cropping image:`, error);
        throw error;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91cGxvYWRzL2Nyb3BJbWFnZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFVwbG9hZGVkRmlsZSB9IGZyb20gJ2V4cHJlc3MtZmlsZXVwbG9hZCdcbmltcG9ydCB0eXBlIHsgUGF5bG9hZFJlcXVlc3QgfSBmcm9tICdwYXlsb2FkL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBTaGFycE9wdGlvbnMgfSBmcm9tICdzaGFycCdcblxuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJ1xuXG5pbXBvcnQgdHlwZSB7IFVwbG9hZEVkaXRzIH0gZnJvbSAnLi90eXBlcydcblxuaW1wb3J0IHsgdHlwZSBXaXRoTWV0YWRhdGEsIG9wdGlvbmFsbHlBcHBlbmRNZXRhZGF0YSB9IGZyb20gJy4vb3B0aW9uYWxseUFwcGVuZE1ldGFkYXRhJ1xuXG5leHBvcnQgY29uc3QgcGVyY2VudFRvUGl4ZWwgPSAodmFsdWUsIGRpbWVuc2lvbik6IG51bWJlciA9PiB7XG4gIGlmICghdmFsdWUpIHJldHVybiAwXG4gIHJldHVybiBNYXRoLmZsb29yKChwYXJzZUZsb2F0KHZhbHVlKSAvIDEwMCkgKiBkaW1lbnNpb24pXG59XG5cbnR5cGUgQ3JvcEltYWdlQXJncyA9IHtcbiAgY3JvcERhdGE6IFVwbG9hZEVkaXRzWydjcm9wJ11cbiAgZGltZW5zaW9uczogeyBoZWlnaHQ6IG51bWJlcjsgd2lkdGg6IG51bWJlciB9XG4gIGZpbGU6IFVwbG9hZGVkRmlsZVxuICBoZWlnaHRJblBpeGVsczogbnVtYmVyXG4gIHJlcT86IFBheWxvYWRSZXF1ZXN0XG4gIHdpZHRoSW5QaXhlbHM6IG51bWJlclxuICB3aXRoTWV0YWRhdGE/OiBXaXRoTWV0YWRhdGFcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcm9wSW1hZ2Uoe1xuICBjcm9wRGF0YSxcbiAgZGltZW5zaW9ucyxcbiAgZmlsZSxcbiAgaGVpZ2h0SW5QaXhlbHMsXG4gIHJlcSxcbiAgd2lkdGhJblBpeGVscyxcbiAgd2l0aE1ldGFkYXRhLFxufTogQ3JvcEltYWdlQXJncykge1xuICB0cnkge1xuICAgIGNvbnN0IHsgeCwgeSB9ID0gY3JvcERhdGFcblxuICAgIGNvbnN0IGZpbGVJc0FuaW1hdGVkVHlwZSA9IFsnaW1hZ2UvYXZpZicsICdpbWFnZS9naWYnLCAnaW1hZ2Uvd2VicCddLmluY2x1ZGVzKGZpbGUubWltZXR5cGUpXG5cbiAgICBjb25zdCBzaGFycE9wdGlvbnM6IFNoYXJwT3B0aW9ucyA9IHt9XG5cbiAgICBpZiAoZmlsZUlzQW5pbWF0ZWRUeXBlKSBzaGFycE9wdGlvbnMuYW5pbWF0ZWQgPSB0cnVlXG5cbiAgICBjb25zdCBmb3JtYXR0ZWRDcm9wRGF0YSA9IHtcbiAgICAgIGhlaWdodDogTnVtYmVyKGhlaWdodEluUGl4ZWxzKSxcbiAgICAgIGxlZnQ6IHBlcmNlbnRUb1BpeGVsKHgsIGRpbWVuc2lvbnMud2lkdGgpLFxuICAgICAgdG9wOiBwZXJjZW50VG9QaXhlbCh5LCBkaW1lbnNpb25zLmhlaWdodCksXG4gICAgICB3aWR0aDogTnVtYmVyKHdpZHRoSW5QaXhlbHMpLFxuICAgIH1cblxuICAgIGxldCBjcm9wcGVkID0gc2hhcnAoZmlsZS50ZW1wRmlsZVBhdGggfHwgZmlsZS5kYXRhLCBzaGFycE9wdGlvbnMpLmV4dHJhY3QoZm9ybWF0dGVkQ3JvcERhdGEpXG5cbiAgICBjcm9wcGVkID0gYXdhaXQgb3B0aW9uYWxseUFwcGVuZE1ldGFkYXRhKHtcbiAgICAgIHJlcSxcbiAgICAgIHNoYXJwRmlsZTogY3JvcHBlZCxcbiAgICAgIHdpdGhNZXRhZGF0YSxcbiAgICB9KVxuXG4gICAgcmV0dXJuIGF3YWl0IGNyb3BwZWQud2l0aE1ldGFkYXRhKCkudG9CdWZmZXIoe1xuICAgICAgcmVzb2x2ZVdpdGhPYmplY3Q6IHRydWUsXG4gICAgfSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjcm9wcGluZyBpbWFnZTpgLCBlcnJvcilcbiAgICB0aHJvdyBlcnJvclxuICB9XG59XG4iXSwibmFtZXMiOlsiY3JvcEltYWdlIiwicGVyY2VudFRvUGl4ZWwiLCJ2YWx1ZSIsImRpbWVuc2lvbiIsIk1hdGgiLCJmbG9vciIsInBhcnNlRmxvYXQiLCJjcm9wRGF0YSIsImRpbWVuc2lvbnMiLCJmaWxlIiwiaGVpZ2h0SW5QaXhlbHMiLCJyZXEiLCJ3aWR0aEluUGl4ZWxzIiwid2l0aE1ldGFkYXRhIiwieCIsInkiLCJmaWxlSXNBbmltYXRlZFR5cGUiLCJpbmNsdWRlcyIsIm1pbWV0eXBlIiwic2hhcnBPcHRpb25zIiwiYW5pbWF0ZWQiLCJmb3JtYXR0ZWRDcm9wRGF0YSIsImhlaWdodCIsIk51bWJlciIsImxlZnQiLCJ3aWR0aCIsInRvcCIsImNyb3BwZWQiLCJzaGFycCIsInRlbXBGaWxlUGF0aCIsImRhdGEiLCJleHRyYWN0Iiwib3B0aW9uYWxseUFwcGVuZE1ldGFkYXRhIiwic2hhcnBGaWxlIiwidG9CdWZmZXIiLCJyZXNvbHZlV2l0aE9iamVjdCIsImVycm9yIiwiY29uc29sZSJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQXdCc0JBLFNBQVM7ZUFBVEE7O0lBZFRDLGNBQWM7ZUFBZEE7Ozs4REFOSzswQ0FJMEM7Ozs7OztBQUVyRCxNQUFNQSxpQkFBaUIsQ0FBQ0MsT0FBT0M7SUFDcEMsSUFBSSxDQUFDRCxPQUFPLE9BQU87SUFDbkIsT0FBT0UsS0FBS0MsS0FBSyxDQUFDLEFBQUNDLFdBQVdKLFNBQVMsTUFBT0M7QUFDaEQ7QUFXTyxlQUFlSCxVQUFVLEVBQzlCTyxRQUFRLEVBQ1JDLFVBQVUsRUFDVkMsSUFBSSxFQUNKQyxjQUFjLEVBQ2RDLEdBQUcsRUFDSEMsYUFBYSxFQUNiQyxZQUFZLEVBQ0U7SUFDZCxJQUFJO1FBQ0YsTUFBTSxFQUFFQyxDQUFDLEVBQUVDLENBQUMsRUFBRSxHQUFHUjtRQUVqQixNQUFNUyxxQkFBcUI7WUFBQztZQUFjO1lBQWE7U0FBYSxDQUFDQyxRQUFRLENBQUNSLEtBQUtTLFFBQVE7UUFFM0YsTUFBTUMsZUFBNkIsQ0FBQztRQUVwQyxJQUFJSCxvQkFBb0JHLGFBQWFDLFFBQVEsR0FBRztRQUVoRCxNQUFNQyxvQkFBb0I7WUFDeEJDLFFBQVFDLE9BQU9iO1lBQ2ZjLE1BQU12QixlQUFlYSxHQUFHTixXQUFXaUIsS0FBSztZQUN4Q0MsS0FBS3pCLGVBQWVjLEdBQUdQLFdBQVdjLE1BQU07WUFDeENHLE9BQU9GLE9BQU9YO1FBQ2hCO1FBRUEsSUFBSWUsVUFBVUMsSUFBQUEsY0FBSyxFQUFDbkIsS0FBS29CLFlBQVksSUFBSXBCLEtBQUtxQixJQUFJLEVBQUVYLGNBQWNZLE9BQU8sQ0FBQ1Y7UUFFMUVNLFVBQVUsTUFBTUssSUFBQUEsa0RBQXdCLEVBQUM7WUFDdkNyQjtZQUNBc0IsV0FBV047WUFDWGQ7UUFDRjtRQUVBLE9BQU8sTUFBTWMsUUFBUWQsWUFBWSxHQUFHcUIsUUFBUSxDQUFDO1lBQzNDQyxtQkFBbUI7UUFDckI7SUFDRixFQUFFLE9BQU9DLE9BQU87UUFDZEMsUUFBUUQsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsRUFBRUE7UUFDdkMsTUFBTUE7SUFDUjtBQUNGIn0=