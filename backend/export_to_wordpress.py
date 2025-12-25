"""
Экспорт данных из MongoDB HAL в форматы для WordPress
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import csv
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

class WordPressExporter:
    def __init__(self):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        self.export_dir = Path('wordpress_export')
        self.export_dir.mkdir(exist_ok=True)
    
    async def export_companies_to_csv(self):
        """Экспорт компаний в CSV для импорта через WP All Import"""
        print("\n📦 Экспорт компаний в CSV...")
        
        companies = await self.db.companies.find().to_list(length=None)
        
        csv_file = self.export_dir / 'companies_for_wordpress.csv'
        
        with open(csv_file, 'w', encoding='utf-8', newline='') as file:
            fieldnames = [
                'post_title',           # Название компании (UA)
                'post_title_ru',        # Название компании (RU)
                'post_content',         # Описание (UA)
                'post_content_ru',      # Описание (RU)
                'post_status',          # published / draft
                'post_type',            # custom post type (listing)
                'category',             # Категория
                'phone',                # Телефон
                'email',                # Email
                'website',              # Веб-сайт
                'city',                 # Город
                'address',              # Адрес
                'image_url',            # URL изображения
                'rating',               # Рейтинг
                'review_count'          # Количество отзывов
            ]
            
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            
            for company in companies:
                row = {
                    'post_title': company.get('name', ''),
                    'post_title_ru': company.get('nameRu', ''),
                    'post_content': company.get('description', ''),
                    'post_content_ru': company.get('descriptionRu', ''),
                    'post_status': 'publish' if company.get('isActive') else 'draft',
                    'post_type': 'listing',  # Ваш custom post type в WordPress
                    'category': company.get('category', ''),
                    'phone': company.get('contacts', {}).get('phone', ''),
                    'email': company.get('contacts', {}).get('email', ''),
                    'website': company.get('contacts', {}).get('website', ''),
                    'city': company.get('location', {}).get('city', ''),
                    'address': company.get('location', {}).get('address', ''),
                    'image_url': company.get('image', ''),
                    'rating': company.get('rating', 0),
                    'review_count': company.get('reviewCount', 0)
                }
                writer.writerow(row)
        
        print(f"✅ Экспортировано {len(companies)} компаний в {csv_file}")
        return csv_file
    
    async def export_blog_posts_to_csv(self):
        """Экспорт статей блога в CSV"""
        print("\n📝 Экспорт статей блога в CSV...")
        
        posts = await self.db.blog_posts.find().to_list(length=None)
        
        csv_file = self.export_dir / 'blog_posts_for_wordpress.csv'
        
        with open(csv_file, 'w', encoding='utf-8', newline='') as file:
            fieldnames = [
                'post_title',           # Заголовок (UA)
                'post_title_ru',        # Заголовок (RU)
                'post_content',         # Содержание (UA)
                'post_content_ru',      # Содержание (RU)
                'post_excerpt',         # Отрывок (UA)
                'post_excerpt_ru',      # Отрывок (RU)
                'post_status',          # published
                'post_type',            # post
                'post_date',            # Дата публикации
                'post_author',          # Автор
                'featured_image'        # URL изображения
            ]
            
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            
            for post in posts:
                row = {
                    'post_title': post.get('titleUk', ''),
                    'post_title_ru': post.get('titleRu', ''),
                    'post_content': post.get('contentUk', ''),
                    'post_content_ru': post.get('contentRu', ''),
                    'post_excerpt': post.get('excerptUk', ''),
                    'post_excerpt_ru': post.get('excerptRu', ''),
                    'post_status': 'publish',
                    'post_type': 'post',
                    'post_date': post.get('publishedAt', datetime.utcnow()).strftime('%Y-%m-%d %H:%M:%S'),
                    'post_author': post.get('author', 'HAL Team'),
                    'featured_image': post.get('image', '')
                }
                writer.writerow(row)
        
        print(f"✅ Экспортировано {len(posts)} статей в {csv_file}")
        return csv_file
    
    async def export_to_wordpress_xml(self):
        """Экспорт в WordPress XML формат (WXR)"""
        print("\n📄 Экспорт в WordPress XML...")
        
        companies = await self.db.companies.find().to_list(length=None)
        posts = await self.db.blog_posts.find().to_list(length=None)
        
        xml_file = self.export_dir / 'hal_wordpress_export.xml'
        
        with open(xml_file, 'w', encoding='utf-8') as f:
            # WordPress XML Header
            f.write('<?xml version="1.0" encoding="UTF-8" ?>\n')
            f.write('<rss version="2.0"\n')
            f.write('    xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"\n')
            f.write('    xmlns:content="http://purl.org/rss/1.0/modules/content/"\n')
            f.write('    xmlns:wfw="http://wellformedweb.org/CommentAPI/"\n')
            f.write('    xmlns:dc="http://purl.org/dc/elements/1.1/"\n')
            f.write('    xmlns:wp="http://wordpress.org/export/1.2/">\n\n')
            
            f.write('<channel>\n')
            f.write('    <title>HAL Platform Export</title>\n')
            f.write('    <link>https://hal.in.ua</link>\n')
            f.write('    <description>Export from HAL MongoDB</description>\n')
            f.write('    <language>uk</language>\n')
            f.write(f'    <wp:wxr_version>1.2</wp:wxr_version>\n\n')
            
            # Export blog posts
            for post in posts:
                f.write('    <item>\n')
                f.write(f'        <title><![CDATA[{post.get("titleUk", "")}]]></title>\n')
                f.write(f'        <link>https://hal.in.ua/blog/{post.get("_id")}</link>\n')
                f.write(f'        <pubDate>{post.get("publishedAt", datetime.utcnow()).strftime("%a, %d %b %Y %H:%M:%S +0000")}</pubDate>\n')
                f.write(f'        <dc:creator><![CDATA[{post.get("author", "admin")}]]></dc:creator>\n')
                f.write('        <content:encoded><![CDATA[{0}]]></content:encoded>\n'.format(post.get('contentUk', '')))
                f.write('        <excerpt:encoded><![CDATA[{0}]]></excerpt:encoded>\n'.format(post.get('excerptUk', '')))
                f.write('        <wp:post_type><![CDATA[post]]></wp:post_type>\n')
                f.write('        <wp:status><![CDATA[publish]]></wp:status>\n')
                f.write('    </item>\n\n')
            
            # Export companies
            for company in companies:
                f.write('    <item>\n')
                f.write(f'        <title><![CDATA[{company.get("name", "")}]]></title>\n')
                f.write(f'        <link>https://hal.in.ua/company/{company.get("_id")}</link>\n')
                f.write('        <content:encoded><![CDATA[{0}]]></content:encoded>\n'.format(company.get('description', '')))
                f.write('        <wp:post_type><![CDATA[listing]]></wp:post_type>\n')
                f.write('        <wp:status><![CDATA[{0}]]></wp:status>\n'.format('publish' if company.get('isActive') else 'draft'))
                
                # Meta fields
                f.write('        <wp:postmeta>\n')
                f.write('            <wp:meta_key><![CDATA[_listing_phone]]></wp:meta_key>\n')
                f.write('            <wp:meta_value><![CDATA[{0}]]></wp:meta_value>\n'.format(company.get('contacts', {}).get('phone', '')))
                f.write('        </wp:postmeta>\n')
                
                f.write('        <wp:postmeta>\n')
                f.write('            <wp:meta_key><![CDATA[_listing_email]]></wp:meta_key>\n')
                f.write('            <wp:meta_value><![CDATA[{0}]]></wp:meta_value>\n'.format(company.get('contacts', {}).get('email', '')))
                f.write('        </wp:postmeta>\n')
                
                f.write('        <wp:postmeta>\n')
                f.write('            <wp:meta_key><![CDATA[_listing_category]]></wp:meta_key>\n')
                f.write('            <wp:meta_value><![CDATA[{0}]]></wp:meta_value>\n'.format(company.get('category', '')))
                f.write('        </wp:postmeta>\n')
                
                f.write('    </item>\n\n')
            
            f.write('</channel>\n')
            f.write('</rss>\n')
        
        print(f"✅ Экспортировано в XML: {xml_file}")
        return xml_file
    
    async def export_to_json(self):
        """Экспорт в простой JSON формат"""
        print("\n🔧 Экспорт в JSON...")
        
        companies = await self.db.companies.find().to_list(length=None)
        posts = await self.db.blog_posts.find().to_list(length=None)
        
        # Convert ObjectId to string
        for company in companies:
            company['_id'] = str(company['_id'])
            if 'userId' in company:
                company['userId'] = str(company['userId'])
        
        for post in posts:
            post['_id'] = str(post['_id'])
        
        # Save companies
        companies_file = self.export_dir / 'companies.json'
        with open(companies_file, 'w', encoding='utf-8') as f:
            json.dump(companies, f, ensure_ascii=False, indent=2, default=str)
        print(f"✅ Компании: {companies_file}")
        
        # Save blog posts
        posts_file = self.export_dir / 'blog_posts.json'
        with open(posts_file, 'w', encoding='utf-8') as f:
            json.dump(posts, f, ensure_ascii=False, indent=2, default=str)
        print(f"✅ Статьи блога: {posts_file}")
    
    async def run_export(self):
        """Запуск всех экспортов"""
        print("=" * 70)
        print("HAL MongoDB → WordPress Export")
        print("=" * 70)
        
        await self.export_companies_to_csv()
        await self.export_blog_posts_to_csv()
        await self.export_to_wordpress_xml()
        await self.export_to_json()
        
        print("\n" + "=" * 70)
        print("✅ Экспорт завершен!")
        print("=" * 70)
        print(f"\nФайлы сохранены в директории: {self.export_dir.absolute()}")
        print("\nСледующие шаги:")
        print("1. Загрузите CSV файлы через плагин WP All Import в WordPress")
        print("2. Или импортируйте XML через WordPress Admin → Tools → Import")
        print("3. JSON файлы можно использовать для custom импорта")
        
        self.client.close()

async def main():
    exporter = WordPressExporter()
    await exporter.run_export()

if __name__ == "__main__":
    asyncio.run(main())
