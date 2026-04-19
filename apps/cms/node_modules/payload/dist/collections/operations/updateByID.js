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
const _generatePasswordSaltHash = require("../../auth/strategies/local/generatePasswordSaltHash");
const _types = require("../../auth/types");
const _combineQueries = require("../../database/combineQueries");
const _errors = require("../../errors");
const _afterChange = require("../../fields/hooks/afterChange");
const _afterRead = require("../../fields/hooks/afterRead");
const _beforeChange = require("../../fields/hooks/beforeChange");
const _beforeValidate = require("../../fields/hooks/beforeValidate");
const _deleteAssociatedFiles = require("../../uploads/deleteAssociatedFiles");
const _generateFileData = require("../../uploads/generateFileData");
const _unlinkTempFiles = require("../../uploads/unlinkTempFiles");
const _uploadFiles = require("../../uploads/uploadFiles");
const _commitTransaction = require("../../utilities/commitTransaction");
const _initTransaction = require("../../utilities/initTransaction");
const _killTransaction = require("../../utilities/killTransaction");
const _getLatestCollectionVersion = require("../../versions/getLatestCollectionVersion");
const _saveVersion = require("../../versions/saveVersion");
const _utils = require("./utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function updateByID(incomingArgs) {
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
                operation: 'update',
                req: args.req
            }) || args;
        }, Promise.resolve());
        const { id, autosave = false, collection: { config: collectionConfig }, collection, depth, draft: draftArg = false, overrideAccess, overwriteExistingFiles = false, req: { fallbackLocale, locale, payload: { config }, payload, t }, req, showHiddenFields } = args;
        if (!id) {
            throw new _errors.APIError('Missing ID of document to update.', _httpstatus.default.BAD_REQUEST);
        }
        let { data } = args;
        const dataHasPassword = 'password' in data && data.password;
        const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts);
        const shouldSavePassword = Boolean(dataHasPassword && collectionConfig.auth && !shouldSaveDraft);
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        const accessResults = !overrideAccess ? await (0, _executeAccess.default)({
            id,
            data,
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
                    equals: id
                }
            }, accessResults)
        };
        const docWithLocales = await (0, _getLatestCollectionVersion.getLatestCollectionVersion)({
            id,
            config: collectionConfig,
            payload,
            query: findOneArgs,
            req
        });
        if (!docWithLocales && !hasWherePolicy) throw new _errors.NotFound(t);
        if (!docWithLocales && hasWherePolicy) throw new _errors.Forbidden(t);
        const originalDoc = await (0, _afterRead.afterRead)({
            collection: collectionConfig,
            context: req.context,
            depth: 0,
            doc: docWithLocales,
            draft: draftArg,
            fallbackLocale: null,
            global: null,
            locale,
            overrideAccess: true,
            req,
            showHiddenFields: true
        });
        // /////////////////////////////////////
        // Generate data for all files and sizes
        // /////////////////////////////////////
        const { data: newFileData, files: filesToUpload } = await (0, _generateFileData.generateFileData)({
            collection,
            config,
            data,
            operation: 'update',
            originalDoc,
            overwriteExistingFiles,
            req,
            throwOnMissingFile: false
        });
        data = newFileData;
        // /////////////////////////////////////
        // Delete any associated files
        // /////////////////////////////////////
        await (0, _deleteAssociatedFiles.deleteAssociatedFiles)({
            collectionConfig,
            config,
            doc: docWithLocales,
            files: filesToUpload,
            overrideDelete: false,
            t
        });
        // /////////////////////////////////////
        // beforeValidate - Fields
        // /////////////////////////////////////
        data = await (0, _beforeValidate.beforeValidate)({
            id,
            collection: collectionConfig,
            context: req.context,
            data,
            doc: originalDoc,
            global: null,
            operation: 'update',
            overrideAccess,
            req
        });
        // /////////////////////////////////////
        // beforeValidate - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook)=>{
            await priorHook;
            data = await hook({
                collection: collectionConfig,
                context: req.context,
                data,
                operation: 'update',
                originalDoc,
                req
            }) || data;
        }, Promise.resolve());
        // /////////////////////////////////////
        // Write files to local storage
        // /////////////////////////////////////
        if (!collectionConfig.upload.disableLocalStorage) {
            await (0, _uploadFiles.uploadFiles)(payload, filesToUpload, t);
        }
        // /////////////////////////////////////
        // beforeChange - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook)=>{
            await priorHook;
            data = await hook({
                collection: collectionConfig,
                context: req.context,
                data,
                operation: 'update',
                originalDoc,
                req
            }) || data;
        }, Promise.resolve());
        // /////////////////////////////////////
        // beforeChange - Fields
        // /////////////////////////////////////
        let result = await (0, _beforeChange.beforeChange)({
            id,
            collection: collectionConfig,
            context: req.context,
            data,
            doc: originalDoc,
            docWithLocales,
            global: null,
            operation: 'update',
            req,
            skipValidation: shouldSaveDraft && collectionConfig.versions.drafts && !collectionConfig.versions.drafts.validate && data._status !== 'published'
        });
        // /////////////////////////////////////
        // Handle potential password update
        // /////////////////////////////////////
        const dataToUpdate = {
            ...result
        };
        const { password } = dataToUpdate;
        if (shouldSavePassword && typeof password === 'string') {
            const { hash, salt } = await (0, _generatePasswordSaltHash.generatePasswordSaltHash)({
                password
            });
            dataToUpdate.salt = salt;
            dataToUpdate.hash = hash;
            delete dataToUpdate.password;
            delete data.password;
        }
        // /////////////////////////////////////
        // Update
        // /////////////////////////////////////
        if (!shouldSaveDraft || data._status === 'published') {
            const dbArgs = {
                id,
                collection: collectionConfig.slug,
                data: dataToUpdate,
                locale,
                req
            };
            if (collectionConfig?.db?.updateOne) {
                result = await collectionConfig.db.updateOne(dbArgs);
            } else {
                result = await req.payload.db.updateOne(dbArgs);
            }
        }
        // /////////////////////////////////////
        // Create version
        // /////////////////////////////////////
        if (collectionConfig.versions) {
            result = await (0, _saveVersion.saveVersion)({
                id,
                autosave,
                collection: collectionConfig,
                docWithLocales: {
                    ...result,
                    createdAt: docWithLocales.createdAt
                },
                draft: shouldSaveDraft,
                payload,
                req
            });
        }
        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////
        result = await (0, _afterRead.afterRead)({
            collection: collectionConfig,
            context: req.context,
            depth,
            doc: result,
            draft: draftArg,
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
            data,
            doc: result,
            global: null,
            operation: 'update',
            previousDoc: originalDoc,
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
                previousDoc: originalDoc,
                req
            }) || result;
        }, Promise.resolve());
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await (0, _utils.buildAfterOperation)({
            args,
            collection: collectionConfig,
            operation: 'updateByID',
            result
        });
        await (0, _unlinkTempFiles.unlinkTempFiles)({
            collectionConfig,
            config,
            req
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
const _default = updateByID;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb2xsZWN0aW9ucy9vcGVyYXRpb25zL3VwZGF0ZUJ5SUQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBEZWVwUGFydGlhbCB9IGZyb20gJ3RzLWVzc2VudGlhbHMnXG5cbmltcG9ydCBodHRwU3RhdHVzIGZyb20gJ2h0dHAtc3RhdHVzJ1xuXG5pbXBvcnQgdHlwZSB7IEZpbmRPbmVBcmdzIH0gZnJvbSAnLi4vLi4vZGF0YWJhc2UvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFBheWxvYWRSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vZXhwcmVzcy90eXBlcydcbmltcG9ydCB0eXBlIHsgR2VuZXJhdGVkVHlwZXMgfSBmcm9tICcuLi8uLi9pbmRleCdcbmltcG9ydCB0eXBlIHsgQ29sbGVjdGlvbiB9IGZyb20gJy4uL2NvbmZpZy90eXBlcydcblxuaW1wb3J0IGV4ZWN1dGVBY2Nlc3MgZnJvbSAnLi4vLi4vYXV0aC9leGVjdXRlQWNjZXNzJ1xuaW1wb3J0IHsgZ2VuZXJhdGVQYXNzd29yZFNhbHRIYXNoIH0gZnJvbSAnLi4vLi4vYXV0aC9zdHJhdGVnaWVzL2xvY2FsL2dlbmVyYXRlUGFzc3dvcmRTYWx0SGFzaCdcbmltcG9ydCB7IGhhc1doZXJlQWNjZXNzUmVzdWx0IH0gZnJvbSAnLi4vLi4vYXV0aC90eXBlcydcbmltcG9ydCB7IGNvbWJpbmVRdWVyaWVzIH0gZnJvbSAnLi4vLi4vZGF0YWJhc2UvY29tYmluZVF1ZXJpZXMnXG5pbXBvcnQgeyBBUElFcnJvciwgRm9yYmlkZGVuLCBOb3RGb3VuZCB9IGZyb20gJy4uLy4uL2Vycm9ycydcbmltcG9ydCB7IGFmdGVyQ2hhbmdlIH0gZnJvbSAnLi4vLi4vZmllbGRzL2hvb2tzL2FmdGVyQ2hhbmdlJ1xuaW1wb3J0IHsgYWZ0ZXJSZWFkIH0gZnJvbSAnLi4vLi4vZmllbGRzL2hvb2tzL2FmdGVyUmVhZCdcbmltcG9ydCB7IGJlZm9yZUNoYW5nZSB9IGZyb20gJy4uLy4uL2ZpZWxkcy9ob29rcy9iZWZvcmVDaGFuZ2UnXG5pbXBvcnQgeyBiZWZvcmVWYWxpZGF0ZSB9IGZyb20gJy4uLy4uL2ZpZWxkcy9ob29rcy9iZWZvcmVWYWxpZGF0ZSdcbmltcG9ydCB7IGRlbGV0ZUFzc29jaWF0ZWRGaWxlcyB9IGZyb20gJy4uLy4uL3VwbG9hZHMvZGVsZXRlQXNzb2NpYXRlZEZpbGVzJ1xuaW1wb3J0IHsgZ2VuZXJhdGVGaWxlRGF0YSB9IGZyb20gJy4uLy4uL3VwbG9hZHMvZ2VuZXJhdGVGaWxlRGF0YSdcbmltcG9ydCB7IHVubGlua1RlbXBGaWxlcyB9IGZyb20gJy4uLy4uL3VwbG9hZHMvdW5saW5rVGVtcEZpbGVzJ1xuaW1wb3J0IHsgdXBsb2FkRmlsZXMgfSBmcm9tICcuLi8uLi91cGxvYWRzL3VwbG9hZEZpbGVzJ1xuaW1wb3J0IHsgY29tbWl0VHJhbnNhY3Rpb24gfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvY29tbWl0VHJhbnNhY3Rpb24nXG5pbXBvcnQgeyBpbml0VHJhbnNhY3Rpb24gfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvaW5pdFRyYW5zYWN0aW9uJ1xuaW1wb3J0IHsga2lsbFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2tpbGxUcmFuc2FjdGlvbidcbmltcG9ydCB7IGdldExhdGVzdENvbGxlY3Rpb25WZXJzaW9uIH0gZnJvbSAnLi4vLi4vdmVyc2lvbnMvZ2V0TGF0ZXN0Q29sbGVjdGlvblZlcnNpb24nXG5pbXBvcnQgeyBzYXZlVmVyc2lvbiB9IGZyb20gJy4uLy4uL3ZlcnNpb25zL3NhdmVWZXJzaW9uJ1xuaW1wb3J0IHsgYnVpbGRBZnRlck9wZXJhdGlvbiB9IGZyb20gJy4vdXRpbHMnXG5cbmV4cG9ydCB0eXBlIEFyZ3VtZW50czxUIGV4dGVuZHMgeyBbZmllbGQ6IG51bWJlciB8IHN0cmluZyB8IHN5bWJvbF06IHVua25vd24gfT4gPSB7XG4gIGF1dG9zYXZlPzogYm9vbGVhblxuICBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uXG4gIGRhdGE6IERlZXBQYXJ0aWFsPFQ+XG4gIGRlcHRoPzogbnVtYmVyXG4gIGRpc2FibGVWZXJpZmljYXRpb25FbWFpbD86IGJvb2xlYW5cbiAgZHJhZnQ/OiBib29sZWFuXG4gIGlkOiBudW1iZXIgfCBzdHJpbmdcbiAgb3ZlcnJpZGVBY2Nlc3M/OiBib29sZWFuXG4gIG92ZXJ3cml0ZUV4aXN0aW5nRmlsZXM/OiBib29sZWFuXG4gIHJlcTogUGF5bG9hZFJlcXVlc3RcbiAgc2hvd0hpZGRlbkZpZWxkcz86IGJvb2xlYW5cbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlQnlJRDxUU2x1ZyBleHRlbmRzIGtleW9mIEdlbmVyYXRlZFR5cGVzWydjb2xsZWN0aW9ucyddPihcbiAgaW5jb21pbmdBcmdzOiBBcmd1bWVudHM8R2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ11bVFNsdWddPixcbik6IFByb21pc2U8R2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ11bVFNsdWddPiB7XG4gIGxldCBhcmdzID0gaW5jb21pbmdBcmdzXG5cbiAgdHJ5IHtcbiAgICBjb25zdCBzaG91bGRDb21taXQgPSBhd2FpdCBpbml0VHJhbnNhY3Rpb24oYXJncy5yZXEpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYmVmb3JlT3BlcmF0aW9uIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGFyZ3MuY29sbGVjdGlvbi5jb25maWcuaG9va3MuYmVmb3JlT3BlcmF0aW9uLnJlZHVjZShhc3luYyAocHJpb3JIb29rLCBob29rKSA9PiB7XG4gICAgICBhd2FpdCBwcmlvckhvb2tcblxuICAgICAgYXJncyA9XG4gICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICBhcmdzLFxuICAgICAgICAgIGNvbGxlY3Rpb246IGFyZ3MuY29sbGVjdGlvbi5jb25maWcsXG4gICAgICAgICAgY29udGV4dDogYXJncy5yZXEuY29udGV4dCxcbiAgICAgICAgICBvcGVyYXRpb246ICd1cGRhdGUnLFxuICAgICAgICAgIHJlcTogYXJncy5yZXEsXG4gICAgICAgIH0pKSB8fCBhcmdzXG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICBjb25zdCB7XG4gICAgICBpZCxcbiAgICAgIGF1dG9zYXZlID0gZmFsc2UsXG4gICAgICBjb2xsZWN0aW9uOiB7IGNvbmZpZzogY29sbGVjdGlvbkNvbmZpZyB9LFxuICAgICAgY29sbGVjdGlvbixcbiAgICAgIGRlcHRoLFxuICAgICAgZHJhZnQ6IGRyYWZ0QXJnID0gZmFsc2UsXG4gICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgIG92ZXJ3cml0ZUV4aXN0aW5nRmlsZXMgPSBmYWxzZSxcbiAgICAgIHJlcToge1xuICAgICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgICAgbG9jYWxlLFxuICAgICAgICBwYXlsb2FkOiB7IGNvbmZpZyB9LFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICB0LFxuICAgICAgfSxcbiAgICAgIHJlcSxcbiAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgfSA9IGFyZ3NcblxuICAgIGlmICghaWQpIHtcbiAgICAgIHRocm93IG5ldyBBUElFcnJvcignTWlzc2luZyBJRCBvZiBkb2N1bWVudCB0byB1cGRhdGUuJywgaHR0cFN0YXR1cy5CQURfUkVRVUVTVClcbiAgICB9XG5cbiAgICBsZXQgeyBkYXRhIH0gPSBhcmdzXG4gICAgY29uc3QgZGF0YUhhc1Bhc3N3b3JkID0gJ3Bhc3N3b3JkJyBpbiBkYXRhICYmIGRhdGEucGFzc3dvcmRcbiAgICBjb25zdCBzaG91bGRTYXZlRHJhZnQgPSBCb29sZWFuKGRyYWZ0QXJnICYmIGNvbGxlY3Rpb25Db25maWcudmVyc2lvbnMuZHJhZnRzKVxuICAgIGNvbnN0IHNob3VsZFNhdmVQYXNzd29yZCA9IEJvb2xlYW4oZGF0YUhhc1Bhc3N3b3JkICYmIGNvbGxlY3Rpb25Db25maWcuYXV0aCAmJiAhc2hvdWxkU2F2ZURyYWZ0KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEFjY2Vzc1xuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGNvbnN0IGFjY2Vzc1Jlc3VsdHMgPSAhb3ZlcnJpZGVBY2Nlc3NcbiAgICAgID8gYXdhaXQgZXhlY3V0ZUFjY2Vzcyh7IGlkLCBkYXRhLCByZXEgfSwgY29sbGVjdGlvbkNvbmZpZy5hY2Nlc3MudXBkYXRlKVxuICAgICAgOiB0cnVlXG4gICAgY29uc3QgaGFzV2hlcmVQb2xpY3kgPSBoYXNXaGVyZUFjY2Vzc1Jlc3VsdChhY2Nlc3NSZXN1bHRzKVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJldHJpZXZlIGRvY3VtZW50XG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgY29uc3QgZmluZE9uZUFyZ3M6IEZpbmRPbmVBcmdzID0ge1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgbG9jYWxlLFxuICAgICAgcmVxLFxuICAgICAgd2hlcmU6IGNvbWJpbmVRdWVyaWVzKHsgaWQ6IHsgZXF1YWxzOiBpZCB9IH0sIGFjY2Vzc1Jlc3VsdHMpLFxuICAgIH1cblxuICAgIGNvbnN0IGRvY1dpdGhMb2NhbGVzID0gYXdhaXQgZ2V0TGF0ZXN0Q29sbGVjdGlvblZlcnNpb24oe1xuICAgICAgaWQsXG4gICAgICBjb25maWc6IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICBwYXlsb2FkLFxuICAgICAgcXVlcnk6IGZpbmRPbmVBcmdzLFxuICAgICAgcmVxLFxuICAgIH0pXG5cbiAgICBpZiAoIWRvY1dpdGhMb2NhbGVzICYmICFoYXNXaGVyZVBvbGljeSkgdGhyb3cgbmV3IE5vdEZvdW5kKHQpXG4gICAgaWYgKCFkb2NXaXRoTG9jYWxlcyAmJiBoYXNXaGVyZVBvbGljeSkgdGhyb3cgbmV3IEZvcmJpZGRlbih0KVxuXG4gICAgY29uc3Qgb3JpZ2luYWxEb2MgPSBhd2FpdCBhZnRlclJlYWQoe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgZGVwdGg6IDAsXG4gICAgICBkb2M6IGRvY1dpdGhMb2NhbGVzLFxuICAgICAgZHJhZnQ6IGRyYWZ0QXJnLFxuICAgICAgZmFsbGJhY2tMb2NhbGU6IG51bGwsXG4gICAgICBnbG9iYWw6IG51bGwsXG4gICAgICBsb2NhbGUsXG4gICAgICBvdmVycmlkZUFjY2VzczogdHJ1ZSxcbiAgICAgIHJlcSxcbiAgICAgIHNob3dIaWRkZW5GaWVsZHM6IHRydWUsXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBHZW5lcmF0ZSBkYXRhIGZvciBhbGwgZmlsZXMgYW5kIHNpemVzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgY29uc3QgeyBkYXRhOiBuZXdGaWxlRGF0YSwgZmlsZXM6IGZpbGVzVG9VcGxvYWQgfSA9IGF3YWl0IGdlbmVyYXRlRmlsZURhdGEoe1xuICAgICAgY29sbGVjdGlvbixcbiAgICAgIGNvbmZpZyxcbiAgICAgIGRhdGEsXG4gICAgICBvcGVyYXRpb246ICd1cGRhdGUnLFxuICAgICAgb3JpZ2luYWxEb2MsXG4gICAgICBvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzLFxuICAgICAgcmVxLFxuICAgICAgdGhyb3dPbk1pc3NpbmdGaWxlOiBmYWxzZSxcbiAgICB9KVxuXG4gICAgZGF0YSA9IG5ld0ZpbGVEYXRhXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gRGVsZXRlIGFueSBhc3NvY2lhdGVkIGZpbGVzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgZGVsZXRlQXNzb2NpYXRlZEZpbGVzKHtcbiAgICAgIGNvbGxlY3Rpb25Db25maWcsXG4gICAgICBjb25maWcsXG4gICAgICBkb2M6IGRvY1dpdGhMb2NhbGVzLFxuICAgICAgZmlsZXM6IGZpbGVzVG9VcGxvYWQsXG4gICAgICBvdmVycmlkZURlbGV0ZTogZmFsc2UsXG4gICAgICB0LFxuICAgIH0pXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYmVmb3JlVmFsaWRhdGUgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBkYXRhID0gYXdhaXQgYmVmb3JlVmFsaWRhdGU8RGVlcFBhcnRpYWw8R2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ11bVFNsdWddPj4oe1xuICAgICAgaWQsXG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICBkYXRhLFxuICAgICAgZG9jOiBvcmlnaW5hbERvYyxcbiAgICAgIGdsb2JhbDogbnVsbCxcbiAgICAgIG9wZXJhdGlvbjogJ3VwZGF0ZScsXG4gICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgIHJlcSxcbiAgICB9KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGJlZm9yZVZhbGlkYXRlIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYmVmb3JlVmFsaWRhdGUucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICBkYXRhID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgZGF0YSxcbiAgICAgICAgICBvcGVyYXRpb246ICd1cGRhdGUnLFxuICAgICAgICAgIG9yaWdpbmFsRG9jLFxuICAgICAgICAgIHJlcSxcbiAgICAgICAgfSkpIHx8IGRhdGFcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBXcml0ZSBmaWxlcyB0byBsb2NhbCBzdG9yYWdlXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKCFjb2xsZWN0aW9uQ29uZmlnLnVwbG9hZC5kaXNhYmxlTG9jYWxTdG9yYWdlKSB7XG4gICAgICBhd2FpdCB1cGxvYWRGaWxlcyhwYXlsb2FkLCBmaWxlc1RvVXBsb2FkLCB0KVxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVDaGFuZ2UgLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5ob29rcy5iZWZvcmVDaGFuZ2UucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICBkYXRhID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgZGF0YSxcbiAgICAgICAgICBvcGVyYXRpb246ICd1cGRhdGUnLFxuICAgICAgICAgIG9yaWdpbmFsRG9jLFxuICAgICAgICAgIHJlcSxcbiAgICAgICAgfSkpIHx8IGRhdGFcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVDaGFuZ2UgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgYmVmb3JlQ2hhbmdlPEdlbmVyYXRlZFR5cGVzWydjb2xsZWN0aW9ucyddW1RTbHVnXT4oe1xuICAgICAgaWQsXG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICBkYXRhLFxuICAgICAgZG9jOiBvcmlnaW5hbERvYyxcbiAgICAgIGRvY1dpdGhMb2NhbGVzLFxuICAgICAgZ2xvYmFsOiBudWxsLFxuICAgICAgb3BlcmF0aW9uOiAndXBkYXRlJyxcbiAgICAgIHJlcSxcbiAgICAgIHNraXBWYWxpZGF0aW9uOlxuICAgICAgICBzaG91bGRTYXZlRHJhZnQgJiZcbiAgICAgICAgY29sbGVjdGlvbkNvbmZpZy52ZXJzaW9ucy5kcmFmdHMgJiZcbiAgICAgICAgIWNvbGxlY3Rpb25Db25maWcudmVyc2lvbnMuZHJhZnRzLnZhbGlkYXRlICYmXG4gICAgICAgIGRhdGEuX3N0YXR1cyAhPT0gJ3B1Ymxpc2hlZCcsXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBIYW5kbGUgcG90ZW50aWFsIHBhc3N3b3JkIHVwZGF0ZVxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGNvbnN0IGRhdGFUb1VwZGF0ZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7IC4uLnJlc3VsdCB9XG4gICAgY29uc3QgeyBwYXNzd29yZCB9ID0gZGF0YVRvVXBkYXRlXG4gICAgaWYgKHNob3VsZFNhdmVQYXNzd29yZCAmJiB0eXBlb2YgcGFzc3dvcmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCB7IGhhc2gsIHNhbHQgfSA9IGF3YWl0IGdlbmVyYXRlUGFzc3dvcmRTYWx0SGFzaCh7IHBhc3N3b3JkIH0pXG4gICAgICBkYXRhVG9VcGRhdGUuc2FsdCA9IHNhbHRcbiAgICAgIGRhdGFUb1VwZGF0ZS5oYXNoID0gaGFzaFxuICAgICAgZGVsZXRlIGRhdGFUb1VwZGF0ZS5wYXNzd29yZFxuICAgICAgZGVsZXRlIGRhdGEucGFzc3dvcmRcbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gVXBkYXRlXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKCFzaG91bGRTYXZlRHJhZnQgfHwgZGF0YS5fc3RhdHVzID09PSAncHVibGlzaGVkJykge1xuICAgICAgY29uc3QgZGJBcmdzID0ge1xuICAgICAgICBpZCxcbiAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZy5zbHVnLFxuICAgICAgICBkYXRhOiBkYXRhVG9VcGRhdGUsXG4gICAgICAgIGxvY2FsZSxcbiAgICAgICAgcmVxLFxuICAgICAgfVxuICAgICAgaWYgKGNvbGxlY3Rpb25Db25maWc/LmRiPy51cGRhdGVPbmUpIHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5kYi51cGRhdGVPbmUoZGJBcmdzKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgcmVxLnBheWxvYWQuZGIudXBkYXRlT25lKGRiQXJncylcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQ3JlYXRlIHZlcnNpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBpZiAoY29sbGVjdGlvbkNvbmZpZy52ZXJzaW9ucykge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgc2F2ZVZlcnNpb24oe1xuICAgICAgICBpZCxcbiAgICAgICAgYXV0b3NhdmUsXG4gICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgIGRvY1dpdGhMb2NhbGVzOiB7XG4gICAgICAgICAgLi4ucmVzdWx0LFxuICAgICAgICAgIGNyZWF0ZWRBdDogZG9jV2l0aExvY2FsZXMuY3JlYXRlZEF0LFxuICAgICAgICB9LFxuICAgICAgICBkcmFmdDogc2hvdWxkU2F2ZURyYWZ0LFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICByZXEsXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlclJlYWQgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBhZnRlclJlYWQoe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgZGVwdGgsXG4gICAgICBkb2M6IHJlc3VsdCxcbiAgICAgIGRyYWZ0OiBkcmFmdEFyZyxcbiAgICAgIGZhbGxiYWNrTG9jYWxlLFxuICAgICAgZ2xvYmFsOiBudWxsLFxuICAgICAgbG9jYWxlLFxuICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICByZXEsXG4gICAgICBzaG93SGlkZGVuRmllbGRzLFxuICAgIH0pXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJSZWFkIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYWZ0ZXJSZWFkLnJlZHVjZShhc3luYyAocHJpb3JIb29rLCBob29rKSA9PiB7XG4gICAgICBhd2FpdCBwcmlvckhvb2tcblxuICAgICAgcmVzdWx0ID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgZG9jOiByZXN1bHQsXG4gICAgICAgICAgcmVxLFxuICAgICAgICB9KSkgfHwgcmVzdWx0XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJDaGFuZ2UgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBhZnRlckNoYW5nZTxHZW5lcmF0ZWRUeXBlc1snY29sbGVjdGlvbnMnXVtUU2x1Z10+KHtcbiAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICBjb250ZXh0OiByZXEuY29udGV4dCxcbiAgICAgIGRhdGEsXG4gICAgICBkb2M6IHJlc3VsdCxcbiAgICAgIGdsb2JhbDogbnVsbCxcbiAgICAgIG9wZXJhdGlvbjogJ3VwZGF0ZScsXG4gICAgICBwcmV2aW91c0RvYzogb3JpZ2luYWxEb2MsXG4gICAgICByZXEsXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBhZnRlckNoYW5nZSAtIENvbGxlY3Rpb25cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmhvb2tzLmFmdGVyQ2hhbmdlLnJlZHVjZShhc3luYyAocHJpb3JIb29rLCBob29rKSA9PiB7XG4gICAgICBhd2FpdCBwcmlvckhvb2tcblxuICAgICAgcmVzdWx0ID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgZG9jOiByZXN1bHQsXG4gICAgICAgICAgb3BlcmF0aW9uOiAndXBkYXRlJyxcbiAgICAgICAgICBwcmV2aW91c0RvYzogb3JpZ2luYWxEb2MsXG4gICAgICAgICAgcmVxLFxuICAgICAgICB9KSkgfHwgcmVzdWx0XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJPcGVyYXRpb24gLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgcmVzdWx0ID0gYXdhaXQgYnVpbGRBZnRlck9wZXJhdGlvbjxHZW5lcmF0ZWRUeXBlc1snY29sbGVjdGlvbnMnXVtUU2x1Z10+KHtcbiAgICAgIGFyZ3MsXG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgb3BlcmF0aW9uOiAndXBkYXRlQnlJRCcsXG4gICAgICByZXN1bHQsXG4gICAgfSlcblxuICAgIGF3YWl0IHVubGlua1RlbXBGaWxlcyh7XG4gICAgICBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgY29uZmlnLFxuICAgICAgcmVxLFxuICAgIH0pXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gUmV0dXJuIHJlc3VsdHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBpZiAoc2hvdWxkQ29tbWl0KSBhd2FpdCBjb21taXRUcmFuc2FjdGlvbihyZXEpXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgYXdhaXQga2lsbFRyYW5zYWN0aW9uKGFyZ3MucmVxKVxuICAgIHRocm93IGVycm9yXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgdXBkYXRlQnlJRFxuIl0sIm5hbWVzIjpbInVwZGF0ZUJ5SUQiLCJpbmNvbWluZ0FyZ3MiLCJhcmdzIiwic2hvdWxkQ29tbWl0IiwiaW5pdFRyYW5zYWN0aW9uIiwicmVxIiwiY29sbGVjdGlvbiIsImNvbmZpZyIsImhvb2tzIiwiYmVmb3JlT3BlcmF0aW9uIiwicmVkdWNlIiwicHJpb3JIb29rIiwiaG9vayIsImNvbnRleHQiLCJvcGVyYXRpb24iLCJQcm9taXNlIiwicmVzb2x2ZSIsImlkIiwiYXV0b3NhdmUiLCJjb2xsZWN0aW9uQ29uZmlnIiwiZGVwdGgiLCJkcmFmdCIsImRyYWZ0QXJnIiwib3ZlcnJpZGVBY2Nlc3MiLCJvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzIiwiZmFsbGJhY2tMb2NhbGUiLCJsb2NhbGUiLCJwYXlsb2FkIiwidCIsInNob3dIaWRkZW5GaWVsZHMiLCJBUElFcnJvciIsImh0dHBTdGF0dXMiLCJCQURfUkVRVUVTVCIsImRhdGEiLCJkYXRhSGFzUGFzc3dvcmQiLCJwYXNzd29yZCIsInNob3VsZFNhdmVEcmFmdCIsIkJvb2xlYW4iLCJ2ZXJzaW9ucyIsImRyYWZ0cyIsInNob3VsZFNhdmVQYXNzd29yZCIsImF1dGgiLCJhY2Nlc3NSZXN1bHRzIiwiZXhlY3V0ZUFjY2VzcyIsImFjY2VzcyIsInVwZGF0ZSIsImhhc1doZXJlUG9saWN5IiwiaGFzV2hlcmVBY2Nlc3NSZXN1bHQiLCJmaW5kT25lQXJncyIsInNsdWciLCJ3aGVyZSIsImNvbWJpbmVRdWVyaWVzIiwiZXF1YWxzIiwiZG9jV2l0aExvY2FsZXMiLCJnZXRMYXRlc3RDb2xsZWN0aW9uVmVyc2lvbiIsInF1ZXJ5IiwiTm90Rm91bmQiLCJGb3JiaWRkZW4iLCJvcmlnaW5hbERvYyIsImFmdGVyUmVhZCIsImRvYyIsImdsb2JhbCIsIm5ld0ZpbGVEYXRhIiwiZmlsZXMiLCJmaWxlc1RvVXBsb2FkIiwiZ2VuZXJhdGVGaWxlRGF0YSIsInRocm93T25NaXNzaW5nRmlsZSIsImRlbGV0ZUFzc29jaWF0ZWRGaWxlcyIsIm92ZXJyaWRlRGVsZXRlIiwiYmVmb3JlVmFsaWRhdGUiLCJ1cGxvYWQiLCJkaXNhYmxlTG9jYWxTdG9yYWdlIiwidXBsb2FkRmlsZXMiLCJiZWZvcmVDaGFuZ2UiLCJyZXN1bHQiLCJza2lwVmFsaWRhdGlvbiIsInZhbGlkYXRlIiwiX3N0YXR1cyIsImRhdGFUb1VwZGF0ZSIsImhhc2giLCJzYWx0IiwiZ2VuZXJhdGVQYXNzd29yZFNhbHRIYXNoIiwiZGJBcmdzIiwiZGIiLCJ1cGRhdGVPbmUiLCJzYXZlVmVyc2lvbiIsImNyZWF0ZWRBdCIsImFmdGVyQ2hhbmdlIiwicHJldmlvdXNEb2MiLCJidWlsZEFmdGVyT3BlcmF0aW9uIiwidW5saW5rVGVtcEZpbGVzIiwiY29tbWl0VHJhbnNhY3Rpb24iLCJlcnJvciIsImtpbGxUcmFuc2FjdGlvbiJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiI7Ozs7K0JBa1pBOzs7ZUFBQTs7O21FQWhadUI7c0VBT0c7MENBQ2U7dUJBQ0o7Z0NBQ047d0JBQ2U7NkJBQ2xCOzJCQUNGOzhCQUNHO2dDQUNFO3VDQUNP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