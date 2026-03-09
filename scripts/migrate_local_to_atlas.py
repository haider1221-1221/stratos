import pymongo
import sys

def migrate():
    # Local & Atlas URIs
    local_uri = "mongodb://localhost:27017"
    atlas_uri = "mongodb+srv://haider:8P3bxBZ7MDVtvBj0@cluster0.itpxsto.mongodb.net/"
    db_name = "stratos"

    print(f"Connecting to local MongoDB: {local_uri}...")
    local_client = pymongo.MongoClient(local_uri)
    local_db = local_client[db_name]

    print(f"Connecting to MongoDB Atlas: {atlas_uri}...")
    atlas_client = pymongo.MongoClient(atlas_uri)
    atlas_db = atlas_client[db_name]

    collections = local_db.list_collection_names()
    print(f"Found collections to migrate: {collections}")

    for collection_name in collections:
        print(f"Migrating collection: {collection_name}...")
        
        # Read all documents from local collection
        documents = list(local_db[collection_name].find({}))
        
        if not documents:
            print(f" - Collection '{collection_name}' is empty. Skipping.")
            continue
            
        print(f" - Found {len(documents)} documents. Transferring...")
        
        # Insert them into Atlas collection
        # delete_many is a safeguard to avoid duplicates if you run it twice
        atlas_db[collection_name].delete_many({}) 
        atlas_db[collection_name].insert_many(documents)
        
        print(f" - Done.")

    print("\n--- Migration Complete! ---")
    print("Your data has been successfully transferred to Atlas.")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)
