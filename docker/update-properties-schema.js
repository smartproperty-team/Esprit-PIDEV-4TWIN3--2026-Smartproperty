// ===========================================
// Update MongoDB Properties Schema Validation
// ===========================================
// Run this script to update the validation schema for the properties collection

db = db.getSiblingDB("smartproperty");

// Drop the existing validator and recreate with updated schema
db.runCommand({
  collMod: "properties",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "type", "status", "ownerId", "createdAt"],
      properties: {
        title: {
          bsonType: "string",
          description: "Property title - required",
        },
        description: {
          bsonType: ["string", "null", "undefined"],
          description: "Property description - optional",
        },
        type: {
          enum: ["apartment", "house", "condo", "studio", "villa", "land"],
          description: "Property type - required",
        },
        status: {
          enum: ["available", "rented", "maintenance", "unlisted"],
          description: "Property status - required",
        },
        price: {
          bsonType: ["number", "double", "int"],
          description: "Property price",
        },
        currency: {
          bsonType: "string",
          description: "Currency code",
        },
        address: {
          bsonType: ["object", "null", "undefined"],
          description: "Property address",
        },
        features: {
          bsonType: ["object", "null", "undefined"],
          description: "Property features - optional",
        },
        images: {
          bsonType: ["array", "null", "undefined"],
          description: "Property images - optional",
        },
        virtualTour: {
          bsonType: ["string", "null", "undefined"],
          description: "Virtual tour URL - optional",
        },
        ownerId: {
          bsonType: ["objectId", "string"],
          description: "Reference to owner user - required",
        },
        managerId: {
          bsonType: ["objectId", "string", "null", "undefined"],
          description: "Reference to manager user - optional",
        },
        createdAt: {
          bsonType: "date",
          description: "Creation timestamp",
        },
        updatedAt: {
          bsonType: ["date", "null", "undefined"],
          description: "Last update timestamp",
        },
        deletedAt: {
          bsonType: ["date", "null", "undefined"],
          description: "Deletion timestamp - for soft deletes",
        },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "error"
});

print("✅ Properties collection schema validation updated successfully!");

