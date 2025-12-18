# -*- coding: utf-8 -*-
# ملاحظة: تم إصلاح عملية الاستخراج (الفلترة) باستخدام مُحددات مستقرة (data-testid) 
# وتم تغيير الإخراج ليكون بيانات JSON نظيفة بدلاً من HTML الخام.
# تم إصلاح جلب محتوى Pinterest لاستخدام Selenium للحصول على المحتوى الديناميكي.

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By 
import requests
import time
import sys
import urllib.parse 
import random 
from bs4 import BeautifulSoup 
import re 
import json 

# ------------------------------------------------------------------
#  دوال المساعدة لجلب HTML
# ------------------------------------------------------------------

def get_html_with_selenium(url):
    """يستخدم Selenium لجلب HTML بعد تنفيذ JavaScript (مناسب لـ Redbubble و Pinterest)."""
    driver = None
    try:
        # إعدادات Chrome (Headless)
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # وكيل مستخدم حديث وعشوائي
        user_agent = f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{random.randint(120, 126)}.0.0.0 Safari/537.36"
        chrome_options.add_argument(f"user-agent={user_agent}")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")

        # استخدام ChromeDriverManager لضمان التوافق
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print(f"INFO: Fetching with Selenium for URL: {url}", file=sys.stderr)
        driver.get(url)
        
        # تحسين: استخدام الانتظار الصريح لضمان تحميل الصفحة (قد يتطلب الانتظار لظهور شبكة البينز لـ Pinterest)
        try:
            # الانتظار حتى يظهر وسم H1 (مناسب لـ Redbubble) أو انتظار عنصر من شبكة البينز (مناسب لـ Pinterest)
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'div[data-grid-item="true"]'))
            )
            # انتظار عشوائي إضافي للتأكد من تحميل كافة العناصر الديناميكية
            time.sleep(random.uniform(2, 4)) 
            
        except Exception:
            print("WARNING: Timeout waiting for page elements to load. Continuing...", file=sys.stderr)
            
        html_content = driver.page_source
        return html_content
    except Exception as e:
        print(f"ERROR: Selenium failed for {url}. Reason: {e}", file=sys.stderr)
        return None
    finally:
        if driver:
            driver.quit()

def get_html_with_requests(url, params=None):
    """يستخدم Requests لجلب HTML (مناسب لـ Teepublic فقط)."""
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
        print(f"INFO: Fetching with Requests for URL: {url}", file=sys.stderr)
        time.sleep(random.uniform(0.5, 2))
        response = requests.get(url, params=params, headers=headers, timeout=20)
        if response.status_code == 200:
            response.encoding = response.apparent_encoding 
            return response.text
        else:
            print(f"WARNING: Requests failed. Status code: {response.status_code}. URL: {response.url}", file=sys.stderr)
            return None
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Requests exception occurred: {e}", file=sys.stderr)
        return None

# ------------------------------------------------------------------
#  دوال الاستخراج المُصلحة (التي تقوم بالفلترة)
# ------------------------------------------------------------------

def extract_products_from_html(html_content, site_name):
    """
    يستخرج عناوين ورابط صور المنتجات من HTML باستخدام مُحددات مستقرة.
    """
    if not html_content:
        return []

    # استخدام 'html.parser' كخيار احتياطي إذا كان lxml غير متاح أو تسبب في مشاكل
    soup = BeautifulSoup(html_content, 'html.parser') 
    products_data = []
    
    if site_name == 'redbubble':
        # استخدام data-testid للحصول على بطاقات المنتج
        product_cards = soup.find_all('div', {'data-testid': 'search-result-card'})
        
        for card in product_cards:
            title = "No Title Found (RB)"
            image_url = "No Image Found (RB)"
            
            # استخراج العنوان باستخدام التعبير العادي لتجاوز الكلاسات المولدة
            title_tag = card.find('span', class_=re.compile(r'SearchResultCard_title__\w+'))
            if title_tag:
                title = title_tag.get_text(strip=True)
                
            # استخراج رابط الصورة من وسم <img>
            image_tag = card.find('img')
            if image_tag and 'src' in image_tag.attrs:
                image_url = image_tag['src']
                
            products_data.append({
                'title': title,
                'image_url': image_url,
                'site': 'Redbubble'
            })
            
    elif site_name == 'teepublic':
        # المحددات الحالية لـ Teepublic
        product_cards = soup.find_all('div', class_='tile-design')
        
        for card in product_cards:
            title = "No Title Found (TP)"
            image_url = "No Image Found (TP)"
            
            title_tag = card.find('h3', class_='tile-title')
            if title_tag:
                title = title_tag.get_text(strip=True)
            
            image_tag = card.find('img', class_='product-image')
            if image_tag and 'src' in image_tag.attrs:
                image_url = image_tag['src']
                
            products_data.append({
                'title': title,
                'image_url': image_url,
                'site': 'Teepublic'
            })
            
    elif site_name == 'pinterest':
        # محددات Pinterest: يستهدف وسم <img> داخل بطاقات التصميم
        # يجب أن تعمل الآن بعد استخدام Selenium
        
        # 💥 ملاحظة: قد تحتاج إلى تعديل المحددات أدناه إذا لم تنجح
        pin_cards = soup.find_all('div', {'data-grid-item': 'true'})
        
        for card in pin_cards:
            title = "No Title Found (Pinterest)"
            image_url = "No Image Found (Pinterest)"
            
            # محاولة استخراج العنوان من وسم <a>
            title_tag = card.find('h3') # العنوان عادة يكون في وسم H3 
            if title_tag:
                title = title_tag.get_text(strip=True)
                
            # استخراج رابط الصورة من وسم <img> (غالباً ما يستخدم src)
            image_tag = card.find('img') 
            if image_tag and 'src' in image_tag.attrs:
                # محاولة الحصول على صورة ذات جودة أفضل إذا كانت متاحة في data-src أو src
                image_url = image_tag.get('data-src', image_tag['src'])
                
            # فلترة النتائج غير مكتملة البيانات
            if title != "No Title Found (Pinterest)" and image_url != "No Image Found (Pinterest)":
                 products_data.append({
                    'title': title,
                    'image_url': image_url,
                    'site': 'Pinterest'
                })
            
    return products_data

