"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    array: function() {
        return array;
    },
    blocks: function() {
        return blocks;
    },
    checkbox: function() {
        return checkbox;
    },
    code: function() {
        return code;
    },
    date: function() {
        return date;
    },
    default: function() {
        return _default;
    },
    email: function() {
        return email;
    },
    json: function() {
        return json;
    },
    number: function() {
        return number;
    },
    password: function() {
        return password;
    },
    point: function() {
        return point;
    },
    radio: function() {
        return radio;
    },
    relationship: function() {
        return relationship;
    },
    richText: function() {
        return richText;
    },
    select: function() {
        return select;
    },
    text: function() {
        return text;
    },
    textarea: function() {
        return textarea;
    },
    upload: function() {
        return upload;
    }
});
const _ajv = /*#__PURE__*/ _interop_require_default(require("ajv"));
const _bsonobjectid = /*#__PURE__*/ _interop_require_default(require("bson-objectid"));
const _canUseDOM = /*#__PURE__*/ _interop_require_default(require("../utilities/canUseDOM"));
const _getIDType = require("../utilities/getIDType");
const _isNumber = require("../utilities/isNumber");
const _isValidID = require("../utilities/isValidID");
const _types = require("./config/types");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const text = (value, { config, hasMany, maxLength: fieldMaxLength, maxRows, minLength, minRows, required, t })=>{
    let maxLength;
    if (!required) {
        if (!value) return true;
    }
    if (hasMany === true) {
        const lengthValidationResult = validateArrayLength(value, {
            maxRows,
            minRows,
            required,
            t
        });
        if (typeof lengthValidationResult === 'string') return lengthValidationResult;
    }
    if (typeof config?.defaultMaxTextLength === 'number') maxLength = config.defaultMaxTextLength;
    if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;
    const stringsToValidate = Array.isArray(value) ? value : [
        value
    ];
    for (const stringValue of stringsToValidate){
        const length = stringValue?.length || 0;
        if (typeof maxLength === 'number' && length > maxLength) {
            return t('validation:shorterThanMax', {
                label: t('value'),
                maxLength,
                stringValue
            });
        }
        if (typeof minLength === 'number' && length < minLength) {
            return t('validation:longerThanMin', {
                label: t('value'),
                minLength,
                stringValue
            });
        }
    }
    if (required) {
        if (!(typeof value === 'string' || Array.isArray(value)) || value?.length === 0) {
            return t('validation:required');
        }
    }
    return true;
};
const password = (value, { config, maxLength: fieldMaxLength, minLength, payload, required, t })=>{
    let maxLength;
    if (typeof config?.defaultMaxTextLength === 'number') maxLength = config.defaultMaxTextLength;
    if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;
    if (value && maxLength && value.length > maxLength) {
        return t('validation:shorterThanMax', {
            maxLength
        });
    }
    if (value && minLength && value.length < minLength) {
        return t('validation:longerThanMin', {
            minLength
        });
    }
    if (required && !value) {
        return t('validation:required');
    }
    return true;
};
const email = (value, { required, t })=>{
    if (value && !/\S[^\s@]*@\S+\.\S+/.test(value) || !value && required) {
        return t('validation:emailAddress');
    }
    return true;
};
const textarea = (value, { config, maxLength: fieldMaxLength, minLength, payload, required, t })=>{
    let maxLength;
    if (typeof config?.defaultMaxTextLength === 'number') maxLength = config.defaultMaxTextLength;
    if (typeof fieldMaxLength === 'number') maxLength = fieldMaxLength;
    if (value && maxLength && value.length > maxLength) {
        return t('validation:shorterThanMax', {
            maxLength
        });
    }
    if (value && minLength && value.length < minLength) {
        return t('validation:longerThanMin', {
            minLength
        });
    }
    if (required && !value) {
        return t('validation:required');
    }
    return true;
};
const code = (value, { required, t })=>{
    if (required && value === undefined) {
        return t('validation:required');
    }
    return true;
};
const json = async (value, { jsonError, jsonSchema, required, t })=>{
    if (required && !value) {
        return t('validation:required');
    }
    if (jsonError !== undefined) {
        return t('validation:invalidInput');
    }
    const isNotEmpty = (value)=>{
        if (value === undefined || value === null) {
            return false;
        }
        if (Array.isArray(value) && value.length === 0) {
            return false;
        }
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            return false;
        }
        return true;
    };
    const fetchSchema = ({ schema, uri })=>{
        if (uri && schema) return schema;
        return fetch(uri).then((response)=>{
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then((json)=>{
            const jsonSchemaSanitizations = {
                id: undefined,
                $id: json.id,
                $schema: 'http://json-schema.org/draft-07/schema#'
            };
            return Object.assign(json, jsonSchemaSanitizations);
        });
    };
    if (!_canUseDOM.default && jsonSchema && isNotEmpty(value)) {
        try {
            jsonSchema.schema = await fetchSchema(jsonSchema);
            const { schema } = jsonSchema;
            const ajv = new _ajv.default();
            if (!ajv.validate(schema, value)) {
                return t(ajv.errorsText());
            }
        } catch (error) {
            return t(error.message);
        }
    }
    return true;
};
const checkbox = (value, { required, t })=>{
    if (value && typeof value !== 'boolean' || required && typeof value !== 'boolean') {
        return t('validation:trueOrFalse');
    }
    return true;
};
const date = (value, { required, t })=>{
    if (value instanceof Date) {
        return true;
    }
    if (value && !isNaN(Date.parse(value.toString()))) {
        /* eslint-disable-line */ return true;
    }
    if (value) {
        return t('validation:notValidDate', {
            value
        });
    }
    if (required) {
        return t('validation:required');
    }
    return true;
};
const richText = async (value, options)=>{
    const editor = options?.editor;
    return await editor.validate(value, options);
};
const validateArrayLength = (value, options)=>{
    const { maxRows, minRows, required, t } = options;
    const arrayLength = Array.isArray(value) ? value.length : 0;
    if (!required && arrayLength === 0) return true;
    if (minRows && arrayLength < minRows) {
        return t('validation:requiresAtLeast', {
            count: minRows,
            label: t('rows')
        });
    }
    if (maxRows && arrayLength > maxRows) {
        return t('validation:requiresNoMoreThan', {
            count: maxRows,
            label: t('rows')
        });
    }
    if (required && !arrayLength) {
        return t('validation:requiresAtLeast', {
            count: 1,
            label: t('row')
        });
    }
    return true;
};
const number = (value, { hasMany, max, maxRows, min, minRows, required, t })=>{
    if (hasMany === true) {
        const lengthValidationResult = validateArrayLength(value, {
            maxRows,
            minRows,
            required,
            t
        });
        if (typeof lengthValidationResult === 'string') return lengthValidationResult;
    }
    if (!value && !(0, _isNumber.isNumber)(value)) {
        // if no value is present, validate based on required
        if (required) return t('validation:required');
        if (!required) return true;
    }
    const numbersToValidate = Array.isArray(value) ? value : [
        value
    ];
    for (const number of numbersToValidate){
        if (!(0, _isNumber.isNumber)(number)) return t('validation:enterNumber');
        const numberValue = parseFloat(number);
        if (typeof max === 'number' && numberValue > max) {
            return t('validation:greaterThanMax', {
                label: t('value'),
                max,
                value
            });
        }
        if (typeof min === 'number' && numberValue < min) {
            return t('validation:lessThanMin', {
                label: t('value'),
                min,
                value
            });
        }
    }
    return true;
};
const array = (value, { maxRows, minRows, required, t })=>{
    return validateArrayLength(value, {
        maxRows,
        minRows,
        required,
        t
    });
};
const blocks = (value, { maxRows, minRows, required, t })=>{
    return validateArrayLength(value, {
        maxRows,
        minRows,
        required,
        t
    });
};
const validateFilterOptions = async (value, { id, data, filterOptions, payload, relationTo, req, siblingData, t, user })=>{
    if (!_canUseDOM.default && typeof filterOptions !== 'undefined' && value) {
        const options = {};
        const falseCollections = [];
        const collections = typeof relationTo === 'string' ? [
            relationTo
        ] : relationTo;
        const values = Array.isArray(value) ? value : [
            value
        ];
        await Promise.all(collections.map(async (collection)=>{
            try {
                let optionFilter = typeof filterOptions === 'function' ? await filterOptions({
                    id,
                    data,
                    relationTo: collection,
                    siblingData,
                    user
                }) : filterOptions;
                if (optionFilter === true) {
                    optionFilter = null;
                }
                const valueIDs = [];
                values.forEach((val)=>{
                    if (typeof val === 'object') {
                        if (val?.value) {
                            valueIDs.push(val.value);
                        } else if (_bsonobjectid.default.isValid(val)) {
                            valueIDs.push(new _bsonobjectid.default(val).toHexString());
                        }
                    }
                    if (typeof val === 'string' || typeof val === 'number') {
                        valueIDs.push(val);
                    }
                });
                if (valueIDs.length > 0) {
                    const findWhere = {
                        and: [
                            {
                                id: {
                                    in: valueIDs
                                }
                            }
                        ]
                    };
                    if (optionFilter) findWhere.and.push(optionFilter);
                    if (optionFilter === false) {
                        falseCollections.push(optionFilter);
                    }
                    const result = await payload.find({
                        collection,
                        depth: 0,
                        limit: 0,
                        pagination: false,
                        req,
                        where: findWhere
                    });
                    options[collection] = result.docs.map((doc)=>doc.id);
                } else {
                    options[collection] = [];
                }
            } catch (err) {
                req.payload.logger.error({
                    err,
                    msg: `Error validating filter options for collection ${collection}`
                });
                options[collection] = [];
            }
        }));
        const invalidRelationships = values.filter((val)=>{
            let collection;
            let requestedID;
            if (typeof relationTo === 'string') {
                collection = relationTo;
                if (typeof val === 'string' || typeof val === 'number') {
                    requestedID = val;
                }
                if (typeof val === 'object' && _bsonobjectid.default.isValid(val)) {
                    requestedID = new _bsonobjectid.default(val).toHexString();
                }
            }
            if (Array.isArray(relationTo) && typeof val === 'object' && val?.relationTo) {
                collection = val.relationTo;
                requestedID = val.value;
            }
            if (falseCollections.find((slug)=>relationTo === slug)) {
                return true;
            }
            return options[collection].indexOf(requestedID) === -1;
        });
        if (invalidRelationships.length > 0) {
            return invalidRelationships.reduce((err, invalid, i)=>{
                return `${err} ${JSON.stringify(invalid)}${invalidRelationships.length === i + 1 ? ',' : ''} `;
            }, t('validation:invalidSelections'));
        }
        return true;
    }
    return true;
};
const upload = (value, options)=>{
    if (!value && options.required) {
        return options.t('validation:required');
    }
    if (!_canUseDOM.default && typeof value !== 'undefined' && value !== null) {
        const idField = options?.config?.collections?.find((collection)=>collection.slug === options.relationTo)?.fields?.find((field)=>(0, _types.fieldAffectsData)(field) && field.name === 'id');
        const type = (0, _getIDType.getIDType)(idField, options?.payload?.db?.defaultIDType);
        if (!(0, _isValidID.isValidID)(value, type)) {
            return options.t('validation:validUploadID');
        }
    }
    return validateFilterOptions(value, options);
};
const relationship = async (value, options)=>{
    const { config, maxRows, minRows, payload, relationTo, required, t } = options;
    if ((!value || Array.isArray(value) && value.length === 0) && required) {
        return t('validation:required');
    }
    if (Array.isArray(value) && value.length > 0) {
        if (minRows && value.length < minRows) {
            return t('validation:lessThanMin', {
                label: t('rows'),
                min: minRows,
                value: value.length
            });
        }
        if (maxRows && value.length > maxRows) {
            return t('validation:greaterThanMax', {
                label: t('rows'),
                max: maxRows,
                value: value.length
            });
        }
    }
    if (!_canUseDOM.default && typeof value !== 'undefined' && value !== null) {
        const values = Array.isArray(value) ? value : [
            value
        ];
        const invalidRelationships = values.filter((val)=>{
            let collectionSlug;
            let requestedID;
            if (typeof relationTo === 'string') {
                collectionSlug = relationTo;
                // custom id
                if (val) {
                    requestedID = val;
                }
            }
            if (Array.isArray(relationTo) && typeof val === 'object' && val?.relationTo) {
                collectionSlug = val.relationTo;
                requestedID = val.value;
            }
            if (requestedID === null) return false;
            const idField = config?.collections?.find((collection)=>collection.slug === collectionSlug)?.fields?.find((field)=>(0, _types.fieldAffectsData)(field) && field.name === 'id');
            const type = (0, _getIDType.getIDType)(idField, payload?.db?.defaultIDType);
            return !(0, _isValidID.isValidID)(requestedID, type);
        });
        if (invalidRelationships.length > 0) {
            return `This relationship field has the following invalid relationships: ${invalidRelationships.map((err, invalid)=>{
                return `${err} ${JSON.stringify(invalid)}`;
            }).join(', ')}`;
        }
    }
    return validateFilterOptions(value, options);
};
const select = (value, { hasMany, options, required, t })=>{
    if (Array.isArray(value) && value.some((input)=>!options.some((option)=>option === input || typeof option !== 'string' && option?.value === input))) {
        return t('validation:invalidSelection');
    }
    if (typeof value === 'string' && !options.some((option)=>option === value || typeof option !== 'string' && option.value === value)) {
        return t('validation:invalidSelection');
    }
    if (required && (typeof value === 'undefined' || value === null || hasMany && Array.isArray(value) && value?.length === 0)) {
        return t('validation:required');
    }
    return true;
};
const radio = (value, { options, required, t })=>{
    if (value) {
        const valueMatchesOption = options.some((option)=>option === value || typeof option !== 'string' && option.value === value);
        return valueMatchesOption || t('validation:invalidSelection');
    }
    return required ? t('validation:required') : true;
};
const point = (value = [
    '',
    ''
], { required, t })=>{
    const lng = parseFloat(String(value[0]));
    const lat = parseFloat(String(value[1]));
    if (required && (value[0] && value[1] && typeof lng !== 'number' && typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat) || Array.isArray(value) && value.length !== 2)) {
        return t('validation:requiresTwoNumbers');
    }
    if (value[1] && Number.isNaN(lng) || value[0] && Number.isNaN(lat)) {
        return t('validation:invalidInput');
    }
    return true;
};
const _default = {
    array,
    blocks,
    checkbox,
    code,
    date,
    email,
    json,
    number,
    password,
    point,
    radio,
    relationship,
    richText,
    select,
    text,
    textarea,
    upload
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9maWVsZHMvdmFsaWRhdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEFqdiBmcm9tICdhanYnXG5pbXBvcnQgT2JqZWN0SUQgZnJvbSAnYnNvbi1vYmplY3RpZCdcblxuaW1wb3J0IHR5cGUgeyBSaWNoVGV4dEFkYXB0ZXIgfSBmcm9tICcuLi9leHBvcnRzL3R5cGVzJ1xuaW1wb3J0IHR5cGUge1xuICBBcnJheUZpZWxkLFxuICBCbG9ja0ZpZWxkLFxuICBDaGVja2JveEZpZWxkLFxuICBDb2RlRmllbGQsXG4gIERhdGVGaWVsZCxcbiAgRW1haWxGaWVsZCxcbiAgSlNPTkZpZWxkLFxuICBOdW1iZXJGaWVsZCxcbiAgUG9pbnRGaWVsZCxcbiAgUmFkaW9GaWVsZCxcbiAgUmVsYXRpb25zaGlwRmllbGQsXG4gIFJlbGF0aW9uc2hpcFZhbHVlLFxuICBSaWNoVGV4dEZpZWxkLFxuICBTZWxlY3RGaWVsZCxcbiAgVGV4dEZpZWxkLFxuICBUZXh0YXJlYUZpZWxkLFxuICBVcGxvYWRGaWVsZCxcbiAgVmFsaWRhdGUsXG59IGZyb20gJy4vY29uZmlnL3R5cGVzJ1xuXG5pbXBvcnQgY2FuVXNlRE9NIGZyb20gJy4uL3V0aWxpdGllcy9jYW5Vc2VET00nXG5pbXBvcnQgeyBnZXRJRFR5cGUgfSBmcm9tICcuLi91dGlsaXRpZXMvZ2V0SURUeXBlJ1xuaW1wb3J0IHsgaXNOdW1iZXIgfSBmcm9tICcuLi91dGlsaXRpZXMvaXNOdW1iZXInXG5pbXBvcnQgeyBpc1ZhbGlkSUQgfSBmcm9tICcuLi91dGlsaXRpZXMvaXNWYWxpZElEJ1xuaW1wb3J0IHsgZmllbGRBZmZlY3RzRGF0YSB9IGZyb20gJy4vY29uZmlnL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgdGV4dDogVmFsaWRhdGU8dW5rbm93biwgdW5rbm93biwgVGV4dEZpZWxkPiA9IChcbiAgdmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdLFxuICB7IGNvbmZpZywgaGFzTWFueSwgbWF4TGVuZ3RoOiBmaWVsZE1heExlbmd0aCwgbWF4Um93cywgbWluTGVuZ3RoLCBtaW5Sb3dzLCByZXF1aXJlZCwgdCB9LFxuKSA9PiB7XG4gIGxldCBtYXhMZW5ndGg6IG51bWJlclxuXG4gIGlmICghcmVxdWlyZWQpIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgaWYgKGhhc01hbnkgPT09IHRydWUpIHtcbiAgICBjb25zdCBsZW5ndGhWYWxpZGF0aW9uUmVzdWx0ID0gdmFsaWRhdGVBcnJheUxlbmd0aCh2YWx1ZSwgeyBtYXhSb3dzLCBtaW5Sb3dzLCByZXF1aXJlZCwgdCB9KVxuICAgIGlmICh0eXBlb2YgbGVuZ3RoVmFsaWRhdGlvblJlc3VsdCA9PT0gJ3N0cmluZycpIHJldHVybiBsZW5ndGhWYWxpZGF0aW9uUmVzdWx0XG4gIH1cblxuICBpZiAodHlwZW9mIGNvbmZpZz8uZGVmYXVsdE1heFRleHRMZW5ndGggPT09ICdudW1iZXInKSBtYXhMZW5ndGggPSBjb25maWcuZGVmYXVsdE1heFRleHRMZW5ndGhcbiAgaWYgKHR5cGVvZiBmaWVsZE1heExlbmd0aCA9PT0gJ251bWJlcicpIG1heExlbmd0aCA9IGZpZWxkTWF4TGVuZ3RoXG5cbiAgY29uc3Qgc3RyaW5nc1RvVmFsaWRhdGU6IHN0cmluZ1tdID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6IFt2YWx1ZV1cblxuICBmb3IgKGNvbnN0IHN0cmluZ1ZhbHVlIG9mIHN0cmluZ3NUb1ZhbGlkYXRlKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc3RyaW5nVmFsdWU/Lmxlbmd0aCB8fCAwXG5cbiAgICBpZiAodHlwZW9mIG1heExlbmd0aCA9PT0gJ251bWJlcicgJiYgbGVuZ3RoID4gbWF4TGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpzaG9ydGVyVGhhbk1heCcsIHsgbGFiZWw6IHQoJ3ZhbHVlJyksIG1heExlbmd0aCwgc3RyaW5nVmFsdWUgfSlcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1pbkxlbmd0aCA9PT0gJ251bWJlcicgJiYgbGVuZ3RoIDwgbWluTGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpsb25nZXJUaGFuTWluJywgeyBsYWJlbDogdCgndmFsdWUnKSwgbWluTGVuZ3RoLCBzdHJpbmdWYWx1ZSB9KVxuICAgIH1cbiAgfVxuXG4gIGlmIChyZXF1aXJlZCkge1xuICAgIGlmICghKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHx8IHZhbHVlPy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnQgY29uc3QgcGFzc3dvcmQ6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIFRleHRGaWVsZD4gPSAoXG4gIHZhbHVlOiBzdHJpbmcsXG4gIHsgY29uZmlnLCBtYXhMZW5ndGg6IGZpZWxkTWF4TGVuZ3RoLCBtaW5MZW5ndGgsIHBheWxvYWQsIHJlcXVpcmVkLCB0IH0sXG4pID0+IHtcbiAgbGV0IG1heExlbmd0aDogbnVtYmVyXG5cbiAgaWYgKHR5cGVvZiBjb25maWc/LmRlZmF1bHRNYXhUZXh0TGVuZ3RoID09PSAnbnVtYmVyJykgbWF4TGVuZ3RoID0gY29uZmlnLmRlZmF1bHRNYXhUZXh0TGVuZ3RoXG4gIGlmICh0eXBlb2YgZmllbGRNYXhMZW5ndGggPT09ICdudW1iZXInKSBtYXhMZW5ndGggPSBmaWVsZE1heExlbmd0aFxuXG4gIGlmICh2YWx1ZSAmJiBtYXhMZW5ndGggJiYgdmFsdWUubGVuZ3RoID4gbWF4TGVuZ3RoKSB7XG4gICAgcmV0dXJuIHQoJ3ZhbGlkYXRpb246c2hvcnRlclRoYW5NYXgnLCB7IG1heExlbmd0aCB9KVxuICB9XG5cbiAgaWYgKHZhbHVlICYmIG1pbkxlbmd0aCAmJiB2YWx1ZS5sZW5ndGggPCBtaW5MZW5ndGgpIHtcbiAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpsb25nZXJUaGFuTWluJywgeyBtaW5MZW5ndGggfSlcbiAgfVxuXG4gIGlmIChyZXF1aXJlZCAmJiAhdmFsdWUpIHtcbiAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpyZXF1aXJlZCcpXG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnQgY29uc3QgZW1haWw6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIEVtYWlsRmllbGQ+ID0gKHZhbHVlOiBzdHJpbmcsIHsgcmVxdWlyZWQsIHQgfSkgPT4ge1xuICBpZiAoKHZhbHVlICYmICEvXFxTW15cXHNAXSpAXFxTK1xcLlxcUysvLnRlc3QodmFsdWUpKSB8fCAoIXZhbHVlICYmIHJlcXVpcmVkKSkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOmVtYWlsQWRkcmVzcycpXG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIFRleHRhcmVhRmllbGQ+ID0gKFxuICB2YWx1ZTogc3RyaW5nLFxuICB7IGNvbmZpZywgbWF4TGVuZ3RoOiBmaWVsZE1heExlbmd0aCwgbWluTGVuZ3RoLCBwYXlsb2FkLCByZXF1aXJlZCwgdCB9LFxuKSA9PiB7XG4gIGxldCBtYXhMZW5ndGg6IG51bWJlclxuXG4gIGlmICh0eXBlb2YgY29uZmlnPy5kZWZhdWx0TWF4VGV4dExlbmd0aCA9PT0gJ251bWJlcicpIG1heExlbmd0aCA9IGNvbmZpZy5kZWZhdWx0TWF4VGV4dExlbmd0aFxuICBpZiAodHlwZW9mIGZpZWxkTWF4TGVuZ3RoID09PSAnbnVtYmVyJykgbWF4TGVuZ3RoID0gZmllbGRNYXhMZW5ndGhcbiAgaWYgKHZhbHVlICYmIG1heExlbmd0aCAmJiB2YWx1ZS5sZW5ndGggPiBtYXhMZW5ndGgpIHtcbiAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpzaG9ydGVyVGhhbk1heCcsIHsgbWF4TGVuZ3RoIH0pXG4gIH1cblxuICBpZiAodmFsdWUgJiYgbWluTGVuZ3RoICYmIHZhbHVlLmxlbmd0aCA8IG1pbkxlbmd0aCkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOmxvbmdlclRoYW5NaW4nLCB7IG1pbkxlbmd0aCB9KVxuICB9XG5cbiAgaWYgKHJlcXVpcmVkICYmICF2YWx1ZSkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmV4cG9ydCBjb25zdCBjb2RlOiBWYWxpZGF0ZTx1bmtub3duLCB1bmtub3duLCBDb2RlRmllbGQ+ID0gKHZhbHVlOiBzdHJpbmcsIHsgcmVxdWlyZWQsIHQgfSkgPT4ge1xuICBpZiAocmVxdWlyZWQgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmV4cG9ydCBjb25zdCBqc29uOiBWYWxpZGF0ZTx1bmtub3duLCB1bmtub3duLCBKU09ORmllbGQgJiB7IGpzb25FcnJvcj86IHN0cmluZyB9PiA9IGFzeW5jIChcbiAgdmFsdWU6IHN0cmluZyxcbiAgeyBqc29uRXJyb3IsIGpzb25TY2hlbWEsIHJlcXVpcmVkLCB0IH0sXG4pID0+IHtcbiAgaWYgKHJlcXVpcmVkICYmICF2YWx1ZSkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgfVxuXG4gIGlmIChqc29uRXJyb3IgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOmludmFsaWRJbnB1dCcpXG4gIH1cblxuICBjb25zdCBpc05vdEVtcHR5ID0gKHZhbHVlKSA9PiB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBjb25zdCBmZXRjaFNjaGVtYSA9ICh7IHNjaGVtYSwgdXJpIH0pID0+IHtcbiAgICBpZiAodXJpICYmIHNjaGVtYSkgcmV0dXJuIHNjaGVtYVxuICAgIHJldHVybiBmZXRjaCh1cmkpXG4gICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmV0d29yayByZXNwb25zZSB3YXMgbm90IG9rJylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXG4gICAgICB9KVxuICAgICAgLnRoZW4oKGpzb24pID0+IHtcbiAgICAgICAgY29uc3QganNvblNjaGVtYVNhbml0aXphdGlvbnMgPSB7XG4gICAgICAgICAgaWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAkaWQ6IGpzb24uaWQsXG4gICAgICAgICAgJHNjaGVtYTogJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDcvc2NoZW1hIycsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oanNvbiwganNvblNjaGVtYVNhbml0aXphdGlvbnMpXG4gICAgICB9KVxuICB9XG5cbiAgaWYgKCFjYW5Vc2VET00gJiYganNvblNjaGVtYSAmJiBpc05vdEVtcHR5KHZhbHVlKSkge1xuICAgIHRyeSB7XG4gICAgICBqc29uU2NoZW1hLnNjaGVtYSA9IGF3YWl0IGZldGNoU2NoZW1hKGpzb25TY2hlbWEpXG4gICAgICBjb25zdCB7IHNjaGVtYSB9ID0ganNvblNjaGVtYVxuICAgICAgY29uc3QgYWp2ID0gbmV3IEFqdigpXG5cbiAgICAgIGlmICghYWp2LnZhbGlkYXRlKHNjaGVtYSwgdmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB0KGFqdi5lcnJvcnNUZXh0KCkpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiB0KGVycm9yLm1lc3NhZ2UpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZXhwb3J0IGNvbnN0IGNoZWNrYm94OiBWYWxpZGF0ZTx1bmtub3duLCB1bmtub3duLCBDaGVja2JveEZpZWxkPiA9IChcbiAgdmFsdWU6IGJvb2xlYW4sXG4gIHsgcmVxdWlyZWQsIHQgfSxcbikgPT4ge1xuICBpZiAoKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ2Jvb2xlYW4nKSB8fCAocmVxdWlyZWQgJiYgdHlwZW9mIHZhbHVlICE9PSAnYm9vbGVhbicpKSB7XG4gICAgcmV0dXJuIHQoJ3ZhbGlkYXRpb246dHJ1ZU9yRmFsc2UnKVxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZXhwb3J0IGNvbnN0IGRhdGU6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIERhdGVGaWVsZD4gPSAodmFsdWUsIHsgcmVxdWlyZWQsIHQgfSkgPT4ge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGlmICh2YWx1ZSAmJiAhaXNOYU4oRGF0ZS5wYXJzZSh2YWx1ZS50b1N0cmluZygpKSkpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZS1saW5lICovXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGlmICh2YWx1ZSkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOm5vdFZhbGlkRGF0ZScsIHsgdmFsdWUgfSlcbiAgfVxuXG4gIGlmIChyZXF1aXJlZCkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmV4cG9ydCBjb25zdCByaWNoVGV4dDogVmFsaWRhdGU8b2JqZWN0LCB1bmtub3duLCBSaWNoVGV4dEZpZWxkLCBSaWNoVGV4dEZpZWxkPiA9IGFzeW5jIChcbiAgdmFsdWUsXG4gIG9wdGlvbnMsXG4pID0+IHtcbiAgY29uc3QgZWRpdG9yOiBSaWNoVGV4dEFkYXB0ZXIgPSBvcHRpb25zPy5lZGl0b3JcblxuICByZXR1cm4gYXdhaXQgZWRpdG9yLnZhbGlkYXRlKHZhbHVlLCBvcHRpb25zKVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5TGVuZ3RoOiBhbnkgPSAoXG4gIHZhbHVlLFxuICBvcHRpb25zOiB7XG4gICAgbWF4Um93cz86IG51bWJlclxuICAgIG1pblJvd3M/OiBudW1iZXJcbiAgICByZXF1aXJlZD86IGJvb2xlYW5cbiAgICB0OiAoa2V5OiBzdHJpbmcsIG9wdGlvbnM/OiB7IFtrZXk6IHN0cmluZ106IG51bWJlciB8IHN0cmluZyB9KSA9PiBzdHJpbmdcbiAgfSxcbikgPT4ge1xuICBjb25zdCB7IG1heFJvd3MsIG1pblJvd3MsIHJlcXVpcmVkLCB0IH0gPSBvcHRpb25zXG5cbiAgY29uc3QgYXJyYXlMZW5ndGggPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmxlbmd0aCA6IDBcblxuICBpZiAoIXJlcXVpcmVkICYmIGFycmF5TGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZVxuXG4gIGlmIChtaW5Sb3dzICYmIGFycmF5TGVuZ3RoIDwgbWluUm93cykge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVzQXRMZWFzdCcsIHsgY291bnQ6IG1pblJvd3MsIGxhYmVsOiB0KCdyb3dzJykgfSlcbiAgfVxuXG4gIGlmIChtYXhSb3dzICYmIGFycmF5TGVuZ3RoID4gbWF4Um93cykge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVzTm9Nb3JlVGhhbicsIHsgY291bnQ6IG1heFJvd3MsIGxhYmVsOiB0KCdyb3dzJykgfSlcbiAgfVxuXG4gIGlmIChyZXF1aXJlZCAmJiAhYXJyYXlMZW5ndGgpIHtcbiAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpyZXF1aXJlc0F0TGVhc3QnLCB7IGNvdW50OiAxLCBsYWJlbDogdCgncm93JykgfSlcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmV4cG9ydCBjb25zdCBudW1iZXI6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIE51bWJlckZpZWxkPiA9IChcbiAgdmFsdWU6IG51bWJlciB8IG51bWJlcltdLFxuICB7IGhhc01hbnksIG1heCwgbWF4Um93cywgbWluLCBtaW5Sb3dzLCByZXF1aXJlZCwgdCB9LFxuKSA9PiB7XG4gIGlmIChoYXNNYW55ID09PSB0cnVlKSB7XG4gICAgY29uc3QgbGVuZ3RoVmFsaWRhdGlvblJlc3VsdCA9IHZhbGlkYXRlQXJyYXlMZW5ndGgodmFsdWUsIHsgbWF4Um93cywgbWluUm93cywgcmVxdWlyZWQsIHQgfSlcbiAgICBpZiAodHlwZW9mIGxlbmd0aFZhbGlkYXRpb25SZXN1bHQgPT09ICdzdHJpbmcnKSByZXR1cm4gbGVuZ3RoVmFsaWRhdGlvblJlc3VsdFxuICB9XG5cbiAgaWYgKCF2YWx1ZSAmJiAhaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgLy8gaWYgbm8gdmFsdWUgaXMgcHJlc2VudCwgdmFsaWRhdGUgYmFzZWQgb24gcmVxdWlyZWRcbiAgICBpZiAocmVxdWlyZWQpIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgICBpZiAoIXJlcXVpcmVkKSByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgY29uc3QgbnVtYmVyc1RvVmFsaWRhdGU6IG51bWJlcltdID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6IFt2YWx1ZV1cblxuICBmb3IgKGNvbnN0IG51bWJlciBvZiBudW1iZXJzVG9WYWxpZGF0ZSkge1xuICAgIGlmICghaXNOdW1iZXIobnVtYmVyKSkgcmV0dXJuIHQoJ3ZhbGlkYXRpb246ZW50ZXJOdW1iZXInKVxuXG4gICAgY29uc3QgbnVtYmVyVmFsdWUgPSBwYXJzZUZsb2F0KG51bWJlciBhcyB1bmtub3duIGFzIHN0cmluZylcblxuICAgIGlmICh0eXBlb2YgbWF4ID09PSAnbnVtYmVyJyAmJiBudW1iZXJWYWx1ZSA+IG1heCkge1xuICAgICAgcmV0dXJuIHQoJ3ZhbGlkYXRpb246Z3JlYXRlclRoYW5NYXgnLCB7IGxhYmVsOiB0KCd2YWx1ZScpLCBtYXgsIHZhbHVlIH0pXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtaW4gPT09ICdudW1iZXInICYmIG51bWJlclZhbHVlIDwgbWluKSB7XG4gICAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpsZXNzVGhhbk1pbicsIHsgbGFiZWw6IHQoJ3ZhbHVlJyksIG1pbiwgdmFsdWUgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnQgY29uc3QgYXJyYXk6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIEFycmF5RmllbGQ+ID0gKFxuICB2YWx1ZSxcbiAgeyBtYXhSb3dzLCBtaW5Sb3dzLCByZXF1aXJlZCwgdCB9LFxuKSA9PiB7XG4gIHJldHVybiB2YWxpZGF0ZUFycmF5TGVuZ3RoKHZhbHVlLCB7IG1heFJvd3MsIG1pblJvd3MsIHJlcXVpcmVkLCB0IH0pXG59XG5cbmV4cG9ydCBjb25zdCBibG9ja3M6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIEJsb2NrRmllbGQ+ID0gKFxuICB2YWx1ZSxcbiAgeyBtYXhSb3dzLCBtaW5Sb3dzLCByZXF1aXJlZCwgdCB9LFxuKSA9PiB7XG4gIHJldHVybiB2YWxpZGF0ZUFycmF5TGVuZ3RoKHZhbHVlLCB7IG1heFJvd3MsIG1pblJvd3MsIHJlcXVpcmVkLCB0IH0pXG59XG5cbmNvbnN0IHZhbGlkYXRlRmlsdGVyT3B0aW9uczogVmFsaWRhdGUgPSBhc3luYyAoXG4gIHZhbHVlLFxuICB7IGlkLCBkYXRhLCBmaWx0ZXJPcHRpb25zLCBwYXlsb2FkLCByZWxhdGlvblRvLCByZXEsIHNpYmxpbmdEYXRhLCB0LCB1c2VyIH0sXG4pID0+IHtcbiAgaWYgKCFjYW5Vc2VET00gJiYgdHlwZW9mIGZpbHRlck9wdGlvbnMgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlKSB7XG4gICAgY29uc3Qgb3B0aW9uczoge1xuICAgICAgW2NvbGxlY3Rpb246IHN0cmluZ106IChudW1iZXIgfCBzdHJpbmcpW11cbiAgICB9ID0ge31cblxuICAgIGNvbnN0IGZhbHNlQ29sbGVjdGlvbnM6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVvZiByZWxhdGlvblRvID09PSAnc3RyaW5nJyA/IFtyZWxhdGlvblRvXSA6IHJlbGF0aW9uVG9cbiAgICBjb25zdCB2YWx1ZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogW3ZhbHVlXVxuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICBjb2xsZWN0aW9ucy5tYXAoYXN5bmMgKGNvbGxlY3Rpb24pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsZXQgb3B0aW9uRmlsdGVyID1cbiAgICAgICAgICAgIHR5cGVvZiBmaWx0ZXJPcHRpb25zID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgID8gYXdhaXQgZmlsdGVyT3B0aW9ucyh7XG4gICAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgICAgICByZWxhdGlvblRvOiBjb2xsZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgc2libGluZ0RhdGEsXG4gICAgICAgICAgICAgICAgICB1c2VyLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIDogZmlsdGVyT3B0aW9uc1xuXG4gICAgICAgICAgaWYgKG9wdGlvbkZpbHRlciA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgb3B0aW9uRmlsdGVyID0gbnVsbFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHZhbHVlSURzOiAobnVtYmVyIHwgc3RyaW5nKVtdID0gW11cblxuICAgICAgICAgIHZhbHVlcy5mb3JFYWNoKCh2YWwpID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICBpZiAodmFsPy52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhbHVlSURzLnB1c2godmFsLnZhbHVlKVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKE9iamVjdElELmlzVmFsaWQodmFsKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlSURzLnB1c2gobmV3IE9iamVjdElEKHZhbCkudG9IZXhTdHJpbmcoKSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgdmFsdWVJRHMucHVzaCh2YWwpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmICh2YWx1ZUlEcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBmaW5kV2hlcmUgPSB7XG4gICAgICAgICAgICAgIGFuZDogW3sgaWQ6IHsgaW46IHZhbHVlSURzIH0gfV0sXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25GaWx0ZXIpIGZpbmRXaGVyZS5hbmQucHVzaChvcHRpb25GaWx0ZXIpXG5cbiAgICAgICAgICAgIGlmIChvcHRpb25GaWx0ZXIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIGZhbHNlQ29sbGVjdGlvbnMucHVzaChvcHRpb25GaWx0ZXIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBheWxvYWQuZmluZCh7XG4gICAgICAgICAgICAgIGNvbGxlY3Rpb24sXG4gICAgICAgICAgICAgIGRlcHRoOiAwLFxuICAgICAgICAgICAgICBsaW1pdDogMCxcbiAgICAgICAgICAgICAgcGFnaW5hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICAgIHJlcSxcbiAgICAgICAgICAgICAgd2hlcmU6IGZpbmRXaGVyZSxcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIG9wdGlvbnNbY29sbGVjdGlvbl0gPSByZXN1bHQuZG9jcy5tYXAoKGRvYykgPT4gZG9jLmlkKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zW2NvbGxlY3Rpb25dID0gW11cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHJlcS5wYXlsb2FkLmxvZ2dlci5lcnJvcih7XG4gICAgICAgICAgICBlcnIsXG4gICAgICAgICAgICBtc2c6IGBFcnJvciB2YWxpZGF0aW5nIGZpbHRlciBvcHRpb25zIGZvciBjb2xsZWN0aW9uICR7Y29sbGVjdGlvbn1gLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgb3B0aW9uc1tjb2xsZWN0aW9uXSA9IFtdXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIClcblxuICAgIGNvbnN0IGludmFsaWRSZWxhdGlvbnNoaXBzID0gdmFsdWVzLmZpbHRlcigodmFsKSA9PiB7XG4gICAgICBsZXQgY29sbGVjdGlvbjogc3RyaW5nXG4gICAgICBsZXQgcmVxdWVzdGVkSUQ6IG51bWJlciB8IHN0cmluZ1xuXG4gICAgICBpZiAodHlwZW9mIHJlbGF0aW9uVG8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbGxlY3Rpb24gPSByZWxhdGlvblRvXG5cbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcmVxdWVzdGVkSUQgPSB2YWxcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0JyAmJiBPYmplY3RJRC5pc1ZhbGlkKHZhbCkpIHtcbiAgICAgICAgICByZXF1ZXN0ZWRJRCA9IG5ldyBPYmplY3RJRCh2YWwpLnRvSGV4U3RyaW5nKClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZWxhdGlvblRvKSAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0JyAmJiB2YWw/LnJlbGF0aW9uVG8pIHtcbiAgICAgICAgY29sbGVjdGlvbiA9IHZhbC5yZWxhdGlvblRvXG4gICAgICAgIHJlcXVlc3RlZElEID0gdmFsLnZhbHVlXG4gICAgICB9XG5cbiAgICAgIGlmIChmYWxzZUNvbGxlY3Rpb25zLmZpbmQoKHNsdWcpID0+IHJlbGF0aW9uVG8gPT09IHNsdWcpKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBvcHRpb25zW2NvbGxlY3Rpb25dLmluZGV4T2YocmVxdWVzdGVkSUQpID09PSAtMVxuICAgIH0pXG5cbiAgICBpZiAoaW52YWxpZFJlbGF0aW9uc2hpcHMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGludmFsaWRSZWxhdGlvbnNoaXBzLnJlZHVjZSgoZXJyLCBpbnZhbGlkLCBpKSA9PiB7XG4gICAgICAgIHJldHVybiBgJHtlcnJ9ICR7SlNPTi5zdHJpbmdpZnkoaW52YWxpZCl9JHtcbiAgICAgICAgICBpbnZhbGlkUmVsYXRpb25zaGlwcy5sZW5ndGggPT09IGkgKyAxID8gJywnIDogJydcbiAgICAgICAgfSBgXG4gICAgICB9LCB0KCd2YWxpZGF0aW9uOmludmFsaWRTZWxlY3Rpb25zJykpIGFzIHN0cmluZ1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnQgY29uc3QgdXBsb2FkOiBWYWxpZGF0ZTx1bmtub3duLCB1bmtub3duLCBVcGxvYWRGaWVsZD4gPSAodmFsdWU6IHN0cmluZywgb3B0aW9ucykgPT4ge1xuICBpZiAoIXZhbHVlICYmIG9wdGlvbnMucmVxdWlyZWQpIHtcbiAgICByZXR1cm4gb3B0aW9ucy50KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgfVxuXG4gIGlmICghY2FuVXNlRE9NICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBjb25zdCBpZEZpZWxkID0gb3B0aW9ucz8uY29uZmlnPy5jb2xsZWN0aW9uc1xuICAgICAgPy5maW5kKChjb2xsZWN0aW9uKSA9PiBjb2xsZWN0aW9uLnNsdWcgPT09IG9wdGlvbnMucmVsYXRpb25UbylcbiAgICAgID8uZmllbGRzPy5maW5kKChmaWVsZCkgPT4gZmllbGRBZmZlY3RzRGF0YShmaWVsZCkgJiYgZmllbGQubmFtZSA9PT0gJ2lkJylcblxuICAgIGNvbnN0IHR5cGUgPSBnZXRJRFR5cGUoaWRGaWVsZCwgb3B0aW9ucz8ucGF5bG9hZD8uZGI/LmRlZmF1bHRJRFR5cGUpXG5cbiAgICBpZiAoIWlzVmFsaWRJRCh2YWx1ZSwgdHlwZSkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLnQoJ3ZhbGlkYXRpb246dmFsaWRVcGxvYWRJRCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbGlkYXRlRmlsdGVyT3B0aW9ucyh2YWx1ZSwgb3B0aW9ucylcbn1cblxuZXhwb3J0IGNvbnN0IHJlbGF0aW9uc2hpcDogVmFsaWRhdGU8dW5rbm93biwgdW5rbm93biwgUmVsYXRpb25zaGlwRmllbGQ+ID0gYXN5bmMgKFxuICB2YWx1ZTogUmVsYXRpb25zaGlwVmFsdWUsXG4gIG9wdGlvbnMsXG4pID0+IHtcbiAgY29uc3QgeyBjb25maWcsIG1heFJvd3MsIG1pblJvd3MsIHBheWxvYWQsIHJlbGF0aW9uVG8sIHJlcXVpcmVkLCB0IH0gPSBvcHRpb25zXG5cbiAgaWYgKCghdmFsdWUgfHwgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkpICYmIHJlcXVpcmVkKSB7XG4gICAgcmV0dXJuIHQoJ3ZhbGlkYXRpb246cmVxdWlyZWQnKVxuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA+IDApIHtcbiAgICBpZiAobWluUm93cyAmJiB2YWx1ZS5sZW5ndGggPCBtaW5Sb3dzKSB7XG4gICAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpsZXNzVGhhbk1pbicsIHsgbGFiZWw6IHQoJ3Jvd3MnKSwgbWluOiBtaW5Sb3dzLCB2YWx1ZTogdmFsdWUubGVuZ3RoIH0pXG4gICAgfVxuXG4gICAgaWYgKG1heFJvd3MgJiYgdmFsdWUubGVuZ3RoID4gbWF4Um93cykge1xuICAgICAgcmV0dXJuIHQoJ3ZhbGlkYXRpb246Z3JlYXRlclRoYW5NYXgnLCB7IGxhYmVsOiB0KCdyb3dzJyksIG1heDogbWF4Um93cywgdmFsdWU6IHZhbHVlLmxlbmd0aCB9KVxuICAgIH1cbiAgfVxuXG4gIGlmICghY2FuVXNlRE9NICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBjb25zdCB2YWx1ZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogW3ZhbHVlXVxuXG4gICAgY29uc3QgaW52YWxpZFJlbGF0aW9uc2hpcHMgPSB2YWx1ZXMuZmlsdGVyKCh2YWwpID0+IHtcbiAgICAgIGxldCBjb2xsZWN0aW9uU2x1Zzogc3RyaW5nXG4gICAgICBsZXQgcmVxdWVzdGVkSURcblxuICAgICAgaWYgKHR5cGVvZiByZWxhdGlvblRvID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb2xsZWN0aW9uU2x1ZyA9IHJlbGF0aW9uVG9cblxuICAgICAgICAvLyBjdXN0b20gaWRcbiAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgIHJlcXVlc3RlZElEID0gdmFsXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVsYXRpb25UbykgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgJiYgdmFsPy5yZWxhdGlvblRvKSB7XG4gICAgICAgIGNvbGxlY3Rpb25TbHVnID0gdmFsLnJlbGF0aW9uVG9cbiAgICAgICAgcmVxdWVzdGVkSUQgPSB2YWwudmFsdWVcbiAgICAgIH1cblxuICAgICAgaWYgKHJlcXVlc3RlZElEID09PSBudWxsKSByZXR1cm4gZmFsc2VcblxuICAgICAgY29uc3QgaWRGaWVsZCA9IGNvbmZpZz8uY29sbGVjdGlvbnNcbiAgICAgICAgPy5maW5kKChjb2xsZWN0aW9uKSA9PiBjb2xsZWN0aW9uLnNsdWcgPT09IGNvbGxlY3Rpb25TbHVnKVxuICAgICAgICA/LmZpZWxkcz8uZmluZCgoZmllbGQpID0+IGZpZWxkQWZmZWN0c0RhdGEoZmllbGQpICYmIGZpZWxkLm5hbWUgPT09ICdpZCcpXG5cbiAgICAgIGNvbnN0IHR5cGUgPSBnZXRJRFR5cGUoaWRGaWVsZCwgcGF5bG9hZD8uZGI/LmRlZmF1bHRJRFR5cGUpXG5cbiAgICAgIHJldHVybiAhaXNWYWxpZElEKHJlcXVlc3RlZElELCB0eXBlKVxuICAgIH0pXG5cbiAgICBpZiAoaW52YWxpZFJlbGF0aW9uc2hpcHMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGBUaGlzIHJlbGF0aW9uc2hpcCBmaWVsZCBoYXMgdGhlIGZvbGxvd2luZyBpbnZhbGlkIHJlbGF0aW9uc2hpcHM6ICR7aW52YWxpZFJlbGF0aW9uc2hpcHNcbiAgICAgICAgLm1hcCgoZXJyLCBpbnZhbGlkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAke2Vycn0gJHtKU09OLnN0cmluZ2lmeShpbnZhbGlkKX1gXG4gICAgICAgIH0pXG4gICAgICAgIC5qb2luKCcsICcpfWBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdmFsaWRhdGVGaWx0ZXJPcHRpb25zKHZhbHVlLCBvcHRpb25zKVxufVxuXG5leHBvcnQgY29uc3Qgc2VsZWN0OiBWYWxpZGF0ZTx1bmtub3duLCB1bmtub3duLCBTZWxlY3RGaWVsZD4gPSAoXG4gIHZhbHVlLFxuICB7IGhhc01hbnksIG9wdGlvbnMsIHJlcXVpcmVkLCB0IH0sXG4pID0+IHtcbiAgaWYgKFxuICAgIEFycmF5LmlzQXJyYXkodmFsdWUpICYmXG4gICAgdmFsdWUuc29tZShcbiAgICAgIChpbnB1dCkgPT5cbiAgICAgICAgIW9wdGlvbnMuc29tZShcbiAgICAgICAgICAob3B0aW9uKSA9PiBvcHRpb24gPT09IGlucHV0IHx8ICh0eXBlb2Ygb3B0aW9uICE9PSAnc3RyaW5nJyAmJiBvcHRpb24/LnZhbHVlID09PSBpbnB1dCksXG4gICAgICAgICksXG4gICAgKVxuICApIHtcbiAgICByZXR1cm4gdCgndmFsaWRhdGlvbjppbnZhbGlkU2VsZWN0aW9uJylcbiAgfVxuXG4gIGlmIChcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmXG4gICAgIW9wdGlvbnMuc29tZShcbiAgICAgIChvcHRpb24pID0+IG9wdGlvbiA9PT0gdmFsdWUgfHwgKHR5cGVvZiBvcHRpb24gIT09ICdzdHJpbmcnICYmIG9wdGlvbi52YWx1ZSA9PT0gdmFsdWUpLFxuICAgIClcbiAgKSB7XG4gICAgcmV0dXJuIHQoJ3ZhbGlkYXRpb246aW52YWxpZFNlbGVjdGlvbicpXG4gIH1cblxuICBpZiAoXG4gICAgcmVxdWlyZWQgJiZcbiAgICAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgdmFsdWUgPT09IG51bGwgfHxcbiAgICAgIChoYXNNYW55ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpICYmICh2YWx1ZSBhcyBbXSk/Lmxlbmd0aCA9PT0gMCkpXG4gICkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOnJlcXVpcmVkJylcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmV4cG9ydCBjb25zdCByYWRpbzogVmFsaWRhdGU8dW5rbm93biwgdW5rbm93biwgUmFkaW9GaWVsZD4gPSAodmFsdWUsIHsgb3B0aW9ucywgcmVxdWlyZWQsIHQgfSkgPT4ge1xuICBpZiAodmFsdWUpIHtcbiAgICBjb25zdCB2YWx1ZU1hdGNoZXNPcHRpb24gPSBvcHRpb25zLnNvbWUoXG4gICAgICAob3B0aW9uKSA9PiBvcHRpb24gPT09IHZhbHVlIHx8ICh0eXBlb2Ygb3B0aW9uICE9PSAnc3RyaW5nJyAmJiBvcHRpb24udmFsdWUgPT09IHZhbHVlKSxcbiAgICApXG4gICAgcmV0dXJuIHZhbHVlTWF0Y2hlc09wdGlvbiB8fCB0KCd2YWxpZGF0aW9uOmludmFsaWRTZWxlY3Rpb24nKVxuICB9XG5cbiAgcmV0dXJuIHJlcXVpcmVkID8gdCgndmFsaWRhdGlvbjpyZXF1aXJlZCcpIDogdHJ1ZVxufVxuXG5leHBvcnQgY29uc3QgcG9pbnQ6IFZhbGlkYXRlPHVua25vd24sIHVua25vd24sIFBvaW50RmllbGQ+ID0gKFxuICB2YWx1ZTogW251bWJlciB8IHN0cmluZywgbnVtYmVyIHwgc3RyaW5nXSA9IFsnJywgJyddLFxuICB7IHJlcXVpcmVkLCB0IH0sXG4pID0+IHtcbiAgY29uc3QgbG5nID0gcGFyc2VGbG9hdChTdHJpbmcodmFsdWVbMF0pKVxuICBjb25zdCBsYXQgPSBwYXJzZUZsb2F0KFN0cmluZyh2YWx1ZVsxXSkpXG4gIGlmIChcbiAgICByZXF1aXJlZCAmJlxuICAgICgodmFsdWVbMF0gJiYgdmFsdWVbMV0gJiYgdHlwZW9mIGxuZyAhPT0gJ251bWJlcicgJiYgdHlwZW9mIGxhdCAhPT0gJ251bWJlcicpIHx8XG4gICAgICBOdW1iZXIuaXNOYU4obG5nKSB8fFxuICAgICAgTnVtYmVyLmlzTmFOKGxhdCkgfHxcbiAgICAgIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggIT09IDIpKVxuICApIHtcbiAgICByZXR1cm4gdCgndmFsaWRhdGlvbjpyZXF1aXJlc1R3b051bWJlcnMnKVxuICB9XG5cbiAgaWYgKCh2YWx1ZVsxXSAmJiBOdW1iZXIuaXNOYU4obG5nKSkgfHwgKHZhbHVlWzBdICYmIE51bWJlci5pc05hTihsYXQpKSkge1xuICAgIHJldHVybiB0KCd2YWxpZGF0aW9uOmludmFsaWRJbnB1dCcpXG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGFycmF5LFxuICBibG9ja3MsXG4gIGNoZWNrYm94LFxuICBjb2RlLFxuICBkYXRlLFxuICBlbWFpbCxcbiAganNvbixcbiAgbnVtYmVyLFxuICBwYXNzd29yZCxcbiAgcG9pbnQsXG4gIHJhZGlvLFxuICByZWxhdGlvbnNoaXAsXG4gIHJpY2hUZXh0LFxuICBzZWxlY3QsXG4gIHRleHQsXG4gIHRleHRhcmVhLFxuICB1cGxvYWQsXG59XG4iXSwibmFtZXMiOlsiYXJyYXkiLCJibG9ja3MiLCJjaGVja2JveCIsImNvZGUiLCJkYXRlIiwiZW1haWwiLCJqc29uIiwibnVtYmVyIiwicGFzc3dvcmQiLCJwb2ludCIsInJhZGlvIiwicmVsYXRpb25zaGlwIiwicmljaFRleHQiLCJzZWxlY3QiLCJ0ZXh0IiwidGV4dGFyZWEiLCJ1cGxvYWQiLCJ2YWx1ZSIsImNvbmZpZyIsImhhc01hbnkiLCJtYXhMZW5ndGgiLCJmaWVsZE1heExlbmd0aCIsIm1heFJvd3MiLCJtaW5MZW5ndGgiLCJtaW5Sb3dzIiwicmVxdWlyZWQiLCJ0IiwibGVuZ3RoVmFsaWRhdGlvblJlc3VsdCIsInZhbGlkYXRlQXJyYXlMZW5ndGgiLCJkZWZhdWx0TWF4VGV4dExlbmd0aCIsInN0cmluZ3NUb1ZhbGlkYXRlIiwiQXJyYXkiLCJpc0FycmF5Iiwic3RyaW5nVmFsdWUiLCJsZW5ndGgiLCJsYWJlbCIsInBheWxvYWQiLCJ0ZXN0IiwidW5kZWZpbmVkIiwianNvbkVycm9yIiwianNvblNjaGVtYSIsImlzTm90RW1wdHkiLCJPYmplY3QiLCJrZXlzIiwiZmV0Y2hTY2hlbWEiLCJzY2hlbWEiLCJ1cmkiLCJmZXRjaCIsInRoZW4iLCJyZXNwb25zZSIsIm9rIiwiRXJyb3IiLCJqc29uU2NoZW1hU2FuaXRpemF0aW9ucyIsImlkIiwiJGlkIiwiJHNjaGVtYSIsImFzc2lnbiIsImNhblVzZURPTSIsImFqdiIsIkFqdiIsInZhbGlkYXRlIiwiZXJyb3JzVGV4dCIsImVycm9yIiwibWVzc2FnZSIsIkRhdGUiLCJpc05hTiIsInBhcnNlIiwidG9TdHJpbmciLCJvcHRpb25zIiwiZWRpdG9yIiwiYXJyYXlMZW5ndGgiLCJjb3VudCIsIm1heCIsIm1pbiIsImlzTnVtYmVyIiwibnVtYmVyc1RvVmFsaWRhdGUiLCJudW1iZXJWYWx1ZSIsInBhcnNlRmxvYXQiLCJ2YWxpZGF0ZUZpbHRlck9wdGlvbnMiLCJkYXRhIiwiZmlsdGVyT3B0aW9ucyIsInJlbGF0aW9uVG8iLCJyZXEiLCJzaWJsaW5nRGF0YSIsInVzZXIiLCJmYWxzZUNvbGxlY3Rpb25zIiwiY29sbGVjdGlvbnMiLCJ2YWx1ZXMiLCJQcm9taXNlIiwiYWxsIiwibWFwIiwiY29sbGVjdGlvbiIsIm9wdGlvbkZpbHRlciIsInZhbHVlSURzIiwiZm9yRWFjaCIsInZhbCIsInB1c2giLCJPYmplY3RJRCIsImlzVmFsaWQiLCJ0b0hleFN0cmluZyIsImZpbmRXaGVyZSIsImFuZCIsImluIiwicmVzdWx0IiwiZmluZCIsImRlcHRoIiwibGltaXQiLCJwYWdpbmF0aW9uIiwid2hlcmUiLCJkb2NzIiwiZG9jIiwiZXJyIiwibG9nZ2VyIiwibXNnIiwiaW52YWxpZFJlbGF0aW9uc2hpcHMiLCJmaWx0ZXIiLCJyZXF1ZXN0ZWRJRCIsInNsdWciLCJpbmRleE9mIiwicmVkdWNlIiwiaW52YWxpZCIsImkiLCJKU09OIiwic3RyaW5naWZ5IiwiaWRGaWVsZCIsImZpZWxkcyIsImZpZWxkIiwiZmllbGRBZmZlY3RzRGF0YSIsIm5hbWUiLCJ0eXBlIiwiZ2V0SURUeXBlIiwiZGIiLCJkZWZhdWx0SURUeXBlIiwiaXNWYWxpZElEIiwiY29sbGVjdGlvblNsdWciLCJqb2luIiwic29tZSIsImlucHV0Iiwib3B0aW9uIiwidmFsdWVNYXRjaGVzT3B0aW9uIiwibG5nIiwiU3RyaW5nIiwibGF0IiwiTnVtYmVyIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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