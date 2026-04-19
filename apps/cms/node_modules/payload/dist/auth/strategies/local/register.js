"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerLocalStrategy", {
    enumerable: true,
    get: function() {
        return registerLocalStrategy;
    }
});
const _errors = require("../../../errors");
const _generatePasswordSaltHash = require("./generatePasswordSaltHash");
const registerLocalStrategy = async ({ collection, doc, password, payload, req })=>{
    const existingUser = await payload.find({
        collection: collection.slug,
        depth: 0,
        where: {
            email: {
                equals: doc.email
            }
        }
    });
    if (existingUser.docs.length > 0) {
        throw new _errors.ValidationError([
            {
                field: 'email',
                message: req.t('error:userEmailAlreadyRegistered')
            }
        ]);
    }
    const { hash, salt } = await (0, _generatePasswordSaltHash.generatePasswordSaltHash)({
        password
    });
    const sanitizedDoc = {
        ...doc
    };
    if (sanitizedDoc.password) delete sanitizedDoc.password;
    const dbArgs = {
        collection: collection.slug,
        data: {
            ...sanitizedDoc,
            hash,
            salt
        },
        req
    };
    if (collection?.db?.create) {
        return collection.db.create(dbArgs);
    } else {
        return payload.db.create(dbArgs);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hdXRoL3N0cmF0ZWdpZXMvbG9jYWwvcmVnaXN0ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBQYXlsb2FkIH0gZnJvbSAnLi4vLi4vLi4nXG5pbXBvcnQgdHlwZSB7IFNhbml0aXplZENvbGxlY3Rpb25Db25maWcgfSBmcm9tICcuLi8uLi8uLi9jb2xsZWN0aW9ucy9jb25maWcvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFBheWxvYWRSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vLi4vZXhwcmVzcy90eXBlcydcblxuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vLi4vZXJyb3JzJ1xuaW1wb3J0IHsgZ2VuZXJhdGVQYXNzd29yZFNhbHRIYXNoIH0gZnJvbSAnLi9nZW5lcmF0ZVBhc3N3b3JkU2FsdEhhc2gnXG5cbnR5cGUgQXJncyA9IHtcbiAgY29sbGVjdGlvbjogU2FuaXRpemVkQ29sbGVjdGlvbkNvbmZpZ1xuICBkb2M6IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gIHBhc3N3b3JkOiBzdHJpbmdcbiAgcGF5bG9hZDogUGF5bG9hZFxuICByZXE6IFBheWxvYWRSZXF1ZXN0XG59XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlckxvY2FsU3RyYXRlZ3kgPSBhc3luYyAoe1xuICBjb2xsZWN0aW9uLFxuICBkb2MsXG4gIHBhc3N3b3JkLFxuICBwYXlsb2FkLFxuICByZXEsXG59OiBBcmdzKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4gPT4ge1xuICBjb25zdCBleGlzdGluZ1VzZXIgPSBhd2FpdCBwYXlsb2FkLmZpbmQoe1xuICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb24uc2x1ZyxcbiAgICBkZXB0aDogMCxcbiAgICB3aGVyZToge1xuICAgICAgZW1haWw6IHtcbiAgICAgICAgZXF1YWxzOiBkb2MuZW1haWwsXG4gICAgICB9LFxuICAgIH0sXG4gIH0pXG5cbiAgaWYgKGV4aXN0aW5nVXNlci5kb2NzLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKFtcbiAgICAgIHsgZmllbGQ6ICdlbWFpbCcsIG1lc3NhZ2U6IHJlcS50KCdlcnJvcjp1c2VyRW1haWxBbHJlYWR5UmVnaXN0ZXJlZCcpIH0sXG4gICAgXSlcbiAgfVxuXG4gIGNvbnN0IHsgaGFzaCwgc2FsdCB9ID0gYXdhaXQgZ2VuZXJhdGVQYXNzd29yZFNhbHRIYXNoKHsgcGFzc3dvcmQgfSlcblxuICBjb25zdCBzYW5pdGl6ZWREb2MgPSB7IC4uLmRvYyB9XG4gIGlmIChzYW5pdGl6ZWREb2MucGFzc3dvcmQpIGRlbGV0ZSBzYW5pdGl6ZWREb2MucGFzc3dvcmRcblxuICBjb25zdCBkYkFyZ3MgPSB7XG4gICAgY29sbGVjdGlvbjogY29sbGVjdGlvbi5zbHVnLFxuICAgIGRhdGE6IHtcbiAgICAgIC4uLnNhbml0aXplZERvYyxcbiAgICAgIGhhc2gsXG4gICAgICBzYWx0LFxuICAgIH0sXG4gICAgcmVxLFxuICB9XG4gIGlmIChjb2xsZWN0aW9uPy5kYj8uY3JlYXRlKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGIuY3JlYXRlKGRiQXJncylcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGF5bG9hZC5kYi5jcmVhdGUoZGJBcmdzKVxuICB9XG59XG4iXSwibmFtZXMiOlsicmVnaXN0ZXJMb2NhbFN0cmF0ZWd5IiwiY29sbGVjdGlvbiIsImRvYyIsInBhc3N3b3JkIiwicGF5bG9hZCIsInJlcSIsImV4aXN0aW5nVXNlciIsImZpbmQiLCJzbHVnIiwiZGVwdGgiLCJ3aGVyZSIsImVtYWlsIiwiZXF1YWxzIiwiZG9jcyIsImxlbmd0aCIsIlZhbGlkYXRpb25FcnJvciIsImZpZWxkIiwibWVzc2FnZSIsInQiLCJoYXNoIiwic2FsdCIsImdlbmVyYXRlUGFzc3dvcmRTYWx0SGFzaCIsInNhbml0aXplZERvYyIsImRiQXJncyIsImRhdGEiLCJkYiIsImNyZWF0ZSJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiI7Ozs7K0JBZWFBOzs7ZUFBQUE7Ozt3QkFYbUI7MENBQ1M7QUFVbEMsTUFBTUEsd0JBQXdCLE9BQU8sRUFDMUNDLFVBQVUsRUFDVkMsR0FBRyxFQUNIQyxRQUFRLEVBQ1JDLE9BQU8sRUFDUEMsR0FBRyxFQUNFO0lBQ0wsTUFBTUMsZUFBZSxNQUFNRixRQUFRRyxJQUFJLENBQUM7UUFDdENOLFlBQVlBLFdBQVdPLElBQUk7UUFDM0JDLE9BQU87UUFDUEMsT0FBTztZQUNMQyxPQUFPO2dCQUNMQyxRQUFRVixJQUFJUyxLQUFLO1lBQ25CO1FBQ0Y7SUFDRjtJQUVBLElBQUlMLGFBQWFPLElBQUksQ0FBQ0MsTUFBTSxHQUFHLEdBQUc7UUFDaEMsTUFBTSxJQUFJQyx1QkFBZSxDQUFDO1lBQ3hCO2dCQUFFQyxPQUFPO2dCQUFTQyxTQUFTWixJQUFJYSxDQUFDLENBQUM7WUFBb0M7U0FDdEU7SUFDSDtJQUVBLE1BQU0sRUFBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQUUsR0FBRyxNQUFNQyxJQUFBQSxrREFBd0IsRUFBQztRQUFFbEI7SUFBUztJQUVqRSxNQUFNbUIsZUFBZTtRQUFFLEdBQUdwQixHQUFHO0lBQUM7SUFDOUIsSUFBSW9CLGFBQWFuQixRQUFRLEVBQUUsT0FBT21CLGFBQWFuQixRQUFRO0lBRXZELE1BQU1vQixTQUFTO1FBQ2J0QixZQUFZQSxXQUFXTyxJQUFJO1FBQzNCZ0IsTUFBTTtZQUNKLEdBQUdGLFlBQVk7WUFDZkg7WUFDQUM7UUFDRjtRQUNBZjtJQUNGO0lBQ0EsSUFBSUosWUFBWXdCLElBQUlDLFFBQVE7UUFDMUIsT0FBT3pCLFdBQVd3QixFQUFFLENBQUNDLE1BQU0sQ0FBQ0g7SUFDOUIsT0FBTztRQUNMLE9BQU9uQixRQUFRcUIsRUFBRSxDQUFDQyxNQUFNLENBQUNIO0lBQzNCO0FBQ0YifQ==