# ------------------------------------------------------------------
#  الدالة الرئيسية (fetch_html_and_extract_data)
# ------------------------------------------------------------------

def fetch_html_and_extract_data(input_name, start_page, end_page, site_name):
    site_name = site_name.lower()
    all_extracted_products = [] 
    
    # إعداد الإخراج القياسي (stdout) لاستخدام ترميز UTF-8
    try:
        if sys.stdout.encoding.lower() != 'utf-8':
            sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass 
    
    if site_name not in ['redbubble', 'teepublic', 'pinterest']:
        print(f"Error: Unsupported site name '{site_name}'. Must be 'teepublic', 'redbubble' or 'pinterest'.", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------
    # 💥 حالة Redbubble و Teepublic (متعدد الصفحات)
    # ------------------------------------------------
    if site_name in ['redbubble', 'teepublic']:
        
        print(f"Starting to fetch and extract data for '{input_name}' from {site_name} (Pages {start_page} to {end_page})...", file=sys.stderr)
        
        for page_number in range(start_page, end_page + 1):
            html_content = None
            
            # 1. بناء الرابط وجلب المحتوى
            if site_name == 'redbubble':
                encoded_query = urllib.parse.quote_plus(input_name)
                url_to_fetch = f"https://www.redbubble.com/fr/shop/{encoded_query}"
                params = {
                    'country': 'TN',
                    'iaCode': 'all-stickers',
                    'locale': 'fr',
                    'page': page_number,
                    'pageSize': '82',
                    'sortOrder': 'relevant',
                    'ref': 'search_box',
                    'stickerFinish': 'stickerFinish-matte',
                }
                full_url = url_to_fetch + '?' + urllib.parse.urlencode(params)
                html_content = get_html_with_selenium(full_url)
                
            elif site_name == 'teepublic':
                url_to_fetch = "https://www.teepublic.com/stickers"
                params = {
                    'canvas_subclass': 'sticker',
                    'sort': 'popular',
                    'page': page_number,
                    'query': input_name
                }
                # استخدام Requests لـ Teepublic
                html_content = get_html_with_requests(url_to_fetch, params)
            
            # 2. الاستخراج الفوري (الفلترة)
            if html_content:
                products_on_page = extract_products_from_html(html_content, site_name)
                all_extracted_products.extend(products_on_page)
                print(f"Successfully extracted {len(products_on_page)} products from page {page_number}.", file=sys.stderr)
            else:
                print(f"Failed to fetch content for page {page_number}. Skipping extraction.", file=sys.stderr)
            
            # انتظار عشوائي بين الطلبات لتجنب الحظر
            time.sleep(random.uniform(2, 5)) 

    # ------------------------------------------------
    # 💥 حالة Pinterest (رابط مُباشر، صفحة واحدة) - تم إصلاحها لاستخدام Selenium
    # ------------------------------------------------
    elif site_name == 'pinterest':
        # input_name هو الرابط المُباشر (URL)
        pinterest_url = input_name
        print(f"Starting to fetch and extract data for Pinterest URL: {pinterest_url} (Single Page using Selenium)...", file=sys.stderr)
        
        # 💥 استخدام Selenium لضمان تنفيذ JavaScript
        html_content = get_html_with_selenium(pinterest_url)
        
        if html_content:
            products_on_page = extract_products_from_html(html_content, site_name)
            all_extracted_products.extend(products_on_page)
            print(f"Successfully extracted {len(products_on_page)} pins from Pinterest URL.", file=sys.stderr)
        else:
            print(f"Failed to fetch content for Pinterest URL. Skipping extraction.", file=sys.stderr)
        

    # 3. طباعة النتائج النهائية إلى stdout ككائن JSON
    print("--- Extracted Clean Data (JSON) ---", file=sys.stderr)
    # استخدام ensure_ascii=False لدعم الترميز العربي/العالمي بشكل صحيح
    print(json.dumps(all_extracted_products, ensure_ascii=False))
    print(f"\nTotal extracted results: {len(all_extracted_products)}", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python scraper_script.py <search_query_or_url> <start_page> <end_page> <site_name>", file=sys.stderr)
        print("Note: For 'pinterest', <start_page> and <end_page> are ignored (use 1 1 as placeholders).", file=sys.stderr)
        sys.exit(1)
        
    input_value = sys.argv[1] # يمكن أن يكون كلمة بحث أو رابط
    
    try:
        start_page = int(sys.argv[2])
        end_page = int(sys.argv[3])
    except ValueError:
        # السماح ببدء/نهاية وهمية 1 لـ Pinterest
        if sys.argv[4].lower() != 'pinterest':
            print("Error: Page numbers must be integers.", file=sys.stderr)
            sys.exit(1)
        start_page = 1
        end_page = 1
        
    site_name = sys.argv[4]

    fetch_html_and_extract_data(input_value, start_page, end_page, site_name)