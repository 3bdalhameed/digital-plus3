"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _executeAccess = /*#__PURE__*/ _interop_require_default(require("../../auth/executeAccess"));
const _combineQueries = require("../../database/combineQueries");
const _validateQueryPaths = require("../../database/queryValidation/validateQueryPaths");
const _afterRead = require("../../fields/hooks/afterRead");
const _commitTransaction = require("../../utilities/commitTransaction");
const _initTransaction = require("../../utilities/initTransaction");
const _killTransaction = require("../../utilities/killTransaction");
const _buildCollectionFields = require("../../versions/buildCollectionFields");
const _appendVersionToQueryKey = require("../../versions/drafts/appendVersionToQueryKey");
const _getQueryDraftsSort = require("../../versions/drafts/getQueryDraftsSort");
const _utils = require("./utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function find(incomingArgs) {
    let args = incomingArgs;
    try {
        const shouldCommit = await (0, _initTransaction.initTransaction)(args.req);
        // /////////////////////////////////////
        // beforeOperation - Collection
        // /////////////////////////////////////
        await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook)=>{
            await priorHook;
            args = await hook({
                args,
                collection: args.collection.config,
                context: args.req.context,
                operation: 'read',
                req: args.req
            }) || args;
        }, Promise.resolve());
        const { collection: { config: collectionConfig }, collection, currentDepth, depth, disableErrors, draft: draftsEnabled, limit, overrideAccess, page, pagination = true, req: { fallbackLocale, locale, payload }, req, showHiddenFields, sort, where } = args;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        let accessResult;
        if (!overrideAccess) {
            accessResult = await (0, _executeAccess.default)({
                disableErrors,
                req
            }, collectionConfig.access.read);
            // If errors are disabled, and access returns false, return empty results
            if (accessResult === false) {
                return {
                    docs: [],
                    hasNextPage: false,
                    hasPrevPage: false,
                    limit,
                    nextPage: null,
                    page: 1,
                    pagingCounter: 1,
                    prevPage: null,
                    totalDocs: 0,
                    totalPages: 1
                };
            }
        }
        // /////////////////////////////////////
        // Find
        // /////////////////////////////////////
        const usePagination = pagination && limit !== 0;
        const sanitizedLimit = limit ?? (usePagination ? 10 : 0);
        const sanitizedPage = page || 1;
        let result;
        let fullWhere = (0, _combineQueries.combineQueries)(where, accessResult);
        if (collectionConfig.versions?.drafts && draftsEnabled) {
            fullWhere = (0, _appendVersionToQueryKey.appendVersionToQueryKey)(fullWhere);
            await (0, _validateQueryPaths.validateQueryPaths)({
                collectionConfig: collection.config,
                overrideAccess,
                req,
                versionFields: (0, _buildCollectionFields.buildVersionCollectionFields)(collection.config),
                where: fullWhere
            });
            result = await payload.db.queryDrafts({
                collection: collectionConfig.slug,
                limit: sanitizedLimit,
                locale,
                page: sanitizedPage,
                pagination: usePagination,
                req,
                sort: (0, _getQueryDraftsSort.getQueryDraftsSort)(sort),
                where: fullWhere
            });
        } else {
            await (0, _validateQueryPaths.validateQueryPaths)({
                collectionConfig,
                overrideAccess,
                req,
                where
            });
            const dbArgs = {
                collection: collectionConfig.slug,
                limit: sanitizedLimit,
                locale,
                page: sanitizedPage,
                pagination,
                req,
                sort,
                where: fullWhere
            };
            if (collectionConfig?.db?.find) {
                result = await collectionConfig.db.find(dbArgs);
            } else {
                result = await payload.db.find(dbArgs);
            }
        }
        // /////////////////////////////////////
        // beforeRead - Collection
        // /////////////////////////////////////
        result = {
            ...result,
            docs: await Promise.all(result.docs.map(async (doc)=>{
                let docRef = doc;
                await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook)=>{
                    await priorHook;
                    docRef = await hook({
                        collection: collectionConfig,
                        context: req.context,
                        doc: docRef,
                        query: fullWhere,
                        req
                    }) || docRef;
                }, Promise.resolve());
                return docRef;
            }))
        };
        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////
        result = {
            ...result,
            docs: await Promise.all(result.docs.map(async (doc)=>(0, _afterRead.afterRead)({
                    collection: collectionConfig,
                    context: req.context,
                    currentDepth,
                    depth,
                    doc,
                    draft: draftsEnabled,
                    fallbackLocale,
                    findMany: true,
                    global: null,
                    locale,
                    overrideAccess,
                    req,
                    showHiddenFields
                })))
        };
        // /////////////////////////////////////
        // afterRead - Collection
        // /////////////////////////////////////
        result = {
            ...result,
            docs: await Promise.all(result.docs.map(async (doc)=>{
                let docRef = doc;
                await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook)=>{
                    await priorHook;
                    docRef = await hook({
                        collection: collectionConfig,
                        context: req.context,
                        doc: docRef,
                        findMany: true,
                        query: fullWhere,
                        req
                    }) || doc;
                }, Promise.resolve());
                return docRef;
            }))
        };
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await (0, _utils.buildAfterOperation)({
            args,
            collection: collectionConfig,
            operation: 'find',
            result
        });
        // /////////////////////////////////////
        // Return results
        // /////////////////////////////////////
        if (shouldCommit) await (0, _commitTransaction.commitTransaction)(req);
        return result;
    } catch (error) {
        await (0, _killTransaction.killTransaction)(args.req);
        throw error;
    }
}
const _default = find;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb2xsZWN0aW9ucy9vcGVyYXRpb25zL2ZpbmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY2Nlc3NSZXN1bHQgfSBmcm9tICcuLi8uLi9jb25maWcvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFBhZ2luYXRlZERvY3MgfSBmcm9tICcuLi8uLi9kYXRhYmFzZS90eXBlcydcbmltcG9ydCB0eXBlIHsgUGF5bG9hZFJlcXVlc3QgfSBmcm9tICcuLi8uLi9leHByZXNzL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBXaGVyZSB9IGZyb20gJy4uLy4uL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBDb2xsZWN0aW9uLCBUeXBlV2l0aElEIH0gZnJvbSAnLi4vY29uZmlnL3R5cGVzJ1xuXG5pbXBvcnQgZXhlY3V0ZUFjY2VzcyBmcm9tICcuLi8uLi9hdXRoL2V4ZWN1dGVBY2Nlc3MnXG5pbXBvcnQgeyBjb21iaW5lUXVlcmllcyB9IGZyb20gJy4uLy4uL2RhdGFiYXNlL2NvbWJpbmVRdWVyaWVzJ1xuaW1wb3J0IHsgdmFsaWRhdGVRdWVyeVBhdGhzIH0gZnJvbSAnLi4vLi4vZGF0YWJhc2UvcXVlcnlWYWxpZGF0aW9uL3ZhbGlkYXRlUXVlcnlQYXRocydcbmltcG9ydCB7IGFmdGVyUmVhZCB9IGZyb20gJy4uLy4uL2ZpZWxkcy9ob29rcy9hZnRlclJlYWQnXG5pbXBvcnQgeyBjb21taXRUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jb21taXRUcmFuc2FjdGlvbidcbmltcG9ydCB7IGluaXRUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9pbml0VHJhbnNhY3Rpb24nXG5pbXBvcnQgeyBraWxsVHJhbnNhY3Rpb24gfSBmcm9tICcuLi8uLi91dGlsaXRpZXMva2lsbFRyYW5zYWN0aW9uJ1xuaW1wb3J0IHsgYnVpbGRWZXJzaW9uQ29sbGVjdGlvbkZpZWxkcyB9IGZyb20gJy4uLy4uL3ZlcnNpb25zL2J1aWxkQ29sbGVjdGlvbkZpZWxkcydcbmltcG9ydCB7IGFwcGVuZFZlcnNpb25Ub1F1ZXJ5S2V5IH0gZnJvbSAnLi4vLi4vdmVyc2lvbnMvZHJhZnRzL2FwcGVuZFZlcnNpb25Ub1F1ZXJ5S2V5J1xuaW1wb3J0IHsgZ2V0UXVlcnlEcmFmdHNTb3J0IH0gZnJvbSAnLi4vLi4vdmVyc2lvbnMvZHJhZnRzL2dldFF1ZXJ5RHJhZnRzU29ydCdcbmltcG9ydCB7IGJ1aWxkQWZ0ZXJPcGVyYXRpb24gfSBmcm9tICcuL3V0aWxzJ1xuXG5leHBvcnQgdHlwZSBBcmd1bWVudHMgPSB7XG4gIGNvbGxlY3Rpb246IENvbGxlY3Rpb25cbiAgY3VycmVudERlcHRoPzogbnVtYmVyXG4gIGRlcHRoPzogbnVtYmVyXG4gIGRpc2FibGVFcnJvcnM/OiBib29sZWFuXG4gIGRyYWZ0PzogYm9vbGVhblxuICBsaW1pdD86IG51bWJlclxuICBvdmVycmlkZUFjY2Vzcz86IGJvb2xlYW5cbiAgcGFnZT86IG51bWJlclxuICBwYWdpbmF0aW9uPzogYm9vbGVhblxuICByZXE/OiBQYXlsb2FkUmVxdWVzdFxuICBzaG93SGlkZGVuRmllbGRzPzogYm9vbGVhblxuICBzb3J0Pzogc3RyaW5nXG4gIHdoZXJlPzogV2hlcmVcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmluZDxUIGV4dGVuZHMgVHlwZVdpdGhJRCAmIFJlY29yZDxzdHJpbmcsIHVua25vd24+PihcbiAgaW5jb21pbmdBcmdzOiBBcmd1bWVudHMsXG4pOiBQcm9taXNlPFBhZ2luYXRlZERvY3M8VD4+IHtcbiAgbGV0IGFyZ3MgPSBpbmNvbWluZ0FyZ3NcblxuICB0cnkge1xuICAgIGNvbnN0IHNob3VsZENvbW1pdCA9IGF3YWl0IGluaXRUcmFuc2FjdGlvbihhcmdzLnJlcSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVPcGVyYXRpb24gLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgYXJncy5jb2xsZWN0aW9uLmNvbmZpZy5ob29rcy5iZWZvcmVPcGVyYXRpb24ucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICBhcmdzID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgY29sbGVjdGlvbjogYXJncy5jb2xsZWN0aW9uLmNvbmZpZyxcbiAgICAgICAgICBjb250ZXh0OiBhcmdzLnJlcS5jb250ZXh0LFxuICAgICAgICAgIG9wZXJhdGlvbjogJ3JlYWQnLFxuICAgICAgICAgIHJlcTogYXJncy5yZXEsXG4gICAgICAgIH0pKSB8fCBhcmdzXG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICBjb25zdCB7XG4gICAgICBjb2xsZWN0aW9uOiB7IGNvbmZpZzogY29sbGVjdGlvbkNvbmZpZyB9LFxuICAgICAgY29sbGVjdGlvbixcbiAgICAgIGN1cnJlbnREZXB0aCxcbiAgICAgIGRlcHRoLFxuICAgICAgZGlzYWJsZUVycm9ycyxcbiAgICAgIGRyYWZ0OiBkcmFmdHNFbmFibGVkLFxuICAgICAgbGltaXQsXG4gICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgIHBhZ2UsXG4gICAgICBwYWdpbmF0aW9uID0gdHJ1ZSxcbiAgICAgIHJlcTogeyBmYWxsYmFja0xvY2FsZSwgbG9jYWxlLCBwYXlsb2FkIH0sXG4gICAgICByZXEsXG4gICAgICBzaG93SGlkZGVuRmllbGRzLFxuICAgICAgc29ydCxcbiAgICAgIHdoZXJlLFxuICAgIH0gPSBhcmdzXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQWNjZXNzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgbGV0IGFjY2Vzc1Jlc3VsdDogQWNjZXNzUmVzdWx0XG5cbiAgICBpZiAoIW92ZXJyaWRlQWNjZXNzKSB7XG4gICAgICBhY2Nlc3NSZXN1bHQgPSBhd2FpdCBleGVjdXRlQWNjZXNzKHsgZGlzYWJsZUVycm9ycywgcmVxIH0sIGNvbGxlY3Rpb25Db25maWcuYWNjZXNzLnJlYWQpXG5cbiAgICAgIC8vIElmIGVycm9ycyBhcmUgZGlzYWJsZWQsIGFuZCBhY2Nlc3MgcmV0dXJucyBmYWxzZSwgcmV0dXJuIGVtcHR5IHJlc3VsdHNcbiAgICAgIGlmIChhY2Nlc3NSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZG9jczogW10sXG4gICAgICAgICAgaGFzTmV4dFBhZ2U6IGZhbHNlLFxuICAgICAgICAgIGhhc1ByZXZQYWdlOiBmYWxzZSxcbiAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICBuZXh0UGFnZTogbnVsbCxcbiAgICAgICAgICBwYWdlOiAxLFxuICAgICAgICAgIHBhZ2luZ0NvdW50ZXI6IDEsXG4gICAgICAgICAgcHJldlBhZ2U6IG51bGwsXG4gICAgICAgICAgdG90YWxEb2NzOiAwLFxuICAgICAgICAgIHRvdGFsUGFnZXM6IDEsXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gRmluZFxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGNvbnN0IHVzZVBhZ2luYXRpb24gPSBwYWdpbmF0aW9uICYmIGxpbWl0ICE9PSAwXG4gICAgY29uc3Qgc2FuaXRpemVkTGltaXQgPSBsaW1pdCA/PyAodXNlUGFnaW5hdGlvbiA/IDEwIDogMClcbiAgICBjb25zdCBzYW5pdGl6ZWRQYWdlID0gcGFnZSB8fCAxXG5cbiAgICBsZXQgcmVzdWx0OiBQYWdpbmF0ZWREb2NzPFQ+XG5cbiAgICBsZXQgZnVsbFdoZXJlID0gY29tYmluZVF1ZXJpZXMod2hlcmUsIGFjY2Vzc1Jlc3VsdClcblxuICAgIGlmIChjb2xsZWN0aW9uQ29uZmlnLnZlcnNpb25zPy5kcmFmdHMgJiYgZHJhZnRzRW5hYmxlZCkge1xuICAgICAgZnVsbFdoZXJlID0gYXBwZW5kVmVyc2lvblRvUXVlcnlLZXkoZnVsbFdoZXJlKVxuXG4gICAgICBhd2FpdCB2YWxpZGF0ZVF1ZXJ5UGF0aHMoe1xuICAgICAgICBjb2xsZWN0aW9uQ29uZmlnOiBjb2xsZWN0aW9uLmNvbmZpZyxcbiAgICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICAgIHJlcSxcbiAgICAgICAgdmVyc2lvbkZpZWxkczogYnVpbGRWZXJzaW9uQ29sbGVjdGlvbkZpZWxkcyhjb2xsZWN0aW9uLmNvbmZpZyksXG4gICAgICAgIHdoZXJlOiBmdWxsV2hlcmUsXG4gICAgICB9KVxuXG4gICAgICByZXN1bHQgPSBhd2FpdCBwYXlsb2FkLmRiLnF1ZXJ5RHJhZnRzPFQ+KHtcbiAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgICBsaW1pdDogc2FuaXRpemVkTGltaXQsXG4gICAgICAgIGxvY2FsZSxcbiAgICAgICAgcGFnZTogc2FuaXRpemVkUGFnZSxcbiAgICAgICAgcGFnaW5hdGlvbjogdXNlUGFnaW5hdGlvbixcbiAgICAgICAgcmVxLFxuICAgICAgICBzb3J0OiBnZXRRdWVyeURyYWZ0c1NvcnQoc29ydCksXG4gICAgICAgIHdoZXJlOiBmdWxsV2hlcmUsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCB2YWxpZGF0ZVF1ZXJ5UGF0aHMoe1xuICAgICAgICBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgICAgcmVxLFxuICAgICAgICB3aGVyZSxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGRiQXJncyA9IHtcbiAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgICBsaW1pdDogc2FuaXRpemVkTGltaXQsXG4gICAgICAgIGxvY2FsZSxcbiAgICAgICAgcGFnZTogc2FuaXRpemVkUGFnZSxcbiAgICAgICAgcGFnaW5hdGlvbixcbiAgICAgICAgcmVxLFxuICAgICAgICBzb3J0LFxuICAgICAgICB3aGVyZTogZnVsbFdoZXJlLFxuICAgICAgfVxuXG4gICAgICBpZiAoY29sbGVjdGlvbkNvbmZpZz8uZGI/LmZpbmQpIHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5kYi5maW5kPFQ+KGRiQXJncylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHBheWxvYWQuZGIuZmluZDxUPihkYkFyZ3MpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGJlZm9yZVJlYWQgLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgcmVzdWx0ID0ge1xuICAgICAgLi4ucmVzdWx0LFxuICAgICAgZG9jczogYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHJlc3VsdC5kb2NzLm1hcChhc3luYyAoZG9jKSA9PiB7XG4gICAgICAgICAgbGV0IGRvY1JlZiA9IGRvY1xuXG4gICAgICAgICAgYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5ob29rcy5iZWZvcmVSZWFkLnJlZHVjZShhc3luYyAocHJpb3JIb29rLCBob29rKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCBwcmlvckhvb2tcblxuICAgICAgICAgICAgZG9jUmVmID1cbiAgICAgICAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgZG9jOiBkb2NSZWYsXG4gICAgICAgICAgICAgICAgcXVlcnk6IGZ1bGxXaGVyZSxcbiAgICAgICAgICAgICAgICByZXEsXG4gICAgICAgICAgICAgIH0pKSB8fCBkb2NSZWZcbiAgICAgICAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgICAgIHJldHVybiBkb2NSZWZcbiAgICAgICAgfSksXG4gICAgICApLFxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlclJlYWQgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSB7XG4gICAgICAuLi5yZXN1bHQsXG4gICAgICBkb2NzOiBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgcmVzdWx0LmRvY3MubWFwKGFzeW5jIChkb2MpID0+XG4gICAgICAgICAgYWZ0ZXJSZWFkPFQ+KHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgICBjb250ZXh0OiByZXEuY29udGV4dCxcbiAgICAgICAgICAgIGN1cnJlbnREZXB0aCxcbiAgICAgICAgICAgIGRlcHRoLFxuICAgICAgICAgICAgZG9jLFxuICAgICAgICAgICAgZHJhZnQ6IGRyYWZ0c0VuYWJsZWQsXG4gICAgICAgICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgICAgICAgIGZpbmRNYW55OiB0cnVlLFxuICAgICAgICAgICAgZ2xvYmFsOiBudWxsLFxuICAgICAgICAgICAgbG9jYWxlLFxuICAgICAgICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICAgICAgICByZXEsXG4gICAgICAgICAgICBzaG93SGlkZGVuRmllbGRzLFxuICAgICAgICAgIH0pLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJSZWFkIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIHJlc3VsdCA9IHtcbiAgICAgIC4uLnJlc3VsdCxcbiAgICAgIGRvY3M6IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICByZXN1bHQuZG9jcy5tYXAoYXN5bmMgKGRvYykgPT4ge1xuICAgICAgICAgIGxldCBkb2NSZWYgPSBkb2NcblxuICAgICAgICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYWZ0ZXJSZWFkLnJlZHVjZShhc3luYyAocHJpb3JIb29rLCBob29rKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCBwcmlvckhvb2tcblxuICAgICAgICAgICAgZG9jUmVmID1cbiAgICAgICAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgZG9jOiBkb2NSZWYsXG4gICAgICAgICAgICAgICAgZmluZE1hbnk6IHRydWUsXG4gICAgICAgICAgICAgICAgcXVlcnk6IGZ1bGxXaGVyZSxcbiAgICAgICAgICAgICAgICByZXEsXG4gICAgICAgICAgICAgIH0pKSB8fCBkb2NcbiAgICAgICAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgICAgIHJldHVybiBkb2NSZWZcbiAgICAgICAgfSksXG4gICAgICApLFxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlck9wZXJhdGlvbiAtIENvbGxlY3Rpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBidWlsZEFmdGVyT3BlcmF0aW9uPFQ+KHtcbiAgICAgIGFyZ3MsXG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgb3BlcmF0aW9uOiAnZmluZCcsXG4gICAgICByZXN1bHQsXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBSZXR1cm4gcmVzdWx0c1xuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGlmIChzaG91bGRDb21taXQpIGF3YWl0IGNvbW1pdFRyYW5zYWN0aW9uKHJlcSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICBhd2FpdCBraWxsVHJhbnNhY3Rpb24oYXJncy5yZXEpXG4gICAgdGhyb3cgZXJyb3JcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmaW5kXG4iXSwibmFtZXMiOlsiZmluZCIsImluY29taW5nQXJncyIsImFyZ3MiLCJzaG91bGRDb21taXQiLCJpbml0VHJhbnNhY3Rpb24iLCJyZXEiLCJjb2xsZWN0aW9uIiwiY29uZmlnIiwiaG9va3MiLCJiZWZvcmVPcGVyYXRpb24iLCJyZWR1Y2UiLCJwcmlvckhvb2siLCJob29rIiwiY29udGV4dCIsIm9wZXJhdGlvbiIsIlByb21pc2UiLCJyZXNvbHZlIiwiY29sbGVjdGlvbkNvbmZpZyIsImN1cnJlbnREZXB0aCIsImRlcHRoIiwiZGlzYWJsZUVycm9ycyIsImRyYWZ0IiwiZHJhZnRzRW5hYmxlZCIsImxpbWl0Iiwib3ZlcnJpZGVBY2Nlc3MiLCJwYWdlIiwicGFnaW5hdGlvbiIsImZhbGxiYWNrTG9jYWxlIiwibG9jYWxlIiwicGF5bG9hZCIsInNob3dIaWRkZW5GaWVsZHMiLCJzb3J0Iiwid2hlcmUiLCJhY2Nlc3NSZXN1bHQiLCJleGVjdXRlQWNjZXNzIiwiYWNjZXNzIiwicmVhZCIsImRvY3MiLCJoYXNOZXh0UGFnZSIsImhhc1ByZXZQYWdlIiwibmV4dFBhZ2UiLCJwYWdpbmdDb3VudGVyIiwicHJldlBhZ2UiLCJ0b3RhbERvY3MiLCJ0b3RhbFBhZ2VzIiwidXNlUGFnaW5hdGlvbiIsInNhbml0aXplZExpbWl0Iiwic2FuaXRpemVkUGFnZSIsInJlc3VsdCIsImZ1bGxXaGVyZSIsImNvbWJpbmVRdWVyaWVzIiwidmVyc2lvbnMiLCJkcmFmdHMiLCJhcHBlbmRWZXJzaW9uVG9RdWVyeUtleSIsInZhbGlkYXRlUXVlcnlQYXRocyIsInZlcnNpb25GaWVsZHMiLCJidWlsZFZlcnNpb25Db2xsZWN0aW9uRmllbGRzIiwiZGIiLCJxdWVyeURyYWZ0cyIsInNsdWciLCJnZXRRdWVyeURyYWZ0c1NvcnQiLCJkYkFyZ3MiLCJhbGwiLCJtYXAiLCJkb2MiLCJkb2NSZWYiLCJiZWZvcmVSZWFkIiwicXVlcnkiLCJhZnRlclJlYWQiLCJmaW5kTWFueSIsImdsb2JhbCIsImJ1aWxkQWZ0ZXJPcGVyYXRpb24iLCJjb21taXRUcmFuc2FjdGlvbiIsImVycm9yIiwia2lsbFRyYW5zYWN0aW9uIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsIm1hcHBpbmdzIjoiOzs7OytCQThRQTs7O2VBQUE7OztzRUF4UTBCO2dDQUNLO29DQUNJOzJCQUNUO21DQUNRO2lDQUNGO2lDQUNBO3VDQUNhO3lDQUNMO29DQUNMO3VCQUNDOzs7Ozs7QUFrQnBDLGVBQWVBLEtBQ2JDLFlBQXVCO0lBRXZCLElBQUlDLE9BQU9EO0lBRVgsSUFBSTtRQUNGLE1BQU1FLGVBQWUsTUFBTUMsSUFBQUEsZ0NBQWUsRUFBQ0YsS0FBS0csR0FBRztRQUVuRCx3Q0FBd0M7UUFDeEMsK0JBQStCO1FBQy9CLHdDQUF3QztRQUV4QyxNQUFNSCxLQUFLSSxVQUFVLENBQUNDLE1BQU0sQ0FBQ0MsS0FB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