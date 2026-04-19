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
const _types = require("../../auth/types");
const _combineQueries = require("../../database/combineQueries");
const _errors = require("../../errors");
const _afterRead = require("../../fields/hooks/afterRead");
const _deleteUserPreferences = require("../../preferences/deleteUserPreferences");
const _deleteAssociatedFiles = require("../../uploads/deleteAssociatedFiles");
const _commitTransaction = require("../../utilities/commitTransaction");
const _initTransaction = require("../../utilities/initTransaction");
const _killTransaction = require("../../utilities/killTransaction");
const _deleteCollectionVersions = require("../../versions/deleteCollectionVersions");
const _utils = require("./utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function deleteByID(incomingArgs) {
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
                operation: 'delete',
                req: args.req
            }) || args;
        }, Promise.resolve());
        const { id, collection: { config: collectionConfig }, depth, overrideAccess, req: { fallbackLocale, locale, payload: { config }, payload, t }, req, showHiddenFields } = args;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        const accessResults = !overrideAccess ? await (0, _executeAccess.default)({
            id,
            req
        }, collectionConfig.access.delete) : true;
        const hasWhereAccess = (0, _types.hasWhereAccessResult)(accessResults);
        // /////////////////////////////////////
        // beforeDelete - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.beforeDelete.reduce(async (priorHook, hook)=>{
            await priorHook;
            return hook({
                id,
                collection: collectionConfig,
                context: req.context,
                req
            });
        }, Promise.resolve());
        // /////////////////////////////////////
        // Retrieve document
        // /////////////////////////////////////
        let docToDelete;
        const dbArgs = {
            collection: collectionConfig.slug,
            locale: req.locale,
            req,
            where: (0, _combineQueries.combineQueries)({
                id: {
                    equals: id
                }
            }, accessResults)
        };
        if (collectionConfig?.db?.findOne) {
            docToDelete = await collectionConfig.db.findOne(dbArgs);
        } else {
            docToDelete = await req.payload.db.findOne(dbArgs);
        }
        if (!docToDelete && !hasWhereAccess) throw new _errors.NotFound(t);
        if (!docToDelete && hasWhereAccess) throw new _errors.Forbidden(t);
        await (0, _deleteAssociatedFiles.deleteAssociatedFiles)({
            collectionConfig,
            config,
            doc: docToDelete,
            overrideDelete: true,
            t
        });
        // /////////////////////////////////////
        // Delete versions
        // /////////////////////////////////////
        if (collectionConfig.versions) {
            await (0, _deleteCollectionVersions.deleteCollectionVersions)({
                id,
                slug: collectionConfig.slug,
                payload,
                req
            });
        }
        // /////////////////////////////////////
        // Delete document
        // /////////////////////////////////////
        let result;
        const deleteOneArgs = {
            collection: collectionConfig.slug,
            req,
            where: {
                id: {
                    equals: id
                }
            }
        };
        if (collectionConfig?.db?.deleteOne) {
            result = await collectionConfig?.db.deleteOne(deleteOneArgs);
        } else {
            result = await payload.db.deleteOne(deleteOneArgs);
        }
        // /////////////////////////////////////
        // Delete Preferences
        // /////////////////////////////////////
        await (0, _deleteUserPreferences.deleteUserPreferences)({
            collectionConfig,
            ids: [
                id
            ],
            payload,
            req
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
        // afterDelete - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook)=>{
            await priorHook;
            result = await hook({
                id,
                collection: collectionConfig,
                context: req.context,
                doc: result,
                req
            }) || result;
        }, Promise.resolve());
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await (0, _utils.buildAfterOperation)({
            args,
            collection: collectionConfig,
            operation: 'deleteByID',
            result
        });
        // /////////////////////////////////////
        // 8. Return results
        // /////////////////////////////////////
        if (shouldCommit) await (0, _commitTransaction.commitTransaction)(req);
        return result;
    } catch (error) {
        await (0, _killTransaction.killTransaction)(args.req);
        throw error;
    }
}
const _default = deleteByID;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb2xsZWN0aW9ucy9vcGVyYXRpb25zL2RlbGV0ZUJ5SUQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZW5lcmF0ZWRUeXBlcyB9IGZyb20gJy4uLy4uLydcbmltcG9ydCB0eXBlIHsgUGF5bG9hZFJlcXVlc3QgfSBmcm9tICcuLi8uLi9leHByZXNzL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBEb2N1bWVudCB9IGZyb20gJy4uLy4uL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBCZWZvcmVPcGVyYXRpb25Ib29rLCBDb2xsZWN0aW9uIH0gZnJvbSAnLi4vY29uZmlnL3R5cGVzJ1xuXG5pbXBvcnQgZXhlY3V0ZUFjY2VzcyBmcm9tICcuLi8uLi9hdXRoL2V4ZWN1dGVBY2Nlc3MnXG5pbXBvcnQgeyBoYXNXaGVyZUFjY2Vzc1Jlc3VsdCB9IGZyb20gJy4uLy4uL2F1dGgvdHlwZXMnXG5pbXBvcnQgeyBjb21iaW5lUXVlcmllcyB9IGZyb20gJy4uLy4uL2RhdGFiYXNlL2NvbWJpbmVRdWVyaWVzJ1xuaW1wb3J0IHsgRm9yYmlkZGVuLCBOb3RGb3VuZCB9IGZyb20gJy4uLy4uL2Vycm9ycydcbmltcG9ydCB7IGFmdGVyUmVhZCB9IGZyb20gJy4uLy4uL2ZpZWxkcy9ob29rcy9hZnRlclJlYWQnXG5pbXBvcnQgeyBkZWxldGVVc2VyUHJlZmVyZW5jZXMgfSBmcm9tICcuLi8uLi9wcmVmZXJlbmNlcy9kZWxldGVVc2VyUHJlZmVyZW5jZXMnXG5pbXBvcnQgeyBkZWxldGVBc3NvY2lhdGVkRmlsZXMgfSBmcm9tICcuLi8uLi91cGxvYWRzL2RlbGV0ZUFzc29jaWF0ZWRGaWxlcydcbmltcG9ydCB7IGNvbW1pdFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2NvbW1pdFRyYW5zYWN0aW9uJ1xuaW1wb3J0IHsgaW5pdFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2luaXRUcmFuc2FjdGlvbidcbmltcG9ydCB7IGtpbGxUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9raWxsVHJhbnNhY3Rpb24nXG5pbXBvcnQgeyBkZWxldGVDb2xsZWN0aW9uVmVyc2lvbnMgfSBmcm9tICcuLi8uLi92ZXJzaW9ucy9kZWxldGVDb2xsZWN0aW9uVmVyc2lvbnMnXG5pbXBvcnQgeyBidWlsZEFmdGVyT3BlcmF0aW9uIH0gZnJvbSAnLi91dGlscydcblxuZXhwb3J0IHR5cGUgQXJndW1lbnRzID0ge1xuICBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uXG4gIGRlcHRoPzogbnVtYmVyXG4gIGlkOiBudW1iZXIgfCBzdHJpbmdcbiAgb3ZlcnJpZGVBY2Nlc3M/OiBib29sZWFuXG4gIHJlcTogUGF5bG9hZFJlcXVlc3RcbiAgc2hvd0hpZGRlbkZpZWxkcz86IGJvb2xlYW5cbn1cblxuYXN5bmMgZnVuY3Rpb24gZGVsZXRlQnlJRDxUU2x1ZyBleHRlbmRzIGtleW9mIEdlbmVyYXRlZFR5cGVzWydjb2xsZWN0aW9ucyddPihcbiAgaW5jb21pbmdBcmdzOiBBcmd1bWVudHMsXG4pOiBQcm9taXNlPERvY3VtZW50PiB7XG4gIGxldCBhcmdzID0gaW5jb21pbmdBcmdzXG5cbiAgdHJ5IHtcbiAgICBjb25zdCBzaG91bGRDb21taXQgPSBhd2FpdCBpbml0VHJhbnNhY3Rpb24oYXJncy5yZXEpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYmVmb3JlT3BlcmF0aW9uIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGFyZ3MuY29sbGVjdGlvbi5jb25maWcuaG9va3MuYmVmb3JlT3BlcmF0aW9uLnJlZHVjZShcbiAgICAgIGFzeW5jIChwcmlvckhvb2s6IEJlZm9yZU9wZXJhdGlvbkhvb2sgfCBQcm9taXNlPHZvaWQ+LCBob29rOiBCZWZvcmVPcGVyYXRpb25Ib29rKSA9PiB7XG4gICAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICAgIGFyZ3MgPVxuICAgICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiBhcmdzLmNvbGxlY3Rpb24uY29uZmlnLFxuICAgICAgICAgICAgY29udGV4dDogYXJncy5yZXEuY29udGV4dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbjogJ2RlbGV0ZScsXG4gICAgICAgICAgICByZXE6IGFyZ3MucmVxLFxuICAgICAgICAgIH0pKSB8fCBhcmdzXG4gICAgICB9LFxuICAgICAgUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgKVxuXG4gICAgY29uc3Qge1xuICAgICAgaWQsXG4gICAgICBjb2xsZWN0aW9uOiB7IGNvbmZpZzogY29sbGVjdGlvbkNvbmZpZyB9LFxuICAgICAgZGVwdGgsXG4gICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgIHJlcToge1xuICAgICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgICAgbG9jYWxlLFxuICAgICAgICBwYXlsb2FkOiB7IGNvbmZpZyB9LFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICB0LFxuICAgICAgfSxcbiAgICAgIHJlcSxcbiAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgfSA9IGFyZ3NcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBBY2Nlc3NcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBjb25zdCBhY2Nlc3NSZXN1bHRzID0gIW92ZXJyaWRlQWNjZXNzXG4gICAgICA/IGF3YWl0IGV4ZWN1dGVBY2Nlc3MoeyBpZCwgcmVxIH0sIGNvbGxlY3Rpb25Db25maWcuYWNjZXNzLmRlbGV0ZSlcbiAgICAgIDogdHJ1ZVxuICAgIGNvbnN0IGhhc1doZXJlQWNjZXNzID0gaGFzV2hlcmVBY2Nlc3NSZXN1bHQoYWNjZXNzUmVzdWx0cylcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVEZWxldGUgLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5ob29rcy5iZWZvcmVEZWxldGUucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICByZXR1cm4gaG9vayh7XG4gICAgICAgIGlkLFxuICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICBjb250ZXh0OiByZXEuY29udGV4dCxcbiAgICAgICAgcmVxLFxuICAgICAgfSlcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBSZXRyaWV2ZSBkb2N1bWVudFxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBsZXQgZG9jVG9EZWxldGU6IERvY3VtZW50XG4gICAgY29uc3QgZGJBcmdzID0ge1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgbG9jYWxlOiByZXEubG9jYWxlLFxuICAgICAgcmVxLFxuICAgICAgd2hlcmU6IGNvbWJpbmVRdWVyaWVzKHsgaWQ6IHsgZXF1YWxzOiBpZCB9IH0sIGFjY2Vzc1Jlc3VsdHMpLFxuICAgIH1cblxuICAgIGlmIChjb2xsZWN0aW9uQ29uZmlnPy5kYj8uZmluZE9uZSkge1xuICAgICAgZG9jVG9EZWxldGUgPSBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmRiLmZpbmRPbmUoZGJBcmdzKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2NUb0RlbGV0ZSA9IGF3YWl0IHJlcS5wYXlsb2FkLmRiLmZpbmRPbmUoZGJBcmdzKVxuICAgIH1cblxuICAgIGlmICghZG9jVG9EZWxldGUgJiYgIWhhc1doZXJlQWNjZXNzKSB0aHJvdyBuZXcgTm90Rm91bmQodClcbiAgICBpZiAoIWRvY1RvRGVsZXRlICYmIGhhc1doZXJlQWNjZXNzKSB0aHJvdyBuZXcgRm9yYmlkZGVuKHQpXG5cbiAgICBhd2FpdCBkZWxldGVBc3NvY2lhdGVkRmlsZXMoe1xuICAgICAgY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbmZpZyxcbiAgICAgIGRvYzogZG9jVG9EZWxldGUsXG4gICAgICBvdmVycmlkZURlbGV0ZTogdHJ1ZSxcbiAgICAgIHQsXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBEZWxldGUgdmVyc2lvbnNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBpZiAoY29sbGVjdGlvbkNvbmZpZy52ZXJzaW9ucykge1xuICAgICAgYXdhaXQgZGVsZXRlQ29sbGVjdGlvblZlcnNpb25zKHtcbiAgICAgICAgaWQsXG4gICAgICAgIHNsdWc6IGNvbGxlY3Rpb25Db25maWcuc2x1ZyxcbiAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgcmVxLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gRGVsZXRlIGRvY3VtZW50XG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgbGV0IHJlc3VsdFxuICAgIGNvbnN0IGRlbGV0ZU9uZUFyZ3MgPSB7XG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLnNsdWcsXG4gICAgICByZXEsXG4gICAgICB3aGVyZTogeyBpZDogeyBlcXVhbHM6IGlkIH0gfSxcbiAgICB9XG4gICAgaWYgKGNvbGxlY3Rpb25Db25maWc/LmRiPy5kZWxldGVPbmUpIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IGNvbGxlY3Rpb25Db25maWc/LmRiLmRlbGV0ZU9uZShkZWxldGVPbmVBcmdzKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCBwYXlsb2FkLmRiLmRlbGV0ZU9uZShkZWxldGVPbmVBcmdzKVxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBEZWxldGUgUHJlZmVyZW5jZXNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBhd2FpdCBkZWxldGVVc2VyUHJlZmVyZW5jZXMoe1xuICAgICAgY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGlkczogW2lkXSxcbiAgICAgIHBheWxvYWQsXG4gICAgICByZXEsXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlclJlYWQgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBhZnRlclJlYWQoe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgZGVwdGgsXG4gICAgICBkb2M6IHJlc3VsdCxcbiAgICAgIGRyYWZ0OiB1bmRlZmluZWQsXG4gICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgIGdsb2JhbDogbnVsbCxcbiAgICAgIGxvY2FsZSxcbiAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgcmVxLFxuICAgICAgc2hvd0hpZGRlbkZpZWxkcyxcbiAgICB9KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGFmdGVyUmVhZCAtIENvbGxlY3Rpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmhvb2tzLmFmdGVyUmVhZC5yZWR1Y2UoYXN5bmMgKHByaW9ySG9vaywgaG9vaykgPT4ge1xuICAgICAgYXdhaXQgcHJpb3JIb29rXG5cbiAgICAgIHJlc3VsdCA9XG4gICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgICAgIGRvYzogcmVzdWx0LFxuICAgICAgICAgIHJlcSxcbiAgICAgICAgfSkpIHx8IHJlc3VsdFxuICAgIH0sIFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGFmdGVyRGVsZXRlIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYWZ0ZXJEZWxldGUucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICByZXN1bHQgPVxuICAgICAgICAoYXdhaXQgaG9vayh7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgICAgICBjb250ZXh0OiByZXEuY29udGV4dCxcbiAgICAgICAgICBkb2M6IHJlc3VsdCxcbiAgICAgICAgICByZXEsXG4gICAgICAgIH0pKSB8fCByZXN1bHRcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlck9wZXJhdGlvbiAtIENvbGxlY3Rpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBidWlsZEFmdGVyT3BlcmF0aW9uPEdlbmVyYXRlZFR5cGVzWydjb2xsZWN0aW9ucyddW1RTbHVnXT4oe1xuICAgICAgYXJncyxcbiAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICBvcGVyYXRpb246ICdkZWxldGVCeUlEJyxcbiAgICAgIHJlc3VsdCxcbiAgICB9KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIDguIFJldHVybiByZXN1bHRzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKHNob3VsZENvbW1pdCkgYXdhaXQgY29tbWl0VHJhbnNhY3Rpb24ocmVxKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgIGF3YWl0IGtpbGxUcmFuc2FjdGlvbihhcmdzLnJlcSlcbiAgICB0aHJvdyBlcnJvclxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlbGV0ZUJ5SURcbiJdLCJuYW1lcyI6WyJkZWxldGVCeUlEIiwiaW5jb21pbmdBcmdzIiwiYXJncyIsInNob3VsZENvbW1pdCIsImluaXRUcmFuc2FjdGlvbiIsInJlcSIsImNvbGxlY3Rpb24iLCJjb25maWciLCJob29rcyIsImJlZm9yZU9wZXJhdGlvbiIsInJlZHVjZSIsInByaW9ySG9vayIsImhvb2siLCJjb250ZXh0Iiwib3BlcmF0aW9uIiwiUHJvbWlzZSIsInJlc29sdmUiLCJpZCIsImNvbGxlY3Rpb25Db25maWciLCJkZXB0aCIsIm92ZXJyaWRlQWNjZXNzIiwiZmFsbGJhY2tMb2NhbGUiLCJsb2NhbGUiLCJwYXlsb2FkIiwidCIsInNob3dIaWRkZW5GaWVsZHMiLCJhY2Nlc3NSZXN1bHRzIiwiZXhlY3V0ZUFjY2VzcyIsImFjY2VzcyIsImRlbGV0ZSIsImhhc1doZXJlQWNjZXNzIiwiaGFzV2hlcmVBY2Nlc3NSZXN1bHQiLCJiZWZvcmVEZWxldGUiLCJkb2NUb0RlbGV0ZSIsImRiQXJncyIsInNsdWciLCJ3aGVyZSIsImNvbWJpbmVRdWVyaWVzIiwiZXF1YWxzIiwiZGIiLCJmaW5kT25lIiwiTm90Rm91bmQiLCJGb3JiaWRkZW4iLCJkZWxldGVBc3NvY2lhdGVkRmlsZXMiLCJkb2MiLCJvdmVycmlkZURlbGV0ZSIsInZlcnNpb25zIiwiZGVsZXRlQ29sbGVjdGlvblZlcnNpb25zIiwicmVzdWx0IiwiZGVsZXRlT25lQXJncyIsImRlbGV0ZU9uZSIsImRlbGV0ZVVzZXJQcmVmZXJlbmNlcyIsImlkcyIsImFmdGVyUmVhZCIsImRyYWZ0IiwidW5kZWZpbmVkIiwiZ2xvYmFsIiwiYWZ0ZXJEZWxldGUiLCJidWlsZEFmdGVyT3BlcmF0aW9uIiwiY29tbWl0VHJhbnNhY3Rpb24iLCJlcnJvciIsImtpbGxUcmFuc2FjdGlvbiJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsIm1hcHBpbmdzIjoiOzs7OytCQThPQTs7O2VBQUE7OztzRUF6TzBCO3VCQUNXO2dDQUNOO3dCQUNLOzJCQUNWO3VDQUNZO3VDQUNBO21DQUNKO2lDQUNGO2lDQUNBOzBDQUNTO3VCQUNMOzs7Ozs7QUFXcEMsZUFBZUEsV0FDYkMsWUFBdUI7SUFFdkIsSUFBSUMsT0FBT0Q7SUFFWCxJQUFJO1FBQ0YsTUFBTUUsZUFBZSxNQUFNQyxJQUFBQSxnQ0FBZSxFQUFDRixLQUFLRyxHQUFHO1FBRW5ELHdDQUF3QztRQUN4QywrQkFBK0I7UUFDL0Isd0NBQXdDO1FBRXhDLE1BQU1ILEtBQUtJLFVBQVUsQ0FBQ0MsTUFBTSxD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