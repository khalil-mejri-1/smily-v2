# -*- coding: utf-8 -*-
# ^^^ يجب إضافة هذا السطر لتجنب أخطاء الترميز (SyntaxError) عند وجود نصوص عربية أو عالمية.

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import requests
import time
import sys
import urllib.parse 
import random # لإضافة عشوائية على User-Agent و فترة الانتظار

# ------------------------------------------------------------------
#  دوال المساعدة لجلب HTML (Selenium لـ Redbubble، Requests لـ Teepublic)
# ------------------------------------------------------------------

def get_html_with_selenium(url):
    """يستخدم Selenium لجلب HTML بعد تنفيذ JavaScript (مناسب لـ Redbubble)."""
    driver = None
    try:
        # إعدادات Chrome (Headless)
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        # وكيل مستخدم حديث
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")

        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print(f"INFO: Fetching with Selenium for URL: {url}", file=sys.stderr)
        driver.get(url)
        
        # الانتظار العشوائي (2-6 ثوانٍ) لضمان تحميل الصفحة بالكامل ومحاكاة الإنسان
        time.sleep(random.uniform(2, 6)) 
        
        html_content = driver.page_source
        return html_content
    except Exception as e:
        print(f"ERROR: Selenium failed for {url}. Reason: {e}", file=sys.stderr)
        return None
    finally:
        if driver:
            driver.quit()

def get_html_with_requests(url, params):
    """يستخدم Requests لجلب HTML (مناسب لـ Teepublic أو أي موقع لا يحتاج JS)."""
    # وكيل مستخدم عشوائي أكثر لـ Requests
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0'
    ]
    
    headers = {
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        'Connection': 'keep-alive',
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 200:
            # استخدام الترميز المستنتج لضمان قراءة المحتوى بشكل صحيح
            response.encoding = response.apparent_encoding 
            return response.text
        else:
            print(f"WARNING: Requests failed. Status code: {response.status_code}. URL: {response.url}", file=sys.stderr)
            return None
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Requests exception occurred: {e}", file=sys.stderr)
        return None

# ------------------------------------------------------------------
#  الدالة الرئيسية التي تستدعي الدالة المناسبة
# ------------------------------------------------------------------

def fetch_html_for_site(input_name, start_page, end_page, site_name):
    site_name = site_name.lower()
    all_html_content = ""
    
    # 💥 الحل 2: إعداد الإخراج القياسي (stdout) لاستخدام ترميز UTF-8
    # هذا يحل مشكلة UnicodeEncodeError عند طباعة المحتوى
    try:
        if sys.stdout.encoding.lower() != 'utf-8':
             sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # تجاوز في حال عدم دعم reconfigure في إصدار بايثون قديم
        pass 
    
    if site_name not in ['redbubble', 'teepublic']:
        print(f"Error: Unsupported site name '{site_name}'. Must be 'teepublic' or 'redbubble'.", file=sys.stderr)
        sys.exit(1)

    print(f"Starting to fetch HTML for '{input_name}' from {site_name} (Pages {start_page} to {end_page})...", file=sys.stderr)
    
    for page_number in range(start_page, end_page + 1):
        html_content = None
        
        # 1. بناء الرابط لكل موقع
        if site_name == 'redbubble':
            encoded_query = urllib.parse.quote_plus(input_name)
            # Redbubble URL Structure (Page number is a query param)
            url_to_fetch = f"https://www.redbubble.com/fr/shop/{encoded_query}"
            params = {
                'country': 'TN',
                'iaCode': 'all-stickers',
                'locale': 'fr',
                'pageSize': '82',
                'sortOrder': 'trending',
                'stickerFinish': 'stickerFinish-matte',
                'page': page_number 
            }
            
            # جلب المحتوى باستخدام Selenium
            # نحتاج إلى تمرير الباراميترات في الرابط لأن Selenium يتعامل مع الرابط النهائي
            full_url = url_to_fetch + '?' + urllib.parse.urlencode(params)
            html_content = get_html_with_selenium(full_url)
            
        elif site_name == 'teepublic':
            # Teepublic URL Structure (Page number and query are query params)
            url_to_fetch = "https://www.teepublic.com/stickers"
            params = {
                'canvas_subclass': 'sticker',
                'sort': 'popular',
                'page': page_number,
                'query': input_name
            }
            
            # جلب المحتوى باستخدام Requests
            html_content = get_html_with_requests(url_to_fetch, params)
        
        # 2. تجميع النتائج
        if html_content:
            all_html_content += f"--- HTML Content for Page {page_number} from {site_name} ---\n"
            all_html_content += html_content
            all_html_content += "\n\n"
            print(f"Successfully fetched HTML for page {page_number} from {site_name}.", file=sys.stderr)
        else:
            print(f"Failed to fetch content for page {page_number} from {site_name}. Skipping.", file=sys.stderr)
        
        # انتظار عشوائي بين الطلبات لتجنب الحظر
        time.sleep(random.uniform(1, 4)) 

    # طباعة المحتوى الكامل إلى stdout ليتم التقاطه بواسطة Node.js
    print(all_html_content)

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python scraper_script.py <search_query> <start_page> <end_page> <site_name>", file=sys.stderr)
        sys.exit(1)
        
    search_query = sys.argv[1]
    
    try:
        start_page = int(sys.argv[2])
        end_page = int(sys.argv[3])
    except ValueError:
        print("Error: Page numbers must be integers.", file=sys.stderr)
        sys.exit(1)
        
    site_name = sys.argv[4]

    fetch_html_for_site(search_query, start_page, end_page, site_name)