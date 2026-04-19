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
const _httpstatus = /*#__PURE__*/ _interop_require_default(require("http-status"));
const _executeAccess = /*#__PURE__*/ _interop_require_default(require("../../auth/executeAccess"));
const _combineQueries = require("../../database/combineQueries");
const _validateQueryPaths = require("../../database/queryValidation/validateQueryPaths");
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
async function deleteOperation(incomingArgs) {
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
        const { collection: { config: collectionConfig }, depth, overrideAccess, req: { fallbackLocale, locale, payload: { config }, payload, t }, req, showHiddenFields, where } = args;
        if (!where) {
            throw new _errors.APIError("Missing 'where' query of documents to delete.", _httpstatus.default.BAD_REQUEST);
        }
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        let accessResult;
        if (!overrideAccess) {
            accessResult = await (0, _executeAccess.default)({
                req
            }, collectionConfig.access.delete);
        }
        await (0, _validateQueryPaths.validateQueryPaths)({
            collectionConfig,
            overrideAccess,
            req,
            where
        });
        const fullWhere = (0, _combineQueries.combineQueries)(where, accessResult);
        // /////////////////////////////////////
        // Retrieve documents
        // /////////////////////////////////////
        const dbArgs = {
            collection: collectionConfig.slug,
            locale,
            req,
            where: fullWhere
        };
        let docs;
        if (collectionConfig?.db?.find) {
            const result = await collectionConfig.db.find(dbArgs);
            docs = result.docs;
        } else {
            const result = await payload.db.find(dbArgs);
            docs = result.docs;
        }
        const errors = [];
        /* eslint-disable no-param-reassign */ const promises = docs.map(async (doc)=>{
            let result;
            const { id } = doc;
            try {
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
                await (0, _deleteAssociatedFiles.deleteAssociatedFiles)({
                    collectionConfig,
                    config,
                    doc,
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
                    await collectionConfig.db.deleteOne(deleteOneArgs);
                } else {
                    await payload.db.deleteOne(deleteOneArgs);
                }
                // /////////////////////////////////////
                // afterRead - Fields
                // /////////////////////////////////////
                result = await (0, _afterRead.afterRead)({
                    collection: collectionConfig,
                    context: req.context,
                    depth,
                    doc: result || doc,
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
                        doc: result || doc,
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
                // 8. Return results
                // /////////////////////////////////////
                return result;
            } catch (error) {
                errors.push({
                    id: doc.id,
                    message: error.message
                });
            }
            return null;
        });
        const awaitedDocs = await Promise.all(promises);
        // /////////////////////////////////////
        // Delete Preferences
        // /////////////////////////////////////
        await (0, _deleteUserPreferences.deleteUserPreferences)({
            collectionConfig,
            ids: docs.map(({ id })=>id),
            payload,
            req
        });
        let result = {
            docs: awaitedDocs.filter(Boolean),
            errors
        };
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await (0, _utils.buildAfterOperation)({
            args,
            collection: collectionConfig,
            operation: 'delete',
            result
        });
        if (shouldCommit) await (0, _commitTransaction.commitTransaction)(req);
        return result;
    } catch (error) {
        await (0, _killTransaction.killTransaction)(args.req);
        throw error;
    }
}
const _default = deleteOperation;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb2xsZWN0aW9ucy9vcGVyYXRpb25zL2RlbGV0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaHR0cFN0YXR1cyBmcm9tICdodHRwLXN0YXR1cydcblxuaW1wb3J0IHR5cGUgeyBHZW5lcmF0ZWRUeXBlcyB9IGZyb20gJy4uLy4uLydcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29uZmlnL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBQYXlsb2FkUmVxdWVzdCB9IGZyb20gJy4uLy4uL2V4cHJlc3MvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFdoZXJlIH0gZnJvbSAnLi4vLi4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEJlZm9yZU9wZXJhdGlvbkhvb2ssIENvbGxlY3Rpb24gfSBmcm9tICcuLi9jb25maWcvdHlwZXMnXG5cbmltcG9ydCBleGVjdXRlQWNjZXNzIGZyb20gJy4uLy4uL2F1dGgvZXhlY3V0ZUFjY2VzcydcbmltcG9ydCB7IGNvbWJpbmVRdWVyaWVzIH0gZnJvbSAnLi4vLi4vZGF0YWJhc2UvY29tYmluZVF1ZXJpZXMnXG5pbXBvcnQgeyB2YWxpZGF0ZVF1ZXJ5UGF0aHMgfSBmcm9tICcuLi8uLi9kYXRhYmFzZS9xdWVyeVZhbGlkYXRpb24vdmFsaWRhdGVRdWVyeVBhdGhzJ1xuaW1wb3J0IHsgQVBJRXJyb3IgfSBmcm9tICcuLi8uLi9lcnJvcnMnXG5pbXBvcnQgeyBhZnRlclJlYWQgfSBmcm9tICcuLi8uLi9maWVsZHMvaG9va3MvYWZ0ZXJSZWFkJ1xuaW1wb3J0IHsgZGVsZXRlVXNlclByZWZlcmVuY2VzIH0gZnJvbSAnLi4vLi4vcHJlZmVyZW5jZXMvZGVsZXRlVXNlclByZWZlcmVuY2VzJ1xuaW1wb3J0IHsgZGVsZXRlQXNzb2NpYXRlZEZpbGVzIH0gZnJvbSAnLi4vLi4vdXBsb2Fkcy9kZWxldGVBc3NvY2lhdGVkRmlsZXMnXG5pbXBvcnQgeyBjb21taXRUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jb21taXRUcmFuc2FjdGlvbidcbmltcG9ydCB7IGluaXRUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9pbml0VHJhbnNhY3Rpb24nXG5pbXBvcnQgeyBraWxsVHJhbnNhY3Rpb24gfSBmcm9tICcuLi8uLi91dGlsaXRpZXMva2lsbFRyYW5zYWN0aW9uJ1xuaW1wb3J0IHsgZGVsZXRlQ29sbGVjdGlvblZlcnNpb25zIH0gZnJvbSAnLi4vLi4vdmVyc2lvbnMvZGVsZXRlQ29sbGVjdGlvblZlcnNpb25zJ1xuaW1wb3J0IHsgYnVpbGRBZnRlck9wZXJhdGlvbiB9IGZyb20gJy4vdXRpbHMnXG5cbmV4cG9ydCB0eXBlIEFyZ3VtZW50cyA9IHtcbiAgY29sbGVjdGlvbjogQ29sbGVjdGlvblxuICBkZXB0aD86IG51bWJlclxuICBvdmVycmlkZUFjY2Vzcz86IGJvb2xlYW5cbiAgcmVxOiBQYXlsb2FkUmVxdWVzdFxuICBzaG93SGlkZGVuRmllbGRzPzogYm9vbGVhblxuICB3aGVyZTogV2hlcmVcbn1cblxuYXN5bmMgZnVuY3Rpb24gZGVsZXRlT3BlcmF0aW9uPFRTbHVnIGV4dGVuZHMga2V5b2YgR2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ10+KFxuICBpbmNvbWluZ0FyZ3M6IEFyZ3VtZW50cyxcbik6IFByb21pc2U8e1xuICBkb2NzOiBHZW5lcmF0ZWRUeXBlc1snY29sbGVjdGlvbnMnXVtUU2x1Z11bXVxuICBlcnJvcnM6IHtcbiAgICBpZDogR2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ11bVFNsdWddWydpZCddXG4gICAgbWVzc2FnZTogc3RyaW5nXG4gIH1bXVxufT4ge1xuICBsZXQgYXJncyA9IGluY29taW5nQXJnc1xuXG4gIHRyeSB7XG4gICAgY29uc3Qgc2hvdWxkQ29tbWl0ID0gYXdhaXQgaW5pdFRyYW5zYWN0aW9uKGFyZ3MucmVxKVxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVPcGVyYXRpb24gLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgYXJncy5jb2xsZWN0aW9uLmNvbmZpZy5ob29rcy5iZWZvcmVPcGVyYXRpb24ucmVkdWNlKFxuICAgICAgYXN5bmMgKHByaW9ySG9vazogQmVmb3JlT3BlcmF0aW9uSG9vayB8IFByb21pc2U8dm9pZD4sIGhvb2s6IEJlZm9yZU9wZXJhdGlvbkhvb2spID0+IHtcbiAgICAgICAgYXdhaXQgcHJpb3JIb29rXG5cbiAgICAgICAgYXJncyA9XG4gICAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IGFyZ3MuY29sbGVjdGlvbi5jb25maWcsXG4gICAgICAgICAgICBjb250ZXh0OiBhcmdzLnJlcS5jb250ZXh0LFxuICAgICAgICAgICAgb3BlcmF0aW9uOiAnZGVsZXRlJyxcbiAgICAgICAgICAgIHJlcTogYXJncy5yZXEsXG4gICAgICAgICAgfSkpIHx8IGFyZ3NcbiAgICAgIH0sXG4gICAgICBQcm9taXNlLnJlc29sdmUoKSxcbiAgICApXG5cbiAgICBjb25zdCB7XG4gICAgICBjb2xsZWN0aW9uOiB7IGNvbmZpZzogY29sbGVjdGlvbkNvbmZpZyB9LFxuICAgICAgZGVwdGgsXG4gICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgIHJlcToge1xuICAgICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgICAgbG9jYWxlLFxuICAgICAgICBwYXlsb2FkOiB7IGNvbmZpZyB9LFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICB0LFxuICAgICAgfSxcbiAgICAgIHJlcSxcbiAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgICB3aGVyZSxcbiAgICB9ID0gYXJnc1xuXG4gICAgaWYgKCF3aGVyZSkge1xuICAgICAgdGhyb3cgbmV3IEFQSUVycm9yKFwiTWlzc2luZyAnd2hlcmUnIHF1ZXJ5IG9mIGRvY3VtZW50cyB0byBkZWxldGUuXCIsIGh0dHBTdGF0dXMuQkFEX1JFUVVFU1QpXG4gICAgfVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEFjY2Vzc1xuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGxldCBhY2Nlc3NSZXN1bHQ6IEFjY2Vzc1Jlc3VsdFxuXG4gICAgaWYgKCFvdmVycmlkZUFjY2Vzcykge1xuICAgICAgYWNjZXNzUmVzdWx0ID0gYXdhaXQgZXhlY3V0ZUFjY2Vzcyh7IHJlcSB9LCBjb2xsZWN0aW9uQ29uZmlnLmFjY2Vzcy5kZWxldGUpXG4gICAgfVxuXG4gICAgYXdhaXQgdmFsaWRhdGVRdWVyeVBhdGhzKHtcbiAgICAgIGNvbGxlY3Rpb25Db25maWcsXG4gICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgIHJlcSxcbiAgICAgIHdoZXJlLFxuICAgIH0pXG5cbiAgICBjb25zdCBmdWxsV2hlcmUgPSBjb21iaW5lUXVlcmllcyh3aGVyZSwgYWNjZXNzUmVzdWx0KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJldHJpZXZlIGRvY3VtZW50c1xuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGNvbnN0IGRiQXJncyA9IHtcbiAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcuc2x1ZyxcbiAgICAgIGxvY2FsZSxcbiAgICAgIHJlcSxcbiAgICAgIHdoZXJlOiBmdWxsV2hlcmUsXG4gICAgfVxuICAgIGxldCBkb2NzXG4gICAgaWYgKGNvbGxlY3Rpb25Db25maWc/LmRiPy5maW5kKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmRiLmZpbmQ8R2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ11bVFNsdWddPihkYkFyZ3MpXG4gICAgICBkb2NzID0gcmVzdWx0LmRvY3NcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGF5bG9hZC5kYi5maW5kPEdlbmVyYXRlZFR5cGVzWydjb2xsZWN0aW9ucyddW1RTbHVnXT4oZGJBcmdzKVxuICAgICAgZG9jcyA9IHJlc3VsdC5kb2NzXG4gICAgfVxuXG4gICAgY29uc3QgZXJyb3JzID0gW11cblxuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gICAgY29uc3QgcHJvbWlzZXMgPSBkb2NzLm1hcChhc3luYyAoZG9jKSA9PiB7XG4gICAgICBsZXQgcmVzdWx0XG5cbiAgICAgIGNvbnN0IHsgaWQgfSA9IGRvY1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIGJlZm9yZURlbGV0ZSAtIENvbGxlY3Rpb25cbiAgICAgICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYmVmb3JlRGVsZXRlLnJlZHVjZShhc3luYyAocHJpb3JIb29rLCBob29rKSA9PiB7XG4gICAgICAgICAgYXdhaXQgcHJpb3JIb29rXG5cbiAgICAgICAgICByZXR1cm4gaG9vayh7XG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgICBjb250ZXh0OiByZXEuY29udGV4dCxcbiAgICAgICAgICAgIHJlcSxcbiAgICAgICAgICB9KVxuICAgICAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgICBhd2FpdCBkZWxldGVBc3NvY2lhdGVkRmlsZXMoe1xuICAgICAgICAgIGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgY29uZmlnLFxuICAgICAgICAgIGRvYyxcbiAgICAgICAgICBvdmVycmlkZURlbGV0ZTogdHJ1ZSxcbiAgICAgICAgICB0LFxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gRGVsZXRlIHZlcnNpb25zXG4gICAgICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBpZiAoY29sbGVjdGlvbkNvbmZpZy52ZXJzaW9ucykge1xuICAgICAgICAgIGF3YWl0IGRlbGV0ZUNvbGxlY3Rpb25WZXJzaW9ucyh7XG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIHNsdWc6IGNvbGxlY3Rpb25Db25maWcuc2x1ZyxcbiAgICAgICAgICAgIHBheWxvYWQsXG4gICAgICAgICAgICByZXEsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gRGVsZXRlIGRvY3VtZW50XG4gICAgICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBjb25zdCBkZWxldGVPbmVBcmdzID0ge1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcuc2x1ZyxcbiAgICAgICAgICByZXEsXG4gICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgIGlkOiB7XG4gICAgICAgICAgICAgIGVxdWFsczogaWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbGxlY3Rpb25Db25maWc/LmRiPy5kZWxldGVPbmUpIHtcbiAgICAgICAgICBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmRiLmRlbGV0ZU9uZShkZWxldGVPbmVBcmdzKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGF3YWl0IHBheWxvYWQuZGIuZGVsZXRlT25lKGRlbGV0ZU9uZUFyZ3MpXG4gICAgICAgIH1cblxuICAgICAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIGFmdGVyUmVhZCAtIEZpZWxkc1xuICAgICAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgYWZ0ZXJSZWFkKHtcbiAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgICAgIGRlcHRoLFxuICAgICAgICAgIGRvYzogcmVzdWx0IHx8IGRvYyxcbiAgICAgICAgICBkcmFmdDogdW5kZWZpbmVkLFxuICAgICAgICAgIGZhbGxiYWNrTG9jYWxlLFxuICAgICAgICAgIGdsb2JhbDogbnVsbCxcbiAgICAgICAgICBsb2NhbGUsXG4gICAgICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICAgICAgcmVxLFxuICAgICAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAvLyBhZnRlclJlYWQgLSBDb2xsZWN0aW9uXG4gICAgICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmhvb2tzLmFmdGVyUmVhZC5yZWR1Y2UoYXN5bmMgKHByaW9ySG9vaywgaG9vaykgPT4ge1xuICAgICAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgICAgIGRvYzogcmVzdWx0IHx8IGRvYyxcbiAgICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgfSkpIHx8IHJlc3VsdFxuICAgICAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIGFmdGVyRGVsZXRlIC0gQ29sbGVjdGlvblxuICAgICAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5ob29rcy5hZnRlckRlbGV0ZS5yZWR1Y2UoYXN5bmMgKHByaW9ySG9vaywgaG9vaykgPT4ge1xuICAgICAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgICAgICAgICBkb2M6IHJlc3VsdCxcbiAgICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgfSkpIHx8IHJlc3VsdFxuICAgICAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIDguIFJldHVybiByZXN1bHRzXG4gICAgICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgaWQ6IGRvYy5pZCxcbiAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9KVxuXG4gICAgY29uc3QgYXdhaXRlZERvY3MgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBEZWxldGUgUHJlZmVyZW5jZXNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBhd2FpdCBkZWxldGVVc2VyUHJlZmVyZW5jZXMoe1xuICAgICAgY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGlkczogZG9jcy5tYXAoKHsgaWQgfSkgPT4gaWQpLFxuICAgICAgcGF5bG9hZCxcbiAgICAgIHJlcSxcbiAgICB9KVxuXG4gICAgbGV0IHJlc3VsdCA9IHtcbiAgICAgIGRvY3M6IGF3YWl0ZWREb2NzLmZpbHRlcihCb29sZWFuKSxcbiAgICAgIGVycm9ycyxcbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJPcGVyYXRpb24gLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgcmVzdWx0ID0gYXdhaXQgYnVpbGRBZnRlck9wZXJhdGlvbjxHZW5lcmF0ZWRUeXBlc1snY29sbGVjdGlvbnMnXVtUU2x1Z10+KHtcbiAgICAgIGFyZ3MsXG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgb3BlcmF0aW9uOiAnZGVsZXRlJyxcbiAgICAgIHJlc3VsdCxcbiAgICB9KVxuXG4gICAgaWYgKHNob3VsZENvbW1pdCkgYXdhaXQgY29tbWl0VHJhbnNhY3Rpb24ocmVxKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgIGF3YWl0IGtpbGxUcmFuc2FjdGlvbihhcmdzLnJlcSlcbiAgICB0aHJvdyBlcnJvclxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlbGV0ZU9wZXJhdGlvblxuIl0sIm5hbWVzIjpbImRlbGV0ZU9wZXJhdGlvbiIsImluY29taW5nQXJncyIsImFyZ3MiLCJzaG91bGRDb21taXQiLCJpbml0VHJhbnNhY3Rpb24iLCJyZXEiLCJjb2xsZWN0aW9uIiwiY29uZmlnIiwiaG9va3MiLCJiZWZvcmVPcGVyYXRpb24iLCJyZWR1Y2UiLCJwcmlvckhvb2siLCJob29rIiwiY29udGV4dCIsIm9wZXJhdGlvbiIsIlByb21pc2UiLCJyZXNvbHZlIiwiY29sbGVjdGlvbkNvbmZpZyIsImRlcHRoIiwib3ZlcnJpZGVBY2Nlc3MiLCJmYWxsYmFja0xvY2FsZSIsImxvY2FsZSIsInBheWxvYWQiLCJ0Iiwic2hvd0hpZGRlbkZpZWxkcyIsIndoZXJlIiwiQVBJRXJyb3IiLCJodHRwU3RhdHVzIiwiQkFEX1JFUVVFU1QiLCJhY2Nlc3NSZXN1bHQiLCJleGVjdXRlQWNjZXNzIiwiYWNjZXNzIiwiZGVsZXRlIiwidmFsaWRhdGVRdWVyeVBhdGhzIiwiZnVsbFdoZXJlIiwiY29tYmluZVF1ZXJpZXMiLCJkYkFyZ3MiLCJzbHVnIiwiZG9jcyIsImRiIiwiZmluZCIsInJlc3VsdCIsImVycm9ycyIsInByb21pc2VzIiwibWFwIiwiZG9jIiwiaWQiLCJiZWZvcmVEZWxldGUiLCJkZWxldGVBc3NvY2lhdGVkRmlsZXMiLCJvdmVycmlkZURlbGV0ZSIsInZlcnNpb25zIiwiZGVsZXRlQ29sbGVjdGlvblZlcnNpb25zIiwiZGVsZXRlT25lQXJncyIsImVxdWFscyIsImRlbGV0ZU9uZSIsImFmdGVyUmVhZCIsImRyYWZ0IiwidW5kZWZpbmVkIiwiZ2xvYmFsIiwiYWZ0ZXJEZWxldGUiLCJlcnJvciIsInB1c2giLCJtZXNzYWdlIiwiYXdhaXRlZERvY3MiLCJhbGwiLCJkZWxldGVVc2VyUHJlZmVyZW5jZXMiLCJpZHMiLCJmaWx0ZXIiLCJCb29sZWFuIiwiYnVpbGRBZnRlck9wZXJhdGlvbiIsImNvbW1pdFRyYW5zYWN0aW9uIiwia2lsbFRyYW5zYWN0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