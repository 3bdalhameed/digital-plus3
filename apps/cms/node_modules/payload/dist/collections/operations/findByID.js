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
const _executeAccess = /*#__PURE__*/ _interop_require_default(require("../../auth/executeAccess"));
const _combineQueries = require("../../database/combineQueries");
const _errors = require("../../errors");
const _afterRead = require("../../fields/hooks/afterRead");
const _commitTransaction = require("../../utilities/commitTransaction");
const _initTransaction = require("../../utilities/initTransaction");
const _killTransaction = require("../../utilities/killTransaction");
const _replaceWithDraftIfAvailable = /*#__PURE__*/ _interop_require_default(require("../../versions/drafts/replaceWithDraftIfAvailable"));
const _utils = require("./utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function findByID(incomingArgs) {
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
        const { id, collection: { config: collectionConfig }, currentDepth, depth, disableErrors, draft: draftEnabled = false, overrideAccess = false, req: { fallbackLocale, locale, t }, req, showHiddenFields } = args;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        const accessResult = !overrideAccess ? await (0, _executeAccess.default)({
            id,
            disableErrors,
            req
        }, collectionConfig.access.read) : true;
        // If errors are disabled, and access returns false, return null
        if (accessResult === false) return null;
        const findOneArgs = {
            collection: collectionConfig.slug,
            locale,
            req: {
                transactionID: req.transactionID
            },
            where: (0, _combineQueries.combineQueries)({
                id: {
                    equals: id
                }
            }, accessResult)
        };
        // /////////////////////////////////////
        // Find by ID
        // /////////////////////////////////////
        if (!findOneArgs.where.and[0].id) throw new _errors.NotFound(t);
        let result;
        if (collectionConfig?.db?.findOne) {
            result = await collectionConfig.db.findOne(findOneArgs);
        } else {
            result = await req.payload.db.findOne(findOneArgs);
        }
        if (!result) {
            if (!disableErrors) {
                throw new _errors.NotFound(t);
            }
            return null;
        }
        // /////////////////////////////////////
        // Replace document with draft if available
        // /////////////////////////////////////
        if (collectionConfig.versions?.drafts && draftEnabled) {
            result = await (0, _replaceWithDraftIfAvailable.default)({
                accessResult,
                doc: result,
                entity: collectionConfig,
                entityType: 'collection',
                overrideAccess,
                req
            });
        }
        // /////////////////////////////////////
        // beforeRead - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook)=>{
            await priorHook;
            result = await hook({
                collection: collectionConfig,
                context: req.context,
                doc: result,
                query: findOneArgs.where,
                req
            }) || result;
        }, Promise.resolve());
        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////
        result = await (0, _afterRead.afterRead)({
            collection: collectionConfig,
            context: req.context,
            currentDepth,
            depth,
            doc: result,
            draft: draftEnabled,
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
                query: findOneArgs.where,
                req
            }) || result;
        }, Promise.resolve());
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await (0, _utils.buildAfterOperation)({
            args,
            collection: collectionConfig,
            operation: 'findByID',
            result: result
        }) // TODO: fix this typing
        ;
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
const _default = findByID;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb2xsZWN0aW9ucy9vcGVyYXRpb25zL2ZpbmRCeUlELnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVyc2NvcmUtZGFuZ2xlICovXG5pbXBvcnQgdHlwZSB7IEZpbmRPbmVBcmdzIH0gZnJvbSAnLi4vLi4vZGF0YWJhc2UvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFBheWxvYWRSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vZXhwcmVzcy90eXBlcydcbmltcG9ydCB0eXBlIHsgQ29sbGVjdGlvbiwgVHlwZVdpdGhJRCB9IGZyb20gJy4uL2NvbmZpZy90eXBlcydcblxuaW1wb3J0IGV4ZWN1dGVBY2Nlc3MgZnJvbSAnLi4vLi4vYXV0aC9leGVjdXRlQWNjZXNzJ1xuaW1wb3J0IHsgY29tYmluZVF1ZXJpZXMgfSBmcm9tICcuLi8uLi9kYXRhYmFzZS9jb21iaW5lUXVlcmllcydcbmltcG9ydCB7IE5vdEZvdW5kIH0gZnJvbSAnLi4vLi4vZXJyb3JzJ1xuaW1wb3J0IHsgYWZ0ZXJSZWFkIH0gZnJvbSAnLi4vLi4vZmllbGRzL2hvb2tzL2FmdGVyUmVhZCdcbmltcG9ydCB7IGNvbW1pdFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2NvbW1pdFRyYW5zYWN0aW9uJ1xuaW1wb3J0IHsgaW5pdFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2luaXRUcmFuc2FjdGlvbidcbmltcG9ydCB7IGtpbGxUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9raWxsVHJhbnNhY3Rpb24nXG5pbXBvcnQgcmVwbGFjZVdpdGhEcmFmdElmQXZhaWxhYmxlIGZyb20gJy4uLy4uL3ZlcnNpb25zL2RyYWZ0cy9yZXBsYWNlV2l0aERyYWZ0SWZBdmFpbGFibGUnXG5pbXBvcnQgeyBidWlsZEFmdGVyT3BlcmF0aW9uIH0gZnJvbSAnLi91dGlscydcblxuZXhwb3J0IHR5cGUgQXJndW1lbnRzID0ge1xuICBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uXG4gIGN1cnJlbnREZXB0aD86IG51bWJlclxuICBkZXB0aD86IG51bWJlclxuICBkaXNhYmxlRXJyb3JzPzogYm9vbGVhblxuICBkcmFmdD86IGJvb2xlYW5cbiAgaWQ6IG51bWJlciB8IHN0cmluZ1xuICBvdmVycmlkZUFjY2Vzcz86IGJvb2xlYW5cbiAgcmVxOiBQYXlsb2FkUmVxdWVzdFxuICBzaG93SGlkZGVuRmllbGRzPzogYm9vbGVhblxufVxuXG5hc3luYyBmdW5jdGlvbiBmaW5kQnlJRDxUIGV4dGVuZHMgVHlwZVdpdGhJRD4oaW5jb21pbmdBcmdzOiBBcmd1bWVudHMpOiBQcm9taXNlPFQ+IHtcbiAgbGV0IGFyZ3MgPSBpbmNvbWluZ0FyZ3NcblxuICB0cnkge1xuICAgIGNvbnN0IHNob3VsZENvbW1pdCA9IGF3YWl0IGluaXRUcmFuc2FjdGlvbihhcmdzLnJlcSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVPcGVyYXRpb24gLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgYXJncy5jb2xsZWN0aW9uLmNvbmZpZy5ob29rcy5iZWZvcmVPcGVyYXRpb24ucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICBhcmdzID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgY29sbGVjdGlvbjogYXJncy5jb2xsZWN0aW9uLmNvbmZpZyxcbiAgICAgICAgICBjb250ZXh0OiBhcmdzLnJlcS5jb250ZXh0LFxuICAgICAgICAgIG9wZXJhdGlvbjogJ3JlYWQnLFxuICAgICAgICAgIHJlcTogYXJncy5yZXEsXG4gICAgICAgIH0pKSB8fCBhcmdzXG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICBjb25zdCB7XG4gICAgICBpZCxcbiAgICAgIGNvbGxlY3Rpb246IHsgY29uZmlnOiBjb2xsZWN0aW9uQ29uZmlnIH0sXG4gICAgICBjdXJyZW50RGVwdGgsXG4gICAgICBkZXB0aCxcbiAgICAgIGRpc2FibGVFcnJvcnMsXG4gICAgICBkcmFmdDogZHJhZnRFbmFibGVkID0gZmFsc2UsXG4gICAgICBvdmVycmlkZUFjY2VzcyA9IGZhbHNlLFxuICAgICAgcmVxOiB7IGZhbGxiYWNrTG9jYWxlLCBsb2NhbGUsIHQgfSxcbiAgICAgIHJlcSxcbiAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgfSA9IGFyZ3NcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBBY2Nlc3NcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBjb25zdCBhY2Nlc3NSZXN1bHQgPSAhb3ZlcnJpZGVBY2Nlc3NcbiAgICAgID8gYXdhaXQgZXhlY3V0ZUFjY2Vzcyh7IGlkLCBkaXNhYmxlRXJyb3JzLCByZXEgfSwgY29sbGVjdGlvbkNvbmZpZy5hY2Nlc3MucmVhZClcbiAgICAgIDogdHJ1ZVxuXG4gICAgLy8gSWYgZXJyb3JzIGFyZSBkaXNhYmxlZCwgYW5kIGFjY2VzcyByZXR1cm5zIGZhbHNlLCByZXR1cm4gbnVsbFxuICAgIGlmIChhY2Nlc3NSZXN1bHQgPT09IGZhbHNlKSByZXR1cm4gbnVsbFxuXG4gICAgY29uc3QgZmluZE9uZUFyZ3M6IEZpbmRPbmVBcmdzID0ge1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgbG9jYWxlLFxuICAgICAgcmVxOiB7XG4gICAgICAgIHRyYW5zYWN0aW9uSUQ6IHJlcS50cmFuc2FjdGlvbklELFxuICAgICAgfSBhcyBQYXlsb2FkUmVxdWVzdCxcbiAgICAgIHdoZXJlOiBjb21iaW5lUXVlcmllcyh7IGlkOiB7IGVxdWFsczogaWQgfSB9LCBhY2Nlc3NSZXN1bHQpLFxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBGaW5kIGJ5IElEXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKCFmaW5kT25lQXJncy53aGVyZS5hbmRbMF0uaWQpIHRocm93IG5ldyBOb3RGb3VuZCh0KVxuXG4gICAgbGV0IHJlc3VsdDogVFxuICAgIGlmIChjb2xsZWN0aW9uQ29uZmlnPy5kYj8uZmluZE9uZSkge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5kYi5maW5kT25lKGZpbmRPbmVBcmdzKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCByZXEucGF5bG9hZC5kYi5maW5kT25lKGZpbmRPbmVBcmdzKVxuICAgIH1cblxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICBpZiAoIWRpc2FibGVFcnJvcnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IE5vdEZvdW5kKHQpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJlcGxhY2UgZG9jdW1lbnQgd2l0aCBkcmFmdCBpZiBhdmFpbGFibGVcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBpZiAoY29sbGVjdGlvbkNvbmZpZy52ZXJzaW9ucz8uZHJhZnRzICYmIGRyYWZ0RW5hYmxlZCkge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgcmVwbGFjZVdpdGhEcmFmdElmQXZhaWxhYmxlKHtcbiAgICAgICAgYWNjZXNzUmVzdWx0LFxuICAgICAgICBkb2M6IHJlc3VsdCxcbiAgICAgICAgZW50aXR5OiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICBlbnRpdHlUeXBlOiAnY29sbGVjdGlvbicsXG4gICAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgICByZXEsXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVSZWFkIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYmVmb3JlUmVhZC5yZWR1Y2UoYXN5bmMgKHByaW9ySG9vaywgaG9vaykgPT4ge1xuICAgICAgYXdhaXQgcHJpb3JIb29rXG5cbiAgICAgIHJlc3VsdCA9XG4gICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgICAgIGRvYzogcmVzdWx0LFxuICAgICAgICAgIHF1ZXJ5OiBmaW5kT25lQXJncy53aGVyZSxcbiAgICAgICAgICByZXEsXG4gICAgICAgIH0pKSB8fCByZXN1bHRcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlclJlYWQgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBhZnRlclJlYWQoe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgY3VycmVudERlcHRoLFxuICAgICAgZGVwdGgsXG4gICAgICBkb2M6IHJlc3VsdCxcbiAgICAgIGRyYWZ0OiBkcmFmdEVuYWJsZWQsXG4gICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgIGdsb2JhbDogbnVsbCxcbiAgICAgIGxvY2FsZSxcbiAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgcmVxLFxuICAgICAgc2hvd0hpZGRlbkZpZWxkcyxcbiAgICB9KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGFmdGVyUmVhZCAtIENvbGxlY3Rpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmhvb2tzLmFmdGVyUmVhZC5yZWR1Y2UoYXN5bmMgKHByaW9ySG9vaywgaG9vaykgPT4ge1xuICAgICAgYXdhaXQgcHJpb3JIb29rXG5cbiAgICAgIHJlc3VsdCA9XG4gICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgICAgIGRvYzogcmVzdWx0LFxuICAgICAgICAgIHF1ZXJ5OiBmaW5kT25lQXJncy53aGVyZSxcbiAgICAgICAgICByZXEsXG4gICAgICAgIH0pKSB8fCByZXN1bHRcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlck9wZXJhdGlvbiAtIENvbGxlY3Rpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBidWlsZEFmdGVyT3BlcmF0aW9uPFQ+KHtcbiAgICAgIGFyZ3MsXG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgb3BlcmF0aW9uOiAnZmluZEJ5SUQnLFxuICAgICAgcmVzdWx0OiByZXN1bHQgYXMgYW55LFxuICAgIH0pIC8vIFRPRE86IGZpeCB0aGlzIHR5cGluZ1xuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJldHVybiByZXN1bHRzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKHNob3VsZENvbW1pdCkgYXdhaXQgY29tbWl0VHJhbnNhY3Rpb24ocmVxKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgIGF3YWl0IGtpbGxUcmFuc2FjdGlvbihhcmdzLnJlcSlcbiAgICB0aHJvdyBlcnJvclxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZpbmRCeUlEXG4iXSwibmFtZXMiOlsiZmluZEJ5SUQiLCJpbmNvbWluZ0FyZ3MiLCJhcmdzIiwic2hvdWxkQ29tbWl0IiwiaW5pdFRyYW5zYWN0aW9uIiwicmVxIiwiY29sbGVjdGlvbiIsImNvbmZpZyIsImhvb2tzIiwiYmVmb3JlT3BlcmF0aW9uIiwicmVkdWNlIiwicHJpb3JIb29rIiwiaG9vayIsImNvbnRleHQiLCJvcGVyYXRpb24iLCJQcm9taXNlIiwicmVzb2x2ZSIsImlkIiwiY29sbGVjdGlvbkNvbmZpZyIsImN1cnJlbnREZXB0aCIsImRlcHRoIiwiZGlzYWJsZUVycm9ycyIsImRyYWZ0IiwiZHJhZnRFbmFibGVkIiwib3ZlcnJpZGVBY2Nlc3MiLCJmYWxsYmFja0xvY2FsZSIsImxvY2FsZSIsInQiLCJzaG93SGlkZGVuRmllbGRzIiwiYWNjZXNzUmVzdWx0IiwiZXhlY3V0ZUFjY2VzcyIsImFjY2VzcyIsInJlYWQiLCJmaW5kT25lQXJncyIsInNsdWciLCJ0cmFuc2FjdGlvbklEIiwid2hlcmUiLCJjb21iaW5lUXVlcmllcyIsImVxdWFscyIsImFuZCIsIk5vdEZvdW5kIiwicmVzdWx0IiwiZGIiLCJmaW5kT25lIiwicGF5bG9hZCIsInZlcnNpb25zIiwiZHJhZnRzIiwicmVwbGFjZVdpdGhEcmFmdElmQXZhaWxhYmxlIiwiZG9jIiwiZW50aXR5IiwiZW50aXR5VHlwZSIsImJlZm9yZVJlYWQiLCJxdWVyeSIsImFmdGVyUmVhZCIsImdsb2JhbCIsImJ1aWxkQWZ0ZXJPcGVyYXRpb24iLCJjb21taXRUcmFuc2FjdGlvbiIsImVycm9yIiwia2lsbFRyYW5zYWN0aW9uIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJtYXBwaW5ncyI6IkFBQUEsdUNBQXVDOzs7OytCQW9NdkM7OztlQUFBOzs7c0VBL0wwQjtnQ0FDSzt3QkFDTjsyQkFDQzttQ0FDUTtpQ0FDRjtpQ0FDQTtvRkFDUTt1QkFDSjs7Ozs7O0FBY3BDLGVBQWVBLFNBQStCQyxZQUF1QjtJQUNuRSxJQUFJQyxPQUFPRDtJQUVYLElBQUk7UUFDRixNQUFNRSxlQUFlLE1BQU1DLElBQUFBLGdDQUFlLEVBQUNGLEtBQUtHLEdBQUc7UUFFbkQsd0NBQXdDO1FBQ3hDLCtCQUErQjtRQUMvQix3Q0FBd0M7UUFFeEMsTUFBTUgsS0FBS0ksVUFBVSxDQUFDQyxNQUFNLENBQUNDLEtBQUssQ0FBQ0MsZUFBZSxDQUFDQyxNQUFNLENBQUMsT0FBT0MsV0FBV0M7WUFDMUUsTUFBTUQ7WUFFTlQsT0FDRSxBQUFDLE1BQU1VLEtBQUs7Z0JBQ1ZWO2dCQUNBSSxZQUFZSixLQUFLSSxVQUFVLENBQUNDLE1BQU07Z0JBQ2xDTSxTQUFTWCxLQUFLRyxHQUFHLENBQUNRLE9BQU87Z0JBQ3pCQyxXQUFXO2dCQUNYVCxLQUFLSCxLQUFLRyxHQUFHO1lBQ2YsTUFBT0g7UUFDWCxHQUFHYSxRQUFRQyxPQUFPO1FBRWxCLE1BQU0sRUFDSkMsRUFBRSxFQUNGWCxZQUFZLEVBQUVDLFFBQVFXLGdCQUFnQixFQUFFLEVBQ3hDQyxZQUFZLEVBQ1pDLEtBQUssRUFDTEMsYUFBYSxFQUNiQyxPQUFPQyxlQUFlLEtBQUssRUFDM0JDLGlCQUFp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