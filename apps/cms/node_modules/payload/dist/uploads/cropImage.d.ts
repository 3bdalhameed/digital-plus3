/// <reference types="node" />
import type { UploadedFile } from 'express-fileupload';
import type { PayloadRequest } from 'payload/types';
import sharp from 'sharp';
import type { UploadEdits } from './types';
import { type WithMetadata } from './optionallyAppendMetadata';
export declare const percentToPixel: (value: any, dimension: any) => number;
type CropImageArgs = {
    cropData: UploadEdits['crop'];
    dimensions: {
        height: number;
        width: number;
    };
    file: UploadedFile;
    heightInPixels: number;
    req?: PayloadRequest;
    widthInPixels: number;
    withMetadata?: WithMetadata;
};
export declare function cropImage({ cropData, dimensions, file, heightInPixels, req, widthInPixels, withMetadata, }: CropImageArgs): Promise<{
    data: Buffer;
    info: sharp.OutputInfo;
}>;
export {};
//# sourceMappingURL=cropImage.d.ts.map