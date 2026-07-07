/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase migration: Create goals collection
 * Stores crowd safety and sustainability targets per user.
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = new Collection({
      name: "goals",
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
          name: "target",
          type: "number",
          required: true,
          options: {
            min: 0,
            max: 100,
          },
        },
        {
          name: "target_date",
          type: "date",
          required: false,
          options: {},
        },
        {
          name: "baseline",
          type: "number",
          required: true,
          options: {
            min: 0,
          },
        },
        {
          name: "achieved",
          type: "bool",
          required: false,
          options: {},
        },
        {
          name: "goal_type",
          type: "text",
          required: true,
          options: {
            maxSize: 50,
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
    const collection = dao.findCollectionByNameOrId("goals");
    return dao.deleteCollection(collection);
  }
);
