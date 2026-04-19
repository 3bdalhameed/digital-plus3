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
const _types = require("../../config/types");
const populate = async ({ currentDepth, data, dataReference, depth, draft = false, fallbackLocale, field, index, key, locale, overrideAccess, req, showHiddenFields })=>{
    const dataToUpdate = dataReference;
    const relation = Array.isArray(field.relationTo) ? data.relationTo : field.relationTo;
    const relatedCollection = req.payload.collections[relation];
    if (relatedCollection) {
        let id = Array.isArray(field.relationTo) ? data.value : data;
        let relationshipValue;
        const shouldPopulate = depth && currentDepth <= depth;
        if (typeof id !== 'string' && typeof id !== 'number' && typeof id?.toString === 'function' && typeof id !== 'object') {
            id = id.toString();
        }
        if (shouldPopulate) {
            relationshipValue = await req.payloadDataLoader.load(JSON.stringify([
                req.transactionID,
                relatedCollection.config.slug,
                id,
                depth,
                currentDepth + 1,
                locale,
                fallbackLocale,
                overrideAccess,
                showHiddenFields,
                draft
            ]));
        }
        if (!relationshipValue) {
            // ids are visible regardless of access controls
            relationshipValue = id;
        }
        if (typeof index === 'number' && typeof key === 'string') {
            if (Array.isArray(field.relationTo)) {
                dataToUpdate[field.name][key][index].value = relationshipValue;
            } else {
                dataToUpdate[field.name][key][index] = relationshipValue;
            }
        } else if (typeof index === 'number' || typeof key === 'string') {
            if (Array.isArray(field.relationTo)) {
                dataToUpdate[field.name][index ?? key].value = relationshipValue;
            } else {
                dataToUpdate[field.name][index ?? key] = relationshipValue;
            }
        } else if (Array.isArray(field.relationTo)) {
            dataToUpdate[field.name].value = relationshipValue;
        } else {
            dataToUpdate[field.name] = relationshipValue;
        }
    }
};
const relationshipPopulationPromise = async ({ currentDepth, depth, draft, fallbackLocale, field, locale, overrideAccess, req, showHiddenFields, siblingDoc })=>{
    const resultingDoc = siblingDoc;
    const populateDepth = (0, _types.fieldHasMaxDepth)(field) && field.maxDepth < depth ? field.maxDepth : depth;
    const rowPromises = [];
    if ((0, _types.fieldSupportsMany)(field) && field.hasMany) {
        if (field.localized && locale === 'all' && typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null) {
            Object.keys(siblingDoc[field.name]).forEach((localeKey)=>{
                if (Array.isArray(siblingDoc[field.name][localeKey])) {
                    siblingDoc[field.name][localeKey].forEach((relatedDoc, index)=>{
                        const rowPromise = async ()=>{
                            await populate({
                                currentDepth,
                                data: siblingDoc[field.name][localeKey][index],
                                dataReference: resultingDoc,
                                depth: populateDepth,
                                draft,
                                fallbackLocale,
                                field,
                                index,
                                key: localeKey,
                                locale,
                                overrideAccess,
                                req,
                                showHiddenFields
                            });
                        };
                        rowPromises.push(rowPromise());
                    });
                }
            });
        } else if (Array.isArray(siblingDoc[field.name])) {
            siblingDoc[field.name].forEach((relatedDoc, index)=>{
                const rowPromise = async ()=>{
                    if (relatedDoc) {
                        await populate({
                            currentDepth,
                            data: relatedDoc,
                            dataReference: resultingDoc,
                            depth: populateDepth,
                            draft,
                            fallbackLocale,
                            field,
                            index,
                            locale,
                            overrideAccess,
                            req,
                            showHiddenFields
                        });
                    }
                };
                rowPromises.push(rowPromise());
            });
        }
    } else if (field.localized && locale === 'all' && typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null) {
        Object.keys(siblingDoc[field.name]).forEach((localeKey)=>{
            const rowPromise = async ()=>{
                await populate({
                    currentDepth,
                    data: siblingDoc[field.name][localeKey],
                    dataReference: resultingDoc,
                    depth: populateDepth,
                    draft,
                    fallbackLocale,
                    field,
                    key: localeKey,
                    locale,
                    overrideAccess,
                    req,
                    showHiddenFields
                });
            };
            rowPromises.push(rowPromise());
        });
        await Promise.all(rowPromises);
    } else if (siblingDoc[field.name]) {
        await populate({
            currentDepth,
            data: siblingDoc[field.name],
            dataReference: resultingDoc,
            depth: populateDepth,
            draft,
            fallbackLocale,
            field,
            locale,
            overrideAccess,
            req,
            showHiddenFields
        });
    }
    await Promise.all(rowPromises);
};
const _default = relationshipPopulationPromise;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9maWVsZHMvaG9va3MvYWZ0ZXJSZWFkL3JlbGF0aW9uc2hpcFBvcHVsYXRpb25Qcm9taXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgUGF5bG9hZFJlcXVlc3QgfSBmcm9tICcuLi8uLi8uLi9leHByZXNzL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBSZWxhdGlvbnNoaXBGaWVsZCwgVXBsb2FkRmllbGQgfSBmcm9tICcuLi8uLi9jb25maWcvdHlwZXMnXG5cbmltcG9ydCB7IGZpZWxkSGFzTWF4RGVwdGgsIGZpZWxkU3VwcG9ydHNNYW55IH0gZnJvbSAnLi4vLi4vY29uZmlnL3R5cGVzJ1xuXG50eXBlIFBvcHVsYXRlQXJncyA9IHtcbiAgY3VycmVudERlcHRoOiBudW1iZXJcbiAgZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgZGF0YVJlZmVyZW5jZTogUmVjb3JkPHN0cmluZywgYW55PlxuICBkZXB0aDogbnVtYmVyXG4gIGRyYWZ0OiBib29sZWFuXG4gIGZhbGxiYWNrTG9jYWxlOiBudWxsIHwgc3RyaW5nXG4gIGZpZWxkOiBSZWxhdGlvbnNoaXBGaWVsZCB8IFVwbG9hZEZpZWxkXG4gIGluZGV4PzogbnVtYmVyXG4gIGtleT86IHN0cmluZ1xuICBsb2NhbGU6IG51bGwgfCBzdHJpbmdcbiAgb3ZlcnJpZGVBY2Nlc3M6IGJvb2xlYW5cbiAgcmVxOiBQYXlsb2FkUmVxdWVzdFxuICBzaG93SGlkZGVuRmllbGRzOiBib29sZWFuXG59XG5cbmNvbnN0IHBvcHVsYXRlID0gYXN5bmMgKHtcbiAgY3VycmVudERlcHRoLFxuICBkYXRhLFxuICBkYXRhUmVmZXJlbmNlLFxuICBkZXB0aCxcbiAgZHJhZnQgPSBmYWxzZSxcbiAgZmFsbGJhY2tMb2NhbGUsXG4gIGZpZWxkLFxuICBpbmRleCxcbiAga2V5LFxuICBsb2NhbGUsXG4gIG92ZXJyaWRlQWNjZXNzLFxuICByZXEsXG4gIHNob3dIaWRkZW5GaWVsZHMsXG59OiBQb3B1bGF0ZUFyZ3MpID0+IHtcbiAgY29uc3QgZGF0YVRvVXBkYXRlID0gZGF0YVJlZmVyZW5jZVxuICBjb25zdCByZWxhdGlvbiA9IEFycmF5LmlzQXJyYXkoZmllbGQucmVsYXRpb25UbykgPyAoZGF0YS5yZWxhdGlvblRvIGFzIHN0cmluZykgOiBmaWVsZC5yZWxhdGlvblRvXG4gIGNvbnN0IHJlbGF0ZWRDb2xsZWN0aW9uID0gcmVxLnBheWxvYWQuY29sbGVjdGlvbnNbcmVsYXRpb25dXG5cbiAgaWYgKHJlbGF0ZWRDb2xsZWN0aW9uKSB7XG4gICAgbGV0IGlkID0gQXJyYXkuaXNBcnJheShmaWVsZC5yZWxhdGlvblRvKSA/IGRhdGEudmFsdWUgOiBkYXRhXG4gICAgbGV0IHJlbGF0aW9uc2hpcFZhbHVlXG4gICAgY29uc3Qgc2hvdWxkUG9wdWxhdGUgPSBkZXB0aCAmJiBjdXJyZW50RGVwdGggPD0gZGVwdGhcblxuICAgIGlmIChcbiAgICAgIHR5cGVvZiBpZCAhPT0gJ3N0cmluZycgJiZcbiAgICAgIHR5cGVvZiBpZCAhPT0gJ251bWJlcicgJiZcbiAgICAgIHR5cGVvZiBpZD8udG9TdHJpbmcgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIHR5cGVvZiBpZCAhPT0gJ29iamVjdCdcbiAgICApIHtcbiAgICAgIGlkID0gaWQudG9TdHJpbmcoKVxuICAgIH1cblxuICAgIGlmIChzaG91bGRQb3B1bGF0ZSkge1xuICAgICAgcmVsYXRpb25zaGlwVmFsdWUgPSBhd2FpdCByZXEucGF5bG9hZERhdGFMb2FkZXIubG9hZChcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICAgIHJlcS50cmFuc2FjdGlvbklELFxuICAgICAgICAgIHJlbGF0ZWRDb2xsZWN0aW9uLmNvbmZpZy5zbHVnLFxuICAgICAgICAgIGlkLFxuICAgICAgICAgIGRlcHRoLFxuICAgICAgICAgIGN1cnJlbnREZXB0aCArIDEsXG4gICAgICAgICAgbG9jYWxlLFxuICAgICAgICAgIGZhbGxiYWNrTG9jYWxlLFxuICAgICAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgICAgICAgZHJhZnQsXG4gICAgICAgIF0pLFxuICAgICAgKVxuICAgIH1cblxuICAgIGlmICghcmVsYXRpb25zaGlwVmFsdWUpIHtcbiAgICAgIC8vIGlkcyBhcmUgdmlzaWJsZSByZWdhcmRsZXNzIG9mIGFjY2VzcyBjb250cm9sc1xuICAgICAgcmVsYXRpb25zaGlwVmFsdWUgPSBpZFxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaW5kZXggPT09ICdudW1iZXInICYmIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWVsZC5yZWxhdGlvblRvKSkge1xuICAgICAgICBkYXRhVG9VcGRhdGVbZmllbGQubmFtZV1ba2V5XVtpbmRleF0udmFsdWUgPSByZWxhdGlvbnNoaXBWYWx1ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGF0YVRvVXBkYXRlW2ZpZWxkLm5hbWVdW2tleV1baW5kZXhdID0gcmVsYXRpb25zaGlwVmFsdWVcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbmRleCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGZpZWxkLnJlbGF0aW9uVG8pKSB7XG4gICAgICAgIGRhdGFUb1VwZGF0ZVtmaWVsZC5uYW1lXVtpbmRleCA/PyBrZXldLnZhbHVlID0gcmVsYXRpb25zaGlwVmFsdWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGFUb1VwZGF0ZVtmaWVsZC5uYW1lXVtpbmRleCA/PyBrZXldID0gcmVsYXRpb25zaGlwVmFsdWVcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZmllbGQucmVsYXRpb25UbykpIHtcbiAgICAgIGRhdGFUb1VwZGF0ZVtmaWVsZC5uYW1lXS52YWx1ZSA9IHJlbGF0aW9uc2hpcFZhbHVlXG4gICAgfSBlbHNlIHtcbiAgICAgIGRhdGFUb1VwZGF0ZVtmaWVsZC5uYW1lXSA9IHJlbGF0aW9uc2hpcFZhbHVlXG4gICAgfVxuICB9XG59XG5cbnR5cGUgUHJvbWlzZUFyZ3MgPSB7XG4gIGN1cnJlbnREZXB0aDogbnVtYmVyXG4gIGRlcHRoOiBudW1iZXJcbiAgZHJhZnQ6IGJvb2xlYW5cbiAgZmFsbGJhY2tMb2NhbGU6IG51bGwgfCBzdHJpbmdcbiAgZmllbGQ6IFJlbGF0aW9uc2hpcEZpZWxkIHwgVXBsb2FkRmllbGRcbiAgbG9jYWxlOiBudWxsIHwgc3RyaW5nXG4gIG92ZXJyaWRlQWNjZXNzOiBib29sZWFuXG4gIHJlcTogUGF5bG9hZFJlcXVlc3RcbiAgc2hvd0hpZGRlbkZpZWxkczogYm9vbGVhblxuICBzaWJsaW5nRG9jOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG59XG5cbmNvbnN0IHJlbGF0aW9uc2hpcFBvcHVsYXRpb25Qcm9taXNlID0gYXN5bmMgKHtcbiAgY3VycmVudERlcHRoLFxuICBkZXB0aCxcbiAgZHJhZnQsXG4gIGZhbGxiYWNrTG9jYWxlLFxuICBmaWVsZCxcbiAgbG9jYWxlLFxuICBvdmVycmlkZUFjY2VzcyxcbiAgcmVxLFxuICBzaG93SGlkZGVuRmllbGRzLFxuICBzaWJsaW5nRG9jLFxufTogUHJvbWlzZUFyZ3MpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgY29uc3QgcmVzdWx0aW5nRG9jID0gc2libGluZ0RvY1xuICBjb25zdCBwb3B1bGF0ZURlcHRoID0gZmllbGRIYXNNYXhEZXB0aChmaWVsZCkgJiYgZmllbGQubWF4RGVwdGggPCBkZXB0aCA/IGZpZWxkLm1heERlcHRoIDogZGVwdGhcbiAgY29uc3Qgcm93UHJvbWlzZXMgPSBbXVxuXG4gIGlmIChmaWVsZFN1cHBvcnRzTWFueShmaWVsZCkgJiYgZmllbGQuaGFzTWFueSkge1xuICAgIGlmIChcbiAgICAgIGZpZWxkLmxvY2FsaXplZCAmJlxuICAgICAgbG9jYWxlID09PSAnYWxsJyAmJlxuICAgICAgdHlwZW9mIHNpYmxpbmdEb2NbZmllbGQubmFtZV0gPT09ICdvYmplY3QnICYmXG4gICAgICBzaWJsaW5nRG9jW2ZpZWxkLm5hbWVdICE9PSBudWxsXG4gICAgKSB7XG4gICAgICBPYmplY3Qua2V5cyhzaWJsaW5nRG9jW2ZpZWxkLm5hbWVdKS5mb3JFYWNoKChsb2NhbGVLZXkpID0+IHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2libGluZ0RvY1tmaWVsZC5uYW1lXVtsb2NhbGVLZXldKSkge1xuICAgICAgICAgIHNpYmxpbmdEb2NbZmllbGQubmFtZV1bbG9jYWxlS2V5XS5mb3JFYWNoKChyZWxhdGVkRG9jLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgcm93UHJvbWlzZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgcG9wdWxhdGUoe1xuICAgICAgICAgICAgICAgIGN1cnJlbnREZXB0aCxcbiAgICAgICAgICAgICAgICBkYXRhOiBzaWJsaW5nRG9jW2ZpZWxkLm5hbWVdW2xvY2FsZUtleV1baW5kZXhdLFxuICAgICAgICAgICAgICAgIGRhdGFSZWZlcmVuY2U6IHJlc3VsdGluZ0RvYyxcbiAgICAgICAgICAgICAgICBkZXB0aDogcG9wdWxhdGVEZXB0aCxcbiAgICAgICAgICAgICAgICBkcmFmdCxcbiAgICAgICAgICAgICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgICAgICAgICAgICBmaWVsZCxcbiAgICAgICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgICAgICBrZXk6IGxvY2FsZUtleSxcbiAgICAgICAgICAgICAgICBsb2NhbGUsXG4gICAgICAgICAgICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb3dQcm9taXNlcy5wdXNoKHJvd1Byb21pc2UoKSlcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzaWJsaW5nRG9jW2ZpZWxkLm5hbWVdKSkge1xuICAgICAgc2libGluZ0RvY1tmaWVsZC5uYW1lXS5mb3JFYWNoKChyZWxhdGVkRG9jLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCByb3dQcm9taXNlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGlmIChyZWxhdGVkRG9jKSB7XG4gICAgICAgICAgICBhd2FpdCBwb3B1bGF0ZSh7XG4gICAgICAgICAgICAgIGN1cnJlbnREZXB0aCxcbiAgICAgICAgICAgICAgZGF0YTogcmVsYXRlZERvYyxcbiAgICAgICAgICAgICAgZGF0YVJlZmVyZW5jZTogcmVzdWx0aW5nRG9jLFxuICAgICAgICAgICAgICBkZXB0aDogcG9wdWxhdGVEZXB0aCxcbiAgICAgICAgICAgICAgZHJhZnQsXG4gICAgICAgICAgICAgIGZhbGxiYWNrTG9jYWxlLFxuICAgICAgICAgICAgICBmaWVsZCxcbiAgICAgICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgICAgIGxvY2FsZSxcbiAgICAgICAgICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICAgICAgICAgIHJlcSxcbiAgICAgICAgICAgICAgc2hvd0hpZGRlbkZpZWxkcyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcm93UHJvbWlzZXMucHVzaChyb3dQcm9taXNlKCkpXG4gICAgICB9KVxuICAgIH1cbiAgfSBlbHNlIGlmIChcbiAgICBmaWVsZC5sb2NhbGl6ZWQgJiZcbiAgICBsb2NhbGUgPT09ICdhbGwnICYmXG4gICAgdHlwZW9mIHNpYmxpbmdEb2NbZmllbGQubmFtZV0gPT09ICdvYmplY3QnICYmXG4gICAgc2libGluZ0RvY1tmaWVsZC5uYW1lXSAhPT0gbnVsbFxuICApIHtcbiAgICBPYmplY3Qua2V5cyhzaWJsaW5nRG9jW2ZpZWxkLm5hbWVdKS5mb3JFYWNoKChsb2NhbGVLZXkpID0+IHtcbiAgICAgIGNvbnN0IHJvd1Byb21pc2UgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHBvcHVsYXRlKHtcbiAgICAgICAgICBjdXJyZW50RGVwdGgsXG4gICAgICAgICAgZGF0YTogc2libGluZ0RvY1tmaWVsZC5uYW1lXVtsb2NhbGVLZXldLFxuICAgICAgICAgIGRhdGFSZWZlcmVuY2U6IHJlc3VsdGluZ0RvYyxcbiAgICAgICAgICBkZXB0aDogcG9wdWxhdGVEZXB0aCxcbiAgICAgICAgICBkcmFmdCxcbiAgICAgICAgICBmYWxsYmFja0xvY2FsZSxcbiAgICAgICAgICBmaWVsZCxcbiAgICAgICAgICBrZXk6IGxvY2FsZUtleSxcbiAgICAgICAgICBsb2NhbGUsXG4gICAgICAgICAgb3ZlcnJpZGVBY2Nlc3MsXG4gICAgICAgICAgcmVxLFxuICAgICAgICAgIHNob3dIaWRkZW5GaWVsZHMsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICByb3dQcm9taXNlcy5wdXNoKHJvd1Byb21pc2UoKSlcbiAgICB9KVxuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwocm93UHJvbWlzZXMpXG4gIH0gZWxzZSBpZiAoc2libGluZ0RvY1tmaWVsZC5uYW1lXSkge1xuICAgIGF3YWl0IHBvcHVsYXRlKHtcbiAgICAgIGN1cnJlbnREZXB0aCxcbiAgICAgIGRhdGE6IHNpYmxpbmdEb2NbZmllbGQubmFtZV0sXG4gICAgICBkYXRhUmVmZXJlbmNlOiByZXN1bHRpbmdEb2MsXG4gICAgICBkZXB0aDogcG9wdWxhdGVEZXB0aCxcbiAgICAgIGRyYWZ0LFxuICAgICAgZmFsbGJhY2tMb2NhbGUsXG4gICAgICBmaWVsZCxcbiAgICAgIGxvY2FsZSxcbiAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgcmVxLFxuICAgICAgc2hvd0hpZGRlbkZpZWxkcyxcbiAgICB9KVxuICB9XG4gIGF3YWl0IFByb21pc2UuYWxsKHJvd1Byb21pc2VzKVxufVxuXG5leHBvcnQgZGVmYXVsdCByZWxhdGlvbnNoaXBQb3B1bGF0aW9uUHJvbWlzZVxuIl0sIm5hbWVzIjpbInBvcHVsYXRlIiwiY3VycmVudERlcHRoIiwiZGF0YSIsImRhdGFSZWZlcmVuY2UiLCJkZXB0aCIsImRyYWZ0IiwiZmFsbGJhY2tMb2NhbGUiLCJmaWVsZCIsImluZGV4Iiwia2V5IiwibG9jYWxlIiwib3ZlcnJpZGVBY2Nlc3MiLCJyZXEiLCJzaG93SGlkZGVuRmllbGRzIiwiZGF0YVRvVXBkYXRlIiwicmVsYXRpb24iLCJBcnJheSIsImlzQXJyYXkiLCJyZWxhdGlvblRvIiwicmVsYXRlZENvbGxlY3Rpb24iLCJwYXlsb2FkIiwiY29sbGVjdGlvbnMiLCJpZCIsInZhbHVlIiwicmVsYXRpb25zaGlwVmFsdWUiLCJzaG91bGRQb3B1bGF0ZSIsInRvU3RyaW5nIiwicGF5bG9hZERhdGFMb2FkZXIiLCJsb2FkIiwiSlNPTiIsInN0cmluZ2lmeSIsInRyYW5zYWN0aW9uSUQiLCJjb25maWciLCJzbHVnIiwibmFtZSIsInJlbGF0aW9uc2hpcFBvcHVsYXRpb25Qcm9taXNlIiwic2libGluZ0RvYyIsInJlc3VsdGluZ0RvYyIsInBvcHVsYXRlRGVwdGgiLCJmaWVsZEhhc01heERlcHRoIiwibWF4RGVwdGgiLCJyb3dQcm9taXNlcyIsImZpZWxkU3VwcG9ydHNNYW55IiwiaGFzTWFueSIsImxvY2FsaXplZCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwibG9jYWxlS2V5IiwicmVsYXRlZERvYyIsInJvd1Byb21pc2UiLCJwdXNoIiwiUHJvbWlzZSIsImFsbCJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiI7Ozs7K0JBaU9BOzs7ZUFBQTs7O3VCQTlO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