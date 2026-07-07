/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase migration: Create history collection
 * Stores crowd analysis results per user with engine and AI outputs.
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = new Collection({
      name: "history",
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
          name: "engine_result",
          type: "json",
          required: true,
          options: {
            maxSize: 65536,
          },
        },
        {
          name: "ai_result",
          type: "json",
          required: false,
          options: {
            maxSize: 65536,
          },
        },
        {
          name: "fallback_used",
          type: "bool",
          required: false,
          options: {},
        },
        {
          name: "venue_id",
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
    const collection = dao.findCollectionByNameOrId("history");
    return dao.deleteCollection(collection);
  }
);
