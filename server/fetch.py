import requests
from bs4 import BeautifulSoup
import time
import sys # استيراد مكتبة sys

def fetch_and_save_html(input_name, start_page, end_page):
    # لا حاجة لاسم الملف هنا، سنرجع المحتوى مباشرة
    base_url = "https://www.teepublic.com/stickers"
    all_html_content = "" # متغير لتخزين كل المحتوى
    
    print(f"Starting to fetch HTML for '{input_name}'...")
    for page_number in range(int(start_page), int(end_page) + 1):
        params = {
            'canvas_subclass': 'sticker',
            'page': page_number,
            'query': input_name,
            'sort': 'popular'
        }
        
        try:
            response = requests.get(base_url, params=params)
            
            if response.status_code == 200:
                html_content = response.text
                all_html_content += f"--- HTML Content for Page {page_number} ---\n"
                all_html_content += html_content
                all_html_content += "\n\n"
                print(f"Successfully fetched HTML for page {page_number}.", file=sys.stderr) # إرسال هذه الرسالة إلى stderr
            else:
                print(f"Failed to retrieve page {page_number}. Status code: {response.status_code}", file=sys.stderr)
            
        except requests.exceptions.RequestException as e:
            print(f"An error occurred while fetching page {page_number}: {e}", file=sys.stderr)
            
        time.sleep(2)
        
    # طباعة المحتوى الكامل إلى stdout ليتم التقاطه بواسطة Node.js
    print(all_html_content)

if __name__ == "__main__":
    # استقبال المعطيات من سطر الأوامر
    if len(sys.argv) < 4:
        print("الرجاء إدخال: اسم_البحث, صفحة_البداية, صفحة_النهاية", file=sys.stderr)
        sys.exit(1)
        
    search_query = sys.argv[1]
    start_page = int(sys.argv[2])
    end_page = int(sys.argv[3])

    fetch_and_save_html(search_query, start_page, end_page)