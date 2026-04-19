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
const _crypto = /*#__PURE__*/ _interop_require_default(require("crypto"));
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _util = require("util");
const _executeAccess = /*#__PURE__*/ _interop_require_default(require("../../auth/executeAccess"));
const _sendVerificationEmail = /*#__PURE__*/ _interop_require_default(require("../../auth/sendVerificationEmail"));
const _register = require("../../auth/strategies/local/register");
const _afterChange = require("../../fields/hooks/afterChange");
const _afterRead = require("../../fields/hooks/afterRead");
const _beforeChange = require("../../fields/hooks/beforeChange");
const _beforeValidate = require("../../fields/hooks/beforeValidate");
const _generateFileData = require("../../uploads/generateFileData");
const _unlinkTempFiles = require("../../uploads/unlinkTempFiles");
const _uploadFiles = require("../../uploads/uploadFiles");
const _commitTransaction = require("../../utilities/commitTransaction");
const _flattenTopLevelFields = /*#__PURE__*/ _interop_require_default(require("../../utilities/flattenTopLevelFields"));
const _initTransaction = require("../../utilities/initTransaction");
const _killTransaction = require("../../utilities/killTransaction");
const _sanitizeInternalFields = /*#__PURE__*/ _interop_require_default(require("../../utilities/sanitizeInternalFields"));
const _saveVersion = require("../../versions/saveVersion");
const _utils = require("./utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const unlinkFile = (0, _util.promisify)(_fs.default.unlink);
async function create(incomingArgs) {
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
                operation: 'create',
                req: args.req
            }) || args;
        }, Promise.resolve());
        const { autosave = false, collection: { config: collectionConfig }, collection, depth, disableVerificationEmail, draft = false, overrideAccess, overwriteExistingFiles = false, req: { fallbackLocale, locale, payload, payload: { config, emailOptions } }, req, showHiddenFields } = args;
        let { data } = args;
        const shouldSaveDraft = Boolean(draft && collectionConfig.versions.drafts);
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        if (!overrideAccess) {
            await (0, _executeAccess.default)({
                data,
                req
            }, collectionConfig.access.create);
        }
        // /////////////////////////////////////
        // Custom id
        // /////////////////////////////////////
        // @todo: Refactor code to store 'customId' on the collection configuration itself so we don't need to repeat flattenFields
        const hasIdField = (0, _flattenTopLevelFields.default)(collectionConfig.fields).findIndex((field)=>field.name === 'id') > -1;
        if (hasIdField) {
            data = {
                _id: data.id,
                ...data
            };
        }
        // /////////////////////////////////////
        // Generate data for all files and sizes
        // /////////////////////////////////////
        const { data: newFileData, files: filesToUpload } = await (0, _generateFileData.generateFileData)({
            collection,
            config,
            data,
            operation: 'create',
            overwriteExistingFiles,
            req,
            throwOnMissingFile: !shouldSaveDraft && collection.config.upload.filesRequiredOnCreate !== false
        });
        data = newFileData;
        // /////////////////////////////////////
        // beforeValidate - Fields
        // /////////////////////////////////////
        data = await (0, _beforeValidate.beforeValidate)({
            collection: collectionConfig,
            context: req.context,
            data,
            doc: {},
            global: null,
            operation: 'create',
            overrideAccess,
            req
        });
        // /////////////////////////////////////
        // beforeValidate - Collections
        // /////////////////////////////////////
        await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook)=>{
            await priorHook;
            data = await hook({
                collection: collectionConfig,
                context: req.context,
                data,
                operation: 'create',
                req
            }) || data;
        }, Promise.resolve());
        // /////////////////////////////////////
        // beforeChange - Collection
        // /////////////////////////////////////
        await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook)=>{
            await priorHook;
            data = await hook({
                collection: collectionConfig,
                context: req.context,
                data,
                operation: 'create',
                req
            }) || data;
        }, Promise.resolve());
        // /////////////////////////////////////
        // beforeChange - Fields
        // /////////////////////////////////////
        const resultWithLocales = await (0, _beforeChange.beforeChange)({
            collection: collectionConfig,
            context: req.context,
            data,
            doc: {},
            docWithLocales: {},
            global: null,
            operation: 'create',
            req,
            skipValidation: shouldSaveDraft && collectionConfig.versions.drafts && !collectionConfig.versions.drafts.validate
        });
        // /////////////////////////////////////
        // Write files to local storage
        // /////////////////////////////////////
        if (!collectionConfig.upload.disableLocalStorage) {
            await (0, _uploadFiles.uploadFiles)(payload, filesToUpload, req.t);
        }
        // /////////////////////////////////////
        // Create
        // /////////////////////////////////////
        let doc;
        if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
            if (data.email) {
                resultWithLocales.email = data.email.toLowerCase();
            }
            if (collectionConfig.auth.verify) {
                resultWithLocales._verified = Boolean(resultWithLocales._verified) || false;
                resultWithLocales._verificationToken = _crypto.default.randomBytes(20).toString('hex');
            }
            doc = await (0, _register.registerLocalStrategy)({
                collection: collectionConfig,
                doc: resultWithLocales,
                password: data.password,
                payload: req.payload,
                req
            });
        } else {
            const dbArgs = {
                collection: collectionConfig.slug,
                data: resultWithLocales,
                req
            };
            if (collectionConfig?.db?.create) {
                doc = await collectionConfig.db.create(dbArgs);
            } else {
                doc = await payload.db.create(dbArgs);
            }
        }
        const verificationToken = doc._verificationToken;
        let result = (0, _sanitizeInternalFields.default)(doc);
        // /////////////////////////////////////
        // Create version
        // /////////////////////////////////////
        if (collectionConfig.versions) {
            await (0, _saveVersion.saveVersion)({
                id: result.id,
                autosave,
                collection: collectionConfig,
                docWithLocales: result,
                payload,
                req
            });
        }
        // /////////////////////////////////////
        // Send verification email if applicable
        // /////////////////////////////////////
        if (collectionConfig.auth && collectionConfig.auth.verify) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            (0, _sendVerificationEmail.default)({
                collection: {
                    config: collectionConfig
                },
                config: payload.config,
                disableEmail: disableVerificationEmail,
                emailOptions,
                req,
                sendEmail: payload.sendEmail,
                token: verificationToken,
                user: result
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
            draft,
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
            operation: 'create',
            previousDoc: {},
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
                operation: 'create',
                previousDoc: {},
                req: args.req
            }) || result;
        }, Promise.resolve());
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await (0, _utils.buildAfterOperation)({
            args,
            collection: collectionConfig,
            operation: 'create',
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
const _default = create;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb2xsZWN0aW9ucy9vcGVyYXRpb25zL2NyZWF0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IE1hcmtPcHRpb25hbCB9IGZyb20gJ3RzLWVzc2VudGlhbHMnXG5cbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJ1xuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSAndXRpbCdcblxuaW1wb3J0IHR5cGUgeyBHZW5lcmF0ZWRUeXBlcyB9IGZyb20gJy4uLy4uLydcbmltcG9ydCB0eXBlIHsgUGF5bG9hZFJlcXVlc3QgfSBmcm9tICcuLi8uLi9leHByZXNzL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBEb2N1bWVudCB9IGZyb20gJy4uLy4uL3R5cGVzJ1xuaW1wb3J0IHR5cGUge1xuICBBZnRlckNoYW5nZUhvb2ssXG4gIEJlZm9yZU9wZXJhdGlvbkhvb2ssXG4gIEJlZm9yZVZhbGlkYXRlSG9vayxcbiAgQ29sbGVjdGlvbixcbn0gZnJvbSAnLi4vY29uZmlnL3R5cGVzJ1xuXG5pbXBvcnQgZXhlY3V0ZUFjY2VzcyBmcm9tICcuLi8uLi9hdXRoL2V4ZWN1dGVBY2Nlc3MnXG5pbXBvcnQgc2VuZFZlcmlmaWNhdGlvbkVtYWlsIGZyb20gJy4uLy4uL2F1dGgvc2VuZFZlcmlmaWNhdGlvbkVtYWlsJ1xuaW1wb3J0IHsgcmVnaXN0ZXJMb2NhbFN0cmF0ZWd5IH0gZnJvbSAnLi4vLi4vYXV0aC9zdHJhdGVnaWVzL2xvY2FsL3JlZ2lzdGVyJ1xuaW1wb3J0IHsgYWZ0ZXJDaGFuZ2UgfSBmcm9tICcuLi8uLi9maWVsZHMvaG9va3MvYWZ0ZXJDaGFuZ2UnXG5pbXBvcnQgeyBhZnRlclJlYWQgfSBmcm9tICcuLi8uLi9maWVsZHMvaG9va3MvYWZ0ZXJSZWFkJ1xuaW1wb3J0IHsgYmVmb3JlQ2hhbmdlIH0gZnJvbSAnLi4vLi4vZmllbGRzL2hvb2tzL2JlZm9yZUNoYW5nZSdcbmltcG9ydCB7IGJlZm9yZVZhbGlkYXRlIH0gZnJvbSAnLi4vLi4vZmllbGRzL2hvb2tzL2JlZm9yZVZhbGlkYXRlJ1xuaW1wb3J0IHsgZ2VuZXJhdGVGaWxlRGF0YSB9IGZyb20gJy4uLy4uL3VwbG9hZHMvZ2VuZXJhdGVGaWxlRGF0YSdcbmltcG9ydCB7IHVubGlua1RlbXBGaWxlcyB9IGZyb20gJy4uLy4uL3VwbG9hZHMvdW5saW5rVGVtcEZpbGVzJ1xuaW1wb3J0IHsgdXBsb2FkRmlsZXMgfSBmcm9tICcuLi8uLi91cGxvYWRzL3VwbG9hZEZpbGVzJ1xuaW1wb3J0IHsgY29tbWl0VHJhbnNhY3Rpb24gfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvY29tbWl0VHJhbnNhY3Rpb24nXG5pbXBvcnQgZmxhdHRlbkZpZWxkcyBmcm9tICcuLi8uLi91dGlsaXRpZXMvZmxhdHRlblRvcExldmVsRmllbGRzJ1xuaW1wb3J0IHsgaW5pdFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2luaXRUcmFuc2FjdGlvbidcbmltcG9ydCB7IGtpbGxUcmFuc2FjdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9raWxsVHJhbnNhY3Rpb24nXG5pbXBvcnQgc2FuaXRpemVJbnRlcm5hbEZpZWxkcyBmcm9tICcuLi8uLi91dGlsaXRpZXMvc2FuaXRpemVJbnRlcm5hbEZpZWxkcydcbmltcG9ydCB7IHNhdmVWZXJzaW9uIH0gZnJvbSAnLi4vLi4vdmVyc2lvbnMvc2F2ZVZlcnNpb24nXG5pbXBvcnQgeyBidWlsZEFmdGVyT3BlcmF0aW9uIH0gZnJvbSAnLi91dGlscydcblxuY29uc3QgdW5saW5rRmlsZSA9IHByb21pc2lmeShmcy51bmxpbmspXG5cbmV4cG9ydCB0eXBlIENyZWF0ZVVwZGF0ZVR5cGUgPSB7IFtmaWVsZDogbnVtYmVyIHwgc3RyaW5nIHwgc3ltYm9sXTogdW5rbm93biB9XG5cbmV4cG9ydCB0eXBlIEFyZ3VtZW50czxUIGV4dGVuZHMgQ3JlYXRlVXBkYXRlVHlwZT4gPSB7XG4gIGF1dG9zYXZlPzogYm9vbGVhblxuICBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uXG4gIGRhdGE6IE1hcmtPcHRpb25hbDxULCAnY3JlYXRlZEF0JyB8ICdpZCcgfCAnc2l6ZXMnIHwgJ3VwZGF0ZWRBdCc+XG4gIGRlcHRoPzogbnVtYmVyXG4gIGRpc2FibGVWZXJpZmljYXRpb25FbWFpbD86IGJvb2xlYW5cbiAgZHJhZnQ/OiBib29sZWFuXG4gIG92ZXJyaWRlQWNjZXNzPzogYm9vbGVhblxuICBvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzPzogYm9vbGVhblxuICByZXE6IFBheWxvYWRSZXF1ZXN0XG4gIHNob3dIaWRkZW5GaWVsZHM/OiBib29sZWFuXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZTxUU2x1ZyBleHRlbmRzIGtleW9mIEdlbmVyYXRlZFR5cGVzWydjb2xsZWN0aW9ucyddPihcbiAgaW5jb21pbmdBcmdzOiBBcmd1bWVudHM8R2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ11bVFNsdWddPixcbik6IFByb21pc2U8R2VuZXJhdGVkVHlwZXNbJ2NvbGxlY3Rpb25zJ11bVFNsdWddPiB7XG4gIGxldCBhcmdzID0gaW5jb21pbmdBcmdzXG5cbiAgdHJ5IHtcbiAgICBjb25zdCBzaG91bGRDb21taXQgPSBhd2FpdCBpbml0VHJhbnNhY3Rpb24oYXJncy5yZXEpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYmVmb3JlT3BlcmF0aW9uIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGFyZ3MuY29sbGVjdGlvbi5jb25maWcuaG9va3MuYmVmb3JlT3BlcmF0aW9uLnJlZHVjZShcbiAgICAgIGFzeW5jIChwcmlvckhvb2s6IEJlZm9yZU9wZXJhdGlvbkhvb2sgfCBQcm9taXNlPHZvaWQ+LCBob29rOiBCZWZvcmVPcGVyYXRpb25Ib29rKSA9PiB7XG4gICAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICAgIGFyZ3MgPVxuICAgICAgICAgIChhd2FpdCBob29rKHtcbiAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiBhcmdzLmNvbGxlY3Rpb24uY29uZmlnLFxuICAgICAgICAgICAgY29udGV4dDogYXJncy5yZXEuY29udGV4dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbjogJ2NyZWF0ZScsXG4gICAgICAgICAgICByZXE6IGFyZ3MucmVxLFxuICAgICAgICAgIH0pKSB8fCBhcmdzXG4gICAgICB9LFxuICAgICAgUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgKVxuXG4gICAgY29uc3Qge1xuICAgICAgYXV0b3NhdmUgPSBmYWxzZSxcbiAgICAgIGNvbGxlY3Rpb246IHsgY29uZmlnOiBjb2xsZWN0aW9uQ29uZmlnIH0sXG4gICAgICBjb2xsZWN0aW9uLFxuICAgICAgZGVwdGgsXG4gICAgICBkaXNhYmxlVmVyaWZpY2F0aW9uRW1haWwsXG4gICAgICBkcmFmdCA9IGZhbHNlLFxuICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICBvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzID0gZmFsc2UsXG4gICAgICByZXE6IHtcbiAgICAgICAgZmFsbGJhY2tMb2NhbGUsXG4gICAgICAgIGxvY2FsZSxcbiAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgcGF5bG9hZDogeyBjb25maWcsIGVtYWlsT3B0aW9ucyB9LFxuICAgICAgfSxcbiAgICAgIHJlcSxcbiAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgfSA9IGFyZ3NcblxuICAgIGxldCB7IGRhdGEgfSA9IGFyZ3NcblxuICAgIGNvbnN0IHNob3VsZFNhdmVEcmFmdCA9IEJvb2xlYW4oZHJhZnQgJiYgY29sbGVjdGlvbkNvbmZpZy52ZXJzaW9ucy5kcmFmdHMpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQWNjZXNzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKCFvdmVycmlkZUFjY2Vzcykge1xuICAgICAgYXdhaXQgZXhlY3V0ZUFjY2Vzcyh7IGRhdGEsIHJlcSB9LCBjb2xsZWN0aW9uQ29uZmlnLmFjY2Vzcy5jcmVhdGUpXG4gICAgfVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEN1c3RvbSBpZFxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBAdG9kbzogUmVmYWN0b3IgY29kZSB0byBzdG9yZSAnY3VzdG9tSWQnIG9uIHRoZSBjb2xsZWN0aW9uIGNvbmZpZ3VyYXRpb24gaXRzZWxmIHNvIHdlIGRvbid0IG5lZWQgdG8gcmVwZWF0IGZsYXR0ZW5GaWVsZHNcbiAgICBjb25zdCBoYXNJZEZpZWxkID1cbiAgICAgIGZsYXR0ZW5GaWVsZHMoY29sbGVjdGlvbkNvbmZpZy5maWVsZHMpLmZpbmRJbmRleCgoZmllbGQpID0+IGZpZWxkLm5hbWUgPT09ICdpZCcpID4gLTFcblxuICAgIGlmIChoYXNJZEZpZWxkKSB7XG4gICAgICBkYXRhID0ge1xuICAgICAgICBfaWQ6IGRhdGEuaWQsXG4gICAgICAgIC4uLmRhdGEsXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEdlbmVyYXRlIGRhdGEgZm9yIGFsbCBmaWxlcyBhbmQgc2l6ZXNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBjb25zdCB7IGRhdGE6IG5ld0ZpbGVEYXRhLCBmaWxlczogZmlsZXNUb1VwbG9hZCB9ID0gYXdhaXQgZ2VuZXJhdGVGaWxlRGF0YSh7XG4gICAgICBjb2xsZWN0aW9uLFxuICAgICAgY29uZmlnLFxuICAgICAgZGF0YSxcbiAgICAgIG9wZXJhdGlvbjogJ2NyZWF0ZScsXG4gICAgICBvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzLFxuICAgICAgcmVxLFxuICAgICAgdGhyb3dPbk1pc3NpbmdGaWxlOlxuICAgICAgICAhc2hvdWxkU2F2ZURyYWZ0ICYmIGNvbGxlY3Rpb24uY29uZmlnLnVwbG9hZC5maWxlc1JlcXVpcmVkT25DcmVhdGUgIT09IGZhbHNlLFxuICAgIH0pXG5cbiAgICBkYXRhID0gbmV3RmlsZURhdGFcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVWYWxpZGF0ZSAtIEZpZWxkc1xuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGRhdGEgPSBhd2FpdCBiZWZvcmVWYWxpZGF0ZSh7XG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICBkYXRhLFxuICAgICAgZG9jOiB7fSxcbiAgICAgIGdsb2JhbDogbnVsbCxcbiAgICAgIG9wZXJhdGlvbjogJ2NyZWF0ZScsXG4gICAgICBvdmVycmlkZUFjY2VzcyxcbiAgICAgIHJlcSxcbiAgICB9KVxuXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIGJlZm9yZVZhbGlkYXRlIC0gQ29sbGVjdGlvbnNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmhvb2tzLmJlZm9yZVZhbGlkYXRlLnJlZHVjZShcbiAgICAgIGFzeW5jIChwcmlvckhvb2s6IEJlZm9yZVZhbGlkYXRlSG9vayB8IFByb21pc2U8dm9pZD4sIGhvb2s6IEJlZm9yZVZhbGlkYXRlSG9vaykgPT4ge1xuICAgICAgICBhd2FpdCBwcmlvckhvb2tcblxuICAgICAgICBkYXRhID1cbiAgICAgICAgICAoYXdhaXQgaG9vayh7XG4gICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgb3BlcmF0aW9uOiAnY3JlYXRlJyxcbiAgICAgICAgICAgIHJlcSxcbiAgICAgICAgICB9KSkgfHwgZGF0YVxuICAgICAgfSxcbiAgICAgIFByb21pc2UucmVzb2x2ZSgpLFxuICAgIClcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVDaGFuZ2UgLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5ob29rcy5iZWZvcmVDaGFuZ2UucmVkdWNlKGFzeW5jIChwcmlvckhvb2ssIGhvb2spID0+IHtcbiAgICAgIGF3YWl0IHByaW9ySG9va1xuXG4gICAgICBkYXRhID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgZGF0YSxcbiAgICAgICAgICBvcGVyYXRpb246ICdjcmVhdGUnLFxuICAgICAgICAgIHJlcSxcbiAgICAgICAgfSkpIHx8IGRhdGFcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBiZWZvcmVDaGFuZ2UgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBjb25zdCByZXN1bHRXaXRoTG9jYWxlcyA9IGF3YWl0IGJlZm9yZUNoYW5nZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4oe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgIGNvbnRleHQ6IHJlcS5jb250ZXh0LFxuICAgICAgZGF0YSxcbiAgICAgIGRvYzoge30sXG4gICAgICBkb2NXaXRoTG9jYWxlczoge30sXG4gICAgICBnbG9iYWw6IG51bGwsXG4gICAgICBvcGVyYXRpb246ICdjcmVhdGUnLFxuICAgICAgcmVxLFxuICAgICAgc2tpcFZhbGlkYXRpb246XG4gICAgICAgIHNob3VsZFNhdmVEcmFmdCAmJlxuICAgICAgICBjb2xsZWN0aW9uQ29uZmlnLnZlcnNpb25zLmRyYWZ0cyAmJlxuICAgICAgICAhY29sbGVjdGlvbkNvbmZpZy52ZXJzaW9ucy5kcmFmdHMudmFsaWRhdGUsXG4gICAgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBXcml0ZSBmaWxlcyB0byBsb2NhbCBzdG9yYWdlXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKCFjb2xsZWN0aW9uQ29uZmlnLnVwbG9hZC5kaXNhYmxlTG9jYWxTdG9yYWdlKSB7XG4gICAgICBhd2FpdCB1cGxvYWRGaWxlcyhwYXlsb2FkLCBmaWxlc1RvVXBsb2FkLCByZXEudClcbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQ3JlYXRlXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgbGV0IGRvY1xuXG4gICAgaWYgKGNvbGxlY3Rpb25Db25maWcuYXV0aCAmJiAhY29sbGVjdGlvbkNvbmZpZy5hdXRoLmRpc2FibGVMb2NhbFN0cmF0ZWd5KSB7XG4gICAgICBpZiAoZGF0YS5lbWFpbCkge1xuICAgICAgICByZXN1bHRXaXRoTG9jYWxlcy5lbWFpbCA9IChkYXRhLmVtYWlsIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKVxuICAgICAgfVxuXG4gICAgICBpZiAoY29sbGVjdGlvbkNvbmZpZy5hdXRoLnZlcmlmeSkge1xuICAgICAgICByZXN1bHRXaXRoTG9jYWxlcy5fdmVyaWZpZWQgPSBCb29sZWFuKHJlc3VsdFdpdGhMb2NhbGVzLl92ZXJpZmllZCkgfHwgZmFsc2VcbiAgICAgICAgcmVzdWx0V2l0aExvY2FsZXMuX3ZlcmlmaWNhdGlvblRva2VuID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDIwKS50b1N0cmluZygnaGV4JylcbiAgICAgIH1cblxuICAgICAgZG9jID0gYXdhaXQgcmVnaXN0ZXJMb2NhbFN0cmF0ZWd5KHtcbiAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgICAgZG9jOiByZXN1bHRXaXRoTG9jYWxlcyxcbiAgICAgICAgcGFzc3dvcmQ6IGRhdGEucGFzc3dvcmQgYXMgc3RyaW5nLFxuICAgICAgICBwYXlsb2FkOiByZXEucGF5bG9hZCxcbiAgICAgICAgcmVxLFxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGJBcmdzID0ge1xuICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLnNsdWcsXG4gICAgICAgIGRhdGE6IHJlc3VsdFdpdGhMb2NhbGVzLFxuICAgICAgICByZXEsXG4gICAgICB9XG4gICAgICBpZiAoY29sbGVjdGlvbkNvbmZpZz8uZGI/LmNyZWF0ZSkge1xuICAgICAgICBkb2MgPSBhd2FpdCBjb2xsZWN0aW9uQ29uZmlnLmRiLmNyZWF0ZShkYkFyZ3MpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb2MgPSBhd2FpdCBwYXlsb2FkLmRiLmNyZWF0ZShkYkFyZ3MpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdmVyaWZpY2F0aW9uVG9rZW4gPSBkb2MuX3ZlcmlmaWNhdGlvblRva2VuXG4gICAgbGV0IHJlc3VsdDogRG9jdW1lbnQgPSBzYW5pdGl6ZUludGVybmFsRmllbGRzKGRvYylcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBDcmVhdGUgdmVyc2lvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGlmIChjb2xsZWN0aW9uQ29uZmlnLnZlcnNpb25zKSB7XG4gICAgICBhd2FpdCBzYXZlVmVyc2lvbih7XG4gICAgICAgIGlkOiByZXN1bHQuaWQsXG4gICAgICAgIGF1dG9zYXZlLFxuICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICBkb2NXaXRoTG9jYWxlczogcmVzdWx0LFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICByZXEsXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBTZW5kIHZlcmlmaWNhdGlvbiBlbWFpbCBpZiBhcHBsaWNhYmxlXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgaWYgKGNvbGxlY3Rpb25Db25maWcuYXV0aCAmJiBjb2xsZWN0aW9uQ29uZmlnLmF1dGgudmVyaWZ5KSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWZsb2F0aW5nLXByb21pc2VzXG4gICAgICBzZW5kVmVyaWZpY2F0aW9uRW1haWwoe1xuICAgICAgICBjb2xsZWN0aW9uOiB7IGNvbmZpZzogY29sbGVjdGlvbkNvbmZpZyB9LFxuICAgICAgICBjb25maWc6IHBheWxvYWQuY29uZmlnLFxuICAgICAgICBkaXNhYmxlRW1haWw6IGRpc2FibGVWZXJpZmljYXRpb25FbWFpbCxcbiAgICAgICAgZW1haWxPcHRpb25zLFxuICAgICAgICByZXEsXG4gICAgICAgIHNlbmRFbWFpbDogcGF5bG9hZC5zZW5kRW1haWwsXG4gICAgICAgIHRva2VuOiB2ZXJpZmljYXRpb25Ub2tlbixcbiAgICAgICAgdXNlcjogcmVzdWx0LFxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJSZWFkIC0gRmllbGRzXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgcmVzdWx0ID0gYXdhaXQgYWZ0ZXJSZWFkKHtcbiAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICBjb250ZXh0OiByZXEuY29udGV4dCxcbiAgICAgIGRlcHRoLFxuICAgICAgZG9jOiByZXN1bHQsXG4gICAgICBkcmFmdCxcbiAgICAgIGZhbGxiYWNrTG9jYWxlLFxuICAgICAgZ2xvYmFsOiBudWxsLFxuICAgICAgbG9jYWxlLFxuICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICByZXEsXG4gICAgICBzaG93SGlkZGVuRmllbGRzLFxuICAgIH0pXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJSZWFkIC0gQ29sbGVjdGlvblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGF3YWl0IGNvbGxlY3Rpb25Db25maWcuaG9va3MuYWZ0ZXJSZWFkLnJlZHVjZShhc3luYyAocHJpb3JIb29rLCBob29rKSA9PiB7XG4gICAgICBhd2FpdCBwcmlvckhvb2tcblxuICAgICAgcmVzdWx0ID1cbiAgICAgICAgKGF3YWl0IGhvb2soe1xuICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25Db25maWcsXG4gICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgZG9jOiByZXN1bHQsXG4gICAgICAgICAgcmVxLFxuICAgICAgICB9KSkgfHwgcmVzdWx0XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJDaGFuZ2UgLSBGaWVsZHNcbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICByZXN1bHQgPSBhd2FpdCBhZnRlckNoYW5nZSh7XG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICBkYXRhLFxuICAgICAgZG9jOiByZXN1bHQsXG4gICAgICBnbG9iYWw6IG51bGwsXG4gICAgICBvcGVyYXRpb246ICdjcmVhdGUnLFxuICAgICAgcHJldmlvdXNEb2M6IHt9LFxuICAgICAgcmVxLFxuICAgIH0pXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJDaGFuZ2UgLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgYXdhaXQgY29sbGVjdGlvbkNvbmZpZy5ob29rcy5hZnRlckNoYW5nZS5yZWR1Y2UoXG4gICAgICBhc3luYyAocHJpb3JIb29rOiBBZnRlckNoYW5nZUhvb2sgfCBQcm9taXNlPHZvaWQ+LCBob29rOiBBZnRlckNoYW5nZUhvb2spID0+IHtcbiAgICAgICAgYXdhaXQgcHJpb3JIb29rXG5cbiAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAoYXdhaXQgaG9vayh7XG4gICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgICAgICAgY29udGV4dDogcmVxLmNvbnRleHQsXG4gICAgICAgICAgICBkb2M6IHJlc3VsdCxcbiAgICAgICAgICAgIG9wZXJhdGlvbjogJ2NyZWF0ZScsXG4gICAgICAgICAgICBwcmV2aW91c0RvYzoge30sXG4gICAgICAgICAgICByZXE6IGFyZ3MucmVxLFxuICAgICAgICAgIH0pKSB8fCByZXN1bHRcbiAgICAgIH0sXG4gICAgICBQcm9taXNlLnJlc29sdmUoKSxcbiAgICApXG5cbiAgICAvLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gYWZ0ZXJPcGVyYXRpb24gLSBDb2xsZWN0aW9uXG4gICAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgcmVzdWx0ID0gYXdhaXQgYnVpbGRBZnRlck9wZXJhdGlvbjxHZW5lcmF0ZWRUeXBlc1snY29sbGVjdGlvbnMnXVtUU2x1Z10+KHtcbiAgICAgIGFyZ3MsXG4gICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uQ29uZmlnLFxuICAgICAgb3BlcmF0aW9uOiAnY3JlYXRlJyxcbiAgICAgIHJlc3VsdCxcbiAgICB9KVxuXG4gICAgYXdhaXQgdW5saW5rVGVtcEZpbGVzKHsgY29sbGVjdGlvbkNvbmZpZywgY29uZmlnLCByZXEgfSlcblxuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBSZXR1cm4gcmVzdWx0c1xuICAgIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIGlmIChzaG91bGRDb21taXQpIGF3YWl0IGNvbW1pdFRyYW5zYWN0aW9uKHJlcSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICBhd2FpdCBraWxsVHJhbnNhY3Rpb24oYXJncy5yZXEpXG4gICAgdGhyb3cgZXJyb3JcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVcbiJdLCJuYW1lcyI6WyJ1bmxpbmtGaWxlIiwicHJvbWlzaWZ5IiwiZnMiLCJ1bmxpbmsiLCJjcmVhdGUiLCJpbmNvbWluZ0FyZ3MiLCJhcmdzIiwic2hvdWxkQ29tbWl0IiwiaW5pdFRyYW5zYWN0aW9uIiwicmVxIiwiY29sbGVjdGlvbiIsImNvbmZpZyIsImhvb2tzIiwiYmVmb3JlT3BlcmF0aW9uIiwicmVkdWNlIiwicHJpb3JIb29rIiwiaG9vayIsImNvbnRleHQiLCJvcGVyYXRpb24iLCJQcm9taXNlIiwicmVzb2x2ZSIsImF1dG9zYXZlIiwiY29sbGVjdGlvbkNvbmZpZyIsImRlcHRoIiwiZGlzYWJsZVZlcmlmaWNhdGlvbkVtYWlsIiwiZHJhZnQiLCJvdmVycmlkZUFjY2VzcyIsIm92ZXJ3cml0ZUV4aXN0aW5nRmlsZXMiLCJmYWxsYmFja0xvY2FsZSIsImxvY2FsZSIsInBheWxvYWQiLCJlbWFpbE9wdGlvbnMiLCJzaG93SGlkZGVuRmllbGRzIiwiZGF0YSIsInNob3VsZFNhdmVEcmFmdCIsIkJvb2xlYW4iLCJ2ZXJzaW9ucyIsImRyYWZ0cyIsImV4ZWN1dGVBY2Nlc3MiLCJhY2Nlc3MiLCJoYXNJZEZpZWxkIiwiZmxhdHRlbkZpZWxkcyIsImZpZWxkcyIsImZpbmRJbmRleCIsImZpZWxkIiwibmFtZSIsIl9pZCIsImlkIiwibmV3RmlsZURhdGEiLCJmaWxlcyIsImZpbGVzVG9VcGxvYWQiLCJnZW5lcmF0ZUZpbGVEYXRhIiwidGhyb3dPbk1pc3NpbmdGaWxlIiwidXBsb2FkIiwiZmlsZXNSZXF1aXJlZE9uQ3JlYXRlIiwiYmVmb3JlVmFsaWRhdGUiLCJkb2MiLCJnbG9iYWwiLCJiZWZvcmVDaGFuZ2UiLCJyZXN1bHRXaXRoTG9jYWxlcyIsImRvY1dpdGhMb2NhbGVzIiwic2tpcFZhbGlkYXRpb24iLCJ2YWxpZGF0ZSIsImRpc2FibGVMb2NhbFN0b3JhZ2UiLCJ1cGxvYWRGaWxlcyIsInQiLCJhdXRoIiwiZGlzYWJsZUxvY2FsU3RyYXRlZ3kiLCJlbWFpbCIsInRvTG93ZXJDYXNlIiwidmVyaWZ5IiwiX3ZlcmlmaWVkIiwiX3ZlcmlmaWNhdGlvblRva2VuIiwiY3J5cHRvIiwicmFuZG9tQnl0ZXMiLCJ0b1N0cmluZyIsInJlZ2lzdGVyTG9jYWxTdHJhdGVneSIsInBhc3N3b3JkIiwiZGJBcmdzIiwic2x1ZyIsImRiIiwidmVyaWZpY2F0aW9uVG9rZW4iLCJyZXN1bHQiLCJzYW5pdGl6ZUludGVybmFsRmllbGRzIiwic2F2ZVZlcnNpb24iLCJzZW5kVmVyaWZpY2F0aW9uRW1haWwiLCJkaXNhYmxlRW1haWwiLCJzZW5kRW1haWwiLCJ0b2tlbiIsInVzZXIiLCJhZnRlclJlYWQiLCJhZnRlckNoYW5nZSIsInByZXZpb3VzRG9jIiwiYnVpbGRBZnRlck9wZXJhdGlvbiIsInVubGlua1RlbXBGaWxlcyIsImNvbW1pdFRyYW5zYWN0aW9uIiwiZXJyb3IiLCJraWxsVHJhbnNhY3Rpb24iXSwicmFuZ2VNYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsIm1hcHBpbmdzIjoiOzs7OytCQW9ZQTs7O2VBQUE7OzsrREFsWW1COzJEQUNKO3NCQUNXO3NFQVlBOzhFQUNROzBCQUNJOzZCQUNWOzJCQUNGOzhCQUNHO2dDQUNFO2tDQUNFO2lDQUNEOzZCQUNKO21DQUNNOzhFQUNSO2lDQUNNO2lDQUNBOytFQUNHOzZCQUNQO3VCQUNROzs7Ozs7QUFFcEMsTUFBTUEsYUFBYUMsSUFBQUEsZUFBUyxFQUFDQyxXQUFFLENBQUNDLE1BQU07QUFpQnRDLGVBQWVDLE9BQ2JDLFlBQTZEO0lBRTdELElBQUlDLE9BQU9EO0lBRVgsSUFBSTtRQUNGLE1BQU1FLGVBQWUsTUFBTUMsSUFBQUEsZ0NBQWUsRUFBQ0YsS0FBS0csR0FBRztRQUVuRCx3Q0FBd0M7UUFDeEMsK0JBQStCO1FBQy9CLHdDQUF3QztRQUV4QyxNQUFNSCxLQUFLSSxVQUFVLENBQUNDLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDQyxlQUFlLENBQUNDLE1BQU0sQ0FDdkQsT0FBT0MsV0FBZ0RDO1lBQ3JELE1BQU1EO1lB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