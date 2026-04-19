/* eslint-disable no-underscore-dangle */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _httpstatus = /*#__PURE__*/ _interop_require_default(require("http-status"));
const _executeAccess = /*#__PURE__*/ _interop_require_default(require("../../auth/executeAccess"));
const _types = require("../../auth/types");
const _combineQueries = require("../../database/combineQueries");
const _errors = require("../../errors");
const _afterChange = require("../../fields/hooks/afterChange");
const _afterRead = require("../../fields/hooks/afterRead");
const _commitTransaction = require("../../utilities/commitTransaction");
const _initTransaction = require("../../utilities/initTransaction");
const _killTransaction = require("../../utilities/killTransaction");
const _getLatestCollectionVersion = require("../../versions/getLatestCollectionVersion");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function restoreVersion(args) {
    const { id, collection: { config: collectionConfig }, depth, overrideAccess = false, req, req: { fallbackLocale, locale, payload, t }, showHiddenFields } = args;
    try {
        const shouldCommit = await (0, _initTransaction.initTransaction)(req);
        if (!id) {
            throw new _errors.APIError('Missing ID of version to restore.', _httpstatus.default.BAD_REQUEST);
        }
        // /////////////////////////////////////
        // Retrieve original raw version
        // /////////////////////////////////////
        const { docs: versionDocs } = await req.payload.db.findVersions({
            collection: collectionConfig.slug,
            limit: 1,
            locale,
            req,
            where: {
                id: {
                    equals: id
                }
            }
        });
        const [rawVersion] = versionDocs;
        if (!rawVersion) {
            throw new _errors.NotFound(t);
        }
        const parentDocID = rawVersion.parent;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        const accessResults = !overrideAccess ? await (0, _executeAccess.default)({
            id: parentDocID,
            req
        }, collectionConfig.access.update) : true;
        const hasWherePolicy = (0, _types.hasWhereAccessResult)(accessResults);
        // /////////////////////////////////////
        // Retrieve document
        // /////////////////////////////////////
        const findOneArgs = {
            collection: collectionConfig.slug,
            locale,
            req,
            where: (0, _combineQueries.combineQueries)({
                id: {
                    equals: parentDocID
                }
            }, accessResults)
        };
        let doc;
        if (collectionConfig?.db?.findOne) {
            doc = await collectionConfig.db.findOne(findOneArgs);
        } else {
            doc = await req.payload.db.findOne(findOneArgs);
        }
        if (!doc && !hasWherePolicy) throw new _errors.NotFound(t);
        if (!doc && hasWherePolicy) throw new _errors.Forbidden(t);
        // /////////////////////////////////////
        // fetch previousDoc
        // /////////////////////////////////////
        const prevDocWithLocales = await (0, _getLatestCollectionVersion.getLatestCollectionVersion)({
            id: parentDocID,
            config: collectionConfig,
            payload,
            query: findOneArgs,
            req
        });
        // /////////////////////////////////////
        // Update
        // /////////////////////////////////////
        const restoreVersionArgs = {
            id: parentDocID,
            collection: collectionConfig.slug,
            data: rawVersion.version,
            req
        };
        let result;
        if (collectionConfig?.db?.updateOne) {
            result = await collectionConfig.db.updateOne(restoreVersionArgs);
        } else {
            result = await req.payload.db.updateOne(restoreVersionArgs);
        }
        // /////////////////////////////////////
        // Save `previousDoc` as a version after restoring
        // /////////////////////////////////////
        const prevVersion = {
            ...prevDocWithLocales
        };
        delete prevVersion.id;
        await payload.db.createVersion({
            autosave: false,
            collectionSlug: collectionConfig.slug,
            createdAt: prevVersion.createdAt,
            parent: parentDocID,
            req,
            updatedAt: new Date().toISOString(),
            versionData: rawVersion.version
        });
        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////
        result = await (0, _afterRead.afterRead)({
            collection: collectionConfig,
            context: req.context,
            depth,
            doc: result,
            draft: undefined,
            fallbackLocale,
            global: null,
            locale,
            overrideAccess,
            req,
            showHiddenFields
        });
        // /////////////////////////////////////
        // afterRead - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook)=>{
            await priorHook;
            result = await hook({
                collection: collectionConfig,
                context: req.context,
                doc: result,
                req
            }) || result;
        }, Promise.resolve());
        // /////////////////////////////////////
        // afterChange - Fields
        // /////////////////////////////////////
        result = await (0, _afterChange.afterChange)({
            collection: collectionConfig,
            context: req.context,
            data: result,
            doc: result,
            global: null,
            operation: 'update',
            previousDoc: prevDocWithLocales,
            req
        });
        // /////////////////////////////////////
        // afterChange - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook)=>{
            await priorHook;
            result = await hook({
                collection: collectionConfig,
                context: req.context,
                doc: result,
                operation: 'update',
                previousDoc: prevDocWithLocales,
                req
            }) || result;
        }, Promise.resolve());
        if (shouldCommit) await (0, _commitTransaction.commitTransaction)(req);
        return result;
    } catch (error) {
        await (0, _killTransaction.killTransaction)(req);
        throw error;
    }
}
const _default = restoreVersion;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb2xsZWN0aW9ucy9vcGVyYXRpb25zL3Jlc3RvcmVWZXJzaW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVyc2NvcmUtZGFuZ2xlICovXG5pbXBvcnQgaHR0cFN0YXR1cyBmcm9tICdodHRwLXN0YXR1cydcblxuaW1wb3J0IHR5cGUgeyBGaW5kT25lQXJncyB9IGZyb20gJy4uLy4uL2RhdGFiYXNlL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBQYXlsb2FkUmVxdWVzdCB9IGZyb20gJy4uLy4uL2V4cHJlc3MvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IENvbGxlY3Rpb24sIFR5cGVXaXRoSUQgfSBmcm9tICcuLi9jb25maWcvdHlwZXMnXG5cbmltcG9ydCBleGVjdXRlQWNjZXNzIGZyb20gJy4uLy4uL2F1dGgvZXhlY3V0ZUFjY2VzcydcbmltcG9ydCB7IGhhc1doZXJlQWNjZXNzUmVzdWx0IH0gZnJvbSAnLi4vLi4vYXV0aC90eXBlcydcbmltcG9ydCB7IGNvbWJpbmVRdWVyaWVzIH0gZnJvbSAnLi4vLi4vZGF0YWJhc2UvY29tYmluZVF1ZXJpZXMnXG5pbXBvcnQgeyBBUElFcnJvciwgRm9yYmlkZGVuLCBOb3RGb3VuZCB9IGZyb20gJy4uLy4uL2Vycm9ycydcbmltcG9ydCB7IGFmdGVyQ2hhbmdlIH0gZnJvbSAnLi4vLi4vZmllbGRzL2hvb2tzL2FmdGVyQ2hhbmdlJ1xuaW1wb3J0IHsgYWZ0ZXJSZWFkIH0gZnJvbSAnLi4vLi4vZmllbGRzL2hvb2tzL2FmdGVyUmVhZCdcbmltcG9ydCB7IGNvbW1pdFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2NvbW1pdFRyYW5zYWN0aW9uJ1xuaW1wb3J0IHsgaW5pdFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2luaXRUcmFuc2FjdGlvbidcbmltcG9ydCB7IGtpbGxUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9raWxsVHJhbnNhY3Rpb24nXG5pbXBvcnQgeyBnZXRMYXRlc3RDb2xsZWN0aW9uVmVyc2lvbiB9IGZyb20gJy4uLy4uL3ZlcnNpb25zL2dldExhdGVzdENvbGxlY3Rpb25WZXJzaW9uJ1xuXG5leHBvcnQgdHlwZSBBcmd1bWVudHMgPSB7XG4gIGNvbGxlY3Rpb246IENvbGxlY3Rpb25cbiAgY3VycmVudERlcHRoPzogbnVtYmVyXG4gIGRlcHRoPzogbnVtYmVyXG4gIGRpc2FibGVFcnJvcnM/OiBib29sZWFuXG4gIGlkOiBudW1iZXIgfCBzdHJpbmdcbiAgb3ZlcnJpZGVBY2Nlc3M/OiBib29sZWFuXG4gIHJlcTogUGF5bG9hZFJlcXVlc3RcbiAgc2hvd0hpZGRlbkZpZWxkcz86IGJvb2xlYW5cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzdG9yZVZlcnNpb248VCBleHRlbmRzIFR5cGVXaXRoSUQgPSBhbnk+KGFyZ3M6IEFyZ3VtZW50cyk6IFByb21pc2U8VD4ge1xuICBjb25zdCB7XG4gICAgaWQsXG4gICAgY29sbGVjdGlvbjogeyBjb25maWc6IGNvbGxlY3Rpb25Db25maWcgfSxcbiAgICBkZXB0aCxcbiAgICBvdmVycmlkZUFjY2VzcyA9IGZhbHNlLFxuICAgIHJlcSxcbiAgICByZXE6IHsgZmFsbGJhY2tMb2NhbGUsIGxvY2FsZSwgcGF5bG9hZCwgdCB9LFxuICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gIH0gPSBhcmdzXG5cbiAgdHJ5IHtcbiAgICBjb25zdCBzaG91bGRDb21taXQgPSBhd2FpdCBpbml0VHJhbnNhY3Rpb24ocmVxKVxuXG4gICAgaWYgKCFpZCkge1xuICAgICAgdGhyb3cgbmV3IEFQSUVycm9yKCdNaXNzaW5nIElEIG9mIHZlcnNpb24gdG8gcmVzdG9yZS4nLCBodHRwU3RhdHVzLkJBRF9SRVFVRVNUKVxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBSZXRyaWV2ZSBvcmlnaW5hbCByYXcgdmVyc2lvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGNvbnN0IHsgZG9jczogdmVyc2lvbkRvY3MgfSA9IGF3YWl0IHJlcS5wYXlsb2FkLmRiLmZpbmRWZXJzaW9ucyh7XG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLnNsdWcsXG4gICAgICBsaW1pdDogMSxcbiAgICAgIGxvY2FsZSxcbiAgICAgIHJlcSxcbiAgICAgIHdoZXJlOiB7IGlkOiB7IGVxdWFsczogaWQgfSB9LFxuICAgIH0pXG5cbiAgICBjb25zdCBbcmF3VmVyc2lvbl0gPSB2ZXJzaW9uRG9jc1xuXG4gICAgaWYgKCFyYXdWZXJzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmQodClcbiAgICB9XG5cbiAgICBjb25zdCBwYXJlbnREb2NJRCA9IHJhd1ZlcnNpb24ucGFyZW50XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQWNjZXNzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgY29uc3QgYWNjZXNzUmVzdWx0cyA9ICFvdmVycmlkZUFjY2Vzc1xuICAgICAgPyBhd2FpdCBleGVjdXRlQWNjZXNzKHsgaWQ6IHBhcmVudERvY0lELCByZXEgfSwgY29sbGVjdGlvbkNvbmZpZy5hY2Nlc3MudXBkYXRlKVxuICAgICAgOiB0cnVlXG4gICAgY29uc3QgaGFzV2hlcmVQb2xpY3kgPSBoYXNXaGVyZUFjY2Vzc1Jlc3VsdChhY2Nlc3NSZXN1bHRzKVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJldHJpZXZlIGRvY3VtZW50XG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgY29uc3QgZmluZE9uZUFyZ3M6IEZpbmRPbmVBcmdzID0ge1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgbG9jYWxlLFxuICAgICAgcmVxLFxuICAgICAgd2hlcmU6IGNvbWJpbmVRdWVyaWVzKHsgaWQ6IHsgZXF1YWxzOiBwYXJlbnREb2NJRCB9IH0sIGFjY2Vzc1Jlc3VsdHMpLFxuICAgIH1cblxuICAgIGxldCBkb2M6IFRcbiAgICBpZiAoY29sbGVjdGlvbkNvbmZpZz8uZGI/LmZpbmRPbmUpIHtcbiAgICAgIGRvYyA9IGF3YWl0IGNvbGxlY3Rpb25Db25maWcuZGIuZmluZE9uZShmaW5kT25lQXJncylcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jID0gYXdhaXQgcmVxLnBheWxvYWQuZGIuZmluZE9uZShmaW5kT25lQXJncylcbiAgICB9XG5cbiAgICBpZiAoIWRvYyAmJiAhaGFzV2hlcmVQb2xpY3kpIHRocm93IG5ldyBOb3RGb3VuZCh0KVxuICAgIGlmICghZG9jICYmIGhhc1doZXJlUG9saWN5KSB0aHJvdyBuZXcgRm9yYmlkZGVuKHQpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gZmV0Y2ggcHJldmlvdXNEb2NcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBjb25zdCBwcmV2RG9jV2l0aExvY2FsZXMgPSBhd2FpdCBnZXRMYXRlc3RDb2xsZWN0aW9uVmVyc2lvbih7XG4gICAgICBpZDogcGFyZW50RG9jSUQsXG4gICAgICBjb25maWc6IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICBwYXlsb2FkLFxuICAgICAgcXVlcnk6IGZpbmRPbmVBcmdzLFxuICAgICAgcmVxLFxuICAgIH0pXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gVXBkYXRlXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgY29uc3QgcmVzdG9yZVZlcnNpb25BcmdzID0ge1xuICAgICAgaWQ6IHBhcmVudERvY0lELFxuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgZGF0YTogcmF3VmVyc2lvbi52ZXJzaW9uLFxuICAgICAgcmVxLFxuICAgIH1cbiAgICBsZXQgcmVzdWx0XG4gICAgaWYgKGNvbGxlY3Rpb25Db25maWc/LmRiPy51cGRhdGVPbmUpIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IGNvbGxlY3Rpb25Db25maWcuZGIudXBkYXRlT25lKHJlc3RvcmVWZXJzaW9uQXJncylcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgcmVxLnBheWxvYWQuZGIudXBkYXRlT25lKHJlc3RvcmVWZXJzaW9uQXJncylcbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gU2F2ZSBgcHJldmlvdXNEb2NgIGFzIGEgdmVyc2lvbiBhZnRlciByZXN0b3JpbmdcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBjb25zdCBwcmV2VmVyc2lvbiA9IHsgLi4ucHJldkRvY1dpdGhMb2NhbGVzIH1cblxuICAgIGRlbGV0ZSBwcmV2VmVyc2lvbi5pZFxuXG4gICAgYXdhaXQgcGF5bG9hZC5kYi5jcmVhdGVWZXJzaW9uKHtcbiAgICAgIGF1dG9zYXZlOiBmYWxzZSxcbiAgICAgIGNvbGxlY3Rpb25TbHVnOiBjb2xsZWN0aW9uQ29uZmlnLnNsdWcsXG4gICAgICBjcmVhdGVkQXQ6IHByZXZWZXJzaW9uLmNyZWF0ZWRBdCxcbiAgICAgIHBhcmVudDogcGFyZW50RG9jSUQsXG4gICAgICByZXEsXG4gICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHZlcnNpb25EYXRhOiByYXdWZXJzaW9uLnZlcnNpb24sXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlclJlYWQgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBhZnRlclJlYWQoe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgZGVwdGgsXG4gICAgICBkb2M6IHJlc3VsdCxcbiAgICAgIGRyYWZ0OiB1bmRlZmluZWQsXG4gICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgIGdsb2JhbDogbnVsbCxcbiAgICAgIGxvY2FsZSxcbiAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgcmVxLFxuICAgICAgc2hvd0hpZGRlbkZpZWxkcyxcbiAgICB9KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGFmdGVyUmVhZCAtIENvbGxlY3Rpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmhvb2tzLmFmdGVyUmVhZC5yZWR1Y2UoYXN5bmMgKHByaW9ySG9vaywgaG9vaykgPT4ge1xuICAgICAgYXdhaXQgcHJpb3JIb29rXG5cbiAgICAgIHJlc3VsdCA9XG4gICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgICAgIGRvYzogcmVzdWx0LFxuICAgICAgICAgIHJlcSxcbiAgICAgICAgfSkpIHx8IHJlc3VsdFxuICAgIH0sIFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGFmdGVyQ2hhbmdlIC0gRmllbGRzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgcmVzdWx0ID0gYXdhaXQgYWZ0ZXJDaGFuZ2Uoe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgZGF0YTogcmVzdWx0LFxuICAgICAgZG9jOiByZXN1bHQsXG4gICAgICBnbG9iYWw6IG51bGwsXG4gICAgICBvcGVyYXRpb246ICd1cGRhdGUnLFxuICAgICAgcHJldmlvdXNEb2M6IHByZXZEb2NXaXRoTG9jYWxlcyxcbiAgICAgIHJlcSxcbiAgICB9KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGFmdGVyQ2hhbmdlIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYWZ0ZXJDaGFuZ2UucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICByZXN1bHQgPVxuICAgICAgICAoYXdhaXQgaG9vayh7XG4gICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgICAgICBjb250ZXh0OiByZXEuY29udGV4dCxcbiAgICAgICAgICBkb2M6IHJlc3VsdCxcbiAgICAgICAgICBvcGVyYXRpb246ICd1cGRhdGUnLFxuICAgICAgICAgIHByZXZpb3VzRG9jOiBwcmV2RG9jV2l0aExvY2FsZXMsXG4gICAgICAgICAgcmVxLFxuICAgICAgICB9KSkgfHwgcmVzdWx0XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICBpZiAoc2hvdWxkQ29tbWl0KSBhd2FpdCBjb21taXRUcmFuc2FjdGlvbihyZXEpXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgYXdhaXQga2lsbFRyYW5zYWN0aW9uKHJlcSlcbiAgICB0aHJvdyBlcnJvclxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHJlc3RvcmVWZXJzaW9uXG4iXSwibmFtZXMiOlsicmVzdG9yZVZlcnNpb24iLCJhcmdzIiwiaWQiLCJjb2xsZWN0aW9uIiwiY29uZmlnIiwiY29sbGVjdGlvbkNvbmZpZyIsImRlcHRoIiwib3ZlcnJpZGVBY2Nlc3MiLCJyZXEiLCJmYWxsYmFja0xvY2FsZSIsImxvY2FsZSIsInBheWxvYWQiLCJ0Iiwic2hvd0hpZGRlbkZpZWxkcyIsInNob3VsZENvbW1pdCIsImluaXRUcmFuc2FjdGlvbiIsIkFQSUVycm9yIiwiaHR0cFN0YXR1cyIsIkJBRF9SRVFVRVNUIiwiZG9jcyIsInZlcnNpb25Eb2NzIiwiZGIiLCJmaW5kVmVyc2lvbnMiLCJzbHVnIiwibGltaXQiLCJ3aGVyZSIsImVxdWFscyIsInJhd1ZlcnNpb24iLCJOb3RGb3VuZCIsInBhcmVudERvY0lEIiwicGFyZW50IiwiYWNjZXNzUmVzdWx0cyIsImV4ZWN1dGVBY2Nlc3MiLCJhY2Nlc3MiLCJ1cGRhdGUiLCJoYXNXaGVyZVBvbGljeSIsImhhc1doZXJlQWNjZXNzUmVzdWx0IiwiZmluZE9uZUFyZ3MiLCJjb21iaW5lUXVlcmllcyIsImRvYyIsImZpbmRPbmUiLCJGb3JiaWRkZW4iLCJwcmV2RG9jV2l0aExvY2FsZXMiLCJnZXRMYXRlc3RDb2xsZWN0aW9uVmVyc2lvbiIsInF1ZXJ5IiwicmVzdG9yZVZlcnNpb25BcmdzIiwiZGF0YSIsInZlcnNpb24iLCJyZXN1bHQiLCJ1cGRhdGVPbmUiLCJwcmV2VmVyc2lvbiIsImNyZWF0ZVZlcnNpb24iLCJhdXRvc2F2ZSIsImNvbGxlY3Rpb25TbHVnIiwiY3JlYXRlZEF0IiwidXBkYXRlZEF0IiwiRGF0ZSIsInRvSVNPU3RyaW5nIiwidmVyc2lvbkRhdGEiLCJhZnRlclJlYWQiLCJjb250ZXh0IiwiZHJhZnQiLCJ1bmRlZmluZWQiLCJnbG9iYWwiLCJob29rcyIsInJlZHVjZSIsInByaW9ySG9vayIsImhvb2siLCJQcm9taXNlIiwicmVzb2x2ZSIsImFmdGVyQ2hhbmdlIiwib3BlcmF0aW9uIiwicHJldmlvdXNEb2MiLCJjb21taXRUcmFuc2FjdGlvbiIsImVycm9yIiwia2lsbFRyYW5zYWN0aW9uIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiJBQUFBLHVDQUF1Qzs7OzsrQkE0TnZDOzs7ZUFBQTs7O21FQTNOdUI7c0VBTUc7dUJBQ1c7Z0NBQ047d0JBQ2U7NkJBQ2xCOzJCQUNGO21DQUNRO2lDQUNGO2lDQUNBOzRDQUNXOzs7Ozs7QUFhM0MsZUFBZUEsZUFBMkNDLElBQWU7SUFDdkUsTUFBTSxFQUNKQyxFQUFFLEVBQ0ZDLFlBQVksRUFBRUMsUUFBUUMsZ0JBQWdCLEVBQUUsRUFDeENDLEtBQUssRUFDTEMsaUJBQWlCLEtBQUssRUFDdEJDLEdBQUcsRUFDSEEsS0FBSyxFQUFFQyxjQUFjLEVBQUVDLE1BQU0sRUFBRUMsT0FBTyxFQUFFQyxDQUFDLEVBQUUsRUFDM0NDLGdCQUFnQixFQUNqQixHQUFHWjtJQUVKLElBQUk7UUFDRixNQUFNYSxlQUFlLE1BQU1DLElBQUFBLGdDQUFlLEVBQUNQO1FBRTNDLElBQUksQ0FBQ04sSUFBSTtZQUNQLE1BQU0sSUFBSWMsZ0JBQVEsQ0FBQyxxQ0FBcUNDLG1CQUFVLENBQUNDLFdBQVc7UUFDaEY7UUFFQSx3Q0FBd0M7UUFDeEMsZ0NBQWdDO1FBQ2hDLHdDQUF3QztRQUV4QyxNQUFNLEVBQUVDLE1BQU1DLFdBQVcsRUFBRSxHQUFHLE1BQU1aLElBQUlHLE9BQU8sQ0FBQ1UsRUFBRSxDQUFDQyxZQUFZLENBQUM7WUFDOURuQixZQUFZRSxpQkFBaUJrQixJQUFJO1lBQ2pDQyxPQUFPO1lBQ1BkO1lBQ0FGO1lBQ0FpQixPQUFPO2dCQUFFdkIsSUFBSTtvQkFBRXdCLFFBQVF4QjtnQkFBRztZQUFFO1FBQzlCO1FBRUEsTUFBTSxDQUFDeUIsV0FBVyxHQUFHUDtRQUVyQixJQUFJLENBQUNPLFlBQVk7WUFDZixNQUFNLElBQUlDLGdCQUFRLENBQUNoQjtRQUNyQjtRQUVBLE1BQU1pQixjQUFjRixXQUFXRyxNQUFNO1FBRXJDLHdDQUF3QztRQUN4QyxTQUFTO1FBQ1Qsd0NBQXdDO1FBRXhDLE1BQU1DLGdCQUFnQixDQUFDeEIsaUJBQ25CLE1BQU15QixJQUFBQSxzQkFBYSxFQUFDO1lBQUU5QixJQUFJMkI7WUFBYXJCO1FBQUksR0FBR0gsaUJBQWlCNEIsTUFBTSxDQUFDQyxNQUFNLElBQzVFO1FBQ0osTUFBTUMsaUJBQWlCQyxJQUFBQSwyQkFBb0IsRUFBQ0w7UUFFNUMsd0NBQXdDO1FBQ3hDLG9CQUFvQjtRQUNwQix3Q0FBd0M7UUFFeEMsTUFBTU0sY0FBMkI7WUFDL0JsQyxZQUFZRSxpQkFBaUJrQixJQUFJO1lBQ2pDYjtZQUNBRjtZQUNBaUIsT0FBT2EsSUFBQUEsOEJBQWMsRUFBQztnQkFBRXBDLElBQUk7b0JBQUV3QixRQUFRRztnQkFBWTtZQUFFLEdBQUdFO1FBQ3pEO1FBRUEsSUFBSVE7UUFDSixJQUFJbEMsa0JBQWtCZ0IsSUFBSW1CLFNBQVM7WUFDakNELE1BQU0sTUFBTWxDLGlCQUFpQmdCLEVBQUUsQ0FBQ21CLE9BQU8sQ0FBQ0g7UUFDMUMsT0FBTztZQUNMRSxNQUFNLE1BQU0vQixJQUFJRyxPQUFPLENBQUNVLEVBQUUsQ0FBQ21CLE9BQU8sQ0FBQ0g7UUFDckM7UUFFQSxJQUFJLENBQUNFLE9BQU8sQ0FBQ0osZ0JBQWdCLE1BQU0sSUFBSVAsZ0JBQVEsQ0FBQ2hCO1FBQ2hELElBQUksQ0FBQzJCLE9BQU9KLGdCQUFnQixNQUFNLElBQUlNLGlCQUFTLENBQUM3QjtRQUVoRCx3Q0FBd0M7UUFDeEMsb0JBQW9CO1FBQ3BCLHdDQUF3QztRQUV4QyxNQUFNOEIscUJBQXFCLE1BQU1DLElBQUFBLHNEQUEwQixFQUFDO1lBQzFEekMsSUFBSTJCO1lBQ0p6QixRQUFRQztZQUNSTTtZQUNBaUMsT0FBT1A7WUFDUDdCO1FBQ0Y7UUFFQSx3Q0FBd0M7UUFDeEMsU0FBUztRQUNULHdDQUF3QztRQUV4QyxNQUFNcUMscUJBQXFCO1lBQ3pCM0MsSUFBSTJCO1lBQ0oxQixZQUFZRSxpQkFBaUJrQixJQUFJO1lBQ2pDdUIsTUFBTW5CLFdBQVdvQixPQUFPO1lBQ3hCdkM7UUFDRjtRQUNBLElBQUl3QztRQUNKLElBQUkzQyxrQkFBa0JnQixJQUFJNEIsV0FBVztZQUNuQ0QsU0FBUyxNQUFNM0MsaUJBQWlCZ0IsRUFBRSxDQUFDNEIsU0FBUyxDQUFDSjtRQUMvQyxPQUFPO1lBQ0xHLFNBQVMsTUFBTXhDLElBQUlHLE9BQU8sQ0FBQ1UsRUFBRSxDQUFDNEIsU0FBUyxDQUFDSjtRQUMxQztRQUVBLHdDQUF3QztRQUN4QyxrREFBa0Q7UUFDbEQsd0NBQXdDO1FBRXhDLE1BQU1LLGNBQWM7WUFBRSxHQUFHUixrQkFBa0I7UUFBQztRQUU1QyxPQUFPUSxZQUFZaEQsRUFBRTtRQUVyQixNQUFNUyxRQUFRVSxFQUFFLENBQUM4QixhQUFhLENBQUM7WUFDN0JDLFVBQVU7WUFDVkMsZ0JBQWdCaEQsaUJBQWlCa0IsSUFBSTtZQUNyQytCLFdBQVdKLFlBQVlJLFNBQVM7WUFDaEN4QixRQUFRRDtZQUNSckI7WUFDQStDLFdBQVcsSUFBSUMsT0FBT0MsV0FBVztZQUNqQ0MsYUFBYS9CLFdBQVdvQixPQUFPO1FBQ2pDO1FBRUEsd0NBQXdDO1FBQ3hDLHFCQUFxQjtRQUNyQix3Q0FBd0M7UUFFeENDLFNBQVMsTUFBTVcsSUFBQUEsb0JBQVMsRUFBQztZQUN2QnhELFlBQVlFO1lBQ1p1RCxTQUFTcEQsSUFBSW9ELE9BQU87WUFDcEJ0RDtZQUNBaUMsS0FBS1M7WUFDTGEsT0FBT0M7WUFDUHJEO1lBQ0FzRCxRQUFRO1lBQ1JyRDtZQUNBSDtZQUNBQztZQUNBSztRQUNGO1FBRUEsd0NBQXdDO1FBQ3hDLHlCQUF5QjtRQUN6Qix3Q0FBd0M7UUFFeEMsTUFBTVIsaUJBQWlCMkQsS0FBSyxDQUFDTCxTQUFTLENBQUNNLE1BQU0sQ0FBQyxPQUFPQyxXQUFXQztZQUM5RCxNQUFNRDtZQUVObEIsU0FDRSxBQUFDLE1BQU1tQixLQUFLO2dCQUNWaEUsWUFBWUU7Z0JBQ1p1RCxTQUFTcEQsSUFBSW9ELE9BQU87Z0JBQ3BCckIsS0FBS1M7Z0JBQ0x4QztZQUNGLE1BQU93QztRQUNYLEdBQUdvQixRQUFRQyxPQUFPO1FBRWxCLHdDQUF3QztRQUN4Qyx1QkFBdUI7UUFDdkIsd0NBQXdDO1FBRXhDckIsU0FBUyxNQUFNc0IsSUFBQUEsd0JBQVcsRUFBQztZQUN6Qm5FLFlBQVlFO1lBQ1p1RCxTQUFTcEQsSUFBSW9ELE9BQU87WUFDcEJkLE1BQU1FO1lBQ05ULEtBQUtTO1lBQ0xlLFFBQVE7WUFDUlEsV0FBVztZQUNYQyxhQUFhOUI7WUFDYmxDO1FBQ0Y7UUFFQSx3Q0FBd0M7UUFDeEMsMkJBQTJCO1FBQzNCLHdDQUF3QztRQUV4QyxNQUFNSCxpQkFBaUIyRCxLQUFLLENBQUNNLFdBQVcsQ0FBQ0wsTUFBTSxDQUFDLE9BQU9DLFdBQVdDO1lBQ2hFLE1BQU1EO1lBRU5sQixTQUNFLEFBQUMsTUFBTW1CLEtBQUs7Z0JBQ1ZoRSxZQUFZRTtnQkFDWnVELFNBQVNwRCxJQUFJb0QsT0FBTztnQkFDcEJyQixLQUFLUztnQkFDTHVCLFdBQVc7Z0JBQ1hDLGFBQWE5QjtnQkFDYmxDO1lBQ0YsTUFBT3dDO1FBQ1gsR0FBR29CLFFBQVFDLE9BQU87UUFFbEIsSUFBSXZELGNBQWMsTUFBTTJELElBQUFBLG9DQUFpQixFQUFDakU7UUFFMUMsT0FBT3dDO0lBQ1QsRUFBRSxPQUFPMEIsT0FBZ0I7UUFDdkIsTUFBTUMsSUFBQUEsZ0NBQWUsRUFBQ25FO1FBQ3RCLE1BQU1rRTtJQUNSO0FBQ0Y7TUFFQSxXQUFlMUUifQ==