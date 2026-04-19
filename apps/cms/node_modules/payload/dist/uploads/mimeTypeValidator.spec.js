"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _mimeTypeValidator = require("./mimeTypeValidator");
const options = {
    siblingData: {
        filename: 'file.xyz'
    }
};
describe('mimeTypeValidator', ()=>{
    it('should validate single mimeType', ()=>{
        const mimeTypes = [
            'image/png'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('image/png', options)).toBe(true);
    });
    it('should validate multiple mimeTypes', ()=>{
        const mimeTypes = [
            'image/png',
            'application/pdf'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('image/png', options)).toBe(true);
        expect(validate('application/pdf', options)).toBe(true);
    });
    it('should validate using wildcard', ()=>{
        const mimeTypes = [
            'image/*'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('image/png', options)).toBe(true);
        expect(validate('image/gif', options)).toBe(true);
    });
    it('should validate multiple wildcards', ()=>{
        const mimeTypes = [
            'image/*',
            'audio/*'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('image/png', options)).toBe(true);
        expect(validate('audio/mpeg', options)).toBe(true);
    });
    it('should not validate when unmatched', ()=>{
        const mimeTypes = [
            'image/png'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('audio/mpeg', options)).toBe("Invalid file type: 'audio/mpeg'");
    });
    it('should not validate when unmatched - multiple mimeTypes', ()=>{
        const mimeTypes = [
            'image/png',
            'application/pdf'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('audio/mpeg', options)).toBe("Invalid file type: 'audio/mpeg'");
    });
    it('should not validate using wildcard - unmatched', ()=>{
        const mimeTypes = [
            'image/*'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('audio/mpeg', options)).toBe("Invalid file type: 'audio/mpeg'");
    });
    it('should not validate multiple wildcards - unmatched', ()=>{
        const mimeTypes = [
            'image/*',
            'audio/*'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        expect(validate('video/mp4', options)).toBe("Invalid file type: 'video/mp4'");
        expect(validate('application/pdf', options)).toBe("Invalid file type: 'application/pdf'");
    });
    it('should not error when mimeType is missing', ()=>{
        const mimeTypes = [
            'image/*',
            'application/pdf'
        ];
        const validate = (0, _mimeTypeValidator.mimeTypeValidator)(mimeTypes);
        let value;
        expect(validate(value, options)).toBe('Invalid file type');
    });
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91cGxvYWRzL21pbWVUeXBlVmFsaWRhdG9yLnNwZWMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBWYWxpZGF0ZU9wdGlvbnMgfSBmcm9tICcuLi9maWVsZHMvY29uZmlnL3R5cGVzJ1xuXG5pbXBvcnQgeyBtaW1lVHlwZVZhbGlkYXRvciB9IGZyb20gJy4vbWltZVR5cGVWYWxpZGF0b3InXG5cbmNvbnN0IG9wdGlvbnMgPSB7IHNpYmxpbmdEYXRhOiB7IGZpbGVuYW1lOiAnZmlsZS54eXonIH0gfSBhcyBWYWxpZGF0ZU9wdGlvbnM8XG4gIHVuZGVmaW5lZCxcbiAgdW5kZWZpbmVkLFxuICB1bmRlZmluZWQsXG4gIHN0cmluZ1xuPlxuXG5kZXNjcmliZSgnbWltZVR5cGVWYWxpZGF0b3InLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgdmFsaWRhdGUgc2luZ2xlIG1pbWVUeXBlJywgKCkgPT4ge1xuICAgIGNvbnN0IG1pbWVUeXBlcyA9IFsnaW1hZ2UvcG5nJ11cbiAgICBjb25zdCB2YWxpZGF0ZSA9IG1pbWVUeXBlVmFsaWRhdG9yKG1pbWVUeXBlcylcbiAgICBleHBlY3QodmFsaWRhdGUoJ2ltYWdlL3BuZycsIG9wdGlvbnMpKS50b0JlKHRydWUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBtdWx0aXBsZSBtaW1lVHlwZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgbWltZVR5cGVzID0gWydpbWFnZS9wbmcnLCAnYXBwbGljYXRpb24vcGRmJ11cbiAgICBjb25zdCB2YWxpZGF0ZSA9IG1pbWVUeXBlVmFsaWRhdG9yKG1pbWVUeXBlcylcbiAgICBleHBlY3QodmFsaWRhdGUoJ2ltYWdlL3BuZycsIG9wdGlvbnMpKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHZhbGlkYXRlKCdhcHBsaWNhdGlvbi9wZGYnLCBvcHRpb25zKSkudG9CZSh0cnVlKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgdmFsaWRhdGUgdXNpbmcgd2lsZGNhcmQnLCAoKSA9PiB7XG4gICAgY29uc3QgbWltZVR5cGVzID0gWydpbWFnZS8qJ11cbiAgICBjb25zdCB2YWxpZGF0ZSA9IG1pbWVUeXBlVmFsaWRhdG9yKG1pbWVUeXBlcylcbiAgICBleHBlY3QodmFsaWRhdGUoJ2ltYWdlL3BuZycsIG9wdGlvbnMpKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHZhbGlkYXRlKCdpbWFnZS9naWYnLCBvcHRpb25zKSkudG9CZSh0cnVlKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgdmFsaWRhdGUgbXVsdGlwbGUgd2lsZGNhcmRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG1pbWVUeXBlcyA9IFsnaW1hZ2UvKicsICdhdWRpby8qJ11cbiAgICBjb25zdCB2YWxpZGF0ZSA9IG1pbWVUeXBlVmFsaWRhdG9yKG1pbWVUeXBlcylcbiAgICBleHBlY3QodmFsaWRhdGUoJ2ltYWdlL3BuZycsIG9wdGlvbnMpKS50b0JlKHRydWUpXG4gICAgZXhwZWN0KHZhbGlkYXRlKCdhdWRpby9tcGVnJywgb3B0aW9ucykpLnRvQmUodHJ1ZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIG5vdCB2YWxpZGF0ZSB3aGVuIHVubWF0Y2hlZCcsICgpID0+IHtcbiAgICBjb25zdCBtaW1lVHlwZXMgPSBbJ2ltYWdlL3BuZyddXG4gICAgY29uc3QgdmFsaWRhdGUgPSBtaW1lVHlwZVZhbGlkYXRvcihtaW1lVHlwZXMpXG4gICAgZXhwZWN0KHZhbGlkYXRlKCdhdWRpby9tcGVnJywgb3B0aW9ucykpLnRvQmUoXCJJbnZhbGlkIGZpbGUgdHlwZTogJ2F1ZGlvL21wZWcnXCIpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBub3QgdmFsaWRhdGUgd2hlbiB1bm1hdGNoZWQgLSBtdWx0aXBsZSBtaW1lVHlwZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgbWltZVR5cGVzID0gWydpbWFnZS9wbmcnLCAnYXBwbGljYXRpb24vcGRmJ11cbiAgICBjb25zdCB2YWxpZGF0ZSA9IG1pbWVUeXBlVmFsaWRhdG9yKG1pbWVUeXBlcylcbiAgICBleHBlY3QodmFsaWRhdGUoJ2F1ZGlvL21wZWcnLCBvcHRpb25zKSkudG9CZShcIkludmFsaWQgZmlsZSB0eXBlOiAnYXVkaW8vbXBlZydcIilcbiAgfSlcblxuICBpdCgnc2hvdWxkIG5vdCB2YWxpZGF0ZSB1c2luZyB3aWxkY2FyZCAtIHVubWF0Y2hlZCcsICgpID0+IHtcbiAgICBjb25zdCBtaW1lVHlwZXMgPSBbJ2ltYWdlLyonXVxuICAgIGNvbnN0IHZhbGlkYXRlID0gbWltZVR5cGVWYWxpZGF0b3IobWltZVR5cGVzKVxuICAgIGV4cGVjdCh2YWxpZGF0ZSgnYXVkaW8vbXBlZycsIG9wdGlvbnMpKS50b0JlKFwiSW52YWxpZCBmaWxlIHR5cGU6ICdhdWRpby9tcGVnJ1wiKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgbm90IHZhbGlkYXRlIG11bHRpcGxlIHdpbGRjYXJkcyAtIHVubWF0Y2hlZCcsICgpID0+IHtcbiAgICBjb25zdCBtaW1lVHlwZXMgPSBbJ2ltYWdlLyonLCAnYXVkaW8vKiddXG4gICAgY29uc3QgdmFsaWRhdGUgPSBtaW1lVHlwZVZhbGlkYXRvcihtaW1lVHlwZXMpXG4gICAgZXhwZWN0KHZhbGlkYXRlKCd2aWRlby9tcDQnLCBvcHRpb25zKSkudG9CZShcIkludmFsaWQgZmlsZSB0eXBlOiAndmlkZW8vbXA0J1wiKVxuICAgIGV4cGVjdCh2YWxpZGF0ZSgnYXBwbGljYXRpb24vcGRmJywgb3B0aW9ucykpLnRvQmUoXCJJbnZhbGlkIGZpbGUgdHlwZTogJ2FwcGxpY2F0aW9uL3BkZidcIilcbiAgfSlcblxuICBpdCgnc2hvdWxkIG5vdCBlcnJvciB3aGVuIG1pbWVUeXBlIGlzIG1pc3NpbmcnLCAoKSA9PiB7XG4gICAgY29uc3QgbWltZVR5cGVzID0gWydpbWFnZS8qJywgJ2FwcGxpY2F0aW9uL3BkZiddXG4gICAgY29uc3QgdmFsaWRhdGUgPSBtaW1lVHlwZVZhbGlkYXRvcihtaW1lVHlwZXMpXG4gICAgbGV0IHZhbHVlXG4gICAgZXhwZWN0KHZhbGlkYXRlKHZhbHVlLCBvcHRpb25zKSkudG9CZSgnSW52YWxpZCBmaWxlIHR5cGUnKVxuICB9KVxufSlcbiJdLCJuYW1lcyI6WyJvcHRpb25zIiwic2libGluZ0RhdGEiLCJmaWxlbmFtZSIsImRlc2NyaWJlIiwiaXQiLCJtaW1lVHlwZXMiLCJ2YWxpZGF0ZSIsIm1pbWVUeXBlVmFsaWRhdG9yIiwiZXhwZWN0IiwidG9CZSIsInZhbHVlIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJtYXBwaW5ncyI6Ijs7OzttQ0FFa0M7QUFFbEMsTUFBTUEsVUFBVTtJQUFFQyxhQUFhO1FBQUVDLFVBQVU7SUFBVztBQUFFO0FBT3hEQyxTQUFTLHFCQUFxQjtJQUM1QkMsR0FBRyxtQ0FBbUM7UUFDcEMsTUFBTUMsWUFBWTtZQUFDO1NBQVk7UUFDL0IsTUFBTUMsV0FBV0MsSUFBQUEsb0NBQWlCLEVBQUNGO1FBQ25DRyxPQUFPRixTQUFTLGFBQWFOLFVBQVVTLElBQUksQ0FBQztJQUM5QztJQUVBTCxHQUFHLHNDQUFzQztRQUN2QyxNQUFNQyxZQUFZO1lBQUM7WUFBYTtTQUFrQjtRQUNsRCxNQUFNQyxXQUFXQyxJQUFBQSxvQ0FBaUIsRUFBQ0Y7UUFDbkNHLE9BQU9GLFNBQVMsYUFBYU4sVUFBVVMsSUFBSSxDQUFDO1FBQzVDRCxPQUFPRixTQUFTLG1CQUFtQk4sVUFBVVMsSUFBSSxDQUFDO0lBQ3BEO0lBRUFMLEdBQUcsa0NBQWtDO1FBQ25DLE1BQU1DLFlBQVk7WUFBQztTQUFVO1FBQzdCLE1BQU1DLFdBQVdDLElBQUFBLG9DQUFpQixFQUFDRjtRQUNuQ0csT0FBT0YsU0FBUyxhQUFhTixVQUFVUyxJQUFJLENBQUM7UUFDNUNELE9BQU9GLFNBQVMsYUFBYU4sVUFBVVMsSUFBSSxDQUFDO0lBQzlDO0lBRUFMLEdBQUcsc0NBQXNDO1FBQ3ZDLE1BQU1DLFlBQVk7WUFBQztZQUFXO1NBQVU7UUFDeEMsTUFBTUMsV0FBV0MsSUFBQUEsb0NBQWlCLEVBQUNGO1FBQ25DRyxPQUFPRixTQUFTLGFBQWFOLFVBQVVTLElBQUksQ0FBQztRQUM1Q0QsT0FBT0YsU0FBUyxjQUFjTixVQUFVUyxJQUFJLENBQUM7SUFDL0M7SUFFQUwsR0FBRyxzQ0FBc0M7UUFDdkMsTUFBTUMsWUFBWTtZQUFDO1NBQVk7UUFDL0IsTUFBTUMsV0FBV0MsSUFBQUEsb0NBQWlCLEVBQUNGO1FBQ25DRyxPQUFPRixTQUFTLGNBQWNOLFVBQVVTLElBQUksQ0FBQztJQUMvQztJQUVBTCxHQUFHLDJEQUEyRDtRQUM1RCxNQUFNQyxZQUFZO1lBQUM7WUFBYTtTQUFrQjtRQUNsRCxNQUFNQyxXQUFXQyxJQUFBQSxvQ0FBaUIsRUFBQ0Y7UUFDbkNHLE9BQU9GLFNBQVMsY0FBY04sVUFBVVMsSUFBSSxDQUFDO0lBQy9DO0lBRUFMLEdBQUcsa0RBQWtEO1FBQ25ELE1BQU1DLFlBQVk7WUFBQztTQUFVO1FBQzdCLE1BQU1DLFdBQVdDLElBQUFBLG9DQUFpQixFQUFDRjtRQUNuQ0csT0FBT0YsU0FBUyxjQUFjTixVQUFVUyxJQUFJLENBQUM7SUFDL0M7SUFFQUwsR0FBRyxzREFBc0Q7UUFDdkQsTUFBTUMsWUFBWTtZQUFDO1lBQVc7U0FBVTtRQUN4QyxNQUFNQyxXQUFXQyxJQUFBQSxvQ0FBaUIsRUFBQ0Y7UUFDbkNHLE9BQU9GLFNBQVMsYUFBYU4sVUFBVVMsSUFBSSxDQUFDO1FBQzVDRCxPQUFPRixTQUFTLG1CQUFtQk4sVUFBVVMsSUFBSSxDQUFDO0lBQ3BEO0lBRUFMLEdBQUcsNkNBQTZDO1FBQzlDLE1BQU1DLFlBQVk7WUFBQztZQUFXO1NBQWtCO1FBQ2hELE1BQU1DLFdBQVdDLElBQUFBLG9DQUFpQixFQUFDRjtRQUNuQyxJQUFJSztRQUNKRixPQUFPRixTQUFTSSxPQUFPVixVQUFVUyxJQUFJLENBQUM7SUFDeEM7QUFDRiJ9