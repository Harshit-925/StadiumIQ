/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase migration: Create reports collection
 * Stores generated PDF reports per user with file storage.
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = new Collection({
      name: "reports",
      type: "base",
      schema: [
        {
          name: "user",
          type: "relation",
          required: true,
          options: {
            collectionId: "_pb_users_auth_",
            cascadeDelete: false,
            maxSelect: 1,
            minSelect: 1,
          },
        },
        {
          name: "file",
          type: "file",
          required: true,
          options: {
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ["application/pdf"],
          },
        },
        {
          name: "venue_id",
          type: "text",
          required: true,
          options: {
            maxSize: 50,
          },
        },
        {
          name: "report_type",
          type: "text",
          required: true,
          options: {
            maxSize: 50,
          },
        },
      ],
      indexes: [],
      listRule: "user = @request.auth.id",
      viewRule: "user = @request.auth.id",
      createRule: "user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id",
    });

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("reports");
    return dao.deleteCollection(collection);
  }
);
