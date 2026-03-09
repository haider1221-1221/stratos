import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.stratos
    
    print(f"Connecting to MongoDB at {mongo_uri}...")
    
    # Define default values for new fields
    defaults = {
        "xp": 0,
        "level": 1,
        "streak": 0,
        "hearts": 5,
        "gems": 0,
        "league": "Bronze",
        "inventory": [],
        "friends": [],
        "friend_requests": [],
        "active_boosters": [],
        "languages_learning": [],
        "achievements": []
    }
    
    users_coll = db.users
    cursor = users_coll.find({})
    
    updated_count = 0
    async for user in cursor:
        update_doc = {}
        for key, value in defaults.items():
            if key not in user:
                update_doc[key] = value
        
        if update_doc:
            await users_coll.update_one({"_id": user["_id"]}, {"$set": update_doc})
            updated_count += 1
            
    print(f"Migration complete. Updated {updated_count} users.")

if __name__ == "__main__":
    asyncio.run(migrate())
