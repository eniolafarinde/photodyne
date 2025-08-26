from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, status
from . import schemas, auth
from .database import users_collection, convert_objectid_to_str
from typing import Optional

app = FastAPI(title="Color by Numbers API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
auth.initialize_firebase()

# Routes
@app.post("/register", response_model=schemas.UserResponse)
async def register(user_data: schemas.UserCreate):
    # Check if user already exists
    existing_user = await users_collection.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Hash password
    hashed_password = auth.get_password_hash(user_data.password)
    
    # Create user
    user_data_dict = user_data.dict()
    user_data_dict["password"] = hashed_password
    user_data_dict["provider"] = "email"
    
    result = await users_collection.insert_one(user_data_dict)
    new_user = await users_collection.find_one({"_id": result.inserted_id})
    
    return convert_objectid_to_str(new_user)

@app.post("/login", response_model=schemas.Token)
async def login(login_data: schemas.UserLogin):
    # Find user by username
    user = await users_collection.find_one({"username": login_data.username})
    
    if not user or not user.get("password"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Verify password
    if not auth.verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token = auth.create_access_token(
        data={"sub": user["username"]},
        expires_delta=auth.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/google-auth", response_model=schemas.Token)
async def google_auth(google_token: schemas.GoogleToken):
    # Verify Firebase token
    decoded_token = await auth.verify_firebase_token(google_token.token)
    
    # Extract user info from token
    email = decoded_token.get("email")
    name = decoded_token.get("name", "User")
    google_id = decoded_token.get("uid")
    
    # Check if user exists by google_id or email
    user = await users_collection.find_one({
        "$or": [
            {"googleId": google_id},
            {"email": email}
        ]
    })
    
    if not user:
        # Create new user with Google info
        username = email.split("@")[0]  # Use part of email as username
        
        # Ensure username is unique
        counter = 1
        original_username = username
        while await users_collection.find_one({"username": username}):
            username = f"{original_username}{counter}"
            counter += 1
        
        user_data = {
            "email": email,
            "username": username,
            "displayName": name,
            "googleId": google_id,
            "provider": "google"
        }
        
        result = await users_collection.insert_one(user_data)
        user = await users_collection.find_one({"_id": result.inserted_id})
    elif not user.get("googleId"):
        # User exists but without googleId, update it
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"googleId": google_id}}
        )
        user = await users_collection.find_one({"_id": user["_id"]})
    
    # Create access token
    access_token = auth.create_access_token(
        data={"sub": user["username"]},
        expires_delta=auth.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UserResponse)
async def get_current_user(current_user: dict = Depends(auth.get_current_user)):
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)