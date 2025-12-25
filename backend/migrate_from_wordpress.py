"""
Скрипт для миграции данных из WordPress сайта hal.in.ua в MongoDB
"""
import asyncio
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from bs4 import BeautifulSoup
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# WordPress site URL
WORDPRESS_URL = "https://hal.in.ua"
WORDPRESS_API = f"{WORDPRESS_URL}/wp-json/wp/v2"

class WordPressMigrator:
    def __init__(self):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        self.session = requests.Session()
        
    def clean_html(self, html_text):
        """Remove HTML tags and clean text"""
        if not html_text:
            return ""
        soup = BeautifulSoup(html_text, 'html.parser')
        return soup.get_text().strip()
    
    def extract_excerpt(self, content, max_length=200):
        """Extract excerpt from content"""
        text = self.clean_html(content)
        if len(text) > max_length:
            return text[:max_length] + "..."
        return text
    
    async def migrate_blog_posts(self):
        """Migrate WordPress blog posts"""
        print("\n📝 Migrating blog posts...")
        
        try:
            # Get posts from WordPress REST API
            response = self.session.get(f"{WORDPRESS_API}/posts", params={
                "per_page": 100,
                "_embed": True  # Include featured image
            })
            
            if response.status_code != 200:
                print(f"❌ Failed to fetch posts from WordPress: {response.status_code}")
                return
            
            posts = response.json()
            print(f"Found {len(posts)} posts in WordPress")
            
            migrated = 0
            for post in posts:
                # Extract data
                title = post.get('title', {}).get('rendered', '')
                content = post.get('content', {}).get('rendered', '')
                excerpt = post.get('excerpt', {}).get('rendered', '')
                
                if not excerpt:
                    excerpt = self.extract_excerpt(content)
                
                # Get featured image
                image_url = "https://via.placeholder.com/800x400/E0E0E0/666666?text=Blog+Post"
                if '_embedded' in post and 'wp:featuredmedia' in post['_embedded']:
                    featured_media = post['_embedded']['wp:featuredmedia']
                    if featured_media and len(featured_media) > 0:
                        image_url = featured_media[0].get('source_url', image_url)
                
                # Create blog post document
                blog_post = {
                    "titleUk": self.clean_html(title),
                    "titleRu": self.clean_html(title),  # Will need translation
                    "contentUk": self.clean_html(content),
                    "contentRu": self.clean_html(content),  # Will need translation
                    "excerptUk": self.clean_html(excerpt),
                    "excerptRu": self.clean_html(excerpt),  # Will need translation
                    "image": image_url,
                    "author": "HAL Team",
                    "publishedAt": datetime.fromisoformat(post['date'].replace('Z', '+00:00')),
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                
                # Insert into MongoDB
                await self.db.blog_posts.insert_one(blog_post)
                migrated += 1
                print(f"  ✓ Migrated: {blog_post['titleUk'][:50]}...")
            
            print(f"✅ Successfully migrated {migrated} blog posts")
            
        except Exception as e:
            print(f"❌ Error migrating blog posts: {str(e)}")
    
    async def migrate_listings(self):
        """
        Migrate business listings from WordPress
        Note: This assumes listings are stored as custom post type 'listing'
        You may need to adjust based on actual WordPress structure
        """
        print("\n🏢 Migrating business listings...")
        
        try:
            # Try to get custom post type 'listing'
            # Note: WordPress REST API for custom post types might be different
            response = self.session.get(f"{WORDPRESS_URL}/wp-json/wp/v2/listing", params={
                "per_page": 100,
                "_embed": True
            })
            
            if response.status_code == 404:
                print("⚠️  Custom post type 'listing' not found in WordPress API")
                print("You may need to:")
                print("  1. Check the actual custom post type name")
                print("  2. Export listings from WordPress admin panel")
                print("  3. Manually import using CSV or JSON format")
                return
            
            if response.status_code != 200:
                print(f"❌ Failed to fetch listings: {response.status_code}")
                return
            
            listings = response.json()
            print(f"Found {len(listings)} listings in WordPress")
            
            migrated = 0
            for listing in listings:
                # Extract listing data
                # This will depend on how listings are structured in WordPress
                title = listing.get('title', {}).get('rendered', '')
                content = listing.get('content', {}).get('rendered', '')
                
                # Extract custom fields (meta data)
                # You'll need to adjust these based on actual meta field names
                meta = listing.get('meta', {})
                
                # Create company document
                company = {
                    "name": self.clean_html(title),
                    "nameRu": self.clean_html(title),
                    "description": self.extract_excerpt(content, 500),
                    "descriptionRu": self.extract_excerpt(content, 500),
                    "category": "other",  # Default, should be mapped from WordPress
                    "location": {
                        "city": meta.get('city', 'Kyiv'),
                        "address": meta.get('address', '')
                    },
                    "contacts": {
                        "phone": meta.get('phone', ''),
                        "email": meta.get('email', ''),
                        "website": meta.get('website', '')
                    },
                    "image": "https://via.placeholder.com/400x300/E0E0E0/666666?text=Company",
                    "images": [],
                    "rating": 0.0,
                    "reviewCount": 0,
                    "isNew": False,
                    "isActive": True,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                
                # Get featured image
                if '_embedded' in listing and 'wp:featuredmedia' in listing['_embedded']:
                    featured_media = listing['_embedded']['wp:featuredmedia']
                    if featured_media and len(featured_media) > 0:
                        company['image'] = featured_media[0].get('source_url', company['image'])
                
                await self.db.companies.insert_one(company)
                migrated += 1
                print(f"  ✓ Migrated: {company['name'][:50]}...")
            
            print(f"✅ Successfully migrated {migrated} companies")
            
        except Exception as e:
            print(f"❌ Error migrating listings: {str(e)}")
    
    async def scrape_companies_from_site(self):
        """
        Alternative method: Scrape companies from website directly
        Use this if WordPress API doesn't expose the data
        """
        print("\n🌐 Scraping companies from website...")
        
        try:
            # Scrape from main page or search page
            response = self.session.get(f"{WORDPRESS_URL}/?s=")
            
            if response.status_code != 200:
                print(f"❌ Failed to fetch website: {response.status_code}")
                return
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find company listings
            # This selector will need to be adjusted based on actual HTML structure
            listings = soup.find_all('article', class_='listing')
            
            print(f"Found {len(listings)} listings on the page")
            
            # You'll need to implement the parsing logic based on the actual HTML structure
            print("⚠️  Web scraping needs to be customized based on HTML structure")
            
        except Exception as e:
            print(f"❌ Error scraping companies: {str(e)}")
    
    async def run_migration(self):
        """Run full migration"""
        print("=" * 70)
        print("HAL WordPress to MongoDB Migration")
        print("=" * 70)
        
        # Clear existing data (optional - comment out to keep existing data)
        # print("\n🗑️  Clearing existing data...")
        # await self.db.companies.delete_many({})
        # await self.db.blog_posts.delete_many({})
        # print("✓ Data cleared")
        
        # Migrate blog posts
        await self.migrate_blog_posts()
        
        # Migrate listings
        await self.migrate_listings()
        
        # Alternative: scrape from website
        # await self.scrape_companies_from_site()
        
        print("\n" + "=" * 70)
        print("Migration completed!")
        print("=" * 70)
        print("\n📊 Database statistics:")
        companies_count = await self.db.companies.count_documents({})
        blog_count = await self.db.blog_posts.count_documents({})
        print(f"  Companies: {companies_count}")
        print(f"  Blog posts: {blog_count}")
        
        self.client.close()

async def main():
    migrator = WordPressMigrator()
    await migrator.run_migration()

if __name__ == "__main__":
    asyncio.run(main())
