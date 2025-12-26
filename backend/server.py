from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

# Import models
from models.company import Company, CompanyCreate, CompanyUpdate
from models.user import User, UserCreate, UserLogin
from models.review import Review, ReviewCreate
from models.blog import BlogPost
from models.contact import ContactMessage
from utils.auth import get_password_hash, verify_password, create_access_token, decode_token

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Helper function to convert ObjectId to string
def company_helper(company) -> dict:
    return {
        "_id": str(company["_id"]),
        "name": company["name"],
        "nameRu": company["nameRu"],
        "description": company["description"],
        "descriptionRu": company["descriptionRu"],
        "category": company["category"],
        "location": company["location"],
        "contacts": company["contacts"],
        "image": company["image"],
        "images": company.get("images", []),
        "rating": company.get("rating", 0.0),
        "reviewCount": company.get("reviewCount", 0),
        "isNew": company.get("isNew", False),
        "isActive": company.get("isActive", True),
        "userId": company.get("userId"),
        "createdAt": company.get("createdAt", datetime.utcnow()),
        "updatedAt": company.get("updatedAt", datetime.utcnow())
    }

def user_helper(user) -> dict:
    return {
        "_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user.get("role", "user"),
        "createdAt": user.get("createdAt", datetime.utcnow()),
        "updatedAt": user.get("updatedAt", datetime.utcnow())
    }

def review_helper(review) -> dict:
    return {
        "_id": str(review["_id"]),
        "companyId": str(review["companyId"]),
        "userId": str(review["userId"]),
        "userName": review["userName"],
        "rating": review["rating"],
        "comment": review["comment"],
        "commentRu": review.get("commentRu"),
        "createdAt": review.get("createdAt", datetime.utcnow()),
        "updatedAt": review.get("updatedAt", datetime.utcnow())
    }

def blog_post_helper(post) -> dict:
    return {
        "_id": str(post["_id"]),
        "titleUk": post["titleUk"],
        "titleRu": post["titleRu"],
        "contentUk": post["contentUk"],
        "contentRu": post["contentRu"],
        "excerptUk": post["excerptUk"],
        "excerptRu": post["excerptRu"],
        "image": post["image"],
        "author": post.get("author", "HAL Team"),
        "publishedAt": post.get("publishedAt", datetime.utcnow()),
        "createdAt": post.get("createdAt", datetime.utcnow()),
        "updatedAt": post.get("updatedAt", datetime.utcnow())
    }

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_helper(user)

