import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional

# MongoDB connection string
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "color_by_numbers"

# Create MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]

# Helper to convert ObjectId to string
def convert_objectid_to_str(document):
    if document and "_id" in document:
        document["id"] = str(document["_id"])
        del document["_id"]
    return document