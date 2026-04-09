/**
 * Finds the latest version and updates it in place if `shouldUpdate` returns true.
 * Used by both the unpublish and autosave paths in `saveVersion` to avoid creating
 * a redundant new version.
 *
 * Returns the updated version result, or `undefined` if no update was performed.
 */ export async function updateLatestVersion({ id, collection, global, now, payload, req, shouldUpdate = ()=>true, versionData }) {
    let docs;
    const findVersionArgs = {
        limit: 1,
        pagination: false,
        req,
        sort: '-updatedAt'
    };
    if (collection) {
        ;
        ({ docs } = await payload.db.findVersions({
            ...findVersionArgs,
            collection: collection.slug,
            where: {
                parent: {
                    equals: id
                }
            }
        }));
    } else {
        ;
        ({ docs } = await payload.db.findGlobalVersions({
            ...findVersionArgs,
            global: global.slug
        }));
    }
    const [latestVersion] = docs;
    if (!latestVersion || !shouldUpdate(latestVersion)) {
        return undefined;
    }
    const updateVersionArgs = {
        id: latestVersion.id,
        req,
        versionData: {
            createdAt: new Date(latestVersion.createdAt).toISOString(),
            latest: true,
            parent: id,
            updatedAt: now,
            version: {
                ...versionData
            }
        }
    };
    if (collection) {
        return await payload.db.updateVersion({
            ...updateVersionArgs,
            collection: collection.slug,
            req
        });
    }
    return await payload.db.updateGlobalVersion({
        ...updateVersionArgs,
        global: global.slug,
        req
    });
}

//# sourceMappingURL=updateLatestVersion.js.map