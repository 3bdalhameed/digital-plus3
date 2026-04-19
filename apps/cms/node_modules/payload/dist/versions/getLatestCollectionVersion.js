"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getLatestCollectionVersion", {
    enumerable: true,
    get: function() {
        return getLatestCollectionVersion;
    }
});
const _combineQueries = require("../database/combineQueries");
const _types = require("../types");
const _appendVersionToQueryKey = require("./drafts/appendVersionToQueryKey");
const getLatestCollectionVersion = async ({ id, config, payload, query, req })=>{
    let latestVersion;
    const hasConfigDb = Object.keys(config?.db ? config?.db : {}).length > 0;
    if (config.versions?.drafts && !hasConfigDb) {
        const { docs } = await payload.db.findVersions({
            collection: config.slug,
            limit: 1,
            pagination: false,
            req,
            sort: '-updatedAt',
            where: (0, _combineQueries.combineQueries)((0, _appendVersionToQueryKey.appendVersionToQueryKey)(query.where), {
                parent: {
                    equals: id
                }
            })
        });
        [latestVersion] = docs;
    }
    let doc;
    if (config?.db?.findOne) {
        doc = await config.db.findOne({
            ...query,
            req
        });
    } else {
        doc = await payload.db.findOne({
            ...query,
            req
        });
    }
    if (!latestVersion || (0, _types.docHasTimestamps)(doc) && latestVersion.updatedAt < doc.updatedAt) {
        return doc;
    }
    return {
        ...latestVersion.version,
        id,
        createdAt: latestVersion.createdAt,
        updatedAt: latestVersion.updatedAt
    };
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92ZXJzaW9ucy9nZXRMYXRlc3RDb2xsZWN0aW9uVmVyc2lvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFNhbml0aXplZENvbGxlY3Rpb25Db25maWcsIFR5cGVXaXRoSUQgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb25maWcvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEZpbmRPbmVBcmdzIH0gZnJvbSAnLi4vZGF0YWJhc2UvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFBheWxvYWQgfSBmcm9tICcuLi9wYXlsb2FkJ1xuaW1wb3J0IHR5cGUgeyBQYXlsb2FkUmVxdWVzdCB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBUeXBlV2l0aFZlcnNpb24gfSBmcm9tICcuL3R5cGVzJ1xuXG5pbXBvcnQgeyBjb21iaW5lUXVlcmllcyB9IGZyb20gJy4uL2RhdGFiYXNlL2NvbWJpbmVRdWVyaWVzJ1xuaW1wb3J0IHsgZG9jSGFzVGltZXN0YW1wcyB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgYXBwZW5kVmVyc2lvblRvUXVlcnlLZXkgfSBmcm9tICcuL2RyYWZ0cy9hcHBlbmRWZXJzaW9uVG9RdWVyeUtleSdcblxudHlwZSBBcmdzID0ge1xuICBjb25maWc6IFNhbml0aXplZENvbGxlY3Rpb25Db25maWdcbiAgaWQ6IG51bWJlciB8IHN0cmluZ1xuICBwYXlsb2FkOiBQYXlsb2FkXG4gIHF1ZXJ5OiBGaW5kT25lQXJnc1xuICByZXE/OiBQYXlsb2FkUmVxdWVzdFxufVxuXG5leHBvcnQgY29uc3QgZ2V0TGF0ZXN0Q29sbGVjdGlvblZlcnNpb24gPSBhc3luYyA8VCBleHRlbmRzIFR5cGVXaXRoSUQgPSBhbnk+KHtcbiAgaWQsXG4gIGNvbmZpZyxcbiAgcGF5bG9hZCxcbiAgcXVlcnksXG4gIHJlcSxcbn06IEFyZ3MpOiBQcm9taXNlPFQ+ID0+IHtcbiAgbGV0IGxhdGVzdFZlcnNpb246IFR5cGVXaXRoVmVyc2lvbjxUPlxuXG4gIGNvbnN0IGhhc0NvbmZpZ0RiID0gT2JqZWN0LmtleXMoY29uZmlnPy5kYiA/IGNvbmZpZz8uZGIgOiB7fSkubGVuZ3RoID4gMFxuXG4gIGlmIChjb25maWcudmVyc2lvbnM/LmRyYWZ0cyAmJiAhaGFzQ29uZmlnRGIpIHtcbiAgICBjb25zdCB7IGRvY3MgfSA9IGF3YWl0IHBheWxvYWQuZGIuZmluZFZlcnNpb25zPFQ+KHtcbiAgICAgIGNvbGxlY3Rpb246IGNvbmZpZy5zbHVnLFxuICAgICAgbGltaXQ6IDEsXG4gICAgICBwYWdpbmF0aW9uOiBmYWxzZSxcbiAgICAgIHJlcSxcbiAgICAgIHNvcnQ6ICctdXBkYXRlZEF0JyxcbiAgICAgIHdoZXJlOiBjb21iaW5lUXVlcmllcyhhcHBlbmRWZXJzaW9uVG9RdWVyeUtleShxdWVyeS53aGVyZSksIHsgcGFyZW50OiB7IGVxdWFsczogaWQgfSB9KSxcbiAgICB9KVxuICAgIDtbbGF0ZXN0VmVyc2lvbl0gPSBkb2NzXG4gIH1cblxuICBsZXQgZG9jXG4gIGlmIChjb25maWc/LmRiPy5maW5kT25lKSB7XG4gICAgZG9jID0gYXdhaXQgY29uZmlnLmRiLmZpbmRPbmU8VD4oeyAuLi5xdWVyeSwgcmVxIH0pXG4gIH0gZWxzZSB7XG4gICAgZG9jID0gYXdhaXQgcGF5bG9hZC5kYi5maW5kT25lPFQ+KHsgLi4ucXVlcnksIHJlcSB9KVxuICB9XG5cbiAgaWYgKCFsYXRlc3RWZXJzaW9uIHx8IChkb2NIYXNUaW1lc3RhbXBzKGRvYykgJiYgbGF0ZXN0VmVyc2lvbi51cGRhdGVkQXQgPCBkb2MudXBkYXRlZEF0KSkge1xuICAgIHJldHVybiBkb2NcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLi4ubGF0ZXN0VmVyc2lvbi52ZXJzaW9uLFxuICAgIGlkLFxuICAgIGNyZWF0ZWRBdDogbGF0ZXN0VmVyc2lvbi5jcmVhdGVkQXQsXG4gICAgdXBkYXRlZEF0OiBsYXRlc3RWZXJzaW9uLnVwZGF0ZWRBdCxcbiAgfVxufVxuIl0sIm5hbWVzIjpbImdldExhdGVzdENvbGxlY3Rpb25WZXJzaW9uIiwiaWQiLCJjb25maWciLCJwYXlsb2FkIiwicXVlcnkiLCJyZXEiLCJsYXRlc3RWZXJzaW9uIiwiaGFzQ29uZmlnRGIiLCJPYmplY3QiLCJrZXlzIiwiZGIiLCJsZW5ndGgiLCJ2ZXJzaW9ucyIsImRyYWZ0cyIsImRvY3MiLCJmaW5kVmVyc2lvbnMiLCJjb2xsZWN0aW9uIiwic2x1ZyIsImxpbWl0IiwicGFnaW5hdGlvbiIsInNvcnQiLCJ3aGVyZSIsImNvbWJpbmVRdWVyaWVzIiwiYXBwZW5kVmVyc2lvblRvUXVlcnlLZXkiLCJwYXJlbnQiLCJlcXVhbHMiLCJkb2MiLCJmaW5kT25lIiwiZG9jSGFzVGltZXN0YW1wcyIsInVwZGF0ZWRBdCIsInZlcnNpb24iLCJjcmVhdGVkQXQiXSwicmFuZ2VNYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJtYXBwaW5ncyI6Ijs7OzsrQkFrQmFBOzs7ZUFBQUE7OztnQ0Faa0I7dUJBQ0U7eUNBQ087QUFVakMsTUFBTUEsNkJBQTZCLE9BQW1DLEVBQzNFQyxFQUFFLEVBQ0ZDLE1BQU0sRUFDTkMsT0FBTyxFQUNQQyxLQUFLLEVBQ0xDLEdBQUcsRUFDRTtJQUNMLElBQUlDO0lBRUosTUFBTUMsY0FBY0MsT0FBT0MsSUFBSSxDQUFDUCxRQUFRUSxLQUFLUixRQUFRUSxLQUFLLENBQUMsR0FBR0MsTUFBTSxHQUFHO0lBRXZFLElBQUlULE9BQU9VLFFBQVEsRUFBRUMsVUFBVSxDQUFDTixhQUFhO1FBQzNDLE1BQU0sRUFBRU8sSUFBSSxFQUFFLEdBQUcsTUFBTVgsUUFBUU8sRUFBRSxDQUFDSyxZQUFZLENBQUk7WUFDaERDLFlBQVlkLE9BQU9lLElBQUk7WUFDdkJDLE9BQU87WUFDUEMsWUFBWTtZQUNaZDtZQUNBZSxNQUFNO1lBQ05DLE9BQU9DLElBQUFBLDhCQUFjLEVBQUNDLElBQUFBLGdEQUF1QixFQUFDbkIsTUFBTWlCLEtBQUssR0FBRztnQkFBRUcsUUFBUTtvQkFBRUMsUUFBUXhCO2dCQUFHO1lBQUU7UUFDdkY7UUFDQyxDQUFDSyxjQUFjLEdBQUdRO0lBQ3JCO0lBRUEsSUFBSVk7SUFDSixJQUFJeEIsUUFBUVEsSUFBSWlCLFNBQVM7UUFDdkJELE1BQU0sTUFBTXhCLE9BQU9RLEVBQUUsQ0FBQ2lCLE9BQU8sQ0FBSTtZQUFFLEdBQUd2QixLQUFLO1lBQUVDO1FBQUk7SUFDbkQsT0FBTztRQUNMcUIsTUFBTSxNQUFNdkIsUUFBUU8sRUFBRSxDQUFDaUIsT0FBTyxDQUFJO1lBQUUsR0FBR3ZCLEtBQUs7WUFBRUM7UUFBSTtJQUNwRDtJQUVBLElBQUksQ0FBQ0MsaUJBQWtCc0IsSUFBQUEsdUJBQWdCLEVBQUNGLFFBQVFwQixjQUFjdUIsU0FBUyxHQUFHSCxJQUFJRyxTQUFTLEVBQUc7UUFDeEYsT0FBT0g7SUFDVDtJQUVBLE9BQU87UUFDTCxHQUFHcEIsY0FBY3dCLE9BQU87UUFDeEI3QjtRQUNBOEIsV0FBV3pCLGNBQWN5QixTQUFTO1FBQ2xDRixXQUFXdkIsY0FBY3VCLFNBQVM7SUFDcEM7QUFDRiJ9