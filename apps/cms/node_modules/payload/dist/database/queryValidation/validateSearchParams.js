"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "validateSearchParam", {
    enumerable: true,
    get: function() {
        return validateSearchParam;
    }
});
const _types = require("../../fields/config/types");
const _getEntityPolicies = require("../../utilities/getEntityPolicies");
const _getLocalizedPaths = require("../getLocalizedPaths");
const _validateQueryPaths = require("./validateQueryPaths");
async function validateSearchParam({ collectionConfig, errors, fields, globalConfig, operator, overrideAccess, path: incomingPath, policies, req, val, versionFields }) {
    // Replace GraphQL nested field double underscore formatting
    let sanitizedPath;
    if (incomingPath === '_id') {
        sanitizedPath = 'id';
    } else {
        sanitizedPath = incomingPath.replace(/__/g, '.');
    }
    let paths = [];
    const { slug } = collectionConfig || globalConfig;
    if (globalConfig && !policies.globals[slug]) {
        // eslint-disable-next-line no-param-reassign
        globalConfig.fields = fields;
        // eslint-disable-next-line no-param-reassign
        policies.globals[slug] = await (0, _getEntityPolicies.getEntityPolicies)({
            entity: globalConfig,
            operations: [
                'read'
            ],
            req,
            type: 'global'
        });
    }
    if (sanitizedPath !== 'id') {
        paths = await (0, _getLocalizedPaths.getLocalizedPaths)({
            collectionSlug: collectionConfig?.slug,
            fields,
            globalSlug: globalConfig?.slug,
            incomingPath: sanitizedPath,
            locale: req.locale,
            overrideAccess,
            payload: req.payload
        });
    }
    const promises = [];
    // Sanitize relation.otherRelation.id to relation.otherRelation
    if (paths.at(-1)?.path === 'id') {
        const previousField = paths.at(-2)?.field;
        if (previousField && (previousField.type === 'relationship' || previousField.type === 'upload') && typeof previousField.relationTo === 'string') {
            paths.pop();
        }
    }
    promises.push(...paths.map(async ({ collectionSlug, field, invalid, path }, i)=>{
        if (invalid) {
            errors.push({
                path
            });
            return;
        }
        if (!overrideAccess && (0, _types.fieldAffectsData)(field)) {
            if (collectionSlug) {
                if (!policies.collections[collectionSlug]) {
                    // eslint-disable-next-line no-param-reassign
                    policies.collections[collectionSlug] = await (0, _getEntityPolicies.getEntityPolicies)({
                        entity: req.payload.collections[collectionSlug].config,
                        operations: [
                            'read'
                        ],
                        req,
                        type: 'collection'
                    });
                }
                if ([
                    'hash',
                    'salt'
                ].includes(incomingPath) && collectionConfig.auth && !collectionConfig.auth?.disableLocalStrategy) {
                    errors.push({
                        path: incomingPath
                    });
                }
            }
            let fieldPath = path;
            // remove locale from end of path
            if (path.endsWith(`.${req.locale}`)) {
                fieldPath = path.slice(0, -(req.locale.length + 1));
            }
            // remove ".value" from ends of polymorphic relationship paths
            if (field.type === 'relationship' && Array.isArray(field.relationTo)) {
                fieldPath = fieldPath.replace('.value', '');
            }
            const entityType = globalConfig ? 'globals' : 'collections';
            const entitySlug = collectionSlug || globalConfig.slug;
            const segments = fieldPath.split('.');
            let fieldAccess;
            if (versionFields) {
                fieldAccess = policies[entityType][entitySlug];
                if (segments[0] === 'parent' || segments[0] === 'version') {
                    segments.shift();
                }
            } else {
                fieldAccess = policies[entityType][entitySlug].fields;
            }
            segments.forEach((segment)=>{
                if (fieldAccess[segment]) {
                    if ('fields' in fieldAccess[segment]) {
                        fieldAccess = fieldAccess[segment].fields;
                    } else if ('blocks' in fieldAccess[segment]) {
                        fieldAccess = fieldAccess[segment];
                    } else {
                        fieldAccess = fieldAccess[segment];
                    }
                }
            });
            if (!fieldAccess?.read?.permission) {
                errors.push({
                    path: fieldPath
                });
            }
        }
        if (i > 1) {
            // Remove top collection and reverse array
            // to work backwards from top
            const pathsToQuery = paths.slice(1).reverse();
            pathsToQuery.forEach(({ collectionSlug: pathCollectionSlug, path: subPath }, pathToQueryIndex)=>{
                // On the "deepest" collection,
                // validate query of the relationship
                if (pathToQueryIndex === 0) {
                    promises.push((0, _validateQueryPaths.validateQueryPaths)({
                        collectionConfig: req.payload.collections[pathCollectionSlug].config,
                        errors,
                        globalConfig: undefined,
                        overrideAccess,
                        policies,
                        req,
                        where: {
                            [subPath]: {
                                [operator]: val
                            }
                        }
                    }));
                }
            });
        }
    }));
    await Promise.all(promises);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kYXRhYmFzZS9xdWVyeVZhbGlkYXRpb24vdmFsaWRhdGVTZWFyY2hQYXJhbXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBTYW5pdGl6ZWRDb2xsZWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29sbGVjdGlvbnMvY29uZmlnL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBQYXlsb2FkUmVxdWVzdCB9IGZyb20gJy4uLy4uL2V4cHJlc3MvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEZpZWxkIH0gZnJvbSAnLi4vLi4vZmllbGRzL2NvbmZpZy90eXBlcydcbmltcG9ydCB0eXBlIHsgU2FuaXRpemVkR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vLi4vZ2xvYmFscy9jb25maWcvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEVudGl0eVBvbGljaWVzLCBQYXRoVG9RdWVyeSB9IGZyb20gJy4vdHlwZXMnXG5cbmltcG9ydCB7IGZpZWxkQWZmZWN0c0RhdGEgfSBmcm9tICcuLi8uLi9maWVsZHMvY29uZmlnL3R5cGVzJ1xuaW1wb3J0IHsgZ2V0RW50aXR5UG9saWNpZXMgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvZ2V0RW50aXR5UG9saWNpZXMnXG5pbXBvcnQgeyBnZXRMb2NhbGl6ZWRQYXRocyB9IGZyb20gJy4uL2dldExvY2FsaXplZFBhdGhzJ1xuaW1wb3J0IHsgdmFsaWRhdGVRdWVyeVBhdGhzIH0gZnJvbSAnLi92YWxpZGF0ZVF1ZXJ5UGF0aHMnXG5cbnR5cGUgQXJncyA9IHtcbiAgY29sbGVjdGlvbkNvbmZpZz86IFNhbml0aXplZENvbGxlY3Rpb25Db25maWdcbiAgZXJyb3JzOiB7IHBhdGg6IHN0cmluZyB9W11cbiAgZmllbGRzOiBGaWVsZFtdXG4gIGdsb2JhbENvbmZpZz86IFNhbml0aXplZEdsb2JhbENvbmZpZ1xuICBvcGVyYXRvcjogc3RyaW5nXG4gIG92ZXJyaWRlQWNjZXNzOiBib29sZWFuXG4gIHBhdGg6IHN0cmluZ1xuICBwb2xpY2llczogRW50aXR5UG9saWNpZXNcbiAgcmVxOiBQYXlsb2FkUmVxdWVzdFxuICB2YWw6IHVua25vd25cbiAgdmVyc2lvbkZpZWxkcz86IEZpZWxkW11cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGUgUGF5bG9hZCBrZXkgLyB2YWx1ZSAvIG9wZXJhdG9yXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YWxpZGF0ZVNlYXJjaFBhcmFtKHtcbiAgY29sbGVjdGlvbkNvbmZpZyxcbiAgZXJyb3JzLFxuICBmaWVsZHMsXG4gIGdsb2JhbENvbmZpZyxcbiAgb3BlcmF0b3IsXG4gIG92ZXJyaWRlQWNjZXNzLFxuICBwYXRoOiBpbmNvbWluZ1BhdGgsXG4gIHBvbGljaWVzLFxuICByZXEsXG4gIHZhbCxcbiAgdmVyc2lvbkZpZWxkcyxcbn06IEFyZ3MpOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8gUmVwbGFjZSBHcmFwaFFMIG5lc3RlZCBmaWVsZCBkb3VibGUgdW5kZXJzY29yZSBmb3JtYXR0aW5nXG4gIGxldCBzYW5pdGl6ZWRQYXRoXG4gIGlmIChpbmNvbWluZ1BhdGggPT09ICdfaWQnKSB7XG4gICAgc2FuaXRpemVkUGF0aCA9ICdpZCdcbiAgfSBlbHNlIHtcbiAgICBzYW5pdGl6ZWRQYXRoID0gaW5jb21pbmdQYXRoLnJlcGxhY2UoL19fL2csICcuJylcbiAgfVxuICBsZXQgcGF0aHM6IFBhdGhUb1F1ZXJ5W10gPSBbXVxuICBjb25zdCB7IHNsdWcgfSA9IGNvbGxlY3Rpb25Db25maWcgfHwgZ2xvYmFsQ29uZmlnXG5cbiAgaWYgKGdsb2JhbENvbmZpZyAmJiAhcG9saWNpZXMuZ2xvYmFsc1tzbHVnXSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgIGdsb2JhbENvbmZpZy5maWVsZHMgPSBmaWVsZHNcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgIHBvbGljaWVzLmdsb2JhbHNbc2x1Z10gPSBhd2FpdCBnZXRFbnRpdHlQb2xpY2llcyh7XG4gICAgICBlbnRpdHk6IGdsb2JhbENvbmZpZyxcbiAgICAgIG9wZXJhdGlvbnM6IFsncmVhZCddLFxuICAgICAgcmVxLFxuICAgICAgdHlwZTogJ2dsb2JhbCcsXG4gICAgfSlcbiAgfVxuXG4gIGlmIChzYW5pdGl6ZWRQYXRoICE9PSAnaWQnKSB7XG4gICAgcGF0aHMgPSBhd2FpdCBnZXRMb2NhbGl6ZWRQYXRocyh7XG4gICAgICBjb2xsZWN0aW9uU2x1ZzogY29sbGVjdGlvbkNvbmZpZz8uc2x1ZyxcbiAgICAgIGZpZWxkcyxcbiAgICAgIGdsb2JhbFNsdWc6IGdsb2JhbENvbmZpZz8uc2x1ZyxcbiAgICAgIGluY29taW5nUGF0aDogc2FuaXRpemVkUGF0aCxcbiAgICAgIGxvY2FsZTogcmVxLmxvY2FsZSxcbiAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgcGF5bG9hZDogcmVxLnBheWxvYWQsXG4gICAgfSlcbiAgfVxuICBjb25zdCBwcm9taXNlcyA9IFtdXG5cbiAgLy8gU2FuaXRpemUgcmVsYXRpb24ub3RoZXJSZWxhdGlvbi5pZCB0byByZWxhdGlvbi5vdGhlclJlbGF0aW9uXG4gIGlmIChwYXRocy5hdCgtMSk/LnBhdGggPT09ICdpZCcpIHtcbiAgICBjb25zdCBwcmV2aW91c0ZpZWxkID0gcGF0aHMuYXQoLTIpPy5maWVsZFxuICAgIGlmIChcbiAgICAgIHByZXZpb3VzRmllbGQgJiZcbiAgICAgIChwcmV2aW91c0ZpZWxkLnR5cGUgPT09ICdyZWxhdGlvbnNoaXAnIHx8IHByZXZpb3VzRmllbGQudHlwZSA9PT0gJ3VwbG9hZCcpICYmXG4gICAgICB0eXBlb2YgcHJldmlvdXNGaWVsZC5yZWxhdGlvblRvID09PSAnc3RyaW5nJ1xuICAgICkge1xuICAgICAgcGF0aHMucG9wKClcbiAgICB9XG4gIH1cblxuICBwcm9taXNlcy5wdXNoKFxuICAgIC4uLnBhdGhzLm1hcChhc3luYyAoeyBjb2xsZWN0aW9uU2x1ZywgZmllbGQsIGludmFsaWQsIHBhdGggfSwgaSkgPT4ge1xuICAgICAgaWYgKGludmFsaWQpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goeyBwYXRoIH0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAoIW92ZXJyaWRlQWNjZXNzICYmIGZpZWxkQWZmZWN0c0RhdGEoZmllbGQpKSB7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uU2x1Zykge1xuICAgICAgICAgIGlmICghcG9saWNpZXMuY29sbGVjdGlvbnNbY29sbGVjdGlvblNsdWddKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICAgIHBvbGljaWVzLmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25TbHVnXSA9IGF3YWl0IGdldEVudGl0eVBvbGljaWVzKHtcbiAgICAgICAgICAgICAgZW50aXR5OiByZXEucGF5bG9hZC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uU2x1Z10uY29uZmlnLFxuICAgICAgICAgICAgICBvcGVyYXRpb25zOiBbJ3JlYWQnXSxcbiAgICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgICB0eXBlOiAnY29sbGVjdGlvbicsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIFsnaGFzaCcsICdzYWx0J10uaW5jbHVkZXMoaW5jb21pbmdQYXRoKSAmJlxuICAgICAgICAgICAgY29sbGVjdGlvbkNvbmZpZy5hdXRoICYmXG4gICAgICAgICAgICAhY29sbGVjdGlvbkNvbmZpZy5hdXRoPy5kaXNhYmxlTG9jYWxTdHJhdGVneVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goeyBwYXRoOiBpbmNvbWluZ1BhdGggfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGZpZWxkUGF0aCA9IHBhdGhcbiAgICAgICAgLy8gcmVtb3ZlIGxvY2FsZSBmcm9tIGVuZCBvZiBwYXRoXG4gICAgICAgIGlmIChwYXRoLmVuZHNXaXRoKGAuJHtyZXEubG9jYWxlfWApKSB7XG4gICAgICAgICAgZmllbGRQYXRoID0gcGF0aC5zbGljZSgwLCAtKHJlcS5sb2NhbGUubGVuZ3RoICsgMSkpXG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlIFwiLnZhbHVlXCIgZnJvbSBlbmRzIG9mIHBvbHltb3JwaGljIHJlbGF0aW9uc2hpcCBwYXRoc1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ3JlbGF0aW9uc2hpcCcgJiYgQXJyYXkuaXNBcnJheShmaWVsZC5yZWxhdGlvblRvKSkge1xuICAgICAgICAgIGZpZWxkUGF0aCA9IGZpZWxkUGF0aC5yZXBsYWNlKCcudmFsdWUnLCAnJylcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVudGl0eVR5cGU6ICdjb2xsZWN0aW9ucycgfCAnZ2xvYmFscycgPSBnbG9iYWxDb25maWcgPyAnZ2xvYmFscycgOiAnY29sbGVjdGlvbnMnXG4gICAgICAgIGNvbnN0IGVudGl0eVNsdWcgPSBjb2xsZWN0aW9uU2x1ZyB8fCBnbG9iYWxDb25maWcuc2x1Z1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGZpZWxkUGF0aC5zcGxpdCgnLicpXG5cbiAgICAgICAgbGV0IGZpZWxkQWNjZXNzXG4gICAgICAgIGlmICh2ZXJzaW9uRmllbGRzKSB7XG4gICAgICAgICAgZmllbGRBY2Nlc3MgPSBwb2xpY2llc1tlbnRpdHlUeXBlXVtlbnRpdHlTbHVnXVxuICAgICAgICAgIGlmIChzZWdtZW50c1swXSA9PT0gJ3BhcmVudCcgfHwgc2VnbWVudHNbMF0gPT09ICd2ZXJzaW9uJykge1xuICAgICAgICAgICAgc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmaWVsZEFjY2VzcyA9IHBvbGljaWVzW2VudGl0eVR5cGVdW2VudGl0eVNsdWddLmZpZWxkc1xuICAgICAgICB9XG5cbiAgICAgICAgc2VnbWVudHMuZm9yRWFjaCgoc2VnbWVudCkgPT4ge1xuICAgICAgICAgIGlmIChmaWVsZEFjY2Vzc1tzZWdtZW50XSkge1xuICAgICAgICAgICAgaWYgKCdmaWVsZHMnIGluIGZpZWxkQWNjZXNzW3NlZ21lbnRdKSB7XG4gICAgICAgICAgICAgIGZpZWxkQWNjZXNzID0gZmllbGRBY2Nlc3Nbc2VnbWVudF0uZmllbGRzXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCdibG9ja3MnIGluIGZpZWxkQWNjZXNzW3NlZ21lbnRdKSB7XG4gICAgICAgICAgICAgIGZpZWxkQWNjZXNzID0gZmllbGRBY2Nlc3Nbc2VnbWVudF1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZpZWxkQWNjZXNzID0gZmllbGRBY2Nlc3Nbc2VnbWVudF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCFmaWVsZEFjY2Vzcz8ucmVhZD8ucGVybWlzc2lvbikge1xuICAgICAgICAgIGVycm9ycy5wdXNoKHsgcGF0aDogZmllbGRQYXRoIH0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGkgPiAxKSB7XG4gICAgICAgIC8vIFJlbW92ZSB0b3AgY29sbGVjdGlvbiBhbmQgcmV2ZXJzZSBhcnJheVxuICAgICAgICAvLyB0byB3b3JrIGJhY2t3YXJkcyBmcm9tIHRvcFxuICAgICAgICBjb25zdCBwYXRoc1RvUXVlcnkgPSBwYXRocy5zbGljZSgxKS5yZXZlcnNlKClcblxuICAgICAgICBwYXRoc1RvUXVlcnkuZm9yRWFjaChcbiAgICAgICAgICAoeyBjb2xsZWN0aW9uU2x1ZzogcGF0aENvbGxlY3Rpb25TbHVnLCBwYXRoOiBzdWJQYXRoIH0sIHBhdGhUb1F1ZXJ5SW5kZXgpID0+IHtcbiAgICAgICAgICAgIC8vIE9uIHRoZSBcImRlZXBlc3RcIiBjb2xsZWN0aW9uLFxuICAgICAgICAgICAgLy8gdmFsaWRhdGUgcXVlcnkgb2YgdGhlIHJlbGF0aW9uc2hpcFxuICAgICAgICAgICAgaWYgKHBhdGhUb1F1ZXJ5SW5kZXggPT09IDApIHtcbiAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVF1ZXJ5UGF0aHMoe1xuICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbkNvbmZpZzogcmVxLnBheWxvYWQuY29sbGVjdGlvbnNbcGF0aENvbGxlY3Rpb25TbHVnXS5jb25maWcsXG4gICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICBnbG9iYWxDb25maWc6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgIG92ZXJyaWRlQWNjZXNzLFxuICAgICAgICAgICAgICAgICAgcG9saWNpZXMsXG4gICAgICAgICAgICAgICAgICByZXEsXG4gICAgICAgICAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgICAgICAgICBbc3ViUGF0aF06IHtcbiAgICAgICAgICAgICAgICAgICAgICBbb3BlcmF0b3JdOiB2YWwsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH0pLFxuICApXG4gIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxufVxuIl0sIm5hbWVzIjpbInZhbGlkYXRlU2VhcmNoUGFyYW0iLCJjb2xsZWN0aW9uQ29uZmlnIiwiZXJyb3JzIiwiZmllbGRzIiwiZ2xvYmFsQ29uZmlnIiwib3BlcmF0b3IiLCJvdmVycmlkZUFjY2VzcyIsInBhdGgiLCJpbmNvbWluZ1BhdGgiLCJwb2xpY2llcyIsInJlcSIsInZhbCIsInZlcnNpb25GaWVsZHMiLCJzYW5pdGl6ZWRQYXRoIiwicmVwbGFjZSIsInBhdGhzIiwic2x1ZyIsImdsb2JhbHMiLCJnZXRFbnRpdHlQb2xpY2llcyIsImVudGl0eSIsIm9wZXJhdGlvbnMiLCJ0eXBlIiwiZ2V0TG9jYWxpemVkUGF0aHMiLCJjb2xsZWN0aW9uU2x1ZyIsImdsb2JhbFNsdWciLCJsb2NhbGUiLCJwYXlsb2FkIiwicHJvbWlzZXMiLCJhdCIsInByZXZpb3VzRmllbGQiLCJmaWVsZCIsInJlbGF0aW9uVG8iLCJwb3AiLCJwdXNoIiwibWFwIiwiaW52YWxpZCIsImkiLCJmaWVsZEFmZmVjdHNEYXRhIiwiY29sbGVjdGlvbnMiLCJjb25maWciLCJpbmNsdWRlcyIsImF1dGgiLCJkaXNhYmxlTG9jYWxTdHJhdGVneSIsImZpZWxkUGF0aCIsImVuZHNXaXRoIiwic2xpY2UiLCJsZW5ndGgiLCJBcnJheSIsImlzQXJyYXkiLCJlbnRpdHlUeXBlIiwiZW50aXR5U2x1ZyIsInNlZ21lbnRzIiwic3BsaXQiLCJmaWVsZEFjY2VzcyIsInNoaWZ0IiwiZm9yRWFjaCIsInNlZ21lbnQiLCJyZWFkIiwicGVybWlzc2lvbiIsInBhdGhzVG9RdWVyeSIsInJldmVyc2UiLCJwYXRoQ29sbGVjdGlvblNsdWciLCJzdWJQYXRoIiwicGF0aFRvUXVlcnlJbmRleCIsInZhbGlkYXRlUXVlcnlQYXRocyIsInVuZGVmaW5lZCIsIndoZXJlIiwiUHJvbWlzZSIsImFsbCJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJtYXBwaW5ncyI6Ijs7OzsrQkE0QnNCQTs7O2VBQUFBOzs7dUJBdEJXO21DQUNDO21DQUNBO29DQUNDO0FBbUI1QixlQUFlQSxvQkFBb0IsRUFDeENDLGdCQUFnQixFQUNoQkMsTUFBTSxFQUNOQyxNQUFNLEVBQ05DLFlBQVksRUFDWkMsUUFBUSxFQUNSQyxjQUFjLEVBQ2RDLE1BQU1DLFlBQVks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