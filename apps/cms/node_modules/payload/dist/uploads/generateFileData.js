"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "generateFileData", {
    enumerable: true,
    get: function() {
        return generateFileData;
    }
});
const _filetype = require("file-type");
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _mkdirp = /*#__PURE__*/ _interop_require_default(require("mkdirp"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _sanitizefilename = /*#__PURE__*/ _interop_require_default(require("sanitize-filename"));
const _sharp = /*#__PURE__*/ _interop_require_default(require("sharp"));
const _errors = require("../errors");
const _FileRetrievalError = /*#__PURE__*/ _interop_require_default(require("../errors/FileRetrievalError"));
const _canResizeImage = /*#__PURE__*/ _interop_require_default(require("./canResizeImage"));
const _cropImage = require("./cropImage");
const _getExternalFile = require("./getExternalFile");
const _getFileByPath = /*#__PURE__*/ _interop_require_default(require("./getFileByPath"));
const _getImageSize = /*#__PURE__*/ _interop_require_default(require("./getImageSize"));
const _getSafeFilename = /*#__PURE__*/ _interop_require_default(require("./getSafeFilename"));
const _imageResizer = /*#__PURE__*/ _interop_require_default(require("./imageResizer"));
const _isImage = /*#__PURE__*/ _interop_require_default(require("./isImage"));
const _optionallyAppendMetadata = require("./optionallyAppendMetadata");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const generateFileData = async ({ collection: { config: collectionConfig }, config, data, operation, originalDoc, overwriteExistingFiles, req, throwOnMissingFile })=>{
    if (!collectionConfig.upload) {
        return {
            data,
            files: []
        };
    }
    let file = req.files?.file || undefined;
    const uploadEdits = parseUploadEditsFromReqOrIncomingData({
        data,
        operation,
        originalDoc,
        req
    });
    const { disableLocalStorage, focalPoint: focalPointEnabled, formatOptions, imageSizes, resizeOptions, staticDir, trimOptions, withMetadata } = collectionConfig.upload;
    let staticPath = staticDir;
    if (staticDir.indexOf('/') !== 0) {
        staticPath = _path.default.resolve(config.paths.configDir, staticDir);
    }
    if (!file && uploadEdits && data) {
        const { filename, url } = data;
        try {
            if (url && url.startsWith('/') && !disableLocalStorage) {
                const filePath = `${staticPath}/${filename}`;
                const response = await (0, _getFileByPath.default)(filePath);
                file = response;
                overwriteExistingFiles = true;
            } else if (filename && url) {
                file = await (0, _getExternalFile.getExternalFile)({
                    data: data,
                    req,
                    uploadConfig: collectionConfig.upload
                });
                overwriteExistingFiles = true;
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new _FileRetrievalError.default(req.t, err.message);
            }
        }
    }
    if (!file) {
        if (throwOnMissingFile) throw new _errors.MissingFile(req.t);
        return {
            data,
            files: []
        };
    }
    if (!disableLocalStorage) {
        _mkdirp.default.sync(staticPath);
    }
    let newData = data;
    const filesToSave = [];
    const fileData = {};
    const fileIsAnimatedType = [
        'image/avif',
        'image/gif',
        'image/webp'
    ].includes(file.mimetype);
    const cropData = typeof uploadEdits === 'object' && 'crop' in uploadEdits ? uploadEdits.crop : undefined;
    try {
        const fileSupportsResize = (0, _canResizeImage.default)(file.mimetype);
        let fsSafeName;
        let sharpFile;
        let dimensions;
        let fileBuffer;
        let ext;
        let mime;
        const fileHasAdjustments = fileSupportsResize && Boolean(resizeOptions || formatOptions || imageSizes || trimOptions || file.tempFilePath);
        const sharpOptions = {};
        if (fileIsAnimatedType) sharpOptions.animated = true;
        if (_sharp.default && (fileIsAnimatedType || fileHasAdjustments)) {
            if (file.tempFilePath) {
                sharpFile = (0, _sharp.default)(file.tempFilePath, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
                ;
            } else {
                sharpFile = (0, _sharp.default)(file.data, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
                ;
            }
            if (fileHasAdjustments) {
                if (resizeOptions) {
                    sharpFile = sharpFile.resize(resizeOptions);
                }
                if (formatOptions) {
                    sharpFile = sharpFile.toFormat(formatOptions.format, formatOptions.options);
                }
                if (trimOptions) {
                    sharpFile = sharpFile.trim(trimOptions);
                }
            }
        }
        if (fileSupportsResize || (0, _isImage.default)(file.mimetype)) {
            dimensions = await (0, _getImageSize.default)(file);
            fileData.width = dimensions.width;
            fileData.height = dimensions.height;
        }
        if (sharpFile) {
            const metadata = await sharpFile.metadata();
            sharpFile = await (0, _optionallyAppendMetadata.optionallyAppendMetadata)({
                req,
                sharpFile,
                withMetadata
            });
            fileBuffer = await sharpFile.toBuffer({
                resolveWithObject: true
            });
            ({ ext, mime } = await (0, _filetype.fromBuffer)(fileBuffer.data) // This is getting an incorrect gif height back.
            );
            fileData.width = fileBuffer.info.width;
            fileData.height = fileBuffer.info.height;
            fileData.filesize = fileBuffer.info.size;
            // Animated GIFs + WebP aggregate the height from every frame, so we need to use divide by number of pages
            if (metadata.pages) {
                fileData.height = fileBuffer.info.height / metadata.pages;
                fileData.filesize = fileBuffer.data.length;
            }
        } else {
            mime = file.mimetype;
            fileData.filesize = file.size;
            if (file.name.includes('.')) {
                ext = file.name.split('.').pop().split('?')[0];
            } else {
                ext = '';
            }
        }
        // Adjust SVG mime type. fromBuffer modifies it.
        if (mime === 'application/xml' && ext === 'svg') mime = 'image/svg+xml';
        fileData.mimeType = mime;
        const baseFilename = (0, _sanitizefilename.default)(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
        fsSafeName = `${baseFilename}${ext ? `.${ext}` : ''}`;
        if (!overwriteExistingFiles) {
            fsSafeName = await (0, _getSafeFilename.default)({
                collectionSlug: collectionConfig.slug,
                desiredFilename: fsSafeName,
                req,
                staticPath
            });
        }
        fileData.filename = fsSafeName;
        let fileForResize = file;
        if (cropData) {
            const { data: croppedImage, info } = await (0, _cropImage.cropImage)({
                cropData,
                dimensions,
                file,
                heightInPixels: uploadEdits.heightInPixels,
                req,
                widthInPixels: uploadEdits.widthInPixels,
                withMetadata
            });
            // Apply resize after cropping to ensure it conforms to resizeOptions
            if (resizeOptions) {
                const resizedAfterCrop = await (0, _sharp.default)(croppedImage).resize({
                    fit: resizeOptions?.fit || 'cover',
                    height: resizeOptions?.height,
                    position: resizeOptions?.position || 'center',
                    width: resizeOptions?.width
                }).toBuffer({
                    resolveWithObject: true
                });
                filesToSave.push({
                    buffer: resizedAfterCrop.data,
                    path: `${staticPath}/${fsSafeName}`
                });
                fileForResize = {
                    ...fileForResize,
                    data: resizedAfterCrop.data,
                    size: resizedAfterCrop.info.size
                };
                fileData.width = resizedAfterCrop.info.width;
                fileData.height = resizedAfterCrop.info.height;
                if (fileIsAnimatedType) {
                    const metadata = await sharpFile.metadata();
                    fileData.height = metadata.pages ? resizedAfterCrop.info.height / metadata.pages : resizedAfterCrop.info.height;
                }
                fileData.filesize = resizedAfterCrop.info.size;
            } else {
                // If resizeOptions is not present, just save the cropped image
                filesToSave.push({
                    buffer: croppedImage,
                    path: `${staticPath}/${fsSafeName}`
                });
                fileForResize = {
                    ...file,
                    data: croppedImage,
                    size: info.size
                };
                fileData.width = info.width;
                fileData.height = info.height;
                if (fileIsAnimatedType) {
                    const metadata = await sharpFile.metadata();
                    fileData.height = metadata.pages ? info.height / metadata.pages : info.height;
                }
                fileData.filesize = info.size;
            }
            if (file.tempFilePath) {
                await _fs.default.promises.writeFile(file.tempFilePath, croppedImage) // write fileBuffer to the temp path
                ;
            } else {
                req.files.file = fileForResize;
            }
        } else {
            filesToSave.push({
                buffer: fileBuffer?.data || file.data,
                path: `${staticPath}/${fsSafeName}`
            });
            // If using temp files and the image is being resized, write the file to the temp path
            if (fileBuffer?.data || file.data.length > 0) {
                if (file.tempFilePath) {
                    await _fs.default.promises.writeFile(file.tempFilePath, fileBuffer?.data || file.data) // write fileBuffer to the temp path
                    ;
                } else {
                    // Assign the _possibly modified_ file to the request object
                    req.files.file = {
                        ...file,
                        data: fileBuffer?.data || file.data,
                        size: fileBuffer?.info.size
                    };
                }
            }
        }
        if (fileSupportsResize && (Array.isArray(imageSizes) || focalPointEnabled !== false)) {
            req.payloadUploadSizes = {};
            const { focalPoint, sizeData, sizesToSave } = await (0, _imageResizer.default)({
                config: collectionConfig,
                dimensions: !cropData ? dimensions : {
                    ...dimensions,
                    height: fileData.height,
                    width: fileData.width
                },
                file: fileForResize,
                mimeType: fileData.mimeType,
                req,
                savedFilename: fsSafeName || file.name,
                staticPath,
                uploadEdits,
                withMetadata
            });
            fileData.sizes = sizeData;
            fileData.focalX = focalPoint?.x;
            fileData.focalY = focalPoint?.y;
            filesToSave.push(...sizesToSave);
        }
    } catch (err) {
        req.payload.logger.error({
            err,
            msg: 'Error uploading file'
        });
        throw new _errors.FileUploadError(req.t);
    }
    newData = {
        ...newData,
        ...fileData
    };
    return {
        data: newData,
        files: filesToSave
    };
};
/**
 * Parse upload edits from req or incoming data
 */ function parseUploadEditsFromReqOrIncomingData(args) {
    const { data, operation, originalDoc, req } = args;
    // Get intended focal point change from query string or incoming data
    const uploadEdits = req.query?.uploadEdits && typeof req.query.uploadEdits === 'object' ? req.query.uploadEdits : {};
    if (uploadEdits.focalPoint) return uploadEdits;
    const incomingData = data;
    const origDoc = originalDoc;
    // If no change in focal point, return undefined.
    // This prevents a refocal operation triggered from admin, because it always sends the focal point.
    if (origDoc && incomingData.focalX === origDoc.focalX && incomingData.focalY === origDoc.focalY) {
        return undefined;
    }
    if (incomingData.focalX && incomingData.focalY) {
        uploadEdits.focalPoint = {
            x: incomingData.focalX,
            y: incomingData.focalY
        };
        return uploadEdits;
    }
    // If no focal point is set, default to center
    if (operation === 'create') {
        uploadEdits.focalPoint = {
            x: 50,
            y: 50
        };
    }
    return uploadEdits;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91cGxvYWRzL2dlbmVyYXRlRmlsZURhdGEudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBVcGxvYWRlZEZpbGUgfSBmcm9tICdleHByZXNzLWZpbGV1cGxvYWQnXG5pbXBvcnQgdHlwZSB7IE91dHB1dEluZm8sIFNoYXJwLCBTaGFycE9wdGlvbnMgfSBmcm9tICdzaGFycCdcblxuaW1wb3J0IHsgZnJvbUJ1ZmZlciB9IGZyb20gJ2ZpbGUtdHlwZSdcbmltcG9ydCBmcyBmcm9tICdmcydcbmltcG9ydCBta2RpcnAgZnJvbSAnbWtkaXJwJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzYW5pdGl6ZSBmcm9tICdzYW5pdGl6ZS1maWxlbmFtZSdcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCdcblxuaW1wb3J0IHR5cGUgeyBDb2xsZWN0aW9uIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvY29uZmlnL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBTYW5pdGl6ZWRDb25maWcgfSBmcm9tICcuLi9jb25maWcvdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFBheWxvYWRSZXF1ZXN0IH0gZnJvbSAnLi4vZXhwcmVzcy90eXBlcydcbmltcG9ydCB0eXBlIHsgRmlsZURhdGEsIEZpbGVUb1NhdmUsIFByb2JlZEltYWdlU2l6ZSwgVXBsb2FkRWRpdHMgfSBmcm9tICcuL3R5cGVzJ1xuXG5pbXBvcnQgeyBGaWxlVXBsb2FkRXJyb3IsIE1pc3NpbmdGaWxlIH0gZnJvbSAnLi4vZXJyb3JzJ1xuaW1wb3J0IEZpbGVSZXRyaWV2YWxFcnJvciBmcm9tICcuLi9lcnJvcnMvRmlsZVJldHJpZXZhbEVycm9yJ1xuaW1wb3J0IGNhblJlc2l6ZUltYWdlIGZyb20gJy4vY2FuUmVzaXplSW1hZ2UnXG5pbXBvcnQgeyBjcm9wSW1hZ2UgfSBmcm9tICcuL2Nyb3BJbWFnZSdcbmltcG9ydCB7IGdldEV4dGVybmFsRmlsZSB9IGZyb20gJy4vZ2V0RXh0ZXJuYWxGaWxlJ1xuaW1wb3J0IGdldEZpbGVCeVBhdGggZnJvbSAnLi9nZXRGaWxlQnlQYXRoJ1xuaW1wb3J0IGdldEltYWdlU2l6ZSBmcm9tICcuL2dldEltYWdlU2l6ZSdcbmltcG9ydCBnZXRTYWZlRmlsZU5hbWUgZnJvbSAnLi9nZXRTYWZlRmlsZW5hbWUnXG5pbXBvcnQgcmVzaXplQW5kVHJhbnNmb3JtSW1hZ2VTaXplcyBmcm9tICcuL2ltYWdlUmVzaXplcidcbmltcG9ydCBpc0ltYWdlIGZyb20gJy4vaXNJbWFnZSdcbmltcG9ydCB7IG9wdGlvbmFsbHlBcHBlbmRNZXRhZGF0YSB9IGZyb20gJy4vb3B0aW9uYWxseUFwcGVuZE1ldGFkYXRhJ1xuXG50eXBlIEFyZ3M8VD4gPSB7XG4gIGNvbGxlY3Rpb246IENvbGxlY3Rpb25cbiAgY29uZmlnOiBTYW5pdGl6ZWRDb25maWdcbiAgZGF0YTogVFxuICBvcGVyYXRpb246ICdjcmVhdGUnIHwgJ3VwZGF0ZSdcbiAgb3JpZ2luYWxEb2M/OiBUXG4gIG92ZXJ3cml0ZUV4aXN0aW5nRmlsZXM/OiBib29sZWFuXG4gIHJlcTogUGF5bG9hZFJlcXVlc3RcbiAgdGhyb3dPbk1pc3NpbmdGaWxlPzogYm9vbGVhblxufVxuXG50eXBlIFJlc3VsdDxUPiA9IFByb21pc2U8e1xuICBkYXRhOiBUXG4gIGZpbGVzOiBGaWxlVG9TYXZlW11cbn0+XG5cbmV4cG9ydCBjb25zdCBnZW5lcmF0ZUZpbGVEYXRhID0gYXN5bmMgPFQ+KHtcbiAgY29sbGVjdGlvbjogeyBjb25maWc6IGNvbGxlY3Rpb25Db25maWcgfSxcbiAgY29uZmlnLFxuICBkYXRhLFxuICBvcGVyYXRpb24sXG4gIG9yaWdpbmFsRG9jLFxuICBvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzLFxuICByZXEsXG4gIHRocm93T25NaXNzaW5nRmlsZSxcbn06IEFyZ3M8VD4pOiBSZXN1bHQ8VD4gPT4ge1xuICBpZiAoIWNvbGxlY3Rpb25Db25maWcudXBsb2FkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRhdGEsXG4gICAgICBmaWxlczogW10sXG4gICAgfVxuICB9XG5cbiAgbGV0IGZpbGUgPSByZXEuZmlsZXM/LmZpbGUgfHwgdW5kZWZpbmVkXG5cbiAgY29uc3QgdXBsb2FkRWRpdHMgPSBwYXJzZVVwbG9hZEVkaXRzRnJvbVJlcU9ySW5jb21pbmdEYXRhKHtcbiAgICBkYXRhLFxuICAgIG9wZXJhdGlvbixcbiAgICBvcmlnaW5hbERvYyxcbiAgICByZXEsXG4gIH0pXG5cbiAgY29uc3Qge1xuICAgIGRpc2FibGVMb2NhbFN0b3JhZ2UsXG4gICAgZm9jYWxQb2ludDogZm9jYWxQb2ludEVuYWJsZWQsXG4gICAgZm9ybWF0T3B0aW9ucyxcbiAgICBpbWFnZVNpemVzLFxuICAgIHJlc2l6ZU9wdGlvbnMsXG4gICAgc3RhdGljRGlyLFxuICAgIHRyaW1PcHRpb25zLFxuICAgIHdpdGhNZXRhZGF0YSxcbiAgfSA9IGNvbGxlY3Rpb25Db25maWcudXBsb2FkXG5cbiAgbGV0IHN0YXRpY1BhdGggPSBzdGF0aWNEaXJcbiAgaWYgKHN0YXRpY0Rpci5pbmRleE9mKCcvJykgIT09IDApIHtcbiAgICBzdGF0aWNQYXRoID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5wYXRocy5jb25maWdEaXIsIHN0YXRpY0RpcilcbiAgfVxuXG4gIGlmICghZmlsZSAmJiB1cGxvYWRFZGl0cyAmJiBkYXRhKSB7XG4gICAgY29uc3QgeyBmaWxlbmFtZSwgdXJsIH0gPSBkYXRhIGFzIEZpbGVEYXRhXG5cbiAgICB0cnkge1xuICAgICAgaWYgKHVybCAmJiB1cmwuc3RhcnRzV2l0aCgnLycpICYmICFkaXNhYmxlTG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gYCR7c3RhdGljUGF0aH0vJHtmaWxlbmFtZX1gXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZ2V0RmlsZUJ5UGF0aChmaWxlUGF0aClcbiAgICAgICAgZmlsZSA9IHJlc3BvbnNlIGFzIFVwbG9hZGVkRmlsZVxuICAgICAgICBvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzID0gdHJ1ZVxuICAgICAgfSBlbHNlIGlmIChmaWxlbmFtZSAmJiB1cmwpIHtcbiAgICAgICAgZmlsZSA9IChhd2FpdCBnZXRFeHRlcm5hbEZpbGUoe1xuICAgICAgICAgIGRhdGE6IGRhdGEgYXMgRmlsZURhdGEsXG4gICAgICAgICAgcmVxLFxuICAgICAgICAgIHVwbG9hZENvbmZpZzogY29sbGVjdGlvbkNvbmZpZy51cGxvYWQsXG4gICAgICAgIH0pKSBhcyBVcGxvYWRlZEZpbGVcbiAgICAgICAgb3ZlcndyaXRlRXhpc3RpbmdGaWxlcyA9IHRydWVcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnI6IHVua25vd24pIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgRmlsZVJldHJpZXZhbEVycm9yKHJlcS50LCBlcnIubWVzc2FnZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoIWZpbGUpIHtcbiAgICBpZiAodGhyb3dPbk1pc3NpbmdGaWxlKSB0aHJvdyBuZXcgTWlzc2luZ0ZpbGUocmVxLnQpXG5cbiAgICByZXR1cm4ge1xuICAgICAgZGF0YSxcbiAgICAgIGZpbGVzOiBbXSxcbiAgICB9XG4gIH1cblxuICBpZiAoIWRpc2FibGVMb2NhbFN0b3JhZ2UpIHtcbiAgICBta2RpcnAuc3luYyhzdGF0aWNQYXRoKVxuICB9XG5cbiAgbGV0IG5ld0RhdGEgPSBkYXRhXG4gIGNvbnN0IGZpbGVzVG9TYXZlOiBGaWxlVG9TYXZlW10gPSBbXVxuICBjb25zdCBmaWxlRGF0YTogUGFydGlhbDxGaWxlRGF0YT4gPSB7fVxuICBjb25zdCBmaWxlSXNBbmltYXRlZFR5cGUgPSBbJ2ltYWdlL2F2aWYnLCAnaW1hZ2UvZ2lmJywgJ2ltYWdlL3dlYnAnXS5pbmNsdWRlcyhmaWxlLm1pbWV0eXBlKVxuICBjb25zdCBjcm9wRGF0YSA9XG4gICAgdHlwZW9mIHVwbG9hZEVkaXRzID09PSAnb2JqZWN0JyAmJiAnY3JvcCcgaW4gdXBsb2FkRWRpdHMgPyB1cGxvYWRFZGl0cy5jcm9wIDogdW5kZWZpbmVkXG5cbiAgdHJ5IHtcbiAgICBjb25zdCBmaWxlU3VwcG9ydHNSZXNpemUgPSBjYW5SZXNpemVJbWFnZShmaWxlLm1pbWV0eXBlKVxuICAgIGxldCBmc1NhZmVOYW1lOiBzdHJpbmdcbiAgICBsZXQgc2hhcnBGaWxlOiBTaGFycCB8IHVuZGVmaW5lZFxuICAgIGxldCBkaW1lbnNpb25zOiBQcm9iZWRJbWFnZVNpemUgfCB1bmRlZmluZWRcbiAgICBsZXQgZmlsZUJ1ZmZlcjogeyBkYXRhOiBCdWZmZXI7IGluZm86IE91dHB1dEluZm8gfVxuICAgIGxldCBleHRcbiAgICBsZXQgbWltZTogc3RyaW5nXG4gICAgY29uc3QgZmlsZUhhc0FkanVzdG1lbnRzID1cbiAgICAgIGZpbGVTdXBwb3J0c1Jlc2l6ZSAmJlxuICAgICAgQm9vbGVhbihyZXNpemVPcHRpb25zIHx8IGZvcm1hdE9wdGlvbnMgfHwgaW1hZ2VTaXplcyB8fCB0cmltT3B0aW9ucyB8fCBmaWxlLnRlbXBGaWxlUGF0aClcblxuICAgIGNvbnN0IHNoYXJwT3B0aW9uczogU2hhcnBPcHRpb25zID0ge31cblxuICAgIGlmIChmaWxlSXNBbmltYXRlZFR5cGUpIHNoYXJwT3B0aW9ucy5hbmltYXRlZCA9IHRydWVcblxuICAgIGlmIChzaGFycCAmJiAoZmlsZUlzQW5pbWF0ZWRUeXBlIHx8IGZpbGVIYXNBZGp1c3RtZW50cykpIHtcbiAgICAgIGlmIChmaWxlLnRlbXBGaWxlUGF0aCkge1xuICAgICAgICBzaGFycEZpbGUgPSBzaGFycChmaWxlLnRlbXBGaWxlUGF0aCwgc2hhcnBPcHRpb25zKS5yb3RhdGUoKSAvLyBwYXNzIHJvdGF0ZSgpIHRvIGF1dG8tcm90YXRlIGJhc2VkIG9uIEVYSUYgZGF0YS4gaHR0cHM6Ly9naXRodWIuY29tL3BheWxvYWRjbXMvcGF5bG9hZC9wdWxsLzMwODFcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNoYXJwRmlsZSA9IHNoYXJwKGZpbGUuZGF0YSwgc2hhcnBPcHRpb25zKS5yb3RhdGUoKSAvLyBwYXNzIHJvdGF0ZSgpIHRvIGF1dG8tcm90YXRlIGJhc2VkIG9uIEVYSUYgZGF0YS4gaHR0cHM6Ly9naXRodWIuY29tL3BheWxvYWRjbXMvcGF5bG9hZC9wdWxsLzMwODFcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbGVIYXNBZGp1c3RtZW50cykge1xuICAgICAgICBpZiAocmVzaXplT3B0aW9ucykge1xuICAgICAgICAgIHNoYXJwRmlsZSA9IHNoYXJwRmlsZS5yZXNpemUocmVzaXplT3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0T3B0aW9ucykge1xuICAgICAgICAgIHNoYXJwRmlsZSA9IHNoYXJwRmlsZS50b0Zvcm1hdChmb3JtYXRPcHRpb25zLmZvcm1hdCwgZm9ybWF0T3B0aW9ucy5vcHRpb25zKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0cmltT3B0aW9ucykge1xuICAgICAgICAgIHNoYXJwRmlsZSA9IHNoYXJwRmlsZS50cmltKHRyaW1PcHRpb25zKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGZpbGVTdXBwb3J0c1Jlc2l6ZSB8fCBpc0ltYWdlKGZpbGUubWltZXR5cGUpKSB7XG4gICAgICBkaW1lbnNpb25zID0gYXdhaXQgZ2V0SW1hZ2VTaXplKGZpbGUpXG4gICAgICBmaWxlRGF0YS53aWR0aCA9IGRpbWVuc2lvbnMud2lkdGhcbiAgICAgIGZpbGVEYXRhLmhlaWdodCA9IGRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgfVxuXG4gICAgaWYgKHNoYXJwRmlsZSkge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSBhd2FpdCBzaGFycEZpbGUubWV0YWRhdGEoKVxuICAgICAgc2hhcnBGaWxlID0gYXdhaXQgb3B0aW9uYWxseUFwcGVuZE1ldGFkYXRhKHtcbiAgICAgICAgcmVxLFxuICAgICAgICBzaGFycEZpbGUsXG4gICAgICAgIHdpdGhNZXRhZGF0YSxcbiAgICAgIH0pXG4gICAgICBmaWxlQnVmZmVyID0gYXdhaXQgc2hhcnBGaWxlLnRvQnVmZmVyKHsgcmVzb2x2ZVdpdGhPYmplY3Q6IHRydWUgfSlcbiAgICAgIDsoeyBleHQsIG1pbWUgfSA9IGF3YWl0IGZyb21CdWZmZXIoZmlsZUJ1ZmZlci5kYXRhKSkgLy8gVGhpcyBpcyBnZXR0aW5nIGFuIGluY29ycmVjdCBnaWYgaGVpZ2h0IGJhY2suXG4gICAgICBmaWxlRGF0YS53aWR0aCA9IGZpbGVCdWZmZXIuaW5mby53aWR0aFxuICAgICAgZmlsZURhdGEuaGVpZ2h0ID0gZmlsZUJ1ZmZlci5pbmZvLmhlaWdodFxuICAgICAgZmlsZURhdGEuZmlsZXNpemUgPSBmaWxlQnVmZmVyLmluZm8uc2l6ZVxuXG4gICAgICAvLyBBbmltYXRlZCBHSUZzICsgV2ViUCBhZ2dyZWdhdGUgdGhlIGhlaWdodCBmcm9tIGV2ZXJ5IGZyYW1lLCBzbyB3ZSBuZWVkIHRvIHVzZSBkaXZpZGUgYnkgbnVtYmVyIG9mIHBhZ2VzXG4gICAgICBpZiAobWV0YWRhdGEucGFnZXMpIHtcbiAgICAgICAgZmlsZURhdGEuaGVpZ2h0ID0gZmlsZUJ1ZmZlci5pbmZvLmhlaWdodCAvIG1ldGFkYXRhLnBhZ2VzXG4gICAgICAgIGZpbGVEYXRhLmZpbGVzaXplID0gZmlsZUJ1ZmZlci5kYXRhLmxlbmd0aFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBtaW1lID0gZmlsZS5taW1ldHlwZVxuICAgICAgZmlsZURhdGEuZmlsZXNpemUgPSBmaWxlLnNpemVcblxuICAgICAgaWYgKGZpbGUubmFtZS5pbmNsdWRlcygnLicpKSB7XG4gICAgICAgIGV4dCA9IGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpLnNwbGl0KCc/JylbMF1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4dCA9ICcnXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWRqdXN0IFNWRyBtaW1lIHR5cGUuIGZyb21CdWZmZXIgbW9kaWZpZXMgaXQuXG4gICAgaWYgKG1pbWUgPT09ICdhcHBsaWNhdGlvbi94bWwnICYmIGV4dCA9PT0gJ3N2ZycpIG1pbWUgPSAnaW1hZ2Uvc3ZnK3htbCdcbiAgICBmaWxlRGF0YS5taW1lVHlwZSA9IG1pbWVcblxuICAgIGNvbnN0IGJhc2VGaWxlbmFtZSA9IHNhbml0aXplKGZpbGUubmFtZS5zdWJzdHJpbmcoMCwgZmlsZS5uYW1lLmxhc3RJbmRleE9mKCcuJykpIHx8IGZpbGUubmFtZSlcbiAgICBmc1NhZmVOYW1lID0gYCR7YmFzZUZpbGVuYW1lfSR7ZXh0ID8gYC4ke2V4dH1gIDogJyd9YFxuXG4gICAgaWYgKCFvdmVyd3JpdGVFeGlzdGluZ0ZpbGVzKSB7XG4gICAgICBmc1NhZmVOYW1lID0gYXdhaXQgZ2V0U2FmZUZpbGVOYW1lKHtcbiAgICAgICAgY29sbGVjdGlvblNsdWc6IGNvbGxlY3Rpb25Db25maWcuc2x1ZyxcbiAgICAgICAgZGVzaXJlZEZpbGVuYW1lOiBmc1NhZmVOYW1lLFxuICAgICAgICByZXEsXG4gICAgICAgIHN0YXRpY1BhdGgsXG4gICAgICB9KVxuICAgIH1cblxuICAgIGZpbGVEYXRhLmZpbGVuYW1lID0gZnNTYWZlTmFtZVxuICAgIGxldCBmaWxlRm9yUmVzaXplID0gZmlsZVxuXG4gICAgaWYgKGNyb3BEYXRhKSB7XG4gICAgICBjb25zdCB7IGRhdGE6IGNyb3BwZWRJbWFnZSwgaW5mbyB9ID0gYXdhaXQgY3JvcEltYWdlKHtcbiAgICAgICAgY3JvcERhdGEsXG4gICAgICAgIGRpbWVuc2lvbnMsXG4gICAgICAgIGZpbGUsXG4gICAgICAgIGhlaWdodEluUGl4ZWxzOiB1cGxvYWRFZGl0cy5oZWlnaHRJblBpeGVscyxcbiAgICAgICAgcmVxLFxuICAgICAgICB3aWR0aEluUGl4ZWxzOiB1cGxvYWRFZGl0cy53aWR0aEluUGl4ZWxzLFxuICAgICAgICB3aXRoTWV0YWRhdGEsXG4gICAgICB9KVxuXG4gICAgICAvLyBBcHBseSByZXNpemUgYWZ0ZXIgY3JvcHBpbmcgdG8gZW5zdXJlIGl0IGNvbmZvcm1zIHRvIHJlc2l6ZU9wdGlvbnNcbiAgICAgIGlmIChyZXNpemVPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHJlc2l6ZWRBZnRlckNyb3AgPSBhd2FpdCBzaGFycChjcm9wcGVkSW1hZ2UpXG4gICAgICAgICAgLnJlc2l6ZSh7XG4gICAgICAgICAgICBmaXQ6IHJlc2l6ZU9wdGlvbnM/LmZpdCB8fCAnY292ZXInLFxuICAgICAgICAgICAgaGVpZ2h0OiByZXNpemVPcHRpb25zPy5oZWlnaHQsXG4gICAgICAgICAgICBwb3NpdGlvbjogcmVzaXplT3B0aW9ucz8ucG9zaXRpb24gfHwgJ2NlbnRlcicsXG4gICAgICAgICAgICB3aWR0aDogcmVzaXplT3B0aW9ucz8ud2lkdGgsXG4gICAgICAgICAgfSlcbiAgICAgICAgICAudG9CdWZmZXIoeyByZXNvbHZlV2l0aE9iamVjdDogdHJ1ZSB9KVxuXG4gICAgICAgIGZpbGVzVG9TYXZlLnB1c2goe1xuICAgICAgICAgIGJ1ZmZlcjogcmVzaXplZEFmdGVyQ3JvcC5kYXRhLFxuICAgICAgICAgIHBhdGg6IGAke3N0YXRpY1BhdGh9LyR7ZnNTYWZlTmFtZX1gLFxuICAgICAgICB9KVxuXG4gICAgICAgIGZpbGVGb3JSZXNpemUgPSB7XG4gICAgICAgICAgLi4uZmlsZUZvclJlc2l6ZSxcbiAgICAgICAgICBkYXRhOiByZXNpemVkQWZ0ZXJDcm9wLmRhdGEsXG4gICAgICAgICAgc2l6ZTogcmVzaXplZEFmdGVyQ3JvcC5pbmZvLnNpemUsXG4gICAgICAgIH1cblxuICAgICAgICBmaWxlRGF0YS53aWR0aCA9IHJlc2l6ZWRBZnRlckNyb3AuaW5mby53aWR0aFxuICAgICAgICBmaWxlRGF0YS5oZWlnaHQgPSByZXNpemVkQWZ0ZXJDcm9wLmluZm8uaGVpZ2h0XG4gICAgICAgIGlmIChmaWxlSXNBbmltYXRlZFR5cGUpIHtcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGF3YWl0IHNoYXJwRmlsZS5tZXRhZGF0YSgpXG4gICAgICAgICAgZmlsZURhdGEuaGVpZ2h0ID0gbWV0YWRhdGEucGFnZXNcbiAgICAgICAgICAgID8gcmVzaXplZEFmdGVyQ3JvcC5pbmZvLmhlaWdodCAvIG1ldGFkYXRhLnBhZ2VzXG4gICAgICAgICAgICA6IHJlc2l6ZWRBZnRlckNyb3AuaW5mby5oZWlnaHRcbiAgICAgICAgfVxuICAgICAgICBmaWxlRGF0YS5maWxlc2l6ZSA9IHJlc2l6ZWRBZnRlckNyb3AuaW5mby5zaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiByZXNpemVPcHRpb25zIGlzIG5vdCBwcmVzZW50LCBqdXN0IHNhdmUgdGhlIGNyb3BwZWQgaW1hZ2VcbiAgICAgICAgZmlsZXNUb1NhdmUucHVzaCh7XG4gICAgICAgICAgYnVmZmVyOiBjcm9wcGVkSW1hZ2UsXG4gICAgICAgICAgcGF0aDogYCR7c3RhdGljUGF0aH0vJHtmc1NhZmVOYW1lfWAsXG4gICAgICAgIH0pXG5cbiAgICAgICAgZmlsZUZvclJlc2l6ZSA9IHtcbiAgICAgICAgICAuLi5maWxlLFxuICAgICAgICAgIGRhdGE6IGNyb3BwZWRJbWFnZSxcbiAgICAgICAgICBzaXplOiBpbmZvLnNpemUsXG4gICAgICAgIH1cblxuICAgICAgICBmaWxlRGF0YS53aWR0aCA9IGluZm8ud2lkdGhcbiAgICAgICAgZmlsZURhdGEuaGVpZ2h0ID0gaW5mby5oZWlnaHRcbiAgICAgICAgaWYgKGZpbGVJc0FuaW1hdGVkVHlwZSkge1xuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgc2hhcnBGaWxlLm1ldGFkYXRhKClcbiAgICAgICAgICBmaWxlRGF0YS5oZWlnaHQgPSBtZXRhZGF0YS5wYWdlcyA/IGluZm8uaGVpZ2h0IC8gbWV0YWRhdGEucGFnZXMgOiBpbmZvLmhlaWdodFxuICAgICAgICB9XG4gICAgICAgIGZpbGVEYXRhLmZpbGVzaXplID0gaW5mby5zaXplXG4gICAgICB9XG5cbiAgICAgIGlmIChmaWxlLnRlbXBGaWxlUGF0aCkge1xuICAgICAgICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUoZmlsZS50ZW1wRmlsZVBhdGgsIGNyb3BwZWRJbWFnZSkgLy8gd3JpdGUgZmlsZUJ1ZmZlciB0byB0aGUgdGVtcCBwYXRoXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEuZmlsZXMuZmlsZSA9IGZpbGVGb3JSZXNpemVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZmlsZXNUb1NhdmUucHVzaCh7XG4gICAgICAgIGJ1ZmZlcjogZmlsZUJ1ZmZlcj8uZGF0YSB8fCBmaWxlLmRhdGEsXG4gICAgICAgIHBhdGg6IGAke3N0YXRpY1BhdGh9LyR7ZnNTYWZlTmFtZX1gLFxuICAgICAgfSlcblxuICAgICAgLy8gSWYgdXNpbmcgdGVtcCBmaWxlcyBhbmQgdGhlIGltYWdlIGlzIGJlaW5nIHJlc2l6ZWQsIHdyaXRlIHRoZSBmaWxlIHRvIHRoZSB0ZW1wIHBhdGhcbiAgICAgIGlmIChmaWxlQnVmZmVyPy5kYXRhIHx8IGZpbGUuZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChmaWxlLnRlbXBGaWxlUGF0aCkge1xuICAgICAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShmaWxlLnRlbXBGaWxlUGF0aCwgZmlsZUJ1ZmZlcj8uZGF0YSB8fCBmaWxlLmRhdGEpIC8vIHdyaXRlIGZpbGVCdWZmZXIgdG8gdGhlIHRlbXAgcGF0aFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFzc2lnbiB0aGUgX3Bvc3NpYmx5IG1vZGlmaWVkXyBmaWxlIHRvIHRoZSByZXF1ZXN0IG9iamVjdFxuICAgICAgICAgIHJlcS5maWxlcy5maWxlID0ge1xuICAgICAgICAgICAgLi4uZmlsZSxcbiAgICAgICAgICAgIGRhdGE6IGZpbGVCdWZmZXI/LmRhdGEgfHwgZmlsZS5kYXRhLFxuICAgICAgICAgICAgc2l6ZTogZmlsZUJ1ZmZlcj8uaW5mby5zaXplLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmaWxlU3VwcG9ydHNSZXNpemUgJiYgKEFycmF5LmlzQXJyYXkoaW1hZ2VTaXplcykgfHwgZm9jYWxQb2ludEVuYWJsZWQgIT09IGZhbHNlKSkge1xuICAgICAgcmVxLnBheWxvYWRVcGxvYWRTaXplcyA9IHt9XG4gICAgICBjb25zdCB7IGZvY2FsUG9pbnQsIHNpemVEYXRhLCBzaXplc1RvU2F2ZSB9ID0gYXdhaXQgcmVzaXplQW5kVHJhbnNmb3JtSW1hZ2VTaXplcyh7XG4gICAgICAgIGNvbmZpZzogY29sbGVjdGlvbkNvbmZpZyxcbiAgICAgICAgZGltZW5zaW9uczogIWNyb3BEYXRhXG4gICAgICAgICAgPyBkaW1lbnNpb25zXG4gICAgICAgICAgOiB7XG4gICAgICAgICAgICAgIC4uLmRpbWVuc2lvbnMsXG4gICAgICAgICAgICAgIGhlaWdodDogZmlsZURhdGEuaGVpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aDogZmlsZURhdGEud2lkdGgsXG4gICAgICAgICAgICB9LFxuICAgICAgICBmaWxlOiBmaWxlRm9yUmVzaXplLFxuICAgICAgICBtaW1lVHlwZTogZmlsZURhdGEubWltZVR5cGUsXG4gICAgICAgIHJlcSxcbiAgICAgICAgc2F2ZWRGaWxlbmFtZTogZnNTYWZlTmFtZSB8fCBmaWxlLm5hbWUsXG4gICAgICAgIHN0YXRpY1BhdGgsXG4gICAgICAgIHVwbG9hZEVkaXRzLFxuICAgICAgICB3aXRoTWV0YWRhdGEsXG4gICAgICB9KVxuXG4gICAgICBmaWxlRGF0YS5zaXplcyA9IHNpemVEYXRhXG4gICAgICBmaWxlRGF0YS5mb2NhbFggPSBmb2NhbFBvaW50Py54XG4gICAgICBmaWxlRGF0YS5mb2NhbFkgPSBmb2NhbFBvaW50Py55XG4gICAgICBmaWxlc1RvU2F2ZS5wdXNoKC4uLnNpemVzVG9TYXZlKVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmVxLnBheWxvYWQubG9nZ2VyLmVycm9yKHsgZXJyLCBtc2c6ICdFcnJvciB1cGxvYWRpbmcgZmlsZScgfSlcbiAgICB0aHJvdyBuZXcgRmlsZVVwbG9hZEVycm9yKHJlcS50KVxuICB9XG5cbiAgbmV3RGF0YSA9IHtcbiAgICAuLi5uZXdEYXRhLFxuICAgIC4uLmZpbGVEYXRhLFxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkYXRhOiBuZXdEYXRhLFxuICAgIGZpbGVzOiBmaWxlc1RvU2F2ZSxcbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHVwbG9hZCBlZGl0cyBmcm9tIHJlcSBvciBpbmNvbWluZyBkYXRhXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVXBsb2FkRWRpdHNGcm9tUmVxT3JJbmNvbWluZ0RhdGEoYXJnczoge1xuICBkYXRhOiB1bmtub3duXG4gIG9wZXJhdGlvbjogJ2NyZWF0ZScgfCAndXBkYXRlJ1xuICBvcmlnaW5hbERvYzogdW5rbm93blxuICByZXE6IFBheWxvYWRSZXF1ZXN0XG59KTogVXBsb2FkRWRpdHMge1xuICBjb25zdCB7IGRhdGEsIG9wZXJhdGlvbiwgb3JpZ2luYWxEb2MsIHJlcSB9ID0gYXJnc1xuXG4gIC8vIEdldCBpbnRlbmRlZCBmb2NhbCBwb2ludCBjaGFuZ2UgZnJvbSBxdWVyeSBzdHJpbmcgb3IgaW5jb21pbmcgZGF0YVxuICBjb25zdCB1cGxvYWRFZGl0cyA9XG4gICAgcmVxLnF1ZXJ5Py51cGxvYWRFZGl0cyAmJiB0eXBlb2YgcmVxLnF1ZXJ5LnVwbG9hZEVkaXRzID09PSAnb2JqZWN0J1xuICAgICAgPyAocmVxLnF1ZXJ5LnVwbG9hZEVkaXRzIGFzIFVwbG9hZEVkaXRzKVxuICAgICAgOiB7fVxuXG4gIGlmICh1cGxvYWRFZGl0cy5mb2NhbFBvaW50KSByZXR1cm4gdXBsb2FkRWRpdHNcblxuICBjb25zdCBpbmNvbWluZ0RhdGEgPSBkYXRhIGFzIEZpbGVEYXRhXG4gIGNvbnN0IG9yaWdEb2MgPSBvcmlnaW5hbERvYyBhcyBGaWxlRGF0YVxuXG4gIC8vIElmIG5vIGNoYW5nZSBpbiBmb2NhbCBwb2ludCwgcmV0dXJuIHVuZGVmaW5lZC5cbiAgLy8gVGhpcyBwcmV2ZW50cyBhIHJlZm9jYWwgb3BlcmF0aW9uIHRyaWdnZXJlZCBmcm9tIGFkbWluLCBiZWNhdXNlIGl0IGFsd2F5cyBzZW5kcyB0aGUgZm9jYWwgcG9pbnQuXG4gIGlmIChvcmlnRG9jICYmIGluY29taW5nRGF0YS5mb2NhbFggPT09IG9yaWdEb2MuZm9jYWxYICYmIGluY29taW5nRGF0YS5mb2NhbFkgPT09IG9yaWdEb2MuZm9jYWxZKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgaWYgKGluY29taW5nRGF0YS5mb2NhbFggJiYgaW5jb21pbmdEYXRhLmZvY2FsWSkge1xuICAgIHVwbG9hZEVkaXRzLmZvY2FsUG9pbnQgPSB7XG4gICAgICB4OiBpbmNvbWluZ0RhdGEuZm9jYWxYLFxuICAgICAgeTogaW5jb21pbmdEYXRhLmZvY2FsWSxcbiAgICB9XG4gICAgcmV0dXJuIHVwbG9hZEVkaXRzXG4gIH1cblxuICAvLyBJZiBubyBmb2NhbCBwb2ludCBpcyBzZXQsIGRlZmF1bHQgdG8gY2VudGVyXG4gIGlmIChvcGVyYXRpb24gPT09ICdjcmVhdGUnKSB7XG4gICAgdXBsb2FkRWRpdHMuZm9jYWxQb2ludCA9IHtcbiAgICAgIHg6IDUwLFxuICAgICAgeTogNTAsXG4gICAgfVxuICB9XG4gIHJldHVybiB1cGxvYWRFZGl0c1xufVxuIl0sIm5hbWVzIjpbImdlbmVyYXRlRmlsZURhdGEiLCJjb2xsZWN0aW9uIiwiY29uZmlnIiwiY29sbGVjdGlvbkNvbmZpZyIsImRhdGEiLCJvcGVyYXRpb24iLCJvcmlnaW5hbERvYyIsIm92ZXJ3cml0ZUV4aXN0aW5nRmlsZXMiLCJyZXEiLCJ0aHJvd09uTWlzc2luZ0ZpbGUiLCJ1cGxvYWQiLCJmaWxlcyIsImZpbGUiLCJ1bmRlZmluZWQiLCJ1cGxvYWRFZGl0cyIsInBhcnNlVXBsb2FkRWRpdHNGcm9tUmVxT3JJbmNvbWluZ0RhdGEiLCJkaXNhYmxlTG9jYWxTdG9yYWdlIiwiZm9jYWxQb2ludCIsImZvY2FsUG9pbnRFbmFibGVkIiwiZm9ybWF0T3B0aW9ucyIsImltYWdlU2l6ZXMiLCJyZXNpemVPcHRpb25zIiwic3RhdGljRGlyIiwidHJpbU9wdGlvbnMiLCJ3aXRoTWV0YWRhdGEiLCJzdGF0aWNQYXRoIiwiaW5kZXhPZiIsInBhdGgiLCJyZXNvbHZlIiwicGF0aHMiLCJjb25maWdEaXIiLCJmaWxlbmFtZSIsInVybCIsInN0YXJ0c1dpdGgiLCJmaWxlUGF0aCIsInJlc3BvbnNlIiwiZ2V0RmlsZUJ5UGF0aCIsImdldEV4dGVybmFsRmlsZSIsInVwbG9hZENvbmZpZyIsImVyciIsIkVycm9yIiwiRmlsZVJldHJpZXZhbEVycm9yIiwidCIsIm1lc3NhZ2UiLCJNaXNzaW5nRmlsZSIsIm1rZGlycCIsInN5bmMiLCJuZXdEYXRhIiwiZmlsZXNUb1NhdmUiLCJmaWxlRGF0YSIsImZpbGVJc0FuaW1hdGVkVHlwZSIsImluY2x1ZGVzIiwibWltZXR5cGUiLCJjcm9wRGF0YSIsImNyb3AiLCJmaWxlU3VwcG9ydHNSZXNpemUiLCJjYW5SZXNpemVJbWFnZSIsImZzU2FmZU5hbWUiLCJzaGFycEZpbGUiLCJkaW1lbnNpb25zIiwiZmlsZUJ1ZmZlciIsImV4dCIsIm1pbWUiLCJmaWxlSGFzQWRqdXN0bWVudHMiLCJCb29sZWFuIiwidGVtcEZpbGVQYXRoIiwic2hhcnBPcHRpb25zIiwiYW5pbWF0ZWQiLCJzaGFycCIsInJvdGF0ZSIsInJlc2l6ZSIsInRvRm9ybWF0IiwiZm9ybWF0Iiwib3B0aW9ucyIsInRyaW0iLCJpc0ltYWdlIiwiZ2V0SW1hZ2VTaXplIiwid2lkdGgiLCJoZWlnaHQiLCJtZXRhZGF0YSIsIm9wdGlvbmFsbHlBcHBlbmRNZXRhZGF0YSIsInRvQnVmZmVyIiwicmVzb2x2ZVdpdGhPYmplY3QiLCJmcm9tQnVmZmVyIiwiaW5mbyIsImZpbGVzaXplIiwic2l6ZSIsInBhZ2VzIiwibGVuZ3RoIiwibmFtZSIsInNwbGl0IiwicG9wIiwibWltZVR5cGUiLCJiYXNlRmlsZW5hbWUiLCJzYW5pdGl6ZSIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwiZ2V0U2FmZUZpbGVOYW1lIiwiY29sbGVjdGlvblNsdWciLCJzbHVnIiwiZGVzaXJlZEZpbGVuYW1lIiwiZmlsZUZvclJlc2l6ZSIsImNyb3BwZWRJbWFnZSIsImNyb3BJbWFnZSIsImhlaWdodEluUGl4ZWxzIiwid2lkdGhJblBpeGVscyIsInJlc2l6ZWRBZnRlckNyb3AiLCJmaXQiLCJwb3NpdGlvbiIsInB1c2giLCJidWZmZXIiLCJmcyIsInByb21pc2VzIiwid3JpdGVGaWxlIiwiQXJyYXkiLCJpc0FycmF5IiwicGF5bG9hZFVwbG9hZFNpemVzIiwic2l6ZURhdGEiLCJzaXplc1RvU2F2ZSIsInJlc2l6ZUFuZFRyYW5zZm9ybUltYWdlU2l6ZXMiLCJzYXZlZEZpbGVuYW1lIiwic2l6ZXMiLCJmb2NhbFgiLCJ4IiwiZm9jYWxZIiwieSIsInBheWxvYWQiLCJsb2dnZXIiLCJlcnJvciIsIm1zZyIsIkZpbGVVcGxvYWRFcnJvciIsImFyZ3MiLCJxdWVyeSIsImluY29taW5nRGF0YSIsIm9yaWdEb2MiXSwicmFuZ2VNYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiI7Ozs7K0JBMkNhQTs7O2VBQUFBOzs7MEJBeENjOzJEQUNaOytEQUNJOzZEQUNGO3lFQUNJOzhEQUNIO3dCQU8yQjsyRUFDZDt1RUFDSjsyQkFDRDtpQ0FDTTtzRUFDTjtxRUFDRDt3RUFDRztxRUFDYTtnRUFDckI7MENBQ3FCOzs7Ozs7QUFrQmxDLE1BQU1BLG1CQUFtQixPQUFVLEVBQ3hD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