# Optional authentication
async def get_current_user_optional(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        return None
    
    return user_helper(user)


# ============ COMPANIES ENDPOINTS ============

@api_router.get("/companies")
async def get_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query("recent", regex="^(recent|popular|rating)$"),
    isNew: Optional[bool] = None
):
    """Get list of companies with filtering and pagination"""
    skip = (page - 1) * limit
    
    # Build query
    query = {"isActive": True}
    if category:
        query["category"] = category
    if isNew is not None:
        query["isNew"] = isNew
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"nameRu": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"descriptionRu": {"$regex": search, "$options": "i"}}
        ]
    
    # Build sort
    sort_field = {
        "recent": [("createdAt", -1)],
        "popular": [("reviewCount", -1), ("rating", -1)],
        "rating": [("rating", -1), ("reviewCount", -1)]
    }.get(sort, [("createdAt", -1)])
    
    # Get companies
    companies_cursor = db.companies.find(query).sort(sort_field).skip(skip).limit(limit)
    companies = await companies_cursor.to_list(length=limit)
    
    # Get total count
    total = await db.companies.count_documents(query)
    
    return {
        "companies": [company_helper(company) for company in companies],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@api_router.get("/companies/{company_id}")
async def get_company(
    company_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Get company details and track view"""
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID")
    
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Track view
    view_record = {
        "companyId": ObjectId(company_id),
        "userId": ObjectId(current_user["_id"]) if current_user else None,
        "viewedAt": datetime.utcnow()
    }
    await db.company_views.insert_one(view_record)
    
    return company_helper(company)


@api_router.post("/companies", status_code=201)
async def create_company(
    company: CompanyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new company (requires authentication)"""
    company_dict = company.model_dump()
    company_dict["userId"] = current_user["_id"]
    company_dict["rating"] = 0.0
    company_dict["reviewCount"] = 0
    company_dict["createdAt"] = datetime.utcnow()
    company_dict["updatedAt"] = datetime.utcnow()
    
    result = await db.companies.insert_one(company_dict)
    created_company = await db.companies.find_one({"_id": result.inserted_id})
    
    return company_helper(created_company)


@api_router.put("/companies/{company_id}")
async def update_company(
    company_id: str,
    company_update: CompanyUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update company (requires authentication, owner or admin)"""
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID")
    
    existing_company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if existing_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check permissions
    if current_user["role"] != "admin" and str(existing_company.get("userId")) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this company")
    
    # Update only provided fields
    update_data = {k: v for k, v in company_update.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    await db.companies.update_one(
        {"_id": ObjectId(company_id)},
        {"$set": update_data}
    )
    
    updated_company = await db.companies.find_one({"_id": ObjectId(company_id)})
    return company_helper(updated_company)


@api_router.delete("/companies/{company_id}")
async def delete_company(
    company_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete company (requires authentication, owner or admin)"""
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID")
    
    existing_company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if existing_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check permissions
    if current_user["role"] != "admin" and str(existing_company.get("userId")) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this company")
    
    await db.companies.delete_one({"_id": ObjectId(company_id)})
    return {"message": "Company deleted successfully"}


# ============ CATEGORIES ENDPOINTS ============

@api_router.get("/categories")
async def get_categories():
    """Get all categories with company counts"""
    categories = [
        {"id": "cafe", "nameUk": "Кафе та ресторани", "nameRu": "Кафе и рестораны"},
        {"id": "sport", "nameUk": "Спорт і фітнес", "nameRu": "Спорт и фитнес"},
        {"id": "beauty", "nameUk": "Краса та здоров'я", "nameRu": "Красота и здоровье"},
        {"id": "art", "nameUk": "Мистецтво та розваги", "nameRu": "Искусство и развлечения"},
        {"id": "home", "nameUk": "Домашні та побутові послуги", "nameRu": "Домашние и бытовые услуги"},
        {"id": "auto", "nameUk": "Авто послуги", "nameRu": "Авто услуги"},
        {"id": "construction", "nameUk": "Будівництво та ремонт", "nameRu": "Строительство и ремонт"},
        {"id": "other", "nameUk": "Інші послуги", "nameRu": "Другие услуги"}
    ]
    
    # Count companies in each category
    for category in categories:
        count = await db.companies.count_documents({"category": category["id"], "isActive": True})
        category["count"] = count
    
    return categories


# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register", status_code=201)
async def register(user: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user_dict["password"])
    user_dict["createdAt"] = datetime.utcnow()
    user_dict["updatedAt"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    # Create token
    token = create_access_token(data={"sub": str(created_user["_id"])})
    
    return {
        "user": user_helper(created_user),
        "token": token
    }


@api_router.post("/auth/login")
async def login(user_login: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": user_login.email})
    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Create token
    token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "user": user_helper(user),
        "token": token
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user"""
    return current_user


# ============ USER PROFILE & DASHBOARD ENDPOINTS ============

@api_router.put("/users/me")
async def update_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {}
    if name:
        update_data["name"] = name
    if phone:
        update_data["phone"] = phone
    
    if update_data:
        update_data["updatedAt"] = datetime.utcnow()
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    return user_helper(updated_user)


@api_router.get("/users/me/companies")
async def get_my_companies(current_user: dict = Depends(get_current_user)):
    """Get user's companies"""
    companies = await db.companies.find({"userId": current_user["_id"]}).to_list(length=100)
    return [company_helper(company) for company in companies]


@api_router.get("/users/me/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get user dashboard with statistics"""
    # Get user's companies
    companies = await db.companies.find({"userId": current_user["_id"]}).to_list(length=100)
    company_ids = [company["_id"] for company in companies]
    
    # Calculate statistics for each company
    stats = []
    for company_id in company_ids:
        # Total views
        total_views = await db.company_views.count_documents({"companyId": company_id})
        
        # Unique views (by userId)
        unique_views_pipeline = [
            {"$match": {"companyId": company_id}},
            {"$group": {"_id": "$userId"}},
            {"$count": "count"}
        ]
        unique_result = await db.company_views.aggregate(unique_views_pipeline).to_list(length=1)
        unique_views = unique_result[0]["count"] if unique_result else 0
        
        # Views this week
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        views_this_week = await db.company_views.count_documents({
            "companyId": company_id,
            "viewedAt": {"$gte": week_ago}
        })
        
        # Views this month
        month_ago = datetime.utcnow() - timedelta(days=30)
        views_this_month = await db.company_views.count_documents({
            "companyId": company_id,
            "viewedAt": {"$gte": month_ago}
        })
        
        # Reviews count and average rating
        reviews = await db.reviews.find({"companyId": company_id}).to_list(length=None)
        total_reviews = len(reviews)
        avg_rating = sum(r["rating"] for r in reviews) / total_reviews if total_reviews > 0 else 0
        
        # Last viewed
        last_view = await db.company_views.find_one(
            {"companyId": company_id},
            sort=[("viewedAt", -1)]
        )
        
        # Find company details
        company = next((c for c in companies if c["_id"] == company_id), None)
        
        stats.append({
            "companyId": str(company_id),
            "companyName": company.get("name", "") if company else "",
            "totalViews": total_views,
            "uniqueViews": unique_views,
            "viewsThisWeek": views_this_week,
            "viewsThisMonth": views_this_month,
            "totalReviews": total_reviews,
            "averageRating": round(avg_rating, 1),
            "lastViewedAt": last_view["viewedAt"] if last_view else None
        })
    
    # Overall statistics
    total_companies = len(companies)
    total_views_all = sum(s["totalViews"] for s in stats)
    total_reviews_all = sum(s["totalReviews"] for s in stats)
    
    return {
        "user": user_helper(await db.users.find_one({"_id": ObjectId(current_user["_id"])})),
        "overview": {
            "totalCompanies": total_companies,
            "totalViews": total_views_all,
            "totalReviews": total_reviews_all,
            "companiesActive": len([c for c in companies if c.get("isActive", True)])
        },
        "companies": stats
    }


@api_router.get("/users/me/reviews")
async def get_my_reviews(current_user: dict = Depends(get_current_user)):
    """Get reviews on user's companies"""
    # Get user's companies
    companies = await db.companies.find({"userId": current_user["_id"]}).to_list(length=100)
    company_ids = [company["_id"] for company in companies]
    
    # Get reviews for these companies
    reviews = await db.reviews.find({"companyId": {"$in": company_ids}}).sort("createdAt", -1).to_list(length=100)
    
    # Add company names to reviews
    result = []
    for review in reviews:
        company = next((c for c in companies if c["_id"] == review["companyId"]), None)
        review_data = review_helper(review)
        review_data["companyName"] = company.get("name", "") if company else ""
        result.append(review_data)
    
    return result


# ============ REVIEWS ENDPOINTS ============

@api_router.get("/companies/{company_id}/reviews")
async def get_company_reviews(
    company_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get reviews for a company"""
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID")
    
    skip = (page - 1) * limit
    
    reviews_cursor = db.reviews.find({"companyId": ObjectId(company_id)}).sort("createdAt", -1).skip(skip).limit(limit)
    reviews = await reviews_cursor.to_list(length=limit)
    
    total = await db.reviews.count_documents({"companyId": ObjectId(company_id)})
    
    return {
        "reviews": [review_helper(review) for review in reviews],
        "total": total
    }


@api_router.post("/companies/{company_id}/reviews", status_code=201)
async def create_review(
    company_id: str,
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a review (requires authentication)"""
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID")
    
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if user already reviewed
    existing_review = await db.reviews.find_one({
        "companyId": ObjectId(company_id),
        "userId": ObjectId(current_user["_id"])
    })
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this company")
    
    # Create review
    review_dict = review.model_dump()
    review_dict["companyId"] = ObjectId(company_id)
    review_dict["userId"] = ObjectId(current_user["_id"])
    review_dict["userName"] = current_user["name"]
    review_dict["createdAt"] = datetime.utcnow()
    review_dict["updatedAt"] = datetime.utcnow()
    
    result = await db.reviews.insert_one(review_dict)
    
    # Update company rating
    reviews = await db.reviews.find({"companyId": ObjectId(company_id)}).to_list(length=None)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.companies.update_one(
        {"_id": ObjectId(company_id)},
        {"$set": {"rating": round(avg_rating, 1), "reviewCount": len(reviews)}}
    )
    
    created_review = await db.reviews.find_one({"_id": result.inserted_id})
    return review_helper(created_review)


# ============ BLOG ENDPOINTS ============

@api_router.get("/blog")
async def get_blog_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get blog posts"""
    skip = (page - 1) * limit
    
    posts_cursor = db.blog_posts.find().sort("publishedAt", -1).skip(skip).limit(limit)
    posts = await posts_cursor.to_list(length=limit)
    
    total = await db.blog_posts.count_documents({})
    
    return {
        "posts": [blog_post_helper(post) for post in posts],
        "total": total
    }


@api_router.get("/blog/{post_id}")
async def get_blog_post(post_id: str):
    """Get a blog post"""
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    post = await db.blog_posts.find_one({"_id": ObjectId(post_id)})
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return blog_post_helper(post)


# ============ CONTACT ENDPOINT ============

@api_router.post("/contact")
async def send_contact_message(message: ContactMessage):
    """Send contact message"""
    message_dict = message.model_dump()
    message_dict["createdAt"] = datetime.utcnow()
    
    await db.contact_messages.insert_one(message_dict)
    
    return {"message": "Message sent successfully"}


# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "HAL API v1.0"}


# Download WordPress export files
from fastapi.responses import FileResponse
from pathlib import Path as FilePath

@api_router.get("/download/{filename}")
async def download_file(filename: str):
    """Download WordPress export files"""
    allowed_files = [
        "companies_for_wordpress.csv",
        "blog_posts_for_wordpress.csv",
        "hal_wordpress_export.xml",
        "companies.json",
        "blog_posts.json"
    ]
    
    if filename not in allowed_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = FilePath(__file__).parent / "wordpress_export" / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found. Run export_to_wordpress.py first")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type='application/octet-stream'
    )


@api_router.get("/download-project/php")
async def download_php_project():
    """Download PHP project archive"""
    file_path = ROOT_DIR / "static" / "hal-php-project.zip"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=str(file_path),
        filename="hal-php-project.zip",
        media_type='application/zip'
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()