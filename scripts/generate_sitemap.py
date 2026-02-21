
import os
import mysql.connector
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = "https://flagiumai.com"
OUTPUT_FILE = os.path.join(os.getcwd(), "ui", "public", "sitemap.xml")

STATIC_ROUTES = [
    "/",
    "/methodology",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/companies",
    "/flags",
    "/market-monitor",
]

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "flagium_user"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME", "flagium")
        )
        return connection
    except Exception as e:
        print(f"❌ DB Connection Error: {e}")
        return None

def generate_sitemap():
    print("🚀 Generating Sitemap...")
    
    urls = []
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Add static routes
    for route in STATIC_ROUTES:
        urls.append({
            "loc": f"{BASE_URL}{route}",
            "lastmod": today,
            "changefreq": "daily",
            "priority": "1.0" if route == "/" else "0.8"
        })
    
    # 2. Add dynamic company routes
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT ticker FROM companies")
            companies = cursor.fetchall()
            print(f"📦 Found {len(companies)} companies in DB.")
            
            for company in companies:
                ticker = company["ticker"]
                urls.append({
                    "loc": f"{BASE_URL}/company/{ticker}",
                    "lastmod": today,
                    "changefreq": "weekly",
                    "priority": "0.6"
                })
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"❌ Error fetching companies: {e}")
    else:
        print("⚠️ Skipping dynamic routes due to DB error.")

    # 3. Write XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in urls:
        # Escape ampersands and other special chars in URLs
        loc = url["loc"].replace("&", "&amp;")
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{loc}</loc>\n'
        xml_content += f'    <lastmod>{url["lastmod"]}</lastmod>\n'
        xml_content += f'    <changefreq>{url["changefreq"]}</changefreq>\n'
        xml_content += f'    <priority>{url["priority"]}</priority>\n'
        xml_content += '  </url>\n'
        
    xml_content += '</urlset>'
    
    with open(OUTPUT_FILE, "w") as f:
        f.write(xml_content)
    
    print(f"✅ Sitemap generated at: {OUTPUT_FILE}")
    print(f"📄 Total URLs: {len(urls)}")

if __name__ == "__main__":
    generate_sitemap